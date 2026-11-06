import { runFinancialCalculationsTests } from "./financialCalculations.test";
import { runAuthTests } from "./auth.test";
import { runDataIsolationTests } from "./dataIsolation.test";

async function main() {
  console.log("==================================================");
  console.log(" FREELANCEPAY AI — PRODUCTION BACKEND TEST SUITE  ");
  console.log("==================================================");

  let totalPassed = 0;
  let totalFailed = 0;

  const fin = runFinancialCalculationsTests();
  totalPassed += fin.passed;
  totalFailed += fin.failed;

  const auth = await runAuthTests();
  totalPassed += auth.passed;
  totalFailed += auth.failed;

  const iso = runDataIsolationTests();
  totalPassed += iso.passed;
  totalFailed += iso.failed;

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
