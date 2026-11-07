import React from "react";
import { cn } from "@/shared/utils";

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: 1 | 2 | 3;
  glow?: "none" | "auric" | "violet";
  hoverEffect?: boolean;
  children: React.ReactNode;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  elevation = 1,
  glow = "none",
  hoverEffect = false,
  className,
  children,
  ...props
}) => {
  const elevationStyles = {
    1: "glass-panel border-outline-variant/20",
    2: "glass-panel-elevated shadow-lg shadow-black/40",
    3: "bg-surface-container-lowest/95 backdrop-blur-[32px] border border-secondary/30 shadow-2xl",
  };

  const glowStyles = {
    none: "",
    auric: "auric-glow",
    violet: "violet-glow",
  };

  return (
    <div
      className={cn(
        "rounded-xl transition-all duration-150",
        elevationStyles[elevation],
        glowStyles[glow],
        hoverEffect && "hover:border-primary/40 hover:-translate-y-0.5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
