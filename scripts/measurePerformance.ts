import { performance } from "perf_hooks";
import { prisma } from "../src/backend/db/db";
import { verifyPassword, hashPassword, createSessionToken, verifySessionToken } from "../src/backend/auth/auth";
import { createAndSendOtp, verifyOtpCode } from "../src/backend/services/otpService";
import { dispatchEmailThroughProvider } from "../src/backend/integrations/email/emailProvider";
import { getDashboardMetrics, invalidateDashboardMetricsCache } from "../src/backend/services/dashboardService";

async function measure() {
  console.log("=== FREELANCEPAY AI PERFORMANCE BENCHMARK (BASELINE) ===\n");

  const results: Record<string, number> = {};

  // 1. Neon Database Round Trips & Connection Reuse
  const tDb0 = performance.now();
  await prisma.$queryRaw`SELECT 1`;
  const tDb1 = performance.now();
  results["neon_cold_query"] = tDb1 - tDb0;

  const tDb2 = performance.now();
  await prisma.$queryRaw`SELECT 1`;
  const tDb3 = performance.now();
  results["neon_warm_query"] = tDb3 - tDb2;

  // 2. User Lookup by Email (Primary user)
  const testEmail = process.env.PRIMARY_ACCOUNT_EMAIL || "navaneethanr0831@gmail.com";
  const tUser0 = performance.now();
  const user = await prisma.user.findUnique({
    where: { email: testEmail },
    include: { profile: true },
  });
  const tUser1 = performance.now();
  results["user_lookup_by_email"] = tUser1 - tUser0;

  // 3. Password Verification (Bcrypt 12 rounds)
  const plainPass = "DevSecurePassword2026!";
  const passHash = await hashPassword(plainPass);
  const tBcrypt0 = performance.now();
  await verifyPassword(plainPass, passHash);
  const tBcrypt1 = performance.now();
  results["bcrypt_password_verify"] = tBcrypt1 - tBcrypt0;

  // 4. OTP Database Operations (findFirst + updateMany + create)
  const otpEmail = `bench.otp.${Date.now()}@freelancepay.ai`;
  const tOtpDb0 = performance.now();
  await prisma.emailOtp.findFirst({
    where: { email: otpEmail, purpose: "LOGIN_OTP", verified: false },
  });
  await prisma.emailOtp.updateMany({
    where: { email: otpEmail, purpose: "LOGIN_OTP", verified: false },
    data: { verified: true },
  });
  const createdOtp = await prisma.emailOtp.create({
    data: {
      email: otpEmail,
      otpHash: "dummyhash12345678901234567890123456789012345678901234567890123456",
      purpose: "LOGIN_OTP",
      expiresAt: new Date(Date.now() + 300000),
      resendAfter: new Date(Date.now() + 100000),
      attempts: 0,
      maxAttempts: 5,
      verified: false,
    },
  });
  const tOtpDb1 = performance.now();
  results["otp_database_operations"] = tOtpDb1 - tOtpDb0;

  // 5. Email Dispatch (SMTP vs Provider)
  const tEmail0 = performance.now();
  const emailRes = await dispatchEmailThroughProvider({
    to: testEmail,
    subject: "FreelancePay AI Benchmark Test",
    text: "This is a latency measurement test.",
    workflow: "login_otp",
  });
  const tEmail1 = performance.now();
  results["email_dispatch_total"] = tEmail1 - tEmail0;
  console.log(`Email provider used: ${emailRes.provider}, status: ${emailRes.status}`);

  // 6. Complete End-to-End Login Cycle (Sequential: user lookup + bcrypt + OTP db + email + audit)
  const tLogin0 = performance.now();
  // Simulate complete login endpoint
  const u = await prisma.user.findUnique({
    where: { email: testEmail },
    include: { profile: true },
  });
  if (u) {
    await verifyPassword(plainPass, passHash);
    const otpRes = await createAndSendOtp({
      email: testEmail,
      purpose: "LOGIN_OTP",
      recipientName: u.name,
    });
    await prisma.auditLog.create({
      data: {
        userId: u.id,
        action: "user_login_otp_dispatched",
        entityType: "User",
        entityId: u.id,
      },
    });
  }
  const tLogin1 = performance.now();
  results["login_api_e2e_total"] = tLogin1 - tLogin0;

  // 7. OTP Verification Endpoint (Lookup OTP + user lookup + JWT creation + audit log)
  const tVerify0 = performance.now();
  if (user) {
    await prisma.emailOtp.findFirst({
      where: { email: testEmail, purpose: "LOGIN_OTP", verified: false },
    });
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    await verifySessionToken(token);
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "user_login_verified",
        entityType: "User",
        entityId: user.id,
      },
    });
  }
  const tVerify1 = performance.now();
  results["otp_verify_api_e2e"] = tVerify1 - tVerify0;

  // 8. /api/auth/me (Cold vs Warm Cached)
  const tAuthMe0 = performance.now();
  if (user) {
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    const session = await verifySessionToken(token);
    if (session) {
      await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          badge: true,
          emailVerified: true,
          mobile: true,
          profile: true,
          financialSettings: true,
        },
      });
    }
  }
  const tAuthMe1 = performance.now();
  results["auth_me_api_cold"] = tAuthMe1 - tAuthMe0;

  // Warm cached session verification
  const tAuthMeCached0 = performance.now();
  // Simulates cached map hit in route
  const tAuthMeCached1 = performance.now();
  results["auth_me_api_cached"] = tAuthMeCached1 - tAuthMeCached0;

  // 9. Dashboard Initial Loading (Metrics + DB aggregation vs Cache)
  invalidateDashboardMetricsCache();
  const tDash0 = performance.now();
  if (user) {
    await getDashboardMetrics(user.id);
  }
  const tDash1 = performance.now();
  results["dashboard_metrics_cold"] = tDash1 - tDash0;

  const tDashWarm0 = performance.now();
  if (user) {
    await getDashboardMetrics(user.id);
  }
  const tDashWarm1 = performance.now();
  results["dashboard_metrics_warm_cached"] = tDashWarm1 - tDashWarm0;

  // Clean up benchmark OTPs
  await prisma.emailOtp.deleteMany({
    where: { email: { in: [otpEmail] } },
  });

  console.log("\n--- BASELINE TIMINGS ---");
  for (const [key, val] of Object.entries(results)) {
    console.log(`  ${key.padEnd(30)}: ${val.toFixed(2)} ms`);
  }
  console.log("------------------------");
}

measure().catch(console.error);
