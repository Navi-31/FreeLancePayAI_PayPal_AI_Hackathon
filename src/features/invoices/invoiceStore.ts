import { Invoice, InvoiceLineItem, InvoiceStatus } from "@/types/invoice";

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: "FP-8849",
    clientName: "Horizon Studio",
    clientEmail: "billing@horizon.design",
    clientAddress: "San Francisco, CA",
    projectTitle: "Design System Sprint II",
    issueDate: "2025-10-10",
    dueDate: "2025-10-24",
    poReference: "HRZ-2025-442",
    status: "viewed",
    paymentChannel: "Stripe Connect",
    currency: "USD",
    currencySymbol: "$",
    lineItems: [
      { id: "1", description: "Design System Architecture & Tokens", quantity: 1, rate: 5500, amount: 5500 },
      { id: "2", description: "Component Library React Migration", quantity: 30, rate: 100, amount: 3000 },
    ],
    subtotal: 8500,
    taxRatePercent: 0,
    taxAmount: 0,
    total: 8500,
    aiRiskScore: "Low",
    aiTelemetryNote: "High settlement probability within 48h. Client viewed invoice 4 minutes ago.",
    viewCount: 3,
    notes: "Payment due within 14 days of issue via connected automated Stripe rail.",
  },
  {
    id: "FP-8848",
    clientName: "Acme Corp",
    clientEmail: "billing@acmecorp.com",
    clientAddress: "100 Innovation Way, Suite 400, Chicago, IL",
    projectTitle: "Brand Architecture Q2 Retainer & Vector Identity",
    issueDate: "2025-10-02",
    dueDate: "2025-10-16",
    poReference: "ACM-2025-098",
    status: "overdue",
    paymentChannel: "PayPal Direct",
    currency: "USD",
    currencySymbol: "$",
    lineItems: [
      { id: "1", description: "Brand Architecture Audit & Strategy", quantity: 1, rate: 1000, amount: 1000 },
      { id: "2", description: "Vector Identity Package & Typography", quantity: 5, rate: 100, amount: 500 },
    ],
    subtotal: 1500,
    taxRatePercent: 0,
    taxAmount: 0,
    total: 1500,
    aiRiskScore: "High",
    aiTelemetryNote: "AP viewing detected 4 times; firm notice recommended to release stalled sign-off.",
    viewCount: 4,
    notes: "Overdue by 14 days. Escalation Tier 2 firm notice prepared for dispatch.",
  },
  {
    id: "FP-8847",
    clientName: "Venture Dynamics",
    clientEmail: "ap@venturedynamics.vc",
    clientAddress: "New York, NY",
    projectTitle: "AI Telemetry Dashboard Implementation",
    issueDate: "2025-09-28",
    dueDate: "2025-10-12",
    poReference: "VD-8812-US",
    status: "paid",
    paymentChannel: "SWIFT Wire",
    currency: "USD",
    currencySymbol: "$",
    lineItems: [
      { id: "1", description: "Telemetry Dashboard UX & Integration", quantity: 1, rate: 4200, amount: 4200 },
    ],
    subtotal: 4200,
    taxRatePercent: 0,
    taxAmount: 0,
    total: 4200,
    aiRiskScore: "Low",
    aiTelemetryNote: "Settled on time. Auto-allocated $840 (20%) into Q4 Autonomous Tax Shield.",
    viewCount: 5,
    notes: "Settled via international SWIFT clearing.",
  },
  {
    id: "FP-8846",
    clientName: "Lumina Labs",
    clientEmail: "finance@luminalabs.io",
    clientAddress: "Seattle, WA",
    projectTitle: "Mobile App Design System Prototype",
    issueDate: "2025-10-12",
    dueDate: "2025-10-26",
    poReference: "LUM-902",
    status: "sent",
    paymentChannel: "Stripe Connect",
    currency: "USD",
    currencySymbol: "$",
    lineItems: [
      { id: "1", description: "Mobile Prototype & Design Specification", quantity: 40, rate: 120, amount: 4800 },
    ],
    subtotal: 4800,
    taxRatePercent: 0,
    taxAmount: 0,
    total: 4800,
    aiRiskScore: "Moderate",
    aiTelemetryNote: "Sent via Stripe Connect. Due in 12 days.",
    viewCount: 1,
    notes: "Milestone payment 1 of 2.",
  },
  {
    id: "FP-8845",
    clientName: "Synthetix Labs LLC",
    clientEmail: "finance@synthetix.io",
    clientAddress: "Boston, MA",
    projectTitle: "Brand Guidelines & Design Tokens",
    issueDate: "2025-09-15",
    dueDate: "2025-09-29",
    poReference: "SYN-110",
    status: "paid",
    paymentChannel: "PayPal Direct",
    currency: "USD",
    currencySymbol: "$",
    lineItems: [
      { id: "1", description: "Brand Tokens & Style Guide", quantity: 1, rate: 3600, amount: 3600 },
    ],
    subtotal: 3600,
    taxRatePercent: 0,
    taxAmount: 0,
    total: 3600,
    aiRiskScore: "Low",
    aiTelemetryNote: "Settled early. Historical delay: 6.2 days.",
    viewCount: 2,
    notes: "Settled via PayPal verified business gateway.",
  },
  {
    id: "FP-8844",
    clientName: "Apex Financial",
    clientEmail: "accounts@apexfin.co",
    clientAddress: "London, UK",
    projectTitle: "Fintech Command Architecture",
    issueDate: "2025-10-18",
    dueDate: "2025-11-01",
    poReference: "APX-774",
    status: "draft",
    paymentChannel: "SWIFT Wire",
    currency: "USD",
    currencySymbol: "$",
    lineItems: [
      { id: "1", description: "Fintech Platform Blueprint", quantity: 1, rate: 5850, amount: 5850 },
    ],
    subtotal: 5850,
    taxRatePercent: 0,
    taxAmount: 0,
    total: 5850,
    aiRiskScore: "Low",
    aiTelemetryNote: "Draft stage. Ready for client review & automated dispatch.",
    viewCount: 0,
    notes: "Draft prepared for Apex Financial Q4 contract.",
  },
];

const STORAGE_KEY = "freelancepay_invoices_v1";

/**
 * Deterministic Line Item Calculator
 */
export function calculateLineItemAmount(quantity: number, rate: number): number {
  const q = Number.isFinite(quantity) ? Math.max(0, quantity) : 0;
  const r = Number.isFinite(rate) ? Math.max(0, rate) : 0;
  return Math.round(q * r * 100) / 100;
}

/**
 * Deterministic Invoice Totals Calculator
 */
export function calculateInvoiceTotals(
  lineItems: InvoiceLineItem[],
  taxRatePercent: number = 0
): { subtotal: number; taxAmount: number; total: number } {
  const subtotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const safeTaxRate = Math.max(0, Math.min(100, taxRatePercent || 0));
  const taxAmount = Math.round(((subtotal * safeTaxRate) / 100) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
  return { subtotal, taxAmount, total };
}

/**
 * Load invoices from localStorage with fallback to INITIAL_INVOICES
 */
export function loadInvoicesFromStorage(): Invoice[] {
  if (typeof window === "undefined") {
    return INITIAL_INVOICES;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_INVOICES));
      return INITIAL_INVOICES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_INVOICES;
  } catch {
    return INITIAL_INVOICES;
  }
}

/**
 * Persist invoices to localStorage
 */
export function saveInvoicesToStorage(invoices: Invoice[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch (err) {
    console.error("Failed to persist invoices to localStorage:", err);
  }
}

/**
 * Save a new or edited invoice
 */
export function upsertInvoiceInStorage(invoice: Invoice): Invoice[] {
  const current = loadInvoicesFromStorage();
  const index = current.findIndex((inv) => inv.id === invoice.id);
  let updated: Invoice[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = invoice;
  } else {
    updated = [invoice, ...current];
  }
  saveInvoicesToStorage(updated);
  return updated;
}

/**
 * Update an invoice status
 */
export function updateInvoiceStatusInStorage(id: string, newStatus: InvoiceStatus): Invoice | null {
  const current = loadInvoicesFromStorage();
  const target = current.find((inv) => inv.id === id);
  if (!target) return null;
  target.status = newStatus;
  saveInvoicesToStorage(current);
  return target;
}
