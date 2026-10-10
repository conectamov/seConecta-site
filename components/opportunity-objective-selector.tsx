"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Eye, GraduationCap, Rocket, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { OpportunityObjective } from "@/types/opportunity-journey";

const objectives: { value: OpportunityObjective; label: string; description: string; icon: typeof Eye }[] = [
  { value: "following", label: "Só acompanhando", description: "Quero apenas receber atualizações.", icon: Eye },
  { value: "applying", label: "Quero me candidatar", description: "Estou preparando uma candidatura.", icon: Rocket },
  { value: "participating", label: "Participando", description: "Já fui aceito e estou participando desta oportunidade.", icon: GraduationCap },
];

type OpportunityObjectiveSelectorProps = {
  value: OpportunityObjective;
  onChange: (objective: OpportunityObjective) => void;
  onRemove: () => void;
  inverse?: boolean;
  className?: string;
  align?: "start" | "end";
};

type MenuPosition = {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
};

export function OpportunityObjectiveSelector({ value, onChange, onRemove, inverse = false, className = "", align = "start" }: OpportunityObjectiveSelectorProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = objectives.find((objective) => objective.value === value) ?? objectives[1];

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const trigger = rootRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const viewportPadding = 16;
      const width = Math.min(340, window.innerWidth - viewportPadding * 2);
      const preferredLeft = align === "end" ? rect.right - width : rect.left;
      const left = Math.min(Math.max(viewportPadding, preferredLeft), window.innerWidth - width - viewportPadding);
      const availableBelow = window.innerHeight - rect.bottom - viewportPadding;
      const opensAbove = availableBelow < 300 && rect.top > availableBelow;
      setMenuPosition(opensAbove
        ? { left, width, bottom: window.innerHeight - rect.top + 8, maxHeight: Math.max(180, rect.top - viewportPadding - 8) }
        : { left, width, top: rect.bottom + 8, maxHeight: Math.max(180, availableBelow - 8) });
    };
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    updatePosition();
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [align, open]);

  const SelectedIcon = selected.icon;

  const menu = <AnimatePresence>{open && menuPosition && <motion.div
      ref={menuRef}
      role="menu"
      className="fixed z-[3000] overflow-y-auto rounded-[20px] border border-[#d8e1dc] bg-white p-2 shadow-[0_22px_60px_rgba(18,45,34,.22)]"
      style={menuPosition}
      initial={{ opacity: 0, y: -5, scale: .98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: .98 }}
      transition={{ duration: .14 }}
    >
      <span className="block px-3 pb-2 pt-1 text-[8px] font-bold uppercase tracking-[.13em] text-[#84908a]">Meu objetivo</span>
      {objectives.map((objective) => {
        const Icon = objective.icon;
        const active = objective.value === value;
        return <button
          type="button"
          role="menuitemradio"
          aria-checked={active}
          onClick={() => { onChange(objective.value); setOpen(false); }}
          className={`flex min-h-[62px] w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition ${active ? "bg-[#eaf7f1]" : "hover:bg-[#f4f7f5]"}`}
          key={objective.value}
        >
          <span className={`grid size-9 shrink-0 place-items-center rounded-[12px] ${active ? "bg-white text-[#079272]" : "bg-[#f0f4f2] text-[#69766f]"}`}><Icon size={15} /></span>
          <span className="min-w-0 flex-1"><strong className="block text-[10px] text-[#29493c]">{objective.label}</strong><small className="mt-1 block text-[8px] leading-4 text-[#7c8882]">{objective.description}</small></span>
          {active && <Check size={14} className="shrink-0 text-[#079272]" />}
        </button>;
      })}
      <div className="mx-2 my-2 h-px bg-[#e5eae7]" />
      <button
        type="button"
        role="menuitem"
        onClick={() => { setOpen(false); onRemove(); }}
        className="flex min-h-11 w-full items-center gap-3 rounded-[14px] px-3 text-left text-[10px] font-semibold text-[#ae503c] transition hover:bg-[#fff1ed]"
      >
        <span className="grid size-8 place-items-center rounded-[11px] bg-[#fff0eb]"><Trash2 size={14} /></span>
        Remover da minha jornada
      </button>
    </motion.div>}</AnimatePresence>;

  return <>
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={inverse
          ? "inline-flex min-h-13 w-full items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-5 text-left text-sm font-semibold text-white transition hover:bg-white/15"
          : "inline-flex min-h-12 w-full items-center gap-2.5 rounded-full border border-[#cfe0d8] bg-[#edf7f2] px-4 text-left text-[11px] font-semibold text-[#08745d] transition hover:border-[#abd0c1] hover:bg-[#e7f4ee]"}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <SelectedIcon size={15} />
        <span className="min-w-0 flex-1 truncate">{selected.label}</span>
        <ChevronDown size={14} className={`shrink-0 opacity-65 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
    </div>
    {typeof document !== "undefined" ? createPortal(menu, document.body) : null}
  </>;
}
