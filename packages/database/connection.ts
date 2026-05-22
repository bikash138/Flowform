import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./models";

type Schema = typeof schema;

type DbGlobals = {
  __flowform_pool__?: Pool;
  __flowform_db__?: NodePgDatabase<Schema>;
};

const g = globalThis as typeof globalThis & DbGlobals;

export function connectDB(url: string): NodePgDatabase<Schema> {
  if (g.__flowform_db__) return g.__flowform_db__;

  g.__flowform_pool__ = new Pool({ connectionString: url });
  g.__flowform_db__ = drizzle(g.__flowform_pool__, { schema });

  return g.__flowform_db__;
}

export async function disconnectDB(): Promise<void> {
  await g.__flowform_pool__?.end();
  g.__flowform_pool__ = undefined;
  g.__flowform_db__ = undefined;
}

export function getDb(): NodePgDatabase<Schema> {
  if (!g.__flowform_db__) {
    throw new Error("Database not connected. Call connectDB first.");
  }
  return g.__flowform_db__;
}

export async function checkDatabaseHealth(): Promise<void> {
  const client = await g.__flowform_pool__?.connect();
  if (!client) {
    throw new Error("Database not connected. Call connectDB first.");
  }
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}
