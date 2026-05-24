import { CacheService } from "@flowform/redis";
import { CacheKeys } from "@/cache/keys";
import { TTL } from "@/cache/ttl";

const cache = new CacheService();

// Rate Limiting

const RATE_LIMITS = {
  view:   { limit: 25, windowSec: 3600 },
  start:  { limit: 8,  windowSec: 3600 },
  submit: { limit: 5,  windowSec: 600  },
} as const;

type RateLimitEndpoint = keyof typeof RATE_LIMITS;

export async function checkRateLimit(
  endpoint: RateLimitEndpoint,
  ip: string,
  formId: string,
): Promise<boolean> {
  const { limit, windowSec } = RATE_LIMITS[endpoint];
  const { count } = await cache.rateLimit(CacheKeys.rateLimit.public(endpoint, ip, formId), limit, windowSec);
  return count <= limit;
}

// Dedup Cache

export async function isDedupCacheHit(formId: string, anonId: string): Promise<boolean> {
  return (await cache.get<boolean>(CacheKeys.public.dedup(formId, anonId))) === true;
}

export async function setDedupCache(formId: string, anonId: string): Promise<void> {
  await cache.set(CacheKeys.public.dedup(formId, anonId), true, TTL.DEDUP);
}

// Snapshot Cache

export async function getCachedSnapshot<T>(formId: string, version: number): Promise<T | null> {
  return cache.get<T>(CacheKeys.public.snapshot(formId, version));
}

export async function setCachedSnapshot<T>(formId: string, version: number, data: T): Promise<void> {
  await cache.set(CacheKeys.public.snapshot(formId, version), data, TTL.SNAPSHOT);
}

export async function invalidateSnapshotCache(formId: string, version: number): Promise<void> {
  await cache.del(CacheKeys.public.snapshot(formId, version));
}

// Submission Count Cache

export async function getCachedSubmissionCount(formId: string): Promise<number | null> {
  return cache.get<number>(CacheKeys.public.submissionCount(formId));
}

export async function setCachedSubmissionCount(formId: string, count: number): Promise<void> {
  await cache.set(CacheKeys.public.submissionCount(formId), count, TTL.SUBMISSION_COUNT);
}

