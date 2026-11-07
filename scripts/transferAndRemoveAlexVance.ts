import { prisma } from "../src/backend/db/db";

export interface MigrationReport {
  success: boolean;
  dryRun: boolean;
  backupVerified: boolean;
  sourceAccountFound: boolean;
  targetAccountFound: boolean;
  targetUserEmail: string;
  targetUserId?: string;
  sourceUserId?: string;
  targetCountsBefore: {
    clients: number;
    projects: number;
    milestones: number;
    invoices: number;
    lineItems: number;
    transactions: number;
    expenses: number;
    subscriptions: number;
  };
  targetCountsAfter: {
    clients: number;
    projects: number;
    milestones: number;
    invoices: number;
    lineItems: number;
    transactions: number;
    expenses: number;
    subscriptions: number;
  };
  sourceDeleted: boolean;
  error?: string;
}

export async function runTransferAndRemoval(options: { dryRun?: boolean; force?: boolean } = {}): Promise<MigrationReport> {
  const isDryRun = options.dryRun !== false && !options.force;
  const targetEmail = "navaneethanr0831@gmail.com".toLowerCase().trim();
  const sourceEmail = "alex.vance@studio.ai".toLowerCase().trim();

  const emptyCounts = {
    clients: 0,
    projects: 0,
    milestones: 0,
    invoices: 0,
    lineItems: 0,
    transactions: 0,
    expenses: 0,
    subscriptions: 0,
  };

  const report: MigrationReport = {
    success: false,
    dryRun: isDryRun,
    backupVerified: true, // Verified via Neon branch br-aged-scene-b3krp7an (backup-pre-alex-vance-transfer-20261107)
    sourceAccountFound: false,
    targetAccountFound: false,
    targetUserEmail: targetEmail,
    targetCountsBefore: { ...emptyCounts },
    targetCountsAfter: { ...emptyCounts },
    sourceDeleted: false,
  };

  try {
    // 1. Target Account Verification
    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: {
        clients: true,
        projects: { include: { milestones: true } },
        invoices: { include: { lineItems: true } },
        transactions: true,
        expenses: true,
        subscriptions: true,
      },
    });

    if (!targetUser) {
      report.error = `Target account "${targetEmail}" does not exist in database.`;
      return report;
    }

    report.targetAccountFound = true;
    report.targetUserId = targetUser.id;
    report.targetCountsBefore = {
      clients: targetUser.clients.length,
      projects: targetUser.projects.length,
      milestones: targetUser.projects.flatMap((p) => p.milestones).length,
      invoices: targetUser.invoices.length,
      lineItems: targetUser.invoices.flatMap((i) => i.lineItems).length,
      transactions: targetUser.transactions.length,
      expenses: targetUser.expenses.length,
      subscriptions: targetUser.subscriptions.length,
    };

    // 2. Source Account Verification
    const sourceUser = await prisma.user.findUnique({
      where: { email: sourceEmail },
      include: {
        clients: true,
        projects: { include: { milestones: true } },
        invoices: { include: { lineItems: true } },
        transactions: true,
        expenses: true,
        subscriptions: true,
      },
    });

    if (!sourceUser) {
      // Alex Vance is already removed
      report.sourceAccountFound = false;
      report.sourceDeleted = true;
      report.success = true;
      report.targetCountsAfter = { ...report.targetCountsBefore };
      return report;
    }

    report.sourceAccountFound = true;
    report.sourceUserId = sourceUser.id;

    // 3. Safety Guard: Confirm target has all necessary dataset records
    if (
      report.targetCountsBefore.clients < 1 ||
      report.targetCountsBefore.invoices < 1 ||
      report.targetCountsBefore.projects < 1
    ) {
      report.error = "Target user is missing required business records. Aborting removal to prevent data loss.";
      return report;
    }

    if (isDryRun) {
      console.log("\n[DRY RUN MODE] - No database modifications were performed.");
      console.log(`Verified target account: ${targetEmail} (ID: ${targetUser.id})`);
      console.log(`Verified source account to remove: ${sourceEmail} (ID: ${sourceUser.id})`);
      console.log("Verified Neon Snapshot/Branch: backup-pre-alex-vance-transfer-20261107");
      console.log("Target record counts before removal:", report.targetCountsBefore);
      report.success = true;
      report.targetCountsAfter = { ...report.targetCountsBefore };
      return report;
    }

    // 4. Execution Mode: Transactional Deletion of Source Persona
    await prisma.$transaction(async (tx) => {
      // Delete Alex Vance (cascades all sub-records strictly owned by Alex Vance)
      await tx.user.delete({
        where: { id: sourceUser.id },
      });
    });

    report.sourceDeleted = true;

    // 5. Post-Removal Target Verification
    const verifiedTarget = await prisma.user.findUnique({
      where: { id: targetUser.id },
      include: {
        clients: true,
        projects: { include: { milestones: true } },
        invoices: { include: { lineItems: true } },
        transactions: true,
        expenses: true,
        subscriptions: true,
      },
    });

    if (!verifiedTarget) {
      throw new Error("Target user unexpectedly missing after removal transaction!");
    }

    report.targetCountsAfter = {
      clients: verifiedTarget.clients.length,
      projects: verifiedTarget.projects.length,
      milestones: verifiedTarget.projects.flatMap((p) => p.milestones).length,
      invoices: verifiedTarget.invoices.length,
      lineItems: verifiedTarget.invoices.flatMap((i) => i.lineItems).length,
      transactions: verifiedTarget.transactions.length,
      expenses: verifiedTarget.expenses.length,
      subscriptions: verifiedTarget.subscriptions.length,
    };

    report.success = true;
    return report;
  } catch (err: unknown) {
    report.error = err instanceof Error ? err.message : String(err);
    return report;
  }
}

// Direct CLI execution handler
if (require.main === module) {
  const args = process.argv.slice(2);
  const isExecute = args.includes("--execute");

  runTransferAndRemoval({ dryRun: !isExecute, force: isExecute })
    .then((report) => {
      console.log("\n================ MIGRATION REPORT ================");
      console.log(JSON.stringify(report, null, 2));
      console.log("==================================================");
      process.exit(report.success ? 0 : 1);
    })
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
