import type { Server } from "node:http";
import { disconnectDB } from "@flowform/database/connection";
import { logger } from "@flowform/logger";

export function registerShutdown(server: Server): void {
  const shutdown = async (signal: string) => {
    logger.info(
      { signal },
      "Shutdown signal received — starting graceful shutdown",
    );

    server.close(async () => {
      try {
        await disconnectDB();
        logger.info("MongoDB disconnected — shutdown complete");
        process.exit(0);
      } catch (err) {
        logger.error({ err }, "Error during shutdown");
        process.exit(1);
      }
    });

    setTimeout(() => {
      logger.error("Graceful shutdown timed out — forcing exit");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}
