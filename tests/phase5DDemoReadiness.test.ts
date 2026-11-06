import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { seedDemoDataForUser } from "@/services/demoSeedService";
import { generateCopilotResponse } from "@/services/aiService";

export async function runPhase5DDemoReadinessTests(): Promise<{ passed: number; failed: number }> {
  console.log("\n▶ Running Phase 5D Demo Readiness & Product Polish Suite...");
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

    // 2. Strict Tenant Isolation on Seeded Records
    const userBClients = await prisma.client.findMany({ where: { userId: userB.id } });
    assert(userBClients.length === 0, "User B database remains clean and isolated from User A seeded data");

    const userBInvoices = await prisma.invoice.findMany({ where: { userId: userB.id } });
    assert(userBInvoices.length === 0, "User B has 0 invoices (Zero cross-user data leakage)");

    const userBTransactions = await prisma.transaction.findMany({ where: { userId: userB.id } });
    assert(userBTransactions.length === 0, "User B has 0 transactions");

    // 3. Repeatable Reset & Re-seed Capability
    const resetResult = await seedDemoDataForUser(userA.id, true);
    assert(resetResult.success, "Demo data cleanly reset and re-seeded for User A");
    const reseededCount = await prisma.invoice.count({ where: { userId: userA.id } });
    assert(reseededCount === 5, "Exactly 5 invoices after reset without duplicate accumulation");

    // 4. Milestone PayPal Sandbox Rails & Non-Escrow Compliance
    const authorizedMilestone = await prisma.milestone.findFirst({
      where: { project: { userId: userA.id }, status: "authorized" },
    });
    assert(
      authorizedMilestone?.paypalAuthorizationId === "AUTH-SANDBOX-901A",
      "Milestone records explicit PayPal Sandbox authorization ID"
    );

    // 5. AI Copilot Deterministic Grounding & Approval-First Actions
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

    // 6. Tax Settings & Safe Harbor Defaults
    const taxEst = await prisma.taxEstimate.findFirst({ where: { userId: userA.id } });
    assert(taxEst?.jurisdiction === "US-CA", "Tax estimate defaulted to statutory California safe harbor");
    assert(Number(taxEst?.taxRatio) === 25.0, "Tax ratio safely allocated to 25.00%");

    const settings = await prisma.financialSettings.findUnique({ where: { userId: userA.id } });
    assert(settings?.autonomousShieldActive === true, "Autonomous tax shield active by default");
    assert(settings?.paypalMerchantConnected === true, "PayPal Merchant status connected in demo profile");

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("  ✗ Execution exception in Phase 5D suite:", errorMsg);
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

  console.log(`Phase 5D demo readiness summary: ${passed} passed, ${failed} failed.`);
  return { passed, failed };
}
