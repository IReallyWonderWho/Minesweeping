import { roomExists, playerExists } from "../rooms";

async function isSessionReal(roomId: string, session_id: string) {
  if (!(await roomExists(roomId))) return false;

  return playerExists(roomId, session_id);
}

export async function isSessionValid(
  session_id: string | undefined,
  roomId: unknown,
) {
  if (
    session_id !== undefined &&
    typeof roomId === "string" &&
    (await isSessionReal(roomId, session_id))
  ) {
    return true;
  }
  return false;
}
