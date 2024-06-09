import { v4 as uuidv4 } from "uuid";
import { generateSolvedBoard } from "./board";
import redis from "../redis";

export interface Room {
  server_board: Array<Array<number>>;
  client_board: Array<Array<number>>;
  roomId: string;
}

export async function createRoom(
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

  await redis.set(`roomId/${roomId}`, {
    server_board,
    client_board,
    roomId,
  });

  return { server_board, client_board, roomId };
}

export function getRoom(roomId: string) {
  return redis.get<Room>(`roomId/${roomId}`);
}
