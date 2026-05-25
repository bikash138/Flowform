import { checkDatabaseHealth } from "@flowform/database/connection";
import { checkRedisHealth } from "@flowform/redis";

export type HealthCheckResult =
  | { name: string; ok: true }
  | { name: string; ok: false; error: string };

async function runCheck(
  name: string,
  fn: () => Promise<void>,
): Promise<HealthCheckResult> {
  try {
    await fn();
    return { name, ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    return { name, ok: false, error };
  }
}

export async function runReadinessChecks(): Promise<HealthCheckResult[]> {
  return Promise.all([
    runCheck("database", checkDatabaseHealth),
    runCheck("redis", checkRedisHealth),
  ]);
}

export function assertAllHealthy(results: HealthCheckResult[]): void {
  const failed = results.filter(
    (r): r is Extract<HealthCheckResult, { ok: false }> => !r.ok,
  );
  if (failed.length === 0) {
    return;
  }
  const msg = failed.map((f) => `${f.name}: ${f.error}`).join("; ");
  throw new Error(`Readiness checks failed: ${msg}`);
}

export async function assertReadiness(): Promise<HealthCheckResult[]> {
  const results = await runReadinessChecks();
  assertAllHealthy(results);
  return results;
}
