import { v4 as uuidv4 } from "uuid";
import { generateSolvedBoard } from "./board";
import redis from "../redis";

// Started represents if the boards are generated or not
export interface Room {
  server_board?: Array<Array<number>>;
  client_board?: Array<Array<number>>;
  number_of_revealed_tiles: number;
  started: boolean;
  players: Map<string, string>;
  roomId: string;
}

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
    "number_revealed_tiles",
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
  const player_key = `player/${session_token}`;

  await Promise.allSettled([
    redis.hSet(player_key, "name", player_name),
    redis.hSet(player_key, "roomId", roomId),
  ]);

  await redis.sAdd(`roomId/${roomId}/players`, session_token);

  return session_token;
}

export async function createRoom(custom_room_id?: string) {
  const roomId = custom_room_id ?? uuidv4();

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
  console.log(roomId);
  return (await redis.exists(`roomId/${roomId}`)) === 1;
}
