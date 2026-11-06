import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { recordAuditLog } from "@/services/auditService";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  businessName: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, businessName } = result.data;

    // Check if email already registered
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create user and profile in atomic transaction
    const user = await prisma.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash,
          role: "freelancer",
          badge: "PRO VIP",
          profile: {
            create: {
              title: "Independent Consultant",
              businessName: businessName || `${name} Studio`,
              country: "US",
              currency: "USD",
            },
          },
          financialSettings: {
            create: {
              baseCurrency: "USD",
              defaultTerms: "Net-14",
              taxRoutingEnabled: true,
              lateFeeEnabled: true,
            },
          },
        },
      });
    });

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      badge: user.badge,
    });

    await recordAuditLog({
      userId: user.id,
      action: "user_registered",
      entityType: "User",
      entityId: user.id,
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
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error during registration" },
      { status: 500 }
    );
  }
}
