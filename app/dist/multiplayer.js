var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/cookie/index.js
var require_cookie = __commonJS({
  "node_modules/cookie/index.js"(exports) {
    "use strict";
    exports.parse = parse2;
    exports.serialize = serialize;
    var __toString = Object.prototype.toString;
    var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
    function parse2(str, options) {
      if (typeof str !== "string") {
        throw new TypeError("argument str must be a string");
      }
      var obj = {};
      var opt = options || {};
      var dec = opt.decode || decode;
      var index = 0;
      while (index < str.length) {
        var eqIdx = str.indexOf("=", index);
        if (eqIdx === -1) {
          break;
        }
        var endIdx = str.indexOf(";", index);
        if (endIdx === -1) {
          endIdx = str.length;
        } else if (endIdx < eqIdx) {
          index = str.lastIndexOf(";", eqIdx - 1) + 1;
          continue;
        }
        var key = str.slice(index, eqIdx).trim();
        if (void 0 === obj[key]) {
          var val = str.slice(eqIdx + 1, endIdx).trim();
          if (val.charCodeAt(0) === 34) {
            val = val.slice(1, -1);
          }
          obj[key] = tryDecode(val, dec);
        }
        index = endIdx + 1;
      }
      return obj;
    }
    function serialize(name, val, options) {
      var opt = options || {};
      var enc = opt.encode || encode;
      if (typeof enc !== "function") {
        throw new TypeError("option encode is invalid");
      }
      if (!fieldContentRegExp.test(name)) {
        throw new TypeError("argument name is invalid");
      }
      var value = enc(val);
      if (value && !fieldContentRegExp.test(value)) {
        throw new TypeError("argument val is invalid");
      }
      var str = name + "=" + value;
      if (null != opt.maxAge) {
        var maxAge = opt.maxAge - 0;
        if (isNaN(maxAge) || !isFinite(maxAge)) {
          throw new TypeError("option maxAge is invalid");
        }
        str += "; Max-Age=" + Math.floor(maxAge);
      }
      if (opt.domain) {
        if (!fieldContentRegExp.test(opt.domain)) {
          throw new TypeError("option domain is invalid");
        }
        str += "; Domain=" + opt.domain;
      }
      if (opt.path) {
        if (!fieldContentRegExp.test(opt.path)) {
          throw new TypeError("option path is invalid");
        }
        str += "; Path=" + opt.path;
      }
      if (opt.expires) {
        var expires = opt.expires;
        if (!isDate(expires) || isNaN(expires.valueOf())) {
          throw new TypeError("option expires is invalid");
        }
        str += "; Expires=" + expires.toUTCString();
      }
      if (opt.httpOnly) {
        str += "; HttpOnly";
      }
      if (opt.secure) {
        str += "; Secure";
      }
      if (opt.partitioned) {
        str += "; Partitioned";
      }
      if (opt.priority) {
        var priority = typeof opt.priority === "string" ? opt.priority.toLowerCase() : opt.priority;
        switch (priority) {
          case "low":
            str += "; Priority=Low";
            break;
          case "medium":
            str += "; Priority=Medium";
            break;
          case "high":
            str += "; Priority=High";
            break;
          default:
            throw new TypeError("option priority is invalid");
        }
      }
      if (opt.sameSite) {
        var sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
        switch (sameSite) {
          case true:
            str += "; SameSite=Strict";
            break;
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError("option sameSite is invalid");
        }
      }
      return str;
    }
    function decode(str) {
      return str.indexOf("%") !== -1 ? decodeURIComponent(str) : str;
    }
    function encode(val) {
      return encodeURIComponent(val);
    }
    function isDate(val) {
      return __toString.call(val) === "[object Date]" || val instanceof Date;
    }
    function tryDecode(str, decode2) {
      try {
        return decode2(str);
      } catch (e) {
        return str;
      }
    }
  }
});

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
function returnTile(player, server_board, client_board, row, column) {
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
      return visited_tiles;
    }
  }
  client_board[row][column] = server_tile;
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
async function exists(key) {
  await autoConnect();
  return await client.exists(key) !== 0;
}
async function hSet(key, field, value) {
  const data = JSON.stringify(value);
  await autoConnect();
  await client.hSet(key, field, data);
}
async function hGet(key, field) {
  await autoConnect();
  const value = await client.hGet(key, field);
  if (value === void 0)
    return value;
  return JSON.parse(value);
}
async function hExists(key, field) {
  await autoConnect();
  return client.hExists(key, field);
}
async function hGetAll(key) {
  await autoConnect();
  const value = await client.hGetAll(key);
  const map = /* @__PURE__ */ new Map();
  for (const key2 in value) {
    map.set(key2, JSON.parse(value[key2]));
  }
  return map;
}
async function sAdd(key, value) {
  const data = JSON.stringify(value);
  await autoConnect();
  await client.sAdd(key, data);
}
async function del(key) {
  await autoConnect();
  await client.del(key);
}
var redis = {
  get,
  set,
  all,
  subscribe,
  exists,
  hSet,
  hExists,
  hGet,
  hGetAll,
  sAdd,
  del
};
var redis_default = redis;

// src/lib/server/rooms.ts
function setBoards(roomId, client_board, server_board) {
  redis_default.hSet(`roomId/${roomId}`, "boards", {
    server_board,
    client_board
  });
}
function getBoards(roomId) {
  return redis_default.hGet(`roomId/${roomId}`, "boards");
}
function setRevealedTiles(roomId, number_of_revealed_tiles) {
  redis_default.hSet(
    `roomId/${roomId}`,
    "number_of_revealed_tiles",
    number_of_revealed_tiles
  );
}
function getRevealedTiles(roomId) {
  return redis_default.hGet(`roomId/${roomId}`, "number_of_revealed_tiles");
}
function setStart(roomId, started) {
  redis_default.hSet(`roomId/${roomId}`, "started", started);
}
function getStarted(roomId) {
  return redis_default.hGet(`roomId/${roomId}`, "started");
}
async function playerExists(roomId, session_token) {
  return await redis_default.hExists(`roomId/${roomId}/players`, session_token);
}
async function createRoom(custom_room_id) {
  const roomId = custom_room_id ?? uuidv4();
  await Promise.allSettled([
    redis_default.del(`roomId/${roomId}/players`),
    redis_default.del(`roomId/${roomId}`)
  ]);
  setRevealedTiles(roomId, 0);
  setStart(roomId, false);
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
  setStart(roomId, true);
  setBoards(roomId, client_board, server_board);
  return {
    client_board,
    server_board
  };
}
function getRoom(roomId) {
  return redis_default.hGetAll(`roomId/${roomId}`);
}
async function roomExists(roomId) {
  return await redis_default.exists(`roomId/${roomId}`);
}

// src/lib/server/multiplayer.ts
var import_cookie = __toESM(require_cookie(), 1);

// src/lib/server/auth.ts
async function isSessionValid(roomId, session_id) {
  if (!await roomExists(roomId))
    return false;
  return playerExists(roomId, session_id);
}

// src/lib/server/multiplayer.ts
var NUMBER_OF_ROWS_COLUMNS = 12;
createRoom("Never going to give your ip");
function multiplayer(io) {
  io.use(async (socket, next) => {
    const cookies = (0, import_cookie.parse)(socket.handshake.headers.cookie ?? "");
    const session_id = cookies["SESSION_ID"];
    const roomId = socket.handshake.auth.roomId;
    if (session_id !== void 0 && typeof roomId === "string" && await isSessionValid(roomId, session_id)) {
      console.log("verified!");
      next();
    } else {
      console.log("AAAA");
      next(
        new Error(
          "Session Id is invalid. Please try rejoining the game through the menu."
        )
      );
    }
  });
  io.on("connection", (socket) => {
    socket.on("join_room", async (roomId) => {
      const room = await getRoom(roomId);
      if (room) {
        await socket.join(`roomId/${roomId}`);
        socket.emit("joined_room", roomId);
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
      const { server_board, client_board } = await getBoards(roomId) ?? await createBoardForRoom(roomId, NUMBER_OF_ROWS_COLUMNS, x, y);
      const number_of_revealed_tiles = await getRevealedTiles(roomId) ?? 0;
      const returned_tile = returnTile(
        "Rick Ashley",
        server_board,
        client_board,
        x,
        y
      );
      const increment_by = "x" in returned_tile ? 1 : returned_tile.size;
      const revealed_tiles = number_of_revealed_tiles + increment_by;
      if ("x" in returned_tile && returned_tile["state"] === -1 || didGameEnd(client_board, revealed_tiles)) {
        const by_mine = "x" in returned_tile && returned_tile["state"] === -1;
        return io.to(`roomId/${roomId}`).emit("game_ended", by_mine, "Rick Ashley");
      }
      setBoards(roomId, client_board, server_board);
      setRevealedTiles(roomId, revealed_tiles);
      io.to(`roomId/${roomId}`).emit(
        "board_updated",
        "x" in returned_tile ? returned_tile : Object.fromEntries(returned_tile)
      );
    });
    socket.on("flag_tile", async ({ x, y, roomId }) => {
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
      const { server_board, client_board } = await getBoards(roomId);
      const tile = client_board[x][y];
      if (tile !== UNKNOWN_TILE && tile !== FLAGGED_TILE) {
        socket.emit("error", "Tile cannot be flagged");
        return;
      }
      const is_flagged = tile === UNKNOWN_TILE;
      const new_tile = is_flagged ? FLAGGED_TILE : UNKNOWN_TILE;
      client_board[x][y] = new_tile;
      setBoards(roomId, client_board, server_board);
      io.to(`roomId/${roomId}`).emit("board_updated", {
        x,
        y,
        state: new_tile
      });
    });
  });
}
export {
  multiplayer as default
};
/*! Bundled license information:

cookie/index.js:
  (*!
   * cookie
   * Copyright(c) 2012-2014 Roman Shtylman
   * Copyright(c) 2015 Douglas Christopher Wilson
   * MIT Licensed
   *)
*/
