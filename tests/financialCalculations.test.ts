import {
  roundToTwoDecimals,
  toCents,
  fromCents,
  calculateLineItemAmount,
  calculateInvoiceTotals,
  calculateTransactionNet,
  calculateTaxReserveAllocation,
  isValidInvoiceTransition,
  isValidMilestoneTransition,
} from "../src/lib/financialCalculations";

export function runFinancialCalculationsTests() {
  console.log("\n▶ Running Financial Calculations & Precision Tests...");
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

  // 1. Exact penny rounding
  assert(roundToTwoDecimals(145.004) === 145.0, "145.004 rounds to 145.00");
  assert(roundToTwoDecimals(145.006) === 145.01, "145.006 rounds to 145.01");
  assert(toCents(12.34) === 1234, "toCents converts $12.34 to 1234 cents");
  assert(fromCents(1234) === 12.34, "fromCents converts 1234 cents to $12.34");

  // 2. Line Item Calculations without IEEE 754 float drift
  assert(
    calculateLineItemAmount(30, 100) === 3000.0,
    "30 hours * $100/hr = $3000.00"
  );
  assert(
    calculateLineItemAmount(0.1, 0.2) === 0.02,
    "0.1 * 0.2 handles floating point multiplication safely as $0.02"
  );

  // 3. Invoice totals with and without tax
  const items = [
    { quantity: 1, rate: 5500 },
    { quantity: 30, rate: 100 },
  ];
  const noTax = calculateInvoiceTotals(items, 0);
  assert(noTax.subtotal === 8500.0, "Subtotal is exactly $8500.00");
  assert(noTax.taxAmount === 0.0, "Tax amount is $0.00 for 0% tax");
  assert(noTax.total === 8500.0, "Total is exactly $8500.00");

  const withTax = calculateInvoiceTotals(items, 8.5);
  assert(withTax.subtotal === 8500.0, "Subtotal with 8.5% tax is $8500.00");
  assert(withTax.taxAmount === 722.5, "Tax amount is $722.50 (8500 * 0.085)");
  assert(withTax.total === 9222.5, "Total is exactly $9222.50");

  // 4. Transaction Net & Fees
  const net = calculateTransactionNet(5000, 145, 25);
  assert(net === 4830.0, "$5000 gross - $145 fee - $25 fx = $4830.00 net");

  // 5. Autonomous Tax Reserve Split (20%)
  const taxReserve = calculateTaxReserveAllocation(4200, 20);
  assert(taxReserve === 840.0, "20% tax reserve on $4200 is exactly $840.00");

  // 6. Invoice State Transition Rules
  assert(isValidInvoiceTransition("draft", "sent") === true, "draft -> sent is valid");
  assert(isValidInvoiceTransition("sent", "viewed") === true, "sent -> viewed is valid");
  assert(isValidInvoiceTransition("viewed", "paid") === true, "viewed -> paid is valid");
  assert(isValidInvoiceTransition("paid", "draft") === false, "paid -> draft is illegal");
  assert(isValidInvoiceTransition("cancelled", "sent") === false, "cancelled -> sent is illegal");

  // 7. Milestone State Transition Rules
  assert(isValidMilestoneTransition("pending", "authorized") === true, "pending -> authorized is valid");
  assert(isValidMilestoneTransition("authorized", "captured") === true, "authorized -> captured is valid");
  assert(isValidMilestoneTransition("pending", "captured") === false, "pending -> captured directly is illegal");
  assert(isValidMilestoneTransition("captured", "refunded") === true, "captured -> refunded is valid");

  console.log(`Financial calculations test summary: ${passed} passed, ${failed} failed.`);
  return { passed, failed };
}
