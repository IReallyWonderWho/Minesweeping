import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PRIVATE_API_KEY } from "$env/static/private";
import { PUBLIC_SUPABASE_URL } from "$env/static/public";

// This should only be used for the backend sveltekit scripts
export const supabase = createClient(
  PUBLIC_SUPABASE_URL,
  SUPABASE_PRIVATE_API_KEY,
);
