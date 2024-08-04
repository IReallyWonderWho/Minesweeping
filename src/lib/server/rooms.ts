import { supabase } from "$lib/server/supabaseClient";
import { encode } from "$lib/utility";

function generateRoomId() {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}

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
    .maybeSingle();

  if (!error) {
    return data;
  }

  return false;
}

export async function createRoom(hostId: string) {
  const roomId = encode(generateRoomId());

  const { error } = await supabase.from("rooms").insert({
    id: roomId,
    created_at: new Date().toISOString(),
    host: hostId,
    revealed_tiles: 0,
    flags: {},
    started: false,
    rows_columns: 12,
    mine_ratio: 6,
    players: {},
  });

  if (error) return;

  return roomId;
}
