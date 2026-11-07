import { prisma } from "@/backend/db/db";
import {
  dispatchEmailThroughProvider,
  validateEmailAddress,
  EmailSendResult,
} from "@/backend/integrations/email/emailProvider";
import {
  renderInvoiceEmail,
  renderReminderEmail,
  renderPaymentReceiptEmail,
} from "@/backend/integrations/email/emailTemplates";
import { recordAuditLog } from "./auditService";

export interface SendEmailOptions {
  to: string;
  from?: string;
  subject: string;
  text: string;
  html?: string;
  workflow: "invoice_delivery" | "payment_reminder" | "payment_receipt" | "account_alert";
  entityType?: "Invoice" | "PaymentReminder" | "Transaction";
  entityId?: string;
  userApproved?: boolean;
  idempotencyKey?: string;
}

/**
 * Core email delivery coordinator.
 * Strictly enforces human-in-the-loop authorization, duplicate-send prevention,
 * and immutable delivery logging in Firestore.
 */
export async function sendEmail(
  userId: string,
  options: SendEmailOptions
): Promise<{
  deliveryId: string;
  status: "sent" | "delivered" | "failed" | "simulated" | "awaiting_approval";
  provider: string;
  success: boolean;
  error?: string;
  providerMessageId?: string;
}> {
  const isApprovalRequired =
    options.workflow === "payment_reminder" || options.workflow === "invoice_delivery";

  // APPROVAL-FIRST GUARD: Never dispatch client communications without explicit user approval
  if (isApprovalRequired && options.userApproved !== true) {
    const pendingRecord = await prisma.emailDelivery.create({
      data: {
        userId,
        to: options.to,
        from: options.from || "FreelancePay AI <notifications@freelancepay.ai>",
        subject: options.subject,
        bodyText: options.text,
        bodyHtml: options.html,
        workflow: options.workflow,
        entityType: options.entityType,
        entityId: options.entityId,
        status: "awaiting_approval",
        provider: "none",
        userApproved: false,
        failureReason: "Blocked: explicit human approval is required before sending.",
      },
    });

    await recordAuditLog({
      userId,
      action: "email_dispatch_blocked_pending_approval",
      entityType: "EmailDelivery",
      entityId: pendingRecord.id,
      details: { workflow: options.workflow, to: options.to },
    });

    return {
      deliveryId: pendingRecord.id,
      status: "awaiting_approval",
      provider: "none",
      success: false,
      error: "Explicit user approval is required before sending client communications.",
    };
  }

  // RECIPIENT VALIDATION GUARD
  if (!validateEmailAddress(options.to)) {
    throw new Error(`Invalid recipient email address: "${options.to}"`);
  }

  // IDEMPOTENCY GUARD: Check if already sent under this idempotency key
  if (options.idempotencyKey) {
    const existing = await prisma.emailDelivery.findUnique({
      where: { idempotencyKey: options.idempotencyKey },
    });

    if (existing && (existing.status === "sent" || existing.status === "delivered" || existing.status === "simulated")) {
      return {
        deliveryId: existing.id,
        status: existing.status as "sent" | "delivered" | "failed" | "simulated" | "awaiting_approval",
        provider: existing.provider,
        success: true,
        providerMessageId: existing.providerMessageId || undefined,
      };
    }
  }

  // Execute dispatch through configured provider abstraction
  const sendResult: EmailSendResult = await dispatchEmailThroughProvider({
    to: options.to,
    from: options.from,
    subject: options.subject,
    text: options.text,
    html: options.html,
    workflow: options.workflow,
    entityType: options.entityType,
    entityId: options.entityId,
    idempotencyKey: options.idempotencyKey,
    userApproved: options.userApproved,
  });

  const now = new Date();

  // Persist delivery record in Firestore
  const delivery = await prisma.emailDelivery.create({
    data: {
      userId,
      to: options.to,
      from: options.from || "FreelancePay AI <notifications@freelancepay.ai>",
      subject: options.subject,
      bodyText: options.text,
      bodyHtml: options.html,
      workflow: options.workflow,
      entityType: options.entityType,
      entityId: options.entityId,
      status: sendResult.status,
      provider: sendResult.provider,
      providerMessageId: sendResult.providerMessageId,
      userApproved: options.userApproved ?? true,
      sentAt: sendResult.success ? now : null,
      deliveredAt: sendResult.status === "delivered" ? now : null,
      failureReason: sendResult.error,
      idempotencyKey: options.idempotencyKey,
    },
  });

  await recordAuditLog({
    userId,
    action: `email_${sendResult.status}`,
    entityType: "EmailDelivery",
    entityId: delivery.id,
    details: {
      workflow: options.workflow,
      to: options.to,
      provider: sendResult.provider,
      status: sendResult.status,
    },
  });

  return {
    deliveryId: delivery.id,
    status: sendResult.status,
    provider: sendResult.provider,
    success: sendResult.success,
    error: sendResult.error,
    providerMessageId: sendResult.providerMessageId,
  };
}

/**
 * High-level workflow: Send Invoice Email to Client
 */
export async function sendInvoiceEmailWorkflow(
  userId: string,
  invoiceId: string,
  userApproved: boolean = true
) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      userId,
      OR: [{ id: invoiceId }, { code: invoiceId }],
    },
    include: {
      lineItems: true,
      user: { include: { profile: true } },
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found or unauthorized");
  }

  const senderName = invoice.user.profile?.businessName || invoice.user.name || "Freelance Consultant";
  const totalFormatted = `${invoice.currencySymbol}${Number(invoice.total).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const dueDateFormatted = new Date(invoice.dueDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const paymentUrl = `https://freelancepay.ai/pay/${invoice.code}`;

  const { text, html } = renderInvoiceEmail({
    invoiceCode: invoice.code,
    clientName: invoice.clientName,
    senderName,
    totalFormatted,
    dueDateFormatted,
    paymentUrl,
    lineItems: invoice.lineItems.map((li) => ({
      description: li.description,
      quantity: Number(li.quantity),
      rate: `${invoice.currencySymbol}${Number(li.rate).toFixed(2)}`,
      amount: `${invoice.currencySymbol}${Number(li.amount).toFixed(2)}`,
    })),
    notes: invoice.notes || undefined,
  });

  const idempotencyKey = `email_inv_${invoice.id}_${new Date().toISOString().split("T")[0]}`;

  const result = await sendEmail(userId, {
    to: invoice.clientEmail,
    subject: `Invoice #${invoice.code} from ${senderName} — ${totalFormatted}`,
    text,
    html,
    workflow: "invoice_delivery",
    entityType: "Invoice",
    entityId: invoice.id,
    userApproved,
    idempotencyKey,
  });

  if (result.success) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        lastEmailSentAt: new Date(),
        emailDeliveryStatus: result.status,
      },
    });
  }

  return result;
}

/**
 * High-level workflow: Send Payment Reminder Email to Client
 */
export async function sendReminderEmailWorkflow(
  userId: string,
  reminderId: string,
  userApproved: boolean = true,
  customOverrides?: {
    to?: string;
    subject?: string;
    text?: string;
  }
) {
  const reminder = await prisma.paymentReminder.findFirst({
    where: {
      userId,
      OR: [{ id: reminderId }, { code: reminderId }],
    },
    include: {
      invoice: true,
    },
  });

  // If reminder exists in DB, dispatch with optional composer overrides and record state
  if (reminder) {
    const targetTo = customOverrides?.to?.trim() || reminder.clientEmail;
    const targetSubject = customOverrides?.subject?.trim() || reminder.subject;
    const targetBody = customOverrides?.text?.trim() || reminder.messageBody;

    const amountFormatted = `${reminder.currency === "EUR" ? "€" : "$"}${Number(reminder.amount).toLocaleString(
      undefined,
      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    )}`;

    const dueDateFormatted = new Date(reminder.dueDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const invoiceCode = reminder.invoice?.code || reminder.invoiceId || "INV";

    const { text, html } = renderReminderEmail({
      clientName: reminder.clientName,
      invoiceCode,
      amountFormatted,
      dueDateFormatted,
      paymentUrl: reminder.paymentLink || `https://freelancepay.ai/pay/${invoiceCode}`,
      tone: (reminder.activeTone as "polite" | "firm" | "final") || "polite",
      bodyText: targetBody,
    });

    const idempotencyKey = `email_rem_${reminder.id}_${Date.now()}`;

    const result = await sendEmail(userId, {
      to: targetTo,
      subject: targetSubject,
      text,
      html,
      workflow: "payment_reminder",
      entityType: "PaymentReminder",
      entityId: reminder.id,
      userApproved,
      idempotencyKey,
    });

    if (result.success) {
      const now = new Date();
      const activeTone = (reminder.activeTone as string) || "polite";
      await prisma.$transaction([
        prisma.paymentReminder.update({
          where: { id: reminder.id },
          data: {
            clientEmail: targetTo,
            subject: targetSubject,
            messageBody: targetBody,
            status: "sent",
            realSentAt: now,
            emailDeliveryId: result.deliveryId,
            lastOutreachDate: now,
            lastOutreachType: `${activeTone.toUpperCase()} Email`,
          },
        }),
        prisma.reminderHistory.create({
          data: {
            reminderId: reminder.id,
            action: "email_sent",
            tone: activeTone,
            notes: `Reminder delivered to ${targetTo} via ${result.provider} provider (${result.status}).`,
            userApproved,
          },
        }),
      ]);
    }

    return result;
  }

  // Fallback for custom / local reminder drafts not yet persisted to Firestore
  if (customOverrides?.to && customOverrides?.subject && customOverrides?.text) {
    const idempotencyKey = `email_rem_custom_${Date.now()}`;
    return await sendEmail(userId, {
      to: customOverrides.to.trim(),
      subject: customOverrides.subject.trim(),
      text: customOverrides.text.trim(),
      workflow: "payment_reminder",
      userApproved,
      idempotencyKey,
    });
  }

  throw new Error("Reminder not found or unauthorized");
}

/**
 * High-level workflow: Send Payment Receipt Confirmation
 */
export async function sendPaymentReceiptEmailWorkflow(
  userId: string,
  invoiceId: string,
  transactionCode: string
) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      userId,
      OR: [{ id: invoiceId }, { code: invoiceId }],
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found or unauthorized");
  }

  const amountFormatted = `${invoice.currencySymbol}${Number(invoice.total).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const { text, html } = renderPaymentReceiptEmail({
    clientName: invoice.clientName,
    invoiceCode: invoice.code,
    amountFormatted,
    paymentChannel: invoice.paymentChannel,
    transactionCode,
    settledAtFormatted: new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
  });

  const idempotencyKey = `email_rcpt_${invoice.id}_${transactionCode}`;

  return sendEmail(userId, {
    to: invoice.clientEmail,
    subject: `Payment Receipt: Invoice #${invoice.code} Settled`,
    text,
    html,
    workflow: "payment_receipt",
    entityType: "Invoice",
    entityId: invoice.id,
    userApproved: true,
    idempotencyKey,
  });
}

/**
 * Query email delivery history for a user
 */
export async function listEmailDeliveries(
  userId: string,
  options?: { limit?: number; offset?: number; workflow?: string }
) {
  return prisma.emailDelivery.findMany({
    where: {
      userId,
      ...(options?.workflow ? { workflow: options.workflow } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
  });
}
