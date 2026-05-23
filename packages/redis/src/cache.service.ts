import { getRedis } from "./client";

export class CacheService {
  private get redis() {
    return getRedis();
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length > 0) await this.redis.del(...keys);
  }

  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.redis.expire(key, ttlSeconds);
  }

  async rateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<{ count: number; retryAfter: number }> {
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, windowSeconds);
    const retryAfter = count > limit ? await this.redis.ttl(key) : 0;
    return { count, retryAfter };
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await fetcher();
    await this.set(key, value, ttlSeconds);
    return value;
  }
}
