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
  console.log(value);
  if (value === null) {
    return fallback;
  }
  return JSON.parse(value);
}
async function set(
  key: string,
  value: unknown,
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
const redis = {
  get,
  set,
  all,
  subscribe,
};
export default redis;
