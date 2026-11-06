import { prisma } from "@/lib/db";
import { recordAuditLog } from "./auditService";

export async function listReminders(userId: string) {
  return prisma.paymentReminder.findMany({
    where: { userId },
    include: {
      invoice: true,
      history: {
        orderBy: { timestamp: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getReminderById(userId: string, reminderId: string) {
  return prisma.paymentReminder.findFirst({
    where: {
      userId,
      OR: [{ id: reminderId }, { code: reminderId }],
    },
    include: {
      invoice: true,
      history: {
        orderBy: { timestamp: "desc" },
      },
    },
  });
}

export async function updateReminderTone(
  userId: string,
  reminderId: string,
  tone: "polite" | "firm" | "final",
  userApproved: boolean = true,
  notes?: string
) {
  const reminder = await prisma.paymentReminder.findFirst({
    where: {
      userId,
      OR: [{ id: reminderId }, { code: reminderId }],
    },
  });

  if (!reminder) {
    throw new Error("Reminder not found or unauthorized");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.paymentReminder.update({
      where: { id: reminder.id },
      data: { activeTone: tone },
    });

    await tx.reminderHistory.create({
      data: {
        reminderId: reminder.id,
        action: "tone_changed",
        tone,
        notes: notes || `Tone updated to ${tone}`,
        userApproved,
      },
    });

    return updated;
  });

  await recordAuditLog({
    userId,
    action: "reminder_tone_updated",
    entityType: "PaymentReminder",
    entityId: reminder.id,
    details: { tone, userApproved },
  });

  return result;
}

export async function simulateSendReminder(
  userId: string,
  reminderId: string,
  userApproved: boolean = true
) {
  const reminder = await prisma.paymentReminder.findFirst({
    where: {
      userId,
      OR: [{ id: reminderId }, { code: reminderId }],
    },
  });

  if (!reminder) {
    throw new Error("Reminder not found or unauthorized");
  }

  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.paymentReminder.update({
      where: { id: reminder.id },
      data: {
        status: "sent",
        simulatedSentAt: now,
        lastOutreachDate: now,
        lastOutreachType: `${reminder.activeTone.toUpperCase()} Email Wave`,
      },
    });

    await tx.reminderHistory.create({
      data: {
        reminderId: reminder.id,
        action: "simulated_send",
        tone: reminder.activeTone,
        notes: `Autonomous reminder dispatched under ${reminder.activeTone} protocol.`,
        userApproved,
      },
    });

    return updated;
  });

  await recordAuditLog({
    userId,
    action: "reminder_dispatched",
    entityType: "PaymentReminder",
    entityId: reminder.id,
    details: { tone: reminder.activeTone, clientEmail: reminder.clientEmail },
  });

  return result;
}
