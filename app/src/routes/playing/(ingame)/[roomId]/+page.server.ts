import { getBoards } from "$lib/server/rooms";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { isSessionValid } from "$lib/server/multiplayer/verifySession";

export const load: PageServerLoad = async ({ params, cookies }) => {
  const roomId = params["roomId"];
  const session_id = cookies.get("SESSION_ID");

  if (!roomId) throw redirect(307, "/");
  if (!session_id) throw redirect(307, "/");
  console.log(await isSessionValid(session_id, roomId));
  if (!(await isSessionValid(session_id, roomId))) throw redirect(307, "/");

  const room = await getBoards(roomId);

  return {
    board: room ? room.client_board : undefined,
  };
};
