/**
 * Prisma client singleton.
 *
 * In Next.js dev mode, the module is reloaded on every save. We attach the
 * client to `globalThis` so we don't exhaust the database connection pool.
 * In production each serverless invocation gets its own client.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
