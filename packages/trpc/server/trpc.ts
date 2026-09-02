import { initTRPC } from "@trpc/server";
import { ZodError } from "zod";
import { OpenApiMeta } from "trpc-to-openapi";
import { ValidationError } from "@flowform/services/public";
import type { Context } from "./context";

const t = initTRPC
  .meta<OpenApiMeta>()
  .context<Context>()
  .create({
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.cause instanceof ZodError ? error.cause.flatten() : null,
          // Per-question answer errors, so a respondent is told WHICH field is
          // wrong rather than just "validation failed".
          fieldErrors:
            error.cause instanceof ValidationError ? error.cause.fieldErrors : null,
        },
      };
    },
  });

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
