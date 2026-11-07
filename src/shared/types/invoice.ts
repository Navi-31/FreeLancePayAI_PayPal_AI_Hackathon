export type InvoiceStatus = "draft" | "sent" | "viewed" | "paid" | "overdue";

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string; // e.g. "FP-8848"
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  projectTitle: string;
  issueDate: string; // e.g. "2025-10-02" or "Oct 2, 2025"
  dueDate: string;   // e.g. "2025-10-16"
  poReference?: string;
  status: InvoiceStatus;
  paymentChannel: "PayPal Direct" | "Stripe Connect" | "SWIFT Wire";
  currency: string;
  currencySymbol: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRatePercent: number; // e.g. 20%
  taxAmount: number;
  total: number;
  aiRiskScore?: "Low" | "Moderate" | "High";
  aiTelemetryNote?: string;
  viewCount?: number;
  notes?: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  paypalInvoiceId?: string;
}
