import { prisma } from "../src/backend/db/db";
import fs from "fs";
import path from "path";

async function backup() {
  console.log("Starting full Neon database backup...");

  const [
    users,
    profiles,
    clients,
    clientPaymentHistories,
    projects,
    milestones,
    milestoneHistories,
    invoices,
    invoiceLineItems,
    transactions,
    paymentReminders,
    reminderHistories,
    expenses,
    subscriptions,
    taxEstimates,
    financialSettings,
    auditLogs,
    notifications,
    emailDeliveries,
    emailOtps,
    passwordResetTokens,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.profile.findMany(),
    prisma.client.findMany(),
    prisma.clientPaymentHistory.findMany(),
    prisma.project.findMany(),
    prisma.milestone.findMany(),
    prisma.milestoneHistory.findMany(),
    prisma.invoice.findMany(),
    prisma.invoiceLineItem.findMany(),
    prisma.transaction.findMany(),
    prisma.paymentReminder.findMany(),
    prisma.reminderHistory.findMany(),
    prisma.expense.findMany(),
    prisma.subscription.findMany(),
    prisma.taxEstimate.findMany(),
    prisma.financialSettings.findMany(),
    prisma.auditLog.findMany(),
    prisma.notification.findMany(),
    prisma.emailDelivery.findMany(),
    prisma.emailOtp.findMany(),
    prisma.passwordResetToken.findMany(),
  ]);

  const backupData = {
    exportedAt: new Date().toISOString(),
    counts: {
      users: users.length,
      profiles: profiles.length,
      clients: clients.length,
      clientPaymentHistories: clientPaymentHistories.length,
      projects: projects.length,
      milestones: milestones.length,
      milestoneHistories: milestoneHistories.length,
      invoices: invoices.length,
      invoiceLineItems: invoiceLineItems.length,
      transactions: transactions.length,
      paymentReminders: paymentReminders.length,
      reminderHistories: reminderHistories.length,
      expenses: expenses.length,
      subscriptions: subscriptions.length,
      taxEstimates: taxEstimates.length,
      financialSettings: financialSettings.length,
      auditLogs: auditLogs.length,
      notifications: notifications.length,
      emailDeliveries: emailDeliveries.length,
      emailOtps: emailOtps.length,
      passwordResetTokens: passwordResetTokens.length,
    },
    tables: {
      users,
      profiles,
      clients,
      clientPaymentHistories,
      projects,
      milestones,
      milestoneHistories,
      invoices,
      invoiceLineItems,
      transactions,
      paymentReminders,
      reminderHistories,
      expenses,
      subscriptions,
      taxEstimates,
      financialSettings,
      auditLogs,
      notifications,
      emailDeliveries,
      emailOtps,
      passwordResetTokens,
    },
  };

  const backupPath = path.join(process.cwd(), "scripts", "neon-backup.json");
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), "utf8");
  console.log(`Backup completed successfully! Saved to: ${backupPath}`);
  console.log("Summary of exported records:", backupData.counts);
}

backup()
  .catch((err) => {
    console.error("Backup failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
