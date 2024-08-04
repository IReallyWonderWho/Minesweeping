import { roomExists, createRoom } from "$lib/server/rooms";
import { encode } from "$lib/utility";
import { fail, redirect, type Actions } from "@sveltejs/kit";

export const actions: Actions = {
  join: async ({ request }) => {
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
    // Remove any spaces inside the string and convert to lowercase
    const parsedRoomId = roomId.replace(/\s/g, "").toLowerCase();
    const room_id = encode(parsedRoomId);

    const room = await roomExists(room_id);

    return room
      ? redirect(303, `/rooms/nickname?roomId=${room_id}`)
      : fail(404, {
          error: "Room not found",
        });
  },
  create: async ({ request }) => {
    const data = await request.json();
    const roomId = await createRoom(data.userId);

    console.log(JSON.stringify(roomId));
    return roomId;
  },
};
