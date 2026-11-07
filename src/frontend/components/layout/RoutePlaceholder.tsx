import React from "react";
import Link from "next/link";
import { GlassPanel } from "@/frontend/components/glass/GlassPanel";
import { AuricButton } from "@/frontend/components/ui/AuricButton";
import { StatusBadge } from "@/frontend/components/ui/StatusBadge";

export interface RoutePlaceholderProps {
  title: string;
  pillar: string;
  screenId?: string;
  description?: string;
}

export const RoutePlaceholder: React.FC<RoutePlaceholderProps> = ({
  title,
  pillar,
  screenId,
  description = "This autonomous module is staged in the master inventory and scheduled for full component integration in the next phase.",
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      {/* Header Banner */}
      <GlassPanel elevation={2} className="p-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <StatusBadge variant="ai" pulse>
              {pillar}
            </StatusBadge>
            {screenId && (
              <span className="text-[10px] font-mono text-outline px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant/30">
                STITCH ID: {screenId.slice(0, 12)}...
              </span>
            )}
          </div>

          <h2 className="font-headline-md text-xl lg:text-2xl text-on-surface font-semibold mb-2">
            {title}
          </h2>

          <p className="font-body-md text-sm text-on-surface-variant max-w-xl leading-relaxed mb-6">
            {description}
          </p>

          <div className="flex items-center gap-3">
            <Link href="/">
              <AuricButton size="sm" icon="dashboard">
                Return to Command Center
              </AuricButton>
            </Link>
            <Link
              href="/ai/copilot"
              className="px-3.5 py-1.5 rounded-lg bg-surface-container-high border border-secondary/30 text-secondary hover:text-white text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span>Ask AI Copilot</span>
            </Link>
          </div>
        </div>

        {/* Ambient atmospheric radial gradient */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-gradient-to-br from-primary/10 via-secondary/15 to-transparent blur-3xl pointer-events-none" />
      </GlassPanel>

      {/* Telemetry Status Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassPanel elevation={1} className="p-4">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-outline block mb-1">
            Design Status
          </span>
          <span className="text-sm font-semibold text-emerald-400">
            Validated in stitch-export
          </span>
        </GlassPanel>

        <GlassPanel elevation={1} className="p-4">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-outline block mb-1">
            Component Architecture
          </span>
          <span className="text-sm font-semibold text-primary">
            Layout Shell Attached
          </span>
        </GlassPanel>

        <GlassPanel elevation={1} className="p-4">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-outline block mb-1">
            Active Data Rails
          </span>
          <span className="text-sm font-semibold text-secondary">
            Ready for API Hydration
          </span>
        </GlassPanel>
      </div>
    </div>
  );
};
