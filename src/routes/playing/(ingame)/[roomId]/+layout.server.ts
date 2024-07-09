import { roomExists } from "$lib/server/rooms";
import { redirect, type ServerLoad } from "@sveltejs/kit";

export const load: ServerLoad = async ({ params }) => {
  const roomId = params["roomId"];

  if (!roomId) throw redirect(303, "/");
  console.log(roomId);
  const room_id = Number(roomId);

  const room_exists = await roomExists(room_id);
  console.log(`bruh: ${room_exists}`);

  if (!room_exists) throw redirect(303, "/");
};
