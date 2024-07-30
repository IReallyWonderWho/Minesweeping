import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_PRIVATE_API_KEY ?? "",
);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { roomId, client_board, revealed_tiles, players } = JSON.parse(
    event.body ?? "{}",
  );

  if (!roomId || !client_board || revealed_tiles === undefined) {
    return { statusCode: 400, body: "Missing required fields" };
  }

  try {
    // Instead of directly updating the database, instead update it through a database function
    // to try and avoid race conditions
    const { error, data } = await supabase.rpc(
      "update_room_with_concurrency_check",
      {
        p_room_id: roomId,
        p_client_board: client_board,
        p_revealed_tiles: revealed_tiles,
        p_players: players,
      },
    );

    if (error) throw error;

    if (data === undefined) {
      return {
        statusCode: 409,
        body: "Conflict: Room was updated by another process",
      };
    }

    return { statusCode: 200, body: "Update successful" };
  } catch (error) {
    console.error("Update failed:", error);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};
