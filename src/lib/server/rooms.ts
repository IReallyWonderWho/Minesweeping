import { v4 as uuidv4 } from "uuid";
import { generateSolvedBoard } from "./board";

export const rooms: Map<
  string,
  { server_board: Array<Array<number>>; client_board: Array<Array<number>> }
> = new Map();

export function createRoom(
  number_of_rows_columns: number,
  safe_row: number,
  safe_column: number,
) {
  // Just for testing just set a random room id;
  const roomId = "Never going to give your ip"; //uuidv4();

  const [server_board, client_board] = generateSolvedBoard(
    number_of_rows_columns,
    safe_row,
    safe_column,
  );

  rooms.set(roomId, { server_board, client_board });

  return { server_board, client_board };
}

export function getRoom(roomId: string) {
  return rooms.get(roomId);
}
