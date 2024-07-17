import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { supabase } from "$lib/supabaseClient";

export const ssr = false;

// TODO secure room_players with RLS soon
async function getData(roomId: number) {
  const { data, error } = await supabase
    .from("rooms")
    .select("client_board, created_at, flags")
    .eq("id", roomId)
    .single();

  return !error ? data : undefined;
}

export const load: PageServerLoad = async ({ params }) => {
  const roomId = params["roomId"];

  if (!roomId || typeof roomId !== "string") throw redirect(307, "/");
  let room_id = Number(roomId);

  const { error } = await supabase.auth.getUser();

  if (error) throw redirect(303, "/");

  const room = await getData(room_id);

  return {
    board: room?.client_board,
    time: room?.created_at,
    flags: room?.flags,
  };
};
