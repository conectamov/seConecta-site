"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BrainCircuit, Sparkles, X } from "lucide-react";
import { useState } from "react";

export function LearnCoach({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const prompts = ["Não sei por onde começar", "Quero uma trilha para meu objetivo", "O que deveria aprender agora?"];

  return <>
    <button type="button" onClick={() => setOpen(true)} className={compact ? "inline-flex min-h-10 items-center gap-2 rounded-full border border-[#bad7cc] bg-white px-4 text-[9px] font-semibold text-[#06765d] shadow-sm" : "inline-flex min-h-11 items-center gap-2 rounded-full bg-[#173b30] px-5 text-[10px] font-semibold text-white shadow-[0_10px_24px_rgba(23,59,48,.15)]"}><Sparkles size={14} />Pedir uma recomendação</button>
    <AnimatePresence>{open && <motion.div className="fixed inset-0 z-[3000] flex justify-end bg-[#10231c]/35 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.currentTarget === event.target && setOpen(false)}>
      <motion.aside className="h-full w-[min(410px,100%)] overflow-y-auto border-l border-[#d7e1dc] bg-[#fbfcfb] p-6 shadow-[-20px_0_60px_rgba(20,50,39,.14)]" initial={{ x: 40 }} animate={{ x: 0 }} exit={{ x: 40 }} transition={{ duration: .2 }}>
        <div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-[14px] bg-[#e9f7f1] text-[#078166]"><BrainCircuit size={18} /></span><button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full bg-[#edf2ef] text-[#65736c]" aria-label="Fechar Coach"><X size={16} /></button></div>
        <span className="mt-8 block text-[9px] font-bold uppercase tracking-[.13em] text-[#078166]">Coach seConecta</span>
        <h2 className="mt-2 text-[26px] font-semibold leading-8 tracking-[-.05em] text-[#17372b]">O que você quer conseguir?</h2>
        <p className="mt-3 text-[11px] leading-6 text-[#718078]">Eu organizo um ponto de partida usando seus objetivos, oportunidades e progresso.</p>
        <div className="mt-7 grid gap-2">{prompts.map((prompt) => <button type="button" onClick={() => setSelected(prompt)} className={`flex min-h-12 items-center justify-between rounded-[15px] border px-4 text-left text-[10px] font-semibold transition ${selected === prompt ? "border-[#8fc5b3] bg-[#eaf7f1] text-[#06765d]" : "border-[#dce4e0] bg-white text-[#52615a] hover:border-[#b6d1c6]"}`} key={prompt}>{prompt}<ArrowRight size={13} /></button>)}</div>
        {selected && <motion.div className="mt-6 rounded-[18px] border border-[#cfe0d8] bg-white p-5" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}><span className="text-[8px] font-bold uppercase tracking-[.12em] text-[#078166]">Primeiro movimento</span><p className="mt-2 text-[11px] leading-6 text-[#405b50]">Escolha um objetivo de aprendizado. A partir dele, eu conecto um guia curto, um recurso prático e uma oportunidade para aplicar o que você aprendeu.</p><a href="#objetivos" onClick={() => setOpen(false)} className="mt-4 inline-flex items-center gap-2 text-[9px] font-semibold text-[#078166] no-underline">Escolher meu objetivo <ArrowRight size={12} /></a></motion.div>}
      </motion.aside>
    </motion.div>}</AnimatePresence>
  </>;
}

