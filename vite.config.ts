import { sveltekit } from "@sveltejs/kit/vite";
import { type ViteDevServer, defineConfig } from "vite";

import { Server } from "socket.io";
import { createRoom } from "./src/lib/server/rooms";

// This is for development websocket hosting
const webSocketServer = {
  name: "webSocketServer",
  async configureServer(server: ViteDevServer) {
    if (!server.httpServer) return;

    const { getRoom } = await import("./src/lib/server/rooms");
    const { returnTile } = await import("./src/lib/server/board");

    const io = new Server(server.httpServer);

    createRoom(12, 0, 0);

    io.on("connection", (socket) => {
      socket.on("join_room", (roomId) => {
        console.log(roomId);
        const room = getRoom(roomId);

        if (room) {
          socket.join(roomId);
          // Return the roomId and the client board
          socket.emit("joined_room", roomId);
          return;
        }

        socket.emit("error", "Room not found");
      });

      socket.on("get_board", (roomId) => {
        const room = getRoom(roomId);

        if (room) {
          socket.emit("post_board", room["client_board"]);
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

        const tile = returnTile(
          "Rick Ashley",
          server_board,
          client_board,
          x,
          y,
        );

        io.to(roomId).emit(
          "board_updated",
          Array.isArray(tile) ? tile : Object.fromEntries(tile),
        );
      });

      socket.on("flag_tile", ({ x, y }) => {
        // TODO sync flags across different clients
      });
    });
  },
};

export default defineConfig({
  plugins: [sveltekit(), webSocketServer],
});
