"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, Bot, ExternalLink, FileText, LoaderCircle, MessageCircle, Search, Send, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useOpportunityJourney } from "@/components/opportunity-journey-provider";
import type { OpportunityDetail } from "@/data/opportunity-details";
import { getOpportunityCommunityHub } from "@/data/opportunity-knowledge-hubs";
import type { OpportunityGuideDocument } from "@/types/opportunity-knowledge-hub";

type HelpOutcome = {
  kind: "answer" | "section" | "discussion" | "resource" | "escalate";
  eyebrow: string;
  title: string;
  body: string;
  actionLabel?: string;
  section?: "overview" | "application" | "requirements" | "guide" | "materials";
  href?: string;
};

const sectionLabels: Record<string, string> = {
  overview: "Visão geral",
  application: "Minha candidatura",
  requirements: "Requisitos",
  guide: "Guia",
  materials: "Materiais",
};

function routeQuestion(question: string, opportunity: OpportunityDetail, guideDocument: OpportunityGuideDocument, hasJourney: boolean): HelpOutcome {
  const normalized = question.toLocaleLowerCase("pt-BR");
  const hub = getOpportunityCommunityHub(opportunity);
  const firstRequirement = opportunity.requirements.find((item) => item.required) ?? opportunity.requirements[0];

  if (/explique|requisito|documento|elegib|posso participar|ano|idade/.test(normalized)) {
    return {
      kind: "section",
      eyebrow: "Resposta + seção recomendada",
      title: firstRequirement ? `${firstRequirement.label}: o que isso significa` : "Confira os requisitos desta oportunidade",
      body: firstRequirement?.detail ?? "Os critérios e documentos obrigatórios estão organizados na seção Requisitos.",
      actionLabel: "Abrir requisitos",
      section: "requirements",
    };
  }

  if (/resum|esta página|visão geral|decidir|vale a pena/.test(normalized)) {
    return {
      kind: "answer",
      eyebrow: "Resumo contextual",
      title: opportunity.orientation.headline,
      body: `${opportunity.fitSummary} O prazo informado é ${opportunity.deadline}, com preparação estimada em ${opportunity.overview.find((item) => item.label === "Preparação")?.value ?? "algumas horas"}.`,
      actionLabel: "Ver visão geral",
      section: "overview",
    };
  }

  if (/guia|cronograma|seleção|como funciona|etapas|datas oficiais/.test(normalized)) {
    return {
      kind: "section",
      eyebrow: "Trecho do Guia",
      title: guideDocument.title,
      body: `${guideDocument.summary} Encontrei o conteúdo correspondente no Guia organizado desta oportunidade.`,
      actionLabel: "Abrir seção do Guia",
      section: "guide",
    };
  }

  if (/carta|motiv|portfólio|portfolio|entrevista|checklist|modelo|exemplo/.test(normalized)) {
    const resource = hub.sharedResources.find((item) => normalized.includes("entrevista") ? /entrevista/i.test(item.title) : normalized.includes("port") ? /portf|projeto/i.test(item.title) : /carta|motiv/i.test(item.title)) ?? hub.sharedResources[0];
    return {
      kind: "resource",
      eyebrow: "Material selecionado",
      title: resource?.title ?? "Material prático para sua preparação",
      body: resource?.description ?? "Encontrei um recurso relacionado à sua preparação.",
      actionLabel: "Abrir recurso",
      href: resource?.href,
    };
  }

  if (/compet|aprovad|brasil|experiência|alguém|opinião/.test(normalized)) {
    const discussion = hub.questions.find((item) => /compet|brasil|aprov/i.test(`${item.title} ${item.preview}`)) ?? hub.questions[0];
    return {
      kind: "discussion",
      eyebrow: "Referência relacionada",
      title: discussion?.title ?? "Veja referências para esta oportunidade",
      body: discussion ? `${discussion.preview} A seção Materiais reúne pessoas e fontes que podem ajudar.` : "A seção Materiais reúne referências e acesso ao grupo da seConecta.",
      actionLabel: "Abrir Materiais",
      section: "materials",
    };
  }

  if (/prepar|próximo passo|agora|começar/.test(normalized)) {
    return {
      kind: "section",
      eyebrow: "Próximo passo recomendado",
      title: "Transforme os requisitos em uma sequência pequena.",
      body: `Comece pelo primeiro item obrigatório e reserve um bloco curto hoje. Sua Jornada manterá o progresso de ${opportunity.title}.`,
      actionLabel: hasJourney ? "Abrir minha candidatura" : "Ver o que preparar",
      section: hasJourney ? "application" : "requirements",
    };
  }

  return {
    kind: "escalate",
    eyebrow: "Confiança insuficiente",
    title: "Não consegui responder isso com segurança.",
    body: "Essa pergunta parece depender de experiência pessoal. Em Materiais, você encontra pessoas de referência e acesso ao grupo da seConecta.",
    actionLabel: "Ver materiais e grupo",
    section: "materials",
  };
}

export function OpportunityHelpLayer({ opportunity, guideDocument }: { opportunity: OpportunityDetail; guideDocument: OpportunityGuideDocument }) {
  const { getJourney } = useOpportunityJourney();
  const journey = getJourney(opportunity.id);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [question, setQuestion] = useState("");
  const [thinking, setThinking] = useState(false);
  const [outcome, setOutcome] = useState<HelpOutcome | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  const checklistProgress = useMemo(() => {
    const completed = journey?.applicationProgress.completedItemIds.length ?? 0;
    const total = opportunity.requirements.length + 4;
    return `${completed}/${total}`;
  }, [journey, opportunity.requirements.length]);

  useEffect(() => {
    const contextChange = (event: Event) => {
      const section = (event as CustomEvent<{ section?: string }>).detail?.section;
      if (section) setActiveSection(section);
    };
    window.addEventListener("seconecta:opportunity-context-change", contextChange);
    return () => window.removeEventListener("seconecta:opportunity-context-change", contextChange);
  }, []);

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
    setOutcome(null);
    setThinking(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setOutcome(routeQuestion(normalized, opportunity, guideDocument, Boolean(journey)));
      setThinking(false);
    }, 520);
  };

  const navigate = (section: NonNullable<HelpOutcome["section"]>) => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("seconecta:opportunity-section", { detail: { section } }));
  };

  const escalate = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("seconecta:opportunity-section", { detail: { section: "materials" } }));
  };

  const suggested = [
    "Explique este requisito",
    "Sou elegível?",
    `Resuma ${sectionLabels[activeSection] ?? "esta página"}`,
    "O que devo preparar?",
    "Ajude-me a decidir",
  ];

  return <>
    <motion.button type="button" onClick={() => setOpen(true)} className="fixed bottom-20 right-4 z-[900] flex items-center gap-2.5 rounded-full border border-[#cde0d8] bg-white px-3 py-2.5 shadow-[0_12px_34px_rgba(18,55,42,.16)] md:bottom-5 md:right-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }} aria-label="Abrir ajuda do Coach">
      <span className="grid size-8 place-items-center rounded-full bg-[#079272] text-white"><Sparkles size={13} /></span>
      <strong className="pr-1 text-[9px] text-[#29493c]">Precisa de ajuda?</strong>
    </motion.button>

    <AnimatePresence>{open && <motion.aside className="fixed inset-y-0 right-0 z-[1050] flex w-[min(410px,100vw)] flex-col border-l border-[#d8e1dc] bg-white shadow-[-18px_0_55px_rgba(18,37,29,.16)]" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 32 }} role="dialog" aria-modal="false" aria-labelledby="opportunity-help-title">
      <header className="flex items-center gap-3 border-b border-[#e1e7e4] px-5 py-4"><span className="grid size-10 place-items-center rounded-[13px] bg-[#eaf7f1] text-[#078166]"><Bot size={17} /></span><div className="min-w-0 flex-1"><span className="text-[8px] font-bold uppercase tracking-[.12em] text-[#078166]">Ajuda contextual</span><h2 id="opportunity-help-title" className="mt-0.5 text-[13px] font-semibold text-[#29493c]">Pergunte sobre esta oportunidade</h2></div><button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-xl bg-[#f1f4f2] text-[#65736c]" aria-label="Fechar ajuda"><X size={16} /></button></header>

      <div className="border-b border-[#e8ecea] bg-[#fafcfb] px-5 py-3"><div className="flex flex-wrap gap-2 text-[7px] font-semibold text-[#718078]"><span className="rounded-full bg-white px-2.5 py-1.5 shadow-sm">{sectionLabels[activeSection] ?? activeSection}</span><span className="rounded-full bg-white px-2.5 py-1.5 shadow-sm">{journey ? `Objetivo: ${journey.objective === "following" ? "acompanhar" : journey.objective === "applying" ? "candidatar-se" : "participar"}` : "Ainda não participa"}</span><span className="rounded-full bg-white px-2.5 py-1.5 shadow-sm">Checklist {checklistProgress}</span><span className="rounded-full bg-white px-2.5 py-1.5 shadow-sm">Guia · {guideDocument.readTime}</span></div></div>

      <div className="flex-1 overflow-y-auto p-5">
        {!outcome && !thinking && <div><h3 className="text-lg font-semibold tracking-[-.035em] text-[#29493c]">Como posso ajudar?</h3><p className="mt-1 text-[9px] leading-5 text-[#718078]">Já estou considerando esta seção, seu objetivo, o prazo e o conteúdo do Guia.</p><div className="mt-5 grid gap-2">{suggested.map((action) => <button type="button" onClick={() => ask(action)} className="flex min-h-11 items-center justify-between gap-3 rounded-[13px] border border-[#dbe3df] px-3.5 text-left text-[9px] font-medium text-[#52615a] hover:border-[#a9cdbf] hover:bg-[#f7faf8]" key={action}>{action}<ArrowRight size={11} className="shrink-0 text-[#98a39d]" /></button>)}</div><div className="mt-5 flex items-center gap-2 text-[7px] text-[#929b97]"><Search size={10} />Pesquisa Guia, FAQ e materiais selecionados.</div></div>}

        {thinking && <div className="flex items-center gap-3 rounded-[14px] bg-[#f3f7f5] px-4 py-4" role="status"><LoaderCircle size={16} className="animate-spin text-[#078166]" /><div><strong className="block text-[9px] text-[#29493c]">Procurando a melhor resposta...</strong><span className="mt-0.5 block text-[8px] text-[#87928c]">Verificando Guia, materiais e seu progresso.</span></div></div>}

        {outcome && !thinking && <motion.article initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <span className="text-[8px] font-bold uppercase tracking-[.11em] text-[#078166]">{outcome.eyebrow}</span><h3 className="mt-2 text-[17px] font-semibold leading-6 tracking-[-.03em] text-[#29493c]">{outcome.title}</h3><p className="mt-3 text-[10px] leading-6 text-[#607068]">{outcome.body}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {outcome.kind === "escalate" ? <button type="button" onClick={escalate} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#079272] px-4 text-[9px] font-semibold text-white"><MessageCircle size={12} />{outcome.actionLabel}</button>
              : outcome.href ? <a href={outcome.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#079272] px-4 text-[9px] font-semibold text-white no-underline">{outcome.actionLabel}<ExternalLink size={11} /></a>
                : outcome.section && <button type="button" onClick={() => navigate(outcome.section!)} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#079272] px-4 text-[9px] font-semibold text-white">{outcome.section === "guide" ? <BookOpen size={12} /> : <FileText size={12} />}{outcome.actionLabel}</button>}
            <button type="button" onClick={() => { setOutcome(null); setQuestion(""); }} className="min-h-10 rounded-full border border-[#d5dfda] px-4 text-[9px] font-semibold text-[#607068]">Fazer outra pergunta</button>
          </div>
          {outcome.kind !== "escalate" && <button type="button" onClick={escalate} className="mt-4 text-[8px] font-semibold text-[#718078] underline decoration-[#c5cfca] underline-offset-4">Ver pessoas e ajuda no WhatsApp</button>}
        </motion.article>}
      </div>

      <form onSubmit={(event) => { event.preventDefault(); ask(question); }} className="border-t border-[#e1e7e4] bg-[#fafcfb] p-4"><div className="flex items-center rounded-[14px] border border-[#ccd9d3] bg-white p-1.5 shadow-sm focus-within:border-[#079272]"><label className="sr-only" htmlFor={`opportunity-help-${opportunity.id}`}>Pergunte sobre esta oportunidade</label><input ref={inputRef} id={`opportunity-help-${opportunity.id}`} value={question} onChange={(event) => setQuestion(event.target.value)} className="h-10 min-w-0 flex-1 border-0 bg-transparent px-3 text-[10px] text-[#29493c] outline-none" placeholder="Pergunte qualquer coisa..." /><button type="submit" disabled={!question.trim()} className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-[#079272] text-white disabled:opacity-35" aria-label="Enviar pergunta"><Send size={14} /></button></div></form>
    </motion.aside>}</AnimatePresence>
  </>;
}
