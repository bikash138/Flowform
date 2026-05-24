"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@flowform/trpc/client";
import { useState } from "react";
import { TRPCProvider } from "@/utils/trpc";
import { ServerRouter } from "@flowform/trpc/client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000 },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function Provider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<ServerRouter>({
      links: [
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
          fetch: (url, options) => {
            return fetch(url, { ...options, credentials: "include" });
          },
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient as never} queryClient={queryClient}>
        <NextThemesProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </NextThemesProvider>
      </TRPCProvider>
    </QueryClientProvider>
  );
}
