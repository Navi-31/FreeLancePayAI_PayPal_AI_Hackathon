import { NextResponse } from "next/server";
import { getSessionCookieConfig, getServerSession } from "@/backend/auth/auth";
import { recordAuditLog } from "@/backend/services/auditService";
import { invalidateDashboardMetricsCache } from "@/backend/services/dashboardService";
import { invalidateAiInsightsCache } from "@/backend/services/aiService";
import { invalidateSessionUserCache } from "@/backend/auth/sessionUserCache";

export async function POST() {
  const session = await getServerSession();

  if (session) {
    await recordAuditLog({
      userId: session.userId,
      action: "user_logged_out",
      entityType: "User",
      entityId: session.userId,
    });
    invalidateDashboardMetricsCache(session.userId);
    invalidateAiInsightsCache(session.userId);
    invalidateSessionUserCache(session.userId);
  }

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });

  response.cookies.set({
    ...getSessionCookieConfig({ maxAge: 0, expires: new Date(0) }),
    value: "",
  });

  return response;
}
