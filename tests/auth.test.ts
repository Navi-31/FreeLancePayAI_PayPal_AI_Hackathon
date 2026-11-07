import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
} from "@/backend/auth/auth";

export async function runAuthTests() {
  console.log("\n▶ Running Authentication & Token Verification Tests...");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✓ ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${desc}`);
      failed++;
    }
  }

  // 1. Password hashing & verification
  const plain = "DevSecurePassword2026!";
  const hash = await hashPassword(plain);
  assert(hash.startsWith("$2"), "Password hash uses bcrypt format");
  assert(hash !== plain, "Hash is not plaintext");

  const correctMatch = await verifyPassword(plain, hash);
  assert(correctMatch === true, "Correct password verifies against hash");

  const wrongMatch = await verifyPassword("WrongPassword123", hash);
  assert(wrongMatch === false, "Wrong password fails verification");

  // 2. JWT Session Token Lifecycle
  const payload = {
    userId: "usr_test_99214",
    email: "operator@freelancepay.ai",
    name: "Autonomous Operator",
    role: "freelancer",
    badge: "PRO VIP",
  };

  const token = await createSessionToken(payload);
  assert(typeof token === "string" && token.split(".").length === 3, "Generated valid JWT token with 3 parts");

  const verified = await verifySessionToken(token);
  assert(verified !== null, "Session token successfully verifies");
  assert(verified?.userId === payload.userId, "Decoded token preserves userId");
  assert(verified?.email === payload.email, "Decoded token preserves email");
  assert(verified?.role === payload.role, "Decoded token preserves role");

  // 3. Tampered token rejection
  const tamperedToken = token.slice(0, -6) + "xxxxxx";
  const tamperedResult = await verifySessionToken(tamperedToken);
  assert(tamperedResult === null, "Tampered token is rejected");

  console.log(`Auth test summary: ${passed} passed, ${failed} failed.`);
  return { passed, failed };
}
