"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity as ActivityIcon, ArrowRight, BellRing, BookOpen, Bookmark, BrainCircuit, CalendarClock, Check, CheckCircle2, ChevronDown, Clock3, Compass, FileCheck2, History, Inbox, ListChecks, MessageCircle, Newspaper, Route, Sparkles, Target, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ComingSoon } from "@/components/coming-soon";
import { loadJourneyProfileExtension, ProfileUnlocks } from "@/components/journey/profile-unlocks";
import { JourneyHelpLayer } from "@/components/journey/journey-help-layer";
import { useAuthentication } from "@/components/auth/authentication-provider";
import { OpportunityObjectiveSelector } from "@/components/opportunity-objective-selector";
import { OpportunityWorkspaceNav } from "@/components/opportunity-workspace-nav";
import { useOpportunityJourney } from "@/components/opportunity-journey-provider";
import { PROFILE_EXTENSION_UPDATED_EVENT } from "@/components/preferences/preferences-provider";
import { SiteHeader } from "@/components/site-header";
import { useJourneyOnboarding } from "@/hooks/use-journey-onboarding";
import { createJourneyPlan } from "@/services/journey-planner-service";
import type { JourneyPlan, JourneyPriority, JourneyUpdate } from "@/types/journey-plan";
import type { OpportunityObjective } from "@/types/opportunity-journey";
import type { JourneyProfileExtension } from "@/types/journey-profile";

const reveal = { initial: { opacity: 0, y: 10 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-30px" }, transition: { duration: .28, ease: "easeOut" as const } };

function SectionTitle({ eyebrow, title, description, aside }: { eyebrow: string; title: string; description?: string; aside?: React.ReactNode }) {
  return <header className="mb-5 flex items-end justify-between gap-5"><div><span className="text-[10px] font-bold uppercase tracking-[.15em] text-[#078166]">{eyebrow}</span><h2 className="mt-1.5 text-[clamp(1.55rem,2.6vw,2rem)] font-semibold leading-tight tracking-[-.045em] text-[#17372b]">{title}</h2>{description && <p className="mt-2 text-[12px] leading-5 text-[#6d7973]">{description}</p>}</div>{aside}</header>;
}

function CoachHero({ plan, displayName }: { plan: JourneyPlan; displayName?: string }) {
  const [greeting, setGreeting] = useState("Olá");
  const [focusIndex, setFocusIndex] = useState(0);
  const [showReasoning, setShowReasoning] = useState(false);
  const focusOptions = [...plan.projects, ...plan.observing];
  const focus = focusOptions[focusIndex % Math.max(focusOptions.length, 1)];
  const remainingSteps = focus ? Math.max(0, focus.progress.total - focus.progress.completed) : 0;
  const mission = focus ? {
    title: focus.nextAction,
    context: focus.opportunity.title,
    href: `/explorar/${focus.opportunity.id}`,
    estimate: focus.actionEstimate ?? "≈ 5 minutos",
    reasons: [
      focus.daysLeft !== undefined ? `Prazo em ${focus.daysLeft} ${focus.daysLeft === 1 ? "dia" : "dias"}` : focus.healthLabel,
      remainingSteps === 0 ? "Você já concluiu toda a preparação" : remainingSteps === 1 ? "Falta só 1 passo para concluir esta etapa" : `Você já avançou ${focus.progress.completed} de ${focus.progress.total} etapas`,
      remainingSteps === 0 ? "Isso libera sua próxima prioridade" : focus.reason,
    ],
    guidance: remainingSteps === 0
      ? "Você já fez a parte mais longa. Agora eu confirmaria o próximo movimento."
      : remainingSteps === 1
        ? "Você está a um passo de fechar esta etapa."
        : "Esse é o passo que mais destrava sua candidatura agora.",
  } : {
    title: plan.mission.title,
    context: plan.mission.context,
    href: plan.mission.href,
    estimate: `≈ ${plan.mission.minutes} minutos`,
    reasons: [plan.mission.why, ...plan.coachReasons].slice(0, 3),
    guidance: "Hoje eu começaria por aqui.",
  };

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite");
  }, []);

  const visibleUpdates = plan.updates.slice(0, 4);
  const newUpdates = Math.min(2, visibleUpdates.length);

  return <section className="border-b border-[#dce4e0] bg-white">
    <div className="mx-auto grid w-[min(1180px,calc(100%-40px))] gap-7 py-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(310px,.65fr)] lg:py-10">
      <div>
        <span className="inline-flex items-center gap-2 text-[9px] font-semibold text-[#718078]"><BrainCircuit size={13} className="text-[#079272]" />Seu Coach organizou o próximo passo.</span>
        <h1 className="mt-2 text-[clamp(2.2rem,4.5vw,3.8rem)] font-semibold leading-[1.02] tracking-[-.06em] text-[#17372b]">{greeting}{displayName ? `, ${displayName}` : ""}</h1>

        <motion.div key={focus?.opportunity.id ?? "empty"} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .24 }} className="mt-6 border-l-2 border-[#079272] pl-5 sm:pl-6">
          <span className="text-[9px] font-bold uppercase tracking-[.13em] text-[#078166]">Hoje eu faria isto primeiro</span>
          <h2 className="mt-2 max-w-2xl text-[clamp(1.45rem,2.8vw,2rem)] font-semibold leading-tight tracking-[-.045em] text-[#1c372c]">{mission.title}</h2>
          <p className="mt-1 text-[12px] font-medium text-[#65736c]">{mission.context}</p>
          <p className="mt-3 max-w-2xl text-[11px] leading-5 text-[#456156]">{mission.guidance}</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_145px]">
            <div>
              <span className="text-[8px] font-bold uppercase tracking-[.12em] text-[#89938e]">Porque</span>
              <ul className="mt-1.5 grid gap-1.5">
                {mission.reasons.slice(0, showReasoning ? 3 : 2).map((reason) => <li className="flex items-start gap-2 text-[10px] leading-5 text-[#52615a]" key={reason}><span className="mt-2 size-1 shrink-0 rounded-full bg-[#079272]" />{reason}</li>)}
              </ul>
            </div>
            <div className="sm:border-l sm:border-[#e1e7e4] sm:pl-5">
              <span className="text-[8px] font-bold uppercase tracking-[.12em] text-[#89938e]">Tempo estimado</span>
              <strong className="mt-1.5 flex items-center gap-2 text-[12px] text-[#29493c]"><Clock3 size={14} className="text-[#078166]" />{mission.estimate}</strong>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={mission.href} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#079272] px-5 text-[10px] font-semibold text-white no-underline shadow-[0_8px_20px_rgba(7,146,114,.14)] transition hover:-translate-y-0.5 hover:bg-[#06765d]">Começar agora <ArrowRight size={13} /></Link>
            <button type="button" onClick={() => setShowReasoning((visible) => !visible)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#d4ded9] bg-white px-4 text-[10px] font-semibold text-[#52615a] transition hover:border-[#a9cabe] hover:bg-[#f9fbfa]">{showReasoning ? "Ocultar motivo" : "Por que isso?"}<ChevronDown size={12} className={`transition-transform ${showReasoning ? "rotate-180" : ""}`} /></button>
            <button type="button" onClick={() => { setFocusIndex((current) => focusOptions.length > 1 ? (current + 1) % focusOptions.length : current); setShowReasoning(false); }} disabled={focusOptions.length < 2} className="inline-flex min-h-10 items-center rounded-full px-4 text-[9px] font-semibold text-[#68766f] hover:bg-[#f1f5f3] disabled:cursor-default disabled:opacity-40">Ver outra prioridade</button>
          </div>
        </motion.div>
      </div>

      <aside className="self-start rounded-[20px] border border-[#dce4e0] bg-[#f8faf9] p-4" aria-labelledby="since-last-visit-title">
        <div className="flex items-center gap-3 border-b border-[#e1e7e4] pb-3">
          <span className="grid size-9 place-items-center rounded-[12px] bg-white text-[#078166] shadow-sm"><Inbox size={16} /></span>
          <div className="min-w-0 flex-1"><h2 id="since-last-visit-title" className="text-[12px] font-semibold text-[#29493c]">Desde sua última visita</h2><p className="mt-0.5 text-[8px] text-[#87928c]">Seu plano acompanhou estas mudanças</p></div>
          {newUpdates > 0 && <span className="rounded-full bg-[#e7f5ef] px-2 py-1 text-[7px] font-bold text-[#078166]">{newUpdates} novidades</span>}
        </div>
        {visibleUpdates.length > 0 ? <div className="divide-y divide-[#e4e9e6]">{visibleUpdates.map((update, index) => { const Icon = updateIcons[update.icon]; return <Link href={update.href} className="group flex items-center gap-3 py-3 no-underline transition hover:translate-x-0.5" key={update.id}><span className="relative grid size-8 shrink-0 place-items-center rounded-[11px] bg-white text-[#078166]">{index === 0 && <i className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-[#19a680] ring-2 ring-[#f8faf9] motion-safe:animate-pulse" />}<Icon size={14} /></span><span className="min-w-0 flex-1"><strong className="block text-[9px] font-medium leading-4 text-[#456156]">{update.text}</strong><time className="mt-1 block text-[8px] text-[#939c98]">{update.timestamp}</time></span><ArrowRight size={12} className="shrink-0 text-[#a0aaa5] transition-transform group-hover:translate-x-0.5 group-hover:text-[#078166]" /></Link>; })}</div> : <p className="py-6 text-[10px] leading-5 text-[#748079]">Tudo em dia. Eu continuo acompanhando o que pode mudar seu próximo passo.</p>}
      </aside>
    </div>
  </section>;
}

const updateIcons = { opening: CalendarClock, deadline: BellRing, result: Newspaper, material: BookOpen, community: MessageCircle, mentor: UserRound, person: Users, saved: Bookmark, checklist: FileCheck2 };

function CoachCheckIn({ plan }: { plan: JourneyPlan }) {
  const project = plan.projects.find((item) => item.relationship.stage === "preparing");
  const [answer, setAnswer] = useState<string | null>(null);
  const [alreadyAnswered, setAlreadyAnswered] = useState(false);
  const storageKey = project ? `seconecta:coach-check-in:${project.opportunity.id}` : "";

  useEffect(() => {
    if (!storageKey) return;
    setAlreadyAnswered(Boolean(window.localStorage.getItem(storageKey)));
    setAnswer(null);
  }, [storageKey]);

  if (!project || alreadyAnswered) return null;

  const respond = (value: string) => {
    window.localStorage.setItem(storageKey, JSON.stringify({ value, answeredAt: new Date().toISOString() }));
    setAnswer(value);
    window.setTimeout(() => setAlreadyAnswered(true), 1800);
  };

  return <AnimatePresence mode="wait">{answer ? <motion.div key="thanks" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 rounded-[18px] border border-[#cfe2d9] bg-[#edf7f2] px-5 py-4"><CheckCircle2 size={17} className="text-[#078166]" /><p className="text-[10px] font-medium text-[#456156]">Entendi. Vou ajustar as próximas orientações considerando como essa preparação está avançando.</p></motion.div> : <motion.section key="question" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 rounded-[20px] border border-[#dce4e0] bg-white px-5 py-5 sm:flex-row sm:items-center sm:px-6"><span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[#edf7f2] text-[#078166]"><Sparkles size={16} /></span><div className="min-w-0 flex-1"><span className="text-[8px] font-bold uppercase tracking-[.12em] text-[#87928c]">Check-in rápido</span><h2 className="mt-1 text-[13px] font-semibold text-[#29493c]">Você conseguiu avançar em {project.opportunity.title}?</h2></div><div className="flex flex-wrap gap-2">{["Sim", "Parcialmente", "Ainda não"].map((option) => <button type="button" onClick={() => respond(option)} className="min-h-9 rounded-full border border-[#d5dfda] bg-[#f9fbfa] px-4 text-[9px] font-semibold text-[#52615a] transition hover:border-[#9fc7b8] hover:bg-[#edf7f3] hover:text-[#078166]" key={option}>{option}</button>)}</div></motion.section>}</AnimatePresence>;
}

function ActivityFeed({ updates }: { updates: JourneyUpdate[] }) {
  const contextFor = (update: JourneyUpdate) => {
    switch (update.icon) {
      case "checklist":
        return "Seu plano já foi recalculado com o próximo passo.";
      case "material":
        return "Apareceu porque combina com a etapa que você alcançou.";
      case "mentor":
      case "community":
      case "person":
        return "Uma nova perspectiva pode ajudar você a decidir como avançar.";
      case "deadline":
      case "opening":
        return "Seu plano foi ajustado para manter essa oportunidade em dia.";
      case "result":
        return "Essa mudança pode liberar uma nova prioridade.";
      case "saved":
        return "Agora ela faz parte do plano que acompanhamos com você.";
    }
  };

  return <section id="novidades"><SectionTitle eyebrow="Atividade" title="O que mudou no seu caminho" description="Cada novidade aparece porque pode mudar seu próximo passo." />{updates.length > 0 ? <div className="grid gap-2.5">{updates.map((update, index) => { const Icon = updateIcons[update.icon]; return <motion.div layout initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} whileHover={{ y: -1 }} viewport={{ once: true }} transition={{ delay: index * .04, duration: .2 }} className="group flex min-h-[82px] items-center gap-4 rounded-[18px] border border-[#d8e1dc] bg-white px-4 py-3 shadow-[0_7px_20px_rgba(28,54,43,.035)] transition-shadow hover:shadow-[0_10px_26px_rgba(28,54,43,.07)] sm:px-5" key={update.id}><span className="relative grid size-10 shrink-0 place-items-center rounded-[14px] bg-[#eaf7f2] text-[#078166]"><Icon size={16} />{index === 0 && <motion.i className="absolute -right-0.5 -top-0.5 size-2 rounded-full border-2 border-white bg-[#14a37f]" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2.2, repeat: Infinity }} />}</span><div className="min-w-0 flex-1"><p className="text-[11px] font-medium leading-5 text-[#365247]">{update.text}</p><p className="mt-0.5 text-[9px] leading-4 text-[#78857e]">{contextFor(update)}</p><time className="mt-1 block text-[8px] text-[#9aa29e]">{update.timestamp}</time></div><Link href={update.href} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#dce4e0] px-3 py-2 text-[9px] font-semibold text-[#078166] no-underline transition hover:border-[#bcd4c9] hover:bg-[#edf7f3]">{update.actionLabel}<ArrowRight size={11} /></Link></motion.div>; })}</div> : <div className="flex min-h-[76px] items-center gap-4 rounded-[18px] border border-[#d8e1dc] bg-white px-5"><span className="grid size-10 place-items-center rounded-[14px] bg-[#eaf7f2] text-[#078166]"><Check size={16} /></span><div><p className="text-[11px] font-medium text-[#456156]">Tudo em dia.</p><p className="mt-1 text-[9px] text-[#7c8882]">Seu próximo passo continua claro — avisaremos quando algo mudar.</p></div></div>}</section>;
}

const healthStyles = { onTrack: "bg-[#e9f7f1] text-[#08745d]", attention: "bg-[#fff4df] text-[#95661e]", urgent: "bg-[#ffede7] text-[#a84d35]" };

function OpportunityProfileRow({ project, onObjectiveChange, onRemove }: { project: JourneyPriority; onObjectiveChange: (objective: OpportunityObjective) => void; onRemove: () => void }) {
  const progress = Math.min(100, Math.round((project.progress.completed / project.progress.total) * 100));
  const deadline = project.daysLeft !== undefined ? `${project.daysLeft} dias restantes` : project.opportunity.deadline;
  const remaining = Math.max(0, project.progress.total - project.progress.completed);
  const movementLabel = remaining === 0 ? "Preparação concluída" : remaining === 1 ? "1 passo restante" : `${remaining} passos restantes`;
  return <motion.article layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }} whileHover={{ y: -2 }} transition={{ duration: .2 }} className="grid gap-5 rounded-[22px] border border-[#d5dfda] bg-white p-5 shadow-[0_10px_28px_rgba(28,54,43,.045)] transition-shadow hover:shadow-[0_14px_34px_rgba(28,54,43,.075)] lg:grid-cols-[minmax(220px,1.1fr)_minmax(190px,.8fr)_minmax(210px,.85fr)_auto] lg:items-center"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[8px] font-bold ${healthStyles[project.health]}`}>{project.healthLabel}</span><span className="text-[8px] font-medium text-[#89938e]">{project.opportunity.organization}</span></div><h3 className="mt-2.5 text-[15px] font-semibold leading-6 tracking-[-.03em] text-[#17372b]">{project.opportunity.title}</h3><p className="mt-1 text-[9px] text-[#7d8983]">{deadline}</p></div><div><label className="mb-2 block text-[8px] font-bold uppercase tracking-[.11em] text-[#89938e]">Meu objetivo</label><OpportunityObjectiveSelector value={project.relationship.objective} onChange={onObjectiveChange} onRemove={onRemove} align="end" /></div><div><div className="flex items-center justify-between text-[9px]"><span className="font-medium text-[#52615a]">{movementLabel}</span><span className="text-[#8a948f]">{project.progress.completed}/{project.progress.total}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e6ebe8]" role="progressbar" aria-valuemin={0} aria-valuemax={project.progress.total} aria-valuenow={project.progress.completed}><motion.i className="block h-full rounded-full bg-[#079272]" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: .65, ease: "easeOut" }} /></div><div className="mt-3"><span className="text-[8px] font-bold uppercase tracking-[.1em] text-[#89938e]">Continue daqui</span><p className="mt-1 text-[10px] font-semibold text-[#29493c]">{project.nextAction} <small className="font-normal text-[#84908a]">· {project.actionEstimate ?? "≈ 5 minutos"}</small></p></div></div><Link href={`/explorar/${project.opportunity.id}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#079272] px-5 text-[10px] font-semibold no-underline transition hover:bg-[#067b61] lg:min-w-28" style={{ color: "#fff" }}>Continuar <ArrowRight size={12} /></Link></motion.article>;
}

function ObservingOpportunityRow({ project, onObjectiveChange, onRemove }: { project: JourneyPriority; onObjectiveChange: (objective: OpportunityObjective) => void; onRemove: () => void }) {
  const statusCopy = project.opportunity.applicationStatus === "open"
    ? "Inscrições abertas"
    : project.opportunity.applicationStatus === "upcoming"
      ? "Inscrições ainda não abriram"
      : "Inscrições encerradas";
  return <motion.article layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }} whileHover={{ y: -1 }} className="flex flex-col gap-4 rounded-[20px] border border-[#dbe2de] bg-[#f6f8f7] p-5 transition-shadow hover:shadow-[0_10px_26px_rgba(28,54,43,.05)] sm:flex-row sm:items-center"><span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-white text-[#66756e] shadow-sm"><Bookmark size={17} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-[#d6ded9] bg-white px-2.5 py-1 text-[8px] font-bold text-[#607068]">Continue acompanhando</span><span className="text-[8px] font-medium text-[#89938e]">{statusCopy}</span></div><h3 className="mt-2 text-[13px] font-semibold leading-5 tracking-[-.025em] text-[#29493c]">{project.opportunity.title}</h3><p className="mt-1 text-[9px] text-[#7d8983]">{project.opportunity.organization} · Mantida por perto, sem candidatura ativa.</p></div><div className="flex flex-col gap-2 sm:flex-row"><OpportunityObjectiveSelector value={project.relationship.objective} onChange={onObjectiveChange} onRemove={onRemove} align="end" className="min-w-44" /><Link href={`/explorar/${project.opportunity.id}`} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-[#d5ddd9] bg-white px-4 text-[9px] font-semibold text-[#52615a] no-underline transition hover:border-[#b9c9c1] hover:bg-[#f9fbfa]">Ver oportunidade <ArrowRight size={11} /></Link></div></motion.article>;
}

function AccomplishmentCard({ item, onObjectiveChange, onRemove }: { item: JourneyPriority; onObjectiveChange: (objective: OpportunityObjective) => void; onRemove: () => void }) {
  const approved = ["accepted", "completed"].includes(item.relationship.stage);
  return <motion.article layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -18 }} className={`flex min-h-[88px] flex-col gap-4 rounded-[20px] border px-5 py-4 shadow-[0_8px_22px_rgba(28,54,43,.035)] sm:flex-row sm:items-center ${approved ? "border-[#cce3d9] bg-[#eaf7f1]" : "border-[#e1ded8] bg-[#f5f3ef]"}`}><span className={`grid size-10 shrink-0 place-items-center rounded-[14px] ${approved ? "bg-white text-[#078166]" : "bg-white text-[#7a746c]"}`}>{approved ? <CheckCircle2 size={18} /> : <Compass size={17} />}</span><div className="min-w-0 flex-1"><span className={`text-[8px] font-bold uppercase tracking-[.12em] ${approved ? "text-[#078166]" : "text-[#817a72]"}`}>{approved ? "Aprovado" : "Ciclo encerrado"}</span><h3 className="mt-1 text-[13px] font-semibold text-[#29493c]">{item.opportunity.title}</h3><p className="mt-1 text-[9px] text-[#748079]">Atualizado em {new Date(item.relationship.updatedAt).toLocaleDateString("pt-BR")}</p></div><OpportunityObjectiveSelector value={item.relationship.objective} onChange={onObjectiveChange} onRemove={onRemove} align="end" className="min-w-44" /><Link href={`/explorar/${item.opportunity.id}`} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white px-4 text-[9px] font-semibold text-[#365247] no-underline">Ver oportunidade <ArrowRight size={11} /></Link></motion.article>;
}

function ChecklistSection({ projects }: { projects: JourneyPriority[] }) {
  return <section><SectionTitle eyebrow="Checklists" title="Continue daqui" description="Seu próximo passo em cada oportunidade ativa." />{projects.length > 0 ? <div className="grid gap-2.5">{projects.map((project) => { const progress = Math.min(100, Math.round((project.progress.completed / project.progress.total) * 100)); const remaining = Math.max(0, project.progress.total - project.progress.completed); return <motion.article whileHover={{ y: -1 }} className="flex min-h-[82px] flex-col gap-4 rounded-[18px] border border-[#d8e1dc] bg-[#eef4f1] px-5 py-4 transition-shadow hover:shadow-[0_10px_24px_rgba(28,54,43,.055)] sm:flex-row sm:items-center" key={project.opportunity.id}><span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-white text-[#078166]"><FileCheck2 size={17} /></span><div className="min-w-0 flex-1"><span className="text-[8px] font-bold uppercase tracking-[.11em] text-[#78857e]">{project.opportunity.title}</span><h3 className="mt-1 text-[12px] font-semibold text-[#29493c]">{project.nextAction}</h3></div><div className="w-full sm:w-52"><div className="flex justify-between text-[8px] text-[#78857e]"><span>{remaining === 0 ? "Preparação concluída" : remaining === 1 ? "1 passo restante" : `${remaining} passos restantes`}</span><span>{project.actionEstimate ?? "≈ 5 minutos"}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white"><motion.i className="block h-full rounded-full bg-[#079272]" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: .65, ease: "easeOut" }} /></div></div><Link href={`/explorar/${project.opportunity.id}`} className="inline-flex min-h-9 items-center justify-center gap-1 rounded-full bg-white px-4 text-[9px] font-semibold text-[#078166] no-underline transition hover:shadow-sm">Continuar <ArrowRight size={11} /></Link></motion.article>; })}</div> : <p className="rounded-[18px] border border-[#d8e1dc] bg-white px-5 py-4 text-[10px] text-[#69766f]">Tudo concluído por aqui. Seu plano será atualizado quando surgir uma nova etapa.</p>}</section>;
}

type WorkspaceSection = "trajectory" | "checklists" | "activity" | "history";

const workspaceSections: { id: WorkspaceSection; label: string; description: string; icon: typeof Route }[] = [
  { id: "trajectory", label: "Minha trajetória", description: "Continue de onde parou", icon: Route },
  { id: "checklists", label: "Checklists", description: "Seus próximos passos", icon: ListChecks },
  { id: "activity", label: "Atividades", description: "O que mudou no caminho", icon: ActivityIcon },
  { id: "history", label: "Histórico", description: "Conquistas e ciclos encerrados", icon: History },
];

function JourneyWorkspace({ plan, onObjectiveChange, onRemove }: { plan: ReturnType<typeof createJourneyPlan>; onObjectiveChange: (opportunityId: number, objective: OpportunityObjective) => void; onRemove: (opportunityId: number) => void }) {
  const [activeSection, setActiveSection] = useState<WorkspaceSection>("trajectory");
  const selectSection = useCallback((section: WorkspaceSection) => {
    setActiveSection(section);
    window.requestAnimationFrame(() => {
      document.getElementById("journey-workspace")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  const panels: Record<WorkspaceSection, React.ReactNode> = {
    trajectory: <section><SectionTitle eyebrow="Em movimento" title="Minha trajetória" description="Continue de onde parou e veja o próximo passo de cada oportunidade." aside={<Link href="/explorar" className="hidden items-center gap-1 text-[10px] font-semibold text-[#078166] no-underline sm:inline-flex">Adicionar oportunidade <ArrowRight size={12} /></Link>} /><div><h3 className="text-[11px] font-bold uppercase tracking-[.13em] text-[#456156]">Oportunidades ativas</h3>{plan.projects.length > 0 ? <motion.div layout className="mt-4 grid gap-3"><AnimatePresence mode="popLayout">{plan.projects.map((project) => <OpportunityProfileRow project={project} onObjectiveChange={(objective) => onObjectiveChange(project.opportunity.id, objective)} onRemove={() => onRemove(project.opportunity.id)} key={project.opportunity.id} />)}</AnimatePresence></motion.div> : <div className="mt-4 flex min-h-[76px] items-center gap-4 rounded-[18px] border border-dashed border-[#c9d4ce] bg-white px-5"><span className="grid size-10 place-items-center rounded-[14px] bg-[#edf7f2] text-[#078166]"><Compass size={17} /></span><div><h4 className="text-[11px] font-semibold text-[#29493c]">Nenhuma candidatura ativa.</h4><p className="mt-1 text-[9px] text-[#748079]">Quando você decidir se candidatar, o primeiro passo aparecerá aqui.</p></div></div>}</div><div className="mt-8 border-t border-[#e0e6e3] pt-7"><div className="flex items-end justify-between gap-4"><div><h3 className="text-[11px] font-bold uppercase tracking-[.13em] text-[#66756e]">Continue acompanhando</h3></div><span className="rounded-full bg-[#edf1ef] px-2.5 py-1 text-[8px] font-semibold text-[#6c7973]">{plan.observing.length}</span></div>{plan.observing.length > 0 ? <motion.div layout className="mt-4 grid gap-2.5"><AnimatePresence mode="popLayout">{plan.observing.map((project) => <ObservingOpportunityRow project={project} onObjectiveChange={(objective) => onObjectiveChange(project.opportunity.id, objective)} onRemove={() => onRemove(project.opportunity.id)} key={project.opportunity.id} />)}</AnimatePresence></motion.div> : <p className="mt-4 rounded-[16px] bg-[#f2f5f3] px-4 py-3 text-[9px] text-[#748079]">Nenhuma oportunidade sendo acompanhada no momento.</p>}</div></section>,
    checklists: <ChecklistSection projects={plan.projects} />,
    activity: <div><ActivityFeed updates={plan.updates} /><div className="mt-8"><CommunityPanel plan={plan} /></div></div>,
    history: <section><SectionTitle eyebrow="Histórico" title="Conquistas" description="Oportunidades que já encerraram seu ciclo ativo — com qualquer resultado." />{plan.accomplishments.length > 0 ? <motion.div layout className="grid gap-2.5"><AnimatePresence mode="popLayout">{plan.accomplishments.map((item) => <AccomplishmentCard item={item} onObjectiveChange={(objective) => onObjectiveChange(item.opportunity.id, objective)} onRemove={() => onRemove(item.opportunity.id)} key={item.opportunity.id} />)}</AnimatePresence></motion.div> : <div className="flex min-h-[76px] items-center gap-4 rounded-[18px] border border-[#d8e1dc] bg-white px-5"><span className="grid size-10 place-items-center rounded-[14px] bg-[#f1f5f3] text-[#6c7973]"><Target size={16} /></span><p className="text-[10px] text-[#69766f]">Oportunidades aprovadas, recusadas ou concluídas aparecerão aqui.</p></div>}</section>,
  };

  return <section id="journey-workspace" className="mt-10 scroll-mt-16 border-y border-[#d9e2dd] bg-[#edf2ef] py-5 sm:scroll-mt-20 sm:py-8"><div className="mx-auto grid w-[min(1180px,calc(100%-40px))] gap-5 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8"><aside className="sticky top-[64px] z-20 -mx-5 overflow-x-auto border-y border-[#d8e1dc] bg-[#f7f9f7]/95 px-5 py-3 backdrop-blur-xl lg:top-[88px] lg:mx-0 lg:self-start lg:overflow-visible lg:rounded-[22px] lg:border lg:bg-white lg:p-3" aria-label="Áreas da sua Jornada"><nav className="flex min-w-max gap-2 lg:grid lg:min-w-0">{workspaceSections.map(({ id, label, description, icon: Icon }) => { const active = activeSection === id; return <button type="button" onClick={() => selectSection(id)} aria-controls="journey-workspace-panel" aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-[16px] px-3 py-3 text-left transition-all lg:w-full ${active ? "bg-[#e7f5ef] text-[#06735b] shadow-[inset_0_0_0_1px_rgba(7,146,114,.06)]" : "text-[#68756f] hover:bg-[#f1f5f2] hover:text-[#29493c]"}`} key={id}><span className={`grid size-9 shrink-0 place-items-center rounded-[12px] ${active ? "bg-white text-[#079272] shadow-sm" : "bg-[#eef2f0] text-[#627169]"}`}><Icon size={18} /></span><span><strong className="block text-[11px] font-semibold">{label}</strong><small className="mt-0.5 hidden text-[8px] leading-4 opacity-70 lg:block">{description}</small></span></button>; })}</nav></aside><div id="journey-workspace-panel" className="min-h-[420px] rounded-[24px] border border-[#d8e1dc] bg-[#f9faf9] p-5 shadow-[0_12px_34px_rgba(28,54,43,.045)] sm:p-7"><AnimatePresence mode="wait" initial={false}><motion.div key={activeSection} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: .18 }}>{panels[activeSection]}</motion.div></AnimatePresence></div></div></section>;
}

function AnonymousJourneyState({ onWhatsApp, onGoogle }: { onWhatsApp: () => void; onGoogle: () => void }) {
  return <section className="relative overflow-hidden bg-[#f3f7f4] py-16 sm:py-24"><div className="absolute right-[8%] top-8 size-64 rounded-full bg-[#079272]/8 blur-3xl" /><div className="relative mx-auto grid w-[min(920px,calc(100%-40px))] gap-10 rounded-[30px] border border-[#d4e1da] bg-white p-7 shadow-[0_24px_70px_rgba(28,54,43,.09)] md:grid-cols-[1fr_.72fr] md:p-10"><div><span className="grid size-12 place-items-center rounded-[17px] bg-[#e9f7f1] text-[#078166]"><Bookmark size={21} /></span><h1 className="mt-7 text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-.06em] text-[#17372b]">Sua jornada ainda não está salva.</h1><p className="mt-5 max-w-xl text-[13px] leading-7 text-[#66736d]">Conecte sua Jornada para acompanhar oportunidades, progresso, lembretes e notificações — e continuar exatamente de onde parou em qualquer dispositivo.</p><div className="mt-6 grid gap-2 text-[10px] text-[#456156] sm:grid-cols-2"><span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#078166]" />Seu progresso local será preservado</span><span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#078166]" />Seu Coach mantém o contexto</span><span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#078166]" />Lembretes antes dos prazos</span><span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#078166]" />Continuidade entre dispositivos</span></div></div><div className="flex flex-col justify-center rounded-[22px] border border-[#dbe5e0] bg-[#f7faf8] p-5"><span className="text-[9px] font-bold uppercase tracking-[.13em] text-[#078166]">Salvar e continuar</span><button type="button" onClick={onWhatsApp} className="mt-5 flex min-h-13 items-center gap-3 rounded-[15px] bg-[#079272] px-4 text-[11px] font-semibold shadow-[0_10px_24px_rgba(7,146,114,.16)]" style={{ color: "#fff" }}><span className="grid size-8 place-items-center rounded-xl bg-white/12"><MessageCircle size={17} /></span>Continuar com WhatsApp <ArrowRight size={14} className="ml-auto" /></button><button type="button" onClick={onGoogle} className="mt-2.5 flex min-h-13 items-center gap-3 rounded-[15px] border border-[#d8e0dc] bg-white px-4 text-[11px] font-semibold text-[#365247]"><span className="grid size-8 place-items-center rounded-xl bg-[#f1f4f2] text-sm font-bold text-[#4285f4]">G</span>Continuar com Google <ArrowRight size={14} className="ml-auto" /></button><p className="mt-5 text-center text-[8px] leading-4 text-[#8b9590]">Sem senha. Você poderá conectar os dois métodos depois.</p></div></div></section>;
}

function CommunityPanel({ plan }: { plan: ReturnType<typeof createJourneyPlan> }) {
  const whatsappUrl = process.env.NEXT_PUBLIC_SECONNECTA_WHATSAPP_COMMUNITY_URL ?? "https://chat.whatsapp.com/";
  return <ComingSoon
    className="min-h-[360px] rounded-[24px]"
    message="Enquanto preparamos a Comunidade, converse com estudantes no grupo oficial da seConecta."
    action={<a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#079272] px-5 text-[10px] font-semibold text-white no-underline"><MessageCircle size={14} />Entrar no grupo do WhatsApp</a>}
  ><section id="comunidade" className="rounded-[24px] border border-[#d8e1dc] bg-white p-6 shadow-[0_10px_30px_rgba(28,54,43,.045)]"><SectionTitle eyebrow="Comunidade" title="Pessoas fazendo essa oportunidade" description="Avanços e dúvidas recentes de quem está no mesmo caminho." /><div className="mb-4 flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf7f2] px-3 py-1.5 text-[9px] font-semibold text-[#08745d]"><i className="size-1.5 rounded-full bg-[#18a47f]" />8 estudantes preparando agora</span><span className="relative inline-flex items-center rounded-full bg-[#f2f5f3] px-3 py-1.5 text-[9px] font-semibold text-[#607068]"><span className="blur-[1.5px] opacity-50">Aprovados disponíveis</span><small className="absolute inset-0 grid place-items-center text-[6px] font-bold uppercase tracking-wide">Em breve</small></span></div>{plan.communityActivity.length > 0 ? <div className="divide-y divide-[#e7ece9]">{plan.communityActivity.map((activity) => <div className="flex gap-3 py-4 first:pt-0 last:pb-0" key={activity.id}><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eaf3ef] text-[9px] font-bold text-[#47665a]">{activity.initials}</span><div className="min-w-0 flex-1"><p className="text-[11px] leading-5 text-[#52615a]"><strong className="text-[#29493c]">{activity.person}</strong> {activity.text}.</p><div className="mt-1.5 flex items-center gap-3"><time className="text-[8px] text-[#929b97]">{activity.timestamp}</time><Link href={`/comunidade?oportunidade=${activity.opportunityId}`} className="text-[9px] font-semibold text-[#078166] no-underline hover:underline">{activity.actionLabel}</Link></div></div></div>)}</div> : <div className="rounded-2xl bg-[#f3f7f4] p-4"><p className="text-[11px] leading-5 text-[#607068]">Quando você acompanhar uma oportunidade, encontrará aqui estudantes e mentores relacionados a ela.</p><Link href="/comunidade" className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-[#078166] no-underline">Conhecer a comunidade <ArrowRight size={12} /></Link></div>}</section></ComingSoon>;
}

function MomentumCard({ messages }: { messages: string[] }) {
  return <article className="rounded-[22px] border border-[#cfe2d9] bg-[#edf7f2] p-6 transition-shadow hover:shadow-[0_12px_28px_rgba(28,54,43,.055)]"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-white text-[#078166]"><Target size={16} /></span><div><span className="text-[9px] font-bold uppercase tracking-[.13em] text-[#078166]">Seu movimento</span><h2 className="mt-0.5 text-lg font-semibold tracking-[-.035em] text-[#17372b]">Você está avançando</h2></div></div><div className="mt-5 grid gap-2">{messages.map((message, index) => <motion.p initial={{ opacity: 0, x: -5 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * .08 }} className="flex items-start gap-2 text-[11px] leading-5 text-[#456156]" key={message}><motion.span initial={{ scale: .7 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: index * .08, type: "spring", stiffness: 260 }}><Check size={14} className="mt-0.5 shrink-0 text-[#078166]" /></motion.span>{message}</motion.p>)}</div></article>;
}

export function JourneyPage() {
  const { ready: authenticationReady, isAuthenticated, openAuthentication } = useAuthentication();
  const { journeys, updateJourneyObjective, removeJourney } = useOpportunityJourney();
  const { profile } = useJourneyOnboarding();
  const plan = useMemo(() => createJourneyPlan(journeys, profile), [journeys, profile]);
  const [profileExtension, setProfileExtension] = useState<JourneyProfileExtension>({});
  const [profileExtensionReady, setProfileExtensionReady] = useState(false);

  useEffect(() => {
    setProfileExtension(loadJourneyProfileExtension());
    setProfileExtensionReady(true);
    const updateProfileExtension = (event: Event) => {
      setProfileExtension((event as CustomEvent<JourneyProfileExtension>).detail);
    };
    window.addEventListener(PROFILE_EXTENSION_UPDATED_EVENT, updateProfileExtension);
    return () => window.removeEventListener(PROFILE_EXTENSION_UPDATED_EVENT, updateProfileExtension);
  }, []);

  if (!authenticationReady) return <main className="min-h-screen bg-[#f4f7f5]"><SiteHeader /><OpportunityWorkspaceNav active="journey" /><div className="mx-auto mt-16 h-56 w-[min(920px,calc(100%-40px))] animate-pulse rounded-[28px] bg-[#e7eeea]" /></main>;

  if (!isAuthenticated) return <main className="min-h-screen bg-[#f4f7f5] font-[family-name:var(--font-poppins)]"><SiteHeader /><OpportunityWorkspaceNav active="journey" /><AnonymousJourneyState onWhatsApp={() => openAuthentication("journey", undefined, "whatsapp")} onGoogle={() => openAuthentication("journey", undefined, "google")} /></main>;

  return <main className="min-h-screen bg-[#f4f7f5] font-[family-name:var(--font-poppins)] text-[#17372b]">
    <SiteHeader />
    <OpportunityWorkspaceNav active="journey" />
    <CoachHero plan={plan} displayName={profileExtension.preferredName || profileExtension.firstName} />
    <div className="mx-auto grid w-[min(1180px,calc(100%-40px))] gap-4 py-6 empty:hidden sm:py-8">
      <CoachCheckIn plan={plan} />
      {profileExtensionReady && <ProfileUnlocks profile={profile} value={profileExtension} onChange={setProfileExtension} />}
    </div>

    <JourneyWorkspace plan={plan} onObjectiveChange={updateJourneyObjective} onRemove={removeJourney} />

    <div className="mx-auto w-[min(1180px,calc(100%-40px))] py-10">
      <motion.section {...reveal}><MomentumCard messages={plan.momentum} /></motion.section>
    </div>

    <JourneyHelpLayer plan={plan} />
    <footer className="border-t border-[#dce4e0] bg-white py-6 text-center text-[9px] text-[#89938e]">Sua Jornada usa dados locais nesta versão.</footer>
  </main>;
}
