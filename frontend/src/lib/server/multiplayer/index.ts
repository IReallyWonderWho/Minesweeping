import type { Server } from "socket.io";
// @ts-ignore
import RateLimiterMemory from "rate-limiter-flexible/lib/RateLimiterMemory.js";
import { createRoom } from "../rooms";
import { parse } from "cookie";
import { isSessionValid } from "./verifySession";
import { joinRoom } from "./joinRoom";
import { handleTiles } from "./handleTiles";
import { mouseMoves } from "./mouseMoves";

const rateLimiter = new RateLimiterMemory({
  points: 25,
  duration: 1,
});

createRoom("Never going to give your ip");

function getSessionId(cookie_header: string | undefined) {
  const cookies = parse(cookie_header ?? "");

  return cookies["SESSION_ID"];
}

async function consumeRateLimit(
  cookie_header: string | undefined,
  points: number,
): Promise<true | unknown> {
  try {
    const session_id = getSessionId(cookie_header);

    if (!session_id) return false;

    await rateLimiter.consume(session_id, points);

    return true;
  } catch (error) {
    console.warn(error);
    return false;
  }
}

// The room data on the server and sveltekit are completely different, so
// we need a layer to actually synchronize them
// in this case we're using redis
function multiplayer(io: Server) {
  /* redis.subscribe("room/*", (room: Room) => {
    io.to(`roomId/${room.roomId}`).emit(
      `roomId/${room.roomId}`,
      room["client_board"],
    );
    }); */
  console.log("WHAT THE SIGMA");
  io.use(async (socket, next) => {
    const session_id = getSessionId(socket.handshake.headers.cookie);
    const roomId: unknown = socket.handshake.auth.roomId;

    if (await isSessionValid(session_id, roomId)) {
      next();
    } else {
      next(
        new Error(
          "Session Id is invalid. Please try rejoining the game through the menu.",
        ),
      );
    }
  });

  io.on("connection", (socket) => {
    joinRoom(socket, consumeRateLimit);
    handleTiles(socket, consumeRateLimit, io, getSessionId);
    mouseMoves(socket, consumeRateLimit, io, getSessionId);
  });
}
