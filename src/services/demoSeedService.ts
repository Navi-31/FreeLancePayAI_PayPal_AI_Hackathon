import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export const DEMO_SYNTHETIC_MARKER = "[DEMO_SYNTHETIC]";

export const DEMO_CLIENT_CODES = [
  "CLI-8021",
  "CLI-8022",
  "CLI-8023",
  "CLI-8024",
  "CLI-8025",
  "CLI-8848",
] as const;

export const DEMO_PROJECT_CODES = ["PRJ-901"] as const;

export const DEMO_INVOICE_CODES = [
  "FP-8849",
  "FP-8848",
  "FP-8847",
  "FP-8846",
  "FP-8845",
] as const;

export const DEMO_REMINDER_CODES = ["REM-8848"] as const;

export const DEMO_TRANSACTION_PREFIX = "tx-demo-";

export const DEMO_TAX_QUARTER = "Q4-2025-DEMO";

export interface DemoSeedResult {
  success: boolean;
  message: string;
  counts: {
    clients: number;
    invoices: number;
    milestoneProjects: number;
    milestones: number;
    transactions: number;
    expenses: number;
    subscriptions: number;
    reminders: number;
  };
}

export async function seedDemoDataForUser(userId: string, isReset = false): Promise<DemoSeedResult> {
  return await prisma.$transaction(
    async (tx) => {
    if (isReset) {
      // Safely delete ONLY demo-seeded records belonging to this user.
      // Genuine user-created records (custom codes, custom descriptions) are strictly preserved.

      // 1. Payment Reminders & History
      await tx.reminderHistory.deleteMany({
        where: {
          reminder: {
            userId,
            code: { in: [...DEMO_REMINDER_CODES] },
          },
        },
      });
      await tx.paymentReminder.deleteMany({
        where: {
          userId,
          code: { in: [...DEMO_REMINDER_CODES] },
        },
      });

      // 2. Milestones & History
      await tx.milestoneHistory.deleteMany({
        where: {
          milestone: {
            project: {
              userId,
              code: { in: [...DEMO_PROJECT_CODES] },
            },
          },
        },
      });
      await tx.milestone.deleteMany({
        where: {
          project: {
            userId,
            code: { in: [...DEMO_PROJECT_CODES] },
          },
        },
      });
      await tx.project.deleteMany({
        where: {
          userId,
          code: { in: [...DEMO_PROJECT_CODES] },
        },
      });

      // 3. Transactions (Strictly targeted by demo idempotency prefix or synthetic hash)
      await tx.transaction.deleteMany({
        where: {
          userId,
          OR: [
            { idempotencyKey: { startsWith: DEMO_TRANSACTION_PREFIX } },
            { hash: { startsWith: "0xDEMO-" } },
            { notes: { contains: DEMO_SYNTHETIC_MARKER } },
          ],
        },
      });

      // 4. Invoices & Line Items
      await tx.invoiceLineItem.deleteMany({
        where: {
          invoice: {
            userId,
            code: { in: [...DEMO_INVOICE_CODES] },
          },
        },
      });
      await tx.invoice.deleteMany({
        where: {
          userId,
          code: { in: [...DEMO_INVOICE_CODES] },
        },
      });

      // 5. Client Payment History & Clients
      await tx.clientPaymentHistory.deleteMany({
        where: {
          client: {
            userId,
            code: { in: [...DEMO_CLIENT_CODES] },
          },
        },
      });
      await tx.client.deleteMany({
        where: {
          userId,
          code: { in: [...DEMO_CLIENT_CODES] },
        },
      });

      // 6. Expenses (Strictly targeted by persistent demo marker in description)
      await tx.expense.deleteMany({
        where: {
          userId,
          description: { contains: DEMO_SYNTHETIC_MARKER },
        },
      });

      // 7. Subscriptions (Strictly targeted by persistent demo marker in subTitle)
      await tx.subscription.deleteMany({
        where: {
          userId,
          subTitle: { contains: DEMO_SYNTHETIC_MARKER },
        },
      });

      // 8. Tax Estimates (Strictly targeted by synthetic demo quarter tag)
      await tx.taxEstimate.deleteMany({
        where: {
          userId,
          quarter: DEMO_TAX_QUARTER,
        },
      });
    }

    // 1. Seed 6 Coherent Clients
    const clientData = [
      {
        code: "CLI-8021",
        name: "Apex Global Corp",
        location: "New York, NY",
        industry: "Fintech & Institutional Capital",
        contactName: "Sarah Connor",
        contactRole: "VP Finance Operations",
        contactEmail: "sarah.connor@apexglobal.io",
        riskTier: "Platinum",
        reliabilityScore: 98,
        lifetimeRevenue: new Prisma.Decimal(84500.0),
        outstandingBalance: new Prisma.Decimal(0.0),
        avgSettlementLag: "-2.1 Days (Early Settler)",
        disputeHistory: "0 Formal Disputes",
        preferredRails: "PayPal Direct (Simulated Sandbox Business)",
        notes: `${DEMO_SYNTHETIC_MARKER} Key anchor client. High volume, zero settlement friction.`,
        playbookWhatWorks: "Consolidated monthly invoices with instant net-14 settlement.",
        playbookWhatFails: "Manual paper processing or fragmented milestones.",
      },
      {
        code: "CLI-8022",
        name: "Horizon Studio",
        location: "San Francisco, CA",
        industry: "Product Design & Spatial Computing",
        contactName: "Maya Lin",
        contactRole: "Head of Product Engineering",
        contactEmail: "maya@horizon.design",
        riskTier: "High Reliability",
        reliabilityScore: 92,
        lifetimeRevenue: new Prisma.Decimal(36000.0),
        outstandingBalance: new Prisma.Decimal(8500.0),
        avgSettlementLag: "+1.2 Days",
        disputeHistory: "0 Formal Disputes",
        preferredRails: "Stripe Connect Direct Rail (Simulated Sandbox)",
        notes: `${DEMO_SYNTHETIC_MARKER} Sprint retainer model. Consistent 14-day turnaround.`,
        playbookWhatWorks: "Deliverable preview links included in invoice remit instructions.",
        playbookWhatFails: "Ambiguous scope changes without change-order addendum.",
      },
      {
        code: "CLI-8023",
        name: "Synthetix Labs LLC",
        location: "Boston, MA",
        industry: "Autonomous AI Agents & Robotics",
        contactName: "Marcus Vance",
        contactRole: "Chief Technology Officer",
        contactEmail: "marcus@synthetix.io",
        riskTier: "High Reliability",
        reliabilityScore: 89,
        lifetimeRevenue: new Prisma.Decimal(24500.0),
        outstandingBalance: new Prisma.Decimal(0.0),
        avgSettlementLag: "+0.5 Days",
        disputeHistory: "0 Formal Disputes",
        preferredRails: "PayPal Direct (USD Simulated Sandbox)",
        notes: `${DEMO_SYNTHETIC_MARKER} Research engineering engagements on quarterly retainers.`,
        playbookWhatWorks: "Clear milestone verification against benchmark evals.",
        playbookWhatFails: "Delayed milestone review submissions.",
      },
      {
        code: "CLI-8024",
        name: "Venture Dynamics",
        location: "Austin, TX",
        industry: "Venture Studio & Seed Acceleration",
        contactName: "David Sterling",
        contactRole: "Managing Partner",
        contactEmail: "ap@venturedynamics.vc",
        riskTier: "Attention Required",
        reliabilityScore: 74,
        lifetimeRevenue: new Prisma.Decimal(18900.0),
        outstandingBalance: new Prisma.Decimal(0.0),
        avgSettlementLag: "+8.4 Days",
        disputeHistory: "1 Past Clarification",
        preferredRails: "SWIFT International Wire (Simulated Clearance)",
        notes: `${DEMO_SYNTHETIC_MARKER} Requires polite follow-up before bi-weekly partner check runs.`,
        playbookWhatWorks: "Direct Slack notice to managing partner 48h before due date.",
        playbookWhatFails: "Generic automated billing emails without partner CC.",
      },
      {
        code: "CLI-8025",
        name: "Lumina Labs",
        location: "Seattle, WA",
        industry: "Biotech & Computational Genomics",
        contactName: "Elena Rostova",
        contactRole: "Director of Operations",
        contactEmail: "finance@luminalabs.io",
        riskTier: "High Reliability",
        reliabilityScore: 91,
        lifetimeRevenue: new Prisma.Decimal(14800.0),
        outstandingBalance: new Prisma.Decimal(3200.0),
        avgSettlementLag: "+2.0 Days",
        disputeHistory: "0 Formal Disputes",
        preferredRails: "PayPal Direct (Simulated Sandbox Business)",
        notes: `${DEMO_SYNTHETIC_MARKER} Bioinformatics visual analytics platform engagement.`,
        playbookWhatWorks: "Itemized sprint timesheets attached to invoice.",
        playbookWhatFails: "Unscheduled billing cycles.",
      },
      {
        code: "CLI-8848",
        name: "Acme Corp",
        location: "Chicago, IL",
        industry: "Enterprise Cloud & Legacy Logistics",
        contactName: "Sarah Jenkins",
        contactRole: "Accounts Payable Controller",
        contactEmail: "sarah.jenkins@acmecorp.com",
        riskTier: "High Friction",
        reliabilityScore: 61,
        lifetimeRevenue: new Prisma.Decimal(32000.0),
        outstandingBalance: new Prisma.Decimal(1500.0),
        avgSettlementLag: "+14.0 Days (High Lag)",
        disputeHistory: "2 Disputed Terms",
        preferredRails: "PayPal Direct (Simulated Sandbox Business)",
        notes: `${DEMO_SYNTHETIC_MARKER} Accounts payable system defers disbursements until firm reminder notice.`,
        playbookWhatWorks: "Firm escalation tone citing contractual late fee clauses.",
        playbookWhatFails: "Polite reminders without due date ultimatum.",
      },
    ];

    const seededClients = [];
    for (const c of clientData) {
      const client = await tx.client.upsert({
        where: { userId_code: { userId, code: c.code } },
        update: { ...c },
        create: { userId, ...c },
      });
      seededClients.push(client);
    }

    const acmeClient = seededClients.find((c) => c.code === "CLI-8848")!;
    const horizonClient = seededClients.find((c) => c.code === "CLI-8022")!;
    const synthetixClient = seededClients.find((c) => c.code === "CLI-8023")!;
    const ventureClient = seededClients.find((c) => c.code === "CLI-8024")!;
    const luminaClient = seededClients.find((c) => c.code === "CLI-8025")!;

    // 2. Seed Milestone Project & Milestones
    const project = await tx.project.upsert({
      where: { userId_code: { userId, code: "PRJ-901" } },
      update: {
        title: "Enterprise Brand System & Architecture 2025",
        description: `${DEMO_SYNTHETIC_MARKER} Institutional design tokens, multi-platform UI components, and sandbox payment orchestration.`,
        totalAmount: new Prisma.Decimal(9500.0),
        status: "active",
      },
      create: {
        userId,
        clientId: acmeClient.id,
        code: "PRJ-901",
        escrowId: "ESCROW-DEMO-ACME-901",
        title: "Enterprise Brand System & Architecture 2025",
        description: `${DEMO_SYNTHETIC_MARKER} Institutional design tokens, multi-platform UI components, and sandbox payment orchestration.`,
        totalAmount: new Prisma.Decimal(9500.0),
        currency: "USD",
        currencySymbol: "$",
        status: "active",
      },
    });

    const m1 = await tx.milestone.upsert({
      where: { id: `m1-${project.id}` },
      update: {
        status: "authorized",
        amount: new Prisma.Decimal(3500.0),
        paypalAuthorizationId: "AUTH-DEMO-SANDBOX-901A",
        description: `${DEMO_SYNTHETIC_MARKER} Delivery and validation of production JSON design tokens for cross-platform apps.`,
      },
      create: {
        id: `m1-${project.id}`,
        code: "M-101",
        projectId: project.id,
        title: "Token Architecture & Foundational Design Tokens",
        description: `${DEMO_SYNTHETIC_MARKER} Delivery and validation of production JSON design tokens for cross-platform apps.`,
        amount: new Prisma.Decimal(3500.0),
        dueDate: new Date(Date.now() - 2 * 86400000),
        status: "authorized",
        authorizedAt: new Date(Date.now() - 3 * 86400000),
        paypalAuthorizationId: "AUTH-DEMO-SANDBOX-901A",
      },
    });

    await tx.milestone.upsert({
      where: { id: `m2-${project.id}` },
      update: {
        status: "in_review",
        amount: new Prisma.Decimal(3000.0),
        description: `${DEMO_SYNTHETIC_MARKER} Automated sync pipeline from Figma to React TypeScript library with unit tests.`,
      },
      create: {
        id: `m2-${project.id}`,
        code: "M-102",
        projectId: project.id,
        title: "Component Library & Figma-to-Code Pipeline",
        description: `${DEMO_SYNTHETIC_MARKER} Automated sync pipeline from Figma to React TypeScript library with unit tests.`,
        amount: new Prisma.Decimal(3000.0),
        dueDate: new Date(Date.now() + 5 * 86400000),
        status: "in_review",
      },
    });

    await tx.milestone.upsert({
      where: { id: `m3-${project.id}` },
      update: {
        status: "pending",
        amount: new Prisma.Decimal(3000.0),
        description: `${DEMO_SYNTHETIC_MARKER} CPA-compliant documentation, zero-defect audit, and repository sign-off.`,
      },
      create: {
        id: `m3-${project.id}`,
        code: "M-103",
        projectId: project.id,
        title: "Production Release & Institutional Handoff",
        description: `${DEMO_SYNTHETIC_MARKER} CPA-compliant documentation, zero-defect audit, and repository sign-off.`,
        amount: new Prisma.Decimal(3000.0),
        dueDate: new Date(Date.now() + 18 * 86400000),
        status: "pending",
      },
    });

    // 3. Seed Coherent Invoices with Line Items
    const invoiceSpecs = [
      {
        code: "FP-8849",
        client: horizonClient,
        projectTitle: "Design System Sprint II",
        status: "viewed",
        issueDate: new Date(Date.now() - 4 * 86400000),
        dueDate: new Date(Date.now() + 10 * 86400000),
        poReference: "PO-DEMO-HRZ-2025-02",
        paymentChannel: "Stripe Connect (Sandbox)",
        subtotal: new Prisma.Decimal(8500.0),
        total: new Prisma.Decimal(8500.0),
        viewCount: 4,
        aiRiskScore: "Low",
        aiTelemetryNote: "[SIMULATED TELEMETRY] Client accessed link from San Francisco, CA. High settlement probability within 48h.",
        notes: `${DEMO_SYNTHETIC_MARKER} Synthetic demonstration invoice with sandbox payment rails.`,
        lineItems: [
          { description: "Sprint II Architecture & Component Tokens", quantity: 1, rate: 5500.0, amount: 5500.0 },
          { description: "Verification & Production Integration", quantity: 30, rate: 100.0, amount: 3000.0 },
        ],
      },
      {
        code: "FP-8848",
        client: acmeClient,
        projectTitle: "Brand Architecture Q2",
        status: "overdue",
        issueDate: new Date(Date.now() - 28 * 86400000),
        dueDate: new Date(Date.now() - 14 * 86400000),
        poReference: "PO-DEMO-ACM-2025-102",
        paymentChannel: "PayPal Direct (Sandbox)",
        subtotal: new Prisma.Decimal(1500.0),
        total: new Prisma.Decimal(1500.0),
        viewCount: 6,
        aiRiskScore: "High",
        aiTelemetryNote: "[SIMULATED TELEMETRY] AP viewing detected 4x with zero settlement action. Algorithmic Firm Escalation advised.",
        notes: `${DEMO_SYNTHETIC_MARKER} Synthetic demonstration invoice with sandbox payment rails.`,
        lineItems: [
          { description: "Identity System Review & Brand Guidelines", quantity: 10, rate: 150.0, amount: 1500.0 },
        ],
      },
      {
        code: "FP-8847",
        client: ventureClient,
        projectTitle: "AI Telemetry Dashboard",
        status: "paid",
        issueDate: new Date(Date.now() - 16 * 86400000),
        dueDate: new Date(Date.now() - 2 * 86400000),
        paidAt: new Date(Date.now() - 1 * 86400000),
        poReference: "PO-DEMO-VD-991",
        paymentChannel: "SWIFT Wire (Simulated)",
        subtotal: new Prisma.Decimal(4200.0),
        total: new Prisma.Decimal(4200.0),
        viewCount: 3,
        aiRiskScore: "Low",
        aiTelemetryNote: "[SIMULATED TELEMETRY] Settled via simulated clearing rail. Auto-routed $840 to Q4 tax shield vault.",
        notes: `${DEMO_SYNTHETIC_MARKER} Synthetic demonstration invoice with sandbox payment rails.`,
        paypalCaptureId: "CAP-DEMO-SANDBOX-8847",
        lineItems: [
          { description: "Predictive Analytics Backend Integration", quantity: 28, rate: 150.0, amount: 4200.0 },
        ],
      },
      {
        code: "FP-8846",
        client: synthetixClient,
        projectTitle: "Realtime Sync Infrastructure",
        status: "paid",
        issueDate: new Date(Date.now() - 22 * 86400000),
        dueDate: new Date(Date.now() - 8 * 86400000),
        paidAt: new Date(Date.now() - 7 * 86400000),
        poReference: "PO-DEMO-SYN-44",
        paymentChannel: "PayPal Direct (Sandbox)",
        subtotal: new Prisma.Decimal(5500.0),
        total: new Prisma.Decimal(5500.0),
        viewCount: 2,
        aiRiskScore: "Low",
        aiTelemetryNote: "[SIMULATED TELEMETRY] Settled via PayPal Sandbox Direct. Net proceeds verified with zero currency slippage.",
        notes: `${DEMO_SYNTHETIC_MARKER} Synthetic demonstration invoice with sandbox payment rails.`,
        paypalCaptureId: "CAP-DEMO-SANDBOX-8846",
        lineItems: [
          { description: "Realtime WebSocket Relay Engine", quantity: 1, rate: 5500.0, amount: 5500.0 },
        ],
      },
      {
        code: "FP-8845",
        client: luminaClient,
        projectTitle: "Visual Analytics Portal",
        status: "sent",
        issueDate: new Date(Date.now() - 2 * 86400000),
        dueDate: new Date(Date.now() + 12 * 86400000),
        poReference: "PO-DEMO-LUM-108",
        paymentChannel: "PayPal Direct (Sandbox)",
        subtotal: new Prisma.Decimal(3200.0),
        total: new Prisma.Decimal(3200.0),
        viewCount: 1,
        aiRiskScore: "Low",
        aiTelemetryNote: "[SIMULATED TELEMETRY] Dispatched via verified sandbox rail. Optimal AP window opens in 3 days.",
        notes: `${DEMO_SYNTHETIC_MARKER} Synthetic demonstration invoice with sandbox payment rails.`,
        lineItems: [
          { description: "Genomic Heatmap WebGL Visualizer", quantity: 1, rate: 3200.0, amount: 3200.0 },
        ],
      },
    ];

    const seededInvoices = [];
    for (const spec of invoiceSpecs) {
      const inv = await tx.invoice.upsert({
        where: { userId_code: { userId, code: spec.code } },
        update: {
          clientId: spec.client.id,
          clientName: spec.client.name,
          clientEmail: spec.client.contactEmail,
          projectTitle: spec.projectTitle,
          status: spec.status,
          issueDate: spec.issueDate,
          dueDate: spec.dueDate,
          paidAt: spec.paidAt,
          poReference: spec.poReference,
          paymentChannel: spec.paymentChannel,
          subtotal: spec.subtotal,
          total: spec.total,
          viewCount: spec.viewCount,
          aiRiskScore: spec.aiRiskScore,
          aiTelemetryNote: spec.aiTelemetryNote,
          notes: spec.notes,
          paypalCaptureId: spec.paypalCaptureId,
        },
        create: {
          userId,
          clientId: spec.client.id,
          code: spec.code,
          clientName: spec.client.name,
          clientEmail: spec.client.contactEmail,
          projectTitle: spec.projectTitle,
          status: spec.status,
          issueDate: spec.issueDate,
          dueDate: spec.dueDate,
          paidAt: spec.paidAt,
          poReference: spec.poReference,
          paymentChannel: spec.paymentChannel,
          currency: "USD",
          currencySymbol: "$",
          subtotal: spec.subtotal,
          total: spec.total,
          viewCount: spec.viewCount,
          aiRiskScore: spec.aiRiskScore,
          aiTelemetryNote: spec.aiTelemetryNote,
          notes: spec.notes,
          paypalCaptureId: spec.paypalCaptureId,
        },
      });

      // Clear existing line items and recreate
      await tx.invoiceLineItem.deleteMany({ where: { invoiceId: inv.id } });
      for (const li of spec.lineItems) {
        await tx.invoiceLineItem.create({
          data: {
            invoiceId: inv.id,
            description: li.description,
            quantity: new Prisma.Decimal(li.quantity),
            rate: new Prisma.Decimal(li.rate),
            amount: new Prisma.Decimal(li.amount),
          },
        });
      }
      seededInvoices.push(inv);
    }

    const invOverdue = seededInvoices.find((i) => i.code === "FP-8848")!;
    const invPaid1 = seededInvoices.find((i) => i.code === "FP-8847")!;
    const invPaid2 = seededInvoices.find((i) => i.code === "FP-8846")!;

    // 4. Seed Payment Reminder for Overdue Invoice
    // Never sends real emails or external API requests; initialized safely in pending_approval state
    await tx.paymentReminder.upsert({
      where: { userId_code: { userId, code: "REM-8848" } },
      update: {
        invoiceId: invOverdue.id,
        clientName: invOverdue.clientName,
        clientEmail: invOverdue.clientEmail,
        amount: invOverdue.total,
        dueDate: invOverdue.dueDate,
        overdueDays: 14,
        recommendedTone: "firm",
        activeTone: "firm",
        status: "pending_approval",
        subject: `[DEMO] Payment Reminder: Invoice #${invOverdue.code} - 14 Days Overdue ($1,500.00)`,
        messageBody: `${DEMO_SYNTHETIC_MARKER} Dear Sarah Jenkins,\n\nOur institutional accounts ledger indicates Invoice #${invOverdue.code} for $1,500.00 is currently 14 days overdue. Please remit settlement via the verified PayPal sandbox link below to avoid formal service interruption.\n\nThank you,\nAlex Vance`,
        paymentLink: `https://freelancepay.ai/pay/${invOverdue.code}`,
        simulatedSentAt: null,
        realSentAt: null,
      },
      create: {
        userId,
        code: "REM-8848",
        invoiceId: invOverdue.id,
        clientName: invOverdue.clientName,
        clientEmail: invOverdue.clientEmail,
        amount: invOverdue.total,
        currency: "USD",
        dueDate: invOverdue.dueDate,
        overdueDays: 14,
        recommendedTone: "firm",
        activeTone: "firm",
        status: "pending_approval",
        subject: `[DEMO] Payment Reminder: Invoice #${invOverdue.code} - 14 Days Overdue ($1,500.00)`,
        messageBody: `${DEMO_SYNTHETIC_MARKER} Dear Sarah Jenkins,\n\nOur institutional accounts ledger indicates Invoice #${invOverdue.code} for $1,500.00 is currently 14 days overdue. Please remit settlement via the verified PayPal sandbox link below to avoid formal service interruption.\n\nThank you,\nAlex Vance`,
        paymentLink: `https://freelancepay.ai/pay/${invOverdue.code}`,
        simulatedSentAt: null,
        realSentAt: null,
      },
    });

    // 5. Seed Settled Ledger Transactions (Explicitly identified as synthetic demo sandbox entries)
    const txSpecs = [
      {
        code: "TX-9901",
        hash: "0xDEMO-7a29e41b88e1",
        description: "[SIMULATED] Settlement for Invoice #FP-8847 (AI Telemetry Dashboard)",
        clientName: "Venture Dynamics",
        type: "client_settlement",
        status: "settled",
        grossAmount: new Prisma.Decimal(4200.0),
        feeAmount: new Prisma.Decimal(127.0),
        fxCost: new Prisma.Decimal(0.0),
        netAmount: new Prisma.Decimal(4073.0),
        taxReserveSplitAmount: new Prisma.Decimal(840.0),
        paymentChannel: "SWIFT Wire (Simulated)",
        linkedInvoiceId: invPaid1.id,
        notes: `${DEMO_SYNTHETIC_MARKER} Simulated sandbox settlement ledger entry. No actual monetary clearing.`,
        idempotencyKey: `${DEMO_TRANSACTION_PREFIX}9901-${userId}`,
        paypalOrderId: "ORD-DEMO-SANDBOX-9901",
        paypalCaptureId: "CAP-DEMO-SANDBOX-8847",
      },
      {
        code: "TX-9902",
        hash: "0xDEMO-4b81c903ff12",
        description: "[SIMULATED] Settlement for Invoice #FP-8846 (Realtime Sync Infrastructure)",
        clientName: "Synthetix Labs LLC",
        type: "client_settlement",
        status: "settled",
        grossAmount: new Prisma.Decimal(5500.0),
        feeAmount: new Prisma.Decimal(165.0),
        fxCost: new Prisma.Decimal(0.0),
        netAmount: new Prisma.Decimal(5335.0),
        taxReserveSplitAmount: new Prisma.Decimal(1100.0),
        paymentChannel: "PayPal Direct (Sandbox)",
        linkedInvoiceId: invPaid2.id,
        notes: `${DEMO_SYNTHETIC_MARKER} Simulated sandbox settlement ledger entry. No actual monetary clearing.`,
        idempotencyKey: `${DEMO_TRANSACTION_PREFIX}9902-${userId}`,
        paypalOrderId: "ORD-DEMO-SANDBOX-9902",
        paypalCaptureId: "CAP-DEMO-SANDBOX-8846",
      },
      {
        code: "TX-9903",
        hash: "0xDEMO-3f19a08e92bc",
        description: "[SIMULATED] Milestone Deliverable Authorized: Token Architecture",
        clientName: "Acme Corp",
        type: "milestone_authorization",
        status: "settled",
        grossAmount: new Prisma.Decimal(3500.0),
        feeAmount: new Prisma.Decimal(105.0),
        fxCost: new Prisma.Decimal(0.0),
        netAmount: new Prisma.Decimal(3395.0),
        taxReserveSplitAmount: new Prisma.Decimal(700.0),
        paymentChannel: "PayPal Direct (Sandbox)",
        linkedMilestoneId: m1.id,
        notes: `${DEMO_SYNTHETIC_MARKER} Simulated sandbox authorization ledger entry. No actual monetary clearing.`,
        idempotencyKey: `${DEMO_TRANSACTION_PREFIX}9903-${userId}`,
        paypalOrderId: "ORD-DEMO-SANDBOX-9903",
      },
    ];

    for (const ts of txSpecs) {
      await tx.transaction.upsert({
        where: { idempotencyKey: ts.idempotencyKey },
        update: { ...ts },
        create: { userId, ...ts },
      });
    }

    // 6. Seed Operational Outflows (Expenses with persistent DEMO_SYNTHETIC_MARKER)
    const expenseSpecs = [
      {
        merchant: "AWS Elastic Compute",
        description: `us-east-1 Cluster Compute & Edge CDN ${DEMO_SYNTHETIC_MARKER}`,
        category: "Operations",
        date: new Date(Date.now() - 5 * 86400000),
        method: "Stripe Card (*8821)",
        isRecurring: true,
        amount: new Prisma.Decimal(320.5),
      },
      {
        merchant: "Figma Enterprise",
        description: `Annual Design System Token Seat ${DEMO_SYNTHETIC_MARKER}`,
        category: "Software",
        date: new Date(Date.now() - 10 * 86400000),
        method: "PayPal Business (*1902)",
        isRecurring: true,
        amount: new Prisma.Decimal(145.0),
      },
      {
        merchant: "Google Gemini API",
        description: `Model Inference & Financial Insights Parsing ${DEMO_SYNTHETIC_MARKER}`,
        category: "Software",
        date: new Date(Date.now() - 12 * 86400000),
        method: "Stripe Card (*8821)",
        isRecurring: false,
        amount: new Prisma.Decimal(85.0),
      },
      {
        merchant: "GitHub Enterprise",
        description: `CI/CD Runners & Private Packages ${DEMO_SYNTHETIC_MARKER}`,
        category: "Operations",
        date: new Date(Date.now() - 18 * 86400000),
        method: "Stripe Card (*8821)",
        isRecurring: true,
        amount: new Prisma.Decimal(42.0),
      },
      {
        merchant: "Apple Store SOHO",
        description: `M3 Max Developer Rig (Section 179 Depreciation) ${DEMO_SYNTHETIC_MARKER}`,
        category: "Hardware",
        date: new Date(Date.now() - 25 * 86400000),
        method: "Direct ACH Wire",
        isRecurring: false,
        amount: new Prisma.Decimal(280.0),
      },
    ];

    for (const exp of expenseSpecs) {
      await tx.expense.create({
        data: {
          userId,
          merchant: exp.merchant,
          description: exp.description,
          category: exp.category,
          date: exp.date,
          method: exp.method,
          isRecurring: exp.isRecurring,
          amount: exp.amount,
          currency: "USD",
        },
      });
    }

    // 7. Seed SaaS Subscriptions (Tagged with DEMO_SYNTHETIC_MARKER in subTitle)
    const subSpecs = [
      {
        name: "Figma Organization",
        subTitle: `Full Design Suite + FigJam Tokens ${DEMO_SYNTHETIC_MARKER}`,
        category: "Design",
        costMonthly: new Prisma.Decimal(75.0),
        lastActive: "Today",
        usageScore: 92,
        usageStatus: "High",
        recommendation: "Keep Active",
        initials: "FG",
      },
      {
        name: "Google Workspace Enterprise",
        subTitle: `Business Plus Domain & Security Vault ${DEMO_SYNTHETIC_MARKER}`,
        category: "Productivity",
        costMonthly: new Prisma.Decimal(36.0),
        lastActive: "Today",
        usageScore: 95,
        usageStatus: "High",
        recommendation: "Keep Active",
        initials: "GW",
      },
      {
        name: "ChatGPT Plus & Team",
        subTitle: `Model Reasoning Cluster ${DEMO_SYNTHETIC_MARKER}`,
        category: "AI",
        costMonthly: new Prisma.Decimal(20.0),
        lastActive: "Yesterday",
        usageScore: 88,
        usageStatus: "High",
        recommendation: "Keep Active",
        initials: "AI",
      },
      {
        name: "Linear Team",
        subTitle: `Engineering Cycles & Roadmaps ${DEMO_SYNTHETIC_MARKER}`,
        category: "Productivity",
        costMonthly: new Prisma.Decimal(40.0),
        lastActive: "2 days ago",
        usageScore: 82,
        usageStatus: "High",
        recommendation: "Keep Active",
        initials: "LN",
      },
      {
        name: "Webflow Agency Workspace",
        subTitle: `Legacy Site Hosting (2 Seats Dormant) ${DEMO_SYNTHETIC_MARKER}`,
        category: "Productivity",
        costMonthly: new Prisma.Decimal(60.0),
        lastActive: "45 days ago",
        usageScore: 12,
        usageStatus: "Dormant",
        recommendation: "Suggest Downgrade",
        initials: "WF",
      },
    ];

    for (const sub of subSpecs) {
      await tx.subscription.create({
        data: {
          userId,
          name: sub.name,
          subTitle: sub.subTitle,
          category: sub.category,
          costMonthly: sub.costMonthly,
          lastActive: sub.lastActive,
          usageScore: sub.usageScore,
          usageStatus: sub.usageStatus,
          recommendation: sub.recommendation,
          dueCategory: "30d",
          initials: sub.initials,
        },
      });
    }

    // 8. Seed Tax Estimate & Financial Settings
    await tx.taxEstimate.create({
      data: {
        userId,
        jurisdiction: "US-CA",
        entityType: "LLC",
        taxRatio: new Prisma.Decimal(25.0),
        grossInflows: new Prisma.Decimal(128450.0),
        deductibleOffset: new Prisma.Decimal(14500.0),
        taxableBase: new Prisma.Decimal(113950.0),
        suggestedReserve: new Prisma.Decimal(28487.5),
        vaultSetAside: new Prisma.Decimal(28500.0),
        quarter: DEMO_TAX_QUARTER,
      },
    });

    await tx.financialSettings.upsert({
      where: { userId },
      update: {
        baseCurrency: "USD",
        defaultTerms: "Net-14",
        taxRoutingEnabled: true,
        lateFeeEnabled: true,
        recoveryThreshold: new Prisma.Decimal(6.0),
        paypalMerchantConnected: true,
        stripeConnected: true,
        autonomousShieldActive: true,
      },
      create: {
        userId,
        baseCurrency: "USD",
        defaultTerms: "Net-14",
        taxRoutingEnabled: true,
        lateFeeEnabled: true,
        recoveryThreshold: new Prisma.Decimal(6.0),
        paypalMerchantConnected: true,
        stripeConnected: true,
        autonomousShieldActive: true,
      },
    });

    return {
      success: true,
      message: isReset
        ? "Demo portfolio reset and re-seeded cleanly in Neon DB (genuine user records preserved)."
        : "Realistic demo portfolio successfully seeded into Neon DB.",
      counts: {
        clients: seededClients.length,
        invoices: seededInvoices.length,
        milestoneProjects: 1,
        milestones: 3,
        transactions: txSpecs.length,
        expenses: expenseSpecs.length,
        subscriptions: subSpecs.length,
        reminders: 1,
      },
    };
  },
  { timeout: 30000, maxWait: 15000 }
  );
}
