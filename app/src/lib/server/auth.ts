import { roomExists, playerExists } from "./rooms";

export async function isSessionValid(roomId: string, session_id: string) {
  if (!(await roomExists(roomId))) return false;

  return playerExists(roomId, session_id);
}
