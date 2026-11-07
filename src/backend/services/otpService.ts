import crypto from "crypto";
import { prisma } from "@/backend/db/db";
import { dispatchEmailThroughProvider } from "@/backend/integrations/email/emailProvider";
import { renderOtpEmail } from "@/backend/integrations/email/emailTemplates";

const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 100;
const MAX_ATTEMPTS = 5;

/**
 * Computes a secure SHA-256 hash of an OTP code to avoid plain-text storage.
 */
export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp.trim()).digest("hex");
}

/**
 * Generates a cryptographically strong 6-digit numeric OTP.
 */
export function generateNumericOtp(): string {
  // Generates integer between 100000 and 999999 inclusive
  return crypto.randomInt(100000, 1000000).toString();
}

export interface CreateAndSendOtpParams {
  email: string;
  purpose: "SIGNUP_VERIFICATION" | "LOGIN_OTP";
  recipientName?: string;
  userId?: string;
  awaitDelivery?: boolean;
}

export interface OtpGenerationResult {
  success: boolean;
  cooldownSecondsRemaining?: number;
  error?: string;
  resendAfter?: Date;
  expiresAt?: Date;
  deliveryStatus?: string;
}

/**
 * Creates, persists, and dispatches a 6-digit email OTP.
 * Enforces cooldown between resends and invalidates previous active OTPs for the same purpose.
 */
export async function createAndSendOtp(
  params: CreateAndSendOtpParams
): Promise<OtpGenerationResult> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const now = new Date();

  // Check if an existing unexpired OTP with active cooldown exists
  const latestOtp = await prisma.emailOtp.findFirst({
    where: {
      email: normalizedEmail,
      purpose: params.purpose,
      verified: false,
    },
    orderBy: { createdAt: "desc" },
  });

  if (latestOtp && latestOtp.resendAfter > now) {
    const diffMs = latestOtp.resendAfter.getTime() - now.getTime();
    const remainingSeconds = Math.ceil(diffMs / 1000);
    return {
      success: false,
      cooldownSecondsRemaining: remainingSeconds,
      error: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
    };
  }

  // Generate 6-digit code and cryptographic hash
  const otpCode = generateNumericOtp();
  const otpHash = hashOtp(otpCode);
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const resendAfter = new Date(now.getTime() + RESEND_COOLDOWN_SECONDS * 1000);

  // Invalidate any older unverified OTPs for this email and purpose
  await prisma.emailOtp.updateMany({
    where: {
      email: normalizedEmail,
      purpose: params.purpose,
      verified: false,
    },
    data: {
      verified: true, // effectively retire older codes
    },
  });

  // Store new OTP record
  const otpRecord = await prisma.emailOtp.create({
    data: {
      email: normalizedEmail,
      userId: params.userId || null,
      otpHash,
      purpose: params.purpose,
      expiresAt,
      resendAfter,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      verified: false,
    },
  });

  // Render branded HTML & plain text template
  const { html, text } = renderOtpEmail({
    recipientName: params.recipientName,
    otp: otpCode,
    purpose: params.purpose,
    expiryMinutes: OTP_EXPIRY_MINUTES,
  });

  // Dispatch email through SMTP or fallback
  const dispatchPromise = dispatchEmailThroughProvider({
    to: normalizedEmail,
    subject:
      params.purpose === "SIGNUP_VERIFICATION"
        ? "Verify Your FreelancePay AI Account"
        : "Your FreelancePay AI Security Code",
    text,
    html,
    workflow: params.purpose === "SIGNUP_VERIFICATION" ? "signup_verification" : "login_otp",
    entityType: "EmailOtp",
    entityId: otpRecord.id,
  });

  let deliveryStatus = "dispatched";
  if (params.awaitDelivery) {
    const sendResult = await dispatchPromise;
    deliveryStatus = sendResult.status;
  } else {
    // Fire-and-forget in background with safety handler so login is never blocked
    dispatchPromise.catch((err) => {
      console.error("Background OTP dispatch error:", err);
    });
  }

  return {
    success: true,
    expiresAt,
    resendAfter,
    deliveryStatus,
  };
}

export interface VerifyOtpResult {
  valid: boolean;
  error?: string;
  remainingAttempts?: number;
}

/**
 * Validates a submitted 6-digit OTP code using timing-safe comparison.
 * Decrements attempts and locks out when max attempts exceeded.
 */
export async function verifyOtpCode(
  email: string,
  purpose: "SIGNUP_VERIFICATION" | "LOGIN_OTP",
  inputOtp: string
): Promise<VerifyOtpResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanInput = inputOtp.trim();
  const now = new Date();

  // Find latest active OTP
  const record = await prisma.emailOtp.findFirst({
    where: {
      email: normalizedEmail,
      purpose,
      verified: false,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return {
      valid: false,
      error: "No active verification code found. Please request a new code.",
    };
  }

  // Check if expired
  if (record.expiresAt < now) {
    return {
      valid: false,
      error: "Verification code has expired. Please request a new code.",
    };
  }

  // Check attempts
  if (record.attempts >= record.maxAttempts) {
    return {
      valid: false,
      error: "Too many incorrect attempts. Please request a new code.",
      remainingAttempts: 0,
    };
  }

  const computedHash = hashOtp(cleanInput);
  const expectedHash = record.otpHash;

  // Constant-time buffer comparison to prevent timing side-channels
  const match =
    computedHash.length === expectedHash.length &&
    crypto.timingSafeEqual(Buffer.from(computedHash, "hex"), Buffer.from(expectedHash, "hex"));

  if (!match) {
    const updatedAttempts = record.attempts + 1;
    await prisma.emailOtp.update({
      where: { id: record.id },
      data: { attempts: updatedAttempts },
    });

    const remaining = Math.max(0, record.maxAttempts - updatedAttempts);
    return {
      valid: false,
      error: remaining > 0 ? `Incorrect code. ${remaining} attempts remaining.` : "Incorrect code. Maximum attempts exceeded.",
      remainingAttempts: remaining,
    };
  }

  // Success: mark OTP verified
  await prisma.emailOtp.update({
    where: { id: record.id },
    data: { verified: true },
  });

  return { valid: true };
}
