import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { supabase } from "$lib/supabaseClient";

export const ssr = false;

// TODO secure room_players with RLS soon
async function getClientBoard(roomId: number) {
  const { data, error } = await supabase
    .from("rooms")
    .select("id, client_board")
    .single();

  console.log(data);
  console.log(error);

  return data ? data.client_board : undefined;
}

async function getAllPlayers(roomId: number) {
  const { data } = await supabase
    .from("room_players")
    .select("room_id, nickname, color, user_id")
    .eq("room_id", roomId);

  return data;
}

export const load: PageServerLoad = async ({ params }) => {
  const roomId = params["roomId"];

  if (!roomId || typeof roomId !== "string") throw redirect(307, "/");
  let room_id = Number(roomId);

  const { error } = await supabase.auth.getUser();

  if (error) throw redirect(303, "/");

  const client_board = await getClientBoard(room_id);
  const players = await getAllPlayers(room_id);

  // const time = await getTime(roomId);

  return {
    board: client_board,
    players: players ? Array.from(players) : undefined,
    time: 0,
  };
};
