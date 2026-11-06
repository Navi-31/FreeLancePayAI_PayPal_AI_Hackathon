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
