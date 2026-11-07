"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

    setVisible(true);
    setProgress(15);

    // Incrementally step forward to simulate network progress
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 60) return prev + 15;
        if (prev < 85) return prev + 5;
        return prev;
      });
    }, 180);

    // Failsafe: never leave the progress indicator stuck
    safetyTimeoutRef.current = setTimeout(() => {
      completeProgress();
    }, 7000);
  };

  const completeProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

    setProgress(100);
    setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 280);
  };

  // Route changed: complete navigation progress
  useEffect(() => {
    completeProgress();
  }, [pathname, searchParams]);

  // Global listener for internal links and programmatic navigation
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      const targetAttr = target.getAttribute("target");

      // Only track relative internal links, excluding anchors or external targets
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("//") &&
        targetAttr !== "_blank" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        const currentUrl = window.location.pathname + window.location.search;
        if (href !== currentUrl && !href.startsWith("#")) {
          startProgress();
        }
      }
    };

    const handleCustomNavStart = () => startProgress();
    const handleCustomNavEnd = () => completeProgress();

    document.addEventListener("click", handleLinkClick, { capture: true });
    window.addEventListener("app-nav-start", handleCustomNavStart);
    window.addEventListener("app-nav-end", handleCustomNavEnd);

    return () => {
      document.removeEventListener("click", handleLinkClick, { capture: true });
      window.removeEventListener("app-nav-start", handleCustomNavStart);
      window.removeEventListener("app-nav-end", handleCustomNavEnd);
      if (timerRef.current) clearInterval(timerRef.current);
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px] pointer-events-none bg-transparent overflow-hidden"
    >
      <div
        className="h-full bg-gradient-to-r from-[#9665FF] via-[#F0D48B] to-[#9665FF] transition-all duration-200 ease-out shadow-[0_0_12px_rgba(240,212,139,0.8),0_0_6px_rgba(150,101,255,0.6)]"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}
