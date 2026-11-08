import { Transaction } from "./types";
import {
  calculateLedgerFinancialMetrics,
  LedgerFinancialMetrics,
} from "@/shared/financialCalculations";

export type { LedgerFinancialMetrics };

export function calculateDeterministicFees(
  grossAmount: number,
  channel: Transaction["paymentChannel"],
  hasFxDrag: boolean = false
): { feeAmount: number; fxCost: number; netAmount: number; taxReserveSplit: number } {
  const gross = Math.max(0, grossAmount || 0);

  let feeAmount = 0;
  if (channel === "Stripe Connect") {
    feeAmount = Math.round((gross * 0.029 + 0.3) * 100) / 100;
  } else if (channel === "PayPal Direct") {
    feeAmount = Math.round((gross * 0.0349 + 0.49) * 100) / 100;
  } else if (channel === "SWIFT Wire") {
    feeAmount = gross > 0 ? 15.0 : 0;
  } else if (channel === "Wise") {
    feeAmount = Math.round(gross * 0.005 * 100) / 100;
  }

  const fxCost = hasFxDrag ? Math.round(gross * 0.012 * 100) / 100 : 0;
  const netAmount = Math.round((gross - feeAmount - fxCost) * 100) / 100;
  const taxReserveSplit = Math.round(netAmount * 0.2 * 100) / 100;

  return { feeAmount, fxCost, netAmount, taxReserveSplit };
}

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "TXN-90214",
    hash: "0x8f2a4918e90c7b49",
    timestamp: "2025-10-24 14:32:00",
    description: "Horizon Studio — Design System 2.0 (Milestone 2 Core React Components)",
    clientName: "Horizon Studio",
    type: "escrow_capture",
    status: "settled",
    currency: "USD",
    currencySymbol: "$",
    grossAmount: 6000.0,
    feeAmount: 174.3,
    fxCost: 0,
    netAmount: 5825.7,
    taxReserveSplitAmount: 1165.14,
    paymentChannel: "Stripe Connect",
    linkedMilestoneId: "MS-102",
    notes: "Escrow funds released post milestone signoff",
  },
  {
    id: "TXN-90213",
    hash: "0x3e1c7419aa2b77a1",
    timestamp: "2025-10-12 09:14:22",
    description: "AI Telemetry Dashboard Implementation Retainer",
    clientName: "Venture Dynamics",
    type: "client_settlement",
    status: "settled",
    currency: "USD",
    currencySymbol: "$",
    grossAmount: 4200.0,
    feeAmount: 15.0,
    fxCost: 0,
    netAmount: 4185.0,
    taxReserveSplitAmount: 837.0,
    paymentChannel: "SWIFT Wire",
    linkedInvoiceId: "FP-8847",
    notes: "Settled via international SWIFT clearing",
  },
  {
    id: "TXN-90212",
    hash: "0x7a9d01248cc9ff20",
    timestamp: "2025-10-10 16:30:11",
    description: "Horizon Studio — Design System Architecture & Tokens (Milestone 1)",
    clientName: "Horizon Studio",
    type: "escrow_capture",
    status: "settled",
    currency: "USD",
    currencySymbol: "$",
    grossAmount: 5500.0,
    feeAmount: 159.8,
    fxCost: 0,
    netAmount: 5340.2,
    taxReserveSplitAmount: 1068.04,
    paymentChannel: "Stripe Connect",
    linkedMilestoneId: "MS-101",
    notes: "Figma tokens approved and delivered",
  },
  {
    id: "TXN-90211",
    hash: "0x4b810931df3309cd",
    timestamp: "2025-10-01 10:00:45",
    description: "Fintech Platform Blueprint Milestone 1 Release",
    clientName: "Apex Financial",
    type: "escrow_capture",
    status: "settled",
    currency: "USD",
    currencySymbol: "$",
    grossAmount: 7500.0,
    feeAmount: 217.8,
    fxCost: 90.0,
    netAmount: 7192.2,
    taxReserveSplitAmount: 1438.44,
    paymentChannel: "Stripe Connect",
    linkedMilestoneId: "MS-301",
    notes: "Cross-border clearing GBP to USD",
  },
  {
    id: "TXN-90210",
    hash: "0x91da7112003866ef",
    timestamp: "2025-09-29 11:45:00",
    description: "Brand Guidelines & Design Tokens Final Settlement",
    clientName: "Synthetix Labs LLC",
    type: "client_settlement",
    status: "settled",
    currency: "USD",
    currencySymbol: "$",
    grossAmount: 3600.0,
    feeAmount: 126.13,
    fxCost: 0,
    netAmount: 3473.87,
    taxReserveSplitAmount: 694.77,
    paymentChannel: "PayPal Direct",
    linkedInvoiceId: "FP-8845",
    notes: "Early settlement via PayPal business gateway",
  },
  {
    id: "TXN-90209",
    hash: "0x22c4a919018caa81",
    timestamp: "2025-09-25 15:20:10",
    description: "Brand Architecture Audit & Strategy Escrow Hold",
    clientName: "Acme Corp",
    type: "escrow_authorization",
    status: "held",
    currency: "USD",
    currencySymbol: "$",
    grossAmount: 1500.0,
    feeAmount: 0,
    fxCost: 0,
    netAmount: 1500.0,
    taxReserveSplitAmount: 300.0,
    paymentChannel: "PayPal Direct",
    linkedInvoiceId: "FP-8848",
    notes: "Milestone hold active; awaiting AP clearance",
  },
  {
    id: "TXN-90208",
    hash: "0x6f4e3001bc9188bc",
    timestamp: "2025-10-05 14:00:00",
    description: "Mobile App Wireframe Prototypes Escrow Lock",
    clientName: "Lumina Labs",
    type: "escrow_authorization",
    status: "held",
    currency: "USD",
    currencySymbol: "$",
    grossAmount: 4800.0,
    feeAmount: 0,
    fxCost: 0,
    netAmount: 4800.0,
    taxReserveSplitAmount: 960.0,
    paymentChannel: "Stripe Connect",
    linkedMilestoneId: "MS-201",
    notes: "Client funds locked in escrow verification protocol",
  },
  {
    id: "TXN-90207",
    hash: "0x51bb4481023a33d4",
    timestamp: "2025-09-18 13:10:00",
    description: "Brand Refresh Retainer Adjustment Refund",
    clientName: "Global Creative Studio",
    type: "refund",
    status: "refunded",
    currency: "USD",
    currencySymbol: "$",
    grossAmount: -1200.0,
    feeAmount: 0,
    fxCost: 0,
    netAmount: -1200.0,
    taxReserveSplitAmount: 0,
    paymentChannel: "PayPal Direct",
    notes: "Voluntary return of duplicate client retainer transfer",
  },
  {
    id: "TXN-90206",
    hash: "0x11ff889021a899a0",
    timestamp: "2025-09-12 16:40:00",
    description: "Protocol Architecture & Cryptographic Key Review",
    clientName: "Vault Protocol",
    type: "client_settlement",
    status: "settled",
    currency: "USD",
    currencySymbol: "$",
    grossAmount: 12500.0,
    feeAmount: 15.0,
    fxCost: 150.0,
    netAmount: 12335.0,
    taxReserveSplitAmount: 2467.0,
    paymentChannel: "SWIFT Wire",
    notes: "International wire clearing",
  },
  {
    id: "TXN-90205",
    hash: "0x89ee4129bb884412",
    timestamp: "2025-09-01 08:30:00",
    description: "Autonomous Payout to External Operating Vault",
    clientName: "Self (Operating Vault)",
    type: "payout",
    status: "settled",
    currency: "USD",
    currencySymbol: "$",
    grossAmount: -10000.0,
    feeAmount: 1.0,
    fxCost: 0,
    netAmount: -10001.0,
    taxReserveSplitAmount: 0,
    paymentChannel: "Wise",
    notes: "Direct withdrawal to corporate operational checking",
  },
];

const TRANSACTIONS_STORAGE_KEY = "freelancepay_transactions_v1";

export function loadTransactionsFromStorage(): Transaction[] {
  if (typeof window === "undefined") {
    return INITIAL_TRANSACTIONS;
  }
  try {
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_TRANSACTIONS;
  } catch {
    return INITIAL_TRANSACTIONS;
  }
}

export function saveTransactionsToStorage(transactions: Transaction[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error("Failed to persist transactions to localStorage:", err);
  }
}

/**
 * Fetch transactions from server with fallback to localStorage
 */
export async function fetchTransactionsWithFallback(): Promise<Transaction[]> {
  try {
    const res = await fetch("/api/transactions");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.transactions) && data.transactions.length > 0) {
        const mapped: Transaction[] = data.transactions.map((t: Record<string, unknown>) => ({
          id: String(t.code || t.id),
          hash: String(t.hash || "0x0000"),
          timestamp: typeof t.timestamp === "string" ? t.timestamp.replace("T", " ").substring(0, 19) : "2025-10-24 14:32:00",
          description: String(t.description),
          clientName: String(t.clientName),
          type: t.type as Transaction["type"],
          status: t.status as Transaction["status"],
          currency: String(t.currency || "USD"),
          currencySymbol: String(t.currencySymbol || "$"),
          grossAmount: Number(t.grossAmount),
          feeAmount: Number(t.feeAmount || 0),
          fxCost: Number(t.fxCost || 0),
          netAmount: Number(t.netAmount),
          taxReserveSplitAmount: Number(t.taxReserveSplitAmount || 0),
          paymentChannel: t.paymentChannel as Transaction["paymentChannel"],
          notes: String(t.notes || ""),
        }));
        saveTransactionsToStorage(mapped);
        return mapped;
      }
    }
  } catch {
    // Offline mode
  }
  return loadTransactionsFromStorage();
}

export function calculateTransactionKpis(
  transactions: Transaction[],
  targetCurrency: string = "All",
  rates?: Record<string, number>,
  displayCurrency: string = "USD"
): LedgerFinancialMetrics {
  return calculateLedgerFinancialMetrics(transactions, targetCurrency, rates, displayCurrency);
}

/**
 * Generates an RFC-4180 compliant CSV string from an array of transactions.
 */
export function exportTransactionsToCsv(transactions: Transaction[]): string {
  const headers = [
    "Transaction ID",
    "Hash",
    "Timestamp",
    "Description",
    "Client Name",
    "Type",
    "Status",
    "Currency",
    "Gross Amount",
    "Processing Fee",
    "FX Drag",
    "Net Amount",
    "Tax Reserve (20%)",
    "Payment Channel",
    "Linked Reference",
    "Notes",
  ];

  const escapeCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = transactions.map((t) => [
    escapeCell(t.id),
    escapeCell(t.hash),
    escapeCell(t.timestamp),
    escapeCell(t.description),
    escapeCell(t.clientName),
    escapeCell(t.type),
    escapeCell(t.status),
    escapeCell(t.currency),
    escapeCell(t.grossAmount.toFixed(2)),
    escapeCell(t.feeAmount.toFixed(2)),
    escapeCell(t.fxCost.toFixed(2)),
    escapeCell(t.netAmount.toFixed(2)),
    escapeCell(t.taxReserveSplitAmount.toFixed(2)),
    escapeCell(t.paymentChannel),
    escapeCell(t.linkedInvoiceId || t.linkedMilestoneId || "N/A"),
    escapeCell(t.notes || ""),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

/**
 * Triggers a client-side download of the CSV content.
 */
export function downloadCsvFile(csvContent: string, fileName: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
