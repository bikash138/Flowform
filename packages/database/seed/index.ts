import "dotenv/config";
import { connectDB } from "../connection";
import { env } from "@flowform/env";
import { seedPlans } from "./plans";
import { createLogger } from "@flowform/logger";

const log = createLogger("seed");

async function main() {
  connectDB(env.infra.database.url);
  log.info("Seeding database...");

  await seedPlans();

  log.info("Done.");
  process.exit(0);
}

main().catch((err) => {
  log.error({ err }, "Seed failed");
  process.exit(1);
});
