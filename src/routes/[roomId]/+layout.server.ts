import { roomExists } from "$lib/server/rooms";
import { redirect, type ServerLoad } from "@sveltejs/kit";

export const load: ServerLoad = async ({ params }) => {
  const roomId = params["roomId"];

  if (!roomId) throw redirect(303, "/");
  const room_id = Number(roomId);

  const room_exists = await roomExists(room_id);

  if (!room_exists) throw redirect(303, "/");
};
