import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import type { RequestHandler } from "./$types";
import { MINE_TILE, returnTile, didGameEnd } from "$lib/server/board";
import { getRoomData, type Room, getUser } from "$lib/server/rooms";

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_PRIVATE_API_KEY ?? "",
);

async function handleGameOver(
  roomId: string,
  userId: string,
  won: boolean,
  return_tile: any,
  server_board: Array<Array<number>>,
) {
  const channel = supabase.channel(`room:${roomId}`);
  console.log("Game over!");

  const [{ data }] = await Promise.all([
    supabase
      .from("room_players")
      .select("nickname")
      .eq("user_id", userId)
      .single(),
    supabase.from("rooms").update({
      client_board: null,
      revealed_tiles: 0,
      started: false,
    }),
    supabase.from("serverboard").delete().eq("room_id", roomId),
    supabase
      .from("flags")
      .update({
        flags: {},
      })
      .eq("room_id", roomId),
  ]);

  await channel.send({
    type: "broadcast",
    event: "gameOver",
    payload: {
      won: return_tile === undefined ? true : false,
      player: data?.nickname,
      board: server_board,
    },
  });

  await supabase.removeChannel(channel);
}

async function updateRoomState(
  roomId: string,
  room: Room,
  increment_by: number,
) {
  await supabase
    .from("rooms")
    .update({
      client_board: room.client_board,
      revealed_tiles: room.revealed_tiles + increment_by,
    })
    .eq("id", roomId);
}

type LockResult = [undefined, string] | [string, undefined];

async function lockRoom(roomId: string): Promise<LockResult> {
  const lockId = uuidv4();
  const lockDuration = "1 seconds"; // Adjust as needed

  const { data: locked, error } = await supabase.rpc("acquire_room_lock", {
    p_room_id: roomId,
    p_locked_by: lockId,
    p_lock_duration: lockDuration,
  });

  if (error) return [undefined, "Failed to aquire lock"];
  if (!locked) return [undefined, "Lock inuse"];

  return [lockId, undefined];
}

async function removeLock(roomId: string, lockId: string) {
  await supabase.rpc("release_room_lock", {
    p_room_id: roomId,
    p_locked_by: lockId,
  });
}

export const POST: RequestHandler = async ({ request }) => {
  const accessToken = request.headers.get("authorization")?.split("Bearer ")[1];
  const body = await request.json();

  const { x, y, roomId, tiles } = body;

  if (
    ((x === undefined || y === undefined) && tiles === undefined) ||
    roomId === undefined ||
    !accessToken
  )
    return new Response("Missing parameters", {
      status: 400,
    });

  let lockId: string;
  let amount = 0;

  // A locking mechanism, trying to retry 5 times before failing
  while (true) {
    const [id, error] = await lockRoom(roomId);

    if (id && !error) {
      lockId = id;
      break;
    }

    amount++;
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (amount >= 5)
      return new Response("Timed out", {
        status: 500,
      });
  }

  const [result, userResult] = await Promise.all([
    getRoomData(roomId, x, y),
    getUser(accessToken),
  ]);

  if (!result.success)
    return new Response(undefined, {
      status: 500,
    });
  if (!userResult.success)
    return new Response(undefined, {
      status: 500,
    });

  const room = result.data;

  const { userId } = userResult.data;

  const actual_tiles = tiles ?? [[x, y]];
  const return_tiles = [];
  let total = 0;

  for (const [x, y] of actual_tiles) {
    const [shouldIncrement, return_tile] = returnTile(
      room.server_board,
      room.client_board,
      x,
      y,
    );
    total += shouldIncrement ? ("x" in return_tile ? 1 : return_tile.size) : 0;

    return_tiles.push(
      "x" in return_tile
        ? JSON.stringify(return_tile)
        : JSON.stringify(Object.fromEntries(return_tile)),
    );

    if ("x" in return_tile && return_tile.state === MINE_TILE) {
      await handleGameOver(
        roomId,
        userId,
        false,
        return_tile,
        room.server_board,
      );
    }
  }

  const won = didGameEnd(
    room.client_board,
    room.revealed_tiles + total,
    room.mine_ratio,
  );

  const response = new Response(JSON.stringify(return_tiles));

  if (won) {
    await handleGameOver(roomId, userId, won, undefined, room.server_board);
  }

  Promise.all([
    updateRoomState(roomId, room, total),
    removeLock(roomId, lockId),
  ]);

  return response;
};
