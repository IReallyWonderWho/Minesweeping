import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import multiplayer from "./dist/multiplayer";

import { handler } from "./build/handler.js";

const port = 3000;
const app = express();
const server = createServer(app);

const io = new Server(server);

multiplayer(io);

// SvelteKit should handle everything else using Express middleware
// https://github.com/sveltejs/kit/tree/master/packages/adapter-node#custom-server
app.use(handler);

server.listen(port);
