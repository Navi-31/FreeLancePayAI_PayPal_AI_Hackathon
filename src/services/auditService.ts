import { prisma } from "@/lib/db";

export interface LogAuditParams {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  actor?: "user" | "system" | "ai_copilot_authorized";
  ipAddress?: string;
  details?: Record<string, unknown>;
}

export async function recordAuditLog(params: LogAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        actor: params.actor ?? "user",
        ipAddress: params.ipAddress,
        details: params.details ? JSON.stringify(params.details) : undefined,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
    return null;
  }
}
