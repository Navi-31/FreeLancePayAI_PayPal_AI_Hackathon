import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/backend/db/db";
import { createSessionToken, getSessionCookieConfig } from "@/backend/auth/auth";
import { verifyOtpCode } from "@/backend/services/otpService";
import { createPasswordResetTokenAfterOtp } from "@/backend/services/passwordResetService";
import { mirrorUserDataset } from "@/backend/services/userMigrationService";
import { recordAuditLog } from "@/backend/services/auditService";

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(6).max(6),
  purpose: z.enum(["SIGNUP_VERIFICATION", "LOGIN_OTP", "PASSWORD_RESET"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = verifyOtpSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid verification request format", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, otp, purpose } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP code
    const verification = await verifyOtpCode(normalizedEmail, purpose, otp);
    if (!verification.valid) {
      return NextResponse.json(
        {
          error: verification.error || "Invalid verification code",
          remainingAttempts: verification.remainingAttempts,
        },
        { status: 400 }
      );
    }

    // Find user record
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User account not found for this email address" },
        { status: 404 }
      );
    }

    // If verifying password reset OTP, return a single-use reset authorization token
    if (purpose === "PASSWORD_RESET") {
      const tokenResult = await createPasswordResetTokenAfterOtp(normalizedEmail);
      if (!tokenResult.success || !tokenResult.token) {
        return NextResponse.json(
          { error: tokenResult.error || "Unable to authorize password reset" },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        resetToken: tokenResult.token,
        message: "Security code verified. Please set your new password.",
      });
    }

    let datasetMigration = null;

    // If verifying signup email
    if (purpose === "SIGNUP_VERIFICATION" || !user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });

      // Check if this account is configured for automated initial dataset mirroring
      const primaryTargetEmail = (process.env.PRIMARY_ACCOUNT_EMAIL || "").toLowerCase().trim();
      const shouldMirror =
        (primaryTargetEmail && normalizedEmail === primaryTargetEmail) ||
        process.env.AUTO_MIRROR_SAMPLE_DATA === "true";

      if (shouldMirror) {
        const sourceEmail = (process.env.PRIMARY_ACCOUNT_EMAIL || "").toLowerCase().trim();
        if (sourceEmail && sourceEmail !== normalizedEmail) {
          datasetMigration = await mirrorUserDataset(sourceEmail, user.id);
        }
      }
    }

    // Create session token
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      badge: user.badge,
    });

    await recordAuditLog({
      userId: user.id,
      action: purpose === "SIGNUP_VERIFICATION" ? "user_signup_verified" : "user_login_verified",
      entityType: "User",
      entityId: user.id,
    });

    const response = NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        badge: user.badge,
        profile: user.profile,
      },
      datasetMigration,
    });

    response.cookies.set({
      ...getSessionCookieConfig(),
      value: token,
    });

    return response;
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { error: "Internal server error during verification" },
      { status: 500 }
    );
  }
}
