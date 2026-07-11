import rateLimit from "express-rate-limit";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import { getRedis } from "@flowform/redis";
import type { Request } from "express";

type LimiterConfig = {
  keyPrefix: string;
  windowMs: number;
  limit: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
};

function createLimiter(config: LimiterConfig) {
  return rateLimit({
    windowMs: config.windowMs,
    limit: config.limit,
    standardHeaders: "draft-8", // Uses RateLimit instead of X-Rate-Limit
    legacyHeaders: false,
    keyGenerator: config.keyGenerator ?? ((req) => req.ip ?? "unknown"),
    message: {
      success: false,
      message: config.message ?? "Too many requests. Please try again later.",
    },
    store: new RedisStore({
      prefix: `rl:${config.keyPrefix}:`,
      sendCommand: (command: string, ...args: string[]) =>
        getRedis().call(command, ...args) as Promise<RedisReply>,
    }),
  });
}

export const globalLimiter = createLimiter({
  keyPrefix: "global",
  windowMs: 15 * 60 * 1000,
  limit: 500,
});

export const authLimiter = createLimiter({
  keyPrefix: "auth",
  windowMs: 10 * 60 * 1000,
  limit: 20 , //20 req per 10 min
  message: "Too many auth attempts. Please try again later.",
});

export const sessionLimiter = createLimiter({
  keyPrefix: "auth-session",
  windowMs: 15 * 60 * 1000,
  limit: 500, //500req per 15min
});
