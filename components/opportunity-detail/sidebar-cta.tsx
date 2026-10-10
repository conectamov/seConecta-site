"use client";

import { ArrowRight, Check, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

export type SidebarCTAUserState = "exploring" | "added" | "watchlist";

type SidebarCTAProps = {
  /** Whether this opportunity currently accepts registrations. */
  isOpen: boolean;
  /** The student's relationship with this opportunity. */
  userState: SidebarCTAUserState;
  daysLeft?: number;
  studentCount?: number;
  officialSiteUrl: string;
  /** Lets the page persist the optimistic state in its Journey service. */
  onPrimaryAction?: (nextState: SidebarCTAUserState) => void;
};

type CTAContent = {
  label: string;
  microcopy: string;
  disabled?: boolean;
  nextState: SidebarCTAUserState;
};

function getCTAContent(isOpen: boolean, userState: SidebarCTAUserState, daysLeft?: number, studentCount?: number): CTAContent {
  if (isOpen && userState === "exploring") {
    return {
      label: "Participar",
      microcopy: daysLeft !== undefined
        ? `Faltam ${daysLeft} dias`
        : studentCount !== undefined
          ? `${studentCount} alunos já estão se preparando`
          : "Veja o que você precisa preparar.",
      nextState: "added",
    };
  }

  if (isOpen && userState === "added") {
    return { label: "Continuar preparação", microcopy: "Você já iniciou esta jornada.", nextState: "added" };
  }

  if (!isOpen && userState === "exploring") {
    return { label: "Avisar próxima edição", microcopy: "Te avisaremos 1 mês antes de abrir.", nextState: "watchlist" };
  }

  if (!isOpen && userState === "watchlist") {
    return { label: "Notificação ativada", microcopy: "Salvo para o próximo ano.", disabled: true, nextState: "watchlist" };
  }

  // Safe fallback for states that may be introduced by the Journey in the future.
  return { label: "Continuar preparação", microcopy: "Você já iniciou esta jornada.", nextState: "added" };
}

/**
 * Persistent, state-aware CTA for the opportunity sidebar.
 * It updates immediately for responsiveness, while `onPrimaryAction` lets the
 * host synchronize the change with the Journey domain.
 */
export function SidebarCTA({ isOpen, userState, daysLeft, studentCount, officialSiteUrl, onPrimaryAction }: SidebarCTAProps) {
  const [optimisticState, setOptimisticState] = useState<SidebarCTAUserState>(userState);

  useEffect(() => setOptimisticState(userState), [userState]);

  const content = getCTAContent(isOpen, optimisticState, daysLeft, studentCount);

  const handlePrimaryAction = () => {
    if (content.disabled) return;
    if (onPrimaryAction) onPrimaryAction(content.nextState);
    else setOptimisticState(content.nextState);
  };

  return <div className="flex w-full flex-col gap-3">
    <div>
      <button
        type="button"
        disabled={content.disabled}
        onClick={handlePrimaryAction}
        className={content.disabled
          ? "flex h-12 w-full items-center justify-center gap-2 rounded-[15px] border border-[#cfeade] bg-[#eaf8f2] px-4 text-sm font-semibold text-[#478474]"
          : "group flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[15px] bg-[#079272] px-3 text-[11px] font-semibold shadow-[0_10px_22px_rgba(7,146,114,.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#056e57] hover:shadow-[0_14px_28px_rgba(7,146,114,.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#079272]/35"}
        style={content.disabled ? undefined : { color: "white" }}
      >
        {content.disabled && <Check size={16} strokeWidth={2.5} />}
        {content.label}
        {!content.disabled && <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />}
      </button>
      <p className="mt-2 text-center text-[11px] leading-4 text-[#7a8580]">{content.microcopy}</p>
    </div>

    <a
      href={officialSiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-11 w-full items-center justify-center gap-2 rounded-[15px] border border-[#dfe5e1] bg-white/75 px-4 text-sm font-semibold text-[#355247] no-underline transition-all duration-200 hover:border-[#079272]/30 hover:bg-[#f4faf7] hover:text-[#056e57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#079272]/35"
    >
      Site oficial <ExternalLink size={15} />
    </a>
  </div>;
}
