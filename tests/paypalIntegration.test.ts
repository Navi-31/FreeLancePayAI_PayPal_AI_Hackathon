import "dotenv/config";
import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import { createClient } from "../src/services/clientService";
import { createInvoice } from "../src/services/invoiceService";
import { createProject } from "../src/services/projectService";
import {
  createInvoicePaymentOrder,
  captureInvoicePayment,
  createMilestoneAuthorizationOrder,
  authorizeMilestonePayment,
  captureMilestonePayment,
  refundPayment,
  handlePayPalWebhook,
} from "../src/services/paypalService";
import { verifyPayPalWebhookSignature } from "../src/lib/paypal";

export async function runPayPalIntegrationTests() {
  console.log("\n▶ Running PayPal Sandbox Integration & Security Suite...");
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
  const userAEmail = `paypal.test.a.${timestamp}@freelancepay.ai`;
  const userBEmail = `paypal.test.b.${timestamp}@freelancepay.ai`;
  const plainPassword = "SecurePayPalTest2026!";

  let userAId = "";
  let userBId = "";

  try {
    const passwordHash = await hashPassword(plainPassword);

    // Setup Test User A
    const userA = await prisma.user.create({
      data: {
        email: userAEmail,
        passwordHash,
        name: "PayPal Tester A",
        role: "freelancer",
      },
    });
    userAId = userA.id;

    // Setup Test User B (for cross-tenant security testing)
    const userB = await prisma.user.create({
      data: {
        email: userBEmail,
        passwordHash,
        name: "PayPal Tester B",
        role: "freelancer",
      },
    });
    userBId = userB.id;

    // Create Client for User A
    const clientA = await createClient(userA.id, {
      name: "PayPal Test Corp",
      location: "San Jose, CA",
      industry: "Fintech",
      contactName: "Dan Schulman",
      contactRole: "Treasurer",
      contactEmail: "treasurer@paypaltestcorp.com",
    });

    // Create Invoice for User A ($2,500.00)
    const invoiceA = await createInvoice(userA.id, {
      clientId: clientA.id,
      clientName: clientA.name,
      clientEmail: clientA.contactEmail,
      projectTitle: "PayPal Checkout Architecture",
      issueDate: "2026-11-06",
      dueDate: "2026-11-20",
      taxRatePercent: 0,
      lineItems: [
        { description: "API Integration & Webhook Handling", quantity: 1, rate: 2500 },
      ],
    });

    // -------------------------------------------------------------
    // TEST 1: Invoice Order Creation (intent = CAPTURE)
    // -------------------------------------------------------------
    const orderRes = await createInvoicePaymentOrder(userA.id, invoiceA.id);
    assert(Boolean(orderRes.orderId), `Order created with ID: ${orderRes.orderId}`);
    assert(orderRes.status === "CREATED", "Order status initialized as CREATED");
    assert(orderRes.amount === 2500, "Authoritative amount strictly matches DB ($2,500.00)");

    // Verify DB update
    const updatedInv = await prisma.invoice.findUnique({ where: { id: invoiceA.id } });
    assert(updatedInv?.paypalOrderId === orderRes.orderId, "Invoice record in DB holds generated paypalOrderId");

    // Ownership check: User B cannot create an order for User A's invoice
    let userBOrderFailed = false;
    try {
      await createInvoicePaymentOrder(userB.id, invoiceA.id);
    } catch {
      userBOrderFailed = true;
    }
    assert(userBOrderFailed, "User B blocked from creating order for User A's invoice (Ownership Isolation)");

    // -------------------------------------------------------------
    // TEST 2: Payment Capture & Atomic State Transitions
    // -------------------------------------------------------------
    const captureRes = await captureInvoicePayment(userA.id, invoiceA.id, orderRes.orderId);
    assert(captureRes.success === true, "Invoice payment captured successfully");
    assert(Boolean(captureRes.captureId), `Capture ID generated: ${captureRes.captureId}`);
    assert(captureRes.grossAmount === 2500, "Gross amount matches invoice total ($2,500.00)");

    // Verify DB records changed ONLY after confirmed provider response
    const settledInv = await prisma.invoice.findUnique({ where: { id: invoiceA.id } });
    assert(settledInv?.status === "paid", "Invoice status updated to 'paid' in DB");
    assert(Boolean(settledInv?.paidAt), "Invoice paidAt timestamp populated in DB");
    assert(settledInv?.paypalCaptureId === captureRes.captureId, "Invoice stores verified paypalCaptureId");

    // Verify Transaction record created
    const tx = await prisma.transaction.findFirst({
      where: { linkedInvoiceId: invoiceA.id },
    });
    assert(Boolean(tx), "Settlement transaction created in DB ledger");
    assert(Number(tx?.grossAmount) === 2500, `Transaction gross is $${tx?.grossAmount}`);
    assert(tx?.paymentChannel === "PayPal Direct", "Payment channel recorded as 'PayPal Direct'");
    assert(tx?.idempotencyKey === `paypal_capture_${captureRes.captureId}`, "Transaction has idempotent key");

    // Verify Client Lifetime Revenue & Outstanding Balance adjusted
    const updatedClient = await prisma.client.findUnique({ where: { id: clientA.id } });
    assert(Number(updatedClient?.lifetimeRevenue) === 2500, "Client lifetimeRevenue incremented by $2,500.00");
    assert(Number(updatedClient?.outstandingBalance) === -2500, "Client outstandingBalance credited by $2,500.00");

    // Idempotency test: Cannot pay already paid invoice
    let duplicateOrderBlocked = false;
    try {
      await createInvoicePaymentOrder(userA.id, invoiceA.id);
    } catch {
      duplicateOrderBlocked = true;
    }
    assert(duplicateOrderBlocked, "Blocked order creation for already paid invoice");

    // -------------------------------------------------------------
    // TEST 3: Milestone Authorization & Capture (intent = AUTHORIZE)
    // -------------------------------------------------------------
    const project = await createProject(userA.id, {
      clientId: clientA.id,
      title: "Fintech Platform Milestones",
      currency: "USD",
      milestones: [
        {
          code: `MS-TST-${timestamp}`,
          title: "Milestone 1 - PayPal Orders",
          description: "Authorization & capture rails",
          amount: 1500,
          dueDate: "2026-12-01",
        },
      ],
    });

    const milestoneId = project.milestones[0].id;

    // 3A. Create Milestone Order
    const msOrder = await createMilestoneAuthorizationOrder(userA.id, milestoneId);
    assert(Boolean(msOrder.orderId), `Milestone order created: ${msOrder.orderId}`);
    assert(msOrder.amount === 1500, "Milestone order amount matches DB ($1,500.00)");

    // 3B. Authorize Milestone Funds
    const authRes = await authorizeMilestonePayment(userA.id, milestoneId, msOrder.orderId);
    assert(authRes.success === true, "Milestone authorization approved");
    assert(Boolean(authRes.authorizationId), `Authorization ID recorded: ${authRes.authorizationId}`);

    const authorizedMs = await prisma.milestone.findUnique({ where: { id: milestoneId } });
    assert(authorizedMs?.status === "authorized", "Milestone transitioned to 'authorized' status");
    assert(Boolean(authorizedMs?.authorizedAt), "authorizedAt timestamp populated");

    // Ownership check: User B cannot capture User A's milestone
    let userBCaptureBlocked = false;
    try {
      await captureMilestonePayment(userB.id, milestoneId);
    } catch {
      userBCaptureBlocked = true;
    }
    assert(userBCaptureBlocked, "User B blocked from capturing User A's milestone (Ownership Isolation)");

    // 3C. Capture Milestone Funds (Deliverable Accepted)
    const msCaptureRes = await captureMilestonePayment(userA.id, milestoneId);
    assert(msCaptureRes.success === true, "Milestone funds captured successfully");
    assert(Boolean(msCaptureRes.captureId), `Milestone capture ID: ${msCaptureRes.captureId}`);

    const capturedMs = await prisma.milestone.findUnique({ where: { id: milestoneId } });
    assert(capturedMs?.status === "captured", "Milestone status updated to 'captured'");
    assert(capturedMs?.paypalCaptureId === msCaptureRes.captureId, "Milestone stores paypalCaptureId");

    // -------------------------------------------------------------
    // TEST 4: Refund Processing & Validation
    // -------------------------------------------------------------
    // 4A. Invalid amount rejection (exceeding captured total)
    let excessiveRefundBlocked = false;
    try {
      await refundPayment(userA.id, {
        invoiceId: invoiceA.id,
        amount: 999999, // Exceeds $2,500
        reason: "Illegal amount test",
      });
    } catch {
      excessiveRefundBlocked = true;
    }
    assert(excessiveRefundBlocked, "Refund exceeding captured gross amount rejected with error");

    // 4B. Negative amount rejection
    let negativeRefundBlocked = false;
    try {
      await refundPayment(userA.id, {
        invoiceId: invoiceA.id,
        amount: -100,
        reason: "Negative amount test",
      });
    } catch {
      negativeRefundBlocked = true;
    }
    assert(negativeRefundBlocked, "Refund with negative amount rejected");

    // 4C. Valid Partial Refund ($500.00)
    const refundRes = await refundPayment(userA.id, {
      invoiceId: invoiceA.id,
      amount: 500,
      reason: "Volume rebate refund",
    });
    assert(refundRes.success === true, "Valid partial refund processed ($500.00)");
    assert(Boolean(refundRes.refundId), `Refund transaction ID: ${refundRes.refundId}`);

    // Verify refund transaction in DB
    const refundTx = await prisma.transaction.findFirst({
      where: { paypalRefundId: refundRes.refundId },
    });
    assert(Boolean(refundTx), "Refund transaction persisted in database");
    assert(Number(refundTx?.grossAmount) === -500, "Refund transaction has negative gross amount (-$500.00)");
    assert(refundTx?.type === "refund", "Transaction type marked as 'refund'");

    // -------------------------------------------------------------
    // TEST 5: Webhook Signature Verification & Durable Idempotency
    // -------------------------------------------------------------
    // 5A. Signature Verification helper
    const isSigValid = await verifyPayPalWebhookSignature({
      authAlgo: "SHA256withRSA",
      certUrl: "https://api.sandbox.paypal.com/v1/notifications/certs/CERT-1",
      transmissionId: `tx_${timestamp}`,
      transmissionSig: "sample_signature",
      transmissionTime: new Date().toISOString(),
      webhookId: "wh_test_123",
      eventBody: { test: true },
    });
    assert(isSigValid === true, "Webhook signature verification returns true for valid payload format");

    // 5B. Webhook Ingestion & Durable Idempotency
    const webhookEventId = `WH-EVT-${timestamp}`;
    const webhookPayload = JSON.stringify({
      id: webhookEventId,
      event_type: "PAYMENT.CAPTURE.COMPLETED",
      resource_type: "capture",
      resource: {
        id: `CAP-WH-${timestamp}`,
        custom_id: invoiceA.id,
        amount: { value: "2500.00", currency_code: "USD" },
      },
    });

    const whRes1 = await handlePayPalWebhook(webhookPayload, {
      "paypal-transmission-id": `tx_${timestamp}`,
      "paypal-transmission-sig": "valid_sig",
      "paypal-auth-algo": "SHA256withRSA",
      "paypal-cert-url": "https://api.sandbox.paypal.com/v1/certs",
      "paypal-transmission-time": new Date().toISOString(),
    });
    assert(whRes1.status === "processed", "Webhook event processed and recorded in DB");

    // Send the EXACT SAME webhook event again to test idempotency
    const whRes2 = await handlePayPalWebhook(webhookPayload, {
      "paypal-transmission-id": `tx_${timestamp}`,
      "paypal-transmission-sig": "valid_sig",
      "paypal-auth-algo": "SHA256withRSA",
      "paypal-cert-url": "https://api.sandbox.paypal.com/v1/certs",
      "paypal-transmission-time": new Date().toISOString(),
    });
    assert(whRes2.status === "duplicate", "Duplicate webhook event detected and safely ignored (Durable Idempotency)");

    // Cleanup test users (cascades to all test records in Neon DB)
    await prisma.user.delete({ where: { id: userAId } });
    await prisma.user.delete({ where: { id: userBId } });
    console.log("  ✓ Test users and all related PayPal records cleaned up from Neon DB");
    passed++;
  } catch (err) {
    console.error("  ✗ PayPal integration test suite encountered error:", err);
    failed++;
    if (userAId) await prisma.user.delete({ where: { id: userAId } }).catch(() => {});
    if (userBId) await prisma.user.delete({ where: { id: userBId } }).catch(() => {});
  }

  console.log(`PayPal integration suite summary: ${passed} passed, ${failed} failed.`);
  return { passed, failed };
}

// Allow direct execution: npx tsx tests/paypalIntegration.test.ts
if (process.argv[1] && process.argv[1].includes("paypalIntegration")) {
  runPayPalIntegrationTests()
    .then((res) => {
      if (res.failed > 0) process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
