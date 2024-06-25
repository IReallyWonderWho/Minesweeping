import { v4 as uuidv4 } from "uuid";
import { generateSolvedBoard } from "./board";
import redis from "../redis";
import { getRandomHSL } from "$lib/utility";

export function setBoards(
  roomId: string,
  client_board: Array<Array<number>>,
  server_board: Array<Array<number>>,
) {
  redis.hSet(`roomId/${roomId}`, "boards", {
    server_board,
    client_board,
  });
}

export function getBoards(roomId: string) {
  return redis.hGet<
    | { server_board: Array<Array<number>>; client_board: Array<Array<number>> }
    | undefined
  >(`roomId/${roomId}`, "boards");
}

export function setRevealedTiles(
  roomId: string,
  number_of_revealed_tiles: number,
) {
  redis.hSet(
    `roomId/${roomId}`,
    "number_of_revealed_tiles",
    number_of_revealed_tiles,
  );
}

export function getRevealedTiles(roomId: string) {
  return redis.hGet<number>(`roomId/${roomId}`, "number_of_revealed_tiles");
}

export function setStart(roomId: string, started: boolean) {
  redis.hSet(`roomId/${roomId}`, "started", started);
}

export function getStarted(roomId: string) {
  return redis.hGet<boolean>(`roomId/${roomId}`, "started");
}

export async function addPlayer(roomId: string, player_name: string) {
  const session_token = uuidv4();

  const color = getRandomHSL();

  await redis.hSet(`roomId/${roomId}/players`, session_token, {
    nickname: player_name,
    color,
  });

  return session_token;
}

export function getPlayer(roomId: string, session_token: string) {
  return redis.hGet<{ nickname: string; color: string }>(
    `roomId/${roomId}/players`,
    session_token,
  );
}

export async function playerExists(roomId: string, session_token: string) {
  return await redis.hExists(`roomId/${roomId}/players`, session_token);
}

export async function createRoom(custom_room_id?: string) {
  const roomId = custom_room_id ?? uuidv4();

  await Promise.allSettled([
    redis.del(`roomId/${roomId}/players`),
    redis.del(`roomId/${roomId}`),
  ]);
  setRevealedTiles(roomId, 0);
  setStart(roomId, false);

  return { roomId };
}

export async function createBoardForRoom(
  roomId: string,
  number_of_rows_columns: number,
  safe_row: number,
  safe_column: number,
): Promise<{
  server_board: Array<Array<number>>;
  client_board: Array<Array<number>>;
}> {
  const room = await getRoom(roomId);

  if (!room) throw "Room not found";

  console.log("generating boards!");

  const [server_board, client_board] = generateSolvedBoard(
    number_of_rows_columns,
    safe_row,
    safe_column,
  );

  setStart(roomId, true);
  setBoards(roomId, client_board, server_board);

  return {
    client_board,
    server_board,
  };
}

export function getRoom(roomId: string) {
  return redis.hGetAll(`roomId/${roomId}`);
}

export async function roomExists(roomId: string) {
  return await redis.exists(`roomId/${roomId}`);
}
