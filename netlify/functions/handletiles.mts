import type { Handler } from "@netlify/functions";
import { SupabaseClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import {
  generateSolvedBoard,
  MINE_TILE,
  returnTile,
  didGameEnd,
} from "../lib/board";
import cookie from "cookie";

const supabase = new SupabaseClient(
  process.env.PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_PRIVATE_API_KEY ?? "",
);

interface Room {
  client_board: Array<Array<number>>;
  server_board: Array<Array<number>>;
  revealed_tiles: number;
  players: Record<string, string>;
  rows_columns: number;
  mine_ratio: number;
}

type SuccessResult = {
  success: true;
  data: Room;
};

type ErrorResult = {
  success: false;
  error: {
    statusCode: number;
  };
};

type GetRoomDataResult = SuccessResult | ErrorResult;

async function getRoomData(
  roomId: string,
  x: number,
  y: number,
): Promise<GetRoomDataResult> {
  const { data, error } = await supabase
    .from("rooms")
    .select(
      "client_board, revealed_tiles, rows_columns, mine_ratio, started, players, serverboard(server_board)",
    )
    .eq("id", roomId)
    .single();

  if (error) return { success: false, error: { statusCode: 500 } };
  if (!data.started) return { success: false, error: { statusCode: 404 } };

  let client_board = data.client_board;
  // @ts-ignore
  let server_board = data.serverboard?.server_board;

  if (!client_board || !server_board) {
    const [server, client] = generateSolvedBoard(
      data.rows_columns,
      x,
      y,
      data.mine_ratio,
    );

    client_board = client;
    server_board = server;

    await Promise.all([
      supabase.from("serverboard").upsert({
        room_id: roomId,
        server_board,
      }),
      supabase
        .from("rooms")
        .update({
          client_board,
          revealed_tiles: 0,
          flags: {},
        })
        .eq("id", roomId),
    ]);
  }

  return {
    success: true,
    data: {
      client_board,
      server_board,
      revealed_tiles: data.revealed_tiles,
      players: data.players,
      rows_columns: data.rows_columns,
      mine_ratio: data.mine_ratio,
    },
  };
}

type UserSuccess = {
  success: true;
  data: {
    headers?: Record<string, any>;
    userId: string;
  };
};

type UserError = {
  success: false;
  error: {
    statusCode: number;
    body?: string;
  };
};

type GetUserDataResult = UserSuccess | UserError;

/**
    Used to check if an user is authenticated and return the User Id if authenticated
*/
async function getUser(
  session: string | undefined,
  accessToken: string,
  room: Room,
): Promise<GetUserDataResult> {
  if (!session || !room.players[session]) {
    const { data: userData, error } = await supabase.auth.getUser(accessToken);

    if (error || !userData.user) {
      return {
        success: false,
        error: {
          statusCode: 401,
          body: JSON.stringify({ error: "Invalid token" }),
        },
      };
    }

    session = uuidv4();
    room.players[session] = userData.user.id;

    return {
      success: true,
      data: {
        headers: {
          "Set-Cookie": cookie.serialize("Session", session, {
            httpOnly: true,
            secure: true,
            path: "/",
          }),
        },
        userId: userData.user.id,
      },
    };
  }

  return {
    success: true,
    data: {
      userId: room.players[session],
    },
  };
}

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
      flags: {},
      started: false,
      players: {},
    }),
    supabase.from("serverboard").delete().eq("room_id", roomId),
  ]);

  await channel.send({
    type: "broadcast",
    event: "gameOver",
    payload: {
      won: return_tile["state"] === MINE_TILE ? false : won,
      player: data?.nickname,
      board: server_board,
    },
  });

  await supabase.removeChannel(channel);
}

export const handler: Handler = async (event, context) => {
  const body = JSON.parse(event.body ?? "");
  const accessToken = event.headers.authorization?.split("Bearer ")[1];

  let { Session } = cookie.parse(event.headers.cookie ?? "");

  const { x, y, roomId } = body;

  if (
    x === undefined ||
    y === undefined ||
    roomId === undefined ||
    !accessToken
  )
    return {
      statusCode: 400,
    };

  const result = await getRoomData(roomId, x, y);

  if (!result.success) return result.error;

  const room = result.data;

  let userResult = await getUser(Session, accessToken, room);

  if (!userResult.success) return userResult.error;

  const { headers, userId } = userResult.data;

  const [shouldIncrement, return_tile] = returnTile(
    room.server_board,
    room.client_board,
    x,
    y,
  );
  const increment_by = shouldIncrement
    ? "x" in return_tile
      ? 1
      : return_tile.size
    : 0;

  const won = didGameEnd(
    room.client_board,
    room.revealed_tiles + increment_by,
    room.mine_ratio,
  );

  const response = {
    body:
      "x" in return_tile
        ? JSON.stringify(return_tile)
        : JSON.stringify(Object.fromEntries(return_tile)),
    statusCode: 200,
    headers,
  };

  if (won || ("x" in return_tile && return_tile.state === MINE_TILE)) {
    await handleGameOver(roomId, userId, won, return_tile, room.server_board);
  }

  Promise.all([
    supabase.rpc("update_room_with_concurrency_check", {
      p_room_id: roomId,
      p_client_board: room.client_board,
      p_revealed_tiles: room.revealed_tiles + increment_by,
      p_players: room.players,
    }),
  ]).catch((error) => console.error("Background update failed:", error));

  return response;
};
