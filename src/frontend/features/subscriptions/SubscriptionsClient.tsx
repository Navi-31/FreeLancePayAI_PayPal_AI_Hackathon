"use client";

import React, { useState, useEffect } from "react";

interface SubscriptionItem {
  id: string;
  name: string;
  subTitle: string;
  category: "Design" | "Productivity" | "AI" | "Cloud";
  costMonthly: number;
  lastActive: string;
  usageScore: number; // 0 - 100
  usageStatus: "High" | "Stagnant" | "Dormant";
  recommendation: "Keep Active" | "Suggest Downgrade" | "Cancel / Prune";
  nextRenewal: string;
  dueCategory: "7d" | "14d" | "30d";
  initials: string;
}

const INITIAL_SUBS: SubscriptionItem[] = [
  {
    id: "sub-1",
    name: "Adobe Creative Cloud",
    subTitle: "Master All Apps • Solo Plan",
    category: "Design",
    costMonthly: 89.99,
    lastActive: "42 days ago",
    usageScore: 25,
    usageStatus: "Stagnant",
    recommendation: "Suggest Downgrade",
    nextRenewal: "Oct 28 (In 3d)",
    dueCategory: "7d",
    initials: "Ad",
  },
  {
    id: "sub-2",
    name: "Webflow Workspace",
    subTitle: "Agency Core (3 Seats)",
    category: "Productivity",
    costMonthly: 60.0,
    lastActive: "91 days ago",
    usageScore: 8,
    usageStatus: "Dormant",
    recommendation: "Cancel / Prune",
    nextRenewal: "Nov 03 (In 9d)",
    dueCategory: "14d",
    initials: "Wf",
  },
  {
    id: "sub-3",
    name: "Figma Organization",
    subTitle: "Full Design Suite + FigJam",
    category: "Design",
    costMonthly: 75.0,
    lastActive: "Today (1h ago)",
    usageScore: 92,
    usageStatus: "High",
    recommendation: "Keep Active",
    nextRenewal: "Nov 18 (In 24d)",
    dueCategory: "30d",
    initials: "Fg",
  },
  {
    id: "sub-4",
    name: "ChatGPT Plus & Team",
    subTitle: "GPT-4o reasoning cluster",
    category: "AI",
    costMonthly: 50.0,
    lastActive: "Yesterday",
    usageScore: 88,
    usageStatus: "High",
    recommendation: "Keep Active",
    nextRenewal: "Nov 15 (In 21d)",
    dueCategory: "30d",
    initials: "AI",
  },
  {
    id: "sub-5",
    name: "Otter.ai Business",
    subTitle: "Autonomous Meeting Notes",
    category: "AI",
    costMonthly: 30.0,
    lastActive: "74 days ago",
    usageScore: 5,
    usageStatus: "Dormant",
    recommendation: "Cancel / Prune",
    nextRenewal: "Nov 07 (In 13d)",
    dueCategory: "14d",
    initials: "Ot",
  },
  {
    id: "sub-6",
    name: "GitHub Team",
    subTitle: "Code Storage & Copilot X",
    category: "Cloud",
    costMonthly: 40.0,
    lastActive: "Today",
    usageScore: 95,
    usageStatus: "High",
    recommendation: "Keep Active",
    nextRenewal: "Nov 25 (In 31d)",
    dueCategory: "30d",
    initials: "GH",
  },
  {
    id: "sub-7",
    name: "AWS Cloud Infrastructure",
    subTitle: "us-east-1 Elastic Compute",
    category: "Cloud",
    costMonthly: 240.0,
    lastActive: "Live cluster active",
    usageScore: 99,
    usageStatus: "High",
    recommendation: "Keep Active",
    nextRenewal: "Nov 22 (In 28d)",
    dueCategory: "30d",
    initials: "AWS",
  },
];

export function SubscriptionsClient() {
  const [subs, setSubs] = useState<SubscriptionItem[]>(INITIAL_SUBS);
  const [selectedSubId, setSelectedSubId] = useState<string>("sub-1");
  const [filterMode, setFilterMode] = useState<"ALL" | "DORMANT" | "SAVINGS">("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLiveDb, setIsLiveDb] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubTitle, setNewSubTitle] = useState("");
  const [newSubCategory, setNewSubCategory] = useState<"Design" | "Productivity" | "AI" | "Cloud">("Cloud");
  const [newSubCost, setNewSubCost] = useState("45.00");

  useEffect(() => {
    fetch("/api/subscriptions")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.subscriptions && Array.isArray(data.subscriptions) && data.subscriptions.length > 0) {
          const mapped: SubscriptionItem[] = data.subscriptions.map((s: Record<string, unknown>) => ({
            id: String(s.id),
            name: String(s.name),
            subTitle: String(s.subTitle || "Service License"),
            category: (s.category as SubscriptionItem["category"]) || "Cloud",
            costMonthly: Number(s.costMonthly || 0),
            lastActive: String(s.lastActive || "Recently"),
            usageScore: Number(s.usageScore ?? 75),
            usageStatus: (s.usageStatus as SubscriptionItem["usageStatus"]) || "High",
            recommendation: (s.recommendation as SubscriptionItem["recommendation"]) || "Keep Active",
            nextRenewal: s.nextRenewal ? new Date(String(s.nextRenewal)).toLocaleDateString() : "Next month",
            dueCategory: (s.dueCategory as SubscriptionItem["dueCategory"]) || "30d",
            initials: String(s.initials || String(s.name).slice(0, 2)),
          }));
          setSubs(mapped);
          setIsLiveDb(true);
          if (mapped.length > 0) setSelectedSubId(mapped[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const selectedSub = subs.find((s) => s.id === selectedSubId) || subs[0];

  const filteredSubs = subs.filter((s) => {
    if (filterMode === "DORMANT") return s.usageStatus === "Dormant";
    if (filterMode === "SAVINGS") return s.recommendation !== "Keep Active";
    return true;
  });

  const totalMonthly = subs.reduce((acc, s) => acc + s.costMonthly, 0);
  const annualRunRate = totalMonthly * 12;
  const potentialSavings = subs
    .filter((s) => s.recommendation !== "Keep Active")
    .reduce((acc, s) => acc + s.costMonthly * 12, 0);

  const handleExecuteAllTriages = () => {
    setToastMessage("Queued all 3 cost-saving actions for review: Saving $1,640.00/yr safely.");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePreemptCharge = (subName: string) => {
    setToastMessage(`Pre-empt authorization flagged for ${subName}. Virtual card paused.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePruneSub = async (id: string) => {
    const previous = [...subs];
    setSubs((prev) => prev.filter((s) => s.id !== id));

    try {
      const res = await fetch(`/api/subscriptions?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setToastMessage("[FIRESTORE] Subscription removed and audit log recorded.");
      } else {
        setToastMessage("Subscription archived locally from active monitoring run-rate.");
      }
    } catch {
      // Revert if error
      setSubs(previous);
      setToastMessage("[ERROR] Failed to delete subscription from server.");
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    const cost = parseFloat(newSubCost) || 10;
    const optimisticId = `sub-${Date.now()}`;
    const newEntry: SubscriptionItem = {
      id: optimisticId,
      name: newSubName.trim(),
      subTitle: newSubTitle.trim() || `${newSubCategory} Workspace`,
      category: newSubCategory,
      costMonthly: cost,
      lastActive: "Today",
      usageScore: 85,
      usageStatus: "High",
      recommendation: "Keep Active",
      nextRenewal: "In 30d",
      dueCategory: "30d",
      initials: newSubName.trim().slice(0, 2).toUpperCase(),
    };

    setSubs((prev) => [newEntry, ...prev]);
    setIsAddModalOpen(false);

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEntry.name,
          subTitle: newEntry.subTitle,
          category: newEntry.category,
          costMonthly: newEntry.costMonthly,
          lastActive: "Today",
          usageScore: 85,
          usageStatus: "High",
          recommendation: "Keep Active",
          dueCategory: "30d",
          initials: newEntry.initials,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.subscription?.id) {
          setSubs((prev) =>
            prev.map((s) => (s.id === optimisticId ? { ...s, id: data.subscription.id } : s))
          );
        }
        setIsLiveDb(true);
        setToastMessage(`[FIRESTORE] Subscription '${newEntry.name}' persisted to database.`);
      } else {
        setToastMessage(`Subscription '${newEntry.name}' added to local monitoring workspace.`);
      }
    } catch {
      setToastMessage(`Subscription '${newEntry.name}' added to local monitoring workspace.`);
    }

    setNewSubName("");
    setNewSubTitle("");
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-secondary-container/90 border border-secondary/40 text-on-surface text-xs flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-secondary">verified</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-on-surface-variant hover:text-white">
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-outline-variant/20">
        <div>
          <div className="flex items-center gap-2 text-outline font-mono text-xs mb-1">
            <span>TREASURY</span>
            <span>/</span>
            <span className="text-primary font-medium">SUBSCRIPTION INTELLIGENCE</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface flex items-center gap-3">
            Subscription Intelligence & SaaS Audit
            <span className="px-2.5 py-0.5 rounded-full text-xs bg-secondary-container/20 text-secondary border border-secondary/30 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              {isLiveDb ? "Live Firestore Database" : "Demo Baseline"}
            </span>
          </h1>
          <p className="text-sm text-outline mt-1">
            Autonomous audit of recurring software burn, license utilization, and automated single-user downgrade savings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-high border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/10 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            + Add Subscription
          </button>
          <button
            onClick={handleExecuteAllTriages}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary-fixed text-xs font-semibold shadow hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-sm">auto_fix_high</span>
            Execute All Triages
          </button>
        </div>
      </div>

      {/* Top KPIs Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Subscriptions */}
        <div className="rounded-xl p-4 bg-surface-container-low/80 backdrop-blur-xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-outline uppercase tracking-wider font-semibold font-mono">
              Active Subscriptions
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-base">apps</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <div className="text-2xl font-bold text-on-surface font-mono">{subs.length}</div>
            <span className="text-xs text-outline">services tracked</span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-xs text-outline">
            <span className="flex items-center text-emerald-400 gap-0.5 font-medium">
              <span className="material-symbols-outlined text-xs">arrow_downward</span> 2 pruned
            </span>
            <span>last 30 days</span>
          </div>
        </div>

        {/* Monthly Subscription Drain */}
        <div className="rounded-xl p-4 bg-surface-container-low/80 backdrop-blur-xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-outline uppercase tracking-wider font-semibold font-mono">
              Monthly Subscription Drain
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-rose-400">
              <span className="material-symbols-outlined text-base">calendar_today</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <div className="text-2xl font-bold text-on-surface font-mono">
              ${totalMonthly.toFixed(2)}
            </div>
            <span className="text-xs text-outline">/mo</span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-xs text-outline">
            <span className="flex items-center text-rose-400 gap-0.5 font-medium">
              <span className="material-symbols-outlined text-xs">trending_up</span> +$42.00
            </span>
            <span>vs prior 3mo avg</span>
          </div>
        </div>

        {/* Annual Run-Rate */}
        <div className="rounded-xl p-4 bg-surface-container-low/80 backdrop-blur-xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-outline uppercase tracking-wider font-semibold font-mono">
              Annual Run-Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-outline">
              <span className="material-symbols-outlined text-base">stacked_bar_chart</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <div className="text-2xl font-bold text-on-surface font-mono">
              ${annualRunRate.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-outline">/yr</span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-xs text-outline">
            <span className="text-on-surface font-medium">8.4%</span>
            <span>of overhead capital</span>
          </div>
        </div>

        {/* Potential Savings Identified */}
        <div className="rounded-xl p-4 bg-gradient-to-b from-surface-container-high/90 to-surface-container/70 backdrop-blur-2xl border border-primary/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-primary uppercase tracking-wider font-bold font-mono">
                Identified Recapture
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-base">savings</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <div className="text-2xl font-bold text-primary font-mono">
              ${potentialSavings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-primary/80">/yr</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">3 Actionable Triages</span>
            <button
              onClick={handleExecuteAllTriages}
              className="text-primary font-medium hover:underline flex items-center gap-0.5"
            >
              Execute All <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Recommendation Tiers (Triaged Cards) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-xl">auto_awesome</span>
            <h2 className="text-base font-semibold text-on-surface">AI Recommendation Tiers</h2>
            <span className="text-xs text-outline px-2 py-0.5 rounded bg-surface-container font-mono">
              Zero Auto-Cancellations Policy
            </span>
          </div>
          <span className="text-xs text-outline font-mono">Autonomous heuristics updated live</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* TIER 1: KEEP */}
          <div className="rounded-xl bg-surface-container-low/70 border border-white/5 p-4 flex flex-col justify-between hover:border-emerald-500/20 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">
                    KEEP (High ROI)
                  </span>
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold font-mono">90%+ Velocity</span>
              </div>

              <div className="space-y-2">
                <div className="p-2 rounded bg-surface-container border border-outline-variant/20 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-semibold text-on-surface">Figma Organization</div>
                    <div className="text-[10px] text-outline">Daily activity • 92% velocity</div>
                  </div>
                  <span className="font-mono font-bold text-on-surface">$75.00/mo</span>
                </div>
                <div className="p-2 rounded bg-surface-container border border-outline-variant/20 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-semibold text-on-surface">GitHub Team</div>
                    <div className="text-[10px] text-outline">24 commits this week • Active CI</div>
                  </div>
                  <span className="font-mono font-bold text-on-surface">$40.00/mo</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-outline mt-3">
              <span>Combined Drag: <strong className="text-on-surface font-mono">$115.00/mo</strong></span>
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-xs">verified</span> Retain
              </span>
            </div>
          </div>

          {/* TIER 2: REVIEW */}
          <div className="rounded-xl bg-surface-container-low/70 border border-amber-400/20 p-4 flex flex-col justify-between hover:border-amber-400/40 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">
                    REVIEW (Downgrade)
                  </span>
                </div>
                <span className="text-[11px] text-amber-300 font-semibold font-mono">Save $540/yr</span>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 rounded bg-surface-container border border-amber-400/20 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-white">Adobe Creative Cloud</span>
                    <span className="font-mono font-bold text-amber-300">$89.99/mo</span>
                  </div>
                  <p className="text-[11px] text-outline-variant leading-relaxed">
                    Only 2 app logins in 42 days. Switch to Photography plan + Standalone to save{" "}
                    <strong className="text-primary">$540.00/yr</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs mt-3">
              <span className="text-outline">Save $45/mo</span>
              <button
                onClick={() => handlePreemptCharge("Adobe Creative Cloud")}
                className="px-3 py-1 rounded-lg bg-surface-container-high border border-amber-400/30 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors"
              >
                Apply Downgrade
              </button>
            </div>
          </div>

          {/* TIER 3: CONSIDER CANCELLING */}
          <div className="rounded-xl bg-surface-container-low/70 border border-rose-500/20 p-4 flex flex-col justify-between hover:border-rose-500/40 transition-all relative overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-wider font-mono">
                    CONSIDER CANCELLING
                  </span>
                </div>
                <span className="text-[11px] text-rose-400 font-semibold font-mono">$1,080/yr drag</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2 rounded bg-surface-container border border-rose-500/20 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-white">Webflow Workspace</div>
                    <div className="text-[10px] text-rose-400/80">0 active editor seats (90d)</div>
                  </div>
                  <span className="font-mono font-bold text-white">$60.00/mo</span>
                </div>
                <div className="p-2 rounded bg-surface-container border border-rose-500/20 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-white">Otter.ai Business</div>
                    <div className="text-[10px] text-rose-400/80">0 audio uploads in 74d</div>
                  </div>
                  <span className="font-mono font-bold text-white">$30.00/mo</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs mt-3">
              <span className="text-outline">Never auto-cancelled</span>
              <button
                onClick={handleExecuteAllTriages}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-secondary-container to-secondary-container/80 text-white text-xs font-semibold shadow hover:brightness-110"
              >
                Queue for Review
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Renewal Timeline Rail */}
      <section className="rounded-xl bg-surface-container-low/80 border border-white/5 p-4 backdrop-blur-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">event_upcoming</span>
            <h3 className="text-sm font-semibold text-on-surface">Upcoming Renewal Timeline</h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-outline">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> Due ≤ 7 Days
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Due ≤ 14 Days
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-secondary" /> Due ≤ 30 Days
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 7 Days */}
          <div className="p-3 rounded-lg bg-surface-container border border-rose-500/20 text-xs">
            <div className="flex justify-between items-center mb-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30 uppercase font-mono">
                Next 7 Days (Urgent)
              </span>
              <span className="font-mono text-rose-400 font-bold">$89.99</span>
            </div>
            <div className="font-semibold text-white">Adobe Creative Cloud</div>
            <div className="text-[11px] text-outline mb-2">Renews Oct 28 (In 3d)</div>
            <button
              onClick={() => handlePreemptCharge("Adobe Creative Cloud")}
              className="text-primary hover:underline text-[11px] font-semibold"
            >
              Pre-empt Charge →
            </button>
          </div>

          {/* 14 Days */}
          <div className="p-3 rounded-lg bg-surface-container border border-amber-400/20 text-xs">
            <div className="flex justify-between items-center mb-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30 uppercase font-mono">
                Next 14 Days
              </span>
              <span className="font-mono text-amber-300 font-bold">$90.00</span>
            </div>
            <div className="font-semibold text-white">Webflow & Otter.ai</div>
            <div className="text-[11px] text-outline mb-2">Nov 03 & Nov 07</div>
            <button
              onClick={() => handlePreemptCharge("Webflow & Otter")}
              className="text-primary hover:underline text-[11px] font-semibold"
            >
              Review Licenses →
            </button>
          </div>

          {/* 30 Days */}
          <div className="p-3 rounded-lg bg-surface-container border border-secondary/20 text-xs">
            <div className="flex justify-between items-center mb-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary/10 text-secondary border border-secondary/30 uppercase font-mono">
                Next 30 Days
              </span>
              <span className="font-mono text-secondary font-bold">$485.00</span>
            </div>
            <div className="font-semibold text-white">Figma, ChatGPT, AWS</div>
            <div className="text-[11px] text-outline mb-2">High velocity operations</div>
            <span className="text-emerald-400 text-[11px] font-semibold">Standard Renewal OK</span>
          </div>
        </div>
      </section>

      {/* Subscription Audit Table & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table (8 cols) */}
        <div className="lg:col-span-8 rounded-xl bg-surface-container-low/80 border border-white/5 backdrop-blur-xl overflow-hidden">
          <div className="p-4 border-b border-outline-variant/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-on-surface">Subscription Audit Table</h3>
              <p className="text-xs text-outline">Real-time utilization velocity mapped to direct card debits</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              {(["ALL", "DORMANT", "SAVINGS"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    filterMode === mode
                      ? "bg-surface-container text-white font-medium"
                      : "text-outline hover:text-white"
                  }`}
                >
                  {mode === "ALL" ? "All Categories" : mode === "DORMANT" ? "Dormant Only" : "Savings Targets"}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant/20 text-outline uppercase tracking-wider bg-surface-container-lowest/40 font-mono text-[11px]">
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Cost</th>
                  <th className="py-3 px-3">Last Active</th>
                  <th className="py-3 px-3">Usage</th>
                  <th className="py-3 px-3 text-right">AI Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {filteredSubs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <span className="material-symbols-outlined text-4xl text-outline">subscriptions</span>
                        <div className="font-semibold text-sm text-on-surface">No subscriptions monitored</div>
                        <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                          Add your design, cloud, and AI tools to monitor monthly burn, seat usage, and single-user savings.
                        </p>
                        <button
                          onClick={() => setIsAddModalOpen(true)}
                          className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-on-primary-fixed text-xs font-semibold shadow hover:brightness-110"
                        >
                          <span className="material-symbols-outlined text-sm">add_circle</span>
                          + Add First Subscription
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSubs.map((sub) => {
                  const isSelected = sub.id === selectedSubId;
                  return (
                    <tr
                      key={sub.id}
                      onClick={() => setSelectedSubId(sub.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-surface-container-high/60 border-l-2 border-primary"
                          : "hover:bg-surface-container/50"
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/30 flex items-center justify-center font-bold text-xs text-on-surface">
                            {sub.initials}
                          </div>
                          <div>
                            <div className="font-semibold text-on-surface text-sm flex items-center gap-1.5">
                              {sub.name}
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                            </div>
                            <div className="text-[11px] text-outline">{sub.subTitle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-surface-container text-on-surface-variant border border-outline-variant/30">
                          {sub.category}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-on-surface font-mono">${sub.costMonthly.toFixed(2)}/mo</div>
                        <div className="text-[10px] text-outline font-mono">${(sub.costMonthly * 12).toFixed(2)}/yr</div>
                      </td>
                      <td className="py-3 px-3 text-on-surface-variant text-[11px]">{sub.lastActive}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                sub.usageScore >= 70
                                  ? "bg-emerald-400"
                                  : sub.usageScore >= 20
                                  ? "bg-amber-400"
                                  : "bg-rose-400"
                              }`}
                              style={{ width: `${sub.usageScore}%` }}
                            />
                          </div>
                          <span
                            className={`text-[10px] font-semibold ${
                              sub.usageScore >= 70
                                ? "text-emerald-400"
                                : sub.usageScore >= 20
                                ? "text-amber-400"
                                : "text-rose-400"
                            }`}
                          >
                            {sub.usageStatus}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            sub.recommendation === "Keep Active"
                              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                              : sub.recommendation === "Suggest Downgrade"
                              ? "bg-amber-400/10 text-amber-300 border-amber-400/30"
                              : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                          }`}
                        >
                          {sub.recommendation}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Tool Detail Drawer (4 cols) */}
        {selectedSub && (
          <div className="lg:col-span-4 rounded-xl bg-surface-container-low/80 border border-white/5 p-5 backdrop-blur-xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <span className="text-xs font-mono uppercase tracking-wider text-outline">
                Subscription Telemetry Drawer
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 font-mono">
                {selectedSub.initials}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-on-surface">{selectedSub.name}</h3>
              <p className="text-xs text-outline">{selectedSub.subTitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/20">
                <span className="text-outline text-[11px] block">Monthly Cost</span>
                <span className="text-base font-bold font-mono text-on-surface mt-0.5 block">
                  ${selectedSub.costMonthly.toFixed(2)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/20">
                <span className="text-outline text-[11px] block">Annualized</span>
                <span className="text-base font-bold font-mono text-primary mt-0.5 block">
                  ${(selectedSub.costMonthly * 12).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/20 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-outline">Utilization Meter:</span>
                <span className="font-mono font-bold text-on-surface">{selectedSub.usageScore}%</span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    selectedSub.usageScore >= 70
                      ? "bg-emerald-400"
                      : selectedSub.usageScore >= 20
                      ? "bg-amber-400"
                      : "bg-rose-400"
                  }`}
                  style={{ width: `${selectedSub.usageScore}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-on-surface-variant">
                <span>Last login / event:</span>
                <span className="font-semibold text-white">{selectedSub.lastActive}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-secondary">
                <span className="material-symbols-outlined text-sm">psychology</span>
                Autonomous Recommendation
              </div>
              <p className="text-on-surface-variant text-[11px] leading-relaxed">
                {selectedSub.recommendation === "Keep Active"
                  ? "High daily velocity and critical team dependencies detected. Maintain active licensing tier."
                  : selectedSub.recommendation === "Suggest Downgrade"
                  ? "Infrequent editor activity detected. Single seat downgrade will conserve $45/mo with zero workflow disruption."
                  : "Zero activity registered over the past billing quarters. Safe pruning recommended."}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              {selectedSub.recommendation !== "Keep Active" && (
                <button
                  onClick={() => handlePruneSub(selectedSub.id)}
                  className="w-full py-2 px-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-semibold hover:bg-rose-950/60 transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">cancel</span>
                  Confirm Safe Prune
                </button>
              )}
              <button
                onClick={() => handlePreemptCharge(selectedSub.name)}
                className="w-full py-2 px-3 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface hover:text-white text-xs font-medium transition-all"
              >
                Pre-empt Next Charge
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Subscription Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface-container-low border border-primary/30 rounded-2xl shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">add_card</span>
                <h3 className="font-headline-sm text-base font-semibold text-on-surface">Track New Subscription</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-on-surface-variant hover:text-white">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleAddSubscription} className="space-y-4 text-xs">
              <div>
                <label className="block text-on-surface-variant font-medium mb-1">Service / Tool Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Linear, Cursor, Supabase"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-on-surface-variant font-medium mb-1">Plan / Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. Pro Team Tier • 1 Seat"
                  value={newSubTitle}
                  onChange={(e) => setNewSubTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Category</label>
                  <select
                    value={newSubCategory}
                    onChange={(e) => setNewSubCategory(e.target.value as typeof newSubCategory)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="Cloud">Cloud</option>
                    <option value="AI">AI</option>
                    <option value="Design">Design</option>
                    <option value="Productivity">Productivity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Monthly Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newSubCost}
                    onChange={(e) => setNewSubCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-on-primary-fixed font-semibold hover:brightness-110 shadow"
                >
                  Save to Firestore Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
