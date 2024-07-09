import { writable } from "svelte/store";
import {
  NUMBER_OF_ROWS_COLUMNS,
  TILE_TO_MINE_RATIO,
} from "./sharedExpectations";
import { supabase } from "./supabaseClient";

export const flags = writable(NUMBER_OF_ROWS_COLUMNS ** 2 / TILE_TO_MINE_RATIO);

async function playerStoreYay() {
  const { data, error } = await supabase.auth.getUser();
  const user_id = data.user?.id;

  const player_data = await supabase
    .from("room_players")
    .select("nickname, color")
    .eq("user_id", user_id)
    .single();

  console.log(player_data);

  return player_data;
}

export const playerStore = writable<{ nickname: string; color: string }>(
  undefined,
  (set) => {
    playerStoreYay().then(set);
  },
);
