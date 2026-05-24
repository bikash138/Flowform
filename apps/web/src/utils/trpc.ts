import type { ServerRouter } from "@flowform/trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<ServerRouter>();
