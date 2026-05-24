import { initTRPC } from "@trpc/server";
import { ZodError } from "zod";
import { OpenApiMeta } from "trpc-to-openapi";
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
        },
      };
    },
  });

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
