import fs from "fs";
import path from "path";

export function runDataIsolationTests() {
  console.log("\n▶ Running User Data Isolation & Architectural Checks...");
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

  // 1. Verify all domain services require userId
  const servicesDir = path.join(__dirname, "../src/backend/services");
  const serviceFiles = [
    "invoiceService.ts",
    "clientService.ts",
    "projectService.ts",
    "transactionService.ts",
    "reminderService.ts",
    "spendingService.ts",
    "subscriptionService.ts",
    "taxService.ts",
    "settingsService.ts",
    "dashboardService.ts",
  ];

  for (const file of serviceFiles) {
    const fullPath = path.join(servicesDir, file);
    const content = fs.readFileSync(fullPath, "utf-8");
    const hasUserIdParam = content.includes("userId: string");
    assert(hasUserIdParam, `${file} enforces userId parameter in queries`);
  }

  // 2. Verify schema.prisma isolation indexes and foreign keys
  const schemaPath = path.join(__dirname, "../prisma/schema.prisma");
  const schemaContent = fs.readFileSync(schemaPath, "utf-8");

  assert(/\buserId\s+String\b/.test(schemaContent), "schema.prisma contains userId relation fields");
  assert(
    schemaContent.includes("@@unique([userId, code])"),
    "schema.prisma contains composite uniqueness constraints for user isolation"
  );
  assert(
    schemaContent.includes("onDelete: Cascade"),
    "schema.prisma sets cascade delete on user relations"
  );

  console.log(`Data isolation test summary: ${passed} passed, ${failed} failed.`);
  return { passed, failed };
}
