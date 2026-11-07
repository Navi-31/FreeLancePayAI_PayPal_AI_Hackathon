import crypto from "crypto";
import { prisma } from "@/backend/db/db";
import { hashPassword } from "@/backend/auth/auth";
import { dispatchEmailThroughProvider } from "@/backend/integrations/email/emailProvider";
import { renderPasswordResetEmail, renderPasswordChangedEmail } from "@/backend/integrations/email/emailTemplates";
import { env } from "@/backend/validation/env";

const RESET_TOKEN_EXPIRY_MINUTES = 15;

/**
 * Computes a SHA-256 hash of the reset token so raw tokens are never persisted in the database.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

export interface RequestPasswordResetResult {
  success: boolean;
  message: string;
}

/**
 * Initiates a password reset.
 * Always returns a generic success message to prevent user enumeration.
 */
export async function requestPasswordReset(email: string): Promise<RequestPasswordResetResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const genericResponse = {
    success: true,
    message: "If an account exists with this email address, you will receive password reset instructions.",
  };

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    // Return early without error to prevent user enumeration
    return genericResponse;
  }

  // Invalidate any older unused tokens for this email
  await prisma.passwordResetToken.updateMany({
    where: {
      email: normalizedEmail,
      used: false,
    },
    data: {
      used: true,
    },
  });

  // Generate 32 bytes cryptographically secure random token (64 hex characters)
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

  const resetRecord = await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      email: normalizedEmail,
      tokenHash,
      expiresAt,
      used: false,
    },
  });

  // Construct reset URL
  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(normalizedEmail)}`;

  const { html, text } = renderPasswordResetEmail({
    recipientName: user.name,
    resetUrl,
    expiryMinutes: RESET_TOKEN_EXPIRY_MINUTES,
  });

  await dispatchEmailThroughProvider({
    to: normalizedEmail,
    subject: "Reset Your FreelancePay AI Password",
    text,
    html,
    workflow: "password_reset",
    entityType: "PasswordResetToken",
    entityId: resetRecord.id,
  });

  return genericResponse;
}

/**
 * Creates a single-use password reset authorization token after email OTP verification.
 * Valid for 15 minutes to allow the user to set a new password.
 */
export async function createPasswordResetTokenAfterOtp(
  email: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return { success: false, error: "Account not found for this email address." };
  }

  // Invalidate any older unused reset tokens
  await prisma.passwordResetToken.updateMany({
    where: {
      email: normalizedEmail,
      used: false,
    },
    data: {
      used: true,
    },
  });

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      email: normalizedEmail,
      tokenHash,
      expiresAt,
      used: false,
    },
  });

  return { success: true, token: rawToken };
}

export interface ResetPasswordResult {
  success: boolean;
  error?: string;
}

/**
 * Verifies the reset token and updates the user's password.
 */
export async function resetPasswordWithToken(
  email: string,
  rawToken: string,
  newPassword: string
): Promise<ResetPasswordResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const resetRecord = await prisma.passwordResetToken.findFirst({
    where: {
      email: normalizedEmail,
      tokenHash,
      used: false,
    },
  });

  if (!resetRecord) {
    return {
      success: false,
      error: "Invalid or expired password reset link. Please request a new one.",
    };
  }

  if (resetRecord.expiresAt < now) {
    return {
      success: false,
      error: "This password reset link has expired. Please request a new one.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return {
      success: false,
      error: "Associated user account could not be found.",
    };
  }

  // Hash new password using bcrypt
  const newPasswordHash = await hashPassword(newPassword);

  // Atomically update password and mark token as used
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { used: true },
    }),
  ]);

  // Dispatch confirmation email
  const { html, text } = renderPasswordChangedEmail({
    recipientName: user.name,
  });

  await dispatchEmailThroughProvider({
    to: normalizedEmail,
    subject: "Security Confirmation: Password Updated",
    text,
    html,
    workflow: "account_alert",
    entityType: "PasswordResetToken",
    entityId: resetRecord.id,
  });

  return { success: true };
}
