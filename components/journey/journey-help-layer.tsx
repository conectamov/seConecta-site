"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bot, LoaderCircle, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { JourneyPlan } from "@/types/journey-plan";

const suggestions = [
  "O que devo priorizar hoje?",
  "Qual é meu próximo passo?",
  "Resuma minha Jornada",
  "Tenho algum prazo urgente?",
];

function answerQuestion(question: string, plan: JourneyPlan) {
  const normalized = question.toLocaleLowerCase("pt-BR");
  if (/prazo|urgent/.test(normalized)) {
    return plan.reminders[0]?.text ?? "Você não tem nenhum prazo urgente registrado agora.";
  }
  if (/resum|jornada/.test(normalized)) {
    return plan.projects.length > 0
      ? `Você tem ${plan.projects.length} ${plan.projects.length === 1 ? "oportunidade ativa" : "oportunidades ativas"} e ${plan.observing.length} em acompanhamento. Seu foco recomendado é: ${plan.mission.title}.`
      : `Você acompanha ${plan.observing.length} ${plan.observing.length === 1 ? "oportunidade" : "oportunidades"}, sem candidatura ativa no momento.`;
  }
  return `${plan.mission.title}. Esse é o passo com maior impacto agora em ${plan.mission.context}.`;
}

export function JourneyHelpLayer({ plan }: { plan: JourneyPlan }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  const ask = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return;
    setQuestion(normalized);
    setAnswer(null);
    setThinking(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setAnswer(answerQuestion(normalized, plan));
      setThinking(false);
    }, 480);
  };

  return <>
    <motion.button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-[900] flex items-center gap-2.5 rounded-full border border-[#cde0d8] bg-white px-3 py-2.5 shadow-[0_12px_34px_rgba(18,55,42,.16)]" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }} aria-label="Abrir ajuda do Coach">
      <span className="grid size-8 place-items-center rounded-full bg-[#079272] text-white"><Sparkles size={13} /></span>
      <strong className="pr-1 text-[9px] text-[#29493c]">Precisa de ajuda?</strong>
    </motion.button>

    <AnimatePresence>{open && <motion.aside className="fixed inset-y-0 right-0 z-[1050] flex w-[min(410px,100vw)] flex-col border-l border-[#d8e1dc] bg-white shadow-[-18px_0_55px_rgba(18,37,29,.16)]" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 32 }} role="dialog" aria-modal="false" aria-labelledby="journey-help-title">
      <header className="flex items-center gap-3 border-b border-[#e1e7e4] px-5 py-4">
        <span className="grid size-10 place-items-center rounded-[13px] bg-[#eaf7f1] text-[#078166]"><Bot size={17} /></span>
        <div className="min-w-0 flex-1"><span className="text-[8px] font-bold uppercase tracking-[.12em] text-[#078166]">Ajuda contextual</span><h2 id="journey-help-title" className="mt-0.5 text-[13px] font-semibold text-[#29493c]">Pergunte sobre sua Jornada</h2></div>
        <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-xl bg-[#f1f4f2] text-[#65736c]" aria-label="Fechar ajuda"><X size={16} /></button>
      </header>

      <div className="border-b border-[#e8ecea] bg-[#fafcfb] px-5 py-3">
        <div className="flex flex-wrap gap-2 text-[7px] font-semibold text-[#718078]"><span className="rounded-full bg-white px-2.5 py-1.5 shadow-sm">{plan.projects.length} ativas</span><span className="rounded-full bg-white px-2.5 py-1.5 shadow-sm">{plan.observing.length} acompanhando</span><span className="rounded-full bg-white px-2.5 py-1.5 shadow-sm">{plan.reminders.length} lembretes</span></div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {!answer && !thinking && <div><h3 className="text-lg font-semibold tracking-[-.035em] text-[#29493c]">Como posso ajudar?</h3><p className="mt-1 text-[9px] leading-5 text-[#718078]">Já estou considerando suas oportunidades, progresso e prazos.</p><div className="mt-5 grid gap-2">{suggestions.map((suggestion) => <button type="button" onClick={() => ask(suggestion)} className="flex min-h-11 items-center justify-between gap-3 rounded-[13px] border border-[#dbe3df] px-3.5 text-left text-[9px] font-medium text-[#52615a] hover:border-[#a9cdbf] hover:bg-[#f7faf8]" key={suggestion}>{suggestion}<ArrowRight size={11} className="shrink-0 text-[#98a39d]" /></button>)}</div></div>}
        {thinking && <div className="flex items-center gap-3 rounded-[14px] bg-[#f3f7f5] px-4 py-4" role="status"><LoaderCircle size={16} className="animate-spin text-[#078166]" /><strong className="text-[9px] text-[#29493c]">Revisando sua Jornada...</strong></div>}
        {answer && !thinking && <motion.article initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}><span className="text-[8px] font-bold uppercase tracking-[.11em] text-[#078166]">Próximo passo recomendado</span><p className="mt-3 text-[11px] leading-6 text-[#52615a]">{answer}</p><button type="button" onClick={() => { setAnswer(null); setQuestion(""); }} className="mt-5 rounded-full border border-[#d5dfda] px-4 py-2.5 text-[9px] font-semibold text-[#607068]">Fazer outra pergunta</button></motion.article>}
      </div>

      <form onSubmit={(event) => { event.preventDefault(); ask(question); }} className="border-t border-[#e1e7e4] bg-[#fafcfb] p-4">
        <div className="flex items-center rounded-[14px] border border-[#ccd9d3] bg-white p-1.5 shadow-sm focus-within:border-[#079272]"><label className="sr-only" htmlFor="journey-help-input">Pergunte sobre sua Jornada</label><input ref={inputRef} id="journey-help-input" value={question} onChange={(event) => setQuestion(event.target.value)} className="h-10 min-w-0 flex-1 border-0 bg-transparent px-3 text-[10px] text-[#29493c] outline-none" placeholder="Pergunte qualquer coisa..." /><button type="submit" disabled={!question.trim()} className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-[#079272] text-white disabled:opacity-35" aria-label="Enviar pergunta"><Send size={14} /></button></div>
      </form>
    </motion.aside>}</AnimatePresence>
  </>;
}
