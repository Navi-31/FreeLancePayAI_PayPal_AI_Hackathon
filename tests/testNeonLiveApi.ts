import "dotenv/config";
import { prisma } from "../src/lib/db";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from "../src/lib/auth";
import { createInvoice, listInvoices, getInvoiceById } from "../src/services/invoiceService";
import { createClient, listClients } from "../src/services/clientService";
import { createTransaction, listTransactions } from "../src/services/transactionService";

export async function runLiveNeonIntegrationTests() {
  console.log("\n▶ Running Real End-to-End Tests against live Neon PostgreSQL...");
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

  const timestamp = Date.now();
  const userAEmail = `test.user.a.${timestamp}@studio.ai`;
  const userBEmail = `test.user.b.${timestamp}@studio.ai`;
  const plainPassword = "NeonSecurePassword2026!";

  let userAId = "";
  let userBId = "";

  try {
    // 1. Test live User Registration & Password Hashing
    const passwordHash = await hashPassword(plainPassword);
    const userA = await prisma.user.create({
      data: {
        email: userAEmail,
        passwordHash,
        name: "Test User A",
        role: "freelancer",
        profile: {
          create: {
            title: "Senior Product Architect",
            businessName: "Studio Alpha",
          },
        },
      },
    });
    userAId = userA.id;
    assert(Boolean(userA.id), `User A created in Neon DB with ID: ${userA.id}`);

    // 2. Test live Password Verification
    const pwCheck = await verifyPassword(plainPassword, userA.passwordHash);
    assert(pwCheck === true, "Password successfully verified against Neon stored bcrypt hash");

    // 3. Test JWT Session Lifecycle
    const token = await createSessionToken({
      userId: userA.id,
      email: userA.email,
      name: userA.name,
      role: userA.role,
    });
    const session = await verifySessionToken(token);
    assert(session?.userId === userA.id, "JWT session payload verified with user ID");

    // 4. Create User B for Data Isolation Test
    const userB = await prisma.user.create({
      data: {
        email: userBEmail,
        passwordHash,
        name: "Test User B",
        role: "freelancer",
      },
    });
    userBId = userB.id;
    assert(Boolean(userB.id), `User B created in Neon DB with ID: ${userB.id}`);

    // 5. Test Live Client Creation (User A)
    const clientA = await createClient(userA.id, {
      name: "Acme Neon Client",
      location: "Singapore",
      industry: "Fintech",
      contactName: "Li Wei",
      contactRole: "Head of Treasury",
      contactEmail: "treasury@acmeneon.com",
    });
    assert(Boolean(clientA.id), `Client created in Neon DB: ${clientA.name} (${clientA.code})`);

    // 6. Test Live Invoice Creation (User A)
    const invoiceA = await createInvoice(userA.id, {
      clientName: clientA.name,
      clientEmail: clientA.contactEmail,
      projectTitle: "Neon Cloud Architecture",
      issueDate: "2026-11-06",
      dueDate: "2026-11-20",
      taxRatePercent: 10,
      lineItems: [
        { description: "Database Migration & Pooling Setup", quantity: 20, rate: 150 },
        { description: "Prisma Schema Normalization", quantity: 1, rate: 2000 },
      ],
    });
    assert(Number(invoiceA.total) === 5500, `Invoice calculated deterministically in Neon DB: $${invoiceA.total}`);

    // 7. Test Cross-Tenant Data Isolation (User B cannot see User A's data)
    const userBInvoices = await listInvoices(userB.id);
    assert(userBInvoices.invoices.length === 0, "User B cannot see User A's invoices in Neon DB");

    const userBDirectInvoiceAccess = await getInvoiceById(userB.id, invoiceA.id);
    assert(userBDirectInvoiceAccess === null, "User B direct query for User A's invoice ID returns null (enforced isolation)");

    const userBClients = await listClients(userB.id);
    assert(userBClients.clients.length === 0, "User B cannot see User A's clients in Neon DB");

    // 8. Test Live Transaction Creation & Idempotency
    const tx = await createTransaction(userA.id, {
      description: "Neon Escrow Release",
      clientName: clientA.name,
      type: "client_settlement",
      grossAmount: 5000,
      feeAmount: 145,
      paymentChannel: "Stripe Connect",
      idempotencyKey: `idem_test_${timestamp}`,
    });
    assert(Number(tx.netAmount) === 4855, `Transaction recorded in Neon DB: Net $${tx.netAmount}`);

    // Re-call with same idempotency key
    const duplicateTx = await createTransaction(userA.id, {
      description: "Neon Escrow Release",
      clientName: clientA.name,
      type: "client_settlement",
      grossAmount: 5000,
      feeAmount: 145,
      paymentChannel: "Stripe Connect",
      idempotencyKey: `idem_test_${timestamp}`,
    });
    assert(duplicateTx.id === tx.id, "Idempotency key prevents duplicate transaction creation in Neon DB");

    // Clean up test users (cascade deletes all related test records)
    await prisma.user.delete({ where: { id: userAId } });
    await prisma.user.delete({ where: { id: userBId } });
    console.log("  ✓ Test users and related test records cleaned up from Neon DB");
    passed++;
  } catch (err) {
    console.error("  ✗ Live Neon test failed:", err);
    failed++;
    // Cleanup if IDs exist
    if (userAId) await prisma.user.delete({ where: { id: userAId } }).catch(() => {});
    if (userBId) await prisma.user.delete({ where: { id: userBId } }).catch(() => {});
  }

  console.log(`Live Neon integration summary: ${passed} passed, ${failed} failed.`);
  return { passed, failed };
}

// Allow running this file directly with tsx: npx tsx tests/testNeonLiveApi.ts
if (process.argv[1] && process.argv[1].includes("testNeonLiveApi")) {
  runLiveNeonIntegrationTests()
    .then((res) => {
      if (res.failed > 0) process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
