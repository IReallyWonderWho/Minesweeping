import { Socket, io } from "socket.io-client";

let socket: Socket | undefined;

export function getSocket(roomId: string) {
  if (!socket) {
    /* socket = io({
      withCredentials: true,
      auth: {
        roomId,
      },
      }); */
    socket = io("ws://localhost:3000", {
      withCredentials: true,
      auth: {
        roomId,
      },
    });
  }

  return socket;
}

export let connected = false;
