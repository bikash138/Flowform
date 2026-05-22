import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { env } from "@flowform/env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./models",
  out: "./drizzle",
  dbCredentials: {
    url: env.infra.database.url,
  },
});
