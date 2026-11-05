import React from "react";
import { cn } from "@/lib/utils";

export interface AuricButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const AuricButton: React.FC<AuricButtonProps> = ({
  icon,
  size = "md",
  className,
  children,
  ...props
}) => {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-3.5 py-1.5 text-xs font-medium gap-1.5",
    lg: "px-5 py-2.5 text-sm font-semibold gap-2",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg",
        "bg-gradient-to-r from-primary to-primary-container",
        "text-on-primary font-medium tracking-tight",
        "auric-glow hover:brightness-105 active:scale-[0.98] transition-all duration-150",
        "disabled:opacity-50 disabled:pointer-events-none",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {icon && (
        <span
          className="material-symbols-outlined text-base leading-none"
          data-icon={icon}
        >
          {icon}
        </span>
      )}
      <span>{children}</span>
    </button>
  );
};
