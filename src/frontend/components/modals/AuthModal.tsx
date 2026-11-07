"use client";

import React, { useState } from "react";
import { useAuth } from "@/frontend/features/auth/AuthContext";
import { GlassPanel } from "@/frontend/components/glass/GlassPanel";
import { AuricButton } from "@/frontend/components/ui/AuricButton";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await register(name, email, password, businessName);
        if (res.success) {
          setSuccessMsg("Account provisioned and authenticated.");
          setTimeout(() => {
            onClose();
          }, 1000);
        } else {
          setError(res.error || "Registration failed");
        }
      } else {
        const res = await login(email, password);
        if (res.success) {
          setSuccessMsg("Signed in successfully.");
          setTimeout(() => {
            onClose();
          }, 1000);
        } else {
          setError(res.error || "Authentication failed");
        }
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md relative">
        <GlassPanel elevation={2} className="p-6 md:p-8 rounded-2xl border border-primary/30 shadow-2xl relative overflow-hidden">
          {/* Subtle gold glow behind panel */}
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-on-surface-variant hover:text-white hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>

          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-xs">shield_person</span>
              <span>Enterprise Guardrail Auth</span>
            </div>
            <h2 className="text-xl font-bold text-on-surface">
              {isRegister ? "Create FreelancePay Account" : "Access Treasury Portal"}
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              {isRegister
                ? "Join institutional autonomous fiscal operations."
                : "Sign in with authenticated credentials to access server persistence."}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-error-container/20 border border-error/40 text-error text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-primary/20 border border-primary/40 text-primary text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">verified</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            )}

            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">
                  Business Entity / Studio Name (Optional)
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Design Studio LLC"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-3 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <AuricButton
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">lock_open</span>
                  <span>{isRegister ? "Create Production Account" : "Sign In to Workspace"}</span>
                </>
              )}
            </AuricButton>
          </form>

          {/* Switch Tab */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-primary hover:underline"
            >
              {isRegister
                ? "Already have an account? Sign In"
                : "Need a new production account? Register here"}
            </button>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};
