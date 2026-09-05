import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Retain singleton across all environments to prevent duplicate PrismaClient connection pools
// under high concurrency or module re-evaluations
globalForPrisma.prisma = prisma;

// Graceful database disconnection on process termination (Docker, Kubernetes, Render)
if (typeof process !== "undefined") {
  const handleExit = async () => {
    try {
      await prisma.$disconnect();
    } catch {
      // Ignore disconnect errors during process exit
    }
  };

  process.once("SIGINT", handleExit);
  process.once("SIGTERM", handleExit);
  process.once("beforeExit", handleExit);
}

