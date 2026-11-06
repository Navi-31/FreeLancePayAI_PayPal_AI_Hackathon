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
import { runPhase5DDemoReadinessTests } from "./phase5DDemoReadiness.test";
import { runPhase5EFinancialIntelligenceTests } from "./phase5EFinancialIntelligence.test";

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

  // 11. Demo Readiness & Product Polish Tests (Phase 5D)
  const phase5D = await runPhase5DDemoReadinessTests();
  totalPassed += phase5D.passed;
  totalFailed += phase5D.failed;

  // 12. AI Differentiation & Advanced Financial Intelligence Tests (Phase 5E)
  const phase5E = await runPhase5EFinancialIntelligenceTests();
  totalPassed += phase5E.passed;
  totalFailed += phase5E.failed;

  console.log("\n==================================================");
  console.log(" SUITE BREAKDOWN:");
  console.log(`  1. Financial Calculations:              ${fin.passed} passed, ${fin.failed} failed`);
  console.log(`  2. Authentication & Token Verification: ${auth.passed} passed, ${auth.failed} failed`);
  console.log(`  3. Data Isolation & Architecture:       ${iso.passed} passed, ${iso.failed} failed`);
  console.log(`  4. Live Neon Integration:               ${live.passed} passed, ${live.failed} failed`);
  console.log(`  5. PayPal Sandbox Integration & Rails:  ${paypal.passed} passed, ${paypal.failed} failed`);
  console.log(`  6. AI Integration & Safety Guardrails:  ${ai.passed} passed, ${ai.failed} failed`);
  console.log(`  7. Email Delivery, Notifications & Jobs:${emailJobs.passed} passed, ${emailJobs.failed} failed`);
  console.log(`  8. Security Audit & Safeguards (4E):    ${secE2E.passed} passed, ${secE2E.failed} failed`);
  console.log(`  9. Workflows Integration (5B):          ${phase5B.passed} passed, ${phase5B.failed} failed`);
  console.log(` 10. Browser E2E Journeys (5C):           ${browserE2E.passed} passed, ${browserE2E.failed} failed`);
  console.log(` 11. Demo Readiness & Polish (5D):        ${phase5D.passed} passed, ${phase5D.failed} failed`);
  console.log(` 12. Advanced AI & Intelligence (5E):     ${phase5E.passed} passed, ${phase5E.failed} failed`);
  console.log("--------------------------------------------------");
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
