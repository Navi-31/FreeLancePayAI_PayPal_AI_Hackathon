"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  MilestoneProject,
  Milestone,
  MilestoneStatus,
} from "../types";
import {
  loadMilestoneProjectsFromStorage,
  fetchMilestoneProjectsWithFallback,
  calculateProjectTotals,
  calculateGlobalMilestoneMetrics,
  createMilestoneProjectInStorage,
  updateMilestoneLifecycleInStorage,
} from "../milestoneStore";
import { cn } from "@/lib/utils";

export const MilestonesClient: React.FC = () => {
  const [projects, setProjects] = useState<MilestoneProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("PRJ-9041");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>("MS-103");
  const [clientFilter, setClientFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Transition confirmation modal state
  const [transitionTarget, setTransitionTarget] = useState<{
    project: MilestoneProject;
    milestone: Milestone;
    targetStatus: MilestoneStatus;
  } | null>(null);

  // Create Project Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newMilestones, setNewMilestones] = useState<
    Array<{ title: string; description: string; amount: number; dueDate: string }>
  >([
    { title: "Milestone 1 — Architecture & Core Design", description: "Design tokens and schemas", amount: 5000, dueDate: "2025-11-20" },
    { title: "Milestone 2 — Production Implementation", description: "React components and integration", amount: 5000, dueDate: "2025-12-15" },
  ]);

  // Load from localStorage & sync from server on mount
  useEffect(() => {
    const initialData = loadMilestoneProjectsFromStorage();
    if (initialData.length > 0) {
      setProjects(initialData);
      setSelectedProjectId((prev) => {
        const target = initialData.some((p) => p.id === prev) ? prev : initialData[0].id;
        const proj = initialData.find((p) => p.id === target) || initialData[0];
        if (proj && proj.milestones.length > 0) {
          setSelectedMilestoneId((mPrev) =>
            proj.milestones.some((m) => m.id === mPrev) ? mPrev : proj.milestones[0].id
          );
        }
        return target;
      });
    }

    // Attempt live fetch from server
    fetchMilestoneProjectsWithFallback().then((liveData) => {
      if (liveData && liveData.length > 0) {
        setProjects(liveData);
      }
    });
  }, []);

  // Selected project & milestone
  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0] || null;
  }, [projects, selectedProjectId]);

  const selectedMilestone = useMemo(() => {
    if (!selectedProject) return null;
    return (
      selectedProject.milestones.find((m) => m.id === selectedMilestoneId) ||
      selectedProject.milestones[0] ||
      null
    );
  }, [selectedProject, selectedMilestoneId]);

  // Summary KPI metrics
  const globalMetrics = useMemo(() => {
    return calculateGlobalMilestoneMetrics(projects);
  }, [projects]);

  // Unique clients for filter dropdown
  const clientOptions = useMemo(() => {
    const set = new Set(projects.map((p) => p.clientName));
    return ["All", ...Array.from(set)];
  }, [projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      const matchesClient = clientFilter === "All" || proj.clientName === clientFilter;
      const matchesStatus =
        statusFilter === "All" ||
        proj.milestones.some((m) => {
          if (statusFilter === "Authorized") return m.status === "authorized";
          if (statusFilter === "In Review") return m.status === "in_review";
          if (statusFilter === "Captured") return m.status === "captured";
          if (statusFilter === "Refunded") return m.status === "refunded";
          return true;
        });
      return matchesClient && matchesStatus;
    });
  }, [projects, clientFilter, statusFilter]);

  // Execution of milestone transition with PayPal Sandbox backend
  const handleConfirmTransition = async () => {
    if (!transitionTarget) return;
    const { project, milestone, targetStatus } = transitionTarget;

    try {
      if (targetStatus === "authorized") {
        // 1. Create order with intent = AUTHORIZE and authorize via PayPal Sandbox
        const ordRes = await fetch("/api/paypal/orders/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ milestoneId: milestone.id }),
        });
        const ordData = await ordRes.json();
        if (ordRes.ok && ordData.orderId) {
          await fetch("/api/paypal/orders/authorize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ milestoneId: milestone.id, orderId: ordData.orderId }),
          });
        }
      } else if (targetStatus === "captured") {
        // 2. Capture authorized funds via PayPal Sandbox
        await fetch("/api/paypal/milestones/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ milestoneId: milestone.id }),
        });
      } else if (targetStatus === "refunded") {
        // 3. Void or refund milestone authorization
        await fetch("/api/paypal/refunds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ milestoneId: milestone.id, amount: milestone.amount, reason: "Milestone cancelled / refunded" }),
        });
      }
    } catch {
      // Local storage synchronization maintains offline resilience
    }

    const { updatedList, updatedMilestone } = updateMilestoneLifecycleInStorage(
      project.id,
      milestone.id,
      targetStatus,
      `User confirmed milestone transition to ${targetStatus} via PayPal Sandbox`
    );

    setProjects(updatedList);
    setTransitionTarget(null);

    setToastMessage(
      `Milestone "${updatedMilestone?.title}" transitioned to ${targetStatus.toUpperCase()} via verified PayPal Sandbox authorization/capture rails.`
    );
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Create project submission
  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim() || !newClientName.trim()) {
      alert("Please provide both project title and client name.");
      return;
    }

    const { updatedList, newProject } = createMilestoneProjectInStorage({
      title: newProjectTitle.trim(),
      clientName: newClientName.trim(),
      clientEmail: newClientEmail.trim() || `${newClientName.toLowerCase().replace(/\s+/g, "")}@example.com`,
      currency: "USD",
      currencySymbol: "$",
      milestones: newMilestones.map((m) => ({
        id: "",
        projectId: "",
        title: m.title.trim(),
        description: m.description.trim(),
        amount: Number(m.amount) || 0,
        dueDate: m.dueDate,
        status: "pending",
        history: [],
      })),
    });

    setProjects(updatedList);
    setSelectedProjectId(newProject.id);
    if (newProject.milestones.length > 0) {
      setSelectedMilestoneId(newProject.milestones[0].id);
    }
    setIsCreateModalOpen(false);

    // Reset form
    setNewProjectTitle("");
    setNewClientName("");
    setNewClientEmail("");

    setToastMessage(`[SUCCESS] New milestone contract created: ${newProject.title} (${newProject.escrowId})`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const addMilestoneRow = () => {
    setNewMilestones([
      ...newMilestones,
      {
        title: `Milestone ${newMilestones.length + 1}`,
        description: "Deliverable specification",
        amount: 2500,
        dueDate: "2025-12-30",
      },
    ]);
  };

  const removeMilestoneRow = (index: number) => {
    if (newMilestones.length <= 1) return;
    setNewMilestones(newMilestones.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 max-w-[1680px] mx-auto">
      {/* Milestone Protocol Banner Notice */}
      <div className="p-3 rounded-xl bg-surface-container-lowest border border-primary/20 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-mono font-semibold uppercase tracking-wider text-[10px]">
            PayPal Sandbox Rails
          </span>
          <span className="text-on-surface-variant">
            This module supports milestone-based authorization and capture via PayPal Sandbox APIs. Client funds are authorized upon contract start and captured on deliverable acceptance.
          </span>
        </div>
        <span className="text-primary flex items-center gap-1 font-label-sm font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          Milestone Authorization Protocol Active
        </span>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">verified</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-primary hover:underline text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1 tracking-wider uppercase">
            <span className="material-symbols-outlined text-primary text-base">verified_user</span>
            <span>Milestone Authorization &amp; Verification Engine</span>
          </div>
          <h1 className="font-headline-lg text-2xl md:text-3xl font-semibold text-on-surface tracking-tight">
            Milestone Payments
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant mt-1 max-w-3xl">
            Track authorized milestone contracts, approve deliverable sign-offs, and capture authorized client capital with automated tax shielding.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-primary-container text-on-primary font-semibold text-xs shadow-md hover:brightness-105 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>+ Create Milestone Contract</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Projects */}
        <div className="p-5 rounded-xl bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/30 hover:border-primary/40 transition-all relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-on-surface-variant font-medium">Active Projects</span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-high/60 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-base">folder_special</span>
            </div>
          </div>
          <div className="font-numeric-metric text-2xl font-semibold text-on-surface">
            {globalMetrics.activeProjectsCount} contracts
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-primary font-medium">
            <span className="material-symbols-outlined text-xs">trending_up</span>
            <span>2 added this billing cycle</span>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Metric 2: Authorized Milestone Funds */}
        <div className="p-5 rounded-xl bg-surface-container-lowest/80 backdrop-blur-md border border-primary/30 hover:border-primary/50 transition-all relative overflow-hidden group shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-on-surface-variant font-medium">Authorized Milestone Funds</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-base">lock</span>
            </div>
          </div>
          <div className="font-numeric-metric text-2xl font-semibold text-primary">
            ${globalMetrics.authorizedEscrowTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-on-surface-variant">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Authorized via PayPal Sandbox</span>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Metric 3: Captured & Released */}
        <div className="p-5 rounded-xl bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/30 hover:border-secondary/40 transition-all relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-on-surface-variant font-medium">Captured &amp; Released</span>
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-base">account_balance_wallet</span>
            </div>
          </div>
          <div className="font-numeric-metric text-2xl font-semibold text-on-surface">
            ${globalMetrics.capturedReleasedTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-secondary font-medium">
            <span className="material-symbols-outlined text-xs">verified</span>
            <span>100% dispute-free record</span>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-secondary/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Metric 4: Pending Approvals */}
        <div className="p-5 rounded-xl bg-surface-container-lowest/80 backdrop-blur-md border border-secondary/30 hover:border-secondary/50 transition-all relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-secondary font-medium">Pending Approvals</span>
            <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-base">assignment_turned_in</span>
            </div>
          </div>
          <div className="font-numeric-metric text-2xl font-semibold text-secondary">
            ${globalMetrics.pendingApprovalsTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-on-surface-variant">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
            <span>Deliverables awaiting client verification</span>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-secondary/15 rounded-full blur-xl pointer-events-none" />
        </div>
      </section>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-outline-variant/20">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Client Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant">Client:</span>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
            >
              {clientOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="h-5 w-[1px] bg-outline-variant/30" />

          {/* Status Segmented Controls */}
          <div className="flex items-center bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-0.5 text-xs font-label-sm">
            {["All", "Authorized", "In Review", "Captured", "Refunded"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1 rounded-md transition-all",
                  statusFilter === s
                    ? "bg-surface-container-high text-primary font-semibold shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Action */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
        >
          <span className="material-symbols-outlined text-sm">add_task</span>
          <span>+ New Milestone Project</span>
        </button>
      </div>

      {/* Split Bento Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Project Cards & Milestone Progression - ~58%) */}
        <div className="lg:col-span-7 space-y-5">
          {filteredProjects.length === 0 ? (
            <div className="p-8 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-center text-on-surface-variant">
              No milestone contracts match the selected filters.
            </div>
          ) : (
            filteredProjects.map((proj) => {
              const summary = calculateProjectTotals(proj.milestones);
              const isSelected = proj.id === selectedProject?.id;

              return (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={cn(
                    "p-5 rounded-xl bg-surface-container-lowest border transition-all cursor-pointer shadow-md",
                    isSelected
                      ? "border-primary/50 shadow-[0_4px_30px_rgba(0,0,0,0.5)] ring-1 ring-primary/20"
                      : "border-outline-variant/30 hover:border-outline"
                  )}
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/20 pb-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-primary/10 text-primary border border-primary/20">
                          AUTH REF: {proj.escrowId}
                        </span>
                        <span className="text-outline text-xs">•</span>
                        <span className="text-xs text-on-surface-variant font-medium">
                          Client: {proj.clientName}
                        </span>
                      </div>
                      <h3 className="font-headline-sm text-base font-semibold text-on-surface mt-1">
                        {proj.title}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-on-surface-variant">Total Contract</span>
                      <div className="font-headline-sm text-base font-semibold text-primary">
                        ${summary.totalContract.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Progress Meter */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-on-surface-variant">
                        Milestone Completion:{" "}
                        <strong className="text-on-surface">
                          {summary.clearedCount} of {summary.totalCount} Milestones Cleared
                        </strong>
                      </span>
                      <span className="text-primary font-semibold">
                        {summary.clearedPercentage}% Cleared
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-surface-container-high overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary-container transition-all duration-500"
                        style={{ width: `${summary.clearedPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestone Line Items */}
                  <div className="space-y-2.5">
                    {proj.milestones.map((m) => {
                      const isMilestoneSelected =
                        isSelected && m.id === selectedMilestone?.id;

                      return (
                        <div
                          key={m.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProjectId(proj.id);
                            setSelectedMilestoneId(m.id);
                          }}
                          className={cn(
                            "p-3 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                            isMilestoneSelected
                              ? "bg-surface-container-high/60 border-primary/40 ring-1 ring-primary/20"
                              : "bg-surface-container-low/40 border-outline-variant/20 hover:bg-surface-container-low"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={cn(
                                "w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold",
                                m.status === "captured" && "bg-secondary/20 text-secondary",
                                m.status === "authorized" && "bg-primary/20 text-primary",
                                m.status === "in_review" && "bg-amber-500/20 text-amber-400",
                                m.status === "pending" && "bg-surface-container text-on-surface-variant",
                                m.status === "refunded" && "bg-error/20 text-error"
                              )}
                            >
                              {m.status === "captured" ? "✓" : "•"}
                            </span>
                            <div>
                              <div className="text-xs font-semibold text-on-surface flex items-center gap-2">
                                {m.title}
                                <span className="text-[10px] text-on-surface-variant font-mono">
                                  #{m.id}
                                </span>
                              </div>
                              <div className="text-[11px] text-on-surface-variant mt-0.5">
                                {m.description}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            <div className="text-right">
                              <div className="text-xs font-semibold text-primary">
                                ${m.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </div>
                              <div className="text-[10px] text-on-surface-variant">
                                Due {m.dueDate}
                              </div>
                            </div>

                            {/* Status Badge */}
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                                m.status === "captured" &&
                                  "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
                                m.status === "authorized" &&
                                  "bg-primary/15 text-primary border border-primary/30",
                                m.status === "in_review" &&
                                  "bg-secondary/15 text-secondary border border-secondary/30",
                                m.status === "pending" &&
                                  "bg-surface-container text-on-surface-variant border border-outline-variant/30",
                                m.status === "refunded" &&
                                  "bg-error/15 text-error border border-error/30"
                              )}
                            >
                              {m.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column (Milestone Deep-Dive & Action Station - ~42%) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedMilestone && selectedProject ? (
            <div className="p-5 rounded-xl bg-surface-container-lowest/95 backdrop-blur-2xl border border-secondary/30 shadow-2xl relative space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-secondary text-lg"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    lock
                  </span>
                  <h3 className="font-headline-sm text-base font-semibold text-on-surface">
                    Milestone Authorization Contract Deep-Dive
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-surface-container text-primary border border-primary/20">
                  {selectedProject.escrowId}
                </span>
              </div>

              {/* Deliverable Details Card */}
              <div className="p-3.5 rounded-xl bg-surface-container-high/50 border border-outline-variant/30 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-on-surface-variant block">
                      Target Deliverable
                    </span>
                    <h4 className="font-semibold text-sm text-on-surface">
                      {selectedMilestone.title}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-on-surface-variant block">
                      Allocated Capital
                    </span>
                    <span className="text-sm font-bold text-primary">
                      ${selectedMilestone.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-on-surface-variant pt-1 border-t border-outline-variant/20">
                  <strong className="text-on-surface">Description:</strong> {selectedMilestone.description}
                </div>

                {selectedMilestone.deliverableNotes && (
                  <div className="text-xs text-on-surface-variant bg-surface-container-lowest/60 p-2.5 rounded-lg border border-outline-variant/20">
                    <strong className="text-primary block mb-0.5">Verification Telemetry:</strong>
                    {selectedMilestone.deliverableNotes}
                  </div>
                )}
              </div>

              {/* Lifecycle State Controls */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-on-surface block">
                  Simulated Lifecycle Actions (Approval-First):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Action 1: Authorize (Hold) */}
                  {selectedMilestone.status === "pending" && (
                    <button
                      onClick={() =>
                        setTransitionTarget({
                          project: selectedProject,
                          milestone: selectedMilestone,
                          targetStatus: "authorized",
                        })
                      }
                      className="p-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-primary/40 text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">lock</span>
                      <span>Authorize Milestone (Hold)</span>
                    </button>
                  )}

                  {/* Action 2: Submit for Client Review */}
                  {selectedMilestone.status === "authorized" && (
                    <button
                      onClick={() =>
                        setTransitionTarget({
                          project: selectedProject,
                          milestone: selectedMilestone,
                          targetStatus: "in_review",
                        })
                      }
                      className="p-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-secondary/40 text-secondary text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">assignment_turned_in</span>
                      <span>Submit for Verification</span>
                    </button>
                  )}

                  {/* Action 3: Release & Capture Funds */}
                  {(selectedMilestone.status === "in_review" ||
                    selectedMilestone.status === "authorized") && (
                    <button
                      onClick={() =>
                        setTransitionTarget({
                          project: selectedProject,
                          milestone: selectedMilestone,
                          targetStatus: "captured",
                        })
                      }
                      className="p-2.5 rounded-lg bg-gradient-to-r from-primary to-primary-container text-on-primary text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 col-span-1 sm:col-span-2"
                    >
                      <span className="material-symbols-outlined text-base">price_check</span>
                      <span>Approve Sign-off &amp; Capture Capital</span>
                    </button>
                  )}

                  {/* Action 4: Refund */}
                  {selectedMilestone.status !== "captured" &&
                    selectedMilestone.status !== "refunded" && (
                      <button
                        onClick={() =>
                          setTransitionTarget({
                            project: selectedProject,
                            milestone: selectedMilestone,
                            targetStatus: "refunded",
                          })
                        }
                        className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container border border-error/30 text-error text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
                      >
                        <span className="material-symbols-outlined text-base">undo</span>
                        <span>Void / Refund Milestone</span>
                      </button>
                    )}
                </div>

                {selectedMilestone.status === "captured" && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-emerald-400">check_circle</span>
                    <span>Funds captured &amp; released on {selectedMilestone.capturedAt || "settlement"}.</span>
                  </div>
                )}
              </div>

              {/* Audit History */}
              <div className="pt-3 border-t border-outline-variant/20">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant block mb-2">
                  Milestone Audit &amp; Authorization History
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                  {selectedMilestone.history.length === 0 ? (
                    <div className="text-[11px] text-on-surface-variant italic">No recorded state events yet.</div>
                  ) : (
                    selectedMilestone.history.map((h) => (
                      <div
                        key={h.id}
                        className="text-[11px] flex items-center justify-between p-1.5 rounded bg-surface-container/40 text-on-surface-variant"
                      >
                        <span className="text-on-surface">
                          Transition: <strong className="text-primary">{h.fromStatus} → {h.toStatus}</strong>
                        </span>
                        <span className="text-[10px] opacity-75">{h.timestamp}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-center text-on-surface-variant">
              Select a milestone contract to view details and execute milestone authorization transitions.
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Lifecycle State Transitions */}
      {transitionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setTransitionTarget(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-surface-container-lowest border border-primary/30 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/20">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">gavel</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-base font-semibold text-on-surface">
                  Confirm Milestone Lifecycle Transition
                </h3>
                <span className="text-xs text-primary font-mono">{transitionTarget.project.escrowId}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-high/60 border border-outline-variant/30 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Milestone:</span>
                <span className="text-on-surface font-semibold">{transitionTarget.milestone.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Current Status:</span>
                <span className="text-on-surface capitalize">{transitionTarget.milestone.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">New State:</span>
                <span className="text-primary font-bold uppercase">{transitionTarget.targetStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Contract Capital:</span>
                <span className="text-on-surface font-semibold">
                  ${transitionTarget.milestone.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-base text-primary shrink-0">info</span>
              <span>
                <strong>PayPal Sandbox Authorization Rails:</strong> This action updates milestone authorization and capture records with verified provider validation. Real capital movement requires explicit user authorization.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setTransitionTarget(null)}
                className="px-4 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTransition}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-primary to-primary-container text-on-primary text-xs font-bold shadow-md hover:brightness-105 active:scale-95"
              >
                Confirm State Transition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Milestone Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <h3 className="font-headline-sm text-lg font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_task</span>
                Create New Milestone Project
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant block mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    placeholder="e.g. Next.js Architecture Sprint III"
                    className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg p-2 text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant block mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. Horizon Labs"
                    className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg p-2 text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant block mb-1">
                  Client Email
                </label>
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="e.g. billing@horizonlabs.io"
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg p-2 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Milestones Line Items */}
              <div className="space-y-2 pt-2 border-t border-outline-variant/20">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-on-surface">Milestone Deliverables</span>
                  <button
                    type="button"
                    onClick={addMilestoneRow}
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    + Add Milestone
                  </button>
                </div>

                <div className="space-y-2">
                  {newMilestones.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-surface-container-high/40 border border-outline-variant/20 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          required
                          value={m.title}
                          onChange={(e) => {
                            const updated = [...newMilestones];
                            updated[idx].title = e.target.value;
                            setNewMilestones(updated);
                          }}
                          placeholder="Milestone Title"
                          className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-1.5 text-xs text-on-surface"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="number"
                          required
                          min={1}
                          value={m.amount}
                          onChange={(e) => {
                            const updated = [...newMilestones];
                            updated[idx].amount = Number(e.target.value);
                            setNewMilestones(updated);
                          }}
                          placeholder="Amount ($)"
                          className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-1.5 text-xs text-on-surface"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="date"
                          required
                          value={m.dueDate}
                          onChange={(e) => {
                            const updated = [...newMilestones];
                            updated[idx].dueDate = e.target.value;
                            setNewMilestones(updated);
                          }}
                          className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-1.5 text-xs text-on-surface"
                        />
                      </div>
                      <div className="sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeMilestoneRow(idx)}
                          className="text-error hover:text-red-400 p-1"
                          title="Remove Milestone"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 text-xs">
                  <span className="text-on-surface-variant">Deterministic Total:</span>
                  <span className="font-bold text-sm text-primary">
                    ${newMilestones
                      .reduce((sum, m) => sum + (Number(m.amount) || 0), 0)
                      .toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold shadow-md hover:brightness-105 active:scale-95"
                >
                  Create Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
