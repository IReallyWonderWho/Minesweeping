import type { Server } from "socket.io";
import { returnTile } from "./board";
import { createRoom, getRoom } from "./rooms";

createRoom(12, 0, 0);

// Uhmmmm, the room data on the server and sveltekit are completely different, so
// we need a layer to actually synchronize them
export default function multiplayer(io: Server) {
  io.on("connection", (socket) => {
    socket.on("join_room", (roomId) => {
      console.log(roomId);
      const room = getRoom(roomId);

      if (room) {
        socket.join(roomId);
        socket.emit("joined_room", roomId);
        return;
      }

      socket.emit("error", "Room not found");
    });

    socket.on("choose_tile", ({ x, y, roomId }) => {
      const room = getRoom(roomId);

      console.log(room);
      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }

      const { server_board, client_board } = room;

      const tile = returnTile("Rick Ashley", server_board, client_board, x, y);

      io.to(roomId).emit(
        "board_updated",
        Array.isArray(tile) ? tile : Object.fromEntries(tile),
      );
    });

    socket.on("flag_tile", ({ x, y }) => {
      // TODO sync flags across different clients
    });
  });
}
