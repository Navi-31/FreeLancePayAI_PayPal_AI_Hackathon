import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getServerSession } from "@/backend/auth/auth";
import { recordAuditLog } from "@/backend/services/auditService";

export async function POST() {
  const session = await getServerSession();

  if (session) {
    await recordAuditLog({
      userId: session.userId,
      action: "user_logged_out",
      entityType: "User",
      entityId: session.userId,
    });
  }

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
