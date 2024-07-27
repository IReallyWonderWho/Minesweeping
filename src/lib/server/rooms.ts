import { getRandomHSL } from "$lib/utility";
import { supabase } from "$lib/server/supabaseClient";

export async function getBoards(room_id: number) {
  const { data } = await supabase
    .from("rooms")
    .select("id, client_board, serverboard(server_board)")
    .eq("id", room_id)
    .single();

  return data;
}

// TODO move this to the client side
/* export async function addPlayer(
  roomId: number,
  player_name: string,
  userId: string,
) {
  const color = getRandomHSL();

  // Add player to the room
  const { error: joinError } = await supabase
    .from("room_players")
    .insert({
      room_id: roomId,
      user_id: userId,
      color: color,
      nickname: player_name,
    });

  if (joinError) {
    console.error("Error joining room:", joinError);
    return joinError;
  }

  return userId;
} */

/* export async function playerExists(roomId: string, session_token: string) {
  return await redis.hExists(`roomId/${roomId}/players`, session_token);
} */

export async function getAllPlayers(roomId: number) {
  const { data, error } = await supabase
    .from("rooms")
    .select(
      `
      id,
      players:room_players(user_id)
    `,
    )
    .eq("id", roomId);

  console.log(data);
  console.log(error);
}

/* export async function getTime(roomId: string) {
  console.log(await redis.hGet(`roomId/${roomId}`, "time_started"));
  return await redis.hGet<number>(`roomId/${roomId}`, "time_started");
} */

export async function roomExists(roomId: number) {
  const { data, error } = await supabase
    .from("rooms")
    .select("id, started")
    .eq("id", roomId)
    .single();

  console.log(error);

  if (!error) {
    return data;
  }

  return false;
}
