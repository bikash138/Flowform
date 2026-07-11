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
import { assertReadiness } from "@/bootstrap/health";
import {
  globalLimiter,
  authLimiter,
  sessionLimiter,
} from "@/middleware/rate-limit.middleware";

export class ServerBuilder {
  private app: Express;

  private constructor() {
    this.app = express();
  }

  public static create(): Express {
    return new ServerBuilder()
      .setupCoreMiddlewares()
      .setupRateLimiting()
      .setupAuth()
      .setupParsers()
      .setupHealth()
      .setupOpenApi()
      .setupRoutes()
      .setupFallbackHandlers()
      .build();
  }

  private setupCoreMiddlewares(): this {
    // This makes sure to entertain the X-Forwarded* headers
    this.app.set("trust proxy", 1);
    
    // Setup CORS
    this.app.use(
      cors({
        origin: [new URL(env.http.frontendUrl).origin],
        credentials: true,
      }),
    );

    // Adds request ID to each request for monitoring
    this.app.use(requestIdMiddleware);

    // Adds the logger to track each HTTP request
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
        serializers: {
          req(req) {
            return { method: req.method, url: req.url };
          },
          res(res) {
            return { statusCode: res.statusCode };
          },
        },
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

  private setupRateLimiting(): this {
    // Global Rate Limiter
    this.app.use(globalLimiter);

    this.app.use("/api/auth/get-session", sessionLimiter);

    this.app.use("/api/auth/sign-in", authLimiter);

    return this;
  }

  private setupAuth(): this {
    this.app.all(["/api/auth", "/api/auth/*path"], authHandler());
    return this;
  }

  private setupParsers(): this {
    this.app.use(express.json({ limit: "2mb" }));
    return this;
  }

  private setupHealth(): this {
    // Liveness Check
    this.app.get("/healthz", (_req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Readiness Check
    this.app.get("/readyz", async (_req, res) => {
      try {
        await assertReadiness();
        res.json({ status: "ok" });
      } catch (err) {
        res.status(503).json({
          status: "unavailable",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    });

    return this;
  }

  private setupOpenApi(): this {
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

  private setupRoutes(): this {
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

  private setupFallbackHandlers(): this {
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
      });
    });
    return this;
  }

  private build(): Express {
    return this.app;
  }
}
