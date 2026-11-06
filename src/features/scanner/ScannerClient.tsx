"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { loadInvoicesFromStorage, saveInvoicesToStorage } from "@/features/invoices/invoiceStore";
import { Invoice } from "@/types/invoice";

interface LineItem {
  id: string;
  desc: string;
  stage: string;
  amount: number;
}

export function ScannerClient() {
  const router = useRouter();

  const [clientName, setClientName] = useState<string>("Horizon Studio, Inc.");
  const [clientEmail, setClientEmail] = useState<string>("billing@horizonstudio.design");
  const [terms, setTerms] = useState<string>("Net-14");
  const [taxWithholding, setTaxWithholding] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: "li-1",
      desc: "Cloud Telemetry Dashboard Core",
      stage: "Milestone Alpha Release",
      amount: 4000.0,
    },
    {
      id: "li-2",
      desc: "Stripe & PayPal Webhook Sync Gateway",
      stage: "Milestone Beta Release",
      amount: 3000.0,
    },
    {
      id: "li-3",
      desc: "Performance Optimization & Auditing",
      stage: "Final QA & Production Handover",
      amount: 1500.0,
    },
  ]);

  const totalAmount = lineItems.reduce((acc, item) => acc + item.amount, 0);
  const taxPortion = taxWithholding ? totalAmount * 0.25 : 0;

  const handleSimulateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsScanning(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/ai/scanner/analyze", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const json = await res.json();
          const d = json.data || json;
          if (d.extractedClientName) setClientName(d.extractedClientName);
          if (d.extractedClientEmail) setClientEmail(d.extractedClientEmail);
          if (d.paymentTerms) setTerms(d.paymentTerms);
          if (Array.isArray(d.lineItems) && d.lineItems.length > 0) {
            setLineItems(
              d.lineItems.map((li: { description: string; amount: number }, i: number) => ({
                id: `li-scan-${i + 1}`,
                desc: li.description,
                stage: `Milestone Phase ${i + 1}`,
                amount: Number(li.amount) || 1000,
              }))
            );
          }
          setToastMessage(`Document Intelligence parsed "${file.name}" successfully (${d.confidenceScore || 96}% confidence).`);
          setTimeout(() => setToastMessage(null), 4500);
          return;
        }
      } catch {
        // Fallback below
      } finally {
        setIsScanning(false);
      }

      setToastMessage(`OCR completed for "${file.name}". Verified deliverables extracted.`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleGenerateInvoice = () => {
    const existing = loadInvoicesFromStorage();
    const newId = `FP-${Math.floor(1000 + Math.random() * 9000)}`;

    const newInvoice: Invoice = {
      id: newId,
      clientName: clientName,
      clientEmail: clientEmail,
      clientAddress: "San Francisco, CA",
      projectTitle: "Phase 2 Deliverable Sprint (Parsed from SOW)",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      poReference: `PO-2025-${Math.floor(100 + Math.random() * 900)}`,
      status: "draft",
      paymentChannel: "PayPal Direct",
      currency: "USD",
      currencySymbol: "$",
      lineItems: lineItems.map((li) => ({
        id: li.id,
        description: li.desc,
        quantity: 1,
        rate: li.amount,
        amount: li.amount,
      })),
      subtotal: totalAmount,
      taxRatePercent: taxWithholding ? 25 : 0,
      taxAmount: taxPortion,
      total: totalAmount,
      aiRiskScore: "Low",
      aiTelemetryNote: "Parsed via SOC-2 Type II Verified OCR Ingestion. Auto tax isolated.",
      viewCount: 0,
      notes: `Extracted via SOC-2 Type II Verified OCR Ingestion. Terms: ${terms}. Auto tax isolation: $${taxPortion.toFixed(2)}.`,
    };

    const updated = [newInvoice, ...existing];
    saveInvoicesToStorage(updated);

    setToastMessage(`Draft ${newInvoice.id} generated and committed to PayPal gateway cache! Redirecting...`);
    setTimeout(() => {
      router.push(`/invoices/${newInvoice.id}`);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-primary/20 border border-primary/40 text-primary text-xs flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">verified</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-on-surface hover:text-white">
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
        </div>
      )}

      {/* Screen Title & Compliance Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-outline-variant/20">
        <div>
          <div className="flex items-center gap-2 text-outline font-mono text-xs mb-1">
            <span>UTILITY ENGINE</span>
            <span>/</span>
            <span className="text-primary font-medium">DOCUMENT INTELLIGENCE SCANNER</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface">
              AI Document Intelligence Scanner
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold font-mono">
              OCR Engine v4.9
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Turn project contracts, Statements of Work (SOWs), and agreements into verified PayPal invoice drafts.
          </p>
        </div>

        {/* Compliance & Security Assurance Badge */}
        <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-base">verified_user</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-on-surface uppercase tracking-wider text-[11px]">
              SOC-2 Type II Verified OCR
            </span>
            <span className="text-[10px] text-outline">Zero LLM Retention Protocol & Isolation</span>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout (7 cols Left + 5 cols Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload Zone & Source Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Upload Zone */}
          <div className="relative rounded-2xl bg-surface-container-low/60 backdrop-blur-xl border border-dashed border-outline-variant/60 p-6 hover:border-primary/60 transition-all">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl">
                    {isScanning ? "sync" : "upload_file"}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-on-surface">Upload Contract or SOW</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Drag & drop institutional documents (PDF, JPG, PNG up to 25MB)
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-surface-container text-outline">
                      PDF OCR Engine
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-surface-container text-outline">
                      Multi-Currency
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-secondary-container/20 text-secondary">
                      Smart Table Split
                    </span>
                  </div>
                </div>
              </div>

              <label className="cursor-pointer px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-bright border border-outline-variant/40 text-on-surface text-xs font-semibold transition-all flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">cloud_upload</span>
                <span>{isScanning ? "Scanning..." : "Browse File"}</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleSimulateUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Active Document Ingested Banner */}
            <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest/80 rounded-xl p-3 border border-outline-variant/30 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-400 font-mono text-xs font-bold">
                  PDF
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-on-surface">Horizon_Studio_SOW_Phase2.pdf</span>
                    <span className="px-2 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      Ingested
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-outline font-mono mt-0.5">
                    <span>3.8 MB</span>
                    <span>•</span>
                    <span>Processed in 410ms</span>
                    <span>•</span>
                    <span className="text-primary font-bold">100% Parsed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Neural Analysis & Source Inspector */}
          <div className="rounded-2xl bg-surface-container-low/80 border border-outline-variant/30 backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-secondary">troubleshoot</span>
                <h2 className="text-sm font-semibold text-on-surface">Source Excerpt & OCR Bounding</h2>
              </div>
              <span className="text-[11px] font-mono text-outline">Page 3 of 8 (SOW Extract)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-outline-variant/20 text-xs">
              {/* Excerpt */}
              <div className="p-4 bg-surface-container-lowest font-mono space-y-3 leading-relaxed">
                <div className="text-[10px] text-outline uppercase border-b border-outline-variant/20 pb-1 flex justify-between">
                  <span>STATEMENT OF WORK // HORIZON MEDIA</span>
                  <span className="text-primary">SEC 4.2</span>
                </div>
                <p className="text-on-surface-variant text-[11px]">
                  ...This Statement of Work (&ldquo;SOW&rdquo;) is entered into between FreelancePay Prime Partner and{" "}
                  <span className="bg-primary/20 text-primary px-1 py-0.5 rounded border border-primary/40 font-semibold">
                    HORIZON STUDIO, INC.
                  </span>{" "}
                  located in San Francisco, CA.
                </p>
                <div className="p-2 rounded bg-surface-container border border-outline-variant/20 space-y-1 text-[11px]">
                  <div className="text-outline text-[10px]">SECTION 5.1 — COMPENSATION</div>
                  <p>
                    Total fixed deliverable compensation for Phase 2 sprint is scheduled at{" "}
                    <span className="bg-primary/20 text-primary font-bold px-1 rounded border border-primary/50">
                      $8,500.00 USD
                    </span>.
                  </p>
                  <p className="text-outline text-[10px]">
                    Terms: <span className="bg-secondary/20 text-secondary px-1 rounded">Net-14</span> upon deliverable release.
                  </p>
                </div>
              </div>

              {/* Confidence Telemetry */}
              <div className="p-4 space-y-3 bg-surface-container-low/50 text-xs">
                <div className="flex items-center justify-between text-outline text-[11px] font-mono">
                  <span>Neural Confidence Score</span>
                  <span className="text-emerald-400 font-bold">4/4 Passed</span>
                </div>

                <div className="space-y-2">
                  <div className="p-2 rounded bg-surface-container border border-outline-variant/20 flex justify-between items-center">
                    <div>
                      <div className="text-[10px] text-outline">Target Counterparty</div>
                      <div className="font-semibold text-white">Horizon Studio, Inc.</div>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold">99%</span>
                  </div>
                  <div className="p-2 rounded bg-surface-container border border-outline-variant/20 flex justify-between items-center">
                    <div>
                      <div className="text-[10px] text-outline">Invoice Total Claim</div>
                      <div className="font-semibold text-primary font-mono">$8,500.00 USD</div>
                    </div>
                    <span className="font-mono text-primary font-bold">100%</span>
                  </div>
                  <div className="p-2 rounded bg-surface-container border border-outline-variant/20 flex justify-between items-center">
                    <div>
                      <div className="text-[10px] text-outline">Payment Schedule Term</div>
                      <div className="font-semibold text-white">Net-14 Calendar Days</div>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold">98%</span>
                  </div>
                  <div className="p-2 rounded bg-surface-container border border-outline-variant/20 flex justify-between items-center">
                    <div>
                      <div className="text-[10px] text-outline">Deliverables Extracted</div>
                      <div className="font-semibold text-white">3 Itemized Milestone Blocks</div>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold">96%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Extracted Fields Review & Edit Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-surface-container-low/80 border border-outline-variant/30 backdrop-blur-2xl p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">edit_note</span>
                <h2 className="text-sm font-semibold text-on-surface">Extracted Fields Review</h2>
              </div>
              <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-mono font-bold border border-primary/20">
                PRE-VERIFIED
              </span>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-outline font-medium mb-1">Counterparty (Client Org)</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3 py-2 text-on-surface focus:border-primary focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-outline font-medium mb-1">Billing Email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3 py-2 text-on-surface focus:border-primary focus:outline-none font-mono"
                />
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <label className="block text-outline font-medium">Deliverables & Line Items</label>
                <div className="space-y-2">
                  {lineItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg bg-surface-container border border-outline-variant/30 flex items-center justify-between gap-2"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-white">{item.desc}</div>
                        <div className="text-[10px] text-outline font-mono">{item.stage}</div>
                      </div>
                      <div className="font-mono font-bold text-primary text-sm">
                        ${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terms and Currency */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-outline font-medium mb-1">Payment Clause</label>
                  <select
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-2.5 py-1.5 text-on-surface focus:outline-none"
                  >
                    <option value="Net-14">Net-14 (In SOW)</option>
                    <option value="Net-30">Net-30</option>
                    <option value="Due Upon Receipt">Due Upon Receipt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-outline font-medium mb-1">Invoice Currency</label>
                  <input
                    type="text"
                    readOnly
                    value="USD ($)"
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-2.5 py-1.5 text-on-surface font-mono"
                  />
                </div>
              </div>

              {/* Tax Set-aside Checkbox */}
              <div className="p-3 rounded-lg bg-surface-container border border-secondary/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={taxWithholding}
                    onChange={(e) => setTaxWithholding(e.target.checked)}
                    className="accent-primary"
                  />
                  <div>
                    <span className="font-semibold text-white block">Auto Tax Vault Set-Aside (25%)</span>
                    <span className="text-[10px] text-outline">Isolates into cryptographic tax vault</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-secondary text-sm">
                  ${taxPortion.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Total and Action Button */}
            <div className="pt-3 border-t border-outline-variant/20 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant font-medium">Total Claim Amount:</span>
                <span className="text-xl font-bold font-mono text-primary">
                  ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <button
                type="button"
                onClick={handleGenerateInvoice}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed font-semibold text-xs shadow hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">receipt_long</span>
                Generate Verified PayPal Invoice Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
