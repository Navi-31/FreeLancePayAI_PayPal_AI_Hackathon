import { prisma } from "@/backend/db/db";
import { recordAuditLog } from "@/backend/services/auditService";

export interface MigrationSummary {
  success: boolean;
  alreadyMigrated?: boolean;
  counts: {
    clients: number;
    projects: number;
    milestones: number;
    invoices: number;
    lineItems: number;
    transactions: number;
    expenses: number;
    subscriptions: number;
    taxEstimates: number;
  };
  error?: string;
}

/**
 * Idempotently clones the sample/historical dataset from a source user (e.g. Alex Vance)
 * to a target user (e.g. Navaneethan), mapping all relational foreign keys properly.
 * Does NOT copy passwords, credentials, tokens, or sessions.
 * Preserves the original source dataset untouched.
 */
export async function mirrorUserDataset(
  sourceEmail: string = "alex.vance@studio.ai",
  targetUserId: string
): Promise<MigrationSummary> {
  const initialCounts = {
    clients: 0,
    projects: 0,
    milestones: 0,
    invoices: 0,
    lineItems: 0,
    transactions: 0,
    expenses: 0,
    subscriptions: 0,
    taxEstimates: 0,
  };

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        clients: true,
        invoices: true,
        projects: true,
      },
    });

    if (!targetUser) {
      return {
        success: false,
        counts: initialCounts,
        error: "Target user not found",
      };
    }

    // Idempotency check: If the target user already has clients or invoices, skip duplication
    if (targetUser.clients.length > 0 || targetUser.invoices.length > 0) {
      return {
        success: true,
        alreadyMigrated: true,
        counts: {
          ...initialCounts,
          clients: targetUser.clients.length,
          invoices: targetUser.invoices.length,
          projects: targetUser.projects.length,
        },
      };
    }

    // Retrieve source user records
    const sourceUser = await prisma.user.findUnique({
      where: { email: sourceEmail.toLowerCase() },
      include: {
        clients: {
          include: { paymentHistories: true },
        },
        projects: {
          include: { milestones: true },
        },
        invoices: {
          include: { lineItems: true },
        },
        transactions: true,
        expenses: true,
        subscriptions: true,
        taxEstimates: true,
        financialSettings: true,
      },
    });

    if (!sourceUser) {
      return {
        success: false,
        counts: initialCounts,
        error: `Source user "${sourceEmail}" not found for dataset cloning.`,
      };
    }

    // Execute atomic transactional clone
    const resultCounts = await prisma.$transaction(async (tx) => {
      const counts = { ...initialCounts };
      const clientIdMap = new Map<string, string>();
      const projectIdMap = new Map<string, string>();
      const milestoneIdMap = new Map<string, string>();
      const invoiceIdMap = new Map<string, string>();

      // 1. Clone Clients
      for (const client of sourceUser.clients) {
        const newClient = await tx.client.create({
          data: {
            userId: targetUserId,
            code: client.code,
            name: client.name,
            location: client.location,
            industry: client.industry,
            contactName: client.contactName,
            contactRole: client.contactRole,
            contactEmail: client.contactEmail,
            riskTier: client.riskTier,
            reliabilityScore: client.reliabilityScore,
            lifetimeRevenue: client.lifetimeRevenue,
            outstandingBalance: client.outstandingBalance,
            avgSettlementLag: client.avgSettlementLag,
            disputeHistory: client.disputeHistory,
            preferredRails: client.preferredRails,
            notes: client.notes,
            playbookWhatWorks: client.playbookWhatWorks,
            playbookWhatFails: client.playbookWhatFails,
          },
        });
        clientIdMap.set(client.id, newClient.id);
        counts.clients++;

        // Clone payment history records
        for (const history of client.paymentHistories) {
          await tx.clientPaymentHistory.create({
            data: {
              clientId: newClient.id,
              amount: history.amount,
              currency: history.currency,
              paymentChannel: history.paymentChannel,
              status: history.status,
              settledAt: history.settledAt,
              lagDays: history.lagDays,
            },
          });
        }
      }

      // 2. Clone Projects & Milestones
      for (const project of sourceUser.projects) {
        const mappedClientId = clientIdMap.get(project.clientId);
        if (!mappedClientId) continue;

        const newProject = await tx.project.create({
          data: {
            userId: targetUserId,
            clientId: mappedClientId,
            code: project.code,
            escrowId: project.escrowId,
            title: project.title,
            description: project.description,
            totalAmount: project.totalAmount,
            currency: project.currency,
            currencySymbol: project.currencySymbol,
            status: project.status,
          },
        });
        projectIdMap.set(project.id, newProject.id);
        counts.projects++;

        for (const milestone of project.milestones) {
          const newMilestone = await tx.milestone.create({
            data: {
              code: milestone.code,
              projectId: newProject.id,
              title: milestone.title,
              description: milestone.description,
              amount: milestone.amount,
              dueDate: milestone.dueDate,
              status: milestone.status,
              deliverableNotes: milestone.deliverableNotes,
              authorizedAt: milestone.authorizedAt,
              capturedAt: milestone.capturedAt,
              refundedAt: milestone.refundedAt,
              paypalOrderId: milestone.paypalOrderId,
              paypalAuthorizationId: milestone.paypalAuthorizationId,
              paypalCaptureId: milestone.paypalCaptureId,
            },
          });
          milestoneIdMap.set(milestone.id, newMilestone.id);
          counts.milestones++;
        }
      }

      // 3. Clone Invoices & Line Items
      for (const invoice of sourceUser.invoices) {
        const mappedClientId = invoice.clientId ? clientIdMap.get(invoice.clientId) : null;

        const newInvoice = await tx.invoice.create({
          data: {
            code: invoice.code,
            userId: targetUserId,
            clientId: mappedClientId || null,
            clientName: invoice.clientName,
            clientEmail: invoice.clientEmail,
            clientAddress: invoice.clientAddress,
            projectTitle: invoice.projectTitle,
            issueDate: invoice.issueDate,
            dueDate: invoice.dueDate,
            poReference: invoice.poReference,
            status: invoice.status,
            paymentChannel: invoice.paymentChannel,
            currency: invoice.currency,
            currencySymbol: invoice.currencySymbol,
            subtotal: invoice.subtotal,
            taxRatePercent: invoice.taxRatePercent,
            taxAmount: invoice.taxAmount,
            total: invoice.total,
            aiRiskScore: invoice.aiRiskScore,
            aiTelemetryNote: invoice.aiTelemetryNote,
            viewCount: invoice.viewCount,
            notes: invoice.notes,
            paidAt: invoice.paidAt,
            paypalInvoiceId: invoice.paypalInvoiceId,
            paypalOrderId: invoice.paypalOrderId,
            paypalCaptureId: invoice.paypalCaptureId,
            lastEmailSentAt: invoice.lastEmailSentAt,
            emailDeliveryStatus: invoice.emailDeliveryStatus,
            lineItems: {
              create: invoice.lineItems.map((li) => ({
                description: li.description,
                quantity: li.quantity,
                rate: li.rate,
                amount: li.amount,
              })),
            },
          },
        });
        invoiceIdMap.set(invoice.id, newInvoice.id);
        counts.invoices++;
        counts.lineItems += invoice.lineItems.length;
      }

      // 4. Clone Transactions
      for (const txn of sourceUser.transactions) {
        const mappedInvoiceId = txn.linkedInvoiceId ? invoiceIdMap.get(txn.linkedInvoiceId) : null;
        const mappedMilestoneId = txn.linkedMilestoneId ? milestoneIdMap.get(txn.linkedMilestoneId) : null;

        await tx.transaction.create({
          data: {
            code: txn.code,
            userId: targetUserId,
            hash: txn.hash,
            timestamp: txn.timestamp,
            description: txn.description,
            clientName: txn.clientName,
            type: txn.type,
            status: txn.status,
            currency: txn.currency,
            currencySymbol: txn.currencySymbol,
            grossAmount: txn.grossAmount,
            feeAmount: txn.feeAmount,
            fxCost: txn.fxCost,
            netAmount: txn.netAmount,
            taxReserveSplitAmount: txn.taxReserveSplitAmount,
            paymentChannel: txn.paymentChannel,
            linkedInvoiceId: mappedInvoiceId || null,
            linkedMilestoneId: mappedMilestoneId || null,
            notes: txn.notes,
            paypalOrderId: txn.paypalOrderId,
            paypalCaptureId: txn.paypalCaptureId,
            paypalRefundId: txn.paypalRefundId,
          },
        });
        counts.transactions++;
      }

      // 5. Clone Expenses
      for (const expense of sourceUser.expenses) {
        await tx.expense.create({
          data: {
            userId: targetUserId,
            merchant: expense.merchant,
            description: expense.description,
            category: expense.category,
            date: expense.date,
            method: expense.method,
            isRecurring: expense.isRecurring,
            amount: expense.amount,
            currency: expense.currency,
            receiptUrl: expense.receiptUrl,
          },
        });
        counts.expenses++;
      }

      // 6. Clone Subscriptions
      for (const sub of sourceUser.subscriptions) {
        await tx.subscription.create({
          data: {
            userId: targetUserId,
            name: sub.name,
            subTitle: sub.subTitle,
            category: sub.category,
            costMonthly: sub.costMonthly,
            currency: sub.currency,
            lastActive: sub.lastActive,
            usageScore: sub.usageScore,
            usageStatus: sub.usageStatus,
            recommendation: sub.recommendation,
            nextRenewal: sub.nextRenewal,
            dueCategory: sub.dueCategory,
            initials: sub.initials,
          },
        });
        counts.subscriptions++;
      }

      // 7. Clone Tax Estimates
      for (const tax of sourceUser.taxEstimates) {
        await tx.taxEstimate.create({
          data: {
            userId: targetUserId,
            jurisdiction: tax.jurisdiction,
            entityType: tax.entityType,
            taxRatio: tax.taxRatio,
            grossInflows: tax.grossInflows,
            deductibleOffset: tax.deductibleOffset,
            taxableBase: tax.taxableBase,
            suggestedReserve: tax.suggestedReserve,
            vaultSetAside: tax.vaultSetAside,
            quarter: tax.quarter,
          },
        });
        counts.taxEstimates++;
      }

      // 8. Update Financial Settings if present
      if (sourceUser.financialSettings) {
        await tx.financialSettings.upsert({
          where: { userId: targetUserId },
          update: {
            baseCurrency: sourceUser.financialSettings.baseCurrency,
            defaultTerms: sourceUser.financialSettings.defaultTerms,
            taxRoutingEnabled: sourceUser.financialSettings.taxRoutingEnabled,
            lateFeeEnabled: sourceUser.financialSettings.lateFeeEnabled,
            recoveryThreshold: sourceUser.financialSettings.recoveryThreshold,
            paypalMerchantConnected: sourceUser.financialSettings.paypalMerchantConnected,
            stripeConnected: sourceUser.financialSettings.stripeConnected,
            autonomousShieldActive: sourceUser.financialSettings.autonomousShieldActive,
          },
          create: {
            userId: targetUserId,
            baseCurrency: sourceUser.financialSettings.baseCurrency,
            defaultTerms: sourceUser.financialSettings.defaultTerms,
            taxRoutingEnabled: sourceUser.financialSettings.taxRoutingEnabled,
            lateFeeEnabled: sourceUser.financialSettings.lateFeeEnabled,
            recoveryThreshold: sourceUser.financialSettings.recoveryThreshold,
            paypalMerchantConnected: sourceUser.financialSettings.paypalMerchantConnected,
            stripeConnected: sourceUser.financialSettings.stripeConnected,
            autonomousShieldActive: sourceUser.financialSettings.autonomousShieldActive,
          },
        });
      }

      return counts;
    });

    await recordAuditLog({
      userId: targetUserId,
      action: "user_dataset_mirrored",
      entityType: "User",
      entityId: targetUserId,
      details: { sourceEmail, ...resultCounts },
    });

    return {
      success: true,
      counts: resultCounts,
    };
  } catch (error) {
    console.error("Failed to mirror user dataset:", error);
    return {
      success: false,
      counts: initialCounts,
      error: error instanceof Error ? error.message : "Unknown error during dataset mirroring",
    };
  }
}
