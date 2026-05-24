import { TRPCError } from "@trpc/server";
import { middleware, publicProcedure } from "../trpc";

const requireAuth = middleware(({ ctx, next }) => {
  if (ctx.userId === null) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);
