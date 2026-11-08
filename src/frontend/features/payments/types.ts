export type ReminderTone = "polite" | "firm" | "final";
export type ReminderStatus = "pending_approval" | "scheduled" | "sent";

export interface ReminderHistoryEntry {
  id: string;
  timestamp: string;
  action: "draft_created" | "tone_changed" | "edited" | "simulated_send" | "scheduled";
  tone: ReminderTone;
  notes?: string;
  userApproved?: boolean;
}

export interface PaymentReminder {
  id: string; // e.g. "REM-8848"
  invoiceId: string; // e.g. "FP-8848"
  clientName: string;
  clientEmail: string;
  amount: number;
  currency: string;
  dueDate: string;
  overdueDays: number; // positive = overdue, negative = days until due
  lastOutreachDate?: string;
  lastOutreachType?: string;
  recommendedTone: ReminderTone;
  activeTone: ReminderTone;
  status: ReminderStatus;
  subject: string;
  messageBody: string;
  paymentLink: string;
  history: ReminderHistoryEntry[];
  simulatedSentAt?: string;
}

export type MilestoneStatus =
  | "pending"
  | "authorized"
  | "in_review"
  | "captured"
  | "refunded"
  | "cancelled";

export interface MilestoneHistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  fromStatus: MilestoneStatus;
  toStatus: MilestoneStatus;
  userConfirmed: boolean;
  notes?: string;
}

export interface Milestone {
  id: string; // e.g. "MS-101"
  projectId: string; // e.g. "PRJ-9041"
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  status: MilestoneStatus;
  deliverableNotes?: string;
  authorizedAt?: string;
  capturedAt?: string;
  refundedAt?: string;
  history: MilestoneHistoryEntry[];
}

export interface MilestoneProject {
  id: string; // e.g. "PRJ-9041"
  escrowId: string; // e.g. "#HZ-9041"
  title: string;
  clientName: string;
  clientEmail: string;
  currency: string;
  currencySymbol: string;
  createdAt: string;
  milestones: Milestone[];
}

export type TransactionType =
  | "client_settlement"
  | "escrow_capture"
  | "escrow_authorization"
  | "milestone_capture"
  | "milestone_authorization"
  | "refund"
  | "reversal"
  | "payout"
  | "fee_adjustment";

export type TransactionStatus =
  | "settled"
  | "authorized"
  | "held"
  | "pending"
  | "processing"
  | "failed"
  | "refunded"
  | "reversed";

export interface Transaction {
  id: string; // e.g. "TXN-90214"
  hash: string; // e.g. "0x8f2a...b49e"
  timestamp: string; // e.g. "2025-10-24 14:32:00"
  description: string;
  clientName: string;
  type: TransactionType;
  status: TransactionStatus;
  currency: string;
  currencySymbol: string;
  grossAmount: number;
  feeAmount: number;
  fxCost: number;
  netAmount: number;
  taxReserveSplitAmount: number; // 20% autonomous tax shield
  paymentChannel: "Stripe Connect" | "PayPal Direct" | "SWIFT Wire" | "Wise";
  linkedInvoiceId?: string;
  linkedMilestoneId?: string;
  notes?: string;
}
