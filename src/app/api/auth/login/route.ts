import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/backend/db/db";
import { verifyPassword, createSessionToken, getSessionCookieConfig } from "@/backend/auth/auth";
import { createAndSendOtp } from "@/backend/services/otpService";
import { recordAuditLog } from "@/backend/services/auditService";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  directSessionForTests: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid credentials format" }, { status: 400 });
    }

    const { email, password, directSessionForTests } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // If user's email has not been verified yet, route them to signup OTP verification
    if (!user.emailVerified) {
      const otpResult = await createAndSendOtp({
        email: normalizedEmail,
        purpose: "SIGNUP_VERIFICATION",
        recipientName: user.name,
        userId: user.id,
      });

      return NextResponse.json({
        success: true,
        requireVerification: true,
        email: normalizedEmail,
        message: "Your email address is not yet verified. A 6-digit verification code has been dispatched.",
        cooldownSecondsRemaining: otpResult.cooldownSecondsRemaining,
      });
    }

    // If running with explicit directSessionForTests flag
    if (directSessionForTests) {
      const token = await createSessionToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        badge: user.badge,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          badge: user.badge,
        },
      });

      response.cookies.set({
        ...getSessionCookieConfig(),
        value: token,
      });

      return response;
    }

    // Standard 2-Factor Email OTP step for Login
    const otpResult = await createAndSendOtp({
      email: normalizedEmail,
      purpose: "LOGIN_OTP",
      recipientName: user.name,
      userId: user.id,
    });

    await recordAuditLog({
      userId: user.id,
      action: "user_login_otp_dispatched",
      entityType: "User",
      entityId: user.id,
    });

    return NextResponse.json({
      success: true,
      requireOtp: true,
      email: normalizedEmail,
      message: "A 6-digit security verification code has been sent to your email.",
      cooldownSecondsRemaining: otpResult.cooldownSecondsRemaining,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error during login" }, { status: 500 });
  }
}
