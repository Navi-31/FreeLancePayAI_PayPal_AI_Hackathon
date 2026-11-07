import { prisma } from "@/backend/db/db";

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: "info" | "warning" | "success" | "alert" | "approval_needed";
  link?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(params: CreateNotificationParams) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type || "info",
      link: params.link,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      read: false,
    },
  });
}

export async function listNotifications(
  userId: string,
  options?: { read?: boolean; limit?: number; offset?: number }
) {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(options?.read !== undefined ? { read: options.read } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
  });
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  });
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new Error("Notification not found or unauthorized");
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}

export async function deleteNotification(userId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new Error("Notification not found or unauthorized");
  }

  return prisma.notification.delete({
    where: { id: notificationId },
  });
}
