import { error, json, type RequestHandler } from "@sveltejs/kit";
import { getRoom, rooms } from "$lib/server/rooms";

// DOES NOT WORK IN DEVELOPMENT MODE, WILL REDO LATER
export const GET: RequestHandler = ({ url }) => {
  const roomId = url.searchParams.get("roomId");

  if (!roomId) return error(400, "Room ID not provided");

  console.log(roomId);
  console.log(rooms);
  const room = getRoom(roomId);

  if (!room) return error(400, "Room not found");

  return json(room["client_board"]);
};
