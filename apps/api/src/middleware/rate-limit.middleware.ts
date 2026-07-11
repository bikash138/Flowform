import { createHash } from "node:crypto";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import { getRedis } from "@flowform/redis";
import type { Request } from "express";

type LimiterConfig = {
  keyPrefix: string;
  windowMs: number;
  limit: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
};

function ipKey(req: Request): string {
  return ipKeyGenerator(req.ip ?? "unknown");
}

const SESSION_COOKIE = "better-auth.session_token";

function readSessionToken(req: Request): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;

    const name = part.slice(0, eq).trim();
    if (name === SESSION_COOKIE || name === `__Secure-${SESSION_COOKIE}`) {
      return part.slice(eq + 1).trim() || undefined;
    }
  }
  return undefined;
}

function createLimiter(config: LimiterConfig) {
  return rateLimit({
    windowMs: config.windowMs,
    limit: config.limit,
    standardHeaders: "draft-8", // Uses RateLimit instead of X-Rate-Limit
    legacyHeaders: false,
    keyGenerator: config.keyGenerator ?? ipKey,
    skip: config.skip ?? (() => false),
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
  windowMs: 60 * 1000,
  limit: 200,
});

export const authLimiter = createLimiter({
  keyPrefix: "auth",
  windowMs: 2 * 60 * 1000,
  limit: 10,
  message: "Too many sign-in attempts.",
});

export const sessionLimiter = createLimiter({
  keyPrefix: "auth-session",
  windowMs: 5 * 60 * 1000,
  limit: 200,
  skip: (req) => readSessionToken(req) === undefined,
  keyGenerator: (req) =>
    createHash("sha256")
      .update(readSessionToken(req) ?? "")
      .digest("base64url")
      .slice(0, 32),
});
