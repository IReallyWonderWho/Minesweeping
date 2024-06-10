import { v4 as uuidv4 } from "uuid";
import { generateSolvedBoard } from "./board";
import redis from "../redis";

// Started represents if the boards are generated or not
export interface Room {
  server_board: Array<Array<number>> | undefined;
  client_board: Array<Array<number>> | undefined;
  started: boolean;
  roomId: string;
}

export async function createRoom(custom_room_id?: string) {
  const roomId = custom_room_id ?? uuidv4();

  const room: Room = {
    server_board: undefined,
    client_board: undefined,
    roomId,
    started: false,
  };

  await redis.set(`roomId/${roomId}`, room);

  return { roomId };
}

export async function createBoardForRoom(
  roomId: string,
  number_of_rows_columns: number,
  safe_row: number,
  safe_column: number,
) {
  const room = await getRoom(roomId);

  if (!room) throw "Room not found";

  console.log("generating boards!");

  const [server_board, client_board] = generateSolvedBoard(
    number_of_rows_columns,
    safe_row,
    safe_column,
  );

  const room_body: Room = {
    server_board,
    client_board,
    roomId,
    started: true,
  };

  console.log(JSON.stringify(room_body));

  await redis.set(`roomId/${roomId}`, room_body);

  return room_body;
}

export function getRoom(roomId: string) {
  return redis.get<Room>(`roomId/${roomId}`);
}
