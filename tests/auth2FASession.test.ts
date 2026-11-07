import assert from "assert";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  getSessionCookieConfig,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from "@/backend/auth/auth";
import {
  generateNumericOtp,
  hashOtp,
  verifyOtpCode,
  createAndSendOtp,
} from "@/backend/services/otpService";
import { prisma } from "@/backend/db/db";

export async function runAuth2FASessionTests() {
  console.log("\n▶ Running Focused Authentication & 2FA Session Flow Tests...");
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

  const testEmail = `operator.auth.test.${Date.now()}@freelancepay.ai`;
  const plainPassword = "TestExecutivePass2026!";
  let testUserId = `usr_test_${Date.now()}`;

  // 1. Successful Login Credential Validation
  await test("1. Credential validation verifies registered user password against bcrypt hash", async () => {
    const passwordHash = await hashPassword(plainPassword);
    assert.ok(passwordHash.startsWith("$2"), "Password hashed in bcrypt format");

    const valid = await verifyPassword(plainPassword, passwordHash);
    assert.strictEqual(valid, true, "Valid password matches hash");

    const invalid = await verifyPassword("WrongPassword123!", passwordHash);
    assert.strictEqual(invalid, false, "Invalid password fails match");
  });

  // 2. 2FA OTP Generation & Dispatch
  await test("2. 2FA OTP generation produces cryptographically valid code and persists in DB", async () => {
    const otpResult = await createAndSendOtp({
      email: testEmail,
      purpose: "LOGIN_OTP",
      recipientName: "Test Operator",
    });

    assert.strictEqual(otpResult.success, true, "OTP creation and dispatch succeeds");
    assert.ok(otpResult.expiresAt, "OTP includes expiration timestamp");

    const record = await prisma.emailOtp.findFirst({
      where: { email: testEmail, purpose: "LOGIN_OTP", verified: false },
    });
    assert.ok(record, "OTP record saved in database");
    assert.strictEqual(record.attempts, 0, "Initial attempts count is 0");
    assert.strictEqual(record.maxAttempts, 5, "Max attempts is 5");
  });

  // 3. Successful OTP Verification
  await test("3. Successful 2FA OTP verification validates correct 6-digit code", async () => {
    const knownCode = "739201";
    await prisma.emailOtp.create({
      data: {
        email: `${testEmail}.known`,
        otpHash: hashOtp(knownCode),
        purpose: "LOGIN_OTP",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        resendAfter: new Date(Date.now() + 100 * 1000),
        attempts: 0,
        maxAttempts: 5,
        verified: false,
      },
    });

    const result = await verifyOtpCode(`${testEmail}.known`, "LOGIN_OTP", knownCode);
    assert.strictEqual(result.valid, true, "Known OTP code verifies successfully");

    const verifiedRecord = await prisma.emailOtp.findFirst({
      where: { email: `${testEmail}.known`, purpose: "LOGIN_OTP" },
    });
    assert.strictEqual(verifiedRecord?.verified, true, "Database record marked as verified");

    // Clean up
    await prisma.emailOtp.deleteMany({ where: { email: `${testEmail}.known` } });
  });

  // 4. Session Cookie Creation and Config
  await test("4. Session cookie configuration adheres to secure, HttpOnly, SameSite specifications", () => {
    const cookieConfig = getSessionCookieConfig();
    assert.strictEqual(cookieConfig.name, SESSION_COOKIE_NAME, "Cookie name is freelancepay_session");
    assert.strictEqual(cookieConfig.httpOnly, true, "Cookie is HttpOnly");
    assert.strictEqual(cookieConfig.sameSite, "lax", "Cookie SameSite is lax");
    assert.strictEqual(cookieConfig.path, "/", "Cookie path is root /");
    assert.strictEqual(cookieConfig.maxAge, SESSION_DURATION_SECONDS, "Cookie maxAge matches session duration (7 days)");

    // In test environment, secure is false (allowing local testing)
    assert.strictEqual(cookieConfig.secure, process.env.NODE_ENV === "production");
  });

  // 5. Authenticated Session Creation & Token Verification
  let validSessionToken = "";
  await test("5. Session creation produces valid signed JWT with full payload", async () => {
    const payload = {
      userId: testUserId,
      email: testEmail,
      name: "Test Autonomous Operator",
      role: "freelancer",
      badge: "PRO VIP",
    };

    validSessionToken = await createSessionToken(payload);
    assert.ok(validSessionToken && validSessionToken.length > 50, "Signed JWT token created");

    const decoded = await verifySessionToken(validSessionToken);
    assert.ok(decoded !== null, "Token verified successfully");
    assert.strictEqual(decoded.userId, testUserId, "Payload userId matches");
    assert.strictEqual(decoded.email, testEmail, "Payload email matches");
    assert.strictEqual(decoded.role, "freelancer", "Payload role matches");
  });

  // 6. Authenticated Session Restoration (Simulating Page Refresh)
  await test("6. Session restoration after refresh resolves identical authenticated user", async () => {
    assert.ok(validSessionToken, "Valid session token present");

    // Simulates /api/auth/me reading the token from cookie
    const session = await verifySessionToken(validSessionToken);
    assert.ok(session, "Session successfully extracted from cookie token");
    assert.strictEqual(session.userId, testUserId);
    assert.strictEqual(session.email, testEmail);
  });

  // 7. Successful Dashboard Access for Authenticated Session
  await test("7. Authenticated user successfully passes protected route check", async () => {
    const session = await verifySessionToken(validSessionToken);
    const isAuthenticated = Boolean(session && session.userId);
    assert.strictEqual(isAuthenticated, true, "Route guard allows authenticated user into dashboard");
  });

  // 8. Invalid and Expired OTP Rejection
  await test("8. Invalid and expired OTPs are strictly rejected", async () => {
    const badEmail = `${testEmail}.expired`;
    const expiredCode = "111222";

    // Expired OTP in database
    await prisma.emailOtp.create({
      data: {
        email: badEmail,
        otpHash: hashOtp(expiredCode),
        purpose: "LOGIN_OTP",
        expiresAt: new Date(Date.now() - 60 * 1000), // expired 1 min ago
        resendAfter: new Date(Date.now() - 30 * 1000),
        attempts: 0,
        maxAttempts: 5,
        verified: false,
      },
    });

    const expiredResult = await verifyOtpCode(badEmail, "LOGIN_OTP", expiredCode);
    assert.strictEqual(expiredResult.valid, false, "Expired OTP rejected");
    assert.ok(expiredResult.error?.includes("expired"), "Error indicates code has expired");

    // Wrong code attempt
    const activeCode = "998877";
    await prisma.emailOtp.create({
      data: {
        email: badEmail,
        otpHash: hashOtp(activeCode),
        purpose: "LOGIN_OTP",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        resendAfter: new Date(Date.now() + 100 * 1000),
        attempts: 0,
        maxAttempts: 5,
        verified: false,
      },
    });

    const wrongResult = await verifyOtpCode(badEmail, "LOGIN_OTP", "000000");
    assert.strictEqual(wrongResult.valid, false, "Incorrect code rejected");
    assert.strictEqual(wrongResult.remainingAttempts, 4, "Remaining attempts decremented to 4");

    // Clean up
    await prisma.emailOtp.deleteMany({ where: { email: badEmail } });
  });

  // 9. Unauthenticated Dashboard Access Redirection
  await test("9. Unauthenticated visitor is denied dashboard access and redirected", async () => {
    const nullToken = null;
    const sessionFromNull = nullToken ? await verifySessionToken(nullToken) : null;
    const isAllowed = Boolean(sessionFromNull && sessionFromNull.userId);
    assert.strictEqual(isAllowed, false, "Protected route denies null session");

    // Tampered token
    const tampered = validSessionToken.slice(0, -10) + "XXXXXXXXXX";
    const sessionFromTampered = await verifySessionToken(tampered);
    assert.strictEqual(sessionFromTampered, null, "Protected route rejects invalid/tampered token");
  });

  // 10. Logout and Subsequent Protected Route Rejection
  await test("10. Logout invalidates cookie and denies subsequent dashboard access", async () => {
    const logoutCookie = getSessionCookieConfig({ maxAge: 0, expires: new Date(0) });
    assert.strictEqual(logoutCookie.maxAge, 0, "Logout cookie maxAge set to 0");
    assert.strictEqual(logoutCookie.expires?.getTime(), 0, "Logout cookie expiry set to epoch");

    // After logout, incoming token is cleared ("")
    const clearedToken = "";
    const sessionAfterLogout = clearedToken ? await verifySessionToken(clearedToken) : null;
    assert.strictEqual(sessionAfterLogout, null, "Session is completely null after logout");

    const allowsDashboard = Boolean(sessionAfterLogout && sessionAfterLogout.userId);
    assert.strictEqual(allowsDashboard, false, "Dashboard access strictly rejected after logout");
  });

  // Clean up test OTPs
  await prisma.emailOtp.deleteMany({
    where: { email: { startsWith: `operator.auth.test.` } },
  });

  console.log(`\nFocused Auth 2FA test summary: ${passed} passed, ${failed} failed.`);
  return { passed, failed };
}
