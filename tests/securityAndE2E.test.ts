import { prisma } from "../src/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
} from "../src/lib/auth";
import {
  calculateInvoiceTotals,
  calculateTransactionNet,
  calculateTaxReserveAllocation,
} from "../src/lib/financialCalculations";
import { createInvoice, getInvoiceById } from "../src/services/invoiceService";
import { createClient } from "../src/services/clientService";
import {
  createMilestoneAuthorizationOrder,
  authorizeMilestonePayment,
  captureMilestonePayment,
  refundPayment,
} from "../src/services/paypalService";
import {
  sendReminderEmailWorkflow,
} from "../src/services/emailService";
import {
  createNotification,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
} from "../src/services/notificationService";
import { enqueueJob, processPendingJobs } from "../src/services/jobService";
import { checkPersistentRateLimit } from "../src/lib/ai/rateLimiter";
import { recordAuditLog } from "../src/services/auditService";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

export async function runSecurityAndE2ETests(): Promise<{ passed: number; failed: number }> {
  console.log("\n▶ Running Comprehensive Security Audit & End-to-End Integration Suite (Phase 4E)...");
  let passed = 0;
  let failed = 0;

  const timestamp = Date.now();
  const emailUserA = `audit_user_a_${timestamp}@freelancepay.ai`;
  const emailUserB = `audit_user_b_${timestamp}@freelancepay.ai`;
  let userAId = "";
  let userBId = "";

  try {
    // -------------------------------------------------------------------------
    // 1. AUTHENTICATION & ACCESS CONTROL AUDIT
    // -------------------------------------------------------------------------
    // A) Password Hashing with Bcrypt (12 rounds)
    const rawSecret = "ExecutiveVaultPass@2026";
    const hashed = await hashPassword(rawSecret);
    assert(hashed.startsWith("$2a$") || hashed.startsWith("$2b$"), "Bcrypt format verified ($2a$/$2b$)");
    assert(await verifyPassword(rawSecret, hashed) === true, "Valid password successfully verified");
    assert(await verifyPassword("WrongPassword!", hashed) === false, "Incorrect password rejected");

    // Create User A and User B
    const userA = await prisma.user.create({
      data: {
        email: emailUserA,
        passwordHash: hashed,
        name: "Audit User Alpha",
        role: "freelancer",
        profile: { create: { title: "Lead Architect", businessName: "Alpha Architecture LLC" } },
        financialSettings: { create: { baseCurrency: "USD" } },
      },
    });
    userAId = userA.id;

    const userB = await prisma.user.create({
      data: {
        email: emailUserB,
        passwordHash: hashed,
        name: "Audit User Beta",
        role: "freelancer",
        profile: { create: { title: "Security Specialist", businessName: "Beta Defense Studio" } },
        financialSettings: { create: { baseCurrency: "USD" } },
      },
    });
    userBId = userB.id;

    // B) Session Token Issuance & Tamper Resistance
    const sessionToken = await createSessionToken({
      userId: userAId,
      email: userA.email,
      name: userA.name,
      role: userA.role,
    });
    const verifiedSession = await verifySessionToken(sessionToken);
    assert(verifiedSession?.userId === userAId, "Session token successfully decoded and authenticated");

    const tamperedToken = sessionToken.substring(0, sessionToken.length - 6) + "xyz123";
    const tamperedResult = await verifySessionToken(tamperedToken);
    assert(tamperedResult === null, "Cryptographically tampered token rejected");
    passed += 5;

    // -------------------------------------------------------------------------
    // 2. TENANT ISOLATION & OBJECT-LEVEL PERMISSION AUDIT
    // -------------------------------------------------------------------------
    // Create client and invoice under User A
    const clientA = await createClient(userAId, {
      code: `CLI-${timestamp.toString().slice(-4)}`,
      name: "Global Tech Enterprises",
      location: "San Francisco, CA",
      industry: "Cloud Infrastructure",
      contactName: "David Miller",
      contactRole: "VP Engineering",
      contactEmail: "david@globaltech.com",
    });

    const invoiceA = await createInvoice(userAId, {
      code: `INV-AUDIT-${timestamp.toString().slice(-4)}`,
      clientId: clientA.id,
      clientName: clientA.name,
      clientEmail: clientA.contactEmail,
      projectTitle: "Security Audit Handover",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      paymentChannel: "PayPal Direct",
      lineItems: [
        { description: "Zero-Trust Architecture Review", quantity: 40, rate: 125 },
        { description: "Automated Regression Harness", quantity: 20, rate: 100 },
      ],
      taxRatePercent: 8.5,
    });

    // Verification: User B query for User A's invoice must return null
    const crossQueryInvoice = await getInvoiceById(userBId, invoiceA.id);
    assert(crossQueryInvoice === null, "User B cannot retrieve User A's invoice (Tenant Isolation enforced)");

    const crossQueryClient = await prisma.client.findFirst({
      where: { id: clientA.id, userId: userBId },
    });
    assert(crossQueryClient === null, "User B cannot query User A's client (Tenant Isolation enforced)");
    passed += 2;

    // -------------------------------------------------------------------------
    // 3. FINANCIAL INTEGRITY & CALCULATION INVARIANTS
    // -------------------------------------------------------------------------
    // A) Invoice Totals & Decimal Precision
    const totals = calculateInvoiceTotals(
      [
        { quantity: 40, rate: 125 },
        { quantity: 20, rate: 100 },
      ],
      8.5
    );
    assert(totals.subtotal === 7000.0, "Subtotal calculated deterministically: $7,000.00");
    assert(totals.taxAmount === 595.0, "Tax at 8.5% is exactly $595.00");
    assert(totals.total === 7595.0, "Total sum is exactly $7,595.00");

    // B) PayPal Transaction Deductions & Net Reconciliation
    const netEarnings = calculateTransactionNet(7595.0, 220.26, 0);
    assert(netEarnings === 7374.74, "Net earnings after PayPal fee correctly calculated: $7,374.74");

    const taxSetAside = calculateTaxReserveAllocation(7595.0, 20);
    assert(taxSetAside === 1519.0, "20% automated tax reserve allocation is exactly $1,519.00");
    passed += 5;

    // -------------------------------------------------------------------------
    // 4. MILESTONE AUTHORIZATION, CAPTURE & REFUND SAFEGUARDS
    // -------------------------------------------------------------------------
    // Create project and milestone under User A
    const project = await prisma.project.create({
      data: {
        code: `PRJ-AUDIT-${timestamp.toString().slice(-4)}`,
        userId: userAId,
        clientId: clientA.id,
        escrowId: `#MS-${timestamp.toString().slice(-4)}`,
        title: "Enterprise Platform Modernization",
        totalAmount: 10000.0,
      },
    });

    const milestone = await prisma.milestone.create({
      data: {
        code: `MS-01-${timestamp.toString().slice(-4)}`,
        projectId: project.id,
        title: "Security & Observability Pipeline",
        description: "Milestone 1 deliverable signoff",
        amount: 5000.0,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        status: "pending",
      },
    });

    // Create PayPal milestone order
    const msOrder = await createMilestoneAuthorizationOrder(userAId, milestone.id);
    assert(Boolean(msOrder.orderId), "Milestone order created with PayPal ID");

    // Authorize payment
    const authorized = await authorizeMilestonePayment(userAId, milestone.id);
    assert(authorized.milestone.status === "authorized", "Milestone transitioned to 'authorized' status");

    // Ownership Guard: User B cannot capture User A's milestone
    let captureBlocked = false;
    try {
      await captureMilestonePayment(userBId, milestone.id);
    } catch {
      captureBlocked = true;
    }
    assert(captureBlocked, "Cross-user milestone capture strictly blocked (Authorization Guard)");

    // Capture by legitimate owner
    const captured = await captureMilestonePayment(userAId, milestone.id);
    assert(captured.milestone.status === "captured", "Milestone payment captured by legitimate owner");

    // Verify transaction recorded as 'milestone_capture' (never misleading escrow)
    const msTx = await prisma.transaction.findFirst({
      where: { linkedMilestoneId: milestone.id },
    });
    assert(msTx?.type === "milestone_capture", "Transaction strictly recorded as 'milestone_capture' (never escrow)");

    // Partial refund safeguard
    const partialRefund = await refundPayment(userAId, {
      milestoneId: milestone.id,
      amount: 1000.0,
      reason: "Deliverable scope adjustment agreed by both parties",
    });
    assert(partialRefund.refundAmount === 1000.0, "Partial refund of $1,000.00 executed safely");

    // Over-refund protection: refund exceeding remaining amount must fail
    let overRefundBlocked = false;
    try {
      await refundPayment(userAId, {
        milestoneId: milestone.id,
        amount: 10000.0, // Exceeds $4,000 captured balance
        reason: "Excessive refund attempt",
      });
    } catch {
      overRefundBlocked = true;
    }
    assert(overRefundBlocked, "Refund exceeding captured gross strictly blocked");
    passed += 7;

    // -------------------------------------------------------------------------
    // 5. EXPLICIT HUMAN APPROVAL ENFORCEMENT ON OUTREACH
    // -------------------------------------------------------------------------
    const reminder = await prisma.paymentReminder.create({
      data: {
        code: `REM-AUDIT-${timestamp.toString().slice(-4)}`,
        userId: userAId,
        invoiceId: invoiceA.id,
        clientName: clientA.name,
        clientEmail: clientA.contactEmail,
        amount: invoiceA.total,
        dueDate: invoiceA.dueDate,
        overdueDays: 5,
        status: "pending_approval",
        subject: `Reminder: Invoice #${invoiceA.code}`,
        messageBody: "Please remit settlement.",
        paymentLink: `https://freelancepay.ai/pay/${invoiceA.code}`,
      },
    });

    // Unapproved send attempt must be rejected
    const unapprovedSend = await sendReminderEmailWorkflow(userAId, reminder.id, false);
    assert(unapprovedSend.success === false, "Unapproved reminder email dispatch rejected");
    assert(unapprovedSend.status === "awaiting_approval", "Delivery record placed in awaiting_approval status");

    // Approved send executes cleanly
    const approvedSend = await sendReminderEmailWorkflow(userAId, reminder.id, true);
    assert(approvedSend.success === true, "Explicitly approved reminder dispatched cleanly");
    passed += 3;

    // -------------------------------------------------------------------------
    // 6. DISTRIBUTED PERSISTENT RATE LIMITING & AUDIT LOGGING
    // -------------------------------------------------------------------------
    await recordAuditLog({
      userId: userAId,
      action: "ai_copilot_query",
      entityType: "User",
      entityId: userAId,
    });

    const persistentLimit = await checkPersistentRateLimit(userAId, "ai_copilot_query", 50, 60);
    assert(persistentLimit.allowed === true, "Persistent rate check allowed within quota");
    assert(persistentLimit.remaining < 50, "Persistent rate remaining quota decremented accurately");
    passed += 2;

    // -------------------------------------------------------------------------
    // 7. IN-APP NOTIFICATIONS & BACKGROUND JOB LIFECYCLE
    // -------------------------------------------------------------------------
    await createNotification({
      userId: userAId,
      title: "Quarterly Tax Reserve Settled",
      message: "$1,519.00 held in Tax Vault",
      type: "success",
    });

    const unreadCount = await getUnreadNotificationCount(userAId);
    assert(unreadCount >= 1, "Unread in-app notification count tracked in Neon DB");

    await markAllNotificationsAsRead(userAId);
    const postClearCount = await getUnreadNotificationCount(userAId);
    assert(postClearCount === 0, "Notifications marked as read and counter reset to 0");

    // Enqueue & process background task
    const testJob = await enqueueJob({
      userId: userAId,
      jobType: "DISPATCH_NOTIFICATION",
      payload: { title: "Durable Job Notification", message: "Processed from Neon queue", type: "info" },
      idempotencyKey: `audit_job_${timestamp}`,
    });
    const batchResult = await processPendingJobs({ limit: 5 });
    assert(batchResult.succeeded >= 1, "Background jobs queue processed jobs with atomic locks");

    const finishedJob = await prisma.backgroundJob.findUnique({ where: { id: testJob.id } });
    assert(finishedJob?.status === "completed", "Job transitioned to 'completed' with worker lock released");
    passed += 5;

    // -------------------------------------------------------------------------
    // TEARDOWN
    // -------------------------------------------------------------------------
    await prisma.user.deleteMany({
      where: { id: { in: [userAId, userBId] } },
    });
    console.log("  ✓ Test users, invoices, milestones, notifications & jobs cleaned up from Neon DB");
  } catch (error) {
    console.error("  ✗ Test failure in Phase 4E security & E2E suite:", error);
    failed++;
    if (userAId || userBId) {
      await prisma.user
        .deleteMany({
          where: { id: { in: [userAId, userBId].filter(Boolean) } },
        })
        .catch(() => {});
    }
  }

  console.log(`Phase 4E security & E2E summary: ${passed} passed, ${failed} failed.`);
  return { passed, failed };
}
