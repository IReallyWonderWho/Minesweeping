import { generateSolvedBoard } from "$lib/server/board";

generateSolvedBoard(12, 0, 0);
export function GET() {
  return new Response("ok");
}
