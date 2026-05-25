import { bootstrap } from "./bootstrap/bootstrap";
import { ServerBuilder } from "./server";
import { env } from "@flowform/env";
import { logger } from "@flowform/logger";

async function main() {
  try {
    await bootstrap();

    const app = new ServerBuilder()
      .setupCoreMiddlewares()
      .setupRateLimiting()
      .setupAuth()
      .setupParsers()
      .setupHealth()
      .setupOpenApi()
      .setupRoutes()
      .setupFallbackHandlers()
      .build();

    const port = env.http.port;
    app.listen(port, () => {
      logger.info(`Server listening on port ${port} [${env.node.env}]`);
    });
  } catch (err) {
    logger.error({ err }, "Fatal error during server startup");
    process.exit(1);
  }
}

main();
