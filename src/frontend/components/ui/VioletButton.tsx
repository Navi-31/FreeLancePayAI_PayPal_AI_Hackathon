import React from "react";
import { cn } from "@/shared/utils";

export interface VioletButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string;
  size?: "sm" | "md" | "lg";
  sparkle?: boolean;
  children: React.ReactNode;
}

export const VioletButton: React.FC<VioletButtonProps> = ({
  icon,
  size = "md",
  sparkle = false,
  className,
  children,
  ...props
}) => {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-xs font-semibold gap-2",
    lg: "px-5 py-2.5 text-sm font-semibold gap-2.5",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg",
        "bg-gradient-to-r from-secondary-container to-surface-container-high",
        "border border-secondary/40 text-secondary hover:text-white",
        "violet-glow transition-all duration-150 active:scale-[0.98]",
        "disabled:opacity-50 disabled:pointer-events-none",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {sparkle && (
        <span className="w-2 h-2 rounded-full bg-secondary animate-ping mr-0.5" />
      )}
      {icon && (
        <span
          className="material-symbols-outlined text-base leading-none text-secondary"
          data-icon={icon}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      )}
      <span>{children}</span>
    </button>
  );
};
