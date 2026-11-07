"use client";

import React, { useState } from "react";
import Link from "next/link";

export function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to process password reset request.");
        setLoading(false);
        return;
      }

      setDispatched(true);
      setLoading(false);
    } catch {
      setError("Network error contacting security service.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#08080D] text-[#e4e1ea] min-h-screen selection:bg-[#d6ad55] selection:text-[#0e0e14] flex flex-col font-sans">
      <div className="fixed top-[-20%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-[#7040DB]/10 blur-[130px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-15%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-[#D6AD55]/08 blur-[150px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="relative z-20 w-full px-6 py-4 flex items-center justify-between border-b border-[#4e4637]/30 bg-[#131319]/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#F0D48B] via-[#D6AD55] to-[#795902] p-[1px] flex items-center justify-center shadow-lg">
            <div className="w-full h-full bg-[#08080D] rounded-lg flex items-center justify-center">
              <span className="font-mono text-sm font-black text-[#f4c86d]">FP</span>
            </div>
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-[#f4c86d] font-mono leading-none block">
              FreelancePay AI
            </span>
            <span className="text-[10px] text-[#9a8f7e] tracking-wider uppercase">
              Autonomous Wealth Engine
            </span>
          </div>
        </Link>
        <Link
          href="/login"
          className="text-xs text-[#d1c5b2] hover:text-[#f4c86d] transition-colors flex items-center gap-1.5"
        >
          <span>&larr;</span>
          <span>Back to Login</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[480px]">
          <div className="rounded-2xl bg-[#171720]/90 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#f4c86d]/40 to-transparent" />

            {!dispatched ? (
              /* Request Form State */
              <div className="space-y-6">
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-[#101016] border border-[#f4c86d]/30 flex items-center justify-center shadow-lg relative">
                    <svg className="w-8 h-8 text-[#f4c86d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div className="space-y-1.5">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Forgot Your Password?</h1>
                    <p className="text-xs text-[#d1c5b2] leading-relaxed">
                      Enter your registered email address. We&apos;ll send you a secure, time-limited password reset link.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
                    <svg className="w-4 h-4 shrink-0 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold text-white uppercase tracking-wider" htmlFor="email">
                      Registered Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="block w-full px-4 py-3 rounded-xl bg-[#101016] border border-white/10 text-white placeholder:text-[#9a8f7e]/50 text-sm focus:border-[#f4c86d] focus:ring-1 focus:ring-[#f4c86d] outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#F0D48B] to-[#D6AD55] text-[#08080D] font-bold text-sm tracking-wide shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-[#08080D] border-t-transparent rounded-full animate-spin" />
                        <span>Sending Link...</span>
                      </span>
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-2 border-t border-white/5 text-center">
                  <Link
                    href="/login"
                    className="text-xs text-[#9a8f7e] hover:text-[#f4c86d] transition-colors"
                  >
                    Remember your password? Sign In
                  </Link>
                </div>
              </div>
            ) : (
              /* Dispatched Success State */
              <div className="space-y-6 text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-[#101016] border border-[#d0bcff]/40 flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-[#d0bcff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5m0 0l-2.25 1.5a2 2 0 01-2.25 0L6.75 14.5" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#561cc1]/30 border border-[#d0bcff]/30 text-[#d0bcff] text-xs font-mono">
                    <span>Dispatched to Relay</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Reset Link Dispatched</h2>
                  <p className="text-xs text-[#d1c5b2] leading-relaxed max-w-sm mx-auto">
                    If an account exists for <strong className="text-white">{email}</strong>, you will receive password reset instructions within moments. The secure link expires in 15 minutes.
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <Link
                    href="/login"
                    className="w-full py-3 px-6 rounded-xl bg-[#1b1b21] hover:bg-[#252430] border border-white/10 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Return to Login</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
