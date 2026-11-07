import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/backend/db/db";
import { createAndSendOtp } from "@/backend/services/otpService";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
});

function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const [name, domain] = parts;
  if (name.length <= 2) return `${name}•••@${domain}`;
  return `${name[0]}••••${name.slice(-1)}@${domain}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid email address format" },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // To prevent user enumeration, always return success to the client
    if (!user) {
      return NextResponse.json({
        success: true,
        email: normalizedEmail,
        maskedEmail: maskEmail(normalizedEmail),
        message: "If an account exists with this email address, a 6-digit verification code has been dispatched.",
        cooldownSecondsRemaining: 60,
      });
    }

    const otpResult = await createAndSendOtp({
      email: normalizedEmail,
      purpose: "PASSWORD_RESET",
      recipientName: user.name,
      userId: user.id,
      awaitDelivery: true,
    });

    if (!otpResult.success) {
      if (otpResult.cooldownSecondsRemaining) {
        return NextResponse.json(
          {
            error: otpResult.error,
            cooldownSecondsRemaining: otpResult.cooldownSecondsRemaining,
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: otpResult.error || "Failed to deliver password reset email. Please check your SMTP settings." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      maskedEmail: maskEmail(normalizedEmail),
      message: "A 6-digit password reset verification code has been sent to your email.",
      cooldownSecondsRemaining: 60,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error processing password reset request" },
      { status: 500 }
    );
  }
}
