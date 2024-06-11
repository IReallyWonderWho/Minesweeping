import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import multiplayer from "./dist/multiplayer.js";

import { handler } from "./build/handler.js";

// It might not be the best idea to use javascript for a server
// due to potential performance issues, but if that comes to pass
// we can try switching to rust i suppose
const port = 3000;
const app = express();
const server = createServer(app);

const io = new Server(server);

multiplayer(io);

// SvelteKit should handle everything else using Express middleware
// https://github.com/sveltejs/kit/tree/master/packages/adapter-node#custom-server
app.use(handler);

server.listen(port);
