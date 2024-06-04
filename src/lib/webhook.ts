import { goto } from "$app/navigation";
import { io } from "socket.io-client";

export const socket = io();
export let connected = false;

// Websockets are going to be the end of me (not fake)

socket.on("error", (msg) => {
  console.log(msg);
  connected = false;
});

socket.on("joined_room", (roomId) => {
  connected = true;
  goto(`/playing?roomId=${roomId}`);
});
