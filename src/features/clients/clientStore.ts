export interface ClientRecord {
  id: string; // e.g. "ACM-8021"
  name: string;
  location: string;
  industry: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  riskTier: "Platinum" | "High Reliability" | "Attention Required" | "High Friction";
  reliabilityScore: number; // 0 - 100
  lifetimeRevenue: number;
  outstandingBalance: number;
  avgSettlementLag: string; // e.g. "+18.2 Days"
  disputeHistory: string;
  preferredRails: string;
  notes: string;
  playbook: {
    whatWorks: string;
    whatFails: string;
  };
}

export const INITIAL_CLIENTS: ClientRecord[] = [
  {
    id: "ACM-8021",
    name: "Acme Corp",
    location: "San Francisco, CA",
    industry: "B2B SaaS & Growth",
    contactName: "Sarah Jenkins",
    contactRole: "VP Brand & Creative",
    contactEmail: "billing@acmecorp.com",
    riskTier: "High Friction",
    reliabilityScore: 54,
    lifetimeRevenue: 12500,
    outstandingBalance: 1500,
    avgSettlementLag: "+18.2 Days",
    disputeHistory: "0 Formal Disputes (2 payment plan escalations)",
    preferredRails: "PayPal Business Direct (Net-14)",
    notes: "Accounts payable systematically defers payouts until firm reminder wave is authorized. Key stakeholder Sarah is supportive but AP operates on strict cash cycles.",
    playbook: {
      whatWorks: "Structured installment splits and formal notices with specific contractual milestones.",
      whatFails: "Unscheduled informal Slack pings and vague follow-ups without invoice attachments.",
    },
  },
  {
    id: "HRZ-9041",
    name: "Horizon Studio",
    location: "New York, NY",
    industry: "Design System Architecture",
    contactName: "Alex Rivers",
    contactRole: "Design Director",
    contactEmail: "billing@horizon.design",
    riskTier: "Platinum",
    reliabilityScore: 96,
    lifetimeRevenue: 34000,
    outstandingBalance: 8500,
    avgSettlementLag: "-2.4 Days (Early)",
    disputeHistory: "0 Disputes (100% on-time release)",
    preferredRails: "Stripe Connect Direct",
    notes: "Top-tier creative client. Excellent communication and immediate milestone authorizations upon Figma deliverable review.",
    playbook: {
      whatWorks: "Early deliverable walkthroughs and Storybook deployment preview links.",
      whatFails: "Aggressive firm escalations; polite nudges are always sufficient.",
    },
  },
  {
    id: "APX-1901",
    name: "Apex Financial",
    location: "London, UK",
    industry: "Fintech Command Architecture",
    contactName: "David Kim",
    contactRole: "Head of Engineering",
    contactEmail: "accounts@apexfin.co",
    riskTier: "Platinum",
    reliabilityScore: 98,
    lifetimeRevenue: 48200,
    outstandingBalance: 0,
    avgSettlementLag: "+1.2 Days",
    disputeHistory: "0 Disputes",
    preferredRails: "SWIFT Wire / Stripe Connect",
    notes: "Institutional enterprise client. Always releases capital promptly upon milestone sign-off. Subject to 1.2% international wire FX spread.",
    playbook: {
      whatWorks: "Detailed architectural blueprints and security compliance checklists.",
      whatFails: "Last-minute scope alterations without formal change order documentation.",
    },
  },
  {
    id: "VLT-8843",
    name: "Vault Protocol",
    location: "Austin, TX",
    industry: "Cryptographic Security & DeFi",
    contactName: "Marcus Finch",
    contactRole: "Managing Partner",
    contactEmail: "ap@vaultprotocol.xyz",
    riskTier: "Attention Required",
    reliabilityScore: 72,
    lifetimeRevenue: 28000,
    outstandingBalance: 1900,
    avgSettlementLag: "+12.0 Days",
    disputeHistory: "0 Formal Disputes",
    preferredRails: "USDC Vault / SWIFT Wire",
    notes: "High total billings but irregular AP batch runs. Typically releases batches on the 15th and 30th of the month.",
    playbook: {
      whatWorks: "Aligning invoice due dates with their semi-monthly batch payout windows.",
      whatFails: "Mid-cycle random reminder notices.",
    },
  },
  {
    id: "LUM-4402",
    name: "Lumina Labs",
    location: "Seattle, WA",
    industry: "Mobile UX & Prototype Labs",
    contactName: "Elena Vance",
    contactRole: "VP Product Operations",
    contactEmail: "finance@luminalabs.io",
    riskTier: "High Reliability",
    reliabilityScore: 91,
    lifetimeRevenue: 19200,
    outstandingBalance: 4800,
    avgSettlementLag: "+3.5 Days",
    disputeHistory: "0 Disputes",
    preferredRails: "Stripe Connect",
    notes: "Agile product startup with steady milestone funding. Deliverables reviewed rapidly by engineering leads.",
    playbook: {
      whatWorks: "Clickable Figma prototypes with user test telemetry.",
      whatFails: "Static PDF mocks without component specifications.",
    },
  },
  {
    id: "SYN-8845",
    name: "Synthetix Labs LLC",
    location: "Boston, MA",
    industry: "Brand Tokens & Style Guides",
    contactName: "Michael Chang",
    contactRole: "Chief Brand Officer",
    contactEmail: "finance@synthetix.io",
    riskTier: "Platinum",
    reliabilityScore: 95,
    lifetimeRevenue: 15600,
    outstandingBalance: 0,
    avgSettlementLag: "-1.0 Days",
    disputeHistory: "0 Disputes",
    preferredRails: "PayPal Direct",
    notes: "Consistently settles ahead of maturity schedule via PayPal business gateway.",
    playbook: {
      whatWorks: "Vector asset exports and token packaging.",
      whatFails: "Complex milestone splits; prefer single full invoices.",
    },
  },
];

const CLIENTS_STORAGE_KEY = "freelancepay_clients_v1";

export function loadClientsFromStorage(): ClientRecord[] {
  if (typeof window === "undefined") return INITIAL_CLIENTS;
  try {
    const raw = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(INITIAL_CLIENTS));
      return INITIAL_CLIENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CLIENTS;
  } catch {
    return INITIAL_CLIENTS;
  }
}

export function saveClientsToStorage(clients: ClientRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
  } catch (err) {
    console.error("Failed to persist clients to storage:", err);
  }
}

export function updateClientNotesInStorage(clientId: string, newNotes: string): ClientRecord[] {
  const current = loadClientsFromStorage();
  const index = current.findIndex((c) => c.id === clientId);
  if (index >= 0) {
    current[index] = { ...current[index], notes: newNotes };
    saveClientsToStorage(current);
  }
  return current;
}
