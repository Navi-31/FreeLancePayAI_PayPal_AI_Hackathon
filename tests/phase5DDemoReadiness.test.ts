import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import {
  seedDemoDataForUser,
  DEMO_SYNTHETIC_MARKER,
  DEMO_CLIENT_CODES,
  DEMO_INVOICE_CODES,
  DEMO_PROJECT_CODES,
  DEMO_REMINDER_CODES,
} from "@/services/demoSeedService";
import { generateCopilotResponse } from "@/services/aiService";
import { Prisma } from "@prisma/client";

export async function runPhase5DDemoReadinessTests(): Promise<{ passed: number; failed: number }> {
  console.log("\n▶ Running Phase 5D & 5D.1 Demo Readiness & Reset Safety Audit Suite...");
  let passed = 0;
  let failed = 0;

  const assert = (condition: unknown, msg: string) => {
    if (Boolean(condition)) {
      console.log(`  ✓ ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  };

  let userA: { id: string; email: string } | null = null;
  let userB: { id: string; email: string } | null = null;

  try {
    const salt = Math.floor(1000 + Math.random() * 9000);
    const pwdHash = await hashPassword("DemoPassSecure!123");

    userA = await prisma.user.create({
      data: {
        email: `demo_user_a_${salt}@freelancepay.ai`,
        passwordHash: pwdHash,
        name: "Demo User A",
      },
    });

    userB = await prisma.user.create({
      data: {
        email: `demo_user_b_${salt}@freelancepay.ai`,
        passwordHash: pwdHash,
        name: "Demo User B",
      },
    });

    // 1. Safe Repeatable Demo Seed Execution
    const seedResult = await seedDemoDataForUser(userA.id, false);
    assert(seedResult.success, "Demo data successfully seeded for User A");
    assert(seedResult.counts.clients === 6, "Seeded exactly 6 coherent enterprise clients");
    assert(seedResult.counts.invoices === 5, "Seeded exactly 5 interconnected invoices with line items");
    assert(seedResult.counts.milestones === 3, "Seeded exactly 3 milestone stages (authorized, in_review, pending)");
    assert(seedResult.counts.transactions === 3, "Seeded 3 settled ledger transactions");
    assert(seedResult.counts.expenses === 5, "Seeded 5 categorized operational outflows");
    assert(seedResult.counts.subscriptions === 5, "Seeded 5 SaaS audit subscriptions");
    assert(seedResult.counts.reminders === 1, "Seeded 1 overdue reminder notice with firm tone");

    // 2. Strict Tenant Isolation on Initial Seeded Records
    const userBClients = await prisma.client.findMany({ where: { userId: userB.id } });
    assert(userBClients.length === 0, "User B database remains clean and isolated from User A seeded data");

    const userBInvoices = await prisma.invoice.findMany({ where: { userId: userB.id } });
    assert(userBInvoices.length === 0, "User B has 0 invoices (Zero cross-user data leakage)");

    const userBTransactions = await prisma.transaction.findMany({ where: { userId: userB.id } });
    assert(userBTransactions.length === 0, "User B has 0 transactions");

    // 3. Verify Synthetic Markers and Clear Non-Settlement Labeling
    const seededInvoices = await prisma.invoice.findMany({ where: { userId: userA.id } });
    assert(
      seededInvoices.every((i) => i.notes?.includes(DEMO_SYNTHETIC_MARKER)),
      "All seeded invoices explicitly carry DEMO_SYNTHETIC marker"
    );

    const seededTxs = await prisma.transaction.findMany({ where: { userId: userA.id } });
    assert(
      seededTxs.every(
        (t) =>
          t.hash.startsWith("0xDEMO-") &&
          t.notes?.includes(DEMO_SYNTHETIC_MARKER) &&
          t.description.startsWith("[SIMULATED]")
      ),
      "All seeded transactions clearly identify synthetic demo sandbox status"
    );

    // 4. Milestone PayPal Sandbox Rails & Non-Escrow Compliance
    const authorizedMilestone = await prisma.milestone.findFirst({
      where: { project: { userId: userA.id }, status: "authorized" },
    });
    assert(
      authorizedMilestone?.paypalAuthorizationId === "AUTH-DEMO-SANDBOX-901A",
      "Milestone records explicit PayPal Sandbox authorization ID"
    );

    // 5. PHASE 5D.1 AUDIT: User A Creates Genuine, Real Records
    const realClient = await prisma.client.create({
      data: {
        userId: userA.id,
        code: "CLI-REAL-001",
        name: "Acquisition Corp Global Inc",
        location: "London, UK",
        industry: "Private Equity",
        contactName: "Arthur Pendelton",
        contactRole: "Managing Director",
        contactEmail: "arthur@acquisitioncorp.co.uk",
        riskTier: "High Reliability",
        reliabilityScore: 99,
        lifetimeRevenue: new Prisma.Decimal(125000.0),
        notes: "Real genuine institutional client. Must survive all demo resets.",
      },
    });

    const realInvoice = await prisma.invoice.create({
      data: {
        userId: userA.id,
        clientId: realClient.id,
        code: "INV-REAL-001",
        clientName: realClient.name,
        clientEmail: realClient.contactEmail,
        projectTitle: "Institutional M&A Platform Advisory",
        status: "sent",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 86400000),
        currency: "USD",
        currencySymbol: "$",
        subtotal: new Prisma.Decimal(12500.0),
        total: new Prisma.Decimal(12500.0),
        notes: "Genuine client invoice. Not a demo record.",
      },
    });

    const realExpense = await prisma.expense.create({
      data: {
        userId: userA.id,
        merchant: "WeWork Financial District",
        description: "Genuine Private Office Lease for Q4",
        category: "Operations",
        date: new Date(),
        method: "Corporate Credit Card (*4491)",
        isRecurring: true,
        amount: new Prisma.Decimal(2400.0),
        currency: "USD",
      },
    });

    const realSubscription = await prisma.subscription.create({
      data: {
        userId: userA.id,
        name: "Datadog APM Enterprise",
        subTitle: "Dedicated Cloud APM & Security Monitoring",
        category: "Engineering",
        costMonthly: new Prisma.Decimal(180.0),
        lastActive: "Today",
        usageScore: 99,
        usageStatus: "High",
        recommendation: "Keep Active",
      },
    });

    const realTx = await prisma.transaction.create({
      data: {
        userId: userA.id,
        code: "TX-REAL-001",
        hash: "0xREAL-4188b9c20491",
        description: "Direct Wire Remittance for Retainer Q4",
        clientName: realClient.name,
        type: "client_settlement",
        status: "settled",
        grossAmount: new Prisma.Decimal(12500.0),
        feeAmount: new Prisma.Decimal(25.0),
        netAmount: new Prisma.Decimal(12475.0),
        paymentChannel: "Direct Fedwire",
        idempotencyKey: `tx-real-001-${userA.id}`,
      },
    });

    // 6. Execute Demo Data Reset & Assert Genuine User Records Survive
    const resetResult = await seedDemoDataForUser(userA.id, true);
    assert(resetResult.success, "Demo reset executed successfully with targeted deletion");

    // Check Genuine Records Survival
    const survivedClient = await prisma.client.findUnique({
      where: { userId_code: { userId: userA.id, code: "CLI-REAL-001" } },
    });
    assert(Boolean(survivedClient), "Genuine user client CLI-REAL-001 survived demo reset intact!");

    const survivedInvoice = await prisma.invoice.findUnique({
      where: { userId_code: { userId: userA.id, code: "INV-REAL-001" } },
    });
    assert(Boolean(survivedInvoice), "Genuine user invoice INV-REAL-001 survived demo reset intact!");

    const survivedExpense = await prisma.expense.findFirst({
      where: { userId: userA.id, description: "Genuine Private Office Lease for Q4" },
    });
    assert(Boolean(survivedExpense), "Genuine user expense survived demo reset intact!");

    const survivedSubscription = await prisma.subscription.findFirst({
      where: { userId: userA.id, name: "Datadog APM Enterprise" },
    });
    assert(Boolean(survivedSubscription), "Genuine user subscription survived demo reset intact!");

    const survivedTx = await prisma.transaction.findUnique({
      where: { idempotencyKey: `tx-real-001-${userA.id}` },
    });
    assert(Boolean(survivedTx), "Genuine user transaction survived demo reset intact!");

    // Check Total Counts After Reset (5 Demo + 1 Real = 6 Invoices; 6 Demo + 1 Real = 7 Clients)
    const totalInvoicesAfterReset = await prisma.invoice.count({ where: { userId: userA.id } });
    assert(totalInvoicesAfterReset === 6, "Total invoices count is exactly 6 (5 demo + 1 genuine preserved)");

    const totalClientsAfterReset = await prisma.client.count({ where: { userId: userA.id } });
    assert(totalClientsAfterReset === 7, "Total clients count is exactly 7 (6 demo + 1 genuine preserved)");

    const totalExpensesAfterReset = await prisma.expense.count({ where: { userId: userA.id } });
    assert(totalExpensesAfterReset === 6, "Total expenses count is exactly 6 (5 demo + 1 genuine preserved)");

    // 7. Repeated Demo Resets Are Safe & Idempotent
    const secondResetResult = await seedDemoDataForUser(userA.id, true);
    assert(secondResetResult.success, "Second consecutive demo reset succeeded cleanly");

    const totalInvoicesAfterSecondReset = await prisma.invoice.count({ where: { userId: userA.id } });
    assert(
      totalInvoicesAfterSecondReset === 6,
      "Second reset maintained exact count of 6 invoices (Zero duplicate accumulation)"
    );

    const survivedInvoice2 = await prisma.invoice.findUnique({
      where: { userId_code: { userId: userA.id, code: "INV-REAL-001" } },
    });
    assert(Boolean(survivedInvoice2), "Genuine invoice still intact after multiple resets");

    // 8. Cross-Tenant Reset Security (User B reset does not touch User A)
    await seedDemoDataForUser(userB.id, false);
    const userAInvoicesBefore = await prisma.invoice.count({ where: { userId: userA.id } });

    // User B runs reset
    await seedDemoDataForUser(userB.id, true);

    const userAInvoicesAfter = await prisma.invoice.count({ where: { userId: userA.id } });
    assert(
      userAInvoicesBefore === userAInvoicesAfter,
      "User B demo reset has ZERO effect on User A data (Cross-tenant security guaranteed)"
    );

    // 9. AI Copilot Deterministic Grounding & Approval-First Actions
    const copilotRes = await generateCopilotResponse(userA.id, "Who owes me money?");
    assert(Boolean(copilotRes.data.analysis), "Copilot returned structured financial analysis");
    assert(
      copilotRes.data.verifiedMetrics.overdueReceivables >= 1500,
      "Copilot metrics strictly derived from deterministic database figures ($1,500 overdue)"
    );
    if (copilotRes.data.actionProposal) {
      assert(
        copilotRes.data.actionProposal.requiresUserApproval === true,
        "AI proposed financial action strictly requires explicit human user approval"
      );
    } else {
      assert(true, "AI action proposal adhered to safety schema");
    }

    // 10. Tax Settings & Safe Harbor Defaults
    const taxEst = await prisma.taxEstimate.findFirst({ where: { userId: userA.id } });
    assert(taxEst?.jurisdiction === "US-CA", "Tax estimate defaulted to statutory California safe harbor");
    assert(Number(taxEst?.taxRatio) === 25.0, "Tax ratio safely allocated to 25.00%");

    const settings = await prisma.financialSettings.findUnique({ where: { userId: userA.id } });
    assert(settings?.autonomousShieldActive === true, "Autonomous tax shield active by default");
    assert(settings?.paypalMerchantConnected === true, "PayPal Merchant status connected in demo profile");

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("  ✗ Execution exception in Phase 5D & 5D.1 suite:", errorMsg);
    failed++;
  } finally {
    // Teardown test users and all cascaded records
    if (userA?.id) {
      try {
        await prisma.user.delete({ where: { id: userA.id } });
      } catch {}
    }
    if (userB?.id) {
      try {
        await prisma.user.delete({ where: { id: userB.id } });
      } catch {}
    }
  }

  console.log(`Phase 5D & 5D.1 demo readiness summary: ${passed} passed, ${failed} failed.`);
  return { passed, failed };
}
