import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/backend/db/db";
import { createAndSendOtp } from "@/backend/services/otpService";

const resendOtpSchema = z.object({
  email: z.string().email(),
  purpose: z.enum(["SIGNUP_VERIFICATION", "LOGIN_OTP"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = resendOtpSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request format", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, purpose } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Don't leak user presence unconditionally, but for OTP resend return a gentle status
      return NextResponse.json(
        { error: "No pending verification found for this email address" },
        { status: 404 }
      );
    }

    const otpResult = await createAndSendOtp({
      email: normalizedEmail,
      purpose,
      recipientName: user.name,
      userId: user.id,
    });

    if (!otpResult.success && otpResult.cooldownSecondsRemaining) {
      return NextResponse.json(
        {
          error: otpResult.error,
          cooldownSecondsRemaining: otpResult.cooldownSecondsRemaining,
        },
        { status: 429 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "A fresh verification code has been dispatched to your email.",
      cooldownSecondsRemaining: 100,
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error while resending verification code" },
      { status: 500 }
    );
  }
}
