import cors from "cors";
import express, { type Express } from "express";
import pinoHttp from "pino-http";
import { apiReference } from "@scalar/express-api-reference";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import {
  generateOpenApiDocument,
  createOpenApiExpressMiddleware,
} from "trpc-to-openapi";
import { env } from "@flowform/env";
import { logger } from "@flowform/logger";
import { authHandler } from "@flowform/services/auth";
import { serverRouter, createContext } from "@flowform/trpc/server";
import { requestIdMiddleware } from "@/middleware/request-id";
import {
  globalLimiter,
  authLimiter,
} from "@/middleware/rate-limit.middleware";

export class ServerBuilder {
  private app: Express;

  constructor() {
    this.app = express();
  }

  public setupCoreMiddlewares(): this {
    this.app.set("trust proxy", 1);
    const allowedOrigins = new Set([
      env.http.frontendUrl,
      env.http.frontendUrl.startsWith("https://www.")
        ? env.http.frontendUrl.replace("https://www.", "https://")
        : env.http.frontendUrl.replace("https://", "https://www."),
    ]);
    this.app.use(
      cors({
        origin: (origin, cb) => {
          // Allow same-origin / server-to-server (no Origin header) and listed origins
          if (!origin || allowedOrigins.has(origin)) return cb(null, true);
          cb(new Error(`CORS: origin ${origin} not allowed`));
        },
        credentials: true,
      }),
    );
    this.app.use(requestIdMiddleware);
    this.app.use(
      pinoHttp({
        logger,
        autoLogging: {
          ignore: (req) => req.url?.startsWith("/trpc") ?? false,
        },
        customLogLevel: (_req, res) => {
          if (res.statusCode >= 500) return "error";
          if (res.statusCode >= 400) return "warn";
          return "info";
        },
        // Trim request log to only method + url
        serializers: {
          req(req) {
            return { method: req.method, url: req.url };
          },
          // Trim response log to only status code
          res(res) {
            return { statusCode: res.statusCode };
          },
        },
        // Single-line summary: METHOD /path STATUS Xms
        customSuccessMessage(req, res, responseTime) {
          return `${req.method} ${req.url} ${res.statusCode} ${responseTime}ms`;
        },
        customErrorMessage(req, res) {
          return `${req.method} ${req.url} ${res.statusCode}`;
        },
      }),
    );
    return this;
  }

  public setupRateLimiting(): this {
    // Global Rate Limiter
    this.app.use(globalLimiter);

    // Auth Rate Limited
    this.app.use("/api/auth", authLimiter);

    return this;
  }

  public setupAuth(): this {
    this.app.all(["/api/auth", "/api/auth/*path"], authHandler());
    return this;
  }

  public setupParsers(): this {
    this.app.use(express.json({ limit: "2mb" }));
    return this;
  }

  public setupHealth(): this {
    this.app.get("/health", (_req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });
    return this;
  }

  public setupOpenApi(): this {
    const openApiDoc = generateOpenApiDocument(serverRouter, {
      title: "Flowform  API",
      version: "1.0.0",
      baseUrl: `${env.http.baseUrl}/api`,
    });
    this.app.get("/openapi.json", (_req, res) => {
      res.json(openApiDoc);
    });
    this.app.use("/docs", apiReference({ url: "/openapi.json" }));
    return this;
  }

  public setupRoutes(): this {
    this.app.use(
      "/api",
      createOpenApiExpressMiddleware({
        router: serverRouter,
        createContext,
        onError: ({ error, path }) => {
          logger.error({ err: error, path }, "REST handler error");
        },
      }),
    );

    this.app.use(
      "/trpc",
      createExpressMiddleware({
        router: serverRouter,
        createContext,
        onError: ({ error, path }) => {
          logger.error({ err: error, path }, "tRPC handler error");
        },
      }),
    );
    return this;
  }

  public setupFallbackHandlers(): this {
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
      });
    });
    return this;
  }

  public build(): Express {
    return this.app;
  }
}
