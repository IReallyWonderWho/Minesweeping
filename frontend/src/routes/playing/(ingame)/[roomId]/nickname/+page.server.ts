import redis from "$lib/redis";
import { addPlayer, roomExists } from "$lib/server/rooms";
import { fail, redirect, type Actions } from "@sveltejs/kit";

async function isValidNickname(roomId: string, nickname: string) {
  const a = await redis.hGetAll(`roomId/${roomId}/players`);
  console.log(a);
  // Regex pattern to allow only letters and numbers
  const pattern = /^[a-zA-Z0-9]+$/;
  return pattern.test(nickname);
}

export const actions: Actions = {
  default: async ({ request, params, cookies }) => {
    const data = await request.formData();
    const nickname = data.get("nickname");
    const roomId = params["roomId"];

    if (!nickname || !roomId) return fail(400);
    if (typeof nickname !== "string")
      return fail(400, {
        error: "Nickname must be a string",
      });
    if (!(await roomExists(roomId)))
      return fail(404, {
        error: "Room not found",
      });
    if (!(await isValidNickname(roomId, nickname)))
      return fail(400, {
        error:
          "Nickname can only contain letters and numbers (no special characters or spaces)",
      });

    // TODO: prevent duplicate nicknames
    const session_token = await addPlayer(roomId, nickname);
    const date = new Date();

    // The session expires after 2 hours (may have to be increased eventually?)
    date.setTime(Date.now() + 7.2e6);

    // The cookie shouldn't be used for authentication OUTSIDE of the current game
    cookies.set("SESSION_ID", session_token, {
      expires: date,
      path: "/",
    });

    throw redirect(303, `/playing/${roomId}`);
  },
};
