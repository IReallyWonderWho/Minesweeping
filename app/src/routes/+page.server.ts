import { roomExists } from "$lib/server/rooms";
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

    const room = await roomExists(roomId);

    return room
      ? redirect(303, `/playing/${roomId}/nickname`)
      : fail(404, {
          error: "Room not found",
        });
  },
};
