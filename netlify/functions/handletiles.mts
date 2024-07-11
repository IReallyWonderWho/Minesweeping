import type { Handler } from "@netlify/functions";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateSolvedBoard, returnTile } from "../lib/board";

const cache: Map<
  string,
  {
    client_board: Array<Array<number>>;
    server_board: Array<Array<number>>;
    number_of_revealed_tiles: number;
  }
> = new Map();

const supabase = new SupabaseClient(
  process.env.PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_PRIVATE_API_KEY ?? "",
);

export const handler: Handler = async (event, context) => {
  const body = JSON.parse(event.body ?? "");

  const { x, y, roomId } = body;

  if (x === undefined || y === undefined || roomId === undefined)
    return {
      statusCode: 400,
    };

  let room = cache.get(roomId);

  if (!room) {
    const [{ data, error }, { data: serverData }] = await Promise.all([
      supabase
        .from("rooms")
        .select("client_board, revealed_tiles")
        .eq("id", roomId)
        .single(),
      supabase
        .from("serverboard")
        .select("server_board")
        .eq("room_id", roomId)
        .single(),
    ]);

    if (error) return { statusCode: 500 };
    let client_board = data.client_board;
    let server_board = serverData?.server_board;

    if (!client_board || !server_board) {
      const [server, client] = generateSolvedBoard(12, x, y);

      client_board = client;
      server_board = server;

      // Maybe put this in another serverless function if the delay becomes too much at the start
      await supabase.from("serverboard").insert({
        room_id: roomId,
        server_board,
      });
    }

    room = {
      client_board,
      // @ts-ignore
      server_board,
      number_of_revealed_tiles: data.revealed_tiles,
    };

    cache.set(roomId, room);
  }

  const return_tile = returnTile(
    "Rick Ashley",
    room.server_board,
    room.client_board,
    x,
    y,
  );
  const increment_by = "x" in return_tile ? 1 : return_tile.size;

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
    }),
  }).catch((error) => console.error("Failed to send update request:", error));

  cache.set(roomId, {
    server_board: room.server_board,
    client_board: room.client_board,
    number_of_revealed_tiles: room.number_of_revealed_tiles + increment_by,
  });

  return {
    body:
      "x" in return_tile
        ? JSON.stringify(return_tile)
        : JSON.stringify(Object.fromEntries(return_tile)),
    statusCode: 200,
  };
};
