import { createClient } from "@supabase/supabase-js";
import { PUBLIC_FUNNY_KEY, PUBLIC_SUPABASE_API_KEY } from "$env/static/public";

export const supabase = createClient(
  "https://dsuftvbhcbtcwoqhfdgj.supabase.co",
  PUBLIC_SUPABASE_API_KEY,
);
