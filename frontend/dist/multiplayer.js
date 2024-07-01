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

// node_modules/rate-limiter-flexible/lib/RateLimiterAbstract.js
var require_RateLimiterAbstract = __commonJS({
  "node_modules/rate-limiter-flexible/lib/RateLimiterAbstract.js"(exports, module) {
    module.exports = class RateLimiterAbstract {
      /**
       *
       * @param opts Object Defaults {
       *   points: 4, // Number of points
       *   duration: 1, // Per seconds
       *   blockDuration: 0, // Block if consumed more than points in current duration for blockDuration seconds
       *   execEvenly: false, // Execute allowed actions evenly over duration
       *   execEvenlyMinDelayMs: duration * 1000 / points, // ms, works with execEvenly=true option
       *   keyPrefix: 'rlflx',
       * }
       */
      constructor(opts = {}) {
        this.points = opts.points;
        this.duration = opts.duration;
        this.blockDuration = opts.blockDuration;
        this.execEvenly = opts.execEvenly;
        this.execEvenlyMinDelayMs = opts.execEvenlyMinDelayMs;
        this.keyPrefix = opts.keyPrefix;
      }
      get points() {
        return this._points;
      }
      set points(value) {
        this._points = value >= 0 ? value : 4;
      }
      get duration() {
        return this._duration;
      }
      set duration(value) {
        this._duration = typeof value === "undefined" ? 1 : value;
      }
      get msDuration() {
        return this.duration * 1e3;
      }
      get blockDuration() {
        return this._blockDuration;
      }
      set blockDuration(value) {
        this._blockDuration = typeof value === "undefined" ? 0 : value;
      }
      get msBlockDuration() {
        return this.blockDuration * 1e3;
      }
      get execEvenly() {
        return this._execEvenly;
      }
      set execEvenly(value) {
        this._execEvenly = typeof value === "undefined" ? false : Boolean(value);
      }
      get execEvenlyMinDelayMs() {
        return this._execEvenlyMinDelayMs;
      }
      set execEvenlyMinDelayMs(value) {
        this._execEvenlyMinDelayMs = typeof value === "undefined" ? Math.ceil(this.msDuration / this.points) : value;
      }
      get keyPrefix() {
        return this._keyPrefix;
      }
      set keyPrefix(value) {
        if (typeof value === "undefined") {
          value = "rlflx";
        }
        if (typeof value !== "string") {
          throw new Error("keyPrefix must be string");
        }
        this._keyPrefix = value;
      }
      _getKeySecDuration(options = {}) {
        return options && options.customDuration >= 0 ? options.customDuration : this.duration;
      }
      getKey(key) {
        return this.keyPrefix.length > 0 ? `${this.keyPrefix}:${key}` : key;
      }
      parseKey(rlKey) {
        return rlKey.substring(this.keyPrefix.length);
      }
      consume() {
        throw new Error("You have to implement the method 'consume'!");
      }
      penalty() {
        throw new Error("You have to implement the method 'penalty'!");
      }
      reward() {
        throw new Error("You have to implement the method 'reward'!");
      }
      get() {
        throw new Error("You have to implement the method 'get'!");
      }
      set() {
        throw new Error("You have to implement the method 'set'!");
      }
      block() {
        throw new Error("You have to implement the method 'block'!");
      }
      delete() {
        throw new Error("You have to implement the method 'delete'!");
      }
    };
  }
});

// node_modules/rate-limiter-flexible/lib/component/MemoryStorage/Record.js
var require_Record = __commonJS({
  "node_modules/rate-limiter-flexible/lib/component/MemoryStorage/Record.js"(exports, module) {
    module.exports = class Record {
      /**
       *
       * @param value int
       * @param expiresAt Date|int
       * @param timeoutId
       */
      constructor(value, expiresAt, timeoutId = null) {
        this.value = value;
        this.expiresAt = expiresAt;
        this.timeoutId = timeoutId;
      }
      get value() {
        return this._value;
      }
      set value(value) {
        this._value = parseInt(value);
      }
      get expiresAt() {
        return this._expiresAt;
      }
      set expiresAt(value) {
        if (!(value instanceof Date) && Number.isInteger(value)) {
          value = new Date(value);
        }
        this._expiresAt = value;
      }
      get timeoutId() {
        return this._timeoutId;
      }
      set timeoutId(value) {
        this._timeoutId = value;
      }
    };
  }
});

// node_modules/rate-limiter-flexible/lib/RateLimiterRes.js
var require_RateLimiterRes = __commonJS({
  "node_modules/rate-limiter-flexible/lib/RateLimiterRes.js"(exports, module) {
    module.exports = class RateLimiterRes {
      constructor(remainingPoints, msBeforeNext, consumedPoints, isFirstInDuration) {
        this.remainingPoints = typeof remainingPoints === "undefined" ? 0 : remainingPoints;
        this.msBeforeNext = typeof msBeforeNext === "undefined" ? 0 : msBeforeNext;
        this.consumedPoints = typeof consumedPoints === "undefined" ? 0 : consumedPoints;
        this.isFirstInDuration = typeof isFirstInDuration === "undefined" ? false : isFirstInDuration;
      }
      get msBeforeNext() {
        return this._msBeforeNext;
      }
      set msBeforeNext(ms) {
        this._msBeforeNext = ms;
        return this;
      }
      get remainingPoints() {
        return this._remainingPoints;
      }
      set remainingPoints(p) {
        this._remainingPoints = p;
        return this;
      }
      get consumedPoints() {
        return this._consumedPoints;
      }
      set consumedPoints(p) {
        this._consumedPoints = p;
        return this;
      }
      get isFirstInDuration() {
        return this._isFirstInDuration;
      }
      set isFirstInDuration(value) {
        this._isFirstInDuration = Boolean(value);
      }
      _getDecoratedProperties() {
        return {
          remainingPoints: this.remainingPoints,
          msBeforeNext: this.msBeforeNext,
          consumedPoints: this.consumedPoints,
          isFirstInDuration: this.isFirstInDuration
        };
      }
      [Symbol.for("nodejs.util.inspect.custom")]() {
        return this._getDecoratedProperties();
      }
      toString() {
        return JSON.stringify(this._getDecoratedProperties());
      }
      toJSON() {
        return this._getDecoratedProperties();
      }
    };
  }
});

// node_modules/rate-limiter-flexible/lib/component/MemoryStorage/MemoryStorage.js
var require_MemoryStorage = __commonJS({
  "node_modules/rate-limiter-flexible/lib/component/MemoryStorage/MemoryStorage.js"(exports, module) {
    var Record = require_Record();
    var RateLimiterRes = require_RateLimiterRes();
    module.exports = class MemoryStorage {
      constructor() {
        this._storage = {};
      }
      incrby(key, value, durationSec) {
        if (this._storage[key]) {
          const msBeforeExpires = this._storage[key].expiresAt ? this._storage[key].expiresAt.getTime() - (/* @__PURE__ */ new Date()).getTime() : -1;
          if (!this._storage[key].expiresAt || msBeforeExpires > 0) {
            this._storage[key].value = this._storage[key].value + value;
            return new RateLimiterRes(0, msBeforeExpires, this._storage[key].value, false);
          }
          return this.set(key, value, durationSec);
        }
        return this.set(key, value, durationSec);
      }
      set(key, value, durationSec) {
        const durationMs = durationSec * 1e3;
        if (this._storage[key] && this._storage[key].timeoutId) {
          clearTimeout(this._storage[key].timeoutId);
        }
        this._storage[key] = new Record(
          value,
          durationMs > 0 ? new Date(Date.now() + durationMs) : null
        );
        if (durationMs > 0) {
          this._storage[key].timeoutId = setTimeout(() => {
            delete this._storage[key];
          }, durationMs);
          if (this._storage[key].timeoutId.unref) {
            this._storage[key].timeoutId.unref();
          }
        }
        return new RateLimiterRes(0, durationMs === 0 ? -1 : durationMs, this._storage[key].value, true);
      }
      /**
       *
       * @param key
       * @returns {*}
       */
      get(key) {
        if (this._storage[key]) {
          const msBeforeExpires = this._storage[key].expiresAt ? this._storage[key].expiresAt.getTime() - (/* @__PURE__ */ new Date()).getTime() : -1;
          return new RateLimiterRes(0, msBeforeExpires, this._storage[key].value, false);
        }
        return null;
      }
      /**
       *
       * @param key
       * @returns {boolean}
       */
      delete(key) {
        if (this._storage[key]) {
          if (this._storage[key].timeoutId) {
            clearTimeout(this._storage[key].timeoutId);
          }
          delete this._storage[key];
          return true;
        }
        return false;
      }
    };
  }
});

// node_modules/rate-limiter-flexible/lib/RateLimiterMemory.js
var require_RateLimiterMemory = __commonJS({
  "node_modules/rate-limiter-flexible/lib/RateLimiterMemory.js"(exports, module) {
    var RateLimiterAbstract = require_RateLimiterAbstract();
    var MemoryStorage = require_MemoryStorage();
    var RateLimiterRes = require_RateLimiterRes();
    var RateLimiterMemory2 = class extends RateLimiterAbstract {
      constructor(opts = {}) {
        super(opts);
        this._memoryStorage = new MemoryStorage();
      }
      /**
       *
       * @param key
       * @param pointsToConsume
       * @param {Object} options
       * @returns {Promise<RateLimiterRes>}
       */
      consume(key, pointsToConsume = 1, options = {}) {
        return new Promise((resolve, reject) => {
          const rlKey = this.getKey(key);
          const secDuration = this._getKeySecDuration(options);
          let res = this._memoryStorage.incrby(rlKey, pointsToConsume, secDuration);
          res.remainingPoints = Math.max(this.points - res.consumedPoints, 0);
          if (res.consumedPoints > this.points) {
            if (this.blockDuration > 0 && res.consumedPoints <= this.points + pointsToConsume) {
              res = this._memoryStorage.set(rlKey, res.consumedPoints, this.blockDuration);
            }
            reject(res);
          } else if (this.execEvenly && res.msBeforeNext > 0 && !res.isFirstInDuration) {
            let delay = Math.ceil(res.msBeforeNext / (res.remainingPoints + 2));
            if (delay < this.execEvenlyMinDelayMs) {
              delay = res.consumedPoints * this.execEvenlyMinDelayMs;
            }
            setTimeout(resolve, delay, res);
          } else {
            resolve(res);
          }
        });
      }
      penalty(key, points = 1, options = {}) {
        const rlKey = this.getKey(key);
        return new Promise((resolve) => {
          const secDuration = this._getKeySecDuration(options);
          const res = this._memoryStorage.incrby(rlKey, points, secDuration);
          res.remainingPoints = Math.max(this.points - res.consumedPoints, 0);
          resolve(res);
        });
      }
      reward(key, points = 1, options = {}) {
        const rlKey = this.getKey(key);
        return new Promise((resolve) => {
          const secDuration = this._getKeySecDuration(options);
          const res = this._memoryStorage.incrby(rlKey, -points, secDuration);
          res.remainingPoints = Math.max(this.points - res.consumedPoints, 0);
          resolve(res);
        });
      }
      /**
       * Block any key for secDuration seconds
       *
       * @param key
       * @param secDuration
       */
      block(key, secDuration) {
        const msDuration = secDuration * 1e3;
        const initPoints = this.points + 1;
        this._memoryStorage.set(this.getKey(key), initPoints, secDuration);
        return Promise.resolve(
          new RateLimiterRes(0, msDuration === 0 ? -1 : msDuration, initPoints)
        );
      }
      set(key, points, secDuration) {
        const msDuration = (secDuration >= 0 ? secDuration : this.duration) * 1e3;
        this._memoryStorage.set(this.getKey(key), points, secDuration);
        return Promise.resolve(
          new RateLimiterRes(0, msDuration === 0 ? -1 : msDuration, points)
        );
      }
      get(key) {
        const res = this._memoryStorage.get(this.getKey(key));
        if (res !== null) {
          res.remainingPoints = Math.max(this.points - res.consumedPoints, 0);
        }
        return Promise.resolve(res);
      }
      delete(key) {
        return Promise.resolve(this._memoryStorage.delete(this.getKey(key)));
      }
    };
    module.exports = RateLimiterMemory2;
  }
});

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

// src/lib/server/multiplayer/index.ts
var import_RateLimiterMemory = __toESM(require_RateLimiterMemory(), 1);

// src/lib/server/rooms.ts
import { v4 as uuidv4 } from "uuid";

// src/lib/utility.ts
function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

// src/lib/sharedExpectations.ts
var TILE_TO_MINE_RATIO = 6;
var NUMBER_OF_ROWS_COLUMNS = 12;

// src/lib/server/board.ts
var FLAGGED_TILE = -3;
var UNKNOWN_TILE = -2;
var MINE_TILE = -1;
var ZERO_TILE = 0;
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
      if (x === 0 && y === 0) continue;
      const _row = board[row + x];
      if (_row === void 0) continue;
      const _column = _row[column + y];
      if (_column === void 0) continue;
      neighbors.push([_column, row + x, column + y]);
    }
  }
  return neighbors;
}
function computeBoard(board, number_of_rows_columns) {
  for (let x = 0; x < number_of_rows_columns; x++) {
    for (let y = 0; y < number_of_rows_columns; y++) {
      const tile = board[x][y];
      if (tile === MINE_TILE) continue;
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
  console.log(server_board);
  computeBoard(server_board, number_of_rows_columns);
  console.log(server_board);
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
      console.log(visited_tiles);
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
  if (visited_tiles.has(id)) return;
  if (client_board[row][column] !== UNKNOWN_TILE) return;
  visited_tiles.set(id, server_board[row][column]);
  client_board[row][column] = server_board[row][column];
  if (server_board[row][column] !== ZERO_TILE) return;
  for (const [_neighbor, x, y] of getNeighbors(server_board, row, column)) {
    if (!visited_tiles.has(`${x},${y}`)) {
      massReveal(server_board, client_board, x, y, visited_tiles);
    }
  }
}

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
  if (value === void 0) return value;
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
function getPlayer(roomId, session_token) {
  return redis_default.hGet(
    `roomId/${roomId}/players`,
    session_token
  );
}
async function playerExists(roomId, session_token) {
  return await redis_default.hExists(`roomId/${roomId}/players`, session_token);
}
async function setTime(roomId, time) {
  return await redis_default.hSet(`roomId/${roomId}`, "time_started", time);
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
  if (!room) throw "Room not found";
  console.log("generating boards!");
  const [server_board, client_board] = generateSolvedBoard(
    number_of_rows_columns,
    safe_row,
    safe_column
  );
  setStart(roomId, true);
  setBoards(roomId, client_board, server_board);
  setTime(roomId, Date.now());
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

// src/lib/server/multiplayer/index.ts
var import_cookie = __toESM(require_cookie(), 1);

// src/lib/server/multiplayer/verifySession.ts
async function isSessionReal(roomId, session_id) {
  if (!await roomExists(roomId)) return false;
  return playerExists(roomId, session_id);
}
async function isSessionValid(session_id, roomId) {
  if (session_id !== void 0 && typeof roomId === "string" && await isSessionReal(roomId, session_id)) {
    return true;
  }
  return false;
}

// src/lib/server/multiplayer/joinRoom.ts
var joinRoom = (socket, consumeRateLimit2) => {
  socket.on("join_room", async (roomId) => {
    if (!await consumeRateLimit2(socket.handshake.headers.cookie, 5)) return;
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

// src/lib/server/multiplayer/handleTiles.ts
var handleTiles = (socket, consumeRateLimit2, io, getSessionId2) => {
  socket.on("choose_tile", async (x, y) => {
    if (!await consumeRateLimit2(socket.handshake.headers.cookie, 1)) return;
    const roomId = socket.handshake.auth.roomId;
    if (typeof x !== "number" || typeof y !== "number" || typeof roomId !== "string")
      return;
    const room = await getRoom(roomId);
    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }
    const session_id = getSessionId2(socket.handshake.headers.cookie);
    const session_valid = await isSessionValid(session_id, roomId);
    if (!session_valid) {
      socket.emit("error", "Session ID");
      return;
    }
    const player = await getPlayer(roomId, session_id);
    if (!player) {
      socket.emit("error", "Player not found");
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
      return io.to(`roomId/${roomId}`).emit("game_ended", by_mine, player?.nickname);
    }
    setBoards(roomId, client_board, server_board);
    setRevealedTiles(roomId, revealed_tiles);
    io.to(`roomId/${roomId}`).emit(
      "board_updated",
      "x" in returned_tile ? returned_tile : Object.fromEntries(returned_tile)
    );
  });
  socket.on("flag_tile", async (x, y) => {
    if (!await consumeRateLimit2(socket.handshake.headers.cookie, 1)) return;
    const roomId = socket.handshake.auth.roomId;
    if (typeof x !== "number" || typeof y !== "number" || typeof roomId !== "string")
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
};

// src/lib/server/multiplayer/mouseMoves.ts
var mouseMoves = (socket, consumeRateLimit2, io, getSessionId2) => {
  socket.on("mouse_move", async (x, y) => {
    if (!await consumeRateLimit2(socket.handshake.headers.cookie ?? "", 1))
      return;
    const roomId = socket.handshake.auth.roomId;
    if (typeof x !== "number" || typeof y !== "number" || typeof roomId !== "string")
      return;
    const room_exists = await roomExists(roomId);
    if (!room_exists) {
      socket.emit("error", "Room not found");
      return;
    }
    const session_id = getSessionId2(socket.handshake.headers.cookie);
    const session_valid = await isSessionValid(session_id, roomId);
    if (!session_valid) {
      socket.emit("error", "Session ID");
      return;
    }
    const player = await getPlayer(roomId, session_id);
    if (!player) {
      socket.emit("error", "Player not found");
      return;
    }
    const { nickname, color } = player;
    io.to(`roomId/${roomId}`).emit("update_player_mouse", {
      nickname,
      color,
      x,
      y
    });
  });
};

// src/lib/server/multiplayer/index.ts
var rateLimiter = new import_RateLimiterMemory.default({
  points: 25,
  duration: 1
});
createRoom("Never going to give your ip");
function getSessionId(cookie_header) {
  const cookies = (0, import_cookie.parse)(cookie_header ?? "");
  return cookies["SESSION_ID"];
}
async function consumeRateLimit(cookie_header, points) {
  try {
    const session_id = getSessionId(cookie_header);
    if (!session_id) return false;
    await rateLimiter.consume(session_id, points);
    return true;
  } catch (error) {
    console.warn(error);
    return false;
  }
}
function multiplayer(io) {
  io.use(async (socket, next) => {
    const session_id = getSessionId(socket.handshake.headers.cookie);
    const roomId = socket.handshake.auth.roomId;
    if (await isSessionValid(session_id, roomId)) {
      next();
    } else {
      next(
        new Error(
          "Session Id is invalid. Please try rejoining the game through the menu."
        )
      );
    }
  });
  io.on("connection", (socket) => {
    joinRoom(socket, consumeRateLimit);
    handleTiles(socket, consumeRateLimit, io, getSessionId);
    mouseMoves(socket, consumeRateLimit, io, getSessionId);
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
