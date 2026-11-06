import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env, isLiveDatabaseConfigured } from "./env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const connectionString =
  env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/freelancepay_db?schema=public";

const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString,
    connectionTimeoutMillis: 3000,
  });

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}

export { isLiveDatabaseConfigured };
