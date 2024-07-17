import { writable } from "svelte/store";
import { supabase } from "./supabaseClient";

export const flags = writable<Map<string, boolean>>(new Map());
