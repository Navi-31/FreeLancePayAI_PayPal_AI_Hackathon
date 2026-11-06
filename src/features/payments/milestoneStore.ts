import { MilestoneProject, Milestone, MilestoneStatus } from "./types";

export interface ProjectFinancialSummary {
  totalContract: number;
  authorizedAmount: number;
  capturedAmount: number;
  remainingAmount: number;
  clearedPercentage: number;
  clearedCount: number;
  totalCount: number;
}

export function calculateProjectTotals(milestones: Milestone[]): ProjectFinancialSummary {
  const totalCount = milestones.length;
  let totalContract = 0;
  let authorizedAmount = 0;
  let capturedAmount = 0;
  let clearedCount = 0;

  for (const m of milestones) {
    const amt = Math.max(0, m.amount || 0);
    totalContract += amt;
    if (m.status === "captured") {
      capturedAmount += amt;
      clearedCount += 1;
    } else if (m.status === "authorized" || m.status === "in_review") {
      authorizedAmount += amt;
    }
  }

  // Round all amounts cleanly
  totalContract = Math.round(totalContract * 100) / 100;
  authorizedAmount = Math.round(authorizedAmount * 100) / 100;
  capturedAmount = Math.round(capturedAmount * 100) / 100;
  const remainingAmount = Math.max(0, Math.round((totalContract - capturedAmount) * 100) / 100);
  const clearedPercentage = totalContract > 0 ? Math.round((capturedAmount / totalContract) * 100) : 0;

  return {
    totalContract,
    authorizedAmount,
    capturedAmount,
    remainingAmount,
    clearedPercentage,
    clearedCount,
    totalCount,
  };
}

export const INITIAL_MILESTONE_PROJECTS: MilestoneProject[] = [
  {
    id: "PRJ-9041",
    escrowId: "#HZ-9041",
    title: "Horizon Studio — Design System 2.0 & Token Suite",
    clientName: "Horizon Studio",
    clientEmail: "billing@horizon.design",
    currency: "USD",
    currencySymbol: "$",
    createdAt: "2025-09-15",
    milestones: [
      {
        id: "MS-101",
        projectId: "PRJ-9041",
        title: "Token Architecture & Core Design Specs",
        description: "Design system tokens schema in Figma & CSS token variables export.",
        amount: 5500,
        dueDate: "2025-10-10",
        status: "captured",
        deliverableNotes: "Tokens JSON compiled and verified against WCAG AAA contrast.",
        capturedAt: "2025-10-10 16:30",
        history: [
          {
            id: "H-101",
            timestamp: "2025-10-10 16:30",
            action: "captured",
            fromStatus: "authorized",
            toStatus: "captured",
            userConfirmed: true,
            notes: "Client signed off on Figma specs; funds captured and released.",
          },
        ],
      },
      {
        id: "MS-102",
        projectId: "PRJ-9041",
        title: "Core React Components Migration",
        description: "30 headless accessible React primitives migrated to TypeScript 5.",
        amount: 6000,
        dueDate: "2025-10-24",
        status: "captured",
        deliverableNotes: "Component suite delivered with unit tests passing 98% coverage.",
        capturedAt: "2025-10-24 11:15",
        history: [
          {
            id: "H-102",
            timestamp: "2025-10-24 11:15",
            action: "captured",
            fromStatus: "authorized",
            toStatus: "captured",
            userConfirmed: true,
            notes: "Deliverable approved by Horizon engineering lead.",
          },
        ],
      },
      {
        id: "MS-103",
        projectId: "PRJ-9041",
        title: "Documentation Suite & Template Assembly",
        description: "Storybook interactive docs, pattern library, and template roll-out.",
        amount: 5500,
        dueDate: "2025-11-15",
        status: "authorized",
        deliverableNotes: "Awaiting final storybook preview deployment signoff.",
        authorizedAt: "2025-10-25 09:00",
        history: [
          {
            id: "H-103",
            timestamp: "2025-10-25 09:00",
            action: "authorized",
            fromStatus: "pending",
            toStatus: "authorized",
            userConfirmed: true,
            notes: "Client authorized funds into simulated escrow rail.",
          },
        ],
      },
    ],
  },
  {
    id: "PRJ-4402",
    escrowId: "#LL-4402",
    title: "Lumina Labs — Mobile App Design System",
    clientName: "Lumina Labs",
    clientEmail: "finance@luminalabs.io",
    currency: "USD",
    currencySymbol: "$",
    createdAt: "2025-10-01",
    milestones: [
      {
        id: "MS-201",
        projectId: "PRJ-4402",
        title: "Mobile App Wireframe Prototypes",
        description: "Interactive clickable iOS & Android flows for AP review.",
        amount: 4800,
        dueDate: "2025-10-26",
        status: "in_review",
        deliverableNotes: "Figma prototype submitted; awaiting client deliverable sign-off.",
        authorizedAt: "2025-10-05 14:00",
        history: [
          {
            id: "H-201",
            timestamp: "2025-10-05 14:00",
            action: "authorized",
            fromStatus: "pending",
            toStatus: "authorized",
            userConfirmed: true,
          },
          {
            id: "H-202",
            timestamp: "2025-10-25 18:00",
            action: "in_review",
            fromStatus: "authorized",
            toStatus: "in_review",
            userConfirmed: true,
            notes: "Deliverable submitted for formal client verification.",
          },
        ],
      },
      {
        id: "MS-202",
        projectId: "PRJ-4402",
        title: "High-Fidelity Production UI Kit",
        description: "Polished dark-mode component specs, animations, and vector assets.",
        amount: 7200,
        dueDate: "2025-11-20",
        status: "pending",
        deliverableNotes: "Scheduled to begin upon Milestone 1 clearance.",
        history: [],
      },
    ],
  },
  {
    id: "PRJ-1901",
    escrowId: "#AF-1901",
    title: "Apex Financial — Command Center UI",
    clientName: "Apex Financial",
    clientEmail: "accounts@apexfin.co",
    currency: "USD",
    currencySymbol: "$",
    createdAt: "2025-09-20",
    milestones: [
      {
        id: "MS-301",
        projectId: "PRJ-1901",
        title: "Fintech Platform Blueprint",
        description: "Full architectural specifications and security compliance flowcharts.",
        amount: 7500,
        dueDate: "2025-10-01",
        status: "captured",
        deliverableNotes: "Architectural blueprint verified and accepted.",
        capturedAt: "2025-10-01 10:00",
        history: [
          {
            id: "H-301",
            timestamp: "2025-10-01 10:00",
            action: "captured",
            fromStatus: "authorized",
            toStatus: "captured",
            userConfirmed: true,
          },
        ],
      },
      {
        id: "MS-302",
        projectId: "PRJ-1901",
        title: "React Dashboard Components",
        description: "Core analytics charting, metric cards, and responsive tables.",
        amount: 8000,
        dueDate: "2025-11-05",
        status: "authorized",
        deliverableNotes: "Funds locked in client escrow. Staging branch active.",
        authorizedAt: "2025-10-15 12:00",
        history: [
          {
            id: "H-302",
            timestamp: "2025-10-15 12:00",
            action: "authorized",
            fromStatus: "pending",
            toStatus: "authorized",
            userConfirmed: true,
          },
        ],
      },
      {
        id: "MS-303",
        projectId: "PRJ-1901",
        title: "Integration & Final QA Release",
        description: "Telemetry integration, end-to-end testing, and production deployment.",
        amount: 7000,
        dueDate: "2025-12-01",
        status: "pending",
        deliverableNotes: "Pending Milestone 2 completion.",
        history: [],
      },
    ],
  },
  {
    id: "PRJ-8812",
    escrowId: "#VD-8812",
    title: "Venture Dynamics — AI Telemetry System",
    clientName: "Venture Dynamics",
    clientEmail: "ap@venturedynamics.vc",
    currency: "USD",
    currencySymbol: "$",
    createdAt: "2025-09-10",
    milestones: [
      {
        id: "MS-401",
        projectId: "PRJ-8812",
        title: "Telemetry UX & Integration",
        description: "Real-time query performance graphs and latency telemetry dashboard.",
        amount: 4200,
        dueDate: "2025-09-28",
        status: "captured",
        deliverableNotes: "Delivered and settled on time.",
        capturedAt: "2025-09-28 17:00",
        history: [
          {
            id: "H-401",
            timestamp: "2025-09-28 17:00",
            action: "captured",
            fromStatus: "authorized",
            toStatus: "captured",
            userConfirmed: true,
          },
        ],
      },
      {
        id: "MS-402",
        projectId: "PRJ-8812",
        title: "Predictive Cache Engine",
        description: "Autonomous edge routing models and predictive caching logic.",
        amount: 9800,
        dueDate: "2025-11-10",
        status: "authorized",
        deliverableNotes: "Escrow funds locked. Final testing underway.",
        authorizedAt: "2025-10-10 11:00",
        history: [
          {
            id: "H-402",
            timestamp: "2025-10-10 11:00",
            action: "authorized",
            fromStatus: "pending",
            toStatus: "authorized",
            userConfirmed: true,
          },
        ],
      },
    ],
  },
];

const MILESTONES_STORAGE_KEY = "freelancepay_milestones_v1";

export function loadMilestoneProjectsFromStorage(): MilestoneProject[] {
  if (typeof window === "undefined") {
    return INITIAL_MILESTONE_PROJECTS;
  }
  try {
    const raw = localStorage.getItem(MILESTONES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MILESTONES_STORAGE_KEY, JSON.stringify(INITIAL_MILESTONE_PROJECTS));
      return INITIAL_MILESTONE_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_MILESTONE_PROJECTS;
  } catch {
    return INITIAL_MILESTONE_PROJECTS;
  }
}

export function saveMilestoneProjectsToStorage(projects: MilestoneProject[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MILESTONES_STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error("Failed to persist milestone projects to localStorage:", err);
  }
}

export function calculateGlobalMilestoneMetrics(projects: MilestoneProject[]): {
  activeProjectsCount: number;
  authorizedEscrowTotal: number;
  capturedReleasedTotal: number;
  pendingApprovalsTotal: number;
} {
  let authorizedEscrowTotal = 0;
  let capturedReleasedTotal = 0;
  let pendingApprovalsTotal = 0;

  for (const proj of projects) {
    for (const m of proj.milestones) {
      const amt = m.amount || 0;
      if (m.status === "authorized") {
        authorizedEscrowTotal += amt;
      } else if (m.status === "in_review") {
        pendingApprovalsTotal += amt;
        authorizedEscrowTotal += amt;
      } else if (m.status === "captured") {
        capturedReleasedTotal += amt;
      }
    }
  }

  return {
    activeProjectsCount: projects.length,
    authorizedEscrowTotal: Math.round(authorizedEscrowTotal * 100) / 100,
    capturedReleasedTotal: Math.round(capturedReleasedTotal * 100) / 100,
    pendingApprovalsTotal: Math.round(pendingApprovalsTotal * 100) / 100,
  };
}

export function createMilestoneProjectInStorage(
  data: Omit<MilestoneProject, "id" | "escrowId" | "createdAt">
): { updatedList: MilestoneProject[]; newProject: MilestoneProject } {
  const current = loadMilestoneProjectsFromStorage();
  const id = `PRJ-${Math.floor(1000 + Math.random() * 9000)}`;
  const escrowId = `#ESC-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString().substring(0, 10);

  const newProject: MilestoneProject = {
    ...data,
    id,
    escrowId,
    createdAt: now,
    milestones: data.milestones.map((m, idx) => ({
      ...m,
      id: m.id || `MS-${Math.floor(100 + Math.random() * 900)}`,
      projectId: id,
      history: [
        {
          id: `H-INIT-${idx}`,
          timestamp: now,
          action: "created",
          fromStatus: "pending",
          toStatus: m.status || "pending",
          userConfirmed: true,
          notes: "Initial milestone creation",
        },
      ],
    })),
  };

  const updatedList = [newProject, ...current];
  saveMilestoneProjectsToStorage(updatedList);
  return { updatedList, newProject };
}

export function updateMilestoneLifecycleInStorage(
  projectId: string,
  milestoneId: string,
  newStatus: MilestoneStatus,
  notes?: string
): { updatedList: MilestoneProject[]; updatedMilestone: Milestone | null } {
  const current = loadMilestoneProjectsFromStorage();
  const projIndex = current.findIndex((p) => p.id === projectId);
  if (projIndex < 0) return { updatedList: current, updatedMilestone: null };

  const project = current[projIndex];
  const mIndex = project.milestones.findIndex((m) => m.id === milestoneId);
  if (mIndex < 0) return { updatedList: current, updatedMilestone: null };

  const target = project.milestones[mIndex];
  const now = new Date().toISOString().replace("T", " ").substring(0, 16);

  const updatedMilestone: Milestone = {
    ...target,
    status: newStatus,
    authorizedAt: newStatus === "authorized" ? now : target.authorizedAt,
    capturedAt: newStatus === "captured" ? now : target.capturedAt,
    refundedAt: newStatus === "refunded" ? now : target.refundedAt,
    history: [
      {
        id: `H-${Date.now()}`,
        timestamp: now,
        action: newStatus,
        fromStatus: target.status,
        toStatus: newStatus,
        userConfirmed: true,
        notes: notes || `Simulated transition: ${target.status} -> ${newStatus}`,
      },
      ...target.history,
    ],
  };

  const updatedMilestones = [...project.milestones];
  updatedMilestones[mIndex] = updatedMilestone;

  const updatedProject = {
    ...project,
    milestones: updatedMilestones,
  };

  const updatedList = [...current];
  updatedList[projIndex] = updatedProject;

  saveMilestoneProjectsToStorage(updatedList);
  return { updatedList, updatedMilestone };
}

/**
 * Server-backed milestone status updater
 */
export async function updateMilestoneLifecycleWithServer(
  projectId: string,
  milestoneId: string,
  newStatus: MilestoneStatus,
  notes?: string
): Promise<{ updatedList: MilestoneProject[]; updatedMilestone: Milestone | null }> {
  try {
    await fetch(`/api/milestones/${encodeURIComponent(milestoneId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, userConfirmed: true, notes }),
    });
  } catch {
    // Offline mode
  }
  return updateMilestoneLifecycleInStorage(projectId, milestoneId, newStatus, notes);
}
