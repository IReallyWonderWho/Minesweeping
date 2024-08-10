import { supabase } from "$lib/server/supabaseClient";
import { encode } from "$lib/utility";
import { generateSolvedBoard } from "./board";

function generateRoomId() {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}

export async function getBoards(roomId: number) {
  const { data } = await supabase
    .from("rooms")
    .select("id, client_board, serverboard(server_board)")
    .eq("id", roomId)
    .single();

  return data;
}

export interface Room {
  client_board: Array<Array<number>>;
  server_board: Array<Array<number>>;
  revealed_tiles: number;
  rows_columns: number;
  mine_ratio: number;
}

type SuccessResult = {
  success: true;
  data: Room;
};

type ErrorResult = {
  success: false;
  error: {
    statusCode: number;
  };
};

type GetRoomDataResult = SuccessResult | ErrorResult;

export async function getRoomData(
  roomId: string,
  x: number,
  y: number,
): Promise<GetRoomDataResult> {
  const { data, error } = await supabase
    .from("rooms")
    .select(
      "client_board, revealed_tiles, rows_columns, mine_ratio, started, serverboard(server_board)",
    )
    .eq("id", roomId)
    .single();

  if (error) return { success: false, error: { statusCode: 500 } };
  if (!data.started) return { success: false, error: { statusCode: 404 } };

  let client_board = data.client_board;
  // @ts-ignore
  let server_board = data.serverboard?.server_board;

  if (!client_board || !server_board) {
    const [server, client] = generateSolvedBoard(
      data.rows_columns,
      x,
      y,
      data.mine_ratio,
    );

    client_board = client;
    server_board = server;

    await Promise.all([
      supabase.from("serverboard").upsert({
        room_id: roomId,
        server_board,
      }),
      supabase
        .from("rooms")
        .update({
          client_board,
          revealed_tiles: 0,
          flags: {},
        })
        .eq("id", roomId),
    ]);
  }

  return {
    success: true,
    data: {
      client_board,
      server_board,
      revealed_tiles: data.revealed_tiles,
      rows_columns: data.rows_columns,
      mine_ratio: data.mine_ratio,
    },
  };
}

type UserSuccess = {
  success: true;
  data: {
    headers?: Record<string, any>;
    userId: string;
  };
};

type UserError = {
  success: false;
  error: {
    statusCode: number;
    body?: string;
  };
};

type GetUserDataResult = UserSuccess | UserError;

/**
    Used to check if an user is authenticated and return the User Id if authenticated
*/
export async function getUser(accessToken: string): Promise<GetUserDataResult> {
  const { data: userData, error } = await supabase.auth.getUser(accessToken);

  if (error || !userData.user) {
    return {
      success: false,
      error: {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid token" }),
      },
    };
  }

  return {
    success: true,
    data: {
      userId: userData.user.id,
    },
  };
}

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

  console.log("hello");

  const [{ error }] = await Promise.all([
    supabase.from("rooms").insert({
      id: roomId,
      created_at: new Date().toISOString(),
      host: hostId,
      revealed_tiles: 0,
      started: false,
      rows_columns: 12,
      mine_ratio: 6,
    }),
  ]);

  await supabase.from("flags").insert({
    room_id: roomId,
    flags: {},
  });

  if (error) return;

  return roomId;
}
