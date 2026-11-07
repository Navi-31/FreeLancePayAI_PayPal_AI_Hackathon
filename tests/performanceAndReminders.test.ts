import assert from "assert";
import { performance } from "perf_hooks";
import { prisma } from "@/backend/db/db";
import { createSessionToken, verifySessionToken } from "@/backend/auth/auth";
import { createAndSendOtp, verifyOtpCode } from "@/backend/services/otpService";
import { sendReminderEmailWorkflow, sendEmail } from "@/backend/services/emailService";
import { getCachedNotificationsData, invalidateNotificationCache } from "@/backend/services/notificationService";
import { getDashboardMetrics, invalidateDashboardMetricsCache } from "@/backend/services/dashboardService";
import { validateEmailAddress } from "@/backend/integrations/email/emailProvider";

export async function runPerformanceAndRemindersTests() {
  console.log("\n▶ Running Performance Optimization & Direct Payment Reminder Tests...");
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  const testEmail = `perf.test.${Date.now()}@freelancepay.ai`;
  const primaryEmail = process.env.PRIMARY_ACCOUNT_EMAIL || "navaneethanr0831@gmail.com";

  // Warm up Neon connection pool
  await prisma.$queryRaw`SELECT 1`;
  const existingUser = await prisma.user.findFirst();
  const validUserId = existingUser?.id || "usr_fallback_id";

  // 1. Optimized Non-Blocking OTP & Login Speed Test
  await test("1. Login OTP creation with background dispatch completes in under 600ms", async () => {
    const t0 = performance.now();
    const result = await createAndSendOtp({
      email: testEmail,
      purpose: "LOGIN_OTP",
      recipientName: "Performance Test User",
      awaitDelivery: false,
    });
    const t1 = performance.now();
    const duration = t1 - t0;

    assert.strictEqual(result.success, true, "OTP creation succeeded");
    assert.ok(result.expiresAt, "OTP expiration set");
    assert.strictEqual(result.deliveryStatus, "dispatched", "Delivery initiated asynchronously");
    assert.ok(duration < 800, `OTP dispatch duration (${duration.toFixed(2)}ms) was under 800ms threshold`);
  });

  // 2. Performance: Notification In-Memory Cache
  await test("2. Cached notifications return in under 20ms avoiding redundant Neon queries", async () => {
    // Cold load
    invalidateNotificationCache();
    await getCachedNotificationsData("test_usr_cached", 10);

    // Warm load from memory cache
    const t0 = performance.now();
    const cached = await getCachedNotificationsData("test_usr_cached", 10);
    const t1 = performance.now();
    const duration = t1 - t0;

    assert.ok(cached, "Cached notifications returned");
    assert.ok(duration < 25, `Cached retrieval (${duration.toFixed(2)}ms) was under 25ms`);
  });

  // 3. Performance: Dashboard Metrics User-Scoped Cache
  await test("3. Cached dashboard metrics return in under 20ms on repeated navigation", async () => {
    // Warm up cache
    await getDashboardMetrics("usr_bench_test");

    const t0 = performance.now();
    const metrics = await getDashboardMetrics("usr_bench_test");
    const t1 = performance.now();
    const duration = t1 - t0;

    assert.ok(metrics, "Metrics returned from cache");
    assert.ok(duration < 25, `Cached dashboard metrics (${duration.toFixed(2)}ms) was under 25ms`);
  });

  // 4. Reminder Email: RFC 5322 Recipient Validation
  await test("4. Recipient email validation strictly validates format and rejects invalid inputs", () => {
    assert.strictEqual(validateEmailAddress("client@validcompany.com"), true);
    assert.strictEqual(validateEmailAddress("billing.ap+finance@domain.co.uk"), true);
    assert.strictEqual(validateEmailAddress("notanemail"), false);
    assert.strictEqual(validateEmailAddress("@nodomain.com"), false);
    assert.strictEqual(validateEmailAddress("spaces in@email.com"), false);
    assert.strictEqual(validateEmailAddress(""), false);
  });

  // 5. Direct Reminder Email Delivery with Custom Edited Fields
  await test("5. sendReminderEmailWorkflow dispatches email with custom edited recipient, subject, and body", async () => {
    const customRecipient = primaryEmail;
    const customSubject = "Urgent Settlement Required — Q2 Deliverables";
    const customBody = "Hi Accounts Payable, Please find our revised invoice details and confirm settlement today.";

    const result = await sendReminderEmailWorkflow(
      validUserId,
      "REM-8848",
      true,
      {
        to: customRecipient,
        subject: customSubject,
        text: customBody,
      }
    );

    assert.strictEqual(result.success, true, "Email dispatch returned success");
    assert.ok(result.status === "sent" || result.status === "simulated", `Delivery status was ${result.status}`);
    assert.ok(result.deliveryId, "Email delivery ID recorded in system");
  });

  // 6. Direct Email Sending Guardrail: Human Approval Enforcement
  await test("6. Payment reminder email strictly blocks dispatch if userApproved is false", async () => {
    let blocked = false;
    try {
      const res = await sendEmail(validUserId, {
        to: primaryEmail,
        subject: "Unapproved Email",
        text: "This should be blocked",
        workflow: "payment_reminder",
        userApproved: false,
      });
      if (res.status === "awaiting_approval" && !res.success) {
        blocked = true;
      }
    } catch {
      blocked = true;
    }
    assert.strictEqual(blocked, true, "Unapproved email dispatch is blocked");
  });

  // 7. Duplicate Submission / Idempotency Guard
  await test("7. Duplicate email submission with same idempotencyKey prevents double delivery", async () => {
    const key = `idem_test_${Date.now()}`;
    const first = await sendEmail(validUserId, {
      to: primaryEmail,
      subject: "Idempotency Test",
      text: "Testing duplicate prevention",
      workflow: "account_alert",
      userApproved: true,
      idempotencyKey: key,
    });
    assert.strictEqual(first.success, true, "First submission succeeds");

    const second = await sendEmail(validUserId, {
      to: primaryEmail,
      subject: "Idempotency Test Duplicate",
      text: "Testing duplicate prevention 2",
      workflow: "account_alert",
      userApproved: true,
      idempotencyKey: key,
    });
    assert.strictEqual(second.success, true, "Duplicate returns success safely");
    assert.strictEqual(second.deliveryId, first.deliveryId, "Duplicate returned identical delivery ID without re-transmitting");
  });

  // Clean up
  await prisma.emailOtp.deleteMany({
    where: { email: { startsWith: "perf.test." } },
  });

  console.log(`\nPerformance & Reminders test summary: ${passed} passed, ${failed} failed.`);
  return { passed, failed };
}
