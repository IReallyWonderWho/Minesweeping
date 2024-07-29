import type { Handler } from "@netlify/functions";
import { SupabaseClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import {
  generateSolvedBoard,
  MINE_TILE,
  returnTile,
  didGameEnd,
} from "../lib/board";
import { Redis } from "@upstash/redis";
import cookie from "cookie";

interface Room {
  client_board: Array<Array<number>>;
  server_board: Array<Array<number>>;
  revealed_tiles: number;
  players: Map<string, string>;
  rows_columns: number;
  mine_ratio: number;
}

const redis = new Redis({
  url: "https://healthy-garfish-58064.upstash.io",
  token: process.env.UPSTASH_PRIVATE_API_KEY ?? "",
});

const supabase = new SupabaseClient(
  process.env.PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_PRIVATE_API_KEY ?? "",
);

export const handler: Handler = async (event) => {
  const body = JSON.parse(event.body ?? "");
  const accessToken = event.headers.authorization?.split("Bearer ")[1];

  let { Session } = cookie.parse(event.headers.cookie ?? "");

  const { x, y, roomId } = body;

  if (
    x === undefined ||
    y === undefined ||
    roomId === undefined ||
    !accessToken
  )
    return {
      statusCode: 400,
    };

  let room = (await redis.get(roomId)) as Room | undefined;
  let user: string | undefined = room?.players[Session];
  let headers: any;

  if (!Session || !user) {
    const { data: userData, error } = await supabase.auth.getUser(accessToken);

    if (error || !userData.user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid token" }),
      };
    }

    if (room) {
      Session = uuidv4();
      room.players[Session] = userData.user.id;
      headers = {
        "Set-Cookie": cookie.serialize("Session", Session, {
          httpOnly: true,
          secure: true,
          path: "/",
        }),
      };
    }

    user = userData.user.id;
  }

  if (!room) {
    console.log("getting info from the slow supabase :(");
    const [{ data, error }, { data: serverData }] = await Promise.all([
      supabase
        .from("rooms")
        .select(
          "client_board, revealed_tiles, rows_columns, mine_ratio, started",
        )
        .eq("id", roomId)
        .single(),
      supabase
        .from("serverboard")
        .select("server_board")
        .eq("room_id", roomId)
        .single(),
    ]);

    if (error) return { statusCode: 500 };
    if (!data.started) return { statusCode: 404 };

    let client_board = data.client_board;
    let server_board = serverData?.server_board;

    if (!client_board || !server_board) {
      const [server, client] = generateSolvedBoard(
        data.rows_columns,
        x,
        y,
        data.mine_ratio,
      );

      client_board = client;
      server_board = server;

      await supabase.from("serverboard").upsert({
        room_id: roomId,
        server_board,
      });
    }

    room = {
      client_board,
      server_board,
      revealed_tiles: data.revealed_tiles,
      players: new Map(),
      rows_columns: data.rows_columns,
      mine_ratio: data.mine_ratio,
    };
  }

  const return_tile = returnTile(room.server_board, room.client_board, x, y);
  const increment_by = "x" in return_tile ? 1 : return_tile.size;

  const won = didGameEnd(
    room.client_board,
    room.revealed_tiles + increment_by,
    room.mine_ratio,
  );
  const baseUrl = process.env.URL || "http://localhost:8888";

  // Instead of updating directly, call another serverless function
  fetch(`${baseUrl}/.netlify/functions/updateRoom`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roomId,
      client_board: room.client_board,
      revealed_tiles: room.revealed_tiles + increment_by,
      tile:
        "x" in return_tile
          ? JSON.stringify(return_tile)
          : JSON.stringify(Object.fromEntries(return_tile)),
      server_board: room.server_board,
      players: room.players,
      mine_ratio: room.mine_ratio,
      rows_columns: room.rows_columns,
    }),
  }).catch((error) => console.error("Failed to send update request:", error));

  if (won || ("x" in return_tile && return_tile.state === MINE_TILE)) {
    const channel = supabase.channel(`room:${roomId}`);
    console.log("Game over!");

    const { data } = await supabase
      .from("room_players")
      .select("nickname")
      .eq("user_id", user)
      .single();

    redis.del(roomId);

    await Promise.all([
      supabase.from("rooms").update({
        client_board: null,
        revealed_tiles: 0,
        flags: {},
        started: false,
      }),
      supabase.from("serverboard").delete().eq("room_id", roomId),
      channel.send({
        type: "broadcast",
        event: "gameOver",
        payload: {
          won: return_tile["state"] === MINE_TILE ? false : won,
          player: data?.nickname,
          board: room.server_board,
        },
      }),
    ]);

    await supabase.removeChannel(channel);
  }

  return {
    body:
      "x" in return_tile
        ? JSON.stringify(return_tile)
        : JSON.stringify(Object.fromEntries(return_tile)),
    statusCode: 200,
    headers,
  };
};
