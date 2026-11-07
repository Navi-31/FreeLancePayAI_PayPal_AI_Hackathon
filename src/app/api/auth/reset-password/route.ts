import { NextResponse } from "next/server";
import { z } from "zod";
import { resetPasswordWithToken } from "@/backend/services/passwordResetService";

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  token: z.string().min(10, "Invalid reset token"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, token, newPassword } = result.data;
    const resetResult = await resetPasswordWithToken(email, token, newPassword);

    if (!resetResult.success) {
      return NextResponse.json(
        { error: resetResult.error || "Password reset failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully reset. You may now log in with your new password.",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Internal server error during password reset" },
      { status: 500 }
    );
  }
}
