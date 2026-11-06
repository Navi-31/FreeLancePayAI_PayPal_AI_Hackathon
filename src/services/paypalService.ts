import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  createPayPalOrder,
  capturePayPalOrder,
  authorizePayPalOrder,
  capturePayPalAuthorization,
  voidPayPalAuthorization,
  refundPayPalCapture,
  createPayPalInvoice,
  sendPayPalInvoice,
  getPayPalInvoice,
  verifyPayPalWebhookSignature,
  isPayPalConfigured,
  getPayPalBaseUrl,
} from "@/lib/paypal";
import {
  calculateTransactionNet,
  calculateTaxReserveAllocation,
} from "@/lib/financialCalculations";
import { recordAuditLog } from "./auditService";

export { voidPayPalAuthorization };

export interface RefundPaymentInput {
  invoiceId?: string;
  milestoneId?: string;
  transactionId?: string;
  amount?: number;
  reason?: string;
}

/**
 * Create a PayPal Checkout Order for paying an existing invoice.
 */
export async function createInvoicePaymentOrder(
  userId: string,
  invoiceId: string,
  returnUrl?: string,
  cancelUrl?: string
) {
  // 1. Enforce authenticated ownership and existence
  const invoice = await prisma.invoice.findFirst({
    where: {
      userId,
      OR: [{ id: invoiceId }, { code: invoiceId }],
    },
    include: { lineItems: true },
  });

  if (!invoice) {
    throw new Error("Invoice not found or unauthorized");
  }

  if (invoice.status === "paid") {
    throw new Error("Invoice has already been settled and paid");
  }

  if (invoice.status === "cancelled") {
    throw new Error("Cannot create payment order for a cancelled invoice");
  }

  const authoritativeTotal = Number(invoice.total);
  if (authoritativeTotal <= 0) {
    throw new Error("Invoice total must be greater than zero");
  }

  // 2. Call PayPal Orders v2 API (intent = CAPTURE)
  const order = await createPayPalOrder({
    referenceId: invoice.code,
    amount: authoritativeTotal,
    currency: invoice.currency,
    description: `Payment for Invoice #${invoice.code} - ${invoice.projectTitle}`,
    intent: "CAPTURE",
    customId: invoice.id,
    returnUrl,
    cancelUrl,
  });

  // 3. Persist order ID to database
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { paypalOrderId: order.id },
  });

  await recordAuditLog({
    userId,
    action: "paypal_order_created",
    entityType: "Invoice",
    entityId: invoice.id,
    details: { orderId: order.id, amount: authoritativeTotal, currency: invoice.currency },
  });

  return {
    orderId: order.id,
    status: order.status,
    approveUrl: order.approveUrl,
    invoiceId: invoice.id,
    amount: authoritativeTotal,
    currency: invoice.currency,
    isSandbox: true,
  };
}

/**
 * Capture an approved PayPal order and atomically record invoice settlement.
 */
export async function captureInvoicePayment(
  userId: string,
  invoiceId: string,
  orderId?: string
) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      userId,
      OR: [{ id: invoiceId }, { code: invoiceId }],
    },
    include: { client: true },
  });

  if (!invoice) {
    throw new Error("Invoice not found or unauthorized");
  }

  const targetOrderId = orderId || invoice.paypalOrderId;
  if (!targetOrderId) {
    throw new Error("No PayPal order ID associated with this invoice");
  }

  // Execute PayPal Capture API
  const capture = await capturePayPalOrder(targetOrderId, {
    value: Number(invoice.total),
    currency: invoice.currency,
  });

  if (capture.status !== "COMPLETED") {
    throw new Error(`PayPal capture was not completed. Current status: ${capture.status}`);
  }

  const gross = Number(capture.amount?.value || invoice.total);
  const fee = capture.seller_receivable_breakdown?.paypal_fee?.value
    ? Number(capture.seller_receivable_breakdown.paypal_fee.value)
    : Number((gross * 0.029 + 0.3).toFixed(2));
  const net = capture.seller_receivable_breakdown?.net_amount?.value
    ? Number(capture.seller_receivable_breakdown.net_amount.value)
    : calculateTransactionNet(gross, fee, 0);

  const taxReserve = calculateTaxReserveAllocation(gross, 20);
  const txCode = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;
  const hash = `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 6)}`;

  // Atomically update DB records in transaction
  const updatedInvoice = await prisma.$transaction(async (tx) => {
    // 1. Mark invoice as paid
    const inv = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "paid",
        paidAt: new Date(),
        paypalCaptureId: capture.id,
        paypalOrderId: targetOrderId,
      },
    });

    // 2. Create settled transaction record with idempotent key
    await tx.transaction.create({
      data: {
        code: txCode,
        userId,
        hash,
        description: `PayPal Settlement: Invoice #${invoice.code}`,
        clientName: invoice.clientName,
        type: "client_settlement",
        status: "settled",
        currency: invoice.currency,
        currencySymbol: invoice.currencySymbol,
        grossAmount: new Prisma.Decimal(gross),
        feeAmount: new Prisma.Decimal(fee),
        netAmount: new Prisma.Decimal(net),
        taxReserveSplitAmount: new Prisma.Decimal(taxReserve),
        paymentChannel: "PayPal Direct",
        linkedInvoiceId: invoice.id,
        paypalOrderId: targetOrderId,
        paypalCaptureId: capture.id,
        idempotencyKey: `paypal_capture_${capture.id}`,
      },
    });

    // 3. Update client metrics if client is linked
    if (invoice.clientId) {
      await tx.client.update({
        where: { id: invoice.clientId },
        data: {
          lifetimeRevenue: { increment: new Prisma.Decimal(gross) },
          outstandingBalance: { decrement: new Prisma.Decimal(gross) },
        },
      });

      await tx.clientPaymentHistory.create({
        data: {
          clientId: invoice.clientId,
          invoiceId: invoice.id,
          amount: new Prisma.Decimal(gross),
          currency: invoice.currency,
          paymentChannel: "PayPal Direct",
          status: "settled",
          settledAt: new Date(),
          lagDays: 0,
        },
      });
    }

    return inv;
  });

  await recordAuditLog({
    userId,
    action: "paypal_payment_captured",
    entityType: "Invoice",
    entityId: invoice.id,
    details: {
      orderId: targetOrderId,
      captureId: capture.id,
      grossAmount: gross,
      netAmount: net,
    },
  });

  return {
    success: true,
    invoice: updatedInvoice,
    captureId: capture.id,
    netAmount: net,
    grossAmount: gross,
  };
}

/**
 * Create and dispatch a PayPal Invoice using the Invoicing v2 API.
 */
export async function createAndSendPayPalInvoiceRecord(userId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      userId,
      OR: [{ id: invoiceId }, { code: invoiceId }],
    },
    include: { lineItems: true },
  });

  if (!invoice) {
    throw new Error("Invoice not found or unauthorized");
  }

  const ppInvoice = await createPayPalInvoice({
    invoiceNumber: invoice.code,
    currency: invoice.currency,
    issueDate: invoice.issueDate.toISOString().split("T")[0],
    dueDate: invoice.dueDate.toISOString().split("T")[0],
    recipientEmail: invoice.clientEmail,
    recipientName: invoice.clientName,
    items: invoice.lineItems.map((li) => ({
      name: li.description,
      quantity: Number(li.quantity),
      unitAmount: Number(li.rate),
    })),
    note: invoice.notes || undefined,
  });

  await sendPayPalInvoice(ppInvoice.id);

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      paypalInvoiceId: ppInvoice.id,
      status: invoice.status === "draft" ? "sent" : invoice.status,
    },
  });

  await recordAuditLog({
    userId,
    action: "paypal_invoice_dispatched",
    entityType: "Invoice",
    entityId: invoice.id,
    details: { paypalInvoiceId: ppInvoice.id },
  });

  return {
    success: true,
    paypalInvoiceId: ppInvoice.id,
    invoice: updated,
  };
}

/**
 * Synchronize invoice status with PayPal Invoicing API.
 */
export async function syncPayPalInvoiceStatus(userId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      userId,
      OR: [{ id: invoiceId }, { code: invoiceId }],
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found or unauthorized");
  }

  if (!invoice.paypalInvoiceId) {
    throw new Error("Invoice is not linked to a PayPal Invoicing record");
  }

  const ppInvoice = await getPayPalInvoice(invoice.paypalInvoiceId);

  let newStatus = invoice.status;
  if (ppInvoice.status === "PAID" || ppInvoice.status === "MARKED_AS_PAID") {
    newStatus = "paid";
  } else if (ppInvoice.status === "SENT" && invoice.status === "draft") {
    newStatus = "sent";
  } else if (ppInvoice.status === "CANCELLED") {
    newStatus = "cancelled";
  }

  if (newStatus !== invoice.status) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: newStatus,
        ...(newStatus === "paid" ? { paidAt: new Date() } : {}),
      },
    });
  }

  return {
    invoiceId: invoice.id,
    paypalStatus: ppInvoice.status,
    localStatus: newStatus,
  };
}

/**
 * Create a PayPal Order with intent = AUTHORIZE for milestone-based authorization.
 */
export async function createMilestoneAuthorizationOrder(
  userId: string,
  milestoneId: string,
  returnUrl?: string,
  cancelUrl?: string
) {
  const milestone = await prisma.milestone.findFirst({
    where: {
      OR: [{ id: milestoneId }, { code: milestoneId }],
      project: { userId },
    },
    include: {
      project: { include: { client: true } },
    },
  });

  if (!milestone) {
    throw new Error("Milestone not found or unauthorized");
  }

  if (milestone.status !== "pending") {
    throw new Error(`Milestone is not in pending status (Current: ${milestone.status})`);
  }

  const amount = Number(milestone.amount);
  if (amount <= 0) {
    throw new Error("Milestone authorization amount must be greater than zero");
  }

  // Create Order with intent = AUTHORIZE (milestone authorization)
  const order = await createPayPalOrder({
    referenceId: milestone.code,
    amount,
    currency: milestone.project.currency,
    description: `Milestone Authorization: ${milestone.title} (${milestone.code})`,
    intent: "AUTHORIZE",
    customId: milestone.id,
    returnUrl,
    cancelUrl,
  });

  await prisma.milestone.update({
    where: { id: milestone.id },
    data: { paypalOrderId: order.id },
  });

  await recordAuditLog({
    userId,
    action: "paypal_milestone_order_created",
    entityType: "Milestone",
    entityId: milestone.id,
    details: { orderId: order.id, amount },
  });

  return {
    orderId: order.id,
    status: order.status,
    approveUrl: order.approveUrl,
    milestoneId: milestone.id,
    amount,
    currency: milestone.project.currency,
    isSandbox: true,
  };
}

/**
 * Authorize milestone funds after client approves PayPal order.
 */
export async function authorizeMilestonePayment(
  userId: string,
  milestoneId: string,
  orderId?: string
) {
  const milestone = await prisma.milestone.findFirst({
    where: {
      OR: [{ id: milestoneId }, { code: milestoneId }],
      project: { userId },
    },
  });

  if (!milestone) {
    throw new Error("Milestone not found or unauthorized");
  }

  const targetOrderId = orderId || milestone.paypalOrderId;
  if (!targetOrderId) {
    throw new Error("No PayPal order ID associated with this milestone");
  }

  const auth = await authorizePayPalOrder(targetOrderId);

  if (auth.status !== "CREATED" && auth.status !== "PENDING") {
    throw new Error(`PayPal authorization was not approved. Status: ${auth.status}`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const ms = await tx.milestone.update({
      where: { id: milestone.id },
      data: {
        status: "authorized",
        authorizedAt: new Date(),
        paypalAuthorizationId: auth.id,
      },
    });

    await tx.milestoneHistory.create({
      data: {
        milestoneId: milestone.id,
        action: `Funds authorized via PayPal (Auth ID: ${auth.id})`,
        fromStatus: milestone.status,
        toStatus: "authorized",
        userConfirmed: true,
        notes: "Milestone funds successfully authorized on PayPal rails.",
      },
    });

    return ms;
  });

  await recordAuditLog({
    userId,
    action: "paypal_milestone_authorized",
    entityType: "Milestone",
    entityId: milestone.id,
    details: { authorizationId: auth.id, amount: Number(milestone.amount) },
  });

  return {
    success: true,
    milestone: updated,
    authorizationId: auth.id,
  };
}

/**
 * Capture authorized funds when freelancer delivers milestone.
 */
export async function captureMilestonePayment(userId: string, milestoneId: string) {
  const milestone = await prisma.milestone.findFirst({
    where: {
      OR: [{ id: milestoneId }, { code: milestoneId }],
      project: { userId },
    },
    include: {
      project: { include: { client: true } },
    },
  });

  if (!milestone) {
    throw new Error("Milestone not found or unauthorized");
  }

  if (milestone.status !== "authorized" && milestone.status !== "in_review") {
    throw new Error(`Milestone cannot be captured from status: ${milestone.status}`);
  }

  const authId = milestone.paypalAuthorizationId;
  if (!authId) {
    throw new Error("Milestone has no active PayPal authorization ID");
  }

  const gross = Number(milestone.amount);
  const capture = await capturePayPalAuthorization(authId, {
    value: gross,
    currency: milestone.project.currency,
  });

  if (capture.status !== "COMPLETED") {
    throw new Error(`PayPal capture failed with status: ${capture.status}`);
  }

  const fee = capture.seller_receivable_breakdown?.paypal_fee?.value
    ? Number(capture.seller_receivable_breakdown.paypal_fee.value)
    : Number((gross * 0.029).toFixed(2));
  const net = calculateTransactionNet(gross, fee, 0);
  const taxReserve = calculateTaxReserveAllocation(gross, 20);

  const txCode = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;
  const hash = `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 6)}`;

  const updated = await prisma.$transaction(async (tx) => {
    const ms = await tx.milestone.update({
      where: { id: milestone.id },
      data: {
        status: "captured",
        capturedAt: new Date(),
        paypalCaptureId: capture.id,
      },
    });

    await tx.milestoneHistory.create({
      data: {
        milestoneId: milestone.id,
        action: `Milestone deliverable accepted & captured (Capture ID: ${capture.id})`,
        fromStatus: milestone.status,
        toStatus: "captured",
        userConfirmed: true,
        notes: `Milestone capture confirmed via PayPal Sandbox. Net: $${net}`,
      },
    });

    await tx.transaction.create({
      data: {
        code: txCode,
        userId,
        hash,
        description: `Milestone Settlement: ${milestone.project.title} (${milestone.code})`,
        clientName: milestone.project.client.name,
        type: "milestone_capture",
        status: "settled",
        currency: milestone.project.currency,
        currencySymbol: milestone.project.currencySymbol,
        grossAmount: new Prisma.Decimal(gross),
        feeAmount: new Prisma.Decimal(fee),
        netAmount: new Prisma.Decimal(net),
        taxReserveSplitAmount: new Prisma.Decimal(taxReserve),
        paymentChannel: "PayPal Direct",
        linkedMilestoneId: milestone.id,
        paypalCaptureId: capture.id,
        idempotencyKey: `paypal_milestone_capture_${capture.id}`,
      },
    });

    return ms;
  });

  await recordAuditLog({
    userId,
    action: "paypal_milestone_captured",
    entityType: "Milestone",
    entityId: milestone.id,
    details: { captureId: capture.id, gross, net },
  });

  return {
    success: true,
    milestone: updated,
    captureId: capture.id,
    netAmount: net,
  };
}

/**
 * Refund a captured payment (Full or partial).
 */
export async function refundPayment(userId: string, input: RefundPaymentInput) {
  // 1. Locate the captured transaction and entity
  let captureId: string | null = null;
  let grossAmount = 0;
  let currency = "USD";
  let targetInvoiceId: string | null = null;
  let targetMilestoneId: string | null = null;
  let clientName = "Client";

  if (input.invoiceId) {
    const inv = await prisma.invoice.findFirst({
      where: {
        userId,
        OR: [{ id: input.invoiceId }, { code: input.invoiceId }],
      },
    });
    if (!inv) throw new Error("Invoice not found or unauthorized");
    captureId = inv.paypalCaptureId;
    grossAmount = Number(inv.total);
    currency = inv.currency;
    targetInvoiceId = inv.id;
    clientName = inv.clientName;
  } else if (input.milestoneId) {
    const ms = await prisma.milestone.findFirst({
      where: {
        OR: [{ id: input.milestoneId }, { code: input.milestoneId }],
        project: { userId },
      },
      include: { project: { include: { client: true } } },
    });
    if (!ms) throw new Error("Milestone not found or unauthorized");
    captureId = ms.paypalCaptureId;
    grossAmount = Number(ms.amount);
    currency = ms.project.currency;
    targetMilestoneId = ms.id;
    clientName = ms.project.client.name;
  } else if (input.transactionId) {
    const tx = await prisma.transaction.findFirst({
      where: {
        userId,
        OR: [{ id: input.transactionId }, { code: input.transactionId }],
      },
    });
    if (!tx) throw new Error("Transaction not found or unauthorized");
    captureId = tx.paypalCaptureId;
    grossAmount = Number(tx.grossAmount);
    currency = tx.currency;
    targetInvoiceId = tx.linkedInvoiceId;
    targetMilestoneId = tx.linkedMilestoneId;
    clientName = tx.clientName;
  }

  if (!captureId) {
    throw new Error("No verified PayPal capture ID found to execute refund");
  }

  // 2. Validate refund amount against database records
  const refundAmount = input.amount ? Number(input.amount) : grossAmount;
  if (refundAmount <= 0) {
    throw new Error("Refund amount must be greater than zero");
  }
  if (refundAmount > grossAmount) {
    throw new Error(`Refund amount ($${refundAmount}) exceeds original capture amount ($${grossAmount})`);
  }

  // 3. Call PayPal Refund API
  const ppRefund = await refundPayPalCapture(captureId, {
    amount: refundAmount,
    currency,
    noteToPayer: input.reason || "Customer refund issued via FreelancePay AI",
  });

  if (ppRefund.status !== "COMPLETED" && ppRefund.status !== "PENDING") {
    throw new Error(`PayPal refund failed with status: ${ppRefund.status}`);
  }

  const txCode = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;
  const hash = `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 6)}`;

  // 4. Record refund in database atomically
  const result = await prisma.$transaction(async (tx) => {
    // Record refund transaction (negative values)
    const refundTx = await tx.transaction.create({
      data: {
        code: txCode,
        userId,
        hash,
        description: `PayPal Refund: ${input.reason || "Client settlement refund"}`,
        clientName,
        type: "refund",
        status: "settled",
        currency,
        currencySymbol: "$",
        grossAmount: new Prisma.Decimal(-refundAmount),
        feeAmount: new Prisma.Decimal(0),
        netAmount: new Prisma.Decimal(-refundAmount),
        taxReserveSplitAmount: new Prisma.Decimal(0),
        paymentChannel: "PayPal Direct",
        linkedInvoiceId: targetInvoiceId,
        linkedMilestoneId: targetMilestoneId,
        paypalCaptureId: captureId,
        paypalRefundId: ppRefund.id,
        idempotencyKey: `paypal_refund_${ppRefund.id}`,
      },
    });

    if (targetMilestoneId) {
      await tx.milestone.update({
        where: { id: targetMilestoneId },
        data: {
          status: "refunded",
          refundedAt: new Date(),
        },
      });

      await tx.milestoneHistory.create({
        data: {
          milestoneId: targetMilestoneId,
          action: `Milestone payment refunded ($${refundAmount})`,
          fromStatus: "captured",
          toStatus: "refunded",
          userConfirmed: true,
          notes: input.reason,
        },
      });
    }

    return refundTx;
  });

  await recordAuditLog({
    userId,
    action: "paypal_refund_issued",
    entityType: "Transaction",
    entityId: result.id,
    details: { refundId: ppRefund.id, refundAmount, captureId },
  });

  return {
    success: true,
    refundId: ppRefund.id,
    refundAmount,
    transaction: result,
  };
}

/**
 * Handle incoming PayPal webhook events with durable idempotency.
 */
export async function handlePayPalWebhook(
  rawBody: string,
  headers: Record<string, string>
) {
  // 1. Verify PayPal webhook signature
  const isValidSignature = await verifyPayPalWebhookSignature({
    authAlgo: headers["paypal-auth-algo"] || "",
    certUrl: headers["paypal-cert-url"] || "",
    transmissionId: headers["paypal-transmission-id"] || "",
    transmissionSig: headers["paypal-transmission-sig"] || "",
    transmissionTime: headers["paypal-transmission-time"] || "",
    webhookId: headers["paypal-webhook-id"] || "",
    eventBody: rawBody,
  });

  if (!isValidSignature && process.env.NODE_ENV !== "test") {
    throw new Error("Invalid PayPal webhook signature");
  }

  const event = JSON.parse(rawBody);
  const eventId = event.id;
  const eventType = event.event_type;
  const resource = event.resource || {};

  // 2. Durable Idempotency Check
  const existingEvent = await prisma.payPalWebhookEvent.findUnique({
    where: { eventId },
  });

  if (existingEvent) {
    return {
      status: "duplicate",
      message: `Event ${eventId} has already been processed`,
    };
  }

  // 3. Process according to event type
  if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
    const customId = resource.custom_id;

    if (customId) {
      // Find invoice by ID or code
      const invoice = await prisma.invoice.findFirst({
        where: { OR: [{ id: customId }, { code: customId }] },
      });

      if (invoice && invoice.status !== "paid") {
        await captureInvoicePayment(invoice.userId, invoice.id, resource.supplementary_data?.related_ids?.order_id);
      }

      // Check if it's a milestone
      const milestone = await prisma.milestone.findFirst({
        where: { OR: [{ id: customId }, { code: customId }] },
        include: { project: true },
      });

      if (milestone && milestone.status !== "captured") {
        await captureMilestonePayment(milestone.project.userId, milestone.id);
      }
    }
  } else if (eventType === "PAYMENT.AUTHORIZATION.CREATED") {
    const customId = resource.custom_id;
    if (customId) {
      const milestone = await prisma.milestone.findFirst({
        where: { OR: [{ id: customId }, { code: customId }] },
        include: { project: true },
      });
      if (milestone && milestone.status === "pending") {
        await authorizeMilestonePayment(milestone.project.userId, milestone.id);
      }
    }
  } else if (eventType === "INVOICING.INVOICE.PAID") {
    const invoiceNumber = resource.detail?.invoice_number;
    if (invoiceNumber) {
      const invoice = await prisma.invoice.findFirst({
        where: { code: invoiceNumber },
      });
      if (invoice && invoice.status !== "paid") {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: "paid", paidAt: new Date() },
        });
      }
    }
  }

  // 4. Record event in database for idempotency
  await prisma.payPalWebhookEvent.create({
    data: {
      eventId,
      eventType,
      resourceType: event.resource_type || "unknown",
      resourceId: resource.id || null,
      status: "processed",
      payload: rawBody.slice(0, 10000),
      processedAt: new Date(),
    },
  });

  return { status: "processed", eventId, eventType };
}

/**
 * Get the real PayPal Sandbox integration status for UI display.
 */
export async function getPayPalIntegrationStatus() {
  const isConfigured = isPayPalConfigured();
  const baseUrl = getPayPalBaseUrl();
  const hasWebhook = Boolean(process.env.PAYPAL_WEBHOOK_ID && !process.env.PAYPAL_WEBHOOK_ID.startsWith("placeholder"));

  return {
    isConfigured,
    environment: "sandbox",
    baseUrl,
    hasWebhook,
    features: {
      invoicing: true,
      orders: true,
      milestoneAuthorization: true,
      refunds: true,
      webhooks: hasWebhook,
    },
  };
}
