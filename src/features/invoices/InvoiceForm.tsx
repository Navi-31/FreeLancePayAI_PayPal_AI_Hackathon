"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Invoice, InvoiceLineItem } from "@/types/invoice";
import {
  calculateLineItemAmount,
  calculateInvoiceTotals,
  createInvoiceWithServer,
} from "./invoiceStore";
import { InvoicePaperPreview } from "./InvoicePaperPreview";
import { AuricButton } from "@/components/ui/AuricButton";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { cn } from "@/lib/utils";

const SAMPLE_CLIENTS = [
  { name: "Acme Corp", email: "billing@acmecorp.com", address: "100 Innovation Way, Chicago, IL" },
  { name: "Horizon Studio", email: "billing@horizon.design", address: "San Francisco, CA" },
  { name: "Synthetix Labs LLC", email: "finance@synthetix.io", address: "Boston, MA" },
  { name: "Venture Dynamics", email: "ap@venturedynamics.vc", address: "New York, NY" },
  { name: "Lumina Labs", email: "finance@luminalabs.io", address: "Seattle, WA" },
];

export const InvoiceForm: React.FC = () => {
  const router = useRouter();

  // Mode: AI Smart Generator vs Manual Custom Builder
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [aiPrompt, setAiPrompt] = useState(
    "Invoice Acme Corp $8,500 for Design System Sprint II, milestone 2 of 3, net-14 payment terms with 20% tax reserve and PayPal business processing"
  );

  // Form Fields
  const [invoiceNumber] = useState(`FP-${Math.floor(1000 + Math.random() * 9000)}`);
  const [selectedClientIndex, setSelectedClientIndex] = useState(0);
  const [projectTitle, setProjectTitle] = useState("Design System Sprint II");
  const [currency, setCurrency] = useState("USD");
  const [paymentChannel, setPaymentChannel] = useState<"PayPal Direct" | "Stripe Connect" | "SWIFT Wire">("PayPal Direct");
  
  // Dates
  const todayStr = new Date().toISOString().split("T")[0];
  const dueDateDefault = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
  const [issueDate, setIssueDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(dueDateDefault);
  const [poReference, setPoReference] = useState("ACM-2025-102");
  const [notes, setNotes] = useState("Payment due within 14 days via verified business protocol rail.");

  // Tax Shield %
  const [taxRatePercent, setTaxRatePercent] = useState(0);

  // Line items
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      id: "item-1",
      description: "Design System Architecture & Component Tokens",
      quantity: 1,
      rate: 5500,
      amount: 5500,
    },
    {
      id: "item-2",
      description: "Design System Verification & Production Documentation",
      quantity: 30,
      rate: 100,
      amount: 3000,
    },
  ]);

  // Validation & Error states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Current client
  const client = SAMPLE_CLIENTS[selectedClientIndex] || SAMPLE_CLIENTS[0];

  // Dynamic calculations
  const { subtotal, taxAmount, total } = calculateInvoiceTotals(lineItems, taxRatePercent);

  // Handle line item change
  const handleItemChange = (
    index: number,
    field: "description" | "quantity" | "rate",
    val: string | number
  ) => {
    const updated = [...lineItems];
    const item = { ...updated[index] };

    if (field === "description") {
      item.description = String(val);
    } else if (field === "quantity") {
      item.quantity = Number(val) || 0;
      item.amount = calculateLineItemAmount(item.quantity, item.rate);
    } else if (field === "rate") {
      item.rate = Number(val) || 0;
      item.amount = calculateLineItemAmount(item.quantity, item.rate);
    }

    updated[index] = item;
    setLineItems(updated);
  };

  // Add line item
  const handleAddItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: `item-${Date.now()}`,
        description: "",
        quantity: 1,
        rate: 500,
        amount: 500,
      },
    ]);
  };

  // Remove line item
  const handleRemoveItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // AI Prompt Parser (Connects to server-side AI Parser with resilient local fallback)
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;

    try {
      const res = await fetch("/api/ai/invoices/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;

        if (data.projectTitle) setProjectTitle(data.projectTitle);
        if (data.taxRatePercent !== undefined) setTaxRatePercent(data.taxRatePercent);
        if (data.paymentChannel) setPaymentChannel(data.paymentChannel);

        if (Array.isArray(data.lineItems) && data.lineItems.length > 0) {
          setLineItems(
            data.lineItems.map((li: { description: string; quantity: number; rate: number }, idx: number) => ({
              id: `item-${Date.now()}-${idx}`,
              description: li.description,
              quantity: Number(li.quantity) || 1,
              rate: Number(li.rate) || 0,
            }))
          );
        }

        const clientIdx = SAMPLE_CLIENTS.findIndex(
          (c) => data.clientName && c.name.toLowerCase().includes(data.clientName.toLowerCase())
        );
        if (clientIdx >= 0) setSelectedClientIndex(clientIdx);

        setValidationError(null);
        return;
      }
    } catch {
      // Fallback below
    }

    // Local heuristic fallback
    const lower = aiPrompt.toLowerCase();
    const clientIdx = SAMPLE_CLIENTS.findIndex((c) => lower.includes(c.name.toLowerCase()));
    if (clientIdx >= 0) {
      setSelectedClientIndex(clientIdx);
    }
    if (lower.includes("20% tax") || lower.includes("20%")) {
      setTaxRatePercent(20);
    } else if (lower.includes("15%")) {
      setTaxRatePercent(15);
    }
    if (lower.includes("paypal")) {
      setPaymentChannel("PayPal Direct");
    } else if (lower.includes("stripe")) {
      setPaymentChannel("Stripe Connect");
    }
    setValidationError(null);
  };

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    if (!projectTitle.trim()) {
      setValidationError("Project title is required.");
      return;
    }
    if (lineItems.length === 0 || lineItems.some(i => !i.description.trim())) {
      setValidationError("Please provide a description for all line items.");
      return;
    }
    if (total <= 0) {
      setValidationError("Total invoice amount must be greater than zero.");
      return;
    }

    setIsSubmitting(true);

    const newInvoice: Invoice = {
      id: invoiceNumber,
      clientName: client.name,
      clientEmail: client.email,
      clientAddress: client.address,
      projectTitle: projectTitle.trim(),
      issueDate,
      dueDate,
      poReference: poReference.trim(),
      status: "sent",
      paymentChannel,
      currency,
      currencySymbol: currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$",
      lineItems,
      subtotal,
      taxRatePercent,
      taxAmount,
      total,
      aiRiskScore: "Low",
      aiTelemetryNote: `Created via ${mode === "ai" ? "AI Smart Generator" : "Manual Builder"}. Auto-synced to local ledger.`,
      viewCount: 0,
      notes: notes.trim(),
    };

    // Save to server database and storage
    createInvoiceWithServer(newInvoice);

    // Navigate to Invoices list
    setTimeout(() => {
      router.push(`/invoices/${newInvoice.id}`);
    }, 400);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Mode Switcher Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div>
          <h1 className="font-headline-lg text-xl lg:text-2xl font-semibold tracking-tight text-on-surface flex items-center gap-3">
            <span>Create New Invoice</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary font-label-sm">
              Vault Verified
            </span>
          </h1>
          <p className="font-body-md text-xs lg:text-sm text-on-surface-variant mt-1 max-w-2xl">
            Draft manually or let AI Copilot extract line items, calculate tax shields, and enforce milestone terms.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-inner">
          <button
            type="button"
            onClick={() => setMode("ai")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
              mode === "ai"
                ? "bg-surface-container-high text-secondary border border-secondary/40 shadow-[0_0_15px_rgba(150,101,255,0.25)] font-semibold"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <span className="material-symbols-outlined text-sm leading-none" data-icon="auto_awesome">
              auto_awesome
            </span>
            <span>AI Smart Generator</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("manual")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
              mode === "manual"
                ? "bg-surface-container-high text-primary border border-primary/40 shadow-xs font-semibold"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <span className="material-symbols-outlined text-sm leading-none" data-icon="edit">
              edit
            </span>
            <span>Manual Custom Builder</span>
          </button>
        </div>
      </div>

      {/* Dual Column Architecture (60% Form / 40% Live Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECTION A: AI Autonomous Ingestion Box (Shown in AI Mode) */}
          {mode === "ai" && (
            <GlassPanel elevation={2} glow="violet" className="p-5 border-secondary/30 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-secondary text-base leading-none"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    auto_awesome
                  </span>
                  <h2 className="font-headline-sm text-sm font-semibold text-on-surface">
                    AI Autonomous Prompt & Ingestion
                  </h2>
                </div>
                <span className="font-label-sm text-[10px] text-secondary bg-secondary-container/30 px-2.5 py-0.5 rounded-full border border-secondary/30">
                  Copilot v4.2 Ready
                </span>
              </div>

              <div className="relative mb-3">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full bg-[#101016] border border-secondary/30 rounded-lg p-3 text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none font-body-md"
                  rows={3}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAiPrompt("Invoice Synthetix Labs $3,600 for Brand Tokens, milestone 1 of 1, net-14 terms via PayPal Direct");
                      handleAiGenerate();
                    }}
                    className="px-2.5 py-1 rounded-lg border border-outline-variant/40 bg-[#171720]/80 text-on-surface-variant hover:text-on-surface text-[11px] flex items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm text-primary leading-none">history</span>
                    <span>Re-use Client Terms</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAiGenerate}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-secondary-container via-surface-container-high to-surface-container border border-secondary/40 text-secondary hover:text-white font-label-md text-xs font-semibold flex items-center gap-1.5 violet-glow transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm leading-none">bolt</span>
                  <span>Populate from Prompt</span>
                </button>
              </div>
            </GlassPanel>
          )}

          {/* SECTION B: Client & Invoice Attributes */}
          <GlassPanel elevation={1} className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base leading-none">business</span>
                <h3 className="font-headline-sm text-sm font-semibold text-on-surface">
                  Client & Invoice Attributes
                </h3>
              </div>
              <span className="text-[11px] text-primary flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Verified Protocol
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client Selector */}
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">
                  Client Identity
                </label>
                <select
                  value={selectedClientIndex}
                  onChange={(e) => setSelectedClientIndex(Number(e.target.value))}
                  className="w-full bg-[#101016] border border-outline-variant/30 rounded-lg px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
                >
                  {SAMPLE_CLIENTS.map((c, idx) => (
                    <option key={c.name} value={idx}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Protocol Number */}
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">
                  Invoice Protocol Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value={`#${invoiceNumber}`}
                    className="w-full bg-[#101016] border border-outline-variant/30 rounded-lg px-3 py-2 text-xs text-primary font-mono font-medium focus:outline-none"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-2 text-primary text-sm leading-none">
                    lock
                  </span>
                </div>
              </div>

              {/* Project Title */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-on-surface-variant mb-1">
                  Project Title / Engagement
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. Brand Architecture Q2 Retainer"
                  className="w-full bg-[#101016] border border-outline-variant/30 rounded-lg px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              {/* Currency & Rail */}
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">
                  Settlement Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-[#101016] border border-outline-variant/30 rounded-lg px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">
                  Payment Channel Rail
                </label>
                <select
                  value={paymentChannel}
                  onChange={(e) => setPaymentChannel(e.target.value as "PayPal Direct" | "Stripe Connect" | "SWIFT Wire")}
                  className="w-full bg-[#101016] border border-outline-variant/30 rounded-lg px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
                >
                  <option value="PayPal Direct">PayPal Direct (Verified Business)</option>
                  <option value="Stripe Connect">Stripe Connect Rail</option>
                  <option value="SWIFT Wire">SWIFT International Wire</option>
                </select>
              </div>

              {/* Dates */}
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full bg-[#101016] border border-outline-variant/30 rounded-lg px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">
                  Due Date (Net-14)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-[#101016] border border-outline-variant/30 rounded-lg px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              {/* PO Reference */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-on-surface-variant mb-1">
                  PO / Contract Reference
                </label>
                <input
                  type="text"
                  value={poReference}
                  onChange={(e) => setPoReference(e.target.value)}
                  placeholder="e.g. ACM-2025-098"
                  className="w-full bg-[#101016] border border-outline-variant/30 rounded-lg px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none font-mono"
                />
              </div>
            </div>
          </GlassPanel>

          {/* SECTION C: Line Items Editor */}
          <GlassPanel elevation={1} className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base leading-none">format_list_bulleted</span>
                <h3 className="font-headline-sm text-sm font-semibold text-on-surface">
                  Deliverable Line Items
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm leading-none">add</span>
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-surface-container-low/70 border border-outline-variant/20 flex flex-col md:flex-row items-start md:items-center gap-3 text-xs"
                >
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                      placeholder="Item specification description"
                      className="w-full bg-[#101016] border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs text-on-surface focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="w-20">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                        placeholder="Qty"
                        className="w-full bg-[#101016] border border-outline-variant/30 rounded-lg px-2 py-1.5 text-xs text-on-surface font-mono text-center focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="w-28">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                        placeholder="Rate"
                        className="w-full bg-[#101016] border border-outline-variant/30 rounded-lg px-2 py-1.5 text-xs text-on-surface font-mono text-right focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="w-24 font-mono font-medium text-right text-primary">
                      ${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>

                    <button
                      type="button"
                      disabled={lineItems.length <= 1}
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 rounded text-on-surface-variant hover:text-error disabled:opacity-30 transition-colors"
                      title="Remove item"
                    >
                      <span className="material-symbols-outlined text-base leading-none">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tax Shield & Notes */}
            <div className="pt-3 border-t border-outline-variant/20 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">
                  Autonomous Tax Shield Allocation ({taxRatePercent}%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="5"
                    value={taxRatePercent}
                    onChange={(e) => setTaxRatePercent(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="font-mono text-xs font-semibold text-secondary w-12 text-right">
                    {taxRatePercent}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">
                  Engagement Notes & Remit Instructions
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#101016] border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </GlassPanel>

          {/* Validation Error Message */}
          {validationError && (
            <div className="p-3 rounded-lg bg-error-container/40 border border-error/50 text-error text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm leading-none">error</span>
              <span>{validationError}</span>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => router.push("/invoices")}
              className="px-4 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface text-xs font-medium transition-colors"
            >
              Cancel & Return
            </button>

            <AuricButton type="submit" size="md" icon="payments" disabled={isSubmitting}>
              {isSubmitting ? "Dispatching..." : "Create & Send via Protocol"}
            </AuricButton>
          </div>
        </div>

        {/* Right Live Preview Column (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
              Live Paper Preview
            </span>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Dynamic Sync
            </span>
          </div>

          <InvoicePaperPreview
            invoice={{
              id: invoiceNumber,
              clientName: client.name,
              clientEmail: client.email,
              clientAddress: client.address,
              projectTitle,
              issueDate,
              dueDate,
              paymentChannel,
              currency,
              lineItems,
              subtotal,
              taxRatePercent,
              taxAmount,
              total,
              status: "sent",
            }}
          />
        </div>
      </div>
    </form>
  );
};
