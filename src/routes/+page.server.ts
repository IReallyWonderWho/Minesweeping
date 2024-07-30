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

    const room = await roomExists(room_id);

    return room
      ? redirect(303, `/rooms/${room_id}/playing/nickname`)
      : fail(404, {
          error: "Room not found",
        });
  },
};
