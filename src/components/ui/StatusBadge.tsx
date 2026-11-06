import React from "react";
import { cn } from "@/lib/utils";

export type StatusVariant =
  | "settled"
  | "paid"
  | "viewed"
  | "invoiced"
  | "pending"
  | "authorized"
  | "captured"
  | "escrow"
  | "overdue"
  | "alert"
  | "ai"
  | "neutral";

export interface StatusBadgeProps {
  variant?: StatusVariant;
  pulse?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant = "neutral",
  pulse = false,
  className,
  children,
}) => {
  const variantStyles: Record<StatusVariant, { badge: string; dot?: string }> = {
    settled: {
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-400",
    },
    paid: {
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-400",
    },
    viewed: {
      badge: "bg-secondary-container/20 text-secondary border-secondary/30",
      dot: "bg-secondary",
    },
    invoiced: {
      badge: "bg-primary/10 text-primary border-primary/20",
      dot: "bg-primary",
    },
    pending: {
      badge: "bg-amber-400/10 text-amber-400 border-amber-400/20",
      dot: "bg-amber-400",
    },
    authorized: {
      badge: "bg-primary/10 text-primary border-primary/20",
      dot: "bg-primary",
    },
    captured: {
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-400",
    },
    escrow: {
      badge: "bg-amber-400/10 text-amber-400 border-amber-400/20",
      dot: "bg-amber-400",
    },
    overdue: {
      badge: "bg-error/10 text-error border-error/20",
      dot: "bg-error",
    },
    alert: {
      badge: "bg-error-container/40 text-error border-error/30",
      dot: "bg-error",
    },
    ai: {
      badge: "bg-secondary-container/30 text-secondary border-secondary/40",
      dot: "bg-secondary",
    },
    neutral: {
      badge: "bg-surface-container text-on-surface-variant border-outline-variant/30",
      dot: "bg-outline",
    },
  };

  const current = variantStyles[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full",
        "text-[11px] font-medium border font-mono tracking-tight",
        current.badge,
        className
      )}
    >
      {current.dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            current.dot,
            pulse && "animate-pulse"
          )}
        />
      )}
      <span>{children}</span>
    </span>
  );
};
