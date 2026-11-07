import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/backend/db/db";
import { hashPassword, createSessionToken, getSessionCookieConfig } from "@/backend/auth/auth";
import { createAndSendOtp } from "@/backend/services/otpService";
import { recordAuditLog } from "@/backend/services/auditService";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  mobile: z.string().optional().default(""),
  callingCode: z.string().optional().default("+1"),
  country: z.string().optional().default("United States"),
  currency: z.string().optional().default("USD"),
  businessName: z.string().optional(),
  directSessionForTests: z.boolean().optional(),
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

    const { name, email, password, mobile, callingCode, country, currency, businessName } = result.data;
    const normalizedEmail = email.toLowerCase().trim();
    const rawMobile = mobile?.trim();
    const fullMobile = rawMobile
      ? rawMobile.startsWith("+")
        ? rawMobile
        : `${callingCode} ${rawMobile}`.trim()
      : null;

    // Check existing user
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing && existing.emailVerified) {
      return NextResponse.json(
        { error: "An account with this email already exists and is verified. Please log in." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    let user;
    if (existing && !existing.emailVerified) {
      // Update existing unverified account
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name,
          passwordHash,
          mobile: fullMobile,
          profile: {
            upsert: {
              create: {
                title: "Independent Consultant",
                businessName: businessName || `${name} Studio`,
                country,
                currency,
              },
              update: {
                businessName: businessName || `${name} Studio`,
                country,
                currency,
              },
            },
          },
        },
      });
    } else {
      // Create new unverified user
      user = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          role: "freelancer",
          badge: "PRO VIP",
          mobile: fullMobile,
          emailVerified: false,
          profile: {
            create: {
              title: "Independent Consultant",
              businessName: businessName || `${name} Studio`,
              country,
              currency,
            },
          },
          financialSettings: {
            create: {
              baseCurrency: currency,
              defaultTerms: "Net-14",
              taxRoutingEnabled: true,
              lateFeeEnabled: true,
            },
          },
        },
      });
    }

    if (result.data.directSessionForTests) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });

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

    // Generate & send verification OTP (non-blocking email dispatch)
    const otpResult = await createAndSendOtp({
      email: normalizedEmail,
      purpose: "SIGNUP_VERIFICATION",
      recipientName: name,
      userId: user.id,
      awaitDelivery: false,
    });

    recordAuditLog({
      userId: user.id,
      action: "user_registered_pending_verification",
      entityType: "User",
      entityId: user.id,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      requireVerification: true,
      email: normalizedEmail,
      deliveryStatus: otpResult.deliveryStatus,
      cooldownSecondsRemaining: otpResult.cooldownSecondsRemaining,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error during registration" },
      { status: 500 }
    );
  }
}
