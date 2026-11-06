import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().default("freelancepay_jwt_secret_dev_key_super_safe_99214"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  ENABLE_OFFLINE_DEMO_FALLBACK: z.string().default("true"),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_BASE_URL: z.string().default("https://api-m.sandbox.paypal.com"),
  PAYPAL_WEBHOOK_ID: z.string().optional(),
  PAYPAL_ENVIRONMENT: z.string().default("sandbox"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  ENABLE_OFFLINE_DEMO_FALLBACK: process.env.ENABLE_OFFLINE_DEMO_FALLBACK,
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
  PAYPAL_BASE_URL: process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com",
  PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID,
  PAYPAL_ENVIRONMENT: process.env.PAYPAL_ENVIRONMENT || "sandbox",
});

export function isLiveDatabaseConfigured(): boolean {
  return Boolean(env.DATABASE_URL && env.DATABASE_URL.startsWith("postgres"));
}
