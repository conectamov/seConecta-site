"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export type SelectBoxOption<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
};

type SelectBoxProps<T extends string> = {
  value: T | "";
  options: readonly SelectBoxOption<T>[];
  onValueChange: (value: T) => void;
  ariaLabel: string;
  id?: string;
  placeholder?: string;
  size?: "compact" | "default" | "large";
  tone?: "green" | "amber";
  rounded?: "soft" | "pill";
  appearance?: "default" | "status" | "status-inverse";
  align?: "start" | "end";
  className?: string;
};

const sizeStyles = {
  compact: "min-h-9 px-3 text-[9px]",
  default: "min-h-11 px-3.5 text-[10px]",
  large: "min-h-12 px-4 text-[11px]",
};

const toneStyles = {
  green: {
    trigger: "border-[#cfdbd5] bg-[#f8faf9] text-[#29493c] hover:border-[#a8c9bc] hover:bg-white focus-visible:border-[#079272] focus-visible:ring-[#079272]/12",
    icon: "bg-[#e9f6f0] text-[#078166]",
    selected: "bg-[#e9f7f1] text-[#08745d]",
    check: "bg-[#079272]",
  },
  amber: {
    trigger: "border-[#decf9d] bg-[#fffdf5] text-[#5d4b1d] hover:border-[#c9ae59] hover:bg-white focus-visible:border-[#9a7010] focus-visible:ring-[#d6a91d]/15",
    icon: "bg-[#fff0b9] text-[#80600d]",
    selected: "bg-[#fff3c7] text-[#725307]",
    check: "bg-[#80600d]",
  },
};

export function SelectBox<T extends string>({
  value,
  options,
  onValueChange,
  ariaLabel,
  id,
  placeholder = "Selecione",
  size = "default",
  tone = "green",
  rounded = "soft",
  appearance = "default",
  align = "start",
  className = "",
}: SelectBoxProps<T>) {
  const generatedId = useId();
  const triggerId = id ?? `select-trigger-${generatedId}`;
  const menuId = `select-menu-${generatedId}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const styles = toneStyles[tone];
  const statusAppearance = appearance !== "default";
  const triggerAppearance = appearance === "status"
    ? "min-h-12 rounded-full border-transparent bg-[#eaf8f2] px-5 text-sm text-[#056e57] hover:bg-[#e2f4ec] focus-visible:border-[#079272] focus-visible:ring-[#079272]/12"
    : appearance === "status-inverse"
      ? "min-h-12 rounded-full border-white/10 bg-white/12 px-5 text-sm text-white hover:bg-white/18 focus-visible:border-white/35 focus-visible:ring-white/12"
      : `${rounded === "pill" ? "rounded-full" : "rounded-[14px]"} ${sizeStyles[size]} ${styles.trigger}`;

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", closeOutside);
    return () => window.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  const focusOption = (direction: 1 | -1) => {
    const optionButtons = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>("[data-select-option]") ?? []);
    if (!optionButtons.length) return;
    const focusedIndex = optionButtons.findIndex((option) => option === document.activeElement);
    const selectedIndex = options.findIndex((option) => option.value === value);
    const currentIndex = focusedIndex >= 0 ? focusedIndex : Math.max(0, selectedIndex);
    optionButtons[(currentIndex + direction + optionButtons.length) % optionButtons.length]?.focus();
  };

  const openAndFocus = (direction: 1 | -1) => {
    setOpen(true);
    window.requestAnimationFrame(() => focusOption(direction));
  };

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setOpen(false);
          document.getElementById(triggerId)?.focus();
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          open ? focusOption(1) : openAndFocus(1);
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          open ? focusOption(-1) : openAndFocus(-1);
        }
      }}
    >
      <button
        id={triggerId}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`group flex w-full items-center gap-3 border font-semibold outline-none transition-all focus-visible:ring-4 ${statusAppearance ? "" : "shadow-[0_3px_10px_rgba(28,54,43,.035)]"} ${triggerAppearance}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
      >
        <span className={`grid shrink-0 place-items-center transition-colors ${statusAppearance ? `size-5 bg-transparent ${appearance === "status-inverse" ? "text-white/85" : "text-[#078166]"}` : `size-6 rounded-lg ${styles.icon}`}`}>
          {selected ? <Check size={12} strokeWidth={2.5} /> : <span className="size-1.5 rounded-full bg-current opacity-60" />}
        </span>
        <span className={`min-w-0 flex-1 truncate text-left ${selected ? "" : "font-medium opacity-60"}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={statusAppearance ? 13 : 14} className={`shrink-0 transition-transform duration-200 ${statusAppearance ? "opacity-35" : "opacity-55"} ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          id={menuId}
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute z-[120] mt-2 w-max min-w-full max-w-[min(320px,calc(100vw-32px))] overflow-hidden rounded-[16px] border border-[#d4ded9] bg-white p-1.5 shadow-[0_18px_50px_rgba(20,48,37,.16)] ${align === "end" ? "right-0" : "left-0"}`}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                data-select-option
                onClick={() => {
                  onValueChange(option.value);
                  setOpen(false);
                  window.requestAnimationFrame(() => document.getElementById(triggerId)?.focus());
                }}
                className={`flex min-h-10 w-full items-center gap-3 rounded-[11px] px-3 py-2 text-left text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#079272]/20 ${isSelected ? styles.selected : "text-[#52615a] hover:bg-[#f2f5f3]"}`}
                key={option.value}
              >
                <span className={`grid size-5 shrink-0 place-items-center rounded-full ${isSelected ? `${styles.check} text-white` : "border border-[#d5ddd9] text-transparent"}`}>
                  <Check size={11} />
                </span>
                <span className="min-w-0">
                  <strong className="block truncate font-semibold">{option.label}</strong>
                  {option.description && <small className="mt-0.5 block text-[8px] leading-4 opacity-65">{option.description}</small>}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
