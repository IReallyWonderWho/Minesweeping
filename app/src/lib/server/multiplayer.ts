import type { Server } from "socket.io";
import { UNKNOWN_TILE, FLAGGED_TILE, returnTile, didGameEnd } from "./board";
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
import { parse } from "cookie";
import { isSessionValid } from "./auth";

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
  io.use(async (socket, next) => {
    const cookies = parse(socket.handshake.headers.cookie ?? "");
    const session_id = cookies["SESSION_ID"];
    const roomId: unknown = socket.handshake.auth.roomId;

    if (
      session_id !== undefined &&
      typeof roomId === "string" &&
      (await isSessionValid(roomId, session_id))
    ) {
      console.log("verified!");
      next();
    } else {
      console.log("AAAA");
      next(
        new Error(
          "Session Id is invalid. Please try rejoining the game through the menu.",
        ),
      );
    }
  });

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
        x,
        y,
      );

      const increment_by = "x" in returned_tile ? 1 : returned_tile.size;
      const revealed_tiles = number_of_revealed_tiles + increment_by;

      if (
        ("x" in returned_tile && returned_tile["state"] === -1) ||
        didGameEnd(client_board, revealed_tiles)
      ) {
        const by_mine = "x" in returned_tile && returned_tile["state"] === -1;

        return io
          .to(`roomId/${roomId}`)
          .emit("game_ended", by_mine, "Rick Ashley");
      }

      setBoards(roomId, client_board, server_board);
      setRevealedTiles(roomId, revealed_tiles);

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
