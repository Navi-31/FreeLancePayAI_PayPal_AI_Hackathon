import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { recordAuditLog } from "@/services/auditService";

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { invoices, clients, transactions } = body;
    const userId = session.userId;

    let importedClients = 0;
    let importedInvoices = 0;
    let importedTransactions = 0;

    await prisma.$transaction(async (tx) => {
      // 1. Import clients
      if (Array.isArray(clients)) {
        for (const c of clients) {
          if (!c.name) continue;
          const code = c.id || `CLI-${Math.floor(1000 + Math.random() * 9000)}`;
          await tx.client.upsert({
            where: { userId_code: { userId, code } },
            update: {
              name: c.name,
              location: c.location || "San Francisco, CA",
              industry: c.industry || "General",
              contactName: c.contactName || c.name,
              contactRole: c.contactRole || "Contact",
              contactEmail: c.contactEmail || "billing@client.com",
            },
            create: {
              userId,
              code,
              name: c.name,
              location: c.location || "San Francisco, CA",
              industry: c.industry || "General",
              contactName: c.contactName || c.name,
              contactRole: c.contactRole || "Contact",
              contactEmail: c.contactEmail || "billing@client.com",
            },
          });
          importedClients++;
        }
      }

      // 2. Import invoices
      if (Array.isArray(invoices)) {
        for (const inv of invoices) {
          if (!inv.id || !inv.clientName) continue;
          await tx.invoice.upsert({
            where: { userId_code: { userId, code: inv.id } },
            update: {
              clientName: inv.clientName,
              clientEmail: inv.clientEmail || "billing@client.com",
              projectTitle: inv.projectTitle || "Service",
              status: inv.status || "draft",
              total: new Prisma.Decimal(inv.total || 0),
            },
            create: {
              userId,
              code: inv.id,
              clientName: inv.clientName,
              clientEmail: inv.clientEmail || "billing@client.com",
              projectTitle: inv.projectTitle || "Service",
              status: inv.status || "draft",
              issueDate: inv.issueDate ? new Date(inv.issueDate) : new Date(),
              dueDate: inv.dueDate ? new Date(inv.dueDate) : new Date(),
              subtotal: new Prisma.Decimal(inv.subtotal || inv.total || 0),
              total: new Prisma.Decimal(inv.total || 0),
            },
          });
          importedInvoices++;
        }
      }

      // 3. Import transactions
      if (Array.isArray(transactions)) {
        for (const t of transactions) {
          if (!t.id) continue;
          await tx.transaction.upsert({
            where: { idempotencyKey: t.id },
            update: {
              description: t.description || "Transaction",
              status: t.status || "settled",
            },
            create: {
              userId,
              code: t.id,
              hash: t.hash || `0x${Math.random().toString(16).substring(2, 10)}`,
              description: t.description || "Imported Transaction",
              clientName: t.clientName || "Client",
              type: t.type || "client_settlement",
              status: t.status || "settled",
              grossAmount: new Prisma.Decimal(t.grossAmount || 0),
              feeAmount: new Prisma.Decimal(t.feeAmount || 0),
              netAmount: new Prisma.Decimal(t.netAmount || 0),
              taxReserveSplitAmount: new Prisma.Decimal(t.taxReserveSplitAmount || 0),
              paymentChannel: t.paymentChannel || "Stripe Connect",
              idempotencyKey: t.id,
            },
          });
          importedTransactions++;
        }
      }
    });

    await recordAuditLog({
      userId,
      action: "offline_data_imported",
      entityType: "System",
      details: { importedClients, importedInvoices, importedTransactions },
    });

    return NextResponse.json({
      success: true,
      importedClients,
      importedInvoices,
      importedTransactions,
    });
  } catch (error) {
    console.error("Data migration import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import local data" },
      { status: 500 }
    );
  }
}
