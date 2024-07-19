import { writable } from "svelte/store";
import { supabase } from "./supabaseClient";

export const flags = writable<Map<string, boolean>>(new Map());

export const confetti = writable<boolean>();

export const windowRect = writable<DOMRect | undefined>();
