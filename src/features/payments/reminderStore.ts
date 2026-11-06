import { PaymentReminder, ReminderTone } from "./types";

export function generateReminderDraft(
  clientName: string,
  invoiceId: string,
  amount: number,
  currencySymbol: string,
  dueDate: string,
  overdueDays: number,
  tone: ReminderTone
): { subject: string; messageBody: string } {
  const formattedAmount = `${currencySymbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  if (tone === "polite") {
    const isOverdue = overdueDays > 0;
    const timingText = isOverdue
      ? `reached its scheduled due date on ${dueDate} (${overdueDays} days ago)`
      : `is approaching maturity on ${dueDate}`;

    return {
      subject: `Courtesy Follow-up: Invoice #${invoiceId} (${clientName})`,
      messageBody: `Hi ${clientName} Team,\n\nI hope you're having a productive week. This is a gentle follow-up regarding Invoice #${invoiceId} for ${formattedAmount}, which ${timingText}.\n\nPlease let us know if you require any additional deliverable verification or purchase order documentation. You can review and settle this invoice directly via our instant settlement link below.\n\nThank you for your partnership!`,
    };
  }

  if (tone === "firm") {
    return {
      subject: `Urgent: Payment Status for Invoice #${invoiceId} (${clientName})`,
      messageBody: `Hi ${clientName} Accounts Payable,\n\nFollowing up on Invoice #${invoiceId} for ${formattedAmount}, which reached maturity on ${dueDate} (${overdueDays} days past due). Our telemetry records indicate your AP department reviewed this invoice.\n\nTo prevent late fee accrual under standard commercial terms or an administrative project pause, please confirm the payment release date via our instant settlement portal below today. If payment has already been initiated, kindly provide the transaction tracking reference.\n\nBest regards,`,
    };
  }

  // tone === "final"
  return {
    subject: `FINAL NOTICE: Formal Payment Demand for Invoice #${invoiceId}`,
    messageBody: `ATTENTION: Accounts Payable & Executive Leadership (${clientName}),\n\nThis is a formal notice regarding delinquent Invoice #${invoiceId} in the principal amount of ${formattedAmount}, now ${overdueDays} days past due (Maturity date: ${dueDate}). Multiple scheduled follow-ups remain unanswered.\n\nPlease be advised that unless payment is confirmed through the secure settlement link below within 48 business hours, our engagement contract requires immediate project suspension and referral to our commercial collections partner.\n\nYour immediate attention and remittance is required.`,
  };
}

export const INITIAL_REMINDERS: PaymentReminder[] = [
  {
    id: "REM-8848",
    invoiceId: "FP-8848",
    clientName: "Acme Corp",
    clientEmail: "billing@acmecorp.com",
    amount: 1500,
    currency: "USD",
    dueDate: "2025-10-16",
    overdueDays: 14,
    lastOutreachDate: "6d ago",
    lastOutreachType: "Automated Ping #1",
    recommendedTone: "firm",
    activeTone: "firm",
    status: "pending_approval",
    subject: "Urgent: Payment Status for Invoice #FP-8848 (Acme Corp Brand Architecture Q2)",
    messageBody:
      "Hi Sarah, Following up on Invoice #FP-8848 for $1,500.00, which reached maturity on Oct 16 (14 days past due). Our records show your AP department reviewed this invoice on Oct 14. To prevent late fee accrual or project pause, please confirm the payment release date via our instant PayPal settlement portal below...",
    paymentLink: "https://pay.freelancepay.ai/inv/FP-8848?rail=paypal_direct",
    history: [
      {
        id: "HIST-1",
        timestamp: "2025-10-20 09:15",
        action: "simulated_send",
        tone: "polite",
        notes: "Automated Ping #1 simulated dispatch",
        userApproved: true,
      },
    ],
  },
  {
    id: "REM-8849",
    invoiceId: "FP-8849",
    clientName: "Horizon Studio",
    clientEmail: "billing@horizon.design",
    amount: 8500,
    currency: "USD",
    dueDate: "2025-11-02",
    overdueDays: -2,
    lastOutreachDate: "None",
    lastOutreachType: "First touch",
    recommendedTone: "polite",
    activeTone: "polite",
    status: "scheduled",
    subject: "Courtesy Follow-up: Invoice #FP-8849 (Horizon Studio)",
    messageBody:
      "Hi Horizon Studio Team, I hope you're having a productive week. This is a gentle follow-up regarding Invoice #FP-8849 for $8,500.00, which is approaching maturity on Nov 02. Please let us know if you require any additional deliverable verification...",
    paymentLink: "https://pay.freelancepay.ai/inv/FP-8849?rail=stripe_connect",
    history: [],
  },
  {
    id: "REM-8843",
    invoiceId: "FP-8843",
    clientName: "Vault Protocol",
    clientEmail: "ap@vaultprotocol.xyz",
    amount: 1900,
    currency: "USD",
    dueDate: "2025-10-09",
    overdueDays: 21,
    lastOutreachDate: "3d ago",
    lastOutreachType: "Escalation Letter #2",
    recommendedTone: "final",
    activeTone: "final",
    status: "pending_approval",
    subject: "FINAL NOTICE: Formal Payment Demand for Invoice #FP-8843",
    messageBody:
      "ATTENTION: Accounts Payable & Executive Leadership (Vault Protocol), This is a formal notice regarding delinquent Invoice #FP-8843 in the principal amount of $1,900.00, now 21 days past due (Maturity date: Oct 09). Immediate remittance is required...",
    paymentLink: "https://pay.freelancepay.ai/inv/FP-8843?rail=swift_wire",
    history: [
      {
        id: "HIST-2",
        timestamp: "2025-10-18 11:30",
        action: "simulated_send",
        tone: "firm",
        notes: "Escalation Letter #2 sent",
        userApproved: true,
      },
    ],
  },
  {
    id: "REM-8846",
    invoiceId: "FP-8846",
    clientName: "Lumina Labs",
    clientEmail: "finance@luminalabs.io",
    amount: 4800,
    currency: "USD",
    dueDate: "2025-10-26",
    overdueDays: 4,
    lastOutreachDate: "None",
    lastOutreachType: "Initial notice",
    recommendedTone: "polite",
    activeTone: "polite",
    status: "pending_approval",
    subject: "Courtesy Follow-up: Invoice #FP-8846 (Lumina Labs)",
    messageBody:
      "Hi Lumina Labs Finance Team, Following up on Invoice #FP-8846 for $4,800.00 regarding the Mobile App Design System prototype milestone. Please confirm if AP has scheduled this transfer...",
    paymentLink: "https://pay.freelancepay.ai/inv/FP-8846?rail=stripe_connect",
    history: [],
  },
  {
    id: "REM-8845",
    invoiceId: "FP-8845",
    clientName: "Synthetix Labs LLC",
    clientEmail: "finance@synthetix.io",
    amount: 3600,
    currency: "USD",
    dueDate: "2025-09-29",
    overdueDays: 0,
    lastOutreachDate: "2025-09-20",
    lastOutreachType: "Polite Pre-due Ping",
    recommendedTone: "polite",
    activeTone: "polite",
    status: "sent",
    simulatedSentAt: "2025-09-20 14:00",
    subject: "Settlement Notice: Invoice #FP-8845",
    messageBody: "Invoice #FP-8845 settled successfully via PayPal Direct gateway.",
    paymentLink: "https://pay.freelancepay.ai/inv/FP-8845",
    history: [
      {
        id: "HIST-3",
        timestamp: "2025-09-20 14:00",
        action: "simulated_send",
        tone: "polite",
        notes: "Pre-due reminder successfully simulated",
        userApproved: true,
      },
    ],
  },
  {
    id: "REM-8847",
    invoiceId: "FP-8847",
    clientName: "Venture Dynamics",
    clientEmail: "ap@venturedynamics.vc",
    amount: 4200,
    currency: "USD",
    dueDate: "2025-10-12",
    overdueDays: 0,
    lastOutreachDate: "2025-10-05",
    lastOutreachType: "Scheduled Notice",
    recommendedTone: "polite",
    activeTone: "polite",
    status: "sent",
    simulatedSentAt: "2025-10-05 10:20",
    subject: "Settlement Reminder: Invoice #FP-8847",
    messageBody: "Invoice #FP-8847 settled on time via international SWIFT clearing.",
    paymentLink: "https://pay.freelancepay.ai/inv/FP-8847",
    history: [
      {
        id: "HIST-4",
        timestamp: "2025-10-05 10:20",
        action: "simulated_send",
        tone: "polite",
        notes: "Notice dispatched with user authorization",
        userApproved: true,
      },
    ],
  },
];

const REMINDERS_STORAGE_KEY = "freelancepay_reminders_v1";

export function loadRemindersFromStorage(): PaymentReminder[] {
  if (typeof window === "undefined") {
    return INITIAL_REMINDERS;
  }
  try {
    const raw = localStorage.getItem(REMINDERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(INITIAL_REMINDERS));
      return INITIAL_REMINDERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_REMINDERS;
  } catch {
    return INITIAL_REMINDERS;
  }
}

export function saveRemindersToStorage(reminders: PaymentReminder[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
  } catch (err) {
    console.error("Failed to persist reminders to localStorage:", err);
  }
}

export function updateReminderTone(
  id: string,
  newTone: ReminderTone
): PaymentReminder[] {
  const list = loadRemindersFromStorage();
  const index = list.findIndex((r) => r.id === id);
  if (index >= 0) {
    const current = list[index];
    const draft = generateReminderDraft(
      current.clientName,
      current.invoiceId,
      current.amount,
      "$",
      current.dueDate,
      current.overdueDays,
      newTone
    );
    list[index] = {
      ...current,
      activeTone: newTone,
      subject: draft.subject,
      messageBody: draft.messageBody,
    };
    saveRemindersToStorage(list);
  }
  return list;
}

export function updateReminderDraft(
  id: string,
  subject: string,
  messageBody: string
): PaymentReminder[] {
  const list = loadRemindersFromStorage();
  const index = list.findIndex((r) => r.id === id);
  if (index >= 0) {
    list[index] = {
      ...list[index],
      subject,
      messageBody,
    };
    saveRemindersToStorage(list);
  }
  return list;
}

export function simulateApproveAndSend(
  id: string,
  notes?: string
): { updatedList: PaymentReminder[]; sentReminder: PaymentReminder | null } {
  const list = loadRemindersFromStorage();
  const index = list.findIndex((r) => r.id === id);
  if (index < 0) return { updatedList: list, sentReminder: null };

  const current = list[index];
  const now = new Date().toISOString().replace("T", " ").substring(0, 16);

  const updatedReminder: PaymentReminder = {
    ...current,
    status: "sent",
    simulatedSentAt: now,
    history: [
      {
        id: `HIST-${Date.now()}`,
        timestamp: now,
        action: "simulated_send",
        tone: current.activeTone,
        notes: notes || "User approved simulated dispatch",
        userApproved: true,
      },
      ...current.history,
    ],
  };

  list[index] = updatedReminder;
  saveRemindersToStorage(list);
  return { updatedList: list, sentReminder: updatedReminder };
}

/**
 * Server-backed reminder approve and send
 */
export async function simulateApproveAndSendWithServer(
  id: string,
  notes?: string
): Promise<{ updatedList: PaymentReminder[]; sentReminder: PaymentReminder | null }> {
  try {
    await fetch("/api/reminders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "simulate_send", notes, userApproved: true }),
    });
  } catch {
    // Offline mode
  }
  return simulateApproveAndSend(id, notes);
}
