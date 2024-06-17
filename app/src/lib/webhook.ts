import { goto } from "$app/navigation";
import { io } from "socket.io-client";

export const socket = io({});
export let connected = false;

// Websockets are going to be the end of me (not fake)

socket.on("error", (msg: string) => {
  console.warn(msg);
  connected = false;
});

socket.on("joined_room", (roomId: string) => {
  connected = true;
  goto(`/playing/${roomId}`);
});

socket.on("game_ended", (won: boolean) => {
  console.log(won);
});
