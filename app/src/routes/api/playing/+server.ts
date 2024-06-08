import { error, json, type RequestHandler } from "@sveltejs/kit";
import { getRoom } from "$lib/server/rooms";

// DOES NOT WORK IN DEVELOPMENT MODE, WILL REDO LATER
export const GET: RequestHandler = async ({ url }) => {
  const roomId = url.searchParams.get("roomId");

  if (!roomId) return error(400, "Room ID not provided");

  const room = await getRoom(roomId);
  console.log(room);

  if (!room) return error(400, "Room not found");

  return json(room["client_board"]);
};
