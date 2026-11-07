import React from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { GlassPanel } from "@/frontend/components/glass/GlassPanel";

export default function Loading() {
  return (
    <AppLayout
      pageTitle="Autonomous Workspace"
      pageSubtitle="Synchronizing real-time telemetry..."
      userBadge="PRO VIP"
    >
      <div className="space-y-6" role="status" aria-live="polite">
        <span className="sr-only">Loading financial workspace data...</span>

        {/* 1. Header Banner Skeleton */}
        <GlassPanel elevation={2} className="p-6 relative overflow-hidden">
          <div className="animate-pulse space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-36 rounded-full bg-secondary/20" />
              <div className="h-5 w-44 rounded-full bg-primary/20" />
            </div>
            <div className="h-7 w-72 rounded-lg bg-white/10" />
            <div className="h-4 w-96 max-w-full rounded bg-white/5" />
          </div>
        </GlassPanel>

        {/* 2. KPI Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <GlassPanel key={i} elevation={1} className="p-5">
              <div className="animate-pulse space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 rounded bg-white/10" />
                  <div className="h-7 w-7 rounded-lg bg-white/5" />
                </div>
                <div className="h-8 w-32 rounded bg-white/15" />
                <div className="h-3 w-40 rounded bg-white/5" />
              </div>
            </GlassPanel>
          ))}
        </div>

        {/* 3. Main Chart & Panel Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassPanel elevation={1} className="lg:col-span-2 p-6 h-72">
            <div className="animate-pulse flex flex-col justify-between h-full">
              <div className="space-y-2">
                <div className="h-4 w-48 rounded bg-white/15" />
                <div className="h-3 w-64 rounded bg-white/5" />
              </div>
              <div className="h-36 w-full rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              </div>
              <div className="h-3 w-full rounded bg-white/5" />
            </div>
          </GlassPanel>

          <GlassPanel elevation={1} className="p-6 h-72">
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-36 rounded bg-white/15" />
              <div className="space-y-3 pt-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="p-3 rounded-lg bg-white/[0.03] border border-white/5 space-y-1.5">
                    <div className="h-3 w-28 rounded bg-white/10" />
                    <div className="h-2.5 w-40 rounded bg-white/5" />
                  </div>
                ))}
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </AppLayout>
  );
}
