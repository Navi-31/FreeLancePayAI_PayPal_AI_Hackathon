"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token || !email) {
      setError("Invalid or expired password reset link. Please request a new one.");
      return;
    }

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
          token,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Password reset failed. The link may have expired.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch {
      setError("Network error communicating with authentication service.");
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
          <span>Return to Login</span>
        </Link>
      </header>

      {/* Main Canvas */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl bg-[#171720]/90 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#f4c86d]/40 to-transparent" />

            {!success ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f4c86d]/10 border border-[#f4c86d]/25 text-[#f4c86d] text-xs font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f4c86d]" />
                    <span>Single-Use Session</span>
                  </div>
                  <span className="text-xs text-[#9a8f7e] font-mono">15m Window</span>
                </div>

                <div className="text-left">
                  <h1 className="text-2xl font-bold text-white tracking-tight">Create a New Password</h1>
                  <p className="text-xs text-[#d1c5b2] mt-1.5">
                    Choose a strong password to secure your freelance financial command center.
                  </p>
                </div>

                {(!token || !email) && (
                  <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs">
                    This password reset link is invalid or incomplete. Please request a new link from the forgot password page.
                  </div>
                )}

                {error && (
                  <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
                    <svg className="w-4 h-4 shrink-0 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-white uppercase tracking-wider" htmlFor="newPass">
                        New Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] text-[#d0bcff] hover:text-[#f4c86d]"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <input
                      id="newPass"
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-4 py-2.5 bg-[#101016] border border-white/10 rounded-lg text-white placeholder:text-[#9a8f7e]/50 focus:outline-none focus:border-[#f4c86d] focus:ring-1 focus:ring-[#f4c86d] text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-white uppercase tracking-wider" htmlFor="confirmPass">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPass"
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-4 py-2.5 bg-[#101016] border border-white/10 rounded-lg text-white placeholder:text-[#9a8f7e]/50 focus:outline-none focus:border-[#f4c86d] focus:ring-1 focus:ring-[#f4c86d] text-sm"
                    />
                  </div>

                  {newPassword.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#9a8f7e]">Password Strength</span>
                        <span className={strength >= 4 ? "text-emerald-400 font-semibold" : "text-[#f4c86d]"}>
                          {strength >= 4 ? "Strong" : strength >= 3 ? "Good" : "Weak"}
                        </span>
                      </div>
                      <div className="w-full bg-[#101016] rounded-full h-1.5 overflow-hidden flex gap-1">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <div
                            key={lvl}
                            className={`h-full flex-1 transition-all rounded-full ${
                              lvl <= strength
                                ? strength >= 4
                                  ? "bg-emerald-400"
                                  : "bg-[#f4c86d]"
                                : "bg-white/10"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !token || !email}
                    className="w-full py-3.5 px-6 rounded-lg bg-gradient-to-r from-[#F0D48B] to-[#D6AD55] text-[#08080D] font-bold text-sm tracking-wide shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-[#08080D] border-t-transparent rounded-full animate-spin" />
                        <span>Resetting Password...</span>
                      </span>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6 text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-[#101016] border border-emerald-500/40 flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Password Reset Complete</h2>
                  <p className="text-xs text-[#d1c5b2] leading-relaxed max-w-sm mx-auto">
                    Your password has been updated. A security notification has been sent to your email.
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <Link
                    href="/login"
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#F0D48B] to-[#D6AD55] text-[#08080D] font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span>Proceed to Sign In</span>
                    <span>&rarr;</span>
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
