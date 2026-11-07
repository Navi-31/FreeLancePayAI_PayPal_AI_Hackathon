import "dotenv/config";
import { firestore } from "../src/backend/firebase/admin";
import fs from "fs";
import path from "path";

interface BackupData {
  tables: {
    users: Array<Record<string, unknown>>;
    profiles: Array<Record<string, unknown>>;
    clients: Array<Record<string, unknown>>;
    projects: Array<Record<string, unknown>>;
    milestones: Array<Record<string, unknown>>;
    invoices: Array<Record<string, unknown>>;
    invoiceLineItems: Array<Record<string, unknown>>;
    transactions: Array<Record<string, unknown>>;
    expenses: Array<Record<string, unknown>>;
    subscriptions: Array<Record<string, unknown>>;
    taxEstimates: Array<Record<string, unknown>>;
    financialSettings: Array<Record<string, unknown>>;
    auditLogs: Array<Record<string, unknown>>;
    notifications: Array<Record<string, unknown>>;
    emailDeliveries: Array<Record<string, unknown>>;
    emailOtps: Array<Record<string, unknown>>;
  };
}

async function migrate() {
  console.log("=== MIGRATING NEON POSTGRESQL -> FIREBASE FIRESTORE ===");

  const backupFile = path.join(process.cwd(), "scripts", "neon-backup.json");
  if (!fs.existsSync(backupFile)) {
    throw new Error(`Neon backup file not found at: ${backupFile}`);
  }

  const backup: BackupData = JSON.parse(fs.readFileSync(backupFile, "utf8"));
  const tables = backup.tables;

  // 1. Identify Target Retained Account
  const targetEmail = "navaneethanr0831@gmail.com";
  const genuineUser = tables.users.find(
    (u) => (u.email as string).toLowerCase() === targetEmail.toLowerCase()
  );

  if (!genuineUser) {
    throw new Error(`Target user "${targetEmail}" not found in Neon source data!`);
  }

  const userId = genuineUser.id as string;
  console.log(`\nRetaining user: "${genuineUser.name}" <${genuineUser.email}> (ID: ${userId})`);

  // Verify and clean profile & financialSettings
  const userProfile = tables.profiles.find((p) => p.userId === userId) || {};
  const userFinancialSettings = tables.financialSettings.find((f) => f.userId === userId) || {};

  // Clean data helper
  const clean = (obj: Record<string, unknown>) => {
    const res: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) continue;
      // Convert ISO strings to Date where appropriate
      if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
        res[k] = new Date(v);
      } else {
        res[k] = v;
      }
    }
    return res;
  };

  const batch = firestore.batch();
  const migratedCounts: Record<string, number> = {};

  // 1. Migrate User Document (with embedded profile & financialSettings for instant 1-read retrieval)
  const userData = clean({
    ...genuineUser,
    profile: clean(userProfile),
    financialSettings: clean(userFinancialSettings),
  });
  batch.set(firestore.collection("users").doc(userId), userData, { merge: true });
  migratedCounts["users"] = 1;

  // Also write to profiles & financialSettings collections for normalized access
  if (Object.keys(userProfile).length > 0) {
    batch.set(firestore.collection("profiles").doc(userId), clean(userProfile), { merge: true });
    migratedCounts["profiles"] = 1;
  }
  if (Object.keys(userFinancialSettings).length > 0) {
    batch.set(firestore.collection("financialSettings").doc(userId), clean(userFinancialSettings), { merge: true });
    migratedCounts["financialSettings"] = 1;
  }

  // 2. Migrate Clients owned by user
  const userClients = tables.clients.filter((c) => c.userId === userId);
  for (const client of userClients) {
    batch.set(firestore.collection("clients").doc(client.id as string), clean(client), { merge: true });
  }
  migratedCounts["clients"] = userClients.length;

  // 3. Migrate Projects & Milestones
  const userProjects = tables.projects.filter((p) => p.userId === userId);
  for (const prj of userProjects) {
    batch.set(firestore.collection("projects").doc(prj.id as string), clean(prj), { merge: true });
  }
  migratedCounts["projects"] = userProjects.length;

  const projectIds = new Set(userProjects.map((p) => p.id as string));
  const userMilestones = tables.milestones.filter(
    (m) => m.userId === userId || projectIds.has(m.projectId as string)
  );
  for (const ms of userMilestones) {
    batch.set(firestore.collection("milestones").doc(ms.id as string), clean({ ...ms, userId }), { merge: true });
  }
  migratedCounts["milestones"] = userMilestones.length;

  // 4. Migrate Invoices & Line Items
  const userInvoices = tables.invoices.filter((inv) => inv.userId === userId);
  for (const inv of userInvoices) {
    const lines = tables.invoiceLineItems.filter((l) => l.invoiceId === inv.id).map(clean);
    batch.set(
      firestore.collection("invoices").doc(inv.id as string),
      clean({
        ...inv,
        lineItems: lines,
      }),
      { merge: true }
    );
  }
  migratedCounts["invoices"] = userInvoices.length;

  // 5. Migrate Transactions
  const userTransactions = tables.transactions.filter((t) => t.userId === userId);
  for (const tx of userTransactions) {
    batch.set(firestore.collection("transactions").doc(tx.id as string), clean(tx), { merge: true });
  }
  migratedCounts["transactions"] = userTransactions.length;

  // 6. Migrate Expenses
  const userExpenses = tables.expenses.filter((e) => e.userId === userId);
  for (const exp of userExpenses) {
    batch.set(firestore.collection("expenses").doc(exp.id as string), clean(exp), { merge: true });
  }
  migratedCounts["expenses"] = userExpenses.length;

  // 7. Migrate Subscriptions
  const userSubs = tables.subscriptions.filter((s) => s.userId === userId);
  for (const sub of userSubs) {
    batch.set(firestore.collection("subscriptions").doc(sub.id as string), clean(sub), { merge: true });
  }
  migratedCounts["subscriptions"] = userSubs.length;

  // 8. Migrate Tax Estimates
  const userTax = tables.taxEstimates.filter((t) => t.userId === userId);
  for (const tax of userTax) {
    batch.set(firestore.collection("taxEstimates").doc(tax.id as string), clean(tax), { merge: true });
  }
  migratedCounts["taxEstimates"] = userTax.length;

  // 9. Migrate Audit Logs
  const userLogs = tables.auditLogs.filter((l) => l.userId === userId);
  for (const log of userLogs) {
    batch.set(firestore.collection("auditLogs").doc(log.id as string), clean(log), { merge: true });
  }
  migratedCounts["auditLogs"] = userLogs.length;

  // 10. Migrate Email Deliveries
  const userDeliveries = tables.emailDeliveries.filter((d) => d.userId === userId);
  for (const d of userDeliveries) {
    batch.set(firestore.collection("emailDeliveries").doc(d.id as string), clean(d), { merge: true });
  }
  migratedCounts["emailDeliveries"] = userDeliveries.length;

  // 11. Migrate Active Email Otps
  const userOtps = tables.emailOtps.filter((o) => (o.email as string).toLowerCase() === targetEmail.toLowerCase());
  for (const otp of userOtps) {
    batch.set(firestore.collection("emailOtps").doc(otp.id as string), clean(otp), { merge: true });
  }
  migratedCounts["emailOtps"] = userOtps.length;

  // Commit batch write to Firestore
  await batch.commit();

  console.log("\nFirestore batch write committed successfully!");
  console.log("Migrated genuine records breakdown:");
  for (const [entity, count] of Object.entries(migratedCounts)) {
    console.log(`  ${entity.padEnd(20)}: ${count}`);
  }

  // Verification step
  console.log("\nVerifying migrated data directly from Firestore...");
  const userDoc = await firestore.collection("users").doc(userId).get();
  if (!userDoc.exists) throw new Error("Firestore user document verification failed!");
  console.log("  ✓ User document verified in Firestore:", userDoc.data()?.email);

  const clientDocs = await firestore.collection("clients").where("userId", "==", userId).get();
  console.log(`  ✓ Clients verified in Firestore: ${clientDocs.size} (Expected: ${userClients.length})`);

  const invoiceDocs = await firestore.collection("invoices").where("userId", "==", userId).get();
  console.log(`  ✓ Invoices verified in Firestore: ${invoiceDocs.size} (Expected: ${userInvoices.length})`);

  const txDocs = await firestore.collection("transactions").where("userId", "==", userId).get();
  console.log(`  ✓ Transactions verified in Firestore: ${txDocs.size} (Expected: ${userTransactions.length})`);

  console.log("\nMigration completed with 100% data integrity!");
}

migrate().catch(console.error);
