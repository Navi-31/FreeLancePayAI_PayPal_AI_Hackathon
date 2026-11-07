import { NextResponse } from "next/server";
import { z } from "zod";
import { requestPasswordReset } from "@/backend/services/passwordResetService";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
});

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
    const response = await requestPasswordReset(email);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error processing password reset request" },
      { status: 500 }
    );
  }
}
