import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { getAuth } from "@flowform/services/auth";

const ANON_COOKIE = "anon_session";
const ANON_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

function readAnonCookie(req: Request): string | undefined {
  const header = req.headers.cookie ?? "";
  for (const part of header.split(";")) {
    const [key, ...val] = part.trim().split("=");
    if (key?.trim() === ANON_COOKIE) return val.join("=");
  }
  return undefined;
}

function setAnonCookie(res: Response, id: string): void {
  res.setHeader(
    "Set-Cookie",
    `${ANON_COOKIE}=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${ANON_COOKIE_MAX_AGE}`,
  );
}

function extractIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]!.trim();
  return (
    (req.headers["cf-connecting-ip"] as string | undefined) ??
    (req.headers["x-real-ip"] as string | undefined) ??
    req.socket?.remoteAddress ??
    "0.0.0.0"
  );
}

export async function createContext({ req, res }: { req: Request; res: Response }) {
  const auth = getAuth();

  const session = await auth.api.getSession({
    headers: new Headers(req.headers as Record<string, string>),
  });

  let anonId = readAnonCookie(req);
  if (!anonId) {
    anonId = randomUUID();
    setAnonCookie(res, anonId);
  }

  return {
    userId: session?.user?.id ?? null,
    anonId,
    ip: extractIp(req),
    userAgent: (req.headers["user-agent"] as string | undefined) ?? "",
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
