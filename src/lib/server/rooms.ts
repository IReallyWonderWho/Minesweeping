import { v4 as uuidv4 } from "uuid";
import redis from "../redis";
import { getRandomHSL } from "$lib/utility";

export function getBoards(roomId: string) {
  return redis.hGet<
    | { server_board: Array<Array<number>>; client_board: Array<Array<number>> }
    | undefined
  >(`roomId/${roomId}`, "boards");
}

export async function addPlayer(roomId: string, player_name: string) {
  const session_token = uuidv4();

  console.log(session_token);
  const color = getRandomHSL();

  await redis.hSet(`roomId/${roomId}/players`, session_token, {
    nickname: player_name,
    color,
  });

  return session_token;
}

export async function playerExists(roomId: string, session_token: string) {
  return await redis.hExists(`roomId/${roomId}/players`, session_token);
}

export function getAllPlayers(roomId: string) {
  return redis.hGetAll<
    Map<string, { nickname: string; color: string }> | undefined
  >(`roomId/${roomId}/players`);
}

export async function getTime(roomId: string) {
  console.log(await redis.hGet(`roomId/${roomId}`, "time_started"));
  return await redis.hGet<number>(`roomId/${roomId}`, "time_started");
}

export async function roomExists(roomId: string) {
  return await redis.exists(`roomId/${roomId}`);
}
