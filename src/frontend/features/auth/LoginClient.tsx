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

  // OTP Step State (if 2FA challenge is returned)
  const [requireOtp, setRequireOtp] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string>("");
  const [resendCooldown, setResendCooldown] = useState<number>(60);
  const [resending, setResending] = useState<boolean>(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  // Resend countdown timer
  useEffect(() => {
    if (!requireOtp || resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [requireOtp, resendCooldown]);

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setOtpError(null);
    setResendSuccess(null);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          purpose: "LOGIN_OTP",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || "Failed to resend verification code.");
        if (data.cooldownSecondsRemaining) {
          setResendCooldown(data.cooldownSecondsRemaining);
        }
        setResending(false);
        return;
      }

      setResendSuccess("A fresh verification code has been dispatched to your email.");
      setResendCooldown(data.cooldownSecondsRemaining || 60);
      setOtp(["", "", "", "", "", ""]);
      setResending(false);
    } catch {
      setOtpError("Network error attempting to resend code.");
      setResending(false);
    }
  };

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

      if (data.requireOtp) {
        // 2-Factor OTP required
        setMaskedEmail(data.maskedEmail || email.trim());
        if (data.cooldownSecondsRemaining) {
          setResendCooldown(data.cooldownSecondsRemaining);
        } else {
          setResendCooldown(60);
        }
        setRequireOtp(true);
        setLoading(false);
        return;
      }

      // Direct success
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

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      // Paste handling
      const digits = val.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(digits.length, 5);
      const el = document.getElementById(`login-otp-${nextIdx}`);
      el?.focus();
      return;
    }

    const clean = val.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = clean;
    setOtp(newOtp);

    if (clean && index < 5) {
      const nextEl = document.getElementById(`login-otp-${index + 1}`);
      nextEl?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevEl = document.getElementById(`login-otp-${index - 1}`);
      prevEl?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    const code = otp.join("");
    if (code.length !== 6) {
      setOtpError("Please enter all 6 digits of your verification code.");
      return;
    }

    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: code,
          purpose: "LOGIN_OTP",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || "Invalid verification code.");
        setOtpLoading(false);
        return;
      }

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
      setOtpError("Network error verifying security code.");
      setOtpLoading(false);
    }
  };

  return (
    <div className="bg-[#08080D] text-[#e4e1ea] min-h-screen selection:bg-[#d6ad55] selection:text-[#0e0e14] overflow-x-hidden font-sans">
      {/* Ambient Light Emission Overlays */}
      <div className="fixed top-[-20%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-[#7040DB]/10 blur-[130px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-15%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-[#D6AD55]/08 blur-[150px] pointer-events-none -z-10" />

      <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-[1440px] grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* LEFT PANEL: Telemetry & Visual Showcase */}
          <section className="hidden lg:flex lg:col-span-5 flex-col justify-between rounded-2xl bg-[#101016]/90 border border-white/5 p-8 xl:p-10 backdrop-blur-2xl relative overflow-hidden shadow-2xl">
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#561cc1]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#D6AD55]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <Link href="/" className="flex items-center gap-3.5 mb-8 group">
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#F0D48B] via-[#D6AD55] to-[#795902] p-[1px] flex items-center justify-center shadow-lg shadow-[#f4c86d]/20">
                  <div className="w-full h-full bg-[#08080D] rounded-lg flex items-center justify-center group-hover:bg-[#101016] transition-colors">
                    <span className="font-mono text-base font-black text-[#f4c86d]">FP</span>
                  </div>
                </div>
                <div>
                  <span className="text-xl font-bold tracking-tight text-[#f4c86d] block leading-none font-mono">
                    FreelancePay AI
                  </span>
                  <span className="text-[10px] text-[#d1c5b2] font-medium tracking-wider uppercase mt-1 block">
                    Autonomous Wealth Engine
                  </span>
                </div>
              </Link>

              {/* Real-Time Encrypted Vault Telemetry Card */}
              <div className="rounded-xl bg-[#171720]/80 border border-white/[0.06] p-5 backdrop-blur-xl relative mb-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#4e4637]/30">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#f4c86d] animate-pulse" />
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">
                      Encrypted Vault Status
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#561cc1]/30 border border-[#d0bcff]/20 text-[#d0bcff] text-[10px] tracking-wider uppercase font-mono font-medium">
                    FIPS-140-3 Active
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-[#101016]/90 border border-white/5">
                    <span className="text-xs text-[#d1c5b2] block mb-1">Algorithmic Shield</span>
                    <div className="flex items-center gap-1.5 text-lg font-bold text-[#f4c86d] font-mono">
                      <span>99.98%</span>
                    </div>
                    <span className="text-[10px] text-[#9a8f7e] mt-0.5 block">Zero leak vector</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#101016]/90 border border-white/5">
                    <span className="text-xs text-[#d1c5b2] block mb-1">Instant Yield Velocity</span>
                    <div className="flex items-center gap-1.5 text-lg font-bold text-[#d0bcff] font-mono">
                      <span>+5.42%</span>
                    </div>
                    <span className="text-[10px] text-[#9a8f7e] mt-0.5 block">Automated treasury</span>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-[#1E1D29]/70 border border-[#d0bcff]/15 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#561cc1]/40 flex items-center justify-center text-[#d0bcff]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-white block">Cashflow Shield Ping</span>
                      <span className="text-[11px] text-[#d1c5b2]">Tax partition executed (EUR 14,250.00)</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#f4c86d] bg-[#f4c86d]/10 px-2 py-0.5 rounded border border-[#f4c86d]/20 font-mono">
                    3m ago
                  </span>
                </div>
              </div>
            </div>

            {/* Quote */}
            <div className="relative z-10 my-4 space-y-4">
              <div className="flex flex-wrap gap-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E1D29]/90 border border-[#F0D48B]/20 text-xs text-[#f4c86d]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f4c86d]" />
                  <span>Auto-Partitioning Active</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E1D29]/90 border border-[#9665FF]/25 text-xs text-[#d0bcff]">
                  <span>Sub-second Payout Rails</span>
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
                  {requireOtp ? "Two-Factor Verification" : "Welcome Back"}
                </h1>
                <p className="text-sm text-[#d1c5b2] mt-1.5">
                  {requireOtp
                    ? `Enter the 6-digit code sent to ${email}`
                    : "Sign in to take control of your freelance finances."}
                </p>
              </div>

              {/* Error Alert */}
              {(error || otpError) && (
                <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
                  <svg className="w-5 h-5 shrink-0 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error || otpError}</span>
                </div>
              )}

              {/* STEP 1: Email + Password */}
              {!requireOtp ? (
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
                        <span>Continue</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* STEP 2: 6-Digit OTP Form */
                <form className="space-y-6" onSubmit={handleOtpSubmit}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-mono uppercase tracking-wider text-[#9a8f7e]">
                        Security Verification Code
                      </label>
                      <span className="text-[11px] text-[#f4c86d] font-mono">2FA Active</span>
                    </div>
                    <p className="text-xs text-[#d1c5b2] mb-4">
                      Enter the 6-digit code sent to{" "}
                      <span className="text-white font-mono font-medium">{maskedEmail || email}</span>
                    </p>

                    {resendSuccess && (
                      <div className="mb-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-emerald-400">check_circle</span>
                        <span>{resendSuccess}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-6 gap-2 sm:gap-3">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`login-otp-${idx}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-full h-14 sm:h-16 text-center font-mono text-2xl font-bold text-white bg-[#101016] border border-[#4e4637]/50 rounded-lg focus:border-[#f4c86d] focus:ring-2 focus:ring-[#f4c86d]/20 outline-none transition-all"
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full py-3.5 px-6 rounded-lg bg-gradient-to-r from-[#F0D48B] to-[#D6AD55] text-[#08080D] font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:opacity-95 hover:shadow-[0_0_25px_rgba(240,212,139,0.35)] transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {otpLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-[#08080D] border-t-transparent rounded-full animate-spin" />
                        <span>Verifying Code...</span>
                      </span>
                    ) : (
                      <>
                        <span>Verify & Sign In</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>

                  {/* Resend OTP Section */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#4e4637]/30 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setRequireOtp(false);
                        setOtpError(null);
                        setResendSuccess(null);
                      }}
                      className="text-[#9a8f7e] hover:text-white transition-colors"
                    >
                      &larr; Re-enter credentials
                    </button>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || resending}
                      className="font-medium text-[#f4c86d] hover:text-[#ffdea0] disabled:text-[#9a8f7e] disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                    >
                      {resending ? (
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          <span>Sending code...</span>
                        </span>
                      ) : resendCooldown > 0 ? (
                        <span>Resend code in {resendCooldown}s</span>
                      ) : (
                        <span>Resend OTP</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

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
