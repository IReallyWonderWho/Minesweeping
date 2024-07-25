import { writable } from "svelte/store";

export interface roomData {
  roomPromise: Promise<{
    client_board: Array<Array<number>> | undefined;
    created_at: string;
    flags: Map<string, boolean>;
  }>;
  userPromise: Promise<{
    playerData: {
      nickname: string;
      color: string;
    };
    id: string;
  }>;
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

export const confetti = writable<boolean>();

export const windowRect = writable<DOMRect | undefined>();
