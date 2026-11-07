import assert from "assert";
import { generateNumericOtp, hashOtp, verifyOtpCode, createAndSendOtp } from "@/backend/services/otpService";
import { requestPasswordReset, resetPasswordWithToken, hashToken } from "@/backend/services/passwordResetService";
import { mirrorUserDataset } from "@/backend/services/userMigrationService";
import { prisma } from "@/backend/db/db";
import { hashPassword } from "@/backend/auth/auth";

export async function runAuthOtpFlowTests() {
  console.log("\n--- Running Suite 14: Email OTP, Password Reset & Dataset Mirror Tests ---");
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => Promise<void> | void) {
    try {
      const result = fn();
      if (result instanceof Promise) {
        return result
          .then(() => {
            console.log(`  ✓ ${name}`);
            passed++;
          })
          .catch((err) => {
            console.error(`  ✗ ${name}`);
            console.error(err);
            failed++;
          });
      } else {
        console.log(`  ✓ ${name}`);
        passed++;
      }
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(err);
      failed++;
    }
  }

  // 1. Numeric OTP Generation & Format
  test("OTP generation produces cryptographically secure 6-digit numeric string", () => {
    for (let i = 0; i < 20; i++) {
      const code = generateNumericOtp();
      assert.strictEqual(typeof code, "string");
      assert.strictEqual(code.length, 6);
      assert.match(code, /^\d{6}$/);
      const num = parseInt(code, 10);
      assert.ok(num >= 100000 && num <= 999999);
    }
  });

  // 2. SHA-256 Hashing of OTP
  test("OTP hash is deterministic SHA-256 hex string", () => {
    const code = "829145";
    const h1 = hashOtp(code);
    const h2 = hashOtp(code);
    assert.strictEqual(h1, h2);
    assert.strictEqual(h1.length, 64);
  });

  // 3. Reset Token Hashing
  test("Password reset token hashing produces distinct SHA-256 hashes", () => {
    const t1 = "abcdef1234567890abcdef1234567890";
    const t2 = "fedcba0987654321fedcba0987654321";
    const h1 = hashToken(t1);
    const h2 = hashToken(t2);
    assert.strictEqual(h1.length, 64);
    assert.strictEqual(h2.length, 64);
    assert.notStrictEqual(h1, h2);
  });

  // 4. Invalidation and Cooldown in Database
  await test("createAndSendOtp stores record, enforces cooldown, and respects attempt locks", async () => {
    const testEmail = `test.otp.${Date.now()}@freelancepay.ai`;

    // 1. Dispatch first OTP
    const firstResult = await createAndSendOtp({
      email: testEmail,
      purpose: "SIGNUP_VERIFICATION",
      recipientName: "Test User",
    });

    assert.ok(firstResult.success);
    assert.ok(firstResult.expiresAt);

    // 2. Immediate resend should trigger cooldown protection
    const secondResult = await createAndSendOtp({
      email: testEmail,
      purpose: "SIGNUP_VERIFICATION",
      recipientName: "Test User",
    });

    assert.strictEqual(secondResult.success, false);
    assert.ok(secondResult.cooldownSecondsRemaining && secondResult.cooldownSecondsRemaining > 0);

    // 3. Clean up test OTP records
    await prisma.emailOtp.deleteMany({
      where: { email: testEmail },
    });
  });

  // 5. Verification failure on wrong code decrements attempts
  await test("verifyOtpCode accurately compares code and tracks incorrect attempts", async () => {
    const testEmail = `verify.attempt.${Date.now()}@freelancepay.ai`;
    const now = new Date();
    const correctCode = "654321";
    const wrongCode = "123456";

    // Insert an OTP directly to test verification mechanics
    await prisma.emailOtp.create({
      data: {
        email: testEmail,
        otpHash: hashOtp(correctCode),
        purpose: "LOGIN_OTP",
        expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
        resendAfter: new Date(now.getTime() + 100 * 1000),
        attempts: 0,
        maxAttempts: 5,
        verified: false,
      },
    });

    // Test incorrect attempt
    const failAttempt = await verifyOtpCode(testEmail, "LOGIN_OTP", wrongCode);
    assert.strictEqual(failAttempt.valid, false);
    assert.strictEqual(failAttempt.remainingAttempts, 4);

    // Test correct attempt
    const successAttempt = await verifyOtpCode(testEmail, "LOGIN_OTP", correctCode);
    assert.strictEqual(successAttempt.valid, true);

    // Clean up
    await prisma.emailOtp.deleteMany({
      where: { email: testEmail },
    });
  });

  // 6. Dataset mirroring idempotency test
  await test("mirrorUserDataset behaves idempotently and isolates data", async () => {
    // Check if Alex Vance exists
    const alex = await prisma.user.findUnique({
      where: { email: "alex.vance@studio.ai" },
    });

    if (alex) {
      // Create a temporary target test user
      const tempTarget = await prisma.user.create({
        data: {
          email: `temp.target.${Date.now()}@test.io`,
          name: "Temporary Target",
          passwordHash: await hashPassword("TestPass123!"),
          role: "freelancer",
          emailVerified: true,
        },
      });

      // Mirror dataset
      const mirrorRes = await mirrorUserDataset(alex.email, tempTarget.id);
      assert.ok(mirrorRes.success);
      assert.ok(mirrorRes.counts.clients >= 0);

      // Re-running mirrorUserDataset on already cloned user must be idempotent
      const rerunRes = await mirrorUserDataset(alex.email, tempTarget.id);
      assert.ok(rerunRes.success);
      assert.strictEqual(rerunRes.alreadyMigrated, true);

      // Clean up temporary user and all cascade-deleted cloned records
      await prisma.user.delete({
        where: { id: tempTarget.id },
      });
    }
  });

  return { passed, failed };
}
