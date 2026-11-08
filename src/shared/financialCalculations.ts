/**
 * Authoritative Financial Calculations Engine for FreelancePay AI
 * 
 * Strict deterministic calculations using fixed-point (cents) arithmetic
 * to guarantee no IEEE 754 floating-point inaccuracies occur in financial ledgers.
 */

/**
 * Rounds a monetary number to exactly 2 decimal places using deterministic integer math.
 */
export function roundToTwoDecimals(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Converts a floating point or decimal monetary amount into integer cents.
 */
export function toCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

/**
 * Converts integer cents back to a standard two-decimal monetary amount.
 */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Deterministic line item calculation: quantity * unitRate
 */
export function calculateLineItemAmount(quantity: number, rate: number): number {
  const q = Number.isFinite(quantity) ? Math.max(0, quantity) : 0;
  const r = Number.isFinite(rate) ? Math.max(0, rate) : 0;
  // Total in cents: Math.round(q * r * 100)
  const totalCents = Math.round(q * r * 100);
  return fromCents(totalCents);
}

export interface LineItemInput {
  quantity: number;
  rate: number;
}

/**
 * Deterministically computes subtotal, tax amount, and final total for an invoice.
 */
export function calculateInvoiceTotals(
  items: LineItemInput[],
  taxRatePercent: number = 0
): { subtotal: number; taxAmount: number; total: number } {
  const safeTaxRate = Math.max(0, Math.min(100, Number.isFinite(taxRatePercent) ? taxRatePercent : 0));

  let subtotalCents = 0;
  for (const item of items) {
    const itemAmount = calculateLineItemAmount(item.quantity, item.rate);
    subtotalCents += toCents(itemAmount);
  }

  // Calculate tax: (subtotalCents * taxRatePercent) / 100
  const taxCents = Math.round((subtotalCents * safeTaxRate) / 100);
  const totalCents = subtotalCents + taxCents;

  return {
    subtotal: fromCents(subtotalCents),
    taxAmount: fromCents(taxCents),
    total: fromCents(totalCents),
  };
}

/**
 * Calculates net settlement amount from gross, platform fee, and foreign exchange costs.
 */
export function calculateTransactionNet(
  grossAmount: number,
  feeAmount: number = 0,
  fxCost: number = 0
): number {
  const grossCents = toCents(grossAmount);
  const feeCents = toCents(feeAmount);
  const fxCents = toCents(fxCost);
  const netCents = Math.max(0, grossCents - feeCents - fxCents);
  return fromCents(netCents);
}

/**
 * Autonomous Tax Shield allocation calculation (default 20% or configurable ratio).
 */
export function calculateTaxReserveAllocation(
  grossAmount: number,
  taxRatePercent: number = 20
): number {
  const safeRate = Math.max(0, Math.min(100, taxRatePercent));
  const grossCents = toCents(grossAmount);
  const reserveCents = Math.round((grossCents * safeRate) / 100);
  return fromCents(reserveCents);
}

/**
 * Validates allowed state transitions for Invoices.
 */
export type InvoiceStatusType = "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled";

const VALID_INVOICE_TRANSITIONS: Record<InvoiceStatusType, InvoiceStatusType[]> = {
  draft: ["sent", "cancelled"],
  sent: ["viewed", "paid", "overdue", "cancelled"],
  viewed: ["paid", "overdue", "cancelled"],
  overdue: ["paid", "cancelled"],
  paid: ["cancelled"], // Only refund/cancellation allowed
  cancelled: [], // Terminal state
};

export function isValidInvoiceTransition(
  currentStatus: InvoiceStatusType,
  nextStatus: InvoiceStatusType
): boolean {
  if (currentStatus === nextStatus) return true;
  const allowed = VALID_INVOICE_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}

/**
 * Validates allowed state transitions for Milestone projects.
 */
export type MilestoneStatusType =
  | "pending"
  | "authorized"
  | "in_review"
  | "captured"
  | "refunded"
  | "cancelled";

const VALID_MILESTONE_TRANSITIONS: Record<MilestoneStatusType, MilestoneStatusType[]> = {
  pending: ["authorized", "cancelled"],
  authorized: ["in_review", "captured", "cancelled"],
  in_review: ["captured", "authorized", "cancelled"],
  captured: ["refunded"], // Captured escrow can only be refunded if disputed/returned
  refunded: [], // Terminal
  cancelled: [], // Terminal
};

export function isValidMilestoneTransition(
  currentStatus: MilestoneStatusType,
  nextStatus: MilestoneStatusType
): boolean {
  if (currentStatus === nextStatus) return true;
  const allowed = VALID_MILESTONE_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}

/**
 * Interface representing a raw or stored transaction record.
 */
export interface RawTransactionRecord {
  id?: string;
  type: string;
  status: string;
  currency?: string;
  currencySymbol?: string;
  grossAmount: number;
  feeAmount?: number;
  fxCost?: number;
  netAmount?: number;
}

/**
 * The six authoritative financial metrics for the Transaction Ledger.
 */
export interface LedgerFinancialMetrics {
  grossSettledInflows: number;     // 1. Sum only successfully settled incoming client payments
  processingFees: number;          // 2. Only actual processing fees charged on settled transactions
  fxCosts: number;                 // 3. Only actual currency conversion costs on settled transactions
  refundsAndReversals: number;     // 4. Money actually returned or reversed
  netCashReceived: number;         // 5. Settled inflows minus applicable fees, FX costs, refunds and reversals
  pendingAuthorizations: number;   // 6. Authorized but uncaptured payments separately
  settledCount: number;
  authorizedCount: number;
  refundCount: number;
  currency: string;
  currencySymbol: string;
  isMultiCurrency: boolean;
  currencies: string[];
}

/**
 * Calculates authoritative financial ledger metrics from actual transaction data.
 *
 * Enforces strict financial calculation rules:
 * - Never counts authorized, held, pending, or failed payments as received income.
 * - Never counts an authorization as a captured payment.
 * - Does not include outgoing payouts as incoming revenue.
 * - Correctly accounts for refunds and reversals.
 * - Avoids double-counting fees, refunds, or records.
 * - Respects transaction currency and detects unconvertible multi-currency mixtures.
 */
export function calculateLedgerFinancialMetrics(
  transactions: RawTransactionRecord[],
  targetCurrency: string = "All"
): LedgerFinancialMetrics {
  // 1. Detect currencies
  const distinctCurrencies = Array.from(
    new Set(transactions.map((t) => (t.currency || "USD").toUpperCase()))
  );

  const isMulti = targetCurrency === "All" && distinctCurrencies.length > 1;

  // Filter by currency if specific currency selected
  const filtered = targetCurrency && targetCurrency !== "All"
    ? transactions.filter((t) => (t.currency || "USD").toUpperCase() === targetCurrency.toUpperCase())
    : transactions;

  let grossSettledCents = 0;
  let processingFeesCents = 0;
  let fxCostsCents = 0;
  let refundsAndReversalsCents = 0;
  let pendingAuthorizationsCents = 0;
  let settledCount = 0;
  let authorizedCount = 0;
  let refundCount = 0;

  for (const t of filtered) {
    const status = (t.status || "").toLowerCase();
    const type = (t.type || "").toLowerCase();
    const gross = Number(t.grossAmount) || 0;
    const fee = Number(t.feeAmount) || 0;
    const fx = Number(t.fxCost) || 0;

    // Rule: Pending Authorizations (authorized but uncaptured payments shown separately)
    // Never count an authorization as a captured payment or received income!
    const isAuthorization =
      type === "escrow_authorization" ||
      type === "milestone_authorization" ||
      status === "authorized" ||
      status === "held";

    if (
      isAuthorization &&
      status !== "settled" &&
      status !== "refunded" &&
      status !== "reversed" &&
      status !== "failed"
    ) {
      pendingAuthorizationsCents += toCents(Math.abs(gross));
      authorizedCount++;
      continue;
    }

    // Rule: Refunds & Reversals (money actually returned or reversed)
    const isRefundOrReversal =
      type === "refund" ||
      type === "reversal" ||
      status === "refunded" ||
      status === "reversed";

    if (isRefundOrReversal) {
      refundsAndReversalsCents += toCents(Math.abs(gross || Number(t.netAmount) || 0));
      refundCount++;
      continue;
    }

    // Rule: Do not include outgoing payouts as incoming revenue
    if (type === "payout") {
      continue;
    }

    // Rule: Never count failed, pending, or processing payments as received income
    if (status === "failed" || status === "pending" || status === "processing") {
      continue;
    }

    // Rule: Gross Settled Inflows - Sum only successfully settled incoming client payments
    const isIncomingSettlement =
      (type === "client_settlement" || type === "escrow_capture" || type === "milestone_capture") &&
      gross > 0;

    if (status === "settled" && isIncomingSettlement) {
      grossSettledCents += toCents(gross);
      processingFeesCents += toCents(fee);
      fxCostsCents += toCents(fx);
      settledCount++;
    }
  }

  // Net Cash Received = Actual settled inflows minus applicable fees, FX costs, refunds and reversals
  const netCashReceivedCents = Math.max(
    0,
    grossSettledCents - processingFeesCents - fxCostsCents - refundsAndReversalsCents
  );

  const primaryCurrency = targetCurrency && targetCurrency !== "All"
    ? targetCurrency
    : distinctCurrencies[0] || "USD";

  const currencySymbol = primaryCurrency === "EUR" ? "€" : primaryCurrency === "GBP" ? "£" : "$";

  return {
    grossSettledInflows: fromCents(grossSettledCents),
    processingFees: fromCents(processingFeesCents),
    fxCosts: fromCents(fxCostsCents),
    refundsAndReversals: fromCents(refundsAndReversalsCents),
    netCashReceived: fromCents(netCashReceivedCents),
    pendingAuthorizations: fromCents(pendingAuthorizationsCents),
    settledCount,
    authorizedCount,
    refundCount,
    currency: primaryCurrency,
    currencySymbol,
    isMultiCurrency: isMulti,
    currencies: distinctCurrencies,
  };
}
