"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ClientRecord,
  saveClientsToStorage,
  fetchClientsWithFallback,
} from "./clientStore";

export function ClientsClient() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("ACM-8021");
  const [filterTier, setFilterTier] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Client Form
  const [newClientName, setNewClientName] = useState("");
  const [newClientIndustry, setNewClientIndustry] = useState("");
  const [newClientLocation, setNewClientLocation] = useState("");
  const [newClientContact, setNewClientContact] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientBalance, setNewClientBalance] = useState("0");
  const [newClientRisk, setNewClientRisk] = useState<ClientRecord["riskTier"]>("High Reliability");

  useEffect(() => {
    fetchClientsWithFallback().then((loaded) => {
      setClients(loaded);
      if (loaded.length > 0) {
        setSelectedClientId(loaded[0].id);
      }
    });
  }, []);

  const filteredClients = useMemo(() => {
    if (filterTier === "ALL") return clients;
    return clients.filter((c) => c.riskTier.toLowerCase().includes(filterTier.toLowerCase()));
  }, [clients, filterTier]);

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || clients[0];
  }, [clients, selectedClientId]);

  // Aggregate Metrics
  const totalClients = clients.length;
  const highReliabilityCount = clients.filter(
    (c) => c.riskTier === "Platinum" || c.riskTier === "High Reliability"
  ).length;
  const attentionCount = clients.filter((c) => c.riskTier === "Attention Required").length;
  const highRiskCount = clients.filter((c) => c.riskTier === "High Friction").length;
  const totalOutstanding = clients.reduce((acc, c) => acc + c.outstandingBalance, 0);

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName) return;

    const newId = `CLI-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEntry: ClientRecord = {
      id: newId,
      name: newClientName,
      location: newClientLocation || "Remote / Global",
      industry: newClientIndustry || "Consulting & Technology",
      contactName: newClientContact || "Accounts Payable",
      contactRole: "Finance Operations",
      contactEmail: newClientEmail || "billing@counterparty.io",
      riskTier: newClientRisk,
      reliabilityScore: newClientRisk === "Platinum" ? 95 : newClientRisk === "High Reliability" ? 88 : newClientRisk === "Attention Required" ? 70 : 45,
      lifetimeRevenue: 0,
      outstandingBalance: parseFloat(newClientBalance) || 0,
      avgSettlementLag: newClientRisk === "Platinum" ? "-1.0 Days" : "+10.0 Days",
      disputeHistory: "0 Disputes",
      preferredRails: "Stripe Connect / PayPal Direct",
      notes: "Newly onboarded client profile into institutional risk radar.",
      playbook: {
        whatWorks: "Upfront milestone billing and documented scopes.",
        whatFails: "Unscheduled delays in deliverable sign-offs.",
      },
    };

    const updated = [newEntry, ...clients];
    setClients(updated);
    saveClientsToStorage(updated);

    // Sync to server API in background
    fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: newId,
        name: newEntry.name,
        location: newEntry.location,
        industry: newEntry.industry,
        contactName: newEntry.contactName,
        contactRole: newEntry.contactRole,
        contactEmail: newEntry.contactEmail,
        riskTier: newEntry.riskTier,
        reliabilityScore: newEntry.reliabilityScore,
        outstandingBalance: newEntry.outstandingBalance,
        notes: newEntry.notes,
      }),
    }).catch(() => {});

    setSelectedClientId(newId);
    setShowAddModal(false);
    setNewClientName("");
    setNewClientIndustry("");
    setNewClientLocation("");
    setNewClientContact("");
    setNewClientEmail("");
    setNewClientBalance("0");
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Confidence Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-xs text-on-surface-variant">
          <span>INTELLIGENCE</span>
          <span>/</span>
          <span className="text-primary font-medium">CLIENT INTELLIGENCE</span>
          <span>/</span>
          <span className="text-on-surface-variant/70">RISK RADAR</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-secondary-container/20 border border-secondary/30 text-secondary text-xs flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            Predictive Model 99.4% Confidence
          </span>
          <span className="text-xs text-on-surface-variant/70 font-mono">Continuous Telemetry</span>
        </div>
      </div>

      {/* Screen Title & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-outline-variant/20">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface">
              Client Intelligence & Risk Radar
            </h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-primary/10 border border-primary/30 text-primary">
              Institutional
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Understand your clients. Predict payment behavior. Protect your revenue streams.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary-fixed text-sm font-semibold shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            Add Client Profile
          </button>
        </div>
      </div>

      {/* Top Metrics Bento Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-low/80 backdrop-blur-md border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-medium uppercase tracking-wider">Active Portfolio</span>
            <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-base">groups</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-on-surface font-mono">{totalClients} Entities</div>
            <div className="text-xs text-on-surface-variant/70 flex items-center gap-1 mt-1">
              <span className="text-primary font-medium">+2 this quarter</span>
              <span>• 100% mapped</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-low/80 backdrop-blur-md border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-medium uppercase tracking-wider">High Reliability</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <span className="material-symbols-outlined text-base">verified</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400 font-mono">{highReliabilityCount} Clients</div>
            <div className="text-xs text-emerald-400/80 mt-1">
              {Math.round((highReliabilityCount / (totalClients || 1)) * 100)}% on-time settlement
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-low/80 backdrop-blur-md border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-medium uppercase tracking-wider">Attention Required</span>
            <div className="w-7 h-7 rounded-lg bg-yellow-950/40 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
              <span className="material-symbols-outlined text-base">schedule</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-yellow-400 font-mono">{attentionCount} Accounts</div>
            <div className="text-xs text-on-surface-variant/80 mt-1">
              Delayed AP cycles detected
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-low/80 backdrop-blur-md border border-rose-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-medium uppercase tracking-wider">High Friction</span>
            <div className="w-7 h-7 rounded-lg bg-rose-950/50 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <span className="material-symbols-outlined text-base">warning</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-400 font-mono">{highRiskCount} Client</div>
            <div className="text-xs text-rose-300/80 mt-1">
              Action recommended
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-low/80 backdrop-blur-md border border-primary/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-medium uppercase tracking-wider">Pipeline Outstanding</span>
            <div className="w-7 h-7 rounded-lg bg-surface-container-high border border-primary/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-base">account_balance_wallet</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-primary font-mono">
              ${totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-on-surface-variant/80 mt-1">
              Across all {totalClients} accounts
            </div>
          </div>
        </div>
      </section>

      {/* Main Split Layout: Risk Matrix (8 cols) + Selected Client Telemetry (4 cols) */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Client Risk Matrix & Filter */}
        <div className="xl:col-span-8 space-y-4">
          <div className="rounded-2xl bg-surface-container-low/90 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Table Control Header */}
            <div className="p-4 bg-surface-container/70 border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-xl">analytics</span>
                <div>
                  <h3 className="text-base font-semibold text-on-surface">Client Risk Matrix</h3>
                  <p className="text-xs text-on-surface-variant">
                    Continuous ML scoring evaluating liquidity latency, contract adherence & dispute metrics.
                  </p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {["ALL", "Platinum", "High Reliability", "Attention Required", "High Friction"].map(
                  (tier) => (
                    <button
                      key={tier}
                      onClick={() => setFilterTier(tier)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        filterTier === tier
                          ? "bg-primary text-on-primary-fixed shadow"
                          : "bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                      }`}
                    >
                      {tier}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Client Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-lowest/50 text-xs text-on-surface-variant font-mono uppercase border-b border-outline-variant/20">
                  <tr>
                    <th className="py-3 px-4">Counterparty</th>
                    <th className="py-3 px-4">Reliability Score</th>
                    <th className="py-3 px-4">Risk Tier</th>
                    <th className="py-3 px-4">Avg Settlement Lag</th>
                    <th className="py-3 px-4 text-right">Outstanding</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 text-xs">
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-on-surface-variant space-y-3">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <span className="material-symbols-outlined text-4xl text-outline">group_off</span>
                          <div className="font-semibold text-sm text-on-surface">No clients found</div>
                          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                            No counterparties match your current filter, or your account portfolio is empty.
                          </p>
                          <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-on-primary-fixed text-xs font-semibold shadow hover:brightness-110"
                          >
                            <span className="material-symbols-outlined text-sm">person_add</span>
                            Add First Client Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => {
                    const isSelected = client.id === selectedClientId;
                    return (
                      <tr
                        key={client.id}
                        onClick={() => setSelectedClientId(client.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-primary/10 border-l-2 border-primary"
                            : "hover:bg-surface-container/40"
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-on-surface text-sm">{client.name}</div>
                          <div className="text-on-surface-variant/70 text-[11px]">
                            {client.industry} • {client.location}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  client.reliabilityScore >= 90
                                    ? "bg-emerald-400"
                                    : client.reliabilityScore >= 70
                                    ? "bg-yellow-400"
                                    : "bg-rose-400"
                                }`}
                                style={{ width: `${client.reliabilityScore}%` }}
                              />
                            </div>
                            <span className="font-mono font-semibold text-on-surface">
                              {client.reliabilityScore}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                              client.riskTier === "Platinum"
                                ? "bg-secondary-container/20 border-secondary/40 text-secondary"
                                : client.riskTier === "High Reliability"
                                ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
                                : client.riskTier === "Attention Required"
                                ? "bg-yellow-950/40 border-yellow-500/30 text-yellow-400"
                                : "bg-rose-950/40 border-rose-500/30 text-rose-400"
                            }`}
                          >
                            {client.riskTier}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-on-surface-variant">
                          {client.avgSettlementLag}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-on-surface">
                          ${client.outstandingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Link
                            href={`/clients/memory?id=${client.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container border border-outline-variant/30 text-primary hover:border-primary text-xs font-medium transition-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="material-symbols-outlined text-xs">folder_shared</span>
                            Dossier
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Deep Intelligence Snapshot for Selected Client */}
        {selectedClient && (
          <div className="xl:col-span-4 space-y-4">
            <div className="rounded-2xl bg-surface-container-low/90 backdrop-blur-2xl border border-white/10 p-5 space-y-5 shadow-2xl">
              {/* Profile Card Header */}
              <div className="flex items-start justify-between pb-3 border-b border-outline-variant/20">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-outline">
                    {selectedClient.id}
                  </span>
                  <h3 className="text-xl font-bold text-on-surface">{selectedClient.name}</h3>
                  <p className="text-xs text-on-surface-variant">
                    {selectedClient.contactName} ({selectedClient.contactRole})
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                    selectedClient.riskTier === "Platinum"
                      ? "bg-secondary-container/20 border-secondary/40 text-secondary"
                      : selectedClient.riskTier === "High Reliability"
                      ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
                      : selectedClient.riskTier === "Attention Required"
                      ? "bg-yellow-950/40 border-yellow-500/30 text-yellow-400"
                      : "bg-rose-950/40 border-rose-500/30 text-rose-400"
                  }`}
                >
                  {selectedClient.riskTier}
                </span>
              </div>

              {/* Financial Telemetry Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/20">
                  <span className="text-outline text-[11px] block">Lifetime Revenue</span>
                  <span className="text-on-surface font-mono font-bold text-sm">
                    ${selectedClient.lifetimeRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/20">
                  <span className="text-outline text-[11px] block">Overdue Balance</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      selectedClient.outstandingBalance > 0 ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    ${selectedClient.outstandingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/20">
                  <span className="text-outline text-[11px] block">Dispute History</span>
                  <span className="text-on-surface text-[11px] block mt-0.5">
                    {selectedClient.disputeHistory}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/20">
                  <span className="text-outline text-[11px] block">Preferred Rails</span>
                  <span className="text-on-surface text-[11px] block mt-0.5">
                    {selectedClient.preferredRails}
                  </span>
                </div>
              </div>

              {/* AI Strategic Playbook */}
              <div className="space-y-3 pt-2 border-t border-outline-variant/20">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <span className="material-symbols-outlined text-sm">psychology</span>
                  Autonomous Behavioral Playbook
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs">
                  <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    What Works
                  </div>
                  <p className="text-emerald-200/80 text-[11px]">
                    {selectedClient.playbook.whatWorks}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 text-xs">
                  <div className="font-semibold text-rose-400 mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">cancel</span>
                    What Fails
                  </div>
                  <p className="text-rose-200/80 text-[11px]">
                    {selectedClient.playbook.whatFails}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href={`/clients/memory?id=${selectedClient.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-surface-container-high border border-primary/40 hover:border-primary text-primary text-xs font-semibold transition-all"
                >
                  <span className="material-symbols-outlined text-sm">history_edu</span>
                  Open Full Memory Dossier
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/ai/negotiator`}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-surface-container border border-outline-variant/30 hover:border-secondary text-secondary text-xs font-medium transition-all"
                  >
                    <span className="material-symbols-outlined text-xs">handshake</span>
                    Negotiator
                  </Link>
                  <Link
                    href={`/reminders`}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-surface-container border border-outline-variant/30 hover:border-primary text-on-surface text-xs font-medium transition-all"
                  >
                    <span className="material-symbols-outlined text-xs">outgoing_mail</span>
                    Reminders
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Add Client Profile Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container border border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person_add</span>
                Add Institutional Client Profile
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddClient} className="space-y-4 text-xs">
              <div>
                <label className="block text-on-surface-variant font-medium mb-1">Company / Entity Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Corp"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Industry</label>
                  <input
                    type="text"
                    placeholder="e.g. Fintech, Design"
                    value={newClientIndustry}
                    onChange={(e) => setNewClientIndustry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. New York, NY"
                    value={newClientLocation}
                    onChange={(e) => setNewClientLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Key Stakeholder Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Connor"
                    value={newClientContact}
                    onChange={(e) => setNewClientContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="billing@apex.io"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Initial Risk Tier</label>
                  <select
                    value={newClientRisk}
                    onChange={(e) => setNewClientRisk(e.target.value as ClientRecord["riskTier"])}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface focus:border-primary focus:outline-none"
                  >
                    <option value="Platinum">Platinum (Lowest Risk)</option>
                    <option value="High Reliability">High Reliability</option>
                    <option value="Attention Required">Attention Required</option>
                    <option value="High Friction">High Friction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Outstanding Balance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newClientBalance}
                    onChange={(e) => setNewClientBalance(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary-fixed text-xs font-semibold shadow hover:brightness-110"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
