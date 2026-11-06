import { runFinancialCalculationsTests } from "./financialCalculations.test";
import { runAuthTests } from "./auth.test";
import { runDataIsolationTests } from "./dataIsolation.test";
import { runLiveNeonIntegrationTests } from "./testNeonLiveApi";

async function main() {
  console.log("==================================================");
  console.log(" FREELANCEPAY AI — PRODUCTION BACKEND TEST SUITE  ");
  console.log("==================================================");

  let totalPassed = 0;
  let totalFailed = 0;

  // 1. Authoritative Financial Precision Unit Tests
  const fin = runFinancialCalculationsTests();
  totalPassed += fin.passed;
  totalFailed += fin.failed;

  // 2. Authentication & JWT Unit Tests
  const auth = await runAuthTests();
  totalPassed += auth.passed;
  totalFailed += auth.failed;

  // 3. Architectural Scoping & Isolation Tests
  const iso = runDataIsolationTests();
  totalPassed += iso.passed;
  totalFailed += iso.failed;

  // 4. Real Live End-to-End Tests against Neon PostgreSQL
  const live = await runLiveNeonIntegrationTests();
  totalPassed += live.passed;
  totalFailed += live.failed;

  console.log("\n==================================================");
  console.log(`TOTAL SUITE RESULTS: ${totalPassed} passed, ${totalFailed} failed.`);
  console.log("==================================================");

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
