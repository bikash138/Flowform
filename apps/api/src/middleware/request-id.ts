import { randomBytes } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId =
    (req.headers["x-request-id"] as string | undefined) ??
    randomBytes(8).toString("base64url");

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}
