import type { Server, Socket } from "socket.io";
import { getRoom } from "../rooms";

export type BaseSocketHandler = [
  socket: Socket,
  consumeRateLimit: (
    cookie_header: string | undefined,
    points: number,
  ) => Promise<true | unknown>,
];

export type withIOHandler = (
  ...args: [...BaseSocketHandler, io: Server]
) => undefined;

type SocketHandler = (...args: BaseSocketHandler) => undefined;

export const joinRoom: SocketHandler = (socket, consumeRateLimit) => {
  socket.on("join_room", async (roomId: unknown) => {
    if (!(await consumeRateLimit(socket.handshake.headers.cookie, 5))) return;
    if (typeof roomId !== "string") return;

    const room = await getRoom(roomId);

    if (room) {
      await socket.join(`roomId/${roomId}`);
      socket.emit("joined_room", roomId);
      return;
    }

    socket.emit("error", "Room not found");
  });
};
