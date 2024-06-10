import type { Server } from "socket.io";
import { UNKNOWN_TILE, FLAGGED_TILE, returnTile } from "./board";
import { createRoom, getRoom, createBoardForRoom, type Room } from "./rooms";
import redis from "../redis";

const NUMBER_OF_ROWS_COLUMNS = 12;

createRoom("Never going to give your ip");

// Uhmmmm, the room data on the server and sveltekit are completely different, so
// we need a layer to actually synchronize them
export default function multiplayer(io: Server) {
  redis.subscribe("room/*", (room: Room) => {
    io.to(`roomId/${room.roomId}`).emit(`roomId/${room.roomId}`, room);
  });

  io.on("connection", (socket) => {
    socket.on("join_room", async (roomId) => {
      const room = await getRoom(roomId);

      if (room) {
        await socket.join(`roomId/${roomId}`);
        socket.emit("joined_room", room.roomId);
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
      const { server_board, client_board } = room.started
        ? room
        : await createBoardForRoom(room.roomId, NUMBER_OF_ROWS_COLUMNS, x, y);

      const tile = returnTile(
        "Rick Ashley",
        server_board!,
        client_board!,
        x,
        y,
      );
      const room_id = `roomId/${room.roomId}`;

      await redis.set(room_id, {
        server_board,
        client_board,
        roomId,
        started: true,
      });

      io.to(room_id).emit(
        "board_updated",
        Array.isArray(tile) ? tile : Object.fromEntries(tile),
      );
    });

    socket.on("flag_tile", async ({ x, y, roomId }) => {
      const room = await getRoom(roomId);

      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }

      // Redis isn't being funny???
      if (!room.started) {
        socket.emit("error", "Room boards haven't been initalized yet");
        return;
      }

      const room_id = `roomId/${room.roomId}`;
      const { server_board, client_board } = room;
      const tile = client_board![x][y];

      if (tile !== UNKNOWN_TILE && tile !== FLAGGED_TILE) {
        socket.emit("error", "Tile cannot be flagged");
        return;
      }

      const is_flagged = tile === UNKNOWN_TILE;
      const new_tile = is_flagged ? FLAGGED_TILE : UNKNOWN_TILE;

      client_board![x][y] = new_tile;

      await redis.set(room_id, {
        server_board,
        client_board,
        roomId,
        started: room.started,
      });

      io.to(room_id).emit("board_updated", [x, y, new_tile]);
    });
  });
}
