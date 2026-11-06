"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ClientRecord,
  updateClientNotesInStorage,
  fetchClientsWithFallback,
} from "./clientStore";

function ClientDossierInner() {
  const searchParams = useSearchParams();
  const initialIdFromUrl = searchParams.get("id");

  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>("ACM-8021");
  const [notesEdit, setNotesEdit] = useState<string>("");
  const [isSavedToast, setIsSavedToast] = useState<boolean>(false);

  useEffect(() => {
    fetchClientsWithFallback().then((list) => {
      setClients(list);
      if (initialIdFromUrl && list.some((c) => c.id === initialIdFromUrl)) {
        setSelectedId(initialIdFromUrl);
      } else if (list.length > 0) {
        setSelectedId(list[0].id);
      }
    });
  }, [initialIdFromUrl]);

  const activeClient = useMemo(() => {
    return clients.find((c) => c.id === selectedId) || clients[0];
  }, [clients, selectedId]);

  useEffect(() => {
    if (activeClient) {
      setNotesEdit(activeClient.notes);
    }
  }, [activeClient]);

  const handleSaveNotes = () => {
    if (!activeClient) return;
    const updated = updateClientNotesInStorage(activeClient.id, notesEdit);
    setClients(updated);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
  };

  if (!activeClient) {
    return <div className="p-8 text-center text-on-surface-variant font-mono">Loading dossier streams...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-outline-variant/20">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant mb-1">
            <span>INTELLIGENCE</span>
            <span>/</span>
            <span className="text-primary font-medium">CLIENT MEMORY DOSSIER</span>
            <span>/</span>
            <span className="text-on-surface font-mono">{activeClient.id}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface flex items-center gap-3">
            Client Memory Dossier
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-secondary/10 border border-secondary/30 text-secondary">
              Audited Telemetry
            </span>
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Institutional memory of every client partnership, contract milestone, negotiation pattern, and payment reliability trace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/clients"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 hover:border-outline text-on-surface text-xs font-medium transition-all"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Risk Radar
          </Link>
          <Link
            href="/ai/negotiator"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-on-primary-fixed text-xs font-semibold shadow hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-sm">handshake</span>
            Launch AI Negotiator
          </Link>
        </div>
      </div>

      {/* Client Quick Switcher Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-outline uppercase tracking-wider">
          <span>Active Client Accounts ({clients.length} Audited Streams)</span>
          <span className="text-emerald-400 flex items-center gap-1 normal-case font-sans">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Memory Connected
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {clients.slice(0, 4).map((c) => {
            const isCurrent = c.id === activeClient.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`relative p-3.5 rounded-xl cursor-pointer transition-all border ${
                  isCurrent
                    ? "bg-surface-container border-primary shadow-[0_0_20px_rgba(244,200,109,0.15)]"
                    : "bg-surface-container-low/70 border-white/5 hover:border-outline-variant/50 hover:bg-surface-container-low"
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-2 right-3 px-2 py-0.5 rounded bg-primary text-on-primary text-[10px] font-bold tracking-wide uppercase font-mono">
                    Active Dossier
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                      c.riskTier === "Platinum"
                        ? "bg-secondary/20 text-secondary border border-secondary/30"
                        : c.riskTier === "High Friction"
                        ? "bg-rose-950/40 text-rose-400 border border-rose-500/30"
                        : "bg-primary/20 text-primary border border-primary/30"
                    }`}
                  >
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-on-surface truncate">{c.name}</h4>
                    <span className="text-[11px] text-on-surface-variant/70 font-mono">
                      {c.reliabilityScore}% Reliability
                    </span>
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t border-outline-variant/15 flex justify-between text-xs font-mono">
                  <span className="text-on-surface-variant/70">Balance:</span>
                  <span
                    className={
                      c.outstandingBalance > 0 ? "text-rose-400 font-semibold" : "text-emerald-400"
                    }
                  >
                    ${c.outstandingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deep 3-Column Dossier Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Column 1: Client Identity & Verified Telemetry (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-surface-container-low/90 backdrop-blur-xl border border-white/10 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <span className="text-xs font-mono uppercase tracking-wider text-outline">
                Institutional Counterparty
              </span>
              <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono text-[11px]">
                {activeClient.id}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <h2 className="text-xl font-bold text-on-surface">{activeClient.name}</h2>
                <p className="text-xs text-on-surface-variant">
                  {activeClient.industry} • {activeClient.location}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Key Contact:</span>
                  <span className="font-semibold text-on-surface">{activeClient.contactName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Role:</span>
                  <span className="text-on-surface">{activeClient.contactRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Email:</span>
                  <span className="text-primary font-mono">{activeClient.contactEmail}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Risk Tier Assessment:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      activeClient.riskTier === "Platinum"
                        ? "bg-secondary/20 border-secondary/40 text-secondary"
                        : activeClient.riskTier === "High Friction"
                        ? "bg-rose-950/40 border-rose-500/30 text-rose-400"
                        : "bg-primary/20 border-primary/30 text-primary"
                    }`}
                  >
                    {activeClient.riskTier}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Reliability Score:</span>
                  <span className="font-mono font-bold text-on-surface text-sm">
                    {activeClient.reliabilityScore} / 100
                  </span>
                </div>
                <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      activeClient.reliabilityScore >= 90
                        ? "bg-emerald-400"
                        : activeClient.reliabilityScore >= 70
                        ? "bg-yellow-400"
                        : "bg-rose-400"
                    }`}
                    style={{ width: `${activeClient.reliabilityScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Editable Dossier Memory Notes */}
            <div className="space-y-2 pt-2 border-t border-outline-variant/20">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">edit_note</span>
                  Dossier Memory & AP Nuance
                </span>
                {isSavedToast && (
                  <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">check</span> Saved
                  </span>
                )}
              </div>
              <textarea
                rows={4}
                value={notesEdit}
                onChange={(e) => setNotesEdit(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-xs text-on-surface focus:border-primary focus:outline-none resize-none font-sans leading-relaxed"
                placeholder="Institutional memory notes, payment patterns, and counterparty contacts..."
              />
              <button
                onClick={handleSaveNotes}
                className="w-full py-1.5 px-3 rounded-lg bg-surface-container-high border border-primary/30 hover:border-primary text-primary text-xs font-semibold transition-all hover:bg-surface-container-highest"
              >
                Persist Dossier Memory
              </button>
            </div>
          </div>
        </div>

        {/* Column 2: Milestone History & Contract Trajectory (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-surface-container-low/90 backdrop-blur-xl border border-white/10 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <span className="text-xs font-mono uppercase tracking-wider text-outline">
                Financial Settlements & Trajectory
              </span>
              <span className="material-symbols-outlined text-sm text-primary">account_balance</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30">
                <span className="text-on-surface-variant block text-[11px]">Lifetime Billing</span>
                <span className="text-lg font-bold font-mono text-on-surface mt-1 block">
                  ${activeClient.lifetimeRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30">
                <span className="text-on-surface-variant block text-[11px]">Average Settlement</span>
                <span className="text-lg font-bold font-mono text-primary mt-1 block">
                  {activeClient.avgSettlementLag}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 text-xs space-y-2">
              <div className="text-on-surface-variant font-medium">Contract Milestones Trace</div>
              <div className="space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between p-2 rounded bg-surface-container-lowest border border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-on-surface">Phase 1: Architecture</span>
                  </div>
                  <span className="text-emerald-400 font-semibold">Settled</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-surface-container-lowest border border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-on-surface">Phase 2: Execution Sprint</span>
                  </div>
                  <span className="text-primary font-semibold">Milestone Authorized</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-surface-container-lowest border border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-outline" />
                    <span className="text-on-surface-variant">Phase 3: Production Signoff</span>
                  </div>
                  <span className="text-outline">Scheduled</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 text-xs space-y-1.5">
              <div className="text-on-surface-variant">Settlement Infrastructure</div>
              <div className="flex items-center justify-between">
                <span className="text-outline">Dispute Track Record:</span>
                <span className="text-on-surface font-semibold">{activeClient.disputeHistory}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-outline">Active Rails:</span>
                <span className="text-primary font-mono">{activeClient.preferredRails}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: AI Behavioral Intelligence & Negotiation Trajectory (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-surface-container-low/90 backdrop-blur-xl border border-white/10 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <span className="text-xs font-mono uppercase tracking-wider text-outline">
                Autonomous Negotiation Playbook
              </span>
              <span className="material-symbols-outlined text-sm text-secondary">psychology</span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/25 border border-emerald-500/25 text-xs space-y-1.5">
              <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">thumb_up</span>
                Optimal Approach Tactics
              </div>
              <p className="text-emerald-200/90 text-xs leading-relaxed">
                {activeClient.playbook.whatWorks}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-950/25 border border-rose-500/25 text-xs space-y-1.5">
              <div className="font-semibold text-rose-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">thumb_down</span>
                Friction Warning Triggers
              </div>
              <p className="text-rose-200/90 text-xs leading-relaxed">
                {activeClient.playbook.whatFails}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 text-xs space-y-2">
              <span className="text-on-surface-variant font-medium block">
                Recommended Counter-Offer Clause
              </span>
              <div className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/20 font-mono text-[11px] text-primary/90 leading-normal">
                &ldquo;Net-14 payment window with 3% early settlement discount for milestone signoff within 5 business days.&rdquo;
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/ai/negotiator"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-secondary-container to-[#7040DB] text-on-surface text-xs font-semibold shadow hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-sm">tune</span>
                Open Dynamic Term Negotiator
              </Link>
              <Link
                href="/invoices/new"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-surface-container border border-outline-variant/40 hover:border-primary text-on-surface text-xs font-medium transition-all"
              >
                <span className="material-symbols-outlined text-sm">receipt_long</span>
                Generate Tailored Invoice
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClientDossierClient() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-on-surface-variant font-mono">Initializing Client Dossier Telemetry...</div>}>
      <ClientDossierInner />
    </Suspense>
  );
}
