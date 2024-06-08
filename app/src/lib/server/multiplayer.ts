import type { Server } from "socket.io";
import { returnTile } from "./board";
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

      redis.set(room_id, { server_board, client_board, roomId });

      io.to(room_id).emit(
        "board_updated",
        Array.isArray(tile) ? tile : Object.fromEntries(tile),
      );
    });

    socket.on("flag_tile", ({ x, y }) => {
      // TODO sync flags across different clients
    });
  });
}
