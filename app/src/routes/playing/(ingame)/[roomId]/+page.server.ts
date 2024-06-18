import { getBoards } from "$lib/server/rooms";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { isSessionValid } from "$lib/server/auth";

export const load: PageServerLoad = async ({ params, cookies }) => {
  const roomId = params["roomId"];
  const session_id = cookies.get("SESSION_ID");

  if (!roomId)
    return fail(400, {
      error: "Room id not provided",
    });
  if (!session_id)
    return fail(400, {
      error: "Session id not provided",
    });
  if (!(await isSessionValid(roomId, session_id)))
    return fail(400, {
      error: "Session id is not valid",
    });

  const room = await getBoards(roomId);

  return {
    board: room ? room.client_board : undefined,
  };
};
