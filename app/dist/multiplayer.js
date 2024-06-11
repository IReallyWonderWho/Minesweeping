// src/lib/server/board.ts
var FLAGGED_TILE = -3;
var UNKNOWN_TILE = -2;
var MINE_TILE = -1;
var ZERO_TILE = 0;
var TILE_TO_MINE_RATIO = 6;
function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}
function deepCopy(object) {
  const copy = JSON.stringify(object);
  return JSON.parse(copy);
}
function isNeighbor(row, column, other_row, other_column) {
  if (Math.abs(row - other_row) <= 1 && Math.abs(column - other_column) <= 1) {
    return true;
  }
  return false;
}
function getNeighbors(board, row, column) {
  const neighbors = [];
  for (let x = -1; x < 2; x++) {
    for (let y = -1; y < 2; y++) {
      if (x === 0 && y === 0)
        continue;
      const _row = board[row + x];
      if (_row === void 0)
        continue;
      const _column = _row[column + y];
      if (_column === void 0)
        continue;
      neighbors.push([_column, row + x, column + y]);
    }
  }
  return neighbors;
}
function computeBoard(board, number_of_rows_columns) {
  for (let x = 0; x < number_of_rows_columns; x++) {
    for (let y = 0; y < number_of_rows_columns; y++) {
      const tile = board[x][y];
      if (tile === MINE_TILE)
        continue;
      let surrounding_bombs = 0;
      for (const [neighbor] of getNeighbors(board, x, y)) {
        if (neighbor === MINE_TILE) {
          surrounding_bombs++;
        }
      }
      board[x][y] = surrounding_bombs;
    }
  }
}
function generateSolvedBoard(number_of_rows_columns, safe_row, safe_column) {
  const server_board = [];
  const number_of_tiles = number_of_rows_columns ** 2;
  let number_of_mines = Math.floor(number_of_tiles / TILE_TO_MINE_RATIO);
  for (let x = 0; x < number_of_rows_columns; x++) {
    const row = [];
    for (let y = 0; y < number_of_rows_columns; y++) {
      row.push(UNKNOWN_TILE);
    }
    server_board.push(row);
  }
  const client_board = deepCopy(server_board);
  while (number_of_mines > 0) {
    const random_row = getRandomInt(0, number_of_rows_columns);
    const random_column = getRandomInt(0, number_of_rows_columns);
    if (server_board[random_row][random_column] === UNKNOWN_TILE && !(random_row === safe_row && random_column === safe_column) && !isNeighbor(safe_row, safe_column, random_row, random_column)) {
      server_board[random_row][random_column] = MINE_TILE;
      number_of_mines--;
    }
  }
  computeBoard(server_board, number_of_rows_columns);
  return [server_board, client_board];
}
function returnTile(player, server_board, client_board, current_revealed_tiles, row, column) {
  const client_tile = client_board[row][column];
  const server_tile = server_board[row][column];
  if (client_tile !== UNKNOWN_TILE) {
    return {
      x: row,
      y: column,
      state: client_tile
    };
  }
  switch (server_tile) {
    case ZERO_TILE: {
      const visited_tiles = /* @__PURE__ */ new Map();
      massReveal(server_board, client_board, row, column, visited_tiles);
      current_revealed_tiles += visited_tiles.size;
      if (didGameEnd(server_board, current_revealed_tiles)) {
        console.log("Yay you won!!");
      }
      return visited_tiles;
    }
    case MINE_TILE: {
      client_board[row][column] = server_tile;
      gameOver(true, player, row, column);
    }
  }
  client_board[row][column] = server_tile;
  current_revealed_tiles += 1;
  if (didGameEnd(server_board, current_revealed_tiles)) {
    gameOver(false, player, row, column);
  }
  return {
    x: row,
    y: column,
    state: server_tile
  };
}
function didGameEnd(board, number_of_revealed_tiles) {
  const number_of_tiles = board.length ** 2;
  const number_of_mines = Math.floor(number_of_tiles / TILE_TO_MINE_RATIO);
  const number_of_remaining_tiles = number_of_tiles - number_of_mines;
  return number_of_remaining_tiles === number_of_revealed_tiles;
}
function gameOver(caused_by_bomb, player, row, column) {
  console.log("I think the game is over ngl");
}
function massReveal(server_board, client_board, row, column, visited_tiles) {
  let id = `${row},${column}`;
  if (visited_tiles.has(id))
    return;
  if (client_board[row][column] !== UNKNOWN_TILE)
    return;
  visited_tiles.set(id, server_board[row][column]);
  client_board[row][column] = server_board[row][column];
  if (server_board[row][column] !== ZERO_TILE)
    return;
  for (const [_neighbor, x, y] of getNeighbors(server_board, row, column)) {
    if (!visited_tiles.has(`${x},${y}`)) {
      massReveal(server_board, client_board, x, y, visited_tiles);
    }
  }
}

// src/lib/server/rooms.ts
import { v4 as uuidv4 } from "uuid";

// src/lib/redis.ts
import { createClient } from "redis";
var redisHost = process.env.REDIS_HOST || "localhost";
var redisPort = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;
var client = createClient({
  socket: {
    host: redisHost,
    port: redisPort
  }
});
var connectPromise;
var errorOnce = true;
async function autoConnect() {
  if (!connectPromise) {
    errorOnce = true;
    connectPromise = new Promise((resolve, reject) => {
      client.once("error", (err) => reject(new Error(`Redis: ${err.message}`)));
      client.connect().then(() => resolve(), reject);
    });
  }
  await connectPromise;
}
client.on("error", (err) => {
  if (errorOnce) {
    console.error("Redis:", err);
    errorOnce = false;
  }
});
client.on("connect", () => {
  console.log("Redis up");
});
client.on("disconnect", () => {
  connectPromise = void 0;
  console.log("Redis down");
});
async function get(key, fallback) {
  await autoConnect();
  const value = await client.get(key);
  if (value === null) {
    return fallback;
  }
  return JSON.parse(value);
}
async function set(key, value, options) {
  const data = JSON.stringify(value);
  const config = options ? { EX: options.ttl } : {};
  await autoConnect();
  await client.set(key, data, config);
  client.publish(key, data);
}
async function all(query) {
  await autoConnect();
  const keys = await client.keys(query);
  const values = await Promise.all(keys.map((key) => get(key)));
  return values.filter((value) => typeof value !== "undefined");
}
function subscribe(channel, next, error) {
  const wrapped = (data) => {
    next(JSON.parse(data));
  };
  let aborted = false;
  let unsubscribe = () => {
    aborted = true;
  };
  function onError(err) {
    if (!error) {
      throw err;
    }
    error(err);
  }
  const subscriber = createClient({
    socket: {
      host: redisHost,
      port: redisPort
    }
  });
  subscriber.connect().then(() => {
    if (aborted) {
      return;
    }
    let once = true;
    subscriber.on("error", (err) => {
      if (once) {
        once = false;
        onError(err);
      }
    });
    if (channel.endsWith("*")) {
      subscriber.pSubscribe(channel, wrapped);
      unsubscribe = () => subscriber.pUnsubscribe(channel, wrapped);
    } else {
      subscriber.subscribe(channel, wrapped);
      unsubscribe = () => subscriber.unsubscribe(channel, wrapped);
    }
  }).catch(onError);
  return () => unsubscribe();
}
var redis = {
  get,
  set,
  all,
  subscribe
};
var redis_default = redis;

// src/lib/server/rooms.ts
async function createRoom(custom_room_id) {
  const roomId = custom_room_id ?? uuidv4();
  const room = {
    server_board: void 0,
    client_board: void 0,
    number_of_revealed_tiles: 0,
    roomId,
    started: false
  };
  await redis_default.set(`roomId/${roomId}`, room);
  return { roomId };
}
async function createBoardForRoom(roomId, number_of_rows_columns, safe_row, safe_column) {
  const room = await getRoom(roomId);
  if (!room)
    throw "Room not found";
  console.log("generating boards!");
  const [server_board, client_board] = generateSolvedBoard(
    number_of_rows_columns,
    safe_row,
    safe_column
  );
  const room_body = {
    server_board,
    client_board,
    roomId,
    number_of_revealed_tiles: 0,
    started: true
  };
  console.log(JSON.stringify(room_body));
  await redis_default.set(`roomId/${roomId}`, room_body);
  return room_body;
}
function getRoom(roomId) {
  return redis_default.get(`roomId/${roomId}`);
}

// src/lib/server/multiplayer.ts
var NUMBER_OF_ROWS_COLUMNS = 12;
createRoom("Never going to give your ip");
function multiplayer(io) {
  redis_default.subscribe("room/*", (room) => {
    io.to(`roomId/${room.roomId}`).emit(`roomId/${room.roomId}`, room);
  });
  io.on("connection", (socket) => {
    socket.on("join_room", async (roomId) => {
      const room = await getRoom(roomId);
      if (room) {
        await socket.join(`roomId/${roomId}`);
        socket.emit("joined_room", room.roomId);
        return;
      }
      socket.emit("error", "Room not found");
    });
    socket.on("choose_tile", async ({ x, y, roomId }) => {
      const room = await getRoom(roomId);
      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }
      const { server_board, client_board } = room.started ? room : await createBoardForRoom(room.roomId, NUMBER_OF_ROWS_COLUMNS, x, y);
      const returned_tile = returnTile(
        "Rick Ashley",
        server_board,
        client_board,
        room.number_of_revealed_tiles,
        x,
        y
      );
      const room_id = `roomId/${room.roomId}`;
      const increment_by = "x" in returned_tile ? 1 : returned_tile.size;
      await redis_default.set(room_id, {
        server_board,
        client_board,
        roomId,
        number_of_revealed_tiles: room.number_of_revealed_tiles + increment_by,
        started: true
      });
      io.to(room_id).emit(
        "board_updated",
        "x" in returned_tile ? returned_tile : Object.fromEntries(returned_tile)
      );
    });
    socket.on("flag_tile", async ({ x, y, roomId }) => {
      const room = await getRoom(roomId);
      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }
      if (!room.started) {
        socket.emit("error", "Room boards haven't been initalized yet");
        return;
      }
      const room_id = `roomId/${room.roomId}`;
      const { server_board, client_board } = room;
      const tile = client_board[x][y];
      if (tile !== UNKNOWN_TILE && tile !== FLAGGED_TILE) {
        socket.emit("error", "Tile cannot be flagged");
        return;
      }
      const is_flagged = tile === UNKNOWN_TILE;
      const new_tile = is_flagged ? FLAGGED_TILE : UNKNOWN_TILE;
      client_board[x][y] = new_tile;
      await redis_default.set(room_id, {
        server_board,
        client_board,
        roomId,
        started: room.started,
        number_of_revealed_tiles: room.number_of_revealed_tiles
      });
      io.to(room_id).emit("board_updated", { x, y, state: new_tile });
    });
  });
}
export {
  multiplayer as default
};
