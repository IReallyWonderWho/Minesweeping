import redis from "$lib/redis";
import { getRoom } from "$lib/server/rooms";
import { fail, type Actions } from "@sveltejs/kit";

export const actions: Actions = {
  default: async ({ request, params }) => {
    const data = await request.formData();
    const nickname = data.get("nickname");
    const roomId = params["roomId"];

    if (!nickname || !roomId) return fail(400);
    if (typeof nickname !== "string")
      return fail(400, {
        message: "Nickname must be a string",
      });
  },
};
