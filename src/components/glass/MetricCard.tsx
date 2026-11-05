import React from "react";
import { GlassPanel } from "./GlassPanel";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  label: string;
  value: string;
  icon: string;
  iconColor?: string;
  trend?: string;
  trendLabel?: string;
  trendPositive?: boolean;
  valueColor?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  iconColor = "text-primary",
  trend,
  trendLabel,
  trendPositive,
  valueColor = "text-on-surface",
  className,
}) => {
  return (
    <GlassPanel elevation={1} hoverEffect className={cn("p-5 flex flex-col justify-between", className)}>
      <div className="flex items-center justify-between text-on-surface-variant mb-2">
        <span className="font-label-md text-label-md text-on-surface-variant font-medium">
          {label}
        </span>
        <span
          className={cn("material-symbols-outlined text-xl", iconColor)}
          data-icon={icon}
        >
          {icon}
        </span>
      </div>

      <div className={cn("font-numeric-metric text-numeric-metric font-semibold tracking-tight", valueColor)}>
        {value}
      </div>

      {(trend || trendLabel) && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          {trend && (
            <span
              className={cn(
                "font-medium flex items-center",
                trendPositive === true && "text-emerald-400",
                trendPositive === false && "text-error",
                trendPositive === undefined && "text-on-surface-variant"
              )}
            >
              {trend}
            </span>
          )}
          {trendLabel && (
            <span className="text-on-surface-variant opacity-75">
              {trendLabel}
            </span>
          )}
        </div>
      )}
    </GlassPanel>
  );
};
