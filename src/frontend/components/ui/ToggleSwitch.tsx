"use client";

import React from "react";
import { cn } from "@/shared/utils";

export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  "aria-label"?: string;
  label?: string;
  description?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  id,
  name,
  size = "md",
  className,
  "aria-label": ariaLabel,
  label,
  description,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      onChange(!checked);
    }
  };

  // Dimensions for track and thumb
  const trackClasses = {
    sm: "w-9 h-5 p-0.5",
    md: "w-11 h-6 p-0.5",
    lg: "w-14 h-7.5 p-1",
  }[size];

  const thumbSize = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-5.5 h-5.5",
  }[size];

  // Thumb translation distances
  const thumbTranslate = {
    sm: checked ? "translate-x-4" : "translate-x-0",
    md: checked ? "translate-x-5" : "translate-x-0",
    lg: checked ? "translate-x-6.5" : "translate-x-0",
  }[size];

  const switchButton = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || label || "Toggle switch"}
      disabled={disabled}
      id={id}
      name={name}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative inline-flex items-center rounded-full shrink-0 transition-all duration-200 ease-in-out cursor-pointer select-none",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest",
        disabled && "opacity-50 cursor-not-allowed",
        // Strict distinct ON and OFF states:
        // ON: Rich gold accent with subtle auric glow
        // OFF: Neutral dark slate/grey (NEVER gold) with clear neutral border
        checked
          ? "bg-primary border border-primary shadow-[0_0_12px_rgba(244,200,109,0.35)]"
          : "bg-surface-container-highest/90 border border-outline-variant/50 hover:border-outline-variant/80 hover:bg-surface-container-highest",
        trackClasses,
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block rounded-full shadow-md transform transition-transform duration-200 ease-in-out",
          thumbSize,
          thumbTranslate,
          // ON thumb: Dark obsidian for strong contrast against the radiant gold track
          // OFF thumb: Neutral light silver-grey for clear visibility on the dark track
          checked
            ? "bg-surface-container-lowest ring-1 ring-black/10"
            : "bg-zinc-300 ring-1 ring-black/20"
        )}
      />
    </button>
  );

  if (label || description) {
    return (
      <div
        className="flex items-center justify-between gap-4 cursor-pointer"
        onClick={handleClick as unknown as React.MouseEventHandler<HTMLDivElement>}
      >
        <div className="space-y-0.5 select-none">
          {label && <div className="font-semibold text-white text-xs lg:text-sm">{label}</div>}
          {description && <p className="text-outline text-[11px] leading-relaxed">{description}</p>}
        </div>
        {switchButton}
      </div>
    );
  }

  return switchButton;
};
