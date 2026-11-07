"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Step = "REQUEST_OTP" | "VERIFY_OTP" | "RESET_PASSWORD" | "SUCCESS";

export function ForgotPasswordClient() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("REQUEST_OTP");
  const [email, setEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (step !== "VERIFY_OTP" || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  const getStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getStrength(newPassword);

  // STEP 1: Submit email to request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
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

      setMaskedEmail(data.maskedEmail || email.trim());
      setResendCooldown(data.cooldownSecondsRemaining || 60);
      setStep("VERIFY_OTP");
      setLoading(false);
    } catch {
      setError("Network error contacting security service.");
      setLoading(false);
    }
  };

  // OTP inputs navigation
  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      const digits = val.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(digits.length, 5);
      const el = document.getElementById(`reset-otp-${nextIdx}`);
      el?.focus();
      return;
    }

    const clean = val.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = clean;
    setOtp(newOtp);

    if (clean && index < 5) {
      const nextEl = document.getElementById(`reset-otp-${index + 1}`);
      nextEl?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevEl = document.getElementById(`reset-otp-${index - 1}`);
      prevEl?.focus();
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResendSuccess(null);

    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: code,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed. Check your code.");
        setLoading(false);
        return;
      }

      setResetToken(data.resetToken);
      setStep("RESET_PASSWORD");
      setLoading(false);
    } catch {
      setError("Network error communicating with verification service.");
      setLoading(false);
    }
  };

  // Resend OTP in Step 2
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setError(null);
    setResendSuccess(null);
    setResending(true);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          purpose: "PASSWORD_RESET",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend code.");
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
      setError("Network error communicating with verification service.");
      setResending(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          token: resetToken,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Password reset failed. Please request a new code.");
        setLoading(false);
        return;
      }

      setStep("SUCCESS");
      setLoading(false);
    } catch {
      setError("Network error communicating with security service.");
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
              Security Vault
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
        <div className="w-full max-w-[500px]">
          <div className="rounded-2xl bg-[#171720]/90 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#f4c86d]/40 to-transparent" />

            {/* Progress Indicators */}
            <div className="flex items-center justify-between pb-5 mb-5 border-b border-white/5 text-[11px] font-mono">
              <span className={step === "REQUEST_OTP" ? "text-[#f4c86d] font-bold" : "text-[#9a8f7e]"}>
                1. Request Code
              </span>
              <span className="text-white/20">&rarr;</span>
              <span className={step === "VERIFY_OTP" ? "text-[#f4c86d] font-bold" : "text-[#9a8f7e]"}>
                2. Verify OTP
              </span>
              <span className="text-white/20">&rarr;</span>
              <span className={step === "RESET_PASSWORD" || step === "SUCCESS" ? "text-[#f4c86d] font-bold" : "text-[#9a8f7e]"}>
                3. New Password
              </span>
            </div>

            {error && (
              <div className="mb-5 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-fade-in">
                <svg className="w-4 h-4 shrink-0 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: Request OTP Form */}
            {step === "REQUEST_OTP" && (
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
                      Enter your registered email address. We&apos;ll send you a single-use 6-digit security code to reset your password.
                    </p>
                  </div>
                </div>

                <form className="space-y-5" onSubmit={handleRequestOtp}>
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
                      placeholder="e.g. name@company.com"
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
                        <span>Sending Code...</span>
                      </span>
                    ) : (
                      <>
                        <span>Send Verification Code</span>
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
            )}

            {/* STEP 2: Verify OTP */}
            {step === "VERIFY_OTP" && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-[#101016] border border-[#f4c86d]/30 flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-[#f4c86d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Enter Security Code</h2>
                  <p className="text-xs text-[#d1c5b2] leading-relaxed">
                    A 6-digit password reset code was sent to{" "}
                    <span className="text-[#f4c86d] font-mono font-medium">{maskedEmail || email}</span>.
                  </p>
                </div>

                {resendSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-emerald-400">check_circle</span>
                    <span>{resendSuccess}</span>
                  </div>
                )}

                <form className="space-y-6" onSubmit={handleVerifyOtp}>
                  <div className="grid grid-cols-6 gap-2 sm:gap-3">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`reset-otp-${idx}`}
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#F0D48B] to-[#D6AD55] text-[#08080D] font-bold text-sm tracking-wide shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-[#08080D] border-t-transparent rounded-full animate-spin" />
                        <span>Verifying Code...</span>
                      </span>
                    ) : (
                      <>
                        <span>Verify & Continue</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("REQUEST_OTP");
                        setError(null);
                        setResendSuccess(null);
                      }}
                      className="text-[#9a8f7e] hover:text-white transition-colors"
                    >
                      &larr; Change email
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
              </div>
            )}

            {/* STEP 3: Reset Password Form */}
            {step === "RESET_PASSWORD" && (
              <div className="space-y-6">
                <div className="text-left space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono uppercase tracking-wider mb-1">
                    <span>Identity Verified</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Create New Password</h2>
                  <p className="text-xs text-[#d1c5b2]">
                    Please enter your new secure password below to complete account recovery.
                  </p>
                </div>

                <form className="space-y-4" onSubmit={handleResetPassword}>
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-white uppercase tracking-wider" htmlFor="newPass">
                        New Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] text-[#f4c86d] hover:underline"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <input
                      id="newPass"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="block w-full px-4 py-3 rounded-xl bg-[#101016] border border-white/10 text-white placeholder:text-[#9a8f7e]/50 text-sm focus:border-[#f4c86d] focus:ring-1 focus:ring-[#f4c86d] outline-none transition-all"
                    />

                    {/* Strength Indicator */}
                    {newPassword && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex gap-1 h-1.5">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <div
                              key={lvl}
                              className={`flex-1 rounded-full transition-all duration-300 ${
                                lvl <= strength
                                  ? strength <= 2
                                    ? "bg-rose-500"
                                    : strength <= 3
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                  : "bg-white/10"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-mono text-[#9a8f7e]">
                          Security Strength:{" "}
                          <strong className="text-white">
                            {strength <= 2 ? "Weak" : strength <= 3 ? "Medium" : "Strong"}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-white uppercase tracking-wider" htmlFor="confirmPass">
                        Confirm New Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-[11px] text-[#f4c86d] hover:underline"
                      >
                        {showConfirmPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <input
                      id="confirmPass"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className="block w-full px-4 py-3 rounded-xl bg-[#101016] border border-white/10 text-white placeholder:text-[#9a8f7e]/50 text-sm focus:border-[#f4c86d] focus:ring-1 focus:ring-[#f4c86d] outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#F0D48B] to-[#D6AD55] text-[#08080D] font-bold text-sm tracking-wide shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-[#08080D] border-t-transparent rounded-full animate-spin" />
                        <span>Updating Password...</span>
                      </span>
                    ) : (
                      <>
                        <span>Update Password</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 4: Success State */}
            {step === "SUCCESS" && (
              <div className="space-y-6 text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-[#101016] border border-emerald-500/40 flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                    <span>Password Successfully Reset</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">You&apos;re All Set!</h2>
                  <p className="text-xs text-[#d1c5b2] leading-relaxed max-w-sm mx-auto">
                    Your password has been securely updated. You can now log into FreelancePay AI with your new credentials.
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <Link
                    href="/login"
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#F0D48B] to-[#D6AD55] text-[#08080D] font-bold text-sm tracking-wide shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Sign In to Your Account</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
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
