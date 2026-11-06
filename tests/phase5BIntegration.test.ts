import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { createSubscription, listSubscriptions, deleteSubscription } from "@/services/subscriptionService";
import { createExpense, listExpenses } from "@/services/spendingService";
import { getTaxEstimate, updateTaxEstimate } from "@/services/taxService";
import { getFinancialSettings, updateFinancialSettings } from "@/services/settingsService";
import { listReminders, updateReminderTone } from "@/services/reminderService";
import { createClient } from "@/services/clientService";
import { createInvoice } from "@/services/invoiceService";
import { createProject, listProjects } from "@/services/projectService";

export async function runPhase5BIntegrationTests(): Promise<{ passed: number; failed: number }> {
  console.log("\n▶ Running Phase 5B Frontend, API & Database Workflows Integration Suite...");
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, msg: string) => {
    if (condition) {
      console.log(`  ✓ ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  };

  const testSuffix = Math.floor(1000 + Math.random() * 9000);
  const userAEmail = `phase5b_user_a_${testSuffix}@freelancepay.ai`;
  const userBEmail = `phase5b_user_b_${testSuffix}@freelancepay.ai`;

  let userAId = "";
  let userBId = "";

  try {
    const passwordHash = await hashPassword("SecuredPassword!99");

    const userA = await prisma.user.create({
      data: {
        email: userAEmail,
        passwordHash,
        name: "Phase 5B User A",
      },
    });
    userAId = userA.id;

    const userB = await prisma.user.create({
      data: {
        email: userBEmail,
        passwordHash,
        name: "Phase 5B User B",
      },
    });
    userBId = userB.id;

    // 1. Subscriptions Workflow & Tenant Isolation
    const sub = await createSubscription(userAId, {
      name: "Cursor Pro",
      subTitle: "AI IDE • Individual Seat",
      category: "AI",
      costMonthly: 20.0,
      lastActive: "Today",
      usageScore: 95,
      usageStatus: "High",
      recommendation: "Keep Active",
      dueCategory: "30d",
      initials: "CU",
    });
    assert(sub.id.length > 0, "Subscription created in Neon DB with generated ID");
    assert(Number(sub.costMonthly) === 20.0, "Subscription costMonthly matches input");

    const userASubs = await listSubscriptions(userAId);
    assert(userASubs.some((s) => s.id === sub.id), "User A can list their subscriptions");

    const userBSubs = await listSubscriptions(userBId);
    assert(!userBSubs.some((s) => s.id === sub.id), "User B cannot see User A's subscriptions (Tenant Isolation)");

    // Delete subscription with tenant isolation
    let unauthorizedDeleteBlocked = false;
    try {
      await deleteSubscription(userBId, sub.id);
    } catch {
      unauthorizedDeleteBlocked = true;
    }
    assert(unauthorizedDeleteBlocked, "User B blocked from deleting User A's subscription");

    const deleteRes = await deleteSubscription(userAId, sub.id);
    assert(deleteRes.success, "User A successfully deleted their subscription from Neon DB");

    const postDeleteSubs = await listSubscriptions(userAId);
    assert(!postDeleteSubs.some((s) => s.id === sub.id), "Subscription confirmed removed from Neon DB");

    // 2. Spending & Expenses Workflow & Tenant Isolation
    const expense = await createExpense(userAId, {
      merchant: "Figma Professional",
      description: "Team UI Library Seat",
      category: "Software",
      date: new Date().toISOString(),
      method: "PayPal Business",
      isRecurring: true,
      amount: 45.0,
    });
    assert(expense.id.length > 0, "Expense recorded in Neon DB with generated ID");
    assert(Number(expense.amount) === 45.0, "Expense amount stored deterministically");

    const userAExpenses = await listExpenses(userAId);
    assert(userAExpenses.expenses.some((e) => e.id === expense.id), "User A lists their recorded expenses");

    const userBExpenses = await listExpenses(userBId);
    assert(!userBExpenses.expenses.some((e) => e.id === expense.id), "User B cannot see User A's expenses (Tenant Isolation)");

    // 3. Tax Estimates Persistence & Recalculation
    const initialTax = await getTaxEstimate(userAId);
    assert(initialTax.userId === userAId, "Tax estimate automatically provisioned and scoped to User A");

    const updatedTax = await updateTaxEstimate(userAId, {
      jurisdiction: "US-NY",
      entityType: "LLC",
      taxRatio: 28,
      deductibleOffset: 15000,
      vaultSetAside: 12000,
    });
    assert(updatedTax.jurisdiction === "US-NY", "Updated tax jurisdiction persisted in Neon DB");
    assert(Number(updatedTax.taxRatio) === 28, "Tax ratio updated to 28% in Neon DB");
    assert(Number(updatedTax.suggestedReserve) > 0, "Suggested reserve deterministically recalculated");

    const userBTax = await getTaxEstimate(userBId);
    assert(userBTax.userId === userBId && userBTax.id !== updatedTax.id, "User B has distinct isolated tax parameters");

    // 4. Financial Settings Persistence & Tenant Isolation
    const initialSettings = await getFinancialSettings(userAId);
    assert(initialSettings.userId === userAId, "Financial settings scoped to User A");

    const updatedSettings = await updateFinancialSettings(userAId, {
      baseCurrency: "EUR",
      defaultTerms: "Net-30",
      taxRoutingEnabled: true,
      lateFeeEnabled: false,
      recoveryThreshold: 8.5,
    });
    assert(updatedSettings.baseCurrency === "EUR", "Base currency updated to EUR");
    assert(updatedSettings.defaultTerms === "Net-30", "Default terms updated to Net-30");
    assert(Number(updatedSettings.recoveryThreshold) === 8.5, "Recovery threshold updated deterministically");

    const userBSettings = await getFinancialSettings(userBId);
    assert(userBSettings.baseCurrency === "USD", "User B settings unaffected by User A's update (Tenant Isolation)");

    // 5. Milestones & Reminder Workflows
    const client = await createClient(userAId, {
      code: `CLI-${testSuffix}`,
      name: "Apex Studio",
      location: "New York, NY",
      industry: "Design Systems",
      contactName: "Alex Vance",
      contactRole: "Director of Product",
      contactEmail: "ap@apex.design",
    });

    const milestoneProject = await createProject(userAId, {
      title: "Mobile App 2.0 Design System",
      clientId: client.id,
      currency: "USD",
      milestones: [
        {
          title: "Sprint 1 Architecture",
          description: "Core architectural blueprints",
          amount: 4000,
          dueDate: new Date(Date.now() + 14 * 86400000),
        },
      ],
    });
    assert(milestoneProject.id.length > 0, "Milestone project created in Neon DB");
    assert(milestoneProject.milestones.length === 1, "Milestone child deliverable persisted");

    const userAProjects = await listProjects(userAId);
    assert(userAProjects.some((p) => p.id === milestoneProject.id), "User A can list their milestone projects");

    const userBProjects = await listProjects(userBId);
    assert(!userBProjects.some((p) => p.id === milestoneProject.id), "User B cannot see User A's milestone projects (Tenant Isolation)");

    // Create invoice and test reminder tone workflow
    const invoice = await createInvoice(userAId, {
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.contactEmail,
      projectTitle: "Brand Identity Sprint",
      issueDate: new Date(),
      dueDate: new Date(Date.now() - 5 * 86400000), // Overdue
      currency: "USD",
      lineItems: [{ description: "Brand Architecture", quantity: 1, rate: 3000 }],
    });

    const reminder = await prisma.paymentReminder.create({
      data: {
        userId: userAId,
        invoiceId: invoice.id,
        code: `REM-${testSuffix}`,
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail,
        amount: invoice.total,
        dueDate: invoice.dueDate,
        overdueDays: 5,
        status: "pending_approval",
        recommendedTone: "polite",
        activeTone: "polite",
        subject: `Payment Reminder: Invoice #${invoice.code}`,
        messageBody: "Friendly check-in on invoice maturity.",
        paymentLink: `https://freelancepay.ai/pay/${invoice.code}`,
      },
    });
    assert(reminder.id.length > 0, "Payment reminder created in Neon DB");

    const updatedReminder = await updateReminderTone(userAId, reminder.id, "firm", true, "Escalated tone");
    assert(updatedReminder.activeTone === "firm", "Reminder tone escalated to 'firm' in Neon DB");

    const userAReminders = await listReminders(userAId);
    assert(userAReminders.some((r) => r.id === reminder.id), "User A lists active reminders");

    const userBReminders = await listReminders(userBId);
    assert(!userBReminders.some((r) => r.id === reminder.id), "User B cannot see User A's reminders (Tenant Isolation)");

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("  ✗ Execution exception in Phase 5B suite:", errorMsg);
    failed++;
  } finally {
    // Clean up test data
    try {
      if (userAId) {
        await prisma.auditLog.deleteMany({ where: { userId: userAId } });
        await prisma.subscription.deleteMany({ where: { userId: userAId } });
        await prisma.expense.deleteMany({ where: { userId: userAId } });
        await prisma.taxEstimate.deleteMany({ where: { userId: userAId } });
        await prisma.financialSettings.deleteMany({ where: { userId: userAId } });
        await prisma.reminderHistory.deleteMany({ where: { reminder: { userId: userAId } } });
        await prisma.paymentReminder.deleteMany({ where: { userId: userAId } });
        await prisma.milestoneHistory.deleteMany({ where: { milestone: { project: { userId: userAId } } } });
        await prisma.milestone.deleteMany({ where: { project: { userId: userAId } } });
        await prisma.project.deleteMany({ where: { userId: userAId } });
        await prisma.invoiceLineItem.deleteMany({ where: { invoice: { userId: userAId } } });
        await prisma.invoice.deleteMany({ where: { userId: userAId } });
        await prisma.client.deleteMany({ where: { userId: userAId } });
        await prisma.user.delete({ where: { id: userAId } });
      }
      if (userBId) {
        await prisma.auditLog.deleteMany({ where: { userId: userBId } });
        await prisma.taxEstimate.deleteMany({ where: { userId: userBId } });
        await prisma.financialSettings.deleteMany({ where: { userId: userBId } });
        await prisma.user.delete({ where: { id: userBId } });
      }
    } catch {
      // Ignore cleanup error
    }
  }

  console.log(`Phase 5B integration summary: ${passed} passed, ${failed} failed.`);
  return { passed, failed };
}
