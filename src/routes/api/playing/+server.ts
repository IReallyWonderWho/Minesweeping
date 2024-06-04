import { type RequestHandler } from "@sveltejs/kit";

// DOES NOT WORK IN DEVELOPMENT MODE, WILL REDO LATER
/* export const GET: RequestHandler = ({ url }) => {
  const join_code = url.searchParams.get("code");

  console.log(join_code);
  return new Response(JSON.stringify(client_board));
}; */
