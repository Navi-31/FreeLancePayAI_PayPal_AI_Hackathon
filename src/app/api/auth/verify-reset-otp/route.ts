import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtpCode } from "@/backend/services/otpService";
import { createPasswordResetTokenAfterOtp } from "@/backend/services/passwordResetService";

const verifyResetOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(6).max(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = verifyResetOtpSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid verification code format" },
        { status: 400 }
      );
    }

    const { email, otp } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP code specifically for PASSWORD_RESET purpose
    const verification = await verifyOtpCode(normalizedEmail, "PASSWORD_RESET", otp);
    if (!verification.valid) {
      return NextResponse.json(
        {
          error: verification.error || "Invalid or expired verification code",
          remainingAttempts: verification.remainingAttempts,
        },
        { status: 400 }
      );
    }

    // Generate single-use reset authorization token
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
      message: "Security code verified. Please enter your new password.",
    });
  } catch (error) {
    console.error("Verify reset OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error during OTP verification" },
      { status: 500 }
    );
  }
}
