import { prisma } from "../src/lib/db";
import {
  getActiveEmailProvider,
  validateEmailAddress,
  sanitizeHeaderValue,
  dispatchEmailThroughProvider,
} from "../src/lib/email/emailProvider";
import {
  sendEmail,
  sendInvoiceEmailWorkflow,
  sendReminderEmailWorkflow,
  sendPaymentReceiptEmailWorkflow,
  listEmailDeliveries,
} from "../src/services/emailService";
import {
  createNotification,
  listNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../src/services/notificationService";
import {
  enqueueJob,
  processPendingJobs,
  listJobs,
} from "../src/services/jobService";
import { hashPassword } from "../src/lib/auth";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

export async function runEmailNotificationJobsTests(): Promise<{ passed: number; failed: number }> {
  console.log("\n▶ Running Email Delivery, Notifications & Background Jobs Suite (Phase 4D)...");
  let passed = 0;
  let failed = 0;

  const timestamp = Date.now();
  const testEmailA = `test_email_a_${timestamp}@freelancepay.ai`;
  const testEmailB = `test_email_b_${timestamp}@freelancepay.ai`;
  let userAId = "";
  let userBId = "";
  let testInvoiceId = "";
  let testReminderId = "";

  try {
    // -------------------------------------------------------------
    // SETUP: Create isolated test users in Neon DB
    // -------------------------------------------------------------
    const passwordHash = await hashPassword("SafeSecretPassword123!");
    const userA = await prisma.user.create({
      data: {
        email: testEmailA,
        passwordHash,
        name: "Test User Email A",
        profile: {
          create: {
            title: "Senior AI Consultant",
            businessName: "Studio A Designs",
          },
        },
      },
    });
    userAId = userA.id;

    const userB = await prisma.user.create({
      data: {
        email: testEmailB,
        passwordHash,
        name: "Test User Email B",
        profile: {
          create: {
            title: "Independent Developer",
            businessName: "Studio B Dev",
          },
        },
      },
    });
    userBId = userB.id;

    // Seed test invoice and reminder for User A
    const invoice = await prisma.invoice.create({
      data: {
        code: `INV-E2E-${timestamp.toString().slice(-4)}`,
        userId: userAId,
        clientName: "Acme Enterprise Corp",
        clientEmail: "billing@acme-corp.com",
        projectTitle: "Phase 4D Integration Sprint",
        issueDate: new Date(),
        dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days overdue
        status: "sent",
        subtotal: 5000.0,
        taxRatePercent: 10.0,
        taxAmount: 500.0,
        total: 5500.0,
        lineItems: {
          create: [
            {
              description: "Email Engine Architecture",
              quantity: 1,
              rate: 5000.0,
              amount: 5000.0,
            },
          ],
        },
      },
    });
    testInvoiceId = invoice.id;

    const reminder = await prisma.paymentReminder.create({
      data: {
        code: `REM-E2E-${timestamp.toString().slice(-4)}`,
        userId: userAId,
        invoiceId: invoice.id,
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail,
        amount: invoice.total,
        dueDate: invoice.dueDate,
        overdueDays: 7,
        status: "pending_approval",
        subject: `Overdue Invoice Notice #${invoice.code}`,
        messageBody: "Please settle invoice balance at your earliest convenience.",
        paymentLink: `https://freelancepay.ai/pay/${invoice.code}`,
      },
    });
    testReminderId = reminder.id;

    // -------------------------------------------------------------
    // TEST 1: Email Validation & Header Sanitization
    // -------------------------------------------------------------
    assert(validateEmailAddress("client@example.com") === true, "Valid recipient email accepted");
    assert(validateEmailAddress("not-an-email") === false, "Invalid email string rejected");
    assert(validateEmailAddress("") === false, "Empty email rejected");
    assert(
      sanitizeHeaderValue("Invoice #101\r\nBcc: evil@hacker.com") === "Invoice #101  Bcc: evil@hacker.com",
      "CRLF injection stripped from header values"
    );
    passed += 4;

    // -------------------------------------------------------------
    // TEST 2: Provider Abstraction & Safe Fallback
    // -------------------------------------------------------------
    const activeProvider = getActiveEmailProvider();
    assert(typeof activeProvider.isConfigured === "boolean", "Provider configuration state cleanly detected");
    
    const fallbackDispatch = await dispatchEmailThroughProvider({
      to: "recipient@demo.com",
      subject: "Test Dispatch",
      text: "Plain text test body",
      workflow: "account_alert",
    });
    assert(fallbackDispatch.status === "simulated" || fallbackDispatch.status === "sent", "Safe provider execution without uncaught errors");
    assert(typeof fallbackDispatch.providerMessageId === "string", "Provider message ID generated");
    passed += 3;

    // -------------------------------------------------------------
    // TEST 3: Approval-First Guardrail Enforcement
    // -------------------------------------------------------------
    // Attempt to send client reminder with userApproved = false
    const blockedReminder = await sendEmail(userAId, {
      to: "client@acme.com",
      subject: "Unapproved reminder",
      text: "Pay now",
      workflow: "payment_reminder",
      userApproved: false,
    });
    assert(blockedReminder.status === "awaiting_approval", "Unapproved payment reminder blocked and marked awaiting_approval");
    assert(blockedReminder.success === false, "Unapproved payment reminder returned success = false");

    // Verify record in Neon DB holds status awaiting_approval
    const savedBlockedRecord = await prisma.emailDelivery.findUnique({
      where: { id: blockedReminder.deliveryId },
    });
    assert(Boolean(savedBlockedRecord && savedBlockedRecord.status === "awaiting_approval"), "Unapproved dispatch persisted as awaiting_approval in Neon DB");
    passed += 3;

    // -------------------------------------------------------------
    // TEST 4: Authorized High-Level Email Workflows
    // -------------------------------------------------------------
    // A) Send Invoice Email
    const invoiceEmailResult = await sendInvoiceEmailWorkflow(userAId, testInvoiceId, true);
    assert(invoiceEmailResult.success === true, "Invoice email workflow dispatched successfully with approval");
    assert(Boolean(invoiceEmailResult.deliveryId), "Invoice email delivery ID persisted");

    const updatedInvoice = await prisma.invoice.findUnique({ where: { id: testInvoiceId } });
    assert(Boolean(updatedInvoice?.lastEmailSentAt), "Invoice record updated with lastEmailSentAt timestamp");

    // B) Send Reminder Email
    const reminderEmailResult = await sendReminderEmailWorkflow(userAId, testReminderId, true);
    assert(reminderEmailResult.success === true, "Reminder email workflow dispatched successfully with approval");
    
    const updatedReminder = await prisma.paymentReminder.findUnique({ where: { id: testReminderId } });
    assert(updatedReminder?.status === "sent", "Reminder status transitioned to 'sent'");
    assert(Boolean(updatedReminder?.realSentAt), "Reminder recorded realSentAt timestamp");
    assert(Boolean(updatedReminder?.emailDeliveryId), "Reminder references generated emailDeliveryId");

    // C) Send Payment Receipt Confirmation
    const receiptResult = await sendPaymentReceiptEmailWorkflow(userAId, testInvoiceId, "TX-99881");
    assert(receiptResult.success === true, "Payment confirmation receipt workflow dispatched successfully");
    passed += 7;

    // -------------------------------------------------------------
    // TEST 5: Duplicate-Send Prevention (Idempotency)
    // -------------------------------------------------------------
    const idempotencyKey = `idemp_test_${timestamp}`;
    const firstSend = await sendEmail(userAId, {
      to: "client@acme.com",
      subject: "Idempotent Notice",
      text: "Content",
      workflow: "account_alert",
      idempotencyKey,
    });
    assert(firstSend.success === true, "Initial email sent successfully under idempotency key");

    const duplicateSend = await sendEmail(userAId, {
      to: "client@acme.com",
      subject: "Idempotent Notice",
      text: "Content",
      workflow: "account_alert",
      idempotencyKey,
    });
    assert(duplicateSend.deliveryId === firstSend.deliveryId, "Duplicate send with identical idempotencyKey returned existing delivery record without re-sending");
    passed += 2;

    // -------------------------------------------------------------
    // TEST 6: In-App Notifications & Tenant Isolation
    // -------------------------------------------------------------
    const notifA1 = await createNotification({
      userId: userAId,
      title: "Invoice #FP-100 viewed",
      message: "Acme Corp opened the invoice portal",
      type: "info",
      link: "/invoices/INV-100",
    });
    assert(Boolean(notifA1.id), "In-app notification created for User A");

    const notifA2 = await createNotification({
      userId: userAId,
      title: "Tax Shield Reserve Executed",
      message: "$1,240 set aside in Vault",
      type: "success",
    });
    assert(Boolean(notifA2.id), "Second notification created for User A");

    // Check unread count
    const unreadCountA = await getUnreadNotificationCount(userAId);
    assert(unreadCountA >= 2, `Unread count for User A accurately tracked (${unreadCountA})`);

    // Tenant Isolation: User B cannot see User A's notifications
    const userBNotifications = await listNotifications(userBId);
    assert(userBNotifications.length === 0, "User B cannot see User A's notifications (Tenant Isolation)");

    const unreadCountB = await getUnreadNotificationCount(userBId);
    assert(unreadCountB === 0, "User B unread count is 0 (Tenant Isolation)");

    // User B cannot mark User A's notification as read
    let userBBlocked = false;
    try {
      await markNotificationAsRead(userBId, notifA1.id);
    } catch {
      userBBlocked = true;
    }
    assert(userBBlocked, "User B blocked from marking User A's notification as read");

    // Mark single notification as read
    const readA1 = await markNotificationAsRead(userAId, notifA1.id);
    assert(readA1.read === true && Boolean(readA1.readAt), "Notification marked as read with readAt timestamp");

    // Mark all as read
    await markAllNotificationsAsRead(userAId);
    const postReadAllUnread = await getUnreadNotificationCount(userAId);
    assert(postReadAllUnread === 0, "All notifications successfully marked as read for User A");

    // Delete notification
    await deleteNotification(userAId, notifA1.id);
    const remainingA = await listNotifications(userAId);
    assert(!remainingA.some((n) => n.id === notifA1.id), "Notification successfully deleted by owner");
    passed += 9;

    // -------------------------------------------------------------
    // TEST 7: Durable Background Jobs Engine & Retries
    // -------------------------------------------------------------
    // Enqueue a job
    const queuedJob = await enqueueJob({
      userId: userAId,
      jobType: "DISPATCH_NOTIFICATION",
      payload: { title: "Background Job Title", message: "Background Job Message", type: "alert" },
      idempotencyKey: `job_notif_${timestamp}`,
    });
    assert(queuedJob.status === "pending", "Background job enqueued in 'pending' status");

    // Duplicate enqueue with same key returns existing job
    const duplicateJob = await enqueueJob({
      userId: userAId,
      jobType: "DISPATCH_NOTIFICATION",
      payload: { title: "Duplicate", message: "Should be ignored" },
      idempotencyKey: `job_notif_${timestamp}`,
    });
    assert(duplicateJob.id === queuedJob.id, "Duplicate background job deduplicated via idempotencyKey");

    // Process jobs via worker
    const workerResult = await processPendingJobs({ limit: 5, workerId: `test_worker_${timestamp}` });
    assert(workerResult.succeeded >= 1, `Worker processed pending jobs successfully (${workerResult.succeeded} succeeded)`);

    const completedJob = await prisma.backgroundJob.findUnique({ where: { id: queuedJob.id } });
    assert(completedJob?.status === "completed", "Job transitioned to 'completed' status");
    assert(Boolean(completedJob?.completedAt), "Job recorded completedAt timestamp");
    assert(completedJob?.lockedAt === null, "Job released worker lock upon completion");

    // Test Failure & Backoff Retry logic
    const failingJob = await enqueueJob({
      userId: userAId,
      jobType: "SEND_EMAIL",
      payload: {
        workflow: "payment_reminder",
        userApproved: false, // Will trigger approval error
        to: "client@test.com",
        subject: "Will Fail",
        text: "Will Fail",
      },
      idempotencyKey: `job_fail_${timestamp}`,
    });

    const failWorkerResult = await processPendingJobs({ limit: 5, workerId: `test_worker_fail_${timestamp}` });
    const retriedJob = await prisma.backgroundJob.findUnique({ where: { id: failingJob.id } });
    assert(retriedJob?.attempts === 1, "Failed job incremented attempt counter to 1");
    assert(retriedJob?.status === "pending", "Failed job under maxAttempts placed in 'pending' status for retry");
    assert(Boolean(retriedJob?.runAt && retriedJob.runAt > new Date()), "Failed job scheduled future runAt with exponential backoff");
    assert(Boolean(retriedJob?.lastError?.includes("approval required")), "Job recorded error message in lastError");
    passed += 9;

    // -------------------------------------------------------------
    // TEST 8: Overdue Reminders Background Scan Guardrail
    // -------------------------------------------------------------
    // Create an un-reminded overdue invoice for User A
    const freshOverdueInvoice = await prisma.invoice.create({
      data: {
        code: `INV-SCAN-${timestamp.toString().slice(-4)}`,
        userId: userAId,
        clientName: "Beta Horizon Corp",
        clientEmail: "billing@beta-horizon.com",
        projectTitle: "Overdue Workflow Audit",
        issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days overdue
        status: "sent",
        subtotal: 3000.0,
        taxAmount: 0.0,
        total: 3000.0,
      },
    });

    // Run CHECK_OVERDUE_INVOICES job
    const scanJob = await enqueueJob({
      jobType: "CHECK_OVERDUE_INVOICES",
      payload: {},
      idempotencyKey: `job_scan_${timestamp}`,
    });
    await processPendingJobs({ limit: 5 });

    const scanCompleted = await prisma.backgroundJob.findUnique({ where: { id: scanJob.id } });
    assert(scanCompleted?.status === "completed", "CHECK_OVERDUE_INVOICES background job executed successfully");

    // Confirm that newly created reminders stay in 'pending_approval' and never auto-send
    const autoReminders = await prisma.paymentReminder.findMany({
      where: { userId: userAId, invoiceId: freshOverdueInvoice.id },
    });
    assert(autoReminders.length === 1, "Overdue scanner created reminder draft for un-reminded overdue invoice");
    assert(autoReminders[0].status === "pending_approval", "Overdue scanner created reminder draft strictly in 'pending_approval' status");
    assert(
      !autoReminders.some((r) => r.status === "sent" && !r.realSentAt),
      "No overdue reminders bypassed human confirmation to send autonomously"
    );
    passed += 3;

    // -------------------------------------------------------------
    // TEST 9: Email Delivery History Scoping
    // -------------------------------------------------------------
    const deliveriesA = await listEmailDeliveries(userAId);
    assert(deliveriesA.length >= 3, `Email deliveries recorded in Neon DB for User A (${deliveriesA.length} records)`);

    const deliveriesB = await listEmailDeliveries(userBId);
    assert(deliveriesB.length === 0, "User B cannot view User A's email delivery history (Tenant Isolation)");
    passed += 2;

    // -------------------------------------------------------------
    // TEARDOWN: Clean up test records
    // -------------------------------------------------------------
    await prisma.user.deleteMany({
      where: { id: { in: [userAId, userBId] } },
    });
    console.log("  ✓ Test users, email records, notifications, and background jobs cleaned up from Neon DB");
  } catch (error) {
    console.error("  ✗ Test failure in Phase 4D suite:", error);
    failed++;
    // Attempt teardown on error
    if (userAId || userBId) {
      await prisma.user
        .deleteMany({
          where: { id: { in: [userAId, userBId].filter(Boolean) } },
        })
        .catch(() => {});
    }
  }

  console.log(`Phase 4D email, notifications & background jobs summary: ${passed} passed, ${failed} failed.`);
  return { passed, failed };
}
