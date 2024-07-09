import { roomExists } from "$lib/server/rooms";
import { encode } from "$lib/utility";
import { fail, redirect, type Actions } from "@sveltejs/kit";

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const roomId = data.get("roomId");

    if (!roomId)
      return fail(400, {
        error: "Room id not provided",
      });
    if (typeof roomId !== "string")
      return fail(400, {
        error: "Room id must be a string",
      });
    const room_id = encode(roomId);
    console.log(`ROOM: ${room_id}`);

    const room = await roomExists(room_id);
    console.log(room);
    console.log(`REDIRECTING TO: ${room_id}`);

    return room
      ? redirect(303, `/playing/${room_id}/nickname`)
      : fail(404, {
          error: "Room not found",
        });
  },
};
