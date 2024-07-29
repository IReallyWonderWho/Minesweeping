import type { Handler } from "@netlify/functions";
import { SupabaseClient } from "@supabase/supabase-js";
import { Redis } from "@upstash/redis";

const supabase = new SupabaseClient(
  process.env.PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_PRIVATE_API_KEY ?? "",
);

const redis = new Redis({
  url: "https://healthy-garfish-58064.upstash.io",
  token: process.env.UPSTASH_PRIVATE_API_KEY ?? "",
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const {
    roomId,
    client_board,
    revealed_tiles,
    tile,
    server_board,
    players,
    mine_ratio,
    rows_columns,
  } = JSON.parse(event.body ?? "{}");

  // Check a few fields just to make sure its not a horrible request
  if (!roomId || !client_board || revealed_tiles === undefined || !tile) {
    return { statusCode: 400, body: "Missing required fields" };
  }

  try {
    await Promise.all([
      supabase
        .from("rooms")
        .update({
          client_board,
          revealed_tiles,
        })
        .eq("id", roomId),
      redis.set(roomId, {
        server_board: server_board,
        client_board: client_board,
        revealed_tiles: revealed_tiles,
        players: players,
        mine_ratio: mine_ratio,
        rows_columns: rows_columns,
      }),
    ]);

    return { statusCode: 200, body: "Update successful" };
  } catch (error) {
    console.error("Update failed:", error);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};
