import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimiter";

export const dynamic = "force-dynamic";

/**
 * Health check & liveness probe for Cloud Load Balancers, Kubernetes, AWS ALB, Render & Uptime monitors.
 * Verifies Node process health, database responsiveness, and memory metrics.
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(ip, "health-check", 120, 60);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many health check requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.resetSeconds),
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }

  const startTime = Date.now();
  let dbStatus: "connected" | "degraded" | "error" = "connected";
  let dbLatencyMs = 0;

  try {
    // Database probe with 2.5 second timeout safeguard
    const dbProbe = Promise.race([
      prisma.$queryRawUnsafe("SELECT 1;"),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Database probe timeout")), 2500)),
    ]);

    await dbProbe;
    dbLatencyMs = Date.now() - startTime;
  } catch (err: any) {
    console.error("Health check database probe failed:", err?.message || err);
    dbStatus = "error";
  }

  const memory = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());

  const isHealthy = dbStatus === "connected";
  const statusCode = isHealthy ? 200 : 503;

  const payload = {
    status: isHealthy ? "healthy" : "degraded",
    uptimeSeconds,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    services: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      memory: {
        rssMb: Math.round((memory.rss / (1024 * 1024)) * 100) / 100,
        heapTotalMb: Math.round((memory.heapTotal / (1024 * 1024)) * 100) / 100,
        heapUsedMb: Math.round((memory.heapUsed / (1024 * 1024)) * 100) / 100,
      },
    },
    version: "1.0.0",
  };

  return NextResponse.json(payload, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
