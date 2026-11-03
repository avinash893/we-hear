import Redis from "ioredis";

let redisClient: Redis | null = null;

/**
 * Returns a shared, resilient Redis client for distributed caching and rate-limiting
 */
export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const url =
    process.env.REDIS_URL ||
    process.env.KV_URL ||
    (process.env.REDIS_HOST
      ? `redis://:${process.env.REDIS_API_KEY || process.env.REDIS_PASSWORD || ""}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`
      : null);

  if (!url) return null;

  try {
    const isTls = url.startsWith("rediss://") || url.includes("upstash.io") || url.includes("db.redis");
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      lazyConnect: false,
      enableOfflineQueue: false,
      tls: isTls ? { rejectUnauthorized: false } : undefined,
      retryStrategy(times) {
        if (times > 3) return null; // Stop retrying after 3 attempts, fallback to in-memory
        return Math.min(times * 100, 1000);
      },
    });

    redisClient.on("error", (err) => {
      // Log warning without crashing the process
      console.warn("Redis client warning (fallback active):", err.message);
    });

    return redisClient;
  } catch (err) {
    console.warn("Failed to initialize Redis client:", err);
    return null;
  }
}
