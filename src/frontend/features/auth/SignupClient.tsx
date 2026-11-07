"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function SignupClient() {
  const router = useRouter();

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [callingCode, setCallingCode] = useState("+1");
  const [mobileNumber, setMobileNumber] = useState("");
  const [country, setCountry] = useState("United States");
  const [currency, setCurrency] = useState("USD");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password Strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    if (!termsAccepted) {
      setError("Please accept the terms of service and security policy.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          mobile: mobileNumber.trim(),
          callingCode,
          country,
          currency,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      // Success: redirect to OTP verification screen
      router.push(
        `/verify-email?email=${encodeURIComponent(data.email || email.trim().toLowerCase())}&purpose=SIGNUP_VERIFICATION`
      );
    } catch {
      setError("Network error contacting registration service.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#08080D] text-[#e4e1ea] min-h-screen selection:bg-[#d6ad55] selection:text-[#0e0e14] overflow-x-hidden font-sans">
      <div className="fixed top-[-20%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-[#7040DB]/10 blur-[130px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-15%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-[#D6AD55]/08 blur-[150px] pointer-events-none -z-10" />

      <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-[1440px] grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* LEFT COLUMN: Features & Proof */}
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

              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-[#1b1b21] border border-[#4e4637]/30">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-[#f4c86d]/10 text-[#f4c86d] flex items-center justify-center text-sm font-bold">
                      1
                    </span>
                    <h4 className="text-base font-bold text-white">Full Autonomous Telemetry</h4>
                  </div>
                  <p className="text-xs text-[#d1c5b2] leading-relaxed">
                    Predictive cash-flow modeling, tax shielding simulations, and automated invoice milestone tracking.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#1b1b21] border border-[#4e4637]/30">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-[#561cc1]/20 text-[#d0bcff] flex items-center justify-center text-sm font-bold">
                      2
                    </span>
                    <h4 className="text-base font-bold text-white">Direct PayPal Sandbox Rails</h4>
                  </div>
                  <p className="text-xs text-[#d1c5b2] leading-relaxed">
                    Live OAuth authentication, instant order authorizations, idempotent webhooks, and verified captures.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#1b1b21] border border-[#4e4637]/30">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-[#10b981]/15 text-[#10b981] flex items-center justify-center text-sm font-bold">
                      3
                    </span>
                    <h4 className="text-base font-bold text-white">Multi-Currency Global Vaults</h4>
                  </div>
                  <p className="text-xs text-[#d1c5b2] leading-relaxed">
                    Auto-split taxes in real-time, routing safe reserves to isolated vaults with zero balance surprises.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-6 border-t border-[#4e4637]/30 flex items-center justify-between text-xs text-[#9a8f7e]">
              <div>
                <span className="text-white font-bold">$48.2M+ Invoiced</span>
                <p className="text-[10px]">Under autonomous management</p>
              </div>
              <span className="font-mono text-[#f4c86d] border border-[#f4c86d]/30 px-2 py-1 rounded bg-[#f4c86d]/10">
                SOC2 Type II Ready
              </span>
            </div>
          </section>

          {/* RIGHT COLUMN: Registration Form */}
          <section className="lg:col-span-7 flex flex-col justify-center">
            <div className="rounded-2xl bg-[#1E1D29]/90 border border-white/10 p-6 sm:p-8 xl:p-10 backdrop-blur-2xl shadow-2xl relative">
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#F0D48B]/40 to-transparent" />

              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#f4c86d]/10 border border-[#f4c86d]/30 text-[#f4c86d] mb-3">
                  <span className="text-[11px] font-semibold tracking-wide uppercase font-mono">
                    Instant Operator Enrollment
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Create Your Account
                </h2>
                <p className="text-sm text-[#d1c5b2] mt-1">
                  Start managing your freelance finances with autonomous precision.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
                  <svg className="w-5 h-5 shrink-0 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Full Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5" htmlFor="fullName">
                      Full Name <span className="text-[#f4c86d]">*</span>
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-2.5 bg-[#101016] border border-white/10 rounded-lg text-white placeholder:text-[#9a8f7e]/50 focus:outline-none focus:border-[#f4c86d] focus:ring-1 focus:ring-[#f4c86d] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5" htmlFor="email">
                      Email Address <span className="text-[#f4c86d]">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full px-4 py-2.5 bg-[#101016] border border-white/10 rounded-lg text-white placeholder:text-[#9a8f7e]/50 focus:outline-none focus:border-[#f4c86d] focus:ring-1 focus:ring-[#f4c86d] text-sm"
                    />
                  </div>
                </div>

                {/* Mobile Number with Country Dial Code */}
                <div>
                  <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5" htmlFor="mobile">
                    Mobile Number <span className="text-[#f4c86d]">*</span>
                  </label>
                  <div className="flex rounded-lg border border-white/10 bg-[#101016] overflow-hidden focus-within:border-[#f4c86d] focus-within:ring-1 focus-within:ring-[#f4c86d]">
                    <select
                      value={callingCode}
                      onChange={(e) => setCallingCode(e.target.value)}
                      className="bg-[#1b1b21] border-r border-white/10 py-2.5 px-3 text-white text-sm outline-none cursor-pointer"
                    >
                      <option value="+1">USA (+1)</option>
                      <option value="+91">India (+91)</option>
                      <option value="+44">UK (+44)</option>
                      <option value="+65">Singapore (+65)</option>
                      <option value="+971">UAE (+971)</option>
                    </select>
                    <input
                      id="mobile"
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="Enter your mobile number"
                      className="flex-1 px-4 py-2.5 bg-transparent border-0 text-white placeholder:text-[#9a8f7e]/50 focus:ring-0 text-sm outline-none"
                    />
                  </div>
                </div>

                {/* Country & Currency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5" htmlFor="country">
                      Country <span className="text-[#f4c86d]">*</span>
                    </label>
                    <select
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#101016] border border-white/10 rounded-lg text-white text-sm outline-none focus:border-[#f4c86d] focus:ring-1 focus:ring-[#f4c86d]"
                    >
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Germany">Germany</option>
                      <option value="Singapore">Singapore</option>
                      <option value="UAE">United Arab Emirates</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5" htmlFor="currency">
                      Default Currency <span className="text-[#f4c86d]">*</span>
                    </label>
                    <select
                      id="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#101016] border border-white/10 rounded-lg text-white text-sm outline-none focus:border-[#f4c86d] focus:ring-1 focus:ring-[#f4c86d]"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="SGD">SGD (S$)</option>
                    </select>
                  </div>
                </div>

                {/* Password & Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-white uppercase tracking-wider" htmlFor="password">
                        Password <span className="text-[#f4c86d]">*</span>
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
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-2.5 bg-[#101016] border border-white/10 rounded-lg text-white placeholder:text-[#9a8f7e]/50 focus:outline-none focus:border-[#f4c86d] focus:ring-1 focus:ring-[#f4c86d] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5" htmlFor="confirm">
                      Confirm Password <span className="text-[#f4c86d]">*</span>
                    </label>
                    <input
                      id="confirm"
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full px-4 py-2.5 bg-[#101016] border border-white/10 rounded-lg text-white placeholder:text-[#9a8f7e]/50 focus:outline-none focus:border-[#f4c86d] focus:ring-1 focus:ring-[#f4c86d] text-sm"
                    />
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#9a8f7e]">Password Complexity</span>
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

                {/* Terms and Privacy */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded bg-[#101016] border-white/20 text-[#f4c86d] focus:ring-[#f4c86d]"
                    />
                    <span className="text-xs text-[#d1c5b2] leading-relaxed">
                      I agree to the{" "}
                      <span className="text-[#f4c86d] underline underline-offset-2">Terms of Service</span>{" "}
                      and acknowledge the PayPal AI Hackathon privacy safeguards.
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-lg bg-gradient-to-r from-[#F0D48B] to-[#D6AD55] text-[#08080D] font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:opacity-95 hover:shadow-[0_0_25px_rgba(240,212,139,0.35)] transition-all active:scale-[0.98] disabled:opacity-50 mt-4 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-[#08080D] border-t-transparent rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </span>
                  ) : (
                    <>
                      <span>Create Account & Send Code</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center pt-5 border-t border-[#4e4637]/30">
                <p className="text-sm text-[#d1c5b2]">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-[#f4c86d] hover:text-[#ffdea0] font-semibold transition-colors inline-flex items-center gap-1"
                  >
                    <span>Sign In</span>
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
