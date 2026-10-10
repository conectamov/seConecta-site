"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  FileText,
  Gauge,
  Globe2,
  GraduationCap,
  Languages,
  LibraryBig,
  ListChecks,
  MapPin,
  MessageCircleQuestion,
  Monitor,
  Route,
  Rows3,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useOpportunityJourney } from "@/components/opportunity-journey-provider";
import {
  ApplicationProgress,
  getApplicationProgress,
  getJourneyProgressLabel,
} from "@/components/opportunity-detail/application-progress";
import { OpportunityGuide } from "@/components/opportunity-detail/opportunity-guide";
import { OpportunityMaterialsPanel } from "@/components/opportunity-detail/opportunity-materials-panel";
import { OpportunityObjectiveSelector } from "@/components/opportunity-objective-selector";
import { SidebarCTA, type SidebarCTAUserState } from "@/components/opportunity-detail/sidebar-cta";
import { OpportunityTimeline as OpportunityCycleTimeline } from "@/components/opportunity-detail/opportunity-timeline";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getOpportunityCanonicalPath } from "@/services/opportunity-seo-service";
import type { OpportunityDetail } from "@/types/opportunity-detail";
import type { OpportunityGuideDocument } from "@/types/opportunity-knowledge-hub";

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-70px" },
  transition: { duration: .45, ease: "easeOut" as const },
};

function opportunityHref(opportunity: OpportunityDetail["similar"][number]) {
  return opportunity.slug ? `/oportunidades/${opportunity.slug}` : `/explorar/${opportunity.id}`;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return <div className="mb-8 max-w-2xl">
    <span className="mb-3 block text-[11px] font-bold uppercase tracking-[0.15em] text-[#079272]">{eyebrow}</span>
    <h2 className="text-[clamp(1.8rem,4vw,2.65rem)] font-semibold leading-[1.08] tracking-[-0.045em] text-[#1c372c]">{title}</h2>
    {description && <p className="mt-4 max-w-xl text-sm leading-7 text-[#69756f]">{description}</p>}
  </div>;
}

function OpportunityActions({ opportunity, inverse = false }: { opportunity: OpportunityDetail; inverse?: boolean }) {
  const { getJourney, participate, updateJourneyObjective, removeJourney, visitOfficialPage } = useOpportunityJourney();
  const journey = getJourney(opportunity.id);
  const opportunityRef = { id: opportunity.id, title: opportunity.title, officialUrl: opportunity.officialUrl };
  const officialLinkClass = inverse
    ? "inline-flex h-13 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/8 px-6 text-sm font-semibold text-white no-underline transition-all hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/14"
    : "inline-flex h-13 items-center justify-center gap-2 rounded-full border border-[#dfe5e1] bg-white px-6 text-sm font-semibold text-[#1c372c] no-underline transition-all hover:-translate-y-0.5 hover:border-[#079272]/30 hover:bg-[#f4faf7]";
  const officialLink = <a href={opportunity.officialUrl} target="_blank" rel="noopener noreferrer" className={officialLinkClass} onClick={() => visitOfficialPage(opportunityRef)}>Site oficial <ExternalLink size={16} /></a>;

  if (journey) return <div className="flex flex-wrap items-center gap-3">
    <div className="min-w-[220px]">
      <OpportunityObjectiveSelector value={journey.objective} onChange={(objective) => updateJourneyObjective(opportunity.id, objective)} onRemove={() => removeJourney(opportunity.id)} inverse={inverse} />
    </div>
    {officialLink}
  </div>;

  if (opportunity.applicationStatus !== "open") return officialLink;

  return <div className="flex flex-wrap gap-3">
    <Button size="lg" className={inverse ? "bg-white text-[#056e57] hover:bg-[#f1faf6]" : ""} onClick={() => participate(opportunityRef)}>Participar <ArrowRight size={17} /></Button>
    {officialLink}
  </div>;
}

function JourneySidebarCTA({ opportunity }: { opportunity: OpportunityDetail }) {
  const { getJourney, participate, followOpportunity, updateJourneyObjective, removeJourney, visitOfficialPage } = useOpportunityJourney();
  const journey = getJourney(opportunity.id);
  const opportunityRef = { id: opportunity.id, title: opportunity.title, officialUrl: opportunity.officialUrl };

  if (journey) return <div className="grid gap-3">
    <div>
      <label className="mb-2 block text-[9px] font-bold uppercase tracking-[.1em] text-[#78857e]">Meu objetivo</label>
      <OpportunityObjectiveSelector value={journey.objective} onChange={(objective) => updateJourneyObjective(opportunity.id, objective)} onRemove={() => removeJourney(opportunity.id)} className="w-full" align="end" />
    </div>
    <a href={opportunity.officialUrl} target="_blank" rel="noopener noreferrer" onClick={() => visitOfficialPage(opportunityRef)} className="flex h-11 w-full items-center justify-center gap-2 rounded-[15px] border border-[#dfe5e1] bg-white/75 px-4 text-sm font-semibold text-[#355247] no-underline transition-all duration-200 hover:border-[#079272]/30 hover:bg-[#f4faf7] hover:text-[#056e57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#079272]/35">Site oficial <ExternalLink size={15} /></a>
  </div>;

  const userState: SidebarCTAUserState = "exploring";
  const daysLeft = Number(opportunity.deadlineNote.match(/(\d+)\s+dias/i)?.[1]);

  return <SidebarCTA
    isOpen={opportunity.applicationStatus === "open"}
    userState={userState}
    daysLeft={Number.isFinite(daysLeft) ? daysLeft : undefined}
    officialSiteUrl={opportunity.officialUrl}
    onPrimaryAction={(nextState) => {
      if (nextState === "added" && userState === "exploring") participate(opportunityRef);
      if (nextState === "watchlist" && userState === "exploring") followOpportunity(opportunityRef);
    }}
  />;
}

function OpportunityFactRail({ opportunity }: { opportunity: OpportunityDetail }) {
  const lookup = (label: string) => opportunity.overview.find((item) => item.label === label)?.value ?? "—";
  const isInternational = /internacional|portugal|global|exterior/i.test(opportunity.location);
  const facts = [
    { label: "Prazo", value: opportunity.deadline, icon: CalendarDays, tone: "text-[#b35a42]" },
    { label: "Alcance", value: isInternational ? "Internacional" : "Nacional", icon: Globe2, tone: "text-[#4e78aa]" },
    { label: "Bolsa", value: lookup("Bolsa"), icon: CircleDollarSign, tone: "text-[#079272]" },
    { label: "Nível", value: opportunity.educationLevel, icon: GraduationCap, tone: "text-[#7967d8]" },
    { label: "Preparação", value: lookup("Preparação"), icon: Clock3, tone: "text-[#b87824]" },
    { label: "Concorrência", value: opportunity.competitiveness, icon: Gauge, tone: "text-[#079272]" },
  ];

  return <div className="mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">{facts.map(({ label, value, icon: Icon, tone }) => <div className="group rounded-[17px] border border-white/90 bg-white/80 px-4 py-4 shadow-[0_10px_26px_rgba(28,54,43,.045)] transition-transform duration-200 hover:-translate-y-0.5" key={label}><span className="grid size-9 place-items-center rounded-xl bg-[#f2f6f3]"><Icon size={19} strokeWidth={2} className={tone} /></span><span className="mt-3 block text-[9px] font-bold uppercase tracking-[.1em] text-[#7d8882]">{label}</span><strong className="mt-1 block text-xs leading-4 text-[#1c372c]">{value}</strong></div>)}</div>;
}

export function OpportunityHero({ opportunity }: { opportunity: OpportunityDetail }) {
  return <section className="relative overflow-visible border-b border-[#dfe5e1] bg-[radial-gradient(circle_at_80%_10%,rgba(2,109,240,.10),transparent_32%),radial-gradient(circle_at_15%_80%,rgba(11,196,182,.12),transparent_32%),#f8faf7]">
    <div className="relative z-10 mx-auto grid w-[min(1160px,calc(100%-48px))] gap-9 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-end">
      <div>
        <Link href="/explorar" className="mb-7 inline-flex items-center gap-2 text-xs font-semibold text-[#52615a] no-underline hover:text-[#079272]"><ArrowLeft size={15} /> Voltar para oportunidades</Link>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <span className="rounded-full bg-[#e9e8fb] px-3 py-1.5 text-[#6555b5]">{opportunity.type}</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#dfe5e1] bg-white/70 px-3 py-1.5 text-[#52615a]">{opportunity.organizationLogo && <Image className="size-4 rounded object-contain" src={opportunity.organizationLogo} alt="" width={16} height={16} />}{opportunity.organization}</span>
        </div>
        <h1 className="max-w-4xl text-[clamp(2.35rem,5vw,4rem)] font-semibold leading-[1.01] tracking-[-0.06em] text-[#18372b]">{opportunity.title}</h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-[#52615a] md:text-base">{opportunity.summary}</p>
        <div className="mt-6 flex items-center gap-2 text-xs font-medium text-[#52615a]"><MapPin size={16} className="text-[#079272]" />{opportunity.location}</div>
        <OpportunityFactRail opportunity={opportunity} />
      </div>

      <aside className={`overflow-visible rounded-[24px] border border-white/80 bg-white/90 shadow-[0_20px_55px_rgba(27,63,49,.10)] backdrop-blur ${opportunity.coverImage ? "p-2" : "p-5"}`} aria-label="Imagem, prazo e ações da oportunidade">
        {opportunity.coverImage && <figure className="relative aspect-[16/10] overflow-hidden rounded-[19px] bg-[#e8eeeb]">
          <Image src={opportunity.coverImage} alt={`Estudantes participando de ${opportunity.title}`} fill priority sizes="(min-width: 1024px) 294px, calc(100vw - 64px)" className="object-cover" />
        </figure>}
        <div className={opportunity.coverImage ? "px-3 pb-3 pt-5" : ""}>
          <span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#b35a42]">Prazo de inscrição</span>
          <strong className="mt-2 block text-2xl tracking-[-.04em] text-[#1c372c]">{opportunity.deadline}</strong>
          <p className="mt-1 flex items-center gap-2 text-xs font-medium text-[#b35a42]"><Clock3 size={14} /> {opportunity.deadlineNote}</p>
          <div className="my-5 h-px bg-[#e7ebe8]" />
          <p className="mb-5 text-xs leading-6 text-[#69756f]">{opportunity.fitSummary}</p>
          <div className="hidden md:block"><OpportunityActions opportunity={opportunity} /></div>
        </div>
      </aside>
    </div>
  </section>;
}

export function OpportunitySectionNav() {
  const links = [["visao-geral", "Visão geral"], ["requisitos", "O que você precisa"], ["trajetoria", "Trajetória"], ["orientacao", "Orientação"], ["materiais", "Materiais"]];
  return <nav className="sticky top-[72px] z-30 overflow-x-auto border-b border-[#dfe5e1] bg-[#fafbf9]/92 backdrop-blur-xl" aria-label="Nesta oportunidade">
    <div className="mx-auto flex w-[min(1160px,calc(100%-48px))] min-w-max gap-7 py-4">
      {links.map(([id, label]) => <a className="text-[11px] font-semibold text-[#69756f] no-underline transition-colors hover:text-[#079272]" href={`#${id}`} key={id}>{label}</a>)}
    </div>
  </nav>;
}

export function RecommendationReasons({ reasons }: { reasons: string[] }) {
  return <motion.section {...reveal} className="mx-auto w-[min(1160px,calc(100%-48px))] py-12" aria-labelledby="recommendation-title">
    <div className="flex flex-col justify-between gap-5 rounded-[22px] border border-[#dfe5e1] bg-white px-6 py-5 md:flex-row md:items-center">
      <div><span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#7967d8]">Por que apareceu para você</span><h2 id="recommendation-title" className="mt-1 text-base font-semibold tracking-[-.025em] text-[#1c372c]">Combina com interesses que você indicou.</h2></div>
      <div className="flex flex-wrap items-center gap-2">{reasons.map((reason) => <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f3f4f1] px-3 py-2 text-[10px] font-semibold text-[#52615a]" key={reason}><Check size={13} className="text-[#079272]" />{reason}</span>)}</div>
      <button className="flex shrink-0 items-center gap-1 border-0 bg-transparent text-[10px] font-semibold text-[#52615a] underline decoration-[#b8c0bb] underline-offset-4" type="button" title="As recomendações usam seus interesses, objetivo e etapa de ensino."><MessageCircleQuestion size={14} /> Como funciona</button>
    </div>
  </motion.section>;
}

const overviewIcons = [Clock3, MapPin, Languages, Monitor, CircleDollarSign, Star, Gauge, BookOpenCheck];

export function QuickOverview({ items }: { items: OpportunityDetail["overview"] }) {
  return <motion.section {...reveal} id="visao-geral" className="scroll-mt-36 border-y border-[#e5e9e6] bg-white py-20">
    <div className="mx-auto w-[min(1160px,calc(100%-48px))]">
      <SectionHeading eyebrow="Fatos da oportunidade" title="O essencial, sem letras pequenas." description="Informações objetivas para você entender rapidamente o compromisso envolvido." />
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[24px] border border-[#dfe5e1] bg-[#dfe5e1] md:grid-cols-4">
        {items.map((item, index) => { const Icon = overviewIcons[index] ?? Check; return <div className="min-h-36 bg-white p-5 md:p-6" key={item.label}><Icon size={19} className="mb-7 text-[#079272]" /><span className="block text-[10px] font-bold uppercase tracking-[.12em] text-[#8a948f]">{item.label}</span><strong className="mt-2 block text-lg font-semibold tracking-[-.03em] text-[#1c372c]">{item.value}</strong>{item.detail && <small className="mt-1 block text-[10px] leading-5 text-[#69756f]">{item.detail}</small>}</div>; })}
      </div>
    </div>
  </motion.section>;
}

export function RequirementsChecklist({ requirements }: { requirements: OpportunityDetail["requirements"] }) {
  const requiredCount = requirements.filter((item) => item.required).length;
  return <motion.section {...reveal} id="requisitos" className="scroll-mt-36 py-24">
    <div className="mx-auto grid w-[min(1160px,calc(100%-48px))] gap-10 lg:grid-cols-[.72fr_1.28fr]">
      <div><SectionHeading eyebrow="O que você vai precisar" title="Veja o esforço antes de decidir." description="Nenhum requisito isolado é complicado, mas os itens obrigatórios pedem organização." /><div className="inline-flex items-center gap-3 rounded-2xl bg-[#fff4e7] px-4 py-3 text-xs text-[#8c5b25]"><FileText size={18} /><span><strong className="block">{requiredCount} itens obrigatórios</strong>Preparação estimada: 8–12 horas</span></div></div>
      <Card className="shadow-[0_18px_55px_rgba(28,54,43,.06)]"><CardContent className="divide-y divide-[#e7ebe8] p-2 md:p-4">{requirements.map((item) => <div className="flex gap-4 p-4" key={item.label}><span className={item.required ? "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#eaf8f2] text-[#079272]" : "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#f1f2ef] text-[#7f8984]"}><Check size={15} /></span><div><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-[#1c372c]">{item.label}</strong><span className={item.required ? "rounded-full bg-[#eef7f3] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#057259]" : "rounded-full bg-[#f1f2ef] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#77817c]"}>{item.required ? "Obrigatório" : "Diferencial"}</span></div><p className="mt-1 text-xs leading-5 text-[#69756f]">{item.detail}</p></div></div>)}</CardContent></Card>
    </div>
  </motion.section>;
}

export function TrajectoryMap({ steps }: { steps: OpportunityDetail["trajectory"] }) {
  return <motion.section {...reveal} id="trajetoria" className="scroll-mt-36 overflow-hidden bg-[#173b30] py-24 text-white">
    <div className="mx-auto w-[min(1160px,calc(100%-48px))]">
      <div className="mb-12 grid gap-5 md:grid-cols-[1fr_.7fr] md:items-end"><div><span className="mb-3 block text-[11px] font-bold uppercase tracking-[.15em] text-[#75dfc4]">Mapa de trajetória</span><h2 className="max-w-2xl text-[clamp(2rem,5vw,3.7rem)] font-semibold leading-[1.04] tracking-[-.055em]">Esta oportunidade não existe isolada.</h2></div><p className="max-w-md text-sm leading-7 text-white/65">Ela pode funcionar como uma ponte entre seu interesse atual e experiências mais avançadas.</p></div>
      <div className="grid gap-3 md:grid-cols-4">{steps.map((step, index) => <div className="relative" key={step.label}><div className={step.active ? "min-h-44 rounded-[22px] border border-[#65d6b8]/60 bg-[#079272] p-5 shadow-[0_18px_45px_rgba(0,0,0,.18)]" : "min-h-44 rounded-[22px] border border-white/12 bg-white/[.06] p-5"}><span className="text-[10px] font-bold text-white/45">0{index + 1}</span><Route size={19} className={step.active ? "my-5 text-white" : "my-5 text-[#75dfc4]"} /><strong className="block text-sm leading-5">{step.label}</strong><small className="mt-2 block text-[10px] text-white/55">{step.context}</small></div>{index < steps.length - 1 && <ArrowRight className="absolute -right-5 top-1/2 z-10 hidden text-[#75dfc4] md:block" size={26} />}</div>)}</div>
      <p className="mt-7 text-[10px] leading-5 text-white/45">Este mapa mostra caminhos comuns, não uma sequência obrigatória. Sua trajetória pode começar ou mudar em qualquer ponto.</p>
    </div>
  </motion.section>;
}

export function AIGuidance({ guidance }: { guidance: OpportunityDetail["guidance"] }) {
  return <motion.section {...reveal} id="orientacao" className="scroll-mt-36 py-24">
    <div className="mx-auto grid w-[min(1160px,calc(100%-48px))] gap-8 lg:grid-cols-[.65fr_1.35fr]">
      <SectionHeading eyebrow="Orientação personalizada" title="O que um mentor diria agora." description="Uma leitura do seu perfil combinada com o esforço e o prazo desta oportunidade." />
      <div className="relative overflow-hidden rounded-[28px] border border-[#cfe5db] bg-[linear-gradient(135deg,#eef9f4_0%,#f4f3ff_100%)] p-7 md:p-10">
        <Sparkles className="absolute right-7 top-7 text-[#7967d8]/30" size={34} />
        <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#6555b5]"><Sparkles size={13} /> Orientação simulada</span>
        <h3 className="mt-7 text-2xl font-semibold tracking-[-.04em] text-[#1c372c]">{guidance.title}</h3>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#52615a]">{guidance.body}</p>
        <div className="mt-7 grid gap-3">{guidance.actions.map((action, index) => <div className="flex gap-3 rounded-2xl bg-white/70 p-4" key={action}><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#079272] text-[10px] font-bold text-white">{index + 1}</span><p className="text-xs leading-6 text-[#365247]">{action}</p></div>)}</div>
        <p className="mt-5 text-[10px] leading-5 text-[#7a8580]">Orientação baseada nas preferências informadas no onboarding. Confirme requisitos no site oficial.</p>
      </div>
    </div>
  </motion.section>;
}

export function OpportunityTimeline({ timeline }: { timeline: OpportunityDetail["timeline"] }) {
  return <motion.section {...reveal} className="border-y border-[#e2e7e4] bg-white py-20">
    <div className="mx-auto w-[min(1160px,calc(100%-48px))]">
      <SectionHeading eyebrow="Calendário" title="O caminho até o início." description="Datas importantes para você não precisar reconstruir o cronograma sozinho." />
      <ol className="grid gap-0 md:grid-cols-5">{timeline.map((item, index) => <li className="relative flex gap-4 border-l border-[#dfe5e1] pb-7 pl-6 md:block md:border-l-0 md:border-t md:pb-0 md:pl-0 md:pt-7" key={item.label}><span className={item.current ? "absolute -left-[7px] top-0 size-[13px] rounded-full border-[3px] border-white bg-[#079272] ring-2 ring-[#079272]/25 md:-top-[7px] md:left-0" : "absolute -left-[5px] top-0 size-[9px] rounded-full bg-[#bdc6c1] md:-top-[5px] md:left-0"} /><div><time className={item.current ? "text-[10px] font-bold uppercase tracking-[.1em] text-[#079272]" : "text-[10px] font-bold uppercase tracking-[.1em] text-[#8a948f]"}>{item.date}</time><strong className="mt-2 block text-sm text-[#1c372c]">{item.label}</strong><small className="mt-1 block text-[10px] text-[#69756f]">{item.detail}</small></div></li>)}</ol>
    </div>
  </motion.section>;
}

export function PeopleWhoCanHelp({ people }: { people: OpportunityDetail["people"] }) {
  return <motion.section {...reveal} id="pessoas" className="scroll-mt-36 py-24">
    <div className="mx-auto w-[min(1160px,calc(100%-48px))]">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><SectionHeading eyebrow="Pessoas aceleram pessoas" title="Você não precisa descobrir tudo sozinho." description="Converse com quem já passou por esta oportunidade ou pode ajudar na preparação." /><span className="mb-8 inline-flex items-center gap-2 text-[10px] font-semibold text-[#69756f]"><Users size={15} className="text-[#079272]" /> 12 pessoas conectadas</span></div>
      <div className="grid gap-4 md:grid-cols-3">{people.map((person) => <Card className="overflow-hidden transition-transform duration-200 hover:-translate-y-1" key={person.name}><CardContent className="p-5"><div className="flex items-center gap-4"><Image className="size-14 rounded-2xl object-cover" src={person.image} alt={`Retrato de ${person.name}`} width={56} height={56} /><div><h3 className="text-sm font-semibold text-[#1c372c]">{person.name}</h3><p className="mt-1 text-[10px] font-medium text-[#079272]">{person.role}</p></div></div><p className="my-5 min-h-10 text-xs leading-5 text-[#69756f]">{person.journey}</p><Link href={`/historias#${person.name.toLowerCase().replaceAll(" ", "-")}`} className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#1c372c] no-underline hover:text-[#079272]">Ver trajetória <ArrowRight size={14} /></Link></CardContent></Card>)}</div>
    </div>
  </motion.section>;
}

export function StudentJourneys({ journeys }: { journeys: OpportunityDetail["studentJourneys"] }) {
  return <motion.section {...reveal} className="bg-[#f1f5f2] py-24">
    <div className="mx-auto w-[min(1160px,calc(100%-48px))]">
      <SectionHeading eyebrow="Trajetórias reais" title="Veja transformação, não depoimentos." description="Do ponto de partida ao próximo caminho que se abriu." />
      <div className="grid gap-5 lg:grid-cols-2">{journeys.map((journey) => <Card className="p-2" key={journey.name}><CardContent className="grid gap-6 p-5 sm:grid-cols-[130px_1fr]"><div><Image className="aspect-[4/5] w-full rounded-[18px] object-cover" src={journey.image} alt={`Retrato de ${journey.name}`} width={180} height={225} /><strong className="mt-3 block text-sm text-[#1c372c]">{journey.name}</strong><small className="mt-1 block text-[9px] leading-4 text-[#69756f]">{journey.location}</small></div><ol className="grid content-center">{journey.steps.map((step, index) => <li className="relative flex min-h-14 items-center gap-3 border-l border-[#cdd8d2] pl-5 text-xs font-medium text-[#365247] last:border-transparent" key={step}><span className={index === 1 ? "absolute -left-[7px] grid size-[13px] place-items-center rounded-full bg-[#079272] ring-4 ring-[#eaf8f2]" : "absolute -left-[4px] size-[7px] rounded-full bg-[#aebbb5]"} />{step}</li>)}</ol></CardContent></Card>)}</div>
    </div>
  </motion.section>;
}

export function SimilarOpportunities({ opportunities }: { opportunities: OpportunityDetail["similar"] }) {
  return <motion.section {...reveal} className="py-24">
    <div className="mx-auto w-[min(1160px,calc(100%-48px))]">
      <SectionHeading eyebrow="Continue explorando" title="Se esta oportunidade chamou sua atenção..." description="Estas opções compartilham temas, nível de ensino ou formato — não são recomendações aleatórias." />
      <div className="grid gap-4 md:grid-cols-3">{opportunities.map((item) => <Link href={opportunityHref(item)} className="group rounded-[22px] border border-[#dfe5e1] bg-white p-6 no-underline transition-all hover:-translate-y-1 hover:border-[#079272]/25 hover:shadow-[0_18px_40px_rgba(28,54,43,.07)]" key={item.id}><span className="text-[10px] font-bold uppercase tracking-[.1em] text-[#7967d8]">{item.type}</span><h3 className="mt-4 min-h-14 text-lg font-semibold leading-6 tracking-[-.035em] text-[#1c372c]">{item.title}</h3><p className="mt-4 text-xs leading-5 text-[#69756f]">{item.fit}</p><div className="mt-6 flex items-center justify-between border-t border-[#e7ebe8] pt-4 text-[10px] font-semibold text-[#52615a]"><span>{item.deadline}</span><ArrowRight className="transition-transform group-hover:translate-x-1" size={16} /></div></Link>)}</div>
    </div>
  </motion.section>;
}

type DetailSectionId = "overview" | "application" | "requirements" | "guide" | "materials";

const detailSections: { id: DetailSectionId; label: string; description: string; icon: typeof Rows3 }[] = [
  { id: "overview", label: "Visão geral", description: "Fatos e compatibilidade", icon: Rows3 },
  { id: "application", label: "Minha candidatura", description: "Progresso e checklist", icon: ListChecks },
  { id: "requirements", label: "Requisitos", description: "O que preparar", icon: BookOpenCheck },
  { id: "guide", label: "Guia", description: "Conhecimento organizado", icon: FileText },
  { id: "materials", label: "Materiais", description: "Referências para avançar", icon: LibraryBig },
];

function PanelHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header className="mb-7 border-b border-[#e5e9e6] pb-6"><span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#079272]">{eyebrow}</span><h2 className="mt-2 text-[clamp(1.65rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-.045em] text-[#1c372c]">{title}</h2><p className="mt-2 max-w-2xl text-xs leading-6 text-[#69756f]">{description}</p></header>;
}

function OverviewPanel({ opportunity, journey, onOpenApplication }: { opportunity: OpportunityDetail; journey?: ReturnType<typeof useOpportunityJourney>["journeys"][number]; onOpenApplication: () => void }) {
  const metadataCurrentStep = opportunity.timeline.findIndex((item) => item.current);
  const currentStepIndex = opportunity.timeline.length === 0
    ? null
    : opportunity.applicationStatus === "closed"
      ? opportunity.timeline.length
      : opportunity.applicationStatus === "upcoming"
        ? -1
        : metadataCurrentStep >= 0 ? metadataCurrentStep : 0;
  return <div>
    <OpportunityCycleTimeline steps={opportunity.timeline.map((item) => ({ title: item.label, date: item.date, description: item.detail }))} currentStepIndex={currentStepIndex} />
    {journey && (journey.objective !== "following" || journey.applicationResult !== "pending") && <button type="button" onClick={onOpenApplication} className="mt-5 flex w-full flex-col gap-4 rounded-[20px] border border-[#bcded0] bg-[#edf8f3] p-5 text-left transition hover:border-[#92c7b3] hover:bg-[#e8f6f0] sm:flex-row sm:items-center">
      <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-white text-[#078166] shadow-sm"><ListChecks size={19} /></span>
      <span className="min-w-0 flex-1"><span className="text-[9px] font-bold uppercase tracking-[.12em] text-[#078166]">Sua candidatura</span><strong className="mt-1 block text-sm text-[#29493c]">{getJourneyProgressLabel(journey)}</strong><span className="mt-1 block text-[10px] text-[#66766e]">{getApplicationProgress(opportunity, journey).completed} de {getApplicationProgress(opportunity, journey).total} etapas concluídas{journey.applicationResult !== "pending" ? ` · Resultado: ${journey.applicationResult === "approved" ? "Aprovado" : "Não selecionado"}` : ""}</span></span>
      <span className="text-[10px] font-semibold text-[#078166]">Abrir checklist <ArrowRight className="ml-1 inline" size={13} /></span>
    </button>}
    <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">{opportunity.overview.map((item, index) => { const Icon = overviewIcons[index] ?? Check; return <div className={index % 3 === 0 ? "min-h-36 rounded-[18px] border border-[#dfe5e1] bg-[#f2f7f4] p-4 md:p-5" : "min-h-36 rounded-[18px] border border-[#dfe5e1] bg-white p-4 shadow-[0_8px_20px_rgba(28,54,43,.025)] md:p-5"} key={item.label}><Icon size={17} className="mb-6 text-[#079272]" /><dt className="text-[9px] font-bold uppercase tracking-[.1em] text-[#89938e]">{item.label}</dt><dd className="mt-1.5 text-base font-semibold tracking-[-.025em] text-[#1c372c]">{item.value}</dd>{item.detail && <small className="mt-1 block text-[9px] leading-4 text-[#69756f]">{item.detail}</small>}</div>; })}</dl>
    <article className="relative mt-5 overflow-hidden rounded-[22px] border border-[#bfe2d3] bg-[linear-gradient(135deg,#eaf8f2_0%,#f7fbf9_72%)] p-6 shadow-[0_14px_34px_rgba(7,146,114,.08)] md:p-7">
      <Sparkles className="absolute right-6 top-6 text-[#079272]/20" size={28} />
      <span className="text-[9px] font-bold uppercase tracking-[.14em] text-[#057259]">Nossa leitura</span>
      <h3 className="mt-3 max-w-2xl text-xl font-semibold leading-tight tracking-[-.035em] text-[#18372b]">{opportunity.orientation.headline}</h3>
      <div className="mt-4 grid max-w-2xl gap-3">{opportunity.orientation.paragraphs.slice(0, 3).map((paragraph) => <p className="text-xs leading-6 text-[#496258]" key={paragraph}>{paragraph}</p>)}</div>
    </article>
    <section className="mt-8 border-t border-[#e3e8e5] pt-7"><span className="text-[9px] font-bold uppercase tracking-[.12em] text-[#87928c]">Sobre a oportunidade</span><p className="mt-3 max-w-3xl text-xs leading-7 text-[#52615a]">{opportunity.description}</p></section>
  </div>;
}

function RequirementsPanel({ opportunity }: { opportunity: OpportunityDetail }) {
  return <div>
    <PanelHeading eyebrow="Preparação" title="Prepare sua candidatura." description="Transforme os requisitos em uma sequência concreta de preparação." />
    <div className="mb-8 grid gap-3 sm:grid-cols-2"><div className="rounded-[18px] border border-[#dbe7e0] bg-[#eef7f2] p-4 text-[#365247]"><Clock3 size={17} className="text-[#079272]" /><span className="mt-4 block text-[9px] font-bold uppercase tracking-[.1em] text-[#6f8077]">Preparação estimada</span><strong className="mt-1 block text-base text-[#1c372c]">8–12 horas</strong></div><div className="rounded-[18px] border border-[#e4e5e7] bg-[#f8f8fa] p-4 text-[#365247]"><FileText size={17} className="text-[#7967d8]" /><span className="mt-4 block text-[9px] font-bold uppercase tracking-[.1em] text-[#777a85]">Itens para reunir</span><strong className="mt-1 block text-base text-[#1c372c]">{opportunity.requirements.filter((item) => item.required).length} obrigatórios</strong></div></div>
    <span className="mb-3 block text-[10px] font-bold uppercase tracking-[.12em] text-[#69756f]">Prepare:</span><div className="divide-y divide-[#e2e7e4] rounded-[20px] border border-[#dfe5e1] bg-white px-5">{opportunity.requirements.map((item) => <div className="flex gap-3 py-4" key={item.label}><span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#eaf8f2] text-[#079272]"><Check size={13} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="text-xs text-[#1c372c]">{item.label}</strong>{!item.required && <span className="text-[8px] font-bold uppercase tracking-wide text-[#839089]">Diferencial</span>}</div><p className="mt-1 text-[10px] leading-5 text-[#69756f]">{item.detail}</p></div></div>)}</div>
  </div>;
}

function GuidePanel({ guideDocument }: { guideDocument: OpportunityGuideDocument }) {
  return <OpportunityGuide document={guideDocument} />;
}

export function OpportunityWorkspace({ opportunity, guideDocument }: { opportunity: OpportunityDetail; guideDocument: OpportunityGuideDocument }) {
  const { getJourney, updateApplicationResult, updateJourneyObjective, toggleJourneyChecklistItem, removeJourney, visitOfficialPage } = useOpportunityJourney();
  const journey = getJourney(opportunity.id);
  const hasApplication = Boolean(journey && (journey.objective !== "following" || journey.applicationResult !== "pending"));
  const [activeSection, setActiveSection] = useState<DetailSectionId>("overview");
  const visibleSections = detailSections.filter((section) => section.id !== "application" || hasApplication);
  const selectSection = useCallback((section: DetailSectionId) => {
    setActiveSection(section);
    window.requestAnimationFrame(() => {
      document.getElementById("opportunity-workspace")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  useEffect(() => {
    const requestedSection = new URLSearchParams(window.location.search).get("secao");
    const sectionAliases: Record<string, DetailSectionId> = {
      "visao-geral": "overview",
      candidatura: "application",
      requisitos: "requirements",
      guide: "guide",
      guia: "guide",
      materiais: "materials",
      materials: "materials",
      resources: "materials",
      people: "materials",
      comunidade: "materials",
      community: "materials",
    };
    const initialSection = requestedSection ? sectionAliases[requestedSection] : undefined;
    if (initialSection && (initialSection !== "application" || hasApplication)) setActiveSection(initialSection);

    const openSection = (event: Event) => {
      const section = (event as CustomEvent<{ section?: DetailSectionId }>).detail?.section;
      if (!section || !detailSections.some((item) => item.id === section)) return;

      selectSection(section);
    };

    window.addEventListener("seconecta:opportunity-section", openSection);
    return () => window.removeEventListener("seconecta:opportunity-section", openSection);
  }, [hasApplication, selectSection]);

  useEffect(() => {
    if (!hasApplication && activeSection === "application") setActiveSection("overview");
  }, [activeSection, hasApplication]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("seconecta:opportunity-context-change", { detail: { section: activeSection } }));
  }, [activeSection]);

  const panels: Record<DetailSectionId, React.ReactNode> = {
    overview: <OverviewPanel opportunity={opportunity} journey={journey} onOpenApplication={() => selectSection("application")} />,
    application: journey
      ? <ApplicationProgress
        opportunity={opportunity}
        journey={journey}
        onToggleItem={(itemId) => toggleJourneyChecklistItem(opportunity.id, itemId)}
        onVisitOfficialSite={() => visitOfficialPage({ id: opportunity.id, title: opportunity.title, officialUrl: opportunity.officialUrl })}
        onResultChange={(result) => updateApplicationResult(opportunity.id, result)}
        onObjectiveChange={(objective) => updateJourneyObjective(opportunity.id, objective)}
        onRemove={() => removeJourney(opportunity.id)}
      />
      : null,
    requirements: <RequirementsPanel opportunity={opportunity} />,
    guide: <GuidePanel guideDocument={guideDocument} />,
    materials: <OpportunityMaterialsPanel opportunity={opportunity} />,
  };

  return <section id="opportunity-workspace" className="mx-auto grid w-[min(1160px,calc(100%-48px))] scroll-mt-24 gap-7 py-8 md:grid-cols-[296px_minmax(0,1fr)] md:items-start md:py-10">
    <aside className="sticky top-[72px] z-30 -mx-6 overflow-x-auto border-y border-[#dfe5e1] bg-[#fafbf9]/95 px-6 py-3 backdrop-blur-xl md:top-[96px] md:mx-0 md:overflow-visible md:rounded-[24px] md:border md:bg-white md:p-4" aria-label="Seções da oportunidade">
      <span className="mb-3 hidden px-3 pt-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#7d8882] md:block">Nesta oportunidade</span>
      <nav className="flex min-w-max gap-2 md:grid md:min-w-0 md:gap-2">{visibleSections.map(({ id, label, description, icon: Icon }) => <button className={activeSection === id ? "flex items-center gap-4 rounded-[18px] bg-[#eaf8f2] px-4 py-4 text-left text-[#056e57] shadow-[inset_0_0_0_1px_rgba(7,146,114,.06)] md:w-full" : "flex items-center gap-4 rounded-[18px] px-4 py-4 text-left text-[#69756f] transition-colors hover:bg-[#f3f5f2] hover:text-[#1c372c] md:w-full"} type="button" onClick={() => selectSection(id)} aria-current={activeSection === id ? "page" : undefined} key={id}><span className={activeSection === id ? "grid size-10 shrink-0 place-items-center rounded-[13px] bg-white text-[#079272] shadow-[0_5px_14px_rgba(7,146,114,.09)]" : "grid size-10 shrink-0 place-items-center rounded-[13px] bg-[#f1f5f2] text-[#52615a]"}><Icon size={21} strokeWidth={2} /></span><span><strong className="block text-[13px] font-semibold">{label}</strong><small className="mt-1 hidden text-[10px] leading-4 opacity-75 md:block">{id === "application" && journey ? `${getJourneyProgressLabel(journey)} · ${getApplicationProgress(opportunity, journey).completed}/${getApplicationProgress(opportunity, journey).total}` : description}</small></span></button>)}</nav>
      <div className="mt-4 hidden border-t border-[#e5e9e6] px-4 pb-3 pt-5 md:block"><span className="text-[10px] font-bold uppercase tracking-[.1em] text-[#b35a42]">Prazo</span><strong className="mt-1.5 block text-base text-[#1c372c]">{opportunity.deadline}</strong><p className="mt-1 text-[10px] text-[#b35a42]">{opportunity.deadlineNote}</p><div className="mt-5"><JourneySidebarCTA opportunity={opportunity} /></div></div>
    </aside>
    <div className="min-h-[680px] px-1 py-4 md:px-8 md:py-5">
      <AnimatePresence mode="wait" initial={false}><motion.div key={activeSection} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: .18 }}>{panels[activeSection]}</motion.div></AnimatePresence>
    </div>
  </section>;
}

export function RelatedOpportunitiesSection({ opportunity }: { opportunity: OpportunityDetail }) {
  return <section className="border-t border-[#dfe5e1] bg-[#f4f7f5] py-16 md:py-20">
    <div className="mx-auto w-[min(1160px,calc(100%-48px))]">
      <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#079272]">Continue explorando</span><h2 className="mt-2 text-[clamp(1.7rem,3vw,2.35rem)] font-semibold tracking-[-.045em] text-[#1c372c]">Oportunidades relacionadas</h2><p className="mt-2 text-xs leading-6 text-[#69756f]">Caminhos que compartilham temas, momento ou formato com esta oportunidade.</p></div><Link href="/explorar" className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#056e57] no-underline hover:text-[#079272]">Explorar todas <ArrowRight size={15} /></Link></div>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{opportunity.similar.map((item) => <Link href={opportunityHref(item)} className="group flex min-h-52 w-[min(290px,78vw)] shrink-0 snap-start flex-col rounded-[21px] border border-[#dfe5e1] bg-white p-5 no-underline shadow-[0_10px_28px_rgba(28,54,43,.045)] transition-transform hover:-translate-y-1" key={item.id}><span className="text-[9px] font-bold uppercase tracking-[.1em] text-[#7967d8]">{item.type}</span><h3 className="mt-4 text-base font-semibold leading-6 tracking-[-.03em] text-[#1c372c]">{item.title}</h3><p className="mt-3 text-[10px] leading-5 text-[#69756f]">{item.fit}</p><div className="mt-auto flex items-center justify-between border-t border-[#e7ebe8] pt-4 text-[10px] font-semibold text-[#52615a]"><span>{item.deadline}</span><ArrowRight className="transition-transform group-hover:translate-x-1" size={15} /></div></Link>)}</div>
    </div>
  </section>;
}

function OpportunityBreadcrumbs({ opportunity }: { opportunity: OpportunityDetail }) {
  return <nav className="border-b border-[#e5e9e6] bg-white" aria-label="Breadcrumb">
    <ol className="mx-auto flex w-[min(1160px,calc(100%-48px))] items-center gap-2 overflow-hidden py-3 text-[9px] text-[#7b8781]">
      <li><Link href="/" className="no-underline hover:text-[#078166]">Início</Link></li>
      <li aria-hidden="true">/</li>
      <li><Link href="/explorar" className="no-underline hover:text-[#078166]">Oportunidades</Link></li>
      <li aria-hidden="true">/</li>
      <li className="truncate font-semibold text-[#456156]" aria-current="page"><Link href={getOpportunityCanonicalPath(opportunity)} className="no-underline">{opportunity.title}</Link></li>
    </ol>
  </nav>;
}

export function FinalDecisionCTA({ opportunity }: { opportunity: OpportunityDetail }) {
  return <motion.section {...reveal} className="px-6 pb-10">
    <div className="mx-auto grid w-full max-w-[1160px] gap-8 overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_85%_0%,rgba(11,196,182,.26),transparent_36%),#173b30] p-8 text-white md:grid-cols-[1fr_auto] md:items-end md:p-12">
      <div><span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75dfc4]">Seu próximo passo</span><h2 className="mt-4 max-w-2xl text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-[1.04] tracking-[-.055em]">Esta oportunidade merece um lugar na sua jornada?</h2><p className="mt-4 max-w-xl text-sm leading-7 text-white/65">Você já conhece o esforço, o prazo e os caminhos que ela pode abrir. Escolha o nível de compromisso que faz sentido agora.</p></div>
      <OpportunityActions opportunity={opportunity} inverse />
    </div>
  </motion.section>;
}

export function MobileActionBar({ opportunity }: { opportunity: OpportunityDetail }) {
  return <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dfe5e1] bg-white/94 px-4 py-3 shadow-[0_-12px_35px_rgba(28,54,43,.09)] backdrop-blur-xl md:hidden">
    <OpportunityActions opportunity={opportunity} />
  </div>;
}

export function OpportunityDetailPage({ opportunity, guideDocument }: { opportunity: OpportunityDetail; guideDocument: OpportunityGuideDocument }) {
  const { dismissRecommendationFeedback, requestRecommendationFeedback } = useOpportunityJourney();
  const feedbackScheduledFor = useRef<number | null>(null);

  useEffect(() => {
    if (feedbackScheduledFor.current === opportunity.id) return;
    let activeTime = 0;
    let lastTick = performance.now();
    let hasMeaningfulScroll = false;

    const requestFeedback = () => {
      if (feedbackScheduledFor.current === opportunity.id) return;
      if (!((activeTime >= 12_000 && hasMeaningfulScroll) || activeTime >= 25_000)) return;
      feedbackScheduledFor.current = opportunity.id;
      requestRecommendationFeedback({ id: opportunity.id, title: opportunity.title, officialUrl: opportunity.officialUrl });
    };

    const updateScrollEngagement = () => {
      const pageHeight = document.documentElement.scrollHeight;
      const scrollableHeight = Math.max(pageHeight - window.innerHeight, 1);
      const progress = window.scrollY / scrollableHeight;
      if (progress >= 0.28) hasMeaningfulScroll = true;
      requestFeedback();
    };

    const interval = window.setInterval(() => {
      const now = performance.now();
      if (!document.hidden) activeTime += now - lastTick;
      lastTick = now;
      requestFeedback();
    }, 1000);

    const resetTick = () => { lastTick = performance.now(); };
    window.addEventListener("scroll", updateScrollEngagement, { passive: true });
    document.addEventListener("visibilitychange", resetTick);
    updateScrollEngagement();

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("scroll", updateScrollEngagement);
      document.removeEventListener("visibilitychange", resetTick);
      dismissRecommendationFeedback(opportunity.id);
    };
  }, [dismissRecommendationFeedback, opportunity.id, opportunity.officialUrl, opportunity.title, requestRecommendationFeedback]);

  return <main className="min-h-screen bg-[#fafbf9] font-[family-name:var(--font-poppins)] text-[#1c372c]">
    <SiteHeader />
    <OpportunityBreadcrumbs opportunity={opportunity} />
    <OpportunityHero opportunity={opportunity} />
    <OpportunityWorkspace opportunity={opportunity} guideDocument={guideDocument} />
    {opportunity.similar.length > 0 && <RelatedOpportunitiesSection opportunity={opportunity} />}
    <footer className="py-10 text-center text-[10px] text-[#7d8781]">As informações são revisadas pela seConecta. Confirme regras e datas no site oficial da organização.</footer>
    <MobileActionBar opportunity={opportunity} />
  </main>;
}
