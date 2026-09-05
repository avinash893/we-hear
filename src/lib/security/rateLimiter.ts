interface RateLimitRecord {
  timestamps: number[];
  lastSeen: number;
}

// Memory-bounded sliding window store (Max 10,000 active IP/user keys to prevent heap exhaustion)
const MAX_STORE_ENTRIES = 10000;
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 3 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((record, key) => {
      record.timestamps = record.timestamps.filter((t: number) => now - t < 15 * 60 * 1000);
      if (record.timestamps.length === 0 || now - record.lastSeen > 20 * 60 * 1000) {
        rateLimitStore.delete(key);
      }
    });
  }, 3 * 60 * 1000);
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Checks and records rate limit for an identifier with memory bounding
 */
export function checkRateLimit(
  identifier: string,
  action: "auth" | "payment" | "report" | "availability" | "general" | (string & {}),
  maxRequests = 60,
  windowSeconds = 60
): RateLimitResult {
  const key = `${action}:${identifier}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const threshold = now - windowMs;

  // Memory ceiling protection: If store hits capacity under high traffic or DDoS, prune oldest entry
  if (!rateLimitStore.has(key) && rateLimitStore.size >= MAX_STORE_ENTRIES) {
    const firstKey = rateLimitStore.keys().next().value;
    if (firstKey) {
      rateLimitStore.delete(firstKey);
    }
  }

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { timestamps: [], lastSeen: now });
  }

  const record = rateLimitStore.get(key)!;
  record.lastSeen = now;

  // Keep only timestamps within window
  record.timestamps = record.timestamps.filter((t: number) => t > threshold);

  if (record.timestamps.length >= maxRequests) {
    const oldestTimestamp = record.timestamps[0];
    const resetSeconds = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      resetSeconds: Math.max(1, resetSeconds),
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    limit: maxRequests,
    remaining: maxRequests - record.timestamps.length,
    resetSeconds: windowSeconds,
  };
}

/**
 * Robust, trusted proxy IP extraction (Cloudflare, AWS ALB, Render, Fly.io, Nginx)
 */
export function getClientIp(req: Request): string {
  // 1. Cloudflare True Client IP
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp && isValidIp(cfIp.trim())) {
    return cfIp.trim();
  }

  // 2. Real-IP header from reverse proxy
  const realIp = req.headers.get("x-real-ip");
  if (realIp && isValidIp(realIp.trim())) {
    return realIp.trim();
  }

  // 3. X-Forwarded-For (take the first client IP in the chain)
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const clientIp = forwarded.split(",")[0].trim();
    if (isValidIp(clientIp)) {
      return clientIp;
    }
  }

  return "127.0.0.1";
}

/**
 * Basic IPv4 / IPv6 format sanity validation
 */
function isValidIp(ip: string): boolean {
  if (!ip || ip.length > 45) return false;
  // IPv4 format: 1.2.3.4
  const isIpv4 = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip);
  // IPv6 format (simplified check)
  const isIpv6 = ip.includes(":") && /^[0-9a-fA-F:]+$/.test(ip);
  return isIpv4 || isIpv6;
}
