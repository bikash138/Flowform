import Redis from "ioredis";
import { env } from "@flowform/env";
import { createLogger } from "@flowform/logger";

const log = createLogger("redis");

type RedisGlobals = {
  __flowform_redis__?: Redis;
};

const g = globalThis as typeof globalThis & RedisGlobals;

export function connectRedis(): Redis {
  if (g.__flowform_redis__) return g.__flowform_redis__;

  g.__flowform_redis__ = new Redis(env.infra.redis.url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableReadyCheck: false,
  });

  g.__flowform_redis__.on("error", (err) => {
    log.error({ err }, "Redis connection error");
  });

  g.__flowform_redis__.on("connect", () => {
    log.info("Redis connected");
  });

  return g.__flowform_redis__;
}

export function getRedis(): Redis {
  if (!g.__flowform_redis__) {
    throw new Error("Redis not connected. Call connectRedis first.");
  }
  return g.__flowform_redis__;
}

export async function disconnectRedis(): Promise<void> {
  await g.__flowform_redis__?.quit();
  g.__flowform_redis__ = undefined;
}

export async function checkRedisHealth(): Promise<void> {
  const result = await getRedis().ping();
  if (result !== "PONG") {
    throw new Error("Redis health check failed.");
  }
}
