import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { supabase } from "$lib/supabaseClient";

export const ssr = false;

async function getData(roomId: number) {
  const { data, error } = await supabase
    .from("rooms")
    .select(
      "client_board, created_at, started, rows_columns, mine_ratio, host, flags(flags)",
    )
    .eq("id", roomId)
    .single();

  console.log("bruh");
  console.log(data);
  console.log(error);
  return !error ? data : undefined;
}

export const load: PageServerLoad = async ({ request, params }) => {
  const roomId = params["roomId"];
  console.log("what");
  console.log(request);

  if (!roomId || typeof roomId !== "string") throw redirect(307, "/");
  let room_id = Number(roomId);

  const user = new Promise(async (resolve, reject) => {
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
  });

  const room = getData(room_id);
  console.log("MUHAHAHA");

  return {
    roomPromise: room,
    userPromise: user,
  };
};
