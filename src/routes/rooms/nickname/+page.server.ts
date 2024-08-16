import type { PageServerLoad } from "./$types";
import { supabase } from "$lib/server/supabaseClient";
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ url }) => {
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
};
