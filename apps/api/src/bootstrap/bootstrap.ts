import { env } from "@flowform/env";
import { logger } from "@flowform/logger";
import { connectDB } from "@flowform/database/connection";
import { seedPlans } from "@flowform/database/seed";
import { connectRedis } from "@flowform/redis";

import { assertReadiness } from "./health";

export async function bootstrap() {
  logger.info("Starting Flowform Server...");

  try {
    connectDB(env.infra.database.url);
    connectRedis();
    await assertReadiness();
    logger.info("INFRA IS UP");

    await seedPlans();
    logger.info("Plans synced");
  } catch (err) {
    logger.error({ err }, "INFRA STARTUP FAILED");
    process.exit(1);
  }
}
