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
  AI_PROVIDER: z.enum(["auto", "gemini", "openai", "neon", "fallback"]).default("auto"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-1.5-flash"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_BASE_URL: z.string().default("https://api.openai.com/v1"),
  NEON_AI_GATEWAY_URL: z.string().optional(),
  NEON_AI_KEY: z.string().optional(),
  EMAIL_PROVIDER: z.enum(["auto", "resend", "smtp", "mock"]).default("auto"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("FreelancePay AI <notifications@freelancepay.ai>"),
  CRON_SECRET: z.string().default("dev_cron_secret_freelancepay_secure_key_10293"),
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
  AI_PROVIDER: (process.env.AI_PROVIDER as "auto" | "gemini" | "openai" | "neon" | "fallback") || "auto",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini",
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  NEON_AI_GATEWAY_URL: process.env.NEON_AI_GATEWAY_URL,
  NEON_AI_KEY: process.env.NEON_AI_KEY,
  EMAIL_PROVIDER: (process.env.EMAIL_PROVIDER as "auto" | "resend" | "smtp" | "mock") || "auto",
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM || "FreelancePay AI <notifications@freelancepay.ai>",
  CRON_SECRET: process.env.CRON_SECRET || "dev_cron_secret_freelancepay_secure_key_10293",
});

export function isLiveDatabaseConfigured(): boolean {
  return Boolean(env.DATABASE_URL && env.DATABASE_URL.startsWith("postgres"));
}
