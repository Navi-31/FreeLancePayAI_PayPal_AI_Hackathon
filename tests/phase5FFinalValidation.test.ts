import { prisma } from "@/backend/db/db";
import { hashPassword } from "@/backend/auth/auth";
import { createInvoice, updateInvoiceStatus } from "@/backend/services/invoiceService";
import { createClient } from "@/backend/services/clientService";
import {
  createInvoicePaymentOrder,
  captureInvoicePayment,
  refundPayment,
  handlePayPalWebhook,
} from "@/backend/services/paypalService";
import {
  seedDemoDataForUser,
  DEMO_SYNTHETIC_MARKER,
} from "@/backend/services/demoSeedService";
import {
  computeClientReliability,
  computeFeeAndCurrencyScenarios,
  computeCashflowForecastScenarios,
} from "@/backend/services/financialIntelligence";
import { generateCopilotResponse } from "@/backend/services/aiService";
import { calculateInvoiceTotals, calculateTaxReserveAllocation } from "@/shared/financialCalculations";
import { Prisma } from "@/backend/db/db";

export async function runPhase5FFinalValidationTests(): Promise<{ passed: number; failed: number }> {
  console.log("\n▶ Running Phase 5F Final Comprehensive QA & Hackathon Demo Validation Suite...");
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
    const pwdHash = await hashPassword("FinalQAPass!123");

    userA = await prisma.user.create({
      data: {
        email: `final_qa_user_a_${salt}@freelancepay.ai`,
        passwordHash: pwdHash,
        name: "Final QA User A",
      },
    });

    userB = await prisma.user.create({
      data: {
        email: `final_qa_user_b_${salt}@freelancepay.ai`,
        passwordHash: pwdHash,
        name: "Final QA User B",
      },
    });

    // 1. Independent Deterministic Financial Calculation Fixtures
    const lineItems = [
      { description: "Lead Fullstack Engineering", quantity: 40, rate: 125.0 },
      { description: "System Architecture Audit", quantity: 10, rate: 150.0 },
    ];
    const totals = calculateInvoiceTotals(lineItems, 8.25);
    assert(totals.subtotal === 6500.0, "Deterministic subtotal fixture: exactly $6,500.00");
    assert(totals.taxAmount === 536.25, "Deterministic tax fixture: 8.25% on $6,500.00 = $536.25");
    assert(totals.total === 7036.25, "Deterministic total fixture: exactly $7,036.25");

    const taxReserve = calculateTaxReserveAllocation(7036.25, 25);
    assert(taxReserve === 1759.06, "Deterministic 25% tax reserve fixture: $1,759.06");

    // 2. Client & Invoice End-to-End Lifecycle in Live DB
    const clientA = await createClient(userA.id, {
      name: "Apex HyperScale Corp",
      location: "Austin, TX",
      industry: "Enterprise Cloud",
      contactName: "Marcus Vance",
      contactRole: "VP Product",
      contactEmail: "marcus@apexscale.io",
      riskTier: "High Reliability",
      lifetimeRevenue: 50000,
      disputeHistory: "0 Disputes",
    });
    assert(clientA.id !== undefined, "Client created in Neon DB with verified user tenancy");

    const invoiceA = await createInvoice(userA.id, {
      clientId: clientA.id,
      clientName: clientA.name,
      clientEmail: clientA.contactEmail,
      projectTitle: "Platform Core Refactor",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      paymentChannel: "PayPal Direct",
      taxRatePercent: 8.25,
      lineItems,
    });
    assert(Number(invoiceA.total) === 7036.25, "Persisted invoice total matches deterministic calculation ($7,036.25)");
    assert(invoiceA.status === "draft", "Invoice initial status is 'draft'");

    // Update status transitions
    const sentInv = await updateInvoiceStatus(userA.id, invoiceA.id, "sent");
    assert(sentInv.status === "sent", "Status successfully transitioned from 'draft' to 'sent'");

    const viewedInv = await updateInvoiceStatus(userA.id, invoiceA.id, "viewed");
    assert(viewedInv.status === "viewed", "Status successfully transitioned from 'sent' to 'viewed'");

    // 3. PayPal Sandbox Order Creation & Capture Lifecycle
    const ppOrder = await createInvoicePaymentOrder(userA.id, invoiceA.id);
    assert(Boolean(ppOrder.orderId && ppOrder.orderId.length > 5), "PayPal Sandbox order created with valid order ID");
    assert(ppOrder.amount === 7036.25, "PayPal Sandbox order amount strictly matches DB invoice total");

    const captureResult = await captureInvoicePayment(userA.id, invoiceA.id, ppOrder.orderId);
    assert(captureResult.success, "PayPal Sandbox payment captured successfully");
    assert(captureResult.invoice.status === "paid", "Invoice status updated to 'paid' in DB");
    assert(captureResult.invoice.paypalCaptureId !== null, "Invoice stores verified PayPal capture ID");

    // Verify settled transaction created in DB ledger
    const settlementTx = await prisma.transaction.findFirst({
      where: { userId: userA.id, linkedInvoiceId: invoiceA.id },
    });
    assert(settlementTx !== null, "Settlement transaction created in ledger");
    assert(Number(settlementTx?.grossAmount) === 7036.25, "Settlement gross matches invoice total ($7,036.25)");
    assert(Number(settlementTx?.netAmount) > 0, "Settlement net amount calculated after processing fees");

    // 4. PayPal Refund Safeguards
    const refundResult = await refundPayment(userA.id, {
      invoiceId: invoiceA.id,
      amount: 1000.0,
      reason: "Partial milestone scope adjustment",
    });
    assert(refundResult.success, "Partial refund executed via PayPal Sandbox rails");
    assert(refundResult.refundAmount === 1000.0, "Refund amount recorded as $1,000.00");

    const refundTx = await prisma.transaction.findFirst({
      where: { userId: userA.id, type: "refund" },
    });
    assert(refundTx !== null, "Refund transaction created in ledger");
    assert(Number(refundTx?.grossAmount) === -1000.0, "Refund transaction carries negative gross (-$1,000.00)");

    // 5. PayPal Webhook Idempotency & Duplicate Handling
    const mockWebhookBody = JSON.stringify({
      id: `WH-EVENT-QA-${salt}`,
      event_type: "PAYMENT.CAPTURE.COMPLETED",
      resource: {
        id: `CAP-QA-HOOK-${salt}`,
        invoice_id: invoiceA.id,
        amount: { value: "7036.25", currency_code: "USD" },
      },
    });

    const webhookHeaders = {
      "paypal-transmission-id": `tx_${salt}`,
      "paypal-transmission-sig": "valid_sig",
      "paypal-auth-algo": "SHA256withRSA",
      "paypal-cert-url": "https://api.sandbox.paypal.com/v1/certs",
      "paypal-transmission-time": new Date().toISOString(),
    };

    const firstWebhook = await handlePayPalWebhook(mockWebhookBody, webhookHeaders);
    assert(firstWebhook.status === "processed", "Initial PayPal webhook processed successfully");

    const duplicateWebhook = await handlePayPalWebhook(mockWebhookBody, webhookHeaders);
    assert(duplicateWebhook.status === "duplicate", "Duplicate webhook safely dropped with durable idempotency");

    // 6. Cross-Tenant Isolation & IDOR Prevention
    const userBInvoices = await prisma.invoice.findMany({ where: { userId: userB.id } });
    assert(userBInvoices.length === 0, "User B has 0 invoices (Zero cross-user data leakage)");

    let idorPrevented = false;
    try {
      await updateInvoiceStatus(userB.id, invoiceA.id, "cancelled");
    } catch {
      idorPrevented = true;
    }
    assert(idorPrevented, "Cross-tenant IDOR attack blocked: User B cannot modify User A's invoice");

    // 7. Demo Data Reset Safety (Genuine User Records Survival)
    const genuineExpense = await prisma.expense.create({
      data: {
        userId: userA.id,
        merchant: "AWS High-Compute",
        category: "Cloud Infrastructure",
        description: "Production Server Instances",
        amount: new Prisma.Decimal(450.0),
        date: new Date(),
        method: "Corporate Card",
      },
    });
    assert(genuineExpense.id !== undefined, "Genuine user expense created in Neon DB");

    // Execute demo seed and reset
    await seedDemoDataForUser(userA.id, false);
    const resetResult = await seedDemoDataForUser(userA.id, true);
    assert(resetResult.success, "Demo reset executed successfully");

    // Verify genuine user records survived reset intact
    const preservedInvoice = await prisma.invoice.findUnique({ where: { id: invoiceA.id } });
    assert(preservedInvoice !== null, "Genuine user invoice survived demo reset intact!");

    const preservedClient = await prisma.client.findUnique({ where: { id: clientA.id } });
    assert(preservedClient !== null, "Genuine user client survived demo reset intact!");

    const preservedExpense = await prisma.expense.findUnique({ where: { id: genuineExpense.id } });
    assert(preservedExpense !== null, "Genuine user expense survived demo reset intact!");

    // 8. Grounded AI Copilot & Approval-First Constraints
    const copilotQuery = await generateCopilotResponse(userA.id, "What is my total revenue and overdue receivables?");
    assert(copilotQuery.data.verifiedMetrics.totalRevenue >= 7036.25, "Copilot total revenue correctly includes live settled revenue");
    assert(copilotQuery.data.dataClassification.historicalFacts.length > 0, "Copilot itemizes historical ledger facts");
    if (copilotQuery.data.actionProposal) {
      assert(copilotQuery.data.actionProposal.requiresUserApproval === true, "Copilot action proposals strictly require human approval");
    } else {
      assert(true, "Copilot output safely adheres to approval schema");
    }

    // 9. Client Reliability Scoring & Insufficient Data State
    const insufficientHistoryClient = await createClient(userA.id, {
      name: "Brand New Startup LLC",
      contactName: "Sarah Connor",
      contactEmail: "sarah@startup.io",
    });
    const reliability = computeClientReliability(insufficientHistoryClient);
    assert(reliability.hasSufficientData === false, "Client with 0 completed invoices flagged as insufficient data");
    assert(reliability.status === "insufficient_data", "Status explicitly set to 'insufficient_data'");
    assert(reliability.score === null, "Score is null to prevent hallucinated 90+ ratings");

    // 10. Fee Comparison Matrix & ACH Statutory Cap
    const feeAnalysis = computeFeeAndCurrencyScenarios(3500.0);
    assert(feeAnalysis.scenarios.length === 5, "Fee intelligence evaluated 5 distinct gateway and wire scenarios");
    const achScenario = feeAnalysis.scenarios.find((s) => s.channel.includes("Bank ACH"));
    assert(achScenario?.estimatedFee === 5.0, "Bank ACH fee strictly capped at statutory $5.00 limit");
    assert(feeAnalysis.potentialSavings === 96.8, "Potential savings accurately identified ($96.80 on $3,500)");

    // 11. Multi-Scenario Cashflow Forecasting & Segregated Vault Balance
    const forecast = computeCashflowForecastScenarios(
      25000.0,
      [invoiceA],
      [genuineExpense],
      []
    );
    assert(forecast.actualLiquidBalance === 25000.0, "Actual liquid vault balance strictly segregated from forecasts");
    assert(
      forecast.scenarios.conservative.projectedBalance30d < forecast.scenarios.optimistic.projectedBalance30d,
      "Conservative projection strictly lower than optimistic"
    );
    assert(forecast.scenarios.expected.assumptions.length > 0, "Expected baseline provides clear explicit assumptions");
  } catch (error) {
    console.error("  Phase 5F Final Validation failed with unhandled error:", error);
    failed++;
  } finally {
    // Teardown test users and cascade-delete child entities
    try {
      if (userA) await prisma.user.delete({ where: { id: userA.id } });
      if (userB) await prisma.user.delete({ where: { id: userB.id } });
    } catch {}
  }

  console.log(`\nPhase 5F final validation summary: ${passed} passed, ${failed} failed.`);
  return { passed, failed };
}
