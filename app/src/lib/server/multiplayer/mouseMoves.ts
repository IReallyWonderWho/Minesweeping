import type { BaseSocketHandler } from "./joinRoom";
import { roomExists, getPlayer } from "../rooms";
import { isSessionValid } from "./verifySession";
import type { Server } from "socket.io";

type withSessionId = (
  ...args: [
    ...BaseSocketHandler,
    io: Server,
    getSessionId: (cookie_header?: string) => string | undefined,
  ]
) => undefined;

export const mouseMoves: withSessionId = (
  socket,
  consumeRateLimit,
  io,
  getSessionId,
) => {
  socket.on("mouse_move", async (x: unknown, y: unknown) => {
    if (!(await consumeRateLimit(socket.handshake.headers.cookie ?? "", 1)))
      return;

    const roomId: unknown = socket.handshake.auth.roomId;

    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      typeof roomId !== "string"
    )
      return;

    const room_exists = await roomExists(roomId);

    if (!room_exists) {
      socket.emit("error", "Room not found");
      return;
    }

    const session_id = getSessionId(socket.handshake.headers.cookie);
    const session_valid = await isSessionValid(session_id, roomId);

    if (!session_valid) {
      socket.emit("error", "Session ID");
      return;
    }

    const player = await getPlayer(roomId, session_id!);

    if (!player) {
      socket.emit("error", "Player not found");
      return;
    }

    const { nickname, color } = player;

    io.to(`roomId/${roomId}`).emit("update_player_mouse", {
      nickname,
      color,
      x,
      y,
    });
  });
};
