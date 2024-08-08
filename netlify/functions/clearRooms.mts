import type { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_PRIVATE_API_KEY ?? "",
);

export default async (req: Request) => {
  const { next_run } = await req.json();

  console.log("Running function");
  console.log("Next invocation at ", next_run);
  const date = new Date();

  // Remove rooms that haven't been pinged in the last 5 minutes
  date.setTime(date.getTime() - 300_000);

  const { data, error } = await supabase
    .from("rooms")
    .delete()
    .lt("last_ping", date.toISOString());

  console.log(error);
  console.log(data);
};

export const config: Config = {
  schedule: "@hourly",
};
