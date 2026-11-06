import { runFinancialCalculationsTests } from "./financialCalculations.test";
import { runAuthTests } from "./auth.test";
import { runDataIsolationTests } from "./dataIsolation.test";
import { runLiveNeonIntegrationTests } from "./testNeonLiveApi";
import { runPayPalIntegrationTests } from "./paypalIntegration.test";
import { runAIIntegrationTests } from "./aiIntegration.test";
import { runEmailNotificationJobsTests } from "./emailNotificationJobs.test";
import { runSecurityAndE2ETests } from "./securityAndE2E.test";
import { runPhase5BIntegrationTests } from "./phase5BIntegration.test";
import { runBrowserE2ETests } from "./browserE2E.test";

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

  // 5. PayPal Sandbox Integration, Verification, and Idempotency Tests
  const paypal = await runPayPalIntegrationTests();
  totalPassed += paypal.passed;
  totalFailed += paypal.failed;

  // 6. AI Production Integration, Prompt Injection & Guardrail Tests
  const ai = await runAIIntegrationTests();
  totalPassed += ai.passed;
  totalFailed += ai.failed;

  // 7. Email Delivery, Notifications & Background Jobs Tests (Phase 4D)
  const emailJobs = await runEmailNotificationJobsTests();
  totalPassed += emailJobs.passed;
  totalFailed += emailJobs.failed;

  // 8. Security Audit, Safeguards & End-to-End Workflow Tests (Phase 4E)
  const secE2E = await runSecurityAndE2ETests();
  totalPassed += secE2E.passed;
  totalFailed += secE2E.failed;

  // 9. Complete Frontend, API & Database Workflows Integration Tests (Phase 5B)
  const phase5B = await runPhase5BIntegrationTests();
  totalPassed += phase5B.passed;
  totalFailed += phase5B.failed;

  // 10. Browser End-to-End Workflow & Interactive Journey Tests (Phase 5C)
  const browserE2E = await runBrowserE2ETests();
  totalPassed += browserE2E.passed;
  totalFailed += browserE2E.failed;

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
