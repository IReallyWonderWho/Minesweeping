import { fail, redirect, type Actions } from "@sveltejs/kit";
import { getRandomHSL } from "$lib/utility";

type ValidateResult = [true, undefined] | [false, string];

function validateNickname(nickname: string): ValidateResult {
  if (!nickname || nickname.trim().length < 3) {
    return [false, "Nickname must be at least 3 characters long"];
  }
  if (nickname.trim().length > 12) {
    return [false, "Nickname must not exceed 12 characters"];
  }
  if (!/^[a-zA-Z0-9_ ]+$/.test(nickname.trim())) {
    return [
      false,
      "Nickname can only contain letters, numbers, underscores, and spaces",
    ];
  }

  return [true, undefined];
}

export const actions: Actions = {
  default: async ({ request, locals: { supabase }, fetch }) => {
    const formData = await request.formData();

    console.log(supabase);

    let roomId = formData.get("roomId") as string;
    const nickname = formData.get("nickname") as string;
    const creatingRoom = formData.get("creating");

    let { data: userData, error: playerError } = await supabase.auth.getUser();

    if (playerError) {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.error(error);
        return fail(500, { error: error.message });
      }

      userData = data;
    }

    const [valid, error] = validateNickname(nickname);

    if (!valid) {
      return fail(400, { error });
    }

    const user_id = userData.user?.id;
    const color = getRandomHSL();

    if (creatingRoom) {
      const response = await fetch("/api/room?/create", {
        method: "POST",
        body: JSON.stringify({
          userId: user_id,
        }),
      });
      const json = await response.json();
      const data = JSON.parse(json.data);

      roomId = data[0];
    }

    const { error: joinError } = await supabase.from("room_players").upsert({
      user_id,
      room_id: roomId,
      color,
      nickname,
    });

    if (joinError) {
      return fail(500, { error: joinError.message });
    }

    console.log("REDIRECTING GUYS!!");
    throw redirect(302, `/rooms/${roomId}`);
  },
};

/* export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
  const creating = url.searchParams.get("creating");
  const roomId = url.searchParams.get("roomId");

  if (creating) {
    return {};
  }

  if (!roomId) {
    return redirect(307, "/");
  }

  const { error } = await supabase
    .from("rooms")
    .select("id")
    .eq("id", roomId)
    .single();

  if (error) {
    return redirect(303, "/");
  }

  return {};
}; */
