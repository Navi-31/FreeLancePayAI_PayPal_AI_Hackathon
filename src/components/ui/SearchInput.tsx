"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search invoices, clients, or telemetry...",
  className,
  onKeyDown,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Global ⌘K / Ctrl+K listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className={cn("relative w-full max-w-xs", className)}>
      <span
        className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none select-none"
        data-icon="search"
      >
        search
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={cn(
          "w-full bg-surface-container-lowest/80 border border-outline-variant/40 rounded-lg",
          "pl-9 pr-10 py-1.5 text-xs text-on-surface placeholder:text-outline",
          "focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20",
          "transition-all duration-150"
        )}
      />
      <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-mono bg-surface-container-high text-on-surface-variant rounded border border-outline-variant/30 select-none pointer-events-none">
        ⌘K
      </kbd>
    </div>
  );
};
