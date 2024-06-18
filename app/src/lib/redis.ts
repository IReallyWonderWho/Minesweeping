// Taken from https://github.com/bfanger/multiplayer-dice-game/blob/main/src/lib/services/redis.ts
// Thanks!!
import { createClient } from "redis";

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = process.env.REDIS_PORT
  ? Number(process.env.REDIS_PORT)
  : 6379;

const client = createClient({
  socket: {
    host: redisHost,
    port: redisPort,
  },
});

let connectPromise: Promise<void> | undefined;
let errorOnce = true;
async function autoConnect(): Promise<void> {
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
  connectPromise = undefined;
  console.log("Redis down");
});
async function get<T>(key: string): Promise<T | undefined>;
async function get<T>(key: string, fallback: T): Promise<T>;
async function get<T>(key: string, fallback?: T): Promise<T | undefined> {
  await autoConnect();
  const value = await client.get(key);
  if (value === null) {
    return fallback;
  }
  return JSON.parse(value);
}
async function set<T>(
  key: string,
  value: T,
  options?: { ttl: number }, // TTL in seconds
): Promise<void> {
  const data = JSON.stringify(value);
  const config = options ? { EX: options.ttl } : {};
  await autoConnect();
  await client.set(key, data, config);
  client.publish(key, data);
}
async function all<T>(query: string): Promise<T[]> {
  await autoConnect();
  const keys = await client.keys(query);
  const values = await Promise.all(keys.map((key) => get<T>(key)));
  return values.filter((value) => typeof value !== "undefined") as T[];
}
function subscribe<T>(
  channel: string,
  next: (value: T) => void,
  error?: (err: Error) => void,
): () => void {
  const wrapped = (data: string) => {
    next(JSON.parse(data));
  };
  let aborted = false;
  let unsubscribe = () => {
    aborted = true;
  };
  function onError(err: Error) {
    if (!error) {
      throw err;
    }
    error(err);
  }
  const subscriber = createClient({
    socket: {
      host: redisHost,
      port: redisPort,
    },
  });
  subscriber
    .connect()
    .then(() => {
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
    })
    .catch(onError);
  return () => unsubscribe();
}
async function exists(key: string) {
  await autoConnect();
  return (await client.exists(key)) !== 0;
}
async function hSet<T>(key: string, field: string, value: T) {
  const data = JSON.stringify(value);
  await autoConnect();
  await client.hSet(key, field, data);
}
async function hGet<T>(key: string, field: string): Promise<T | undefined> {
  await autoConnect();
  const value = await client.hGet(key, field);

  if (value === undefined) return value;

  return JSON.parse(value);
}
async function hExists(key: string, field: string) {
  await autoConnect();
  return client.hExists(key, field);
}
async function hGetAll<T>(key: string) {
  await autoConnect();
  const value = await client.hGetAll(key);

  const map: Map<string, T> = new Map();

  for (const key in value) {
    map.set(key, JSON.parse(value[key]));
  }

  return map;
}
async function sAdd<T>(key: string, value: T) {
  const data = JSON.stringify(value);
  await autoConnect();
  await client.sAdd(key, data);
}
async function del(key: string) {
  await autoConnect();
  await client.del(key);
}

const redis = {
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
  del,
};
export default redis;
