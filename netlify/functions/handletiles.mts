import type { Handler } from "@netlify/functions";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import {
  generateSolvedBoard,
  MINE_TILE,
  returnTile,
  didGameEnd,
} from "../lib/board";
import cookie from "cookie";

const cache: Map<
  string,
  {
    client_board: Array<Array<number>>;
    server_board: Array<Array<number>>;
    number_of_revealed_tiles: number;
    players: Map<string, User>;
    mine_ratio: number;
    rows_columns: number;
  }
> = new Map();

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

  let room = cache.get(roomId);
  let user = room?.players.get(Session);
  let headers: any;

  if (!Session || !user) {
    const { data: userData, error } = await supabase.auth.getUser(accessToken);

    if (error || !userData.user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid token" }),
      };
    }

    Session = uuidv4();
    room?.players.set(Session, userData.user);
    headers = {
      "Set-Cookie": cookie.serialize("Session", Session, {
        httpOnly: true,
        secure: true,
        path: "/",
      }),
    };

    user = userData.user;
  }

  if (!room) {
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

      await supabase.from("serverboard").insert({
        room_id: roomId,
        server_board,
      });
    }

    room = {
      client_board,
      server_board,
      number_of_revealed_tiles: data.revealed_tiles,
      players: new Map(),
      rows_columns: data.rows_columns,
      mine_ratio: data.mine_ratio,
    };

    cache.set(roomId, room);
  }

  const return_tile = returnTile(room.server_board, room.client_board, x, y);
  const increment_by = "x" in return_tile ? 1 : return_tile.size;

  const won = didGameEnd(
    room.client_board,
    room.number_of_revealed_tiles + increment_by,
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
      revealed_tiles: room.number_of_revealed_tiles + increment_by,
      tile:
        "x" in return_tile
          ? JSON.stringify(return_tile)
          : JSON.stringify(Object.fromEntries(return_tile)),
    }),
  }).catch((error) => console.error("Failed to send update request:", error));

  cache.set(roomId, {
    server_board: room.server_board,
    client_board: room.client_board,
    number_of_revealed_tiles: room.number_of_revealed_tiles + increment_by,
    players: room.players,
    mine_ratio: room.mine_ratio,
    rows_columns: room.rows_columns,
  });

  if (won || ("x" in return_tile && return_tile.state === MINE_TILE)) {
    const channel = supabase.channel(`room:${roomId}`);
    console.log("Game over!");

    const { data } = await supabase
      .from("room_players")
      .select("nickname")
      .eq("user_id", user?.id)
      .single();

    fetch(`${baseUrl}/.netlify/functions/cleanupRoom`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomId,
      }),
    }).catch((error) => console.error("Failed to send update request:", error));
    cache.delete(roomId);

    await channel.send({
      type: "broadcast",
      event: "gameOver",
      payload: {
        won: return_tile["state"] === MINE_TILE ? false : won,
        player: data?.nickname,
        board: room.server_board,
      },
    });

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
