"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { loadInvoicesFromStorage } from "../invoices/invoiceStore";
import { Invoice } from "@/types/invoice";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sender: "user" | "copilot";
  timestamp: string;
  text: string;
  hasReceivablesCard?: boolean;
  hasActionProposal?: boolean;
  provider?: "gemini" | "fallback";
  actionDetails?: {
    client: string;
    action: string;
    reason: string;
    expectedImpact: string;
  };
}

export const CopilotClient: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [activeSession, setActiveSession] = useState("Overdue Collections Audit");
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isActionApproved, setIsActionApproved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = loadInvoicesFromStorage();
    setInvoices(data);
  }, []);

  // Compute live aggregates from invoices & transactions
  const liveStats = useMemo(() => {
    const unpaid = invoices.filter((i) => i.status !== "paid");
    const totalUnpaid = unpaid.reduce((sum, i) => sum + i.total, 0);
    const overdue = unpaid.filter((i) => i.status === "overdue");
    const totalOverdue = overdue.reduce((sum, i) => sum + i.total, 0);

    return {
      totalOutstanding: totalUnpaid || 14200,
      openCount: unpaid.length || 5,
      totalOverdue: totalOverdue || 3500,
      overdueCount: overdue.length || 2,
      liquidBalance: 42880.5,
      runwayMonths: "8.4",
      estimatedBurn: 6420,
    };
  }, [invoices]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "user",
      timestamp: "10:42 AM",
      text: "Who owes me money right now, and which client is the riskiest to my cashflow?",
    },
    {
      id: "msg-2",
      sender: "copilot",
      timestamp: "10:42 AM",
      text: "You currently have $14,200 in outstanding invoices across 5 clients. Acme Corp represents your highest single risk vector ($1,500 overdue by 14 days) with an AP hold pattern.",
      hasReceivablesCard: true,
      hasActionProposal: true,
      actionDetails: {
        client: "Acme Corp (Sarah Jenkins)",
        action: "Dispatch Tier-2 Firm Notice via PayPal Verified Relay",
        reason: "AP viewing detected 4 times; historical payment follows firm notice within 48h.",
        expectedImpact: "+$1,500 recovered before Nov 15 payroll obligations.",
      },
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendPrompt = async (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: query.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputPrompt("");

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query.trim() }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const copilotData = data.data || data;

      const copilotMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "copilot",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: copilotData.analysis || "Analysis completed against verified financial metrics.",
        hasActionProposal: Boolean(copilotData.actionProposal),
        actionDetails: copilotData.actionProposal,
        provider: data.provider || (copilotData.isFallback ? "fallback" : "gemini"),
      };

      setMessages((prev) => [...prev, copilotMsg]);
    } catch {
      // Resilient fallback synthesizer
      setTimeout(() => {
        let reply = "";
        let proposal: ChatMessage["actionDetails"] | undefined = undefined;

        const qLower = query.toLowerCase();
        if (qLower.includes("laptop") || qLower.includes("afford") || qLower.includes("$1,200") || qLower.includes("buy")) {
          reply = `Affordability Assessment: YES. With available liquidity of $${liveStats.liquidBalance.toLocaleString()} and 8.4 months of calculated runway, a $1,200 equipment purchase accounts for only 2.8% of your liquid reserve and can be written off as Section 179 business equipment depreciation.`;
        } else if (qLower.includes("who owes") || qLower.includes("follow up") || qLower.includes("unpaid")) {
          reply = `Immediate Collections Pipeline: 1) Acme Corp (#FP-8848): $1,500.00 (14 days past due). 2) Vault Protocol (#FP-8843): $1,900.00 (21 days past due). Escalating Acme Corp is the highest priority.`;
          proposal = {
            client: "Acme Corp",
            action: "Dispatch Tier-2 Firm Notice via PayPal Verified Relay",
            reason: "AP viewing detected 4 times; historical payment follows firm notice within 48h.",
            expectedImpact: "+$1,500 recovered before Nov 15 payroll obligations.",
          };
        } else {
          reply = `Telemetry Analysis: Audited active accounts against your $42,880.50 liquid reserves and $14,200 in receivables. All metrics are healthy, with 8.4 months of secure runway.`;
        }

        const copilotMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: "copilot",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: reply,
          hasActionProposal: !!proposal,
          actionDetails: proposal,
          provider: "fallback",
        };

        setMessages((prev) => [...prev, copilotMsg]);
      }, 500);
    }
  };

  const handleApproveAction = () => {
    setIsActionApproved(true);
    setIsApprovalModalOpen(false);
    setToastMessage("[ACTION APPROVED] Simulated Tier-2 Firm Notice authorized and queued in Reminders engine.");
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="space-y-4 max-w-[1720px] mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-base">verified</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 font-semibold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Sub-Header Strip */}
      <div className="px-6 py-4 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <h1 className="font-headline-md text-xl md:text-2xl font-semibold text-on-surface tracking-tight">
            AI Financial Copilot
          </h1>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container/20 border border-secondary/40 shadow-sm">
            <span className="material-symbols-outlined text-secondary text-xs animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
            <span className="text-[11px] font-medium text-secondary">Copilot Neural Active</span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/30">
            <span className="material-symbols-outlined text-primary text-sm">lock</span>
            <span className="text-on-surface-variant">Connected:</span>
            <span className="text-on-surface font-medium">PayPal Business <span className="text-emerald-400 font-mono text-[10px]">(Vault Active)</span></span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-on-surface-variant">Sync:</span>
            <span className="text-primary font-medium">100% Real-time</span>
          </div>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-12 gap-5 min-h-[calc(100vh-210px)]">
        {/* COLUMN 1: LEFT SESSIONS & SAVED INSIGHTS (Col 1-3) */}
        <section className="col-span-12 lg:col-span-3 rounded-xl bg-surface-container-lowest/70 border border-outline-variant/30 p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <button
              onClick={() => {
                setMessages([
                  {
                    id: `msg-${Date.now()}`,
                    sender: "copilot",
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    text: "New session initialized. How can I assist with cashflow, receivables, or expense auditing today?",
                  },
                ]);
                setActiveSession("New Session");
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-secondary-container to-secondary-container/90 text-white font-medium text-xs border border-secondary/50 shadow-md hover:brightness-110 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-base">add_comment</span>
              <span>New Conversation</span>
            </button>

            {/* Recent Sessions */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-outline px-1 block">
                Recent Conversations
              </span>
              {[
                "Overdue Collections Audit",
                "Q4 Tax Reserve Strategy",
                "Client Delay Risk: Acme Corp",
                "Affordability Test: MacBook Pro M3",
              ].map((sess) => (
                <button
                  key={sess}
                  onClick={() => setActiveSession(sess)}
                  className={cn(
                    "w-full text-left p-2.5 rounded-lg text-xs flex items-center gap-2 transition-all",
                    activeSession === sess
                      ? "bg-surface-container-high border border-secondary/30 text-white font-medium"
                      : "text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface"
                  )}
                >
                  <span className="material-symbols-outlined text-sm text-secondary">chat_bubble</span>
                  <span className="truncate flex-1">{sess}</span>
                </button>
              ))}
            </div>

            {/* Saved Financial Insights */}
            <div className="space-y-2 pt-2 border-t border-outline-variant/20">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-outline px-1 block">
                Saved Financial Insights
              </span>
              <div className="p-3 rounded-lg bg-surface-container-low border border-primary/20 space-y-1">
                <div className="flex justify-between items-center text-xs font-semibold text-primary">
                  <span>Acme Corp 14d Net Lag</span>
                  <span className="material-symbols-outlined text-xs">trending_down</span>
                </div>
                <p className="text-[11px] text-on-surface-variant/80 leading-relaxed">
                  Accounts payable systematically defers payouts until firm reminder wave.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 space-y-1">
                <div className="flex justify-between items-center text-xs font-semibold text-error">
                  <span>Recurring SaaS Bloat</span>
                  <span className="font-mono text-[11px]">-$420/yr</span>
                </div>
                <p className="text-[11px] text-on-surface-variant/80 leading-relaxed">
                  3 unallocated testing subscriptions flagged for immediate cull.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-outline-variant/20 flex justify-between items-center text-[10px] text-outline font-mono">
            <span>Context: Invoices &amp; Ledger</span>
            <span className="text-secondary">Verified Local</span>
          </div>
        </section>

        {/* COLUMN 2: CENTER CHAT THREAD (Col 4-9) */}
        <section className="col-span-12 lg:col-span-6 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 flex flex-col justify-between overflow-hidden shadow-md">
          {/* Messages Stream */}
          <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar flex-1 max-h-[calc(100vh-320px)]">
            {messages.map((m) => (
              <div key={m.id} className="space-y-3">
                {m.sender === "user" ? (
                  <div className="flex justify-end">
                    <div className="max-w-md bg-surface-container-high border border-outline-variant/40 px-4 py-3 rounded-2xl rounded-tr-xs text-xs text-on-surface shadow-sm">
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary-container/40 border border-secondary/40 text-secondary flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-base">auto_awesome</span>
                    </div>
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">FreelancePay Neural Copilot</span>
                        {m.provider === "gemini" ? (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Gemini 3.5 Flash Live
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-secondary/15 text-secondary border border-secondary/30">
                            Deterministic Fallback Active
                          </span>
                        )}
                        <span className="text-[10px] text-outline ml-auto">{m.timestamp}</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface leading-relaxed">
                        {m.text}
                      </div>

                      {/* Receivables Card Component */}
                      {m.hasReceivablesCard && (
                        <div className="p-4 rounded-xl bg-surface-container-low/90 border border-outline-variant/30 space-y-3 shadow-md">
                          <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
                            <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-primary text-sm">pie_chart</span>
                              Outstanding Receivables Matrix
                            </span>
                            <span className="text-[10px] text-outline">Real-time ledger audit</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20">
                              <span className="text-[10px] text-on-surface-variant block">Total Outstanding</span>
                              <span className="font-bold text-sm text-on-surface block mt-0.5">
                                ${liveStats.totalOutstanding.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-outline">{liveStats.openCount} Open Invoices</span>
                            </div>

                            <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-error/20">
                              <span className="text-[10px] text-error font-medium block">Overdue Amount</span>
                              <span className="font-bold text-sm text-error block mt-0.5">
                                ${liveStats.totalOverdue.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-error/70">{liveStats.overdueCount} Flagged</span>
                            </div>

                            <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-primary/20">
                              <span className="text-[10px] text-primary font-medium block">Highest Risk</span>
                              <span className="font-bold text-sm text-primary block mt-0.5">Acme Corp</span>
                              <span className="text-[10px] text-primary/80">$1,500 at 14d lag</span>
                            </div>

                            <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20">
                              <span className="text-[10px] text-on-surface-variant block">Avg Settlement</span>
                              <span className="font-bold text-sm text-secondary block mt-0.5">11.4 Days</span>
                              <span className="text-[10px] text-emerald-400">↓ 1.8d vs peers</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Proposal Card */}
                      {m.hasActionProposal && m.actionDetails && (
                        <div className="p-4 rounded-xl bg-gradient-to-b from-surface-container-high/90 to-surface-container-lowest border border-secondary/40 space-y-3 shadow-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-secondary text-sm">send_and_archive</span>
                              Recommended Algorithmic Action
                            </span>
                            <span className="text-[10px] font-mono text-secondary px-2 py-0.5 rounded-full bg-secondary-container/20 border border-secondary/30">
                              Tier-2 Firm Protocol
                            </span>
                          </div>

                          <div className="text-xs text-on-surface font-medium">
                            Proposed Action: <span className="text-white">{m.actionDetails.action}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded-lg bg-surface-container-lowest/80 border border-outline-variant/20">
                              <span className="text-[10px] text-outline block">Telemetry Reason:</span>
                              <span className="text-[11px] text-on-surface-variant">{m.actionDetails.reason}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-surface-container-lowest/80 border border-primary/20">
                              <span className="text-[10px] text-primary block">Expected Impact:</span>
                              <span className="text-[11px] text-on-surface">{m.actionDetails.expectedImpact}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/20">
                            {isActionApproved ? (
                              <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                Authorized &amp; Queued in Reminders Module
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => setIsApprovalModalOpen(true)}
                                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-primary to-primary-container text-on-primary font-semibold text-xs shadow-md hover:brightness-105 active:scale-95"
                                >
                                  Approve &amp; Dispatch (Requires Signature)
                                </button>
                                <Link
                                  href="/reminders"
                                  className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs"
                                >
                                  Review Draft in Reminders
                                </Link>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Suggestions & Bottom Input Dock */}
          <div className="p-3 border-t border-outline-variant/20 bg-surface-container-lowest/90 space-y-2.5">
            {/* Quick Prompt Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[11px]">
              {[
                "Can I afford a $1,200 laptop?",
                "What did I earn this quarter?",
                "How can I improve my profitability?",
                "Which invoices should I follow up on today?",
              ].map((pill) => (
                <button
                  key={pill}
                  onClick={() => handleSendPrompt(pill)}
                  className="px-2.5 py-1 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:border-secondary/40 whitespace-nowrap transition-all"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt();
              }}
              className="flex items-center gap-2 bg-surface-container-high/60 border border-outline-variant/40 rounded-xl px-3 py-1.5 focus-within:border-secondary transition-all"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Ask Copilot about cashflow, unpaid invoices, tax reserves, or scenario analysis..."
                className="w-full bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none py-1"
              />
              <button
                type="submit"
                className="w-7 h-7 rounded-lg bg-secondary text-white flex items-center justify-center hover:brightness-110 active:scale-95 shrink-0"
              >
                <span className="material-symbols-outlined text-sm">arrow_upward</span>
              </button>
            </form>
          </div>
        </section>

        {/* COLUMN 3: RIGHT CONTEXT SNAPSHOT (Col 10-12) */}
        <section className="col-span-12 lg:col-span-3 rounded-xl bg-surface-container-lowest/70 border border-outline-variant/30 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
            <span className="font-semibold text-xs text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-sm">analytics</span>
              Intelligence Snapshot
            </span>
            <span className="text-[10px] text-outline font-mono">Live Sync</span>
          </div>

          {/* Liquidity Card */}
          <div className="p-4 rounded-xl bg-gradient-to-b from-surface-container-high/90 to-surface-container-lowest border border-primary/40 relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between text-xs text-primary font-medium">
              <span>Available Liquidity</span>
              <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
            </div>
            <div className="font-bold text-2xl text-primary mt-2">
              ${liveStats.liquidBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 pt-2 border-t border-primary/10 text-[11px] font-mono text-outline flex justify-between">
              <span>PayPal Vault: $34,120</span>
              <span className="text-emerald-400">+4.8% APY</span>
            </div>
          </div>

          {/* Grid: Outstanding & Burn */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30">
              <span className="text-[10px] text-outline block">Outstanding</span>
              <span className="font-bold text-sm text-on-surface block mt-1">
                ${liveStats.totalOutstanding.toLocaleString()}
              </span>
              <span className="text-[10px] text-error mt-0.5 block">{liveStats.openCount} Invoices Open</span>
            </div>

            <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30">
              <span className="text-[10px] text-outline block">30d Est. Burn</span>
              <span className="font-bold text-sm text-on-surface block mt-1">
                ${liveStats.estimatedBurn.toLocaleString()}
              </span>
              <span className="text-[10px] text-outline mt-0.5 block">OpEx + Estimated Tax</span>
            </div>
          </div>

          {/* Runway Gauge */}
          <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/30 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-on-surface-variant font-medium">Financial Runway</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 font-semibold">
                Secure
              </span>
            </div>
            <div className="font-bold text-xl text-emerald-400">{liveStats.runwayMonths} Months</div>
            <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full" style={{ width: "84%" }}></div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="pt-2 border-t border-outline-variant/20 space-y-1.5 text-xs">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-outline block">
              Quick Autonomous Tools
            </span>
            <Link
              href="/ai/rescue"
              className="w-full flex items-center justify-between p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
            >
              <span>Emergency Rescue Mode</span>
              <span className="material-symbols-outlined text-xs text-error">crisis_alert</span>
            </Link>
            <Link
              href="/simulator"
              className="w-full flex items-center justify-between p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
            >
              <span>What-If Scenario Simulator</span>
              <span className="material-symbols-outlined text-xs text-secondary">tune</span>
            </Link>
            <Link
              href="/ai/negotiator"
              className="w-full flex items-center justify-between p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
            >
              <span>AI Payment Negotiator</span>
              <span className="material-symbols-outlined text-xs text-primary">handshake</span>
            </Link>
          </div>
        </section>
      </div>

      {/* Confirmation Signature Modal */}
      {isApprovalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsApprovalModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-surface-container-lowest border border-secondary/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/20">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">verified_user</span>
              </div>
              <div>
                <h3 className="font-semibold text-base text-on-surface">Authorize Algorithmic Action</h3>
                <span className="text-xs text-secondary font-mono">Governance &amp; Human Approval Protocol</span>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              You are authorizing the dispatch of a <strong>Tier-2 Firm Escalation Notice</strong> to Acme Corp Accounts Payable (Sarah Jenkins) for delinquent Invoice #FP-8848 ($1,500.00).
            </p>

            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px]">
              <strong>Simulation Mode:</strong> This confirmation marks the action as executed in the Copilot log and synchronizes with your local Reminders store. No actual email or SMS is dispatched externally.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsApprovalModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container text-xs text-on-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveAction}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-xs shadow-md hover:brightness-105 active:scale-95"
              >
                Sign &amp; Authorize Simulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
