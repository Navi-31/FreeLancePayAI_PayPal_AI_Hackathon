"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/frontend/features/auth/AuthContext";

export function LandingPageClient() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#131319] text-[#e4e1ea] selection:bg-[#f4c86d] selection:text-[#131319] font-sans antialiased">
      {/* Glow Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#f4c86d]/15 to-transparent rounded-full blur-3xl opacity-70" />
        <div className="absolute top-[35%] -left-40 w-[600px] h-[600px] bg-[#561cc1]/15 rounded-full blur-[140px] opacity-60" />
        <div className="absolute top-[60%] -right-40 w-[600px] h-[600px] bg-[#f4c86d]/10 rounded-full blur-[140px] opacity-50" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-20 border-b border-[#4e4637]/30 bg-[#131319]/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f4c86d] to-[#d6ad55] p-[1px] shadow-lg shadow-[#f4c86d]/10">
              <div className="w-full h-full bg-[#131319] rounded-[11px] flex items-center justify-center group-hover:bg-[#1b1b21] transition-colors">
                <span className="font-mono text-base font-black text-[#f4c86d]">FP</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-lg text-white font-mono flex items-center gap-2">
                FreelancePay <span className="text-[#f4c86d]">AI</span>
              </span>
              <span className="text-[10px] text-[#9a8f7e] uppercase tracking-widest font-semibold">
                Autonomous Wealth Engine
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#d1c5b2]">
            <a href="#features" className="hover:text-[#f4c86d] transition-colors">Capabilities</a>
            <a href="#rails" className="hover:text-[#f4c86d] transition-colors">PayPal Rails</a>
            <a href="#security" className="hover:text-[#f4c86d] transition-colors">Security & Escrow</a>
            <a href="#intelligence" className="hover:text-[#f4c86d] transition-colors">AI Telemetry</a>
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#f4c86d] to-[#ebc166] text-[#131319] font-semibold text-sm shadow-lg shadow-[#f4c86d]/20 hover:brightness-110 transition-all active:scale-[0.98]"
              >
                <span>Command Center</span>
                <span className="text-xs font-mono font-bold bg-[#131319]/20 px-1.5 py-0.5 rounded">
                  {user?.name?.split(" ")[0] || "PRO"}
                </span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-[#e4e1ea] hover:text-[#f4c86d] hover:bg-[#1f1f25] transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#f4c86d] text-[#131319] font-semibold text-sm shadow-md shadow-[#f4c86d]/20 hover:bg-[#ffdea0] transition-all active:scale-[0.98]"
                >
                  <span>Get Started</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-28 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#1f1f25] border border-[#f4c86d]/30 text-xs text-[#f4c86d] font-mono font-medium mb-8 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-[#f4c86d] animate-ping" />
          <span>AUTONOMOUS FISCAL INTELLIGENCE &bull; PAYPAL AI HACKATHON</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white max-w-5xl mx-auto leading-[1.1] mb-6">
          Autonomous Wealth Engine for <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#f4c86d] via-[#ffdea0] to-[#ebc166] bg-clip-text text-transparent">
            Independent Creators & Engineers
          </span>
        </h1>

        <p className="text-base sm:text-xl text-[#d1c5b2] max-w-3xl mx-auto leading-relaxed mb-10">
          Eliminate unpaid invoices, automate multi-milestone escrow safeguards, sweep dynamic tax reserve vaults, and orchestrate intelligent client collections on high-trust PayPal rails.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#f4c86d] to-[#ebc166] text-[#131319] font-bold text-base shadow-xl shadow-[#f4c86d]/25 hover:brightness-110 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <span>Create Free Account</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#1b1b21] border border-[#4e4637] text-white font-medium text-base hover:bg-[#2a2930] hover:border-[#f4c86d]/50 transition-all flex items-center justify-center gap-2"
          >
            <span>Live Showcase</span>
          </Link>
        </div>

        {/* Hero Interactive Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto text-left">
          <div className="p-6 rounded-2xl bg-[#1b1b21]/80 border border-[#4e4637]/40 backdrop-blur-md hover:border-[#f4c86d]/40 transition-all">
            <div className="flex items-center justify-between text-xs text-[#9a8f7e] font-mono mb-2">
              <span>ACTIVE ESCROW</span>
              <span className="text-[#10b981] font-bold">100% SECURE</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono">$12,450.00</div>
            <p className="text-xs text-[#d1c5b2] mt-1">Multi-milestone authorization with zero non-payment risk.</p>
          </div>

          <div className="p-6 rounded-2xl bg-[#1b1b21]/80 border border-[#4e4637]/40 backdrop-blur-md hover:border-[#f4c86d]/40 transition-all">
            <div className="flex items-center justify-between text-xs text-[#9a8f7e] font-mono mb-2">
              <span>TAX VAULT SWEEP</span>
              <span className="text-[#f4c86d] font-bold">AUTO 25%</span>
            </div>
            <div className="text-2xl font-bold text-[#f4c86d] font-mono">$3,112.50</div>
            <p className="text-xs text-[#d1c5b2] mt-1">Real-time withholding routed away from operational cash.</p>
          </div>

          <div className="p-6 rounded-2xl bg-[#1b1b21]/80 border border-[#4e4637]/40 backdrop-blur-md hover:border-[#f4c86d]/40 transition-all">
            <div className="flex items-center justify-between text-xs text-[#9a8f7e] font-mono mb-2">
              <span>SETTLEMENT VELOCITY</span>
              <span className="text-[#10b981] font-bold">+4.2 DAYS</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono">1.8 Days Avg</div>
            <p className="text-xs text-[#d1c5b2] mt-1">PayPal Sandbox instant authorization & capture protocol.</p>
          </div>

          <div className="p-6 rounded-2xl bg-[#1b1b21]/80 border border-[#4e4637]/40 backdrop-blur-md hover:border-[#f4c86d]/40 transition-all">
            <div className="flex items-center justify-between text-xs text-[#9a8f7e] font-mono mb-2">
              <span>AI RECOVERY COPILOT</span>
              <span className="text-[#9665FF] font-bold">AUTONOMOUS</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono">98.4% Yield</div>
            <p className="text-xs text-[#d1c5b2] mt-1">Adaptive escalation with human approval guardrails.</p>
          </div>
        </div>
      </section>

      {/* Feature Architecture Matrix */}
      <section id="features" className="relative z-10 py-24 px-6 border-t border-[#4e4637]/30 bg-[#0e0e14]/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-xs font-mono font-bold text-[#f4c86d] uppercase tracking-widest mb-3">
              FOUR AUTONOMOUS PILLARS
            </h2>
            <p className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
              Built for High-Stakes Freelancing
            </p>
            <p className="text-[#d1c5b2] mt-4 text-base">
              A complete financial operating system engineered to protect your time, liquidity, and client relationships.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="p-8 rounded-2xl bg-[#1b1b21] border border-[#4e4637]/40 flex flex-col justify-between hover:border-[#f4c86d]/50 transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#f4c86d]/10 border border-[#f4c86d]/30 flex items-center justify-center text-[#f4c86d] mb-6">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Milestone Escrow Safeguards</h3>
                <p className="text-[#d1c5b2] text-sm leading-relaxed mb-6">
                  Protect delivery with pre-authorized milestones. Clients lock funding upfront via PayPal Sandbox, releasing on verified milestone delivery.
                </p>
              </div>
              <div className="pt-4 border-t border-[#4e4637]/30 text-xs font-mono text-[#f4c86d]">
                &bull; Zero upfront abandonment
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-8 rounded-2xl bg-[#1b1b21] border border-[#4e4637]/40 flex flex-col justify-between hover:border-[#f4c86d]/50 transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#561cc1]/20 border border-[#9665FF]/30 flex items-center justify-center text-[#9665FF] mb-6">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">AI-Powered Outreach Copilot</h3>
                <p className="text-[#d1c5b2] text-sm leading-relaxed mb-6">
                  Gemini intelligence evaluates client reliability scores and auto-drafts diplomatic, escalating payment reminders with strict human approval.
                </p>
              </div>
              <div className="pt-4 border-t border-[#4e4637]/30 text-xs font-mono text-[#9665FF]">
                &bull; 100% human-approved dispatch
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-8 rounded-2xl bg-[#1b1b21] border border-[#4e4637]/40 flex flex-col justify-between hover:border-[#f4c86d]/50 transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-[#10b981] mb-6">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Automatic Tax Reserve Vault</h3>
                <p className="text-[#d1c5b2] text-sm leading-relaxed mb-6">
                  Every settled invoice is instantly split. Your quarterly tax reserve is quarantined automatically so you never face surprise tax bills.
                </p>
              </div>
              <div className="pt-4 border-t border-[#4e4637]/30 text-xs font-mono text-[#10b981]">
                &bull; Auto quarterly reserve projections
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Callout: PayPal Sandbox */}
      <section id="rails" className="relative z-10 py-20 px-6 max-w-7xl mx-auto">
        <div className="p-10 lg:p-14 rounded-3xl bg-gradient-to-br from-[#1b1b21] via-[#1f1f25] to-[#131319] border border-[#f4c86d]/40 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl">
            <span className="text-xs font-mono font-bold text-[#f4c86d] uppercase tracking-widest">
              OFFICIAL PAYPAL AI HACKATHON PROTOCOL
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2 mb-4">
              Real Sandbox OAuth & Webhook Verification
            </h2>
            <p className="text-[#d1c5b2] text-base leading-relaxed mb-8">
              Seamlessly connected to PayPal REST v2 APIs. Test orders, authorizations, captures, and instant invoice webhook synchronization with complete idempotency and zero financial risk.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="px-6 py-3 rounded-lg bg-[#f4c86d] text-[#131319] font-bold text-sm hover:bg-[#ffdea0] transition-colors"
              >
                Launch Live Session
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 rounded-lg bg-[#131319] border border-[#4e4637] text-white text-sm font-medium hover:bg-[#1b1b21] transition-colors"
              >
                Sign In to Existing Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#4e4637]/30 bg-[#0e0e14] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-[#9a8f7e]">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-white">FreelancePay AI</span>
            <span>&bull;</span>
            <span>Autonomous Fiscal Engineering</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-[#f4c86d] transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-[#f4c86d] transition-colors">Sign Up</Link>
            <Link href="/dashboard" className="hover:text-[#f4c86d] transition-colors">Dashboard</Link>
          </div>
          <p className="text-xs text-[#71717a]">
            &copy; 2026 FreelancePay AI. Built for the PayPal AI Hackathon.
          </p>
        </div>
      </footer>
    </div>
  );
}
