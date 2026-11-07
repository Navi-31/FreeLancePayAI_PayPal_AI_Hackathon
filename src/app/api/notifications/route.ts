import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/backend/auth/auth";
import {
  listNotifications,
  getUnreadNotificationCount,
  getCachedNotificationsData,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/backend/services/notificationService";
import { z } from "zod";

const patchSchema = z.object({
  id: z.string().optional(),
  all: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const readParam = searchParams.get("read");
    const read = readParam !== null ? readParam === "true" : undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // Fast path: standard top nav bar polling uses cached aggregated data
    if (read === undefined && limit <= 10) {
      const cached = await getCachedNotificationsData(session.userId, limit);
      return NextResponse.json(cached);
    }

    const [notifications, unreadCount] = await Promise.all([
      listNotifications(session.userId, { read, limit }),
      getUnreadNotificationCount(session.userId),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("List notifications error:", error);
    return NextResponse.json({ error: "Failed to list notifications" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = patchSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    if (result.data.all) {
      const updateResult = await markAllNotificationsAsRead(session.userId);
      const unreadCount = await getUnreadNotificationCount(session.userId);
      return NextResponse.json({
        success: true,
        updatedCount: updateResult.count,
        unreadCount,
      });
    }

    if (result.data.id) {
      const updated = await markNotificationAsRead(session.userId, result.data.id);
      const unreadCount = await getUnreadNotificationCount(session.userId);
      return NextResponse.json({
        success: true,
        notification: updated,
        unreadCount,
      });
    }

    return NextResponse.json({ error: "Either 'id' or 'all: true' is required" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update notification" },
      { status: 400 }
    );
  }
}
