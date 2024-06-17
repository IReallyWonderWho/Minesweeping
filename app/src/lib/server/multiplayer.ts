import type { Server } from "socket.io";
import { UNKNOWN_TILE, FLAGGED_TILE, returnTile } from "./board";
import {
  createRoom,
  getRoom,
  createBoardForRoom,
  getBoards,
  getRevealedTiles,
  setRevealedTiles,
  setBoards,
  getStarted,
  roomExists,
} from "./rooms";

const NUMBER_OF_ROWS_COLUMNS = 12;

createRoom("Never going to give your ip");

// The room data on the server and sveltekit are completely different, so
// we need a layer to actually synchronize them
// in this case we're using redis
export default function multiplayer(io: Server) {
  /* redis.subscribe("room/*", (room: Room) => {
    io.to(`roomId/${room.roomId}`).emit(
      `roomId/${room.roomId}`,
      room["client_board"],
    );
    }); */

  io.on("connection", (socket) => {
    socket.on("join_room", async (roomId) => {
      const room = await getRoom(roomId);

      if (room) {
        await socket.join(`roomId/${roomId}`);
        socket.emit("joined_room", roomId);
        return;
      }

      socket.emit("error", "Room not found");
    });

    socket.on("choose_tile", async ({ x, y, roomId }) => {
      const room = await getRoom(roomId);

      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }

      // Generate the boards if the board hasn't been initalized yet
      // using x and y as the safe coordinates
      const { server_board, client_board } =
        (await getBoards(roomId)) ??
        (await createBoardForRoom(roomId, NUMBER_OF_ROWS_COLUMNS, x, y));
      const number_of_revealed_tiles = (await getRevealedTiles(roomId)) ?? 0;

      const returned_tile = returnTile(
        "Rick Ashley",
        server_board!,
        client_board!,
        number_of_revealed_tiles,
        x,
        y,
      );

      const increment_by = "x" in returned_tile ? 1 : returned_tile.size;

      setBoards(roomId, client_board, server_board);
      setRevealedTiles(roomId, number_of_revealed_tiles + increment_by);

      // console.log(new Map().constructor == Object) // False
      // console.log({ "a": "hi" }.constructor == Object) // True
      io.to(`roomId/${roomId}`).emit(
        "board_updated",
        "x" in returned_tile
          ? returned_tile
          : Object.fromEntries(returned_tile),
      );
    });

    socket.on("flag_tile", async ({ x, y, roomId }) => {
      const room = await roomExists(roomId);

      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }

      const started = await getStarted(roomId);

      if (!started) {
        socket.emit("error", "Room boards haven't been initalized yet");
        return;
      }

      const { server_board, client_board } = (await getBoards(roomId)) as {
        server_board: any;
        client_board: any;
      };
      const tile = client_board![x][y];

      if (tile !== UNKNOWN_TILE && tile !== FLAGGED_TILE) {
        socket.emit("error", "Tile cannot be flagged");
        return;
      }

      const is_flagged = tile === UNKNOWN_TILE;
      const new_tile = is_flagged ? FLAGGED_TILE : UNKNOWN_TILE;

      client_board![x][y] = new_tile;

      setBoards(roomId, client_board, server_board);

      io.to(`roomId/${roomId}`).emit("board_updated", {
        x,
        y,
        state: new_tile,
      });
    });
  });
}
