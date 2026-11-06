import "dotenv/config";
import { defineConfig } from "prisma/config";

// Direct unpooled URL for migrations and DDL administration
const migrationUrl =
  process.env["DATABASE_URL_UNPOOLED"] || process.env["DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrationUrl,
  },
});
