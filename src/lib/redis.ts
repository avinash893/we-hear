import Redis from "ioredis";

let redisClient: Redis | null = null;

/**
 * Returns a shared, resilient Redis client for distributed caching and rate-limiting
 */
export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      lazyConnect: false,
      enableOfflineQueue: false,
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
