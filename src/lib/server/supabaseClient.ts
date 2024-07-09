import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PRIVATE_API_KEY } from "$env/static/private";

// This should only be used for the backend sveltekit scripts
export const supabase = createClient(
  "https://dsuftvbhcbtcwoqhfdgj.supabase.co",
  SUPABASE_PRIVATE_API_KEY,
);
