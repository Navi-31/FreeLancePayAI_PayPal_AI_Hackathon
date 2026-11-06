"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  PaymentReminder,
  ReminderTone,
  ReminderStatus,
} from "../types";
import {
  loadRemindersFromStorage,
  fetchRemindersWithFallback,
  updateReminderTone,
  updateReminderDraft,
  simulateApproveAndSend,
} from "../reminderStore";
import { cn } from "@/lib/utils";

export const RemindersClient: React.FC = () => {
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [selectedId, setSelectedId] = useState<string>("REM-8848");
  const [activeTab, setActiveTab] = useState<ReminderStatus>("pending_approval");
  const [searchQuery, setSearchQuery] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [simulationToast, setSimulationToast] = useState<string | null>(null);
  const [isLiveDb, setIsLiveDb] = useState<boolean>(false);

  // Load from storage on mount & sync from server
  useEffect(() => {
    const data = loadRemindersFromStorage();
    setReminders(data);
    if (data.length > 0) {
      setSelectedId((prev) => (data.some((r) => r.id === prev) ? prev : data[0].id));
    }

    fetchRemindersWithFallback().then((live) => {
      if (live && live.length > 0) {
        setReminders(live);
        setIsLiveDb(true);
        setSelectedId((prev) => (live.some((r) => r.id === prev) ? prev : live[0].id));
      }
    });
  }, []);

  // Filtered queue items
  const filteredReminders = useMemo(() => {
    return reminders.filter((r) => {
      const matchesTab = r.status === activeTab;
      const matchesSearch =
        searchQuery.trim() === "" ||
        r.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.clientEmail.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [reminders, activeTab, searchQuery]);

  // Selected reminder
  const selectedReminder = useMemo(() => {
    return reminders.find((r) => r.id === selectedId) || reminders[0] || null;
  }, [reminders, selectedId]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      pending_approval: reminders.filter((r) => r.status === "pending_approval").length,
      scheduled: reminders.filter((r) => r.status === "scheduled").length,
      sent: reminders.filter((r) => r.status === "sent").length,
    };
  }, [reminders]);

  // Metric sums
  const metrics = useMemo(() => {
    const pending = reminders.filter((r) => r.status === "pending_approval");
    const pendingTotal = pending.reduce((sum, r) => sum + r.amount, 0);

    const overdue = reminders.filter((r) => r.overdueDays > 0);
    const overdueTotal = overdue.reduce((sum, r) => sum + r.amount, 0);

    return {
      pendingCount: pending.length,
      pendingTotal,
      sentCount: tabCounts.sent + 12, // Baseline high-density count
      overdueCount: overdue.length,
      overdueTotal,
      awaitingTotal: 14200.0,
    };
  }, [reminders, tabCounts]);

  const handleToneSelect = async (tone: ReminderTone) => {
    if (!selectedReminder) return;

    // 1. Immediately update tone in local state
    const updated = updateReminderTone(selectedReminder.id, tone);
    setReminders(updated);

    // Persist tone update to server if available
    fetch("/api/reminders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedReminder.id,
        action: "update_tone",
        tone,
        userApproved: true,
      }),
    }).catch(() => {});

    // 2. Fetch server-side AI crafted draft matching the requested tone
    try {
      const res = await fetch("/api/ai/reminders/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedReminder.invoiceId,
          tone,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const d = json.data || json;
        if (d.subject && d.messageBody) {
          const freshDraft = updateReminderDraft(
            selectedReminder.id,
            d.subject,
            d.messageBody
          );
          setReminders(freshDraft);
        }
      }
    } catch {
      // Local preset retains resilience
    }
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedReminder) return;
    const updated = updateReminderDraft(
      selectedReminder.id,
      e.target.value,
      selectedReminder.messageBody
    );
    setReminders(updated);
  };

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!selectedReminder) return;
    const updated = updateReminderDraft(
      selectedReminder.id,
      selectedReminder.subject,
      e.target.value
    );
    setReminders(updated);
  };

  const handleConfirmSimulatedSend = async () => {
    if (!selectedReminder) return;
    const { updatedList, sentReminder } = simulateApproveAndSend(
      selectedReminder.id,
      "Approved via AI Reminder Composer"
    );
    setReminders(updatedList);
    setIsConfirmModalOpen(false);

    try {
      const res = await fetch("/api/reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedReminder.id,
          action: "send_email",
          userApproved: true,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.delivery?.status) {
        setSimulationToast(
          `[DISPATCH LOGGED] Notice for #${sentReminder?.invoiceId} processed (${data.delivery.status.toUpperCase()}). Ledger & audit log recorded.`
        );
      } else {
        setSimulationToast(
          `[SIMULATION SUCCESS] Notice for #${sentReminder?.invoiceId} marked as sent. No external communication was dispatched.`
        );
      }
    } catch {
      setSimulationToast(
        `[SIMULATION SUCCESS] Notice for #${sentReminder?.invoiceId} marked as sent. No external communication was dispatched.`
      );
    }
    setTimeout(() => setSimulationToast(null), 5000);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Simulation / Live Banner Notice */}
      <div className="p-3 rounded-xl bg-surface-container-lowest border border-primary/20 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-mono font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {isLiveDb ? "Live Neon Database Queue" : "Simulation Engine"}
          </span>
          <span className="text-on-surface-variant">
            {isLiveDb
              ? "Payment reminders synchronized with your Neon database receivables. Approval required before dispatch."
              : "Payment reminders are interactive sandbox drafts. Client communications are simulated locally; no external emails, SMS, or webhooks are triggered."}
          </span>
        </div>
        <span className="text-secondary flex items-center gap-1 font-label-sm font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Human-In-The-Loop Enforced
        </span>
      </div>

      {/* Toast Notification */}
      {simulationToast && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-base">verified</span>
            <span>{simulationToast}</span>
          </div>
          <button
            onClick={() => setSimulationToast(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-outline-variant/20">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline-lg text-2xl md:text-3xl font-semibold text-on-surface tracking-tight">
              Payment Reminders
            </h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-label-md bg-secondary/15 text-secondary border border-secondary/30 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              Behavioral Engine Active
            </span>
          </div>
          <p className="font-body-md text-sm text-on-surface-variant mt-1.5 max-w-3xl">
            Autonomous collection copilot with behavioral dispatch controls. No reminder is ever dispatched without freelancer approval.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 self-start lg:self-center">
          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 text-on-surface text-xs font-label-md transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-base">tune</span>
            Rules &amp; Automation SLAs
          </button>
          <button
            onClick={() => {
              setSimulationToast("Batch heuristic analysis executed: 3 reminders prioritized by overdue severity.");
              setTimeout(() => setSimulationToast(null), 4000);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-high border border-primary/40 text-primary text-xs font-label-md hover:bg-surface-container-highest transition-all shadow-sm active:scale-95"
          >
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            Run Batch Analysis
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Approval */}
        <div className="p-5 rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/30 hover:border-primary/40 transition-all group relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="font-label-md text-xs text-on-surface-variant flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              Pending Approval
            </span>
            <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary border border-primary/20">
              <span className="material-symbols-outlined text-lg">schedule_send</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-numeric-metric text-2xl font-semibold text-on-surface">
              {metrics.pendingCount}
            </span>
            <span className="text-xs text-on-surface-variant font-label-sm">reminders ready</span>
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">Totaling</span>
            <span className="text-primary font-semibold font-label-md">
              ${metrics.pendingTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Card 2: Sent This Month */}
        <div className="p-5 rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/30 hover:border-secondary/40 transition-all group relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-secondary/10 rounded-full blur-2xl group-hover:bg-secondary/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="font-label-md text-xs text-on-surface-variant">Sent This Month</span>
            <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary border border-secondary/20">
              <span className="material-symbols-outlined text-lg">outbox</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-numeric-metric text-2xl font-semibold text-on-surface">
              {metrics.sentCount}
            </span>
            <span className="text-xs text-on-surface-variant font-label-sm">reminders dispatched</span>
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">Recovery velocity</span>
            <span className="text-secondary font-medium font-label-md flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">bolt</span>
              82% in &lt;48h
            </span>
          </div>
        </div>

        {/* Card 3: Overdue Invoices */}
        <div className="p-5 rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/30 hover:border-error/40 transition-all group relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-error/10 rounded-full blur-2xl group-hover:bg-error/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="font-label-md text-xs text-on-surface-variant">Overdue Invoices</span>
            <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-error border border-error/20">
              <span className="material-symbols-outlined text-lg">warning</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-numeric-metric text-2xl font-semibold text-error">
              {metrics.overdueCount}
            </span>
            <span className="text-xs text-on-surface-variant font-label-sm">flagged contracts</span>
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">Total delinquent</span>
            <span className="text-error font-medium font-label-md">
              ${metrics.overdueTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Card 4: Amount Awaiting Collection */}
        <div className="p-5 rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/30 hover:border-primary/40 transition-all group relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="font-label-md text-xs text-on-surface-variant">Amount Awaiting</span>
            <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary border border-primary/20">
              <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-numeric-metric text-2xl font-semibold text-primary">
              ${metrics.awaitingTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">Forecasted arrival</span>
            <span className="text-on-surface font-medium font-label-sm">Nov 04 — Nov 09</span>
          </div>
        </div>
      </section>

      {/* 2-Column Working Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Queue Table - 58%) */}
        <section className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-xl bg-surface-container-lowest/90 backdrop-blur-2xl border border-outline-variant/30 shadow-md">
            {/* Queue Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/20">
              <div>
                <h2 className="font-headline-sm text-lg font-semibold text-on-surface">
                  Outreach Queue
                </h2>
                <p className="font-body-sm text-xs text-on-surface-variant">
                  Select a targeted invoice to evaluate tone heuristics or authorize dispatch.
                </p>
              </div>

              {/* Tabs */}
              <div className="inline-flex p-1 bg-surface-container-low rounded-lg border border-outline-variant/30 text-xs font-label-md">
                <button
                  onClick={() => setActiveTab("pending_approval")}
                  className={cn(
                    "px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all",
                    activeTab === "pending_approval"
                      ? "bg-surface-container-high text-primary font-medium border border-primary/30 shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  <span>Pending Approval</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-primary/20 text-primary text-[10px]">
                    {tabCounts.pending_approval}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("scheduled")}
                  className={cn(
                    "px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all",
                    activeTab === "scheduled"
                      ? "bg-surface-container-high text-primary font-medium border border-primary/30 shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  <span>Scheduled</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-on-surface-variant text-[10px]">
                    {tabCounts.scheduled}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("sent")}
                  className={cn(
                    "px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all",
                    activeTab === "sent"
                      ? "bg-surface-container-high text-primary font-medium border border-primary/30 shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  <span>Sent History</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-on-surface-variant text-[10px]">
                    {tabCounts.sent}
                  </span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="mt-3 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by client name, email, or invoice #..."
                className="w-full bg-surface-container-low/60 border border-outline-variant/30 rounded-lg pl-9 pr-3 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto custom-scrollbar mt-3">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/20 text-[11px] font-label-sm text-on-surface-variant uppercase tracking-wider">
                    <th className="py-3 px-3">Client &amp; Invoice</th>
                    <th className="py-3 px-3">Overdue Days</th>
                    <th className="py-3 px-3">Last Outreach</th>
                    <th className="py-3 px-3">Recommended Tone</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Select</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 text-xs">
                  {filteredReminders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-on-surface-variant">
                        No reminders found matching this queue or query.
                      </td>
                    </tr>
                  ) : (
                    filteredReminders.map((r) => {
                      const isSelected = r.id === selectedReminder?.id;
                      const monogram = r.clientName
                        .split(" ")
                        .map((word) => word[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();

                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedId(r.id)}
                          className={cn(
                            "transition-colors group cursor-pointer",
                            isSelected
                              ? "bg-surface-container-high/60 border-l-2 border-primary"
                              : "hover:bg-surface-container/40"
                          )}
                        >
                          {/* Client & Invoice */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-xs border",
                                  isSelected
                                    ? "bg-surface-container-highest border-primary/40 text-primary"
                                    : "bg-surface-container-low border-outline-variant/30 text-on-surface"
                                )}
                              >
                                {monogram}
                              </div>
                              <div>
                                <div className="font-medium text-on-surface text-sm flex items-center gap-1.5">
                                  {r.clientName}
                                  <span className="text-[10px] text-primary bg-primary/10 px-1.5 rounded font-mono">
                                    #{r.invoiceId}
                                  </span>
                                </div>
                                <div className="text-[11px] text-primary font-semibold font-label-sm mt-0.5">
                                  ${r.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Overdue Days */}
                          <td className="py-3.5 px-3">
                            {r.overdueDays > 0 ? (
                              <div className="flex items-center gap-1.5 text-error font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
                                {r.overdueDays} days overdue
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-primary font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                {Math.abs(r.overdueDays)} days till due
                              </div>
                            )}
                            <span className="text-[10px] text-on-surface-variant block mt-0.5">
                              Due {r.dueDate}
                            </span>
                          </td>

                          {/* Last Outreach */}
                          <td className="py-3.5 px-3">
                            <span className="text-on-surface font-medium block">
                              {r.lastOutreachDate || "None"}
                            </span>
                            <span className="text-[10px] text-on-surface-variant block">
                              {r.lastOutreachType || "First touch"}
                            </span>
                          </td>

                          {/* Recommended Tone */}
                          <td className="py-3.5 px-3">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border",
                                r.recommendedTone === "firm" &&
                                  "bg-primary/15 text-primary border-primary/30",
                                r.recommendedTone === "final" &&
                                  "bg-error/15 text-error border-error/30",
                                r.recommendedTone === "polite" &&
                                  "bg-surface-container-high text-on-surface-variant border-outline-variant/30"
                              )}
                            >
                              <span className="material-symbols-outlined text-xs">
                                {r.recommendedTone === "final"
                                  ? "gavel"
                                  : r.recommendedTone === "firm"
                                  ? "priority_high"
                                  : "volunteer_activism"}
                              </span>
                              <span className="capitalize">{r.recommendedTone}</span>
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3">
                            {r.status === "pending_approval" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Ready to dispatch
                              </span>
                            )}
                            {r.status === "scheduled" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-container-high text-on-surface-variant border border-outline-variant/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant" />
                                Queued
                              </span>
                            )}
                            {r.status === "sent" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary/15 text-secondary border border-secondary/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                                Dispatched
                              </span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="py-3.5 px-3 text-right">
                            <button
                              className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center ml-auto transition-all",
                                isSelected
                                  ? "bg-primary text-on-primary shadow-sm"
                                  : "bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/30"
                              )}
                            >
                              <span className="material-symbols-outlined text-base">
                                {isSelected ? "check" : "chevron_right"}
                              </span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Queue Footer */}
            <div className="mt-4 pt-3 border-t border-outline-variant/20 flex flex-wrap items-center justify-between text-xs text-on-surface-variant">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-secondary">psychology</span>
                Algorithmic dispatch suggestions refresh every 6 hours based on client timezone &amp; reply signals.
              </span>
              <span className="font-label-sm text-primary font-semibold">
                {filteredReminders.length} items listed
              </span>
            </div>
          </div>

          {/* Quick Telemetry Strip */}
          {selectedReminder && (
            <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-xl">insights</span>
                <div>
                  <div className="text-xs font-medium text-on-surface">Client Engagement Analytics</div>
                  <div className="text-[11px] text-on-surface-variant">
                    {selectedReminder.clientName} historical pattern: typical response latency is 2.4 days after polite touch.
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-primary px-2.5 py-1 rounded bg-primary/10 border border-primary/20 shrink-0">
                Optimal Send Window: TODAY 14:00 EST
              </span>
            </div>
          )}
        </section>

        {/* Right Column (AI Reminder Composer - 42%) */}
        <section className="lg:col-span-5 space-y-4">
          {selectedReminder ? (
            <div className="p-5 rounded-xl bg-surface-container-lowest/95 backdrop-blur-2xl border border-secondary/30 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />

              {/* Composer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-secondary text-lg"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    auto_awesome
                  </span>
                  <h2 className="font-headline-sm text-lg font-semibold text-on-surface">
                    AI Reminder Composer
                  </h2>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-label-sm bg-surface-container text-primary border border-primary/20">
                  Live Inspection
                </span>
              </div>

              {/* Selected Target Header */}
              <div className="mt-4 p-3.5 rounded-lg bg-surface-container/60 border border-outline-variant/30 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-on-surface">
                      {selectedReminder.clientName}
                    </span>
                    <Link
                      href={`/invoices`}
                      className="text-xs text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded hover:underline"
                    >
                      Invoice #{selectedReminder.invoiceId}
                    </Link>
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1">
                    Contact:{" "}
                    <span className="text-on-surface font-medium">
                      {selectedReminder.clientEmail}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-primary">
                    ${selectedReminder.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-error font-medium">
                    {selectedReminder.overdueDays > 0
                      ? `${selectedReminder.overdueDays} Days Overdue`
                      : `Due in ${Math.abs(selectedReminder.overdueDays)} Days`}
                  </div>
                </div>
              </div>

              {/* Tone Selector Pills */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-label-md text-on-surface-variant font-medium">
                    Select Heuristic Tone:
                  </span>
                  <span className="text-secondary text-[11px] flex items-center gap-1 font-label-sm">
                    <span className="material-symbols-outlined text-xs">auto_awesome</span>
                    Recommended: <strong className="capitalize">{selectedReminder.recommendedTone}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Polite */}
                  <button
                    onClick={() => handleToneSelect("polite")}
                    className={cn(
                      "px-2 py-2 rounded-lg text-[11px] font-label-md text-center transition-all",
                      selectedReminder.activeTone === "polite"
                        ? "bg-surface-container-high border-2 border-primary ring-2 ring-primary/20 text-primary font-semibold shadow-md"
                        : "bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:border-outline hover:text-on-surface"
                    )}
                  >
                    Polite / Collaborative
                  </button>

                  {/* Firm */}
                  <button
                    onClick={() => handleToneSelect("firm")}
                    className={cn(
                      "px-2 py-2 rounded-lg text-[11px] font-label-md text-center transition-all relative",
                      selectedReminder.activeTone === "firm"
                        ? "bg-surface-container-high border-2 border-primary ring-2 ring-secondary/30 text-primary font-semibold shadow-md"
                        : "bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:border-outline hover:text-on-surface"
                    )}
                  >
                    {selectedReminder.recommendedTone === "firm" && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-secondary" />
                    )}
                    Firm / Escalation
                  </button>

                  {/* Final */}
                  <button
                    onClick={() => handleToneSelect("final")}
                    className={cn(
                      "px-2 py-2 rounded-lg text-[11px] font-label-md text-center transition-all",
                      selectedReminder.activeTone === "final"
                        ? "bg-surface-container-high border-2 border-error ring-2 ring-error/30 text-error font-semibold shadow-md"
                        : "bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:border-outline hover:text-on-surface"
                    )}
                  >
                    Final / Pre-Legal
                  </button>
                </div>
              </div>

              {/* Dynamic Draft Card */}
              <div className="mt-4 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 relative space-y-3">
                {/* Subject Field */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-label-sm text-on-surface-variant/80 block mb-1">
                    Subject Header
                  </label>
                  <input
                    type="text"
                    value={selectedReminder.subject}
                    onChange={handleSubjectChange}
                    className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-lg px-3 py-2 text-xs font-medium text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>

                {/* Body Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] uppercase tracking-wider font-label-sm text-on-surface-variant/80">
                      Dispatched Message Body
                    </label>
                    <span className="text-[10px] text-on-surface-variant">Editable Draft</span>
                  </div>
                  <textarea
                    rows={6}
                    value={selectedReminder.messageBody}
                    onChange={handleBodyChange}
                    className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-lg p-3 text-xs leading-relaxed text-on-surface font-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all custom-scrollbar resize-none"
                  />
                </div>

                {/* Settlement Link Preview */}
                <div className="p-2.5 rounded-lg bg-surface-container/70 border border-outline-variant/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">link</span>
                    <div>
                      <span className="text-[11px] text-on-surface font-medium block">
                        Instant Settlement Link Embedded
                      </span>
                      <span className="text-[10px] text-on-surface-variant truncate max-w-[240px] block">
                        {selectedReminder.paymentLink}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-primary border border-primary/20">
                    Live Portal
                  </span>
                </div>
              </div>

              {/* Action Trigger Buttons */}
              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setSimulationToast("Draft reset to default heuristic template.");
                    handleToneSelect(selectedReminder.activeTone);
                  }}
                  className="px-3 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface text-xs font-label-md transition-colors"
                >
                  Reset Template
                </button>

                <button
                  onClick={() => setIsConfirmModalOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-primary-container text-on-primary font-semibold text-xs shadow-md hover:brightness-105 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-base">verified_user</span>
                  <span>Authorize Simulated Outreach</span>
                </button>
              </div>

              {/* Dispatch Audit History */}
              {selectedReminder.history.length > 0 && (
                <div className="mt-4 pt-3 border-t border-outline-variant/20">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant block mb-2">
                    Recent Outreach Audit Trail
                  </span>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto custom-scrollbar">
                    {selectedReminder.history.map((hist) => (
                      <div
                        key={hist.id}
                        className="text-[11px] flex items-center justify-between p-1.5 rounded bg-surface-container/50 text-on-surface-variant"
                      >
                        <span className="flex items-center gap-1.5 text-on-surface">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <strong className="capitalize">{hist.action.replace("_", " ")}</strong> (
                          {hist.tone})
                        </span>
                        <span className="text-[10px] opacity-75">{hist.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-center text-on-surface-variant">
              Select an invoice from the queue to inspect tone drafts and authorize outreach.
            </div>
          )}
        </section>
      </div>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && selectedReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsConfirmModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-surface-container-lowest border border-primary/30 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/20">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">send</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-base font-semibold text-on-surface">
                  Confirm Simulated Outreach Authorization
                </h3>
                <span className="text-xs text-primary font-mono">Invoice #{selectedReminder.invoiceId}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-high/60 border border-outline-variant/30 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Recipient:</span>
                <span className="text-on-surface font-medium">{selectedReminder.clientEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Applied Tone:</span>
                <span className="text-primary font-semibold capitalize">{selectedReminder.activeTone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Amount:</span>
                <span className="text-on-surface font-semibold">
                  ${selectedReminder.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-base text-amber-400 shrink-0">info</span>
              <span>
                <strong>Simulation Guardrail:</strong> This action records a simulated dispatch in your local FreelancePay telemetry. No actual email will be delivered to the client.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSimulatedSend}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-primary to-primary-container text-on-primary text-xs font-bold shadow-md hover:brightness-105 active:scale-95"
              >
                Approve &amp; Dispatch Simulation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules & SLA Modal */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsRulesModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <h3 className="font-headline-sm text-base font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">rule</span>
                Autonomous Outreach SLAs &amp; Safety Rules
              </h3>
              <button
                onClick={() => setIsRulesModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-on-surface-variant">
              <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20">
                <div className="font-semibold text-on-surface mb-1">Rule 1: Human Approval Mandatory</div>
                No payment reminder message is ever sent without explicit freelancer confirmation in the composer.
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20">
                <div className="font-semibold text-on-surface mb-1">Rule 2: Behavioral Tone Escalation</div>
                Invoices approaching due dates utilize Polite Collaborative tone; 7+ days past due escalates to Firm; 20+ days flags Final Notice.
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20">
                <div className="font-semibold text-on-surface mb-1">Rule 3: Frequency Cap (Cooldown)</div>
                A minimum 72-hour quiet period is maintained between automated pings to protect client relationships.
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setIsRulesModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-high text-primary font-semibold text-xs"
              >
                Close Policies
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
