"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/frontend/features/auth/AuthContext";

export function LoginClient() {
  const router = useRouter();
  const { user, loading: authLoading, setSessionUser, refreshSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect immediately to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid email or password.");
        setLoading(false);
        return;
      }

      if (data.requireVerification) {
        // User registered but has not verified email yet
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}&purpose=SIGNUP_VERIFICATION`);
        return;
      }

      // Direct success — establish user session immediately and navigate to dashboard
      if (data.user) {
        setSessionUser(data.user);
      }
      const confirmed = await refreshSession();
      if (confirmed) {
        router.push("/dashboard");
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Network error contacting authentication servers.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#08080D] text-[#e4e1ea] min-h-screen selection:bg-[#d6ad55] selection:text-[#0e0e14] flex flex-col font-sans">
      {/* Background Ambience */}
      <div className="fixed top-[-20%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-[#7040DB]/10 blur-[130px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-15%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-[#D6AD55]/08 blur-[150px] pointer-events-none -z-10" />

      {/* Top Navbar */}
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
          href="/"
          className="text-xs text-[#d1c5b2] hover:text-[#f4c86d] transition-colors flex items-center gap-1.5"
        >
          <span>&larr;</span>
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Split Layout */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* LEFT PANEL: Value Proposition & Security Accreditations */}
          <section className="lg:col-span-5 hidden lg:flex flex-col justify-between p-8 rounded-2xl bg-[#131319]/90 border border-[#4e4637]/40 shadow-2xl relative overflow-hidden h-[540px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#f4c86d]/5 rounded-full blur-3xl pointer-events-none" />

            {/* Top Brand Badge */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#201f2d] border border-[#d6ad55]/30 text-[#f4c86d] text-xs font-mono mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f4c86d] animate-pulse" />
                <span>Zero-Liability Security Mesh</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
                Direct Settlement.<br />
                Autonomous Reserves.
              </h2>
              <p className="text-[#d1c5b2] text-sm mt-3 leading-relaxed">
                Connect your client accounts to intelligent escrow triggers, automated tax-reserve withholding, and PayPal Sandbox rails.
              </p>
            </div>

            {/* Institutional Features */}
            <div className="relative z-10 space-y-4 my-auto">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#201f2d] border border-[#4e4637]/40 flex items-center justify-center shrink-0 text-[#f4c86d]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Direct Authenticated Access</h3>
                  <p className="text-xs text-[#9a8f7e] mt-0.5">Secure salted bcrypt credential validation with cryptographically signed session tokens.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#201f2d] border border-[#4e4637]/40 flex items-center justify-center shrink-0 text-[#f4c86d]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Automated Tax Vault Allocation</h3>
                  <p className="text-xs text-[#9a8f7e] mt-0.5">Every settlement automatically routes designated tax percentages to liquid safe-harbor vaults.</p>
                </div>
              </div>

              <div className="border-l-2 border-[#f4c86d]/60 pl-4 py-1">
                <blockquote className="text-sm text-[#e4e1ea] italic font-light leading-relaxed">
                  “Precision financial intelligence designed exclusively for sovereign independent operators.”
                </blockquote>
                <p className="text-xs text-[#f4c86d] mt-2 font-medium tracking-wide">
                  — FreelancePay AI Executive Council
                </p>
              </div>
            </div>

            {/* Bottom Footer Telemetry */}
            <div className="relative z-10 pt-4 border-t border-[#4e4637]/30 flex items-center justify-between text-[#9a8f7e] text-xs">
              <div className="flex items-center gap-2">
                <span>Global Multi-Currency Hub</span>
              </div>
              <span className="text-[#d0bcff] font-mono tracking-tight">LATENCY 12ms</span>
            </div>
          </section>

          {/* RIGHT PANEL: Authentication Form */}
          <section className="lg:col-span-7 flex flex-col justify-center items-center py-4 sm:py-6">
            <div className="w-full max-w-lg rounded-2xl bg-[#1E1D29]/90 border border-white/10 p-6 sm:p-8 xl:p-10 backdrop-blur-2xl shadow-2xl relative">
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#F0D48B]/40 to-transparent" />

              {/* Header */}
              <div className="text-left mb-8">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#7040DB]/15 border border-[#9665FF]/30 text-[#d0bcff] mb-3">
                  <span className="text-[11px] font-semibold tracking-wide uppercase font-mono">
                    Institutional Portal
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Welcome Back
                </h1>
                <p className="text-sm text-[#d1c5b2] mt-1.5">
                  Sign in to take control of your freelance finances.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
                  <svg className="w-5 h-5 shrink-0 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Direct Email + Password Form */}
              <form className="space-y-5" onSubmit={handlePasswordSubmit}>
                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9a8f7e]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full pl-11 pr-4 py-3 bg-[#101016] border border-white/10 rounded-lg text-white placeholder:text-[#9a8f7e]/50 focus:outline-none focus:border-[#f4c86d] focus:ring-1 focus:ring-[#f4c86d] transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-white" htmlFor="password">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-[#d0bcff] hover:text-[#f4c86d] transition-colors font-medium"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9a8f7e]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-11 pr-11 py-3 bg-[#101016] border border-white/10 rounded-lg text-white placeholder:text-[#9a8f7e]/50 focus:outline-none focus:border-[#f4c86d] focus:ring-1 focus:ring-[#f4c86d] transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#9a8f7e] hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-lg bg-gradient-to-r from-[#F0D48B] to-[#D6AD55] text-[#08080D] font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:opacity-95 hover:shadow-[0_0_25px_rgba(240,212,139,0.35)] transition-all active:scale-[0.98] mt-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-[#08080D] border-t-transparent rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </span>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Footer */}
              <div className="mt-8 text-center pt-6 border-t border-[#4e4637]/30">
                <p className="text-sm text-[#d1c5b2]">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/signup"
                    className="text-[#f4c86d] hover:text-[#ffdea0] font-semibold transition-colors inline-flex items-center gap-1"
                  >
                    <span>Create Account</span>
                    <span>&rarr;</span>
                  </Link>
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
