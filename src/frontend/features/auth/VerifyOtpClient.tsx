"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export function VerifyOtpClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const purpose = (searchParams.get("purpose") as "SIGNUP_VERIFICATION" | "LOGIN_OTP") || "SIGNUP_VERIFICATION";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Timers: 5-minute expiry (300s), 100-second resend cooldown
  const [expirySeconds, setExpirySeconds] = useState(300);
  const [cooldownSeconds, setCooldownSeconds] = useState(100);

  useEffect(() => {
    const timer = setInterval(() => {
      setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const maskEmail = (raw: string) => {
    if (!raw.includes("@")) return raw;
    const [name, domain] = raw.split("@");
    if (name.length <= 2) return `${name}•••@${domain}`;
    return `${name[0]}••••${name.slice(-2)}@${domain}`;
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      const digits = val.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(digits.length, 5);
      const el = document.getElementById(`otp-box-${nextIdx}`);
      el?.focus();
      return;
    }

    const clean = val.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = clean;
    setOtp(newOtp);

    if (clean && index < 5) {
      const nextEl = document.getElementById(`otp-box-${index + 1}`);
      nextEl?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevEl = document.getElementById(`otp-box-${index - 1}`);
      prevEl?.focus();
    }
  };

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailParam.toLowerCase().trim(),
          otp: code,
          purpose,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed. Check your code.");
        setLoading(false);
        return;
      }

      setSuccessMsg("Account verified successfully! Initializing command center...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch {
      setError("Network error communicating with verification service.");
      setLoading(false);
    }
  }, [otp, emailParam, purpose, router]);

  const handleResend = async () => {
    if (cooldownSeconds > 0 || resending) return;
    setError(null);
    setSuccessMsg(null);
    setResending(true);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailParam.toLowerCase().trim(),
          purpose,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend code.");
        if (data.cooldownSecondsRemaining) {
          setCooldownSeconds(data.cooldownSecondsRemaining);
        }
        setResending(false);
        return;
      }

      setSuccessMsg("A fresh 6-digit code has been dispatched to your email.");
      setOtp(["", "", "", "", "", ""]);
      setExpirySeconds(300);
      setCooldownSeconds(100);
      setResending(false);
    } catch {
      setError("Network error during code dispatch.");
      setResending(false);
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
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-[#f4c86d] font-mono leading-none">
              FreelancePay AI
            </span>
            <span className="text-[10px] text-[#9a8f7e] tracking-wider uppercase mt-0.5">
              Autonomous Wealth Engine
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#101016] border border-[#4e4637]/30 text-xs font-mono text-[#d1c5b2]">
          <span className="w-2 h-2 rounded-full bg-[#f4c86d] animate-pulse" />
          <span>Ledger Guard 4.1 Encrypted</span>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="w-full flex-1 flex items-center justify-center px-4 py-10 relative z-10">
        <div className="w-full max-w-[540px] rounded-2xl bg-[#171720]/90 backdrop-blur-2xl border border-white/10 shadow-2xl relative overflow-hidden p-8 sm:p-10 flex flex-col items-center">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#f4c86d]/40 to-transparent" />

          {/* Shield Badge */}
          <div className="relative mb-6">
            <div className="absolute -inset-2 bg-gradient-to-r from-[#561cc1] to-[#f4c86d] rounded-full blur-md opacity-40 animate-pulse" />
            <div className="w-16 h-16 rounded-full bg-[#101016] border border-[#f4c86d]/30 flex items-center justify-center relative shadow-[0_0_30px_rgba(112,64,219,0.35)]">
              <svg className="w-8 h-8 text-[#f4c86d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2 mb-6 w-full">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Verify Your Email
            </h1>
            <p className="text-sm text-[#d1c5b2] max-w-sm mx-auto">
              We&apos;ve sent a 6-digit verification code to your registered email address.
            </p>
          </div>

          {/* Masked Email Chip */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#101016] border border-white/10 mb-8 backdrop-blur-md text-xs">
            <svg className="w-4 h-4 text-[#f4c86d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="font-mono text-white font-medium">
              {emailParam ? maskEmail(emailParam) : "your-email@domain.com"}
            </span>
            <span className="text-[#9a8f7e]">&bull;</span>
            <Link
              href="/signup"
              className="text-[#f4c86d] hover:text-[#ffdea0] transition-colors font-medium underline underline-offset-2"
            >
              Change
            </Link>
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="w-full mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
              <svg className="w-5 h-5 shrink-0 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="w-full mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-3">
              <svg className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form className="w-full space-y-6" onSubmit={handleSubmit}>
            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="text-xs font-mono uppercase tracking-wider text-[#9a8f7e]">
                  AUTHENTICATION TOKEN
                </label>
                <span className="text-xs font-mono text-[#d0bcff]">6 Digits</span>
              </div>

              {/* 6 Inputs */}
              <div className="grid grid-cols-6 gap-2 sm:gap-3">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-box-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-full h-14 sm:h-16 text-center font-mono text-2xl font-bold text-white bg-[#101016] border border-[#4e4637]/50 rounded-lg focus:border-[#f4c86d] focus:ring-2 focus:ring-[#f4c86d]/20 outline-none transition-all"
                  />
                ))}
              </div>
            </div>

            {/* Dual Timer Surface Card */}
            <div className="w-full rounded-xl bg-[#101016]/80 border border-white/5 p-4 space-y-3.5 backdrop-blur-sm text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#f4c86d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[#d1c5b2]">
                    Code expires in:{" "}
                    <span className="text-[#f4c86d] font-mono font-bold">
                      {formatTimer(expirySeconds)}
                    </span>
                  </span>
                </div>
                <span className="text-[10px] text-[#9a8f7e] uppercase font-mono">5m scale</span>
              </div>

              <div className="h-[1px] w-full bg-white/5" />

              <div className="flex items-center justify-between text-[#9a8f7e]">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>
                    Resend available in:{" "}
                    <span className="text-white font-mono font-bold">
                      {formatTimer(cooldownSeconds)}
                    </span>
                  </span>
                </div>
                <span className="text-[10px] font-mono">100s cooldown</span>
              </div>
            </div>

            {/* Security note */}
            <p className="text-xs text-[#9a8f7e] leading-relaxed">
              A fresh code invalidates any previous submission and grants a new 5-minute validity window.
            </p>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-lg bg-gradient-to-r from-[#F0D48B] to-[#D6AD55] text-[#08080D] font-bold text-sm tracking-wide shadow-lg shadow-[#f4c86d]/20 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-[#08080D] border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Code...</span>
                  </span>
                ) : (
                  <>
                    <span>Verify Email</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={cooldownSeconds > 0 || resending}
                className={`w-full py-3 px-6 rounded-lg border font-medium text-xs flex items-center justify-center gap-2 transition-all ${
                  cooldownSeconds > 0 || resending
                    ? "bg-[#101016]/50 border-white/10 text-[#9a8f7e] cursor-not-allowed opacity-60"
                    : "bg-[#1b1b21] border-white/20 text-white hover:bg-[#252430] hover:border-[#f4c86d]/40 cursor-pointer"
                }`}
              >
                {resending ? (
                  <span>Dispatching new code...</span>
                ) : cooldownSeconds > 0 ? (
                  <span>Resend Code (Cooldown: {cooldownSeconds}s)</span>
                ) : (
                  <span>Request Fresh Verification Code</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
