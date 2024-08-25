import { redirect } from "@sveltejs/kit";
import type { LayoutLoad } from "./$types";
import type { SupabaseClient } from "@supabase/supabase-js";

export const ssr = false;

async function getData(supabase: SupabaseClient, roomId: number) {
  const { data, error } = await supabase
    .from("rooms")
    .select(
      "client_board, created_at, started, rows_columns, mine_ratio, host, flags(flags)",
    )
    .eq("id", roomId)
    .single();

  return !error ? data : undefined;
}

export const load: LayoutLoad = async ({ params, parent }) => {
  const { supabase } = await parent();

  const roomId = params["roomId"];

  if (!roomId || typeof roomId !== "string") throw redirect(307, "/");
  let room_id = Number(roomId);

  const [room, user] = await Promise.all([
    getData(supabase, room_id),
    new Promise(async (resolve, reject) => {
      const { data, error } = await supabase.auth.getUser();

      if (error) return reject("User not found");

      const { data: playerData, error: playerError } = await supabase
        .from("room_players")
        .select("nickname, color")
        .eq("user_id", data.user.id)
        .single();

      if (playerError) {
        console.warn(playerError);
        return reject("User info not found");
      }

      const returnData = {
        playerData,
        id: data.user.id,
      };

      resolve(returnData);
    }),
  ]);
  console.log("MUHAHAHA");

  return {
    room: room,
    user: user,
  };
};
