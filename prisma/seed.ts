import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// CRITICAL PRODUCTION GUARD
if (process.env.NODE_ENV === "production") {
  console.warn("⚠️ Refusing to seed in production environment. Aborting.");
  process.exit(0);
}

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/freelancepay_db?schema=public";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting safe development database seed...");

  // 1. Seed Alex Vance User
  const devPasswordHash = await bcrypt.hash("DevPassword123!", 12);
  const user = await prisma.user.upsert({
    where: { email: "alex.vance@studio.ai" },
    update: {
      name: "Alex Vance",
      badge: "PRO VIP",
      role: "freelancer",
    },
    create: {
      email: "alex.vance@studio.ai",
      passwordHash: devPasswordHash,
      name: "Alex Vance",
      badge: "PRO VIP",
      role: "freelancer",
      profile: {
        create: {
          title: "Design Technologist & Consultant",
          businessName: "Vance Design Engineering LLC",
          country: "US",
          currency: "USD",
          taxId: "XX-XXX8921",
          billingAddress: "500 Howard Street, Suite 1200, San Francisco, CA 94105",
        },
      },
      financialSettings: {
        create: {
          baseCurrency: "USD",
          defaultTerms: "Net-14",
          taxRoutingEnabled: true,
          lateFeeEnabled: true,
          recoveryThreshold: new Prisma.Decimal(6.0),
          paypalMerchantConnected: true,
          stripeConnected: true,
          autonomousShieldActive: true,
        },
      },
    },
  });

  console.log(`✓ Seeded User: ${user.email} (${user.id})`);

  // 2. Seed Clients
  const clientsData = [
    {
      code: "ACM-8021",
      name: "Acme Corp",
      location: "San Francisco, CA",
      industry: "B2B SaaS & Growth",
      contactName: "Sarah Jenkins",
      contactRole: "VP Brand & Creative",
      contactEmail: "billing@acmecorp.com",
      riskTier: "High Friction",
      reliabilityScore: 54,
      lifetimeRevenue: new Prisma.Decimal(12500.0),
      outstandingBalance: new Prisma.Decimal(1500.0),
      avgSettlementLag: "+18.2 Days",
      disputeHistory: "0 Formal Disputes (2 payment plan escalations)",
      preferredRails: "PayPal Business Direct (Net-14)",
      notes: "Accounts payable systematically defers payouts until firm reminder wave is authorized.",
      playbookWhatWorks: "Structured installment splits and formal notices with specific contractual milestones.",
      playbookWhatFails: "Unscheduled informal Slack pings and vague follow-ups without invoice attachments.",
    },
    {
      code: "HRZ-9041",
      name: "Horizon Studio",
      location: "New York, NY",
      industry: "Design System Architecture",
      contactName: "Alex Rivers",
      contactRole: "Design Director",
      contactEmail: "billing@horizon.design",
      riskTier: "Platinum",
      reliabilityScore: 96,
      lifetimeRevenue: new Prisma.Decimal(34000.0),
      outstandingBalance: new Prisma.Decimal(8500.0),
      avgSettlementLag: "-2.4 Days (Early)",
      disputeHistory: "0 Disputes (100% on-time release)",
      preferredRails: "Stripe Connect Direct",
      notes: "Top-tier creative client. Immediate milestone authorizations.",
      playbookWhatWorks: "Figma token sync deliverable reviews.",
      playbookWhatFails: "Scope changes without written addendum.",
    },
    {
      code: "VNT-8812",
      name: "Venture Dynamics",
      location: "New York, NY",
      industry: "Fintech & Venture Capital",
      contactName: "Marcus Sterling",
      contactRole: "Managing Director",
      contactEmail: "ap@venturedynamics.vc",
      riskTier: "Platinum",
      reliabilityScore: 98,
      lifetimeRevenue: new Prisma.Decimal(42000.0),
      outstandingBalance: new Prisma.Decimal(0.0),
      avgSettlementLag: "+1.2 Days",
      disputeHistory: "0 Disputes",
      preferredRails: "SWIFT Wire",
      notes: "Institutional investment platform requiring SWIFT transfer clearing.",
      playbookWhatWorks: "Direct wire instructions with SWIFT IBAN pre-validation.",
      playbookWhatFails: "Credit card invoices above $10k.",
    },
  ];

  const clientMap = new Map<string, string>();
  for (const c of clientsData) {
    const client = await prisma.client.upsert({
      where: {
        userId_code: {
          userId: user.id,
          code: c.code,
        },
      },
      update: c,
      create: {
        ...c,
        userId: user.id,
      },
    });
    clientMap.set(c.code, client.id);
  }
  console.log(`✓ Seeded ${clientsData.length} Clients`);

  // 3. Seed Projects & Milestones
  const hrzClientId = clientMap.get("HRZ-9041")!;
  const project = await prisma.project.upsert({
    where: {
      userId_code: {
        userId: user.id,
        code: "PRJ-9041",
      },
    },
    update: {
      title: "Design System Sprint II & React Migration",
      totalAmount: new Prisma.Decimal(12500.0),
    },
    create: {
      userId: user.id,
      clientId: hrzClientId,
      code: "PRJ-9041",
      escrowId: "#HZ-9041",
      title: "Design System Sprint II & React Migration",
      description: "Complete design token architecture, Figma library overhaul, and React token migration.",
      totalAmount: new Prisma.Decimal(12500.0),
      currency: "USD",
      currencySymbol: "$",
      status: "active",
      milestones: {
        create: [
          {
            code: "MS-101",
            title: "Core Tokens Architecture & Figma Library Overhaul",
            description: "Tokens v2 specification, color primitives, spacing scales, and typography styles.",
            amount: new Prisma.Decimal(5000.0),
            dueDate: new Date("2025-10-14"),
            status: "captured",
            authorizedAt: new Date("2025-10-10"),
            capturedAt: new Date("2025-10-14"),
          },
          {
            code: "MS-102",
            title: "Component Library React Migration (30 Components)",
            description: "Accessible Radix-based atomic primitives styled with Tailwind and Design Tokens.",
            amount: new Prisma.Decimal(4500.0),
            dueDate: new Date("2025-10-28"),
            status: "authorized",
            authorizedAt: new Date("2025-10-20"),
          },
          {
            code: "MS-103",
            title: "Documentation, Storybook Setup & Final QA Sign-off",
            description: "Interactive Storybook documentation, Chromatic visual regression test setup, handover.",
            amount: new Prisma.Decimal(3000.0),
            dueDate: new Date("2025-11-10"),
            status: "pending",
          },
        ],
      },
    },
  });
  console.log(`✓ Seeded Project: ${project.title}`);

  // 4. Seed Invoices & Line Items
  const invoiceData = [
    {
      code: "FP-8849",
      clientCode: "HRZ-9041",
      clientName: "Horizon Studio",
      clientEmail: "billing@horizon.design",
      clientAddress: "San Francisco, CA",
      projectTitle: "Design System Sprint II",
      issueDate: new Date("2025-10-10"),
      dueDate: new Date("2025-10-24"),
      poReference: "HRZ-2025-442",
      status: "viewed",
      paymentChannel: "Stripe Connect",
      subtotal: new Prisma.Decimal(8500.0),
      taxRatePercent: new Prisma.Decimal(0.0),
      taxAmount: new Prisma.Decimal(0.0),
      total: new Prisma.Decimal(8500.0),
      aiRiskScore: "Low",
      aiTelemetryNote: "High settlement probability within 48h. Client viewed invoice 4 minutes ago.",
      viewCount: 3,
      notes: "Payment due within 14 days of issue via connected automated Stripe rail.",
      lineItems: [
        { description: "Design System Architecture & Tokens", quantity: new Prisma.Decimal(1), rate: new Prisma.Decimal(5500.0), amount: new Prisma.Decimal(5500.0) },
        { description: "Component Library React Migration", quantity: new Prisma.Decimal(30), rate: new Prisma.Decimal(100.0), amount: new Prisma.Decimal(3000.0) },
      ],
    },
    {
      code: "FP-8848",
      clientCode: "ACM-8021",
      clientName: "Acme Corp",
      clientEmail: "billing@acmecorp.com",
      clientAddress: "100 Innovation Way, Suite 400, Chicago, IL",
      projectTitle: "Brand Architecture Q2 Retainer & Vector Identity",
      issueDate: new Date("2025-10-02"),
      dueDate: new Date("2025-10-16"),
      poReference: "ACM-2025-098",
      status: "overdue",
      paymentChannel: "PayPal Direct",
      subtotal: new Prisma.Decimal(1500.0),
      taxRatePercent: new Prisma.Decimal(0.0),
      taxAmount: new Prisma.Decimal(0.0),
      total: new Prisma.Decimal(1500.0),
      aiRiskScore: "High",
      aiTelemetryNote: "AP viewing detected 4 times; firm notice recommended to release stalled sign-off.",
      viewCount: 4,
      notes: "Overdue by 14 days. Escalation Tier 2 firm notice prepared for dispatch.",
      lineItems: [
        { description: "Brand Architecture Audit & Strategy", quantity: new Prisma.Decimal(1), rate: new Prisma.Decimal(1000.0), amount: new Prisma.Decimal(1000.0) },
        { description: "Vector Identity Package & Typography", quantity: new Prisma.Decimal(5), rate: new Prisma.Decimal(100.0), amount: new Prisma.Decimal(500.0) },
      ],
    },
  ];

  for (const inv of invoiceData) {
    const clientId = clientMap.get(inv.clientCode);
    const { lineItems, clientCode, ...invoiceFields } = inv;
    await prisma.invoice.upsert({
      where: {
        userId_code: {
          userId: user.id,
          code: inv.code,
        },
      },
      update: {
        ...invoiceFields,
        clientId,
      },
      create: {
        ...invoiceFields,
        userId: user.id,
        clientId,
        lineItems: {
          create: lineItems,
        },
      },
    });
  }
  console.log(`✓ Seeded ${invoiceData.length} Invoices`);

  // 5. Seed Transactions
  const txData = [
    {
      code: "TXN-90214",
      hash: "0x8f2a71d8b49e",
      timestamp: new Date("2025-10-24T14:32:00Z"),
      description: "Invoice FP-8847 Settlement & Autonomous Tax Split",
      clientName: "Venture Dynamics",
      type: "client_settlement",
      status: "settled",
      grossAmount: new Prisma.Decimal(4200.0),
      feeAmount: new Prisma.Decimal(84.0),
      fxCost: new Prisma.Decimal(0.0),
      netAmount: new Prisma.Decimal(4116.0),
      taxReserveSplitAmount: new Prisma.Decimal(840.0),
      paymentChannel: "SWIFT Wire",
      notes: "Settled via international SWIFT clearing. 20% routed to Tax Shield.",
    },
    {
      code: "TXN-90213",
      hash: "0x3b1c92a7e4d1",
      timestamp: new Date("2025-10-20T09:15:00Z"),
      description: "Milestone MS-101 Escrow Release Authorization",
      clientName: "Horizon Studio",
      type: "escrow_capture",
      status: "settled",
      grossAmount: new Prisma.Decimal(5000.0),
      feeAmount: new Prisma.Decimal(145.0),
      fxCost: new Prisma.Decimal(0.0),
      netAmount: new Prisma.Decimal(4855.0),
      taxReserveSplitAmount: new Prisma.Decimal(1000.0),
      paymentChannel: "Stripe Connect",
      notes: "Design token release authorized and captured.",
    },
  ];

  for (const tx of txData) {
    await prisma.transaction.upsert({
      where: { idempotencyKey: tx.code },
      update: tx,
      create: {
        ...tx,
        userId: user.id,
        idempotencyKey: tx.code,
      },
    });
  }
  console.log(`✓ Seeded ${txData.length} Transactions`);

  // 6. Seed Expenses
  const expenseData = [
    {
      merchant: "AWS Compute",
      description: "us-east-1 Elastic Grid Clusters",
      category: "Operations",
      date: new Date("2025-04-14"),
      method: "Stripe Card (*8821)",
      isRecurring: true,
      amount: new Prisma.Decimal(320.5),
    },
    {
      merchant: "Figma Enterprise",
      description: "Annual Seat Licensing (Design Systems)",
      category: "Software",
      date: new Date("2025-04-10"),
      method: "PayPal Business (*1902)",
      isRecurring: true,
      amount: new Prisma.Decimal(145.0),
    },
  ];

  for (const exp of expenseData) {
    await prisma.expense.create({
      data: {
        ...exp,
        userId: user.id,
      },
    });
  }
  console.log(`✓ Seeded ${expenseData.length} Expenses`);

  // 7. Seed Subscriptions
  const subsData = [
    {
      name: "Adobe Creative Cloud",
      subTitle: "Master All Apps • Solo Plan",
      category: "Design",
      costMonthly: new Prisma.Decimal(89.99),
      lastActive: "42 days ago",
      usageScore: 25,
      usageStatus: "Stagnant",
      recommendation: "Suggest Downgrade",
      dueCategory: "7d",
      initials: "Ad",
    },
    {
      name: "Webflow Workspace",
      subTitle: "Agency Core (3 Seats)",
      category: "Productivity",
      costMonthly: new Prisma.Decimal(60.0),
      lastActive: "91 days ago",
      usageScore: 8,
      usageStatus: "Dormant",
      recommendation: "Cancel / Prune",
      dueCategory: "14d",
      initials: "Wf",
    },
  ];

  for (const sub of subsData) {
    await prisma.subscription.create({
      data: {
        ...sub,
        userId: user.id,
      },
    });
  }
  console.log(`✓ Seeded ${subsData.length} Subscriptions`);

  // 8. Seed Audit Log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "database_seed_completed",
      entityType: "System",
      actor: "system_seed",
      details: JSON.stringify({ environment: "development", initialized: true }),
    },
  });

  console.log("✅ Safe development seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
