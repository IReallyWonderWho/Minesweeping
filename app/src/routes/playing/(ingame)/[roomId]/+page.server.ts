import { getBoards, getRoom } from "$lib/server/rooms";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const roomId = params["roomId"];

  if (!roomId)
    return fail(400, {
      message: "Room id not provided",
    });

  const room = await getBoards(roomId);

  if (!room)
    return fail(404, {
      message: "Room not found",
    });

  return {
    board: room.client_board,
  };
};
