import type { Server } from "socket.io";
import { UNKNOWN_TILE, FLAGGED_TILE, returnTile } from "./board";
import { createRoom, getRoom, type Room } from "./rooms";
import redis from "../redis";

createRoom(12, 0, 0);

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

      const { server_board, client_board } = room;

      const tile = returnTile("Rick Ashley", server_board, client_board, x, y);
      const room_id = `roomId/${room.roomId}`;

      await redis.set(room_id, { server_board, client_board, roomId });

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

      const room_id = `roomId/${room.roomId}`;
      const { server_board, client_board } = room;
      const tile = client_board[x][y];

      if (tile !== UNKNOWN_TILE && tile !== FLAGGED_TILE) {
        socket.emit("error", "Tile cannot be flagged");
        return;
      }

      const is_flagged = tile === UNKNOWN_TILE;
      const new_tile = is_flagged ? FLAGGED_TILE : UNKNOWN_TILE;

      console.log(`Hi its old me: ${tile}`);
      console.log(`Hi its me: ${new_tile}`);

      client_board[x][y] = new_tile;

      console.log(client_board[x][y]);
      console.log(room["client_board"][x][y]);

      await redis.set(room_id, {
        server_board,
        client_board,
        roomId,
      });

      console.log(room.roomId);

      io.to(room_id).emit("board_updated", [x, y, new_tile]);
    });
  });
}
