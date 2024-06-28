import {
  createBoardForRoom,
  getBoards,
  getRevealedTiles,
  getRoom,
  setBoards,
  setRevealedTiles,
  roomExists,
  getStarted,
  getPlayer,
} from "../rooms";
import { returnTile, didGameEnd, UNKNOWN_TILE, FLAGGED_TILE } from "../board";
import type { withSessionId } from "./mouseMoves";
import { isSessionValid } from "./verifySession";
import { NUMBER_OF_ROWS_COLUMNS } from "$lib/sharedExpectations";

export const handleTiles: withSessionId = (
  socket,
  consumeRateLimit,
  io,
  getSessionId,
) => {
  socket.on("choose_tile", async (x: unknown, y: unknown) => {
    if (!(await consumeRateLimit(socket.handshake.headers.cookie, 1))) return;

    const roomId: unknown = socket.handshake.auth.roomId;

    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      typeof roomId !== "string"
    )
      return;
    const room = await getRoom(roomId);

    if (!room) {
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

    // Generate the boards if the board hasn't been initalized yet
    // using x and y as the safe coordinates
    const { server_board, client_board } =
      (await getBoards(roomId)) ??
      (await createBoardForRoom(roomId, NUMBER_OF_ROWS_COLUMNS, x, y));
    const number_of_revealed_tiles = (await getRevealedTiles(roomId)) ?? 0;

    const returned_tile = returnTile(
      "Rick Ashley",
      server_board!,
      client_board!,
      x,
      y,
    );

    const increment_by = "x" in returned_tile ? 1 : returned_tile.size;
    const revealed_tiles = number_of_revealed_tiles + increment_by;

    if (
      ("x" in returned_tile && returned_tile["state"] === -1) ||
      didGameEnd(client_board, revealed_tiles)
    ) {
      const by_mine = "x" in returned_tile && returned_tile["state"] === -1;

      return io
        .to(`roomId/${roomId}`)
        .emit("game_ended", by_mine, player?.nickname);
    }

    setBoards(roomId, client_board, server_board);
    setRevealedTiles(roomId, revealed_tiles);

    // console.log(new Map().constructor == Object) // False
    // console.log({ "a": "hi" }.constructor == Object) // True
    io.to(`roomId/${roomId}`).emit(
      "board_updated",
      "x" in returned_tile ? returned_tile : Object.fromEntries(returned_tile),
    );
  });

  socket.on("flag_tile", async (x: unknown, y: unknown) => {
    if (!(await consumeRateLimit(socket.handshake.headers.cookie, 1))) return;

    const roomId: unknown = socket.handshake.auth.roomId;

    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      typeof roomId !== "string"
    )
      return;

    const room = await roomExists(roomId);

    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }

    const started = await getStarted(roomId);

    if (!started) {
      socket.emit("error", "Room boards haven't been initalized yet");
      return;
    }

    const { server_board, client_board } = (await getBoards(roomId)) as {
      server_board: any;
      client_board: any;
    };
    const tile = client_board![x][y];

    if (tile !== UNKNOWN_TILE && tile !== FLAGGED_TILE) {
      socket.emit("error", "Tile cannot be flagged");
      return;
    }

    const is_flagged = tile === UNKNOWN_TILE;
    const new_tile = is_flagged ? FLAGGED_TILE : UNKNOWN_TILE;

    client_board![x][y] = new_tile;

    setBoards(roomId, client_board, server_board);

    io.to(`roomId/${roomId}`).emit("board_updated", {
      x,
      y,
      state: new_tile,
    });
  });
};
