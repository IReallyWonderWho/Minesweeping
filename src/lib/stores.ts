import { RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import { writable } from "svelte/store";

export interface roomData {
  supabase: SupabaseClient;
  session: string;
  room: {
    client_board: Array<Array<number>> | undefined;
    created_at: string;
    flags: {
      flags: Map<string, boolean>;
    };
    started: boolean;
    rows_columns: number;
    mine_ratio: number;
    host: string;
  };
  user: {
    playerData: {
      nickname: string;
      color: string;
    };
    id: string;
  };
}

export const flags = writable<Map<string, boolean>>(new Map());
export const players = writable<
  Map<
    string,
    {
      x: number;
      y: number;
      nickname: string;
      color: string;
    }
  >
>(new Map());

export const numberOfRowsColumns = writable([12]);
export const mineRatio = writable([6]);

export const confetti = writable<[boolean]>([false]);

export const windowRect = writable<DOMRect | undefined>();

export const isHost = writable<boolean>(false);

export const roomChannel = writable<RealtimeChannel | undefined>();
