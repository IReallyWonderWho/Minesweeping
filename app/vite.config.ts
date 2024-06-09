import { sveltekit } from "@sveltejs/kit/vite";
import { type ViteDevServer, defineConfig } from "vite";
import { Server } from "socket.io";

// This is for development websocket hosting
const webSocketServer = {
  name: "webSocketServer",
  async configureServer(server: ViteDevServer) {
    import("./dist/multiplayer").then(({ default: multiplayer }) => {
      multiplayer(new Server(server.httpServer));
    });
  },
};

export default defineConfig({
  plugins: [sveltekit(), webSocketServer],
});
