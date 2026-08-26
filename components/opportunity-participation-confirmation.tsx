"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Eye, GraduationCap, Rocket, X } from "lucide-react";
import type { OpportunityObjective } from "@/types/opportunity-journey";
import "./opportunity-journey-flow.css";

const objectiveOptions: { value: OpportunityObjective; title: string; description: string; icon: typeof Rocket; tone: string }[] = [
  { value: "following", title: "Só acompanhando", description: "Quero apenas receber atualizações.", icon: Eye, tone: "bg-[#eef3fb] text-[#4e78aa]" },
  { value: "applying", title: "Quero me candidatar", description: "Quero um checklist para preparar minha candidatura.", icon: Rocket, tone: "bg-[#edf7f2] text-[#078166]" },
  { value: "participating", title: "Participando", description: "Já fui aceito e estou participando desta oportunidade.", icon: GraduationCap, tone: "bg-[#eaf7f1] text-[#078166]" },
];

type ParticipationOnboardingProps = {
  opportunity: { title: string } | null;
  onSelect: (objective: OpportunityObjective) => void;
  onClose: () => void;
};

export function OpportunityParticipationConfirmation({ opportunity, onSelect, onClose }: ParticipationOnboardingProps) {
  return <AnimatePresence>{opportunity && <motion.div className="opportunity-journey-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
    <motion.section className="relative max-h-[min(760px,calc(100svh-32px))] w-[min(500px,100%)] overflow-y-auto rounded-[26px] border border-[#d8e1dc] bg-white p-6 shadow-[0_28px_80px_rgba(18,37,29,.22)] sm:p-8" role="dialog" aria-modal="true" aria-labelledby="participation-onboarding-title" initial={{ opacity: 0, y: 14, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .98 }} transition={{ duration: .18 }}>
      <button className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl bg-[#f1f4f2] text-[#64726b]" type="button" onClick={onClose} aria-label="Fechar"><X size={17} /></button>
      <span className="text-[9px] font-bold uppercase tracking-[.14em] text-[#078166]">Meu objetivo</span>
      <h2 id="participation-onboarding-title" className="mt-2 pr-9 text-[clamp(1.6rem,5vw,2.1rem)] font-semibold leading-tight tracking-[-.045em] text-[#17372b]">O que você quer com esta oportunidade?</h2>
      <p className="mt-2 text-[10px] leading-5 text-[#718078]">Escolha seu objetivo em <strong className="font-semibold text-[#52615a]">{opportunity.title}</strong>. A plataforma entende seu progresso pelo checklist.</p>

      <div className="mt-6 divide-y divide-[#e7ece9] overflow-hidden rounded-[18px] border border-[#dce4e0]">
        {objectiveOptions.map((option) => {
          const Icon = option.icon;
          return <button type="button" onClick={() => onSelect(option.value)} className="group flex min-h-[72px] w-full items-center gap-3 bg-white px-4 py-3.5 text-left transition hover:bg-[#f5faf7]" key={option.value}>
            <span className={`grid size-9 shrink-0 place-items-center rounded-[12px] ${option.tone}`}><Icon size={16} /></span>
            <span className="min-w-0 flex-1"><strong className="block text-[11px] leading-4 text-[#29493c]">{option.title}</strong><small className="mt-1 block text-[9px] leading-4 text-[#7d8983]">{option.description}</small></span>
            <ArrowRight size={14} className="shrink-0 text-[#a1aba6] transition group-hover:translate-x-0.5 group-hover:text-[#078166]" />
          </button>;
        })}
      </div>
      <p className="mt-5 text-center text-[8px] text-[#929b97]">Você muda apenas o objetivo. O progresso é atualizado automaticamente pelas suas ações.</p>
    </motion.section>
  </motion.div>}</AnimatePresence>;
}
