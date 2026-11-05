"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type StrategyType = "split_installments" | "prompt_discount" | "waive_surcharge";

export const NegotiatorClient: React.FC = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType>("split_installments");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isProposalSent, setIsProposalSent] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const proposalDrafts: Record<StrategyType, { title: string; subject: string; body: string; recoveryAmount: number }> = {
    split_installments: {
      title: "Split into 2 Bi-Weekly Milestones",
      subject: "Proposal: Structured 2-Part Settlement for Invoice #FP-8848 (Acme Corp)",
      body: "Hi Sarah,\n\nIn light of your team's ongoing review of Invoice #FP-8848 ($1,500.00), we understand corporate Q4 cash-allocation timelines can fluctuate. To assist your AP cycle and prevent standard late surcharges, we propose restructuring this balance into two equal installments:\n\n• Tranche 1: $750.00 due this Friday, Oct 24\n• Tranche 2: $750.00 due Friday, Nov 07\n\nPlease let us know if this works so we can formalize this agreement in your settlement portal.\n\nBest regards,",
      recoveryAmount: 1500,
    },
    prompt_discount: {
      title: "5% Prompt Remittance Discount",
      subject: "Expedited Settlement Option: Invoice #FP-8848 (Acme Corp)",
      body: "Hi Sarah,\n\nTo expedite signoff on Invoice #FP-8848 ($1,500.00), we are offering an immediate 5% early settlement discount ($75.00 deduction). Remitting $1,425.00 via verified wire or PayPal within the next 24 hours will settle this account in full with zero late fees.\n\nPlease confirm if AP can execute this today.\n\nBest regards,",
      recoveryAmount: 1425,
    },
    waive_surcharge: {
      title: "Waive Accrued Late Surcharges",
      subject: "Conditional Surcharge Waiver: Invoice #FP-8848 (Acme Corp)",
      body: "Hi Sarah,\n\nFollowing up on overdue Invoice #FP-8848 ($1,500.00), which has currently accrued $75.00 in late fees. We value our creative partnership and are prepared to waive all accrued surcharges provided the principal balance of $1,500.00 is settled by end-of-week.\n\nThank you for your prompt response,\nBest regards,",
      recoveryAmount: 1500,
    },
  };

  const currentDraft = proposalDrafts[selectedStrategy];

  const handleApproveProposal = () => {
    setIsProposalSent(true);
    setIsConfirmModalOpen(false);
    setToastMessage(
      `[SIMULATION SUCCESS] Settlement proposal "${currentDraft.title}" authorized. Simulated delivery recorded in negotiation audit log.`
    );
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-base">verified</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 font-semibold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Breadcrumb & Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-outline-variant/20">
        <div>
          <div className="flex items-center gap-2 text-outline text-xs mb-1">
            <span>Intelligence</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary font-medium">Payment Negotiator</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-outline">Autonomous Delinquency Engine</span>
          </div>
          <h1 className="font-headline-lg text-2xl md:text-3xl font-semibold tracking-tight text-on-surface">
            AI Payment Negotiator
          </h1>
          <p className="text-sm text-on-surface-variant max-w-3xl mt-1">
            Recover delinquent balances through algorithmic settlement strategies and human-in-the-loop dispute resolution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container/60 border border-secondary/30 text-secondary text-xs">
            <span className="material-symbols-outlined text-sm text-secondary animate-pulse">lock_open</span>
            <span>Escrow Guard Active</span>
          </div>
          <Link
            href="/reminders"
            className="px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-on-surface text-xs font-medium transition-all"
          >
            Outreach Reminders
          </Link>
        </div>
      </div>

      {/* Top 4 Metrics Bento */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Outstanding at Risk */}
        <div className="p-4 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-center text-xs text-outline mb-2">
            <span>Outstanding at Risk</span>
            <span className="material-symbols-outlined text-primary text-base">warning</span>
          </div>
          <div className="font-numeric-metric text-2xl font-semibold text-primary">$14,200.00</div>
          <div className="text-[11px] text-error mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">trending_up</span>
            <span>+$2,400 past 7 days</span>
          </div>
        </div>

        {/* Metric 2: Delinquent Counterparties */}
        <div className="p-4 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 shadow-sm">
          <div className="flex justify-between items-center text-xs text-outline mb-2">
            <span>Delinquent Counterparties</span>
            <span className="material-symbols-outlined text-secondary text-base">groups</span>
          </div>
          <div className="font-numeric-metric text-2xl font-semibold text-on-surface">3 Accounts</div>
          <div className="text-[11px] text-outline mt-2 flex items-center gap-1.5">
            <span className="text-primary font-medium">1 Critical</span>
            <span>•</span>
            <span>2 Grace Period</span>
          </div>
        </div>

        {/* Metric 3: Negotiated Target */}
        <div className="p-4 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 shadow-sm">
          <div className="flex justify-between items-center text-xs text-outline mb-2">
            <span>Negotiated Recovery Target</span>
            <span className="material-symbols-outlined text-primary text-base">price_check</span>
          </div>
          <div className="font-numeric-metric text-2xl font-semibold text-on-surface">$11,250.00</div>
          <div className="text-[11px] text-primary mt-2">79.2% of gross exposure</div>
        </div>

        {/* Metric 4: Settlement Success Rate */}
        <div className="p-4 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 shadow-sm">
          <div className="flex justify-between items-center text-xs text-outline mb-2">
            <span>Settlement Success Rate</span>
            <span className="material-symbols-outlined text-secondary text-base">psychology</span>
          </div>
          <div className="font-numeric-metric text-2xl font-semibold text-secondary">88.4%</div>
          <div className="text-[11px] text-emerald-400 mt-2">Avg 4.8 days resolution</div>
        </div>
      </section>

      {/* 3-Panel Negotiation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Counterparty Dossier (3 cols) */}
        <section className="lg:col-span-4 p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-md space-y-4">
          <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-outline">Target Counterparty</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-error/15 text-error border border-error/30 font-semibold">
              14 Days Overdue
            </span>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-center font-bold text-error text-base">
              AC
            </div>
            <div>
              <h3 className="font-semibold text-sm text-on-surface">Acme Corp</h3>
              <p className="text-xs text-on-surface-variant">San Francisco, CA • B2B SaaS</p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/20 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Invoice Reference:</span>
              <span className="text-primary font-mono font-semibold">#FP-8848</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Principal Amount:</span>
              <span className="text-on-surface font-semibold">$1,500.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Accrued Late Surcharge:</span>
              <span className="text-error font-medium">+$75.00 (5.0%)</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-outline-variant/20">
              <span className="text-on-surface font-medium">Total Claim:</span>
              <span className="text-primary font-bold text-sm">$1,575.00</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 text-xs space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-outline block">
              Signing Stakeholder
            </span>
            <div className="font-semibold text-on-surface">Sarah Jenkins</div>
            <div className="text-[11px] text-on-surface-variant">VP Brand &amp; Creative</div>
            <div className="text-[11px] text-primary font-mono">billing@acmecorp.com</div>
          </div>
        </section>

        {/* CENTER PANEL: Proposal Formulation & Strategy Selection (5 cols) */}
        <section className="lg:col-span-5 p-5 rounded-xl bg-surface-container-lowest border border-secondary/30 shadow-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-sm">handshake</span>
              Algorithmic Settlement Structure
            </span>
            <span className="text-[10px] font-mono text-secondary px-2 py-0.5 rounded-full bg-secondary-container/20 border border-secondary/30">
              Interactive Draft
            </span>
          </div>

          {/* Strategy Option Buttons */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-outline block">
              Select Negotiation Playbook:
            </span>
            <div className="grid grid-cols-1 gap-2 text-xs">
              {(
                [
                  ["split_installments", "Split into 2 Bi-Weekly Milestones", "50% upfront, 50% in 14 days"],
                  ["prompt_discount", "5% Prompt Remittance Discount", "Settle for $1,425 within 24h"],
                  ["waive_surcharge", "Waive Accrued Late Surcharges", "Settle principal $1,500 clean"],
                ] as const
              ).map(([key, label, desc]) => (
                <button
                  key={key}
                  onClick={() => setSelectedStrategy(key)}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all",
                    selectedStrategy === key
                      ? "bg-surface-container-high border-secondary text-white font-medium shadow-sm ring-1 ring-secondary/20"
                      : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  <div className="font-semibold text-xs text-on-surface">{label}</div>
                  <div className="text-[11px] opacity-75">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Editable Draft */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-2.5 text-xs">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold text-outline block mb-1">
                Subject
              </label>
              <input
                type="text"
                readOnly
                value={currentDraft.subject}
                className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-lg p-2 text-xs text-on-surface font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold text-outline block mb-1">
                Proposal Body
              </label>
              <textarea
                rows={6}
                readOnly
                value={currentDraft.body}
                className="w-full bg-surface-container-high/60 border border-outline-variant/30 rounded-lg p-2.5 text-xs text-on-surface leading-relaxed resize-none custom-scrollbar"
              />
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="pt-2 flex items-center gap-3">
            {isProposalSent ? (
              <div className="text-xs text-emerald-400 font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>Proposal Dispatched &amp; Active in Sandbox</span>
              </div>
            ) : (
              <button
                onClick={() => setIsConfirmModalOpen(true)}
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-xs shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">verified_user</span>
                <span>Authorize &amp; Send Proposal</span>
              </button>
            )}
          </div>
        </section>

        {/* RIGHT PANEL: Heuristics & Concession Matrix (3 cols) */}
        <section className="lg:col-span-3 p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-md space-y-4">
          <div className="border-b border-outline-variant/20 pb-3">
            <span className="text-xs font-semibold text-white block">Client Behavioral Radar</span>
            <span className="text-[10px] text-outline">Empirical settlement signals</span>
          </div>

          <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/20 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">Resistance Index</span>
              <span className="font-bold text-primary">42 / 100 (Low)</span>
            </div>
            <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: "42%" }} />
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed pt-1">
              Acme Corp accepts structured installment proposals in 85% of past engagements.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 text-xs space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-outline block">
              Negotiator Rules of Engagement
            </span>
            <div className="text-[11px] text-on-surface-variant">
              • Minimum recovery floor: <strong>75% ($1,125.00)</strong>
            </div>
            <div className="text-[11px] text-on-surface-variant">
              • No unilateral forgiveness without verified AP timestamp.
            </div>
            <div className="text-[11px] text-on-surface-variant">
              • All terms require human signing authorization.
            </div>
          </div>
        </section>
      </div>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsConfirmModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-surface-container-lowest border border-secondary/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/20">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">handshake</span>
              </div>
              <div>
                <h3 className="font-semibold text-base text-on-surface">Authorize Settlement Proposal</h3>
                <span className="text-xs text-secondary font-mono">Invoice #FP-8848 • Acme Corp</span>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              You are authorizing the dispatch of the <strong>{currentDraft.title}</strong> proposal to Sarah Jenkins &lt;billing@acmecorp.com&gt;. Target recovery capital is <strong>${currentDraft.recoveryAmount.toLocaleString()}.00</strong>.
            </p>

            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px]">
              <strong>Simulation Guardrail:</strong> This proposal is logged in your local negotiation ledger. No external email or legal communication is dispatched.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container text-xs text-on-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveProposal}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-xs shadow-md hover:brightness-105 active:scale-95"
              >
                Sign &amp; Send Simulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
