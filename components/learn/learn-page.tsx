"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, Check, Clock3, GraduationCap, LibraryBig, Mail, MessageCircle, Newspaper, Search, Sparkles, Target, Wrench, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ComingSoon } from "@/components/coming-soon";
import { GuideCard, ResourceCard } from "@/components/learn/learn-cards";
import { LearnCoach } from "@/components/learn/learn-coach";
import { SiteHeader } from "@/components/site-header";
import { getOpportunityDetail, opportunityIds } from "@/data/opportunity-details";
import { getOpportunityCommunityHub } from "@/data/opportunity-knowledge-hubs";
import { learnGoals, learnGuides, learnResources, learnStories, learnUpdates } from "@/data/learn-content";
import { getOpportunityCanonicalPath } from "@/services/opportunity-seo-service";

const goalTones = {
  gold: "bg-[#fff8df] text-[#87660d] border-[#ede0ac]",
  blue: "bg-[#edf4ff] text-[#34649e] border-[#cfdef2]",
  green: "bg-[#eaf7f1] text-[#08745d] border-[#cce3d9]",
  violet: "bg-[#f2efff] text-[#6754b7] border-[#dcd5f5]",
  rose: "bg-[#fff0f2] text-[#a14e5d] border-[#efd3d8]",
  orange: "bg-[#fff2e8] text-[#9a592d] border-[#efd8c5]",
  cyan: "bg-[#eaf7f8] text-[#28717a] border-[#cbe2e4]",
  slate: "bg-[#eff3f1] text-[#486057] border-[#d8e1dd]",
};

const updateIcons = { Oportunidade: Target, Prazo: Clock3, Guia: BookOpen, Resultado: GraduationCap, Comunicado: Newspaper };

function normalize(value: string) {
  return value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function LearnPage({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [delivery, setDelivery] = useState<"email" | "whatsapp" | "both">("both");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const normalizedQuery = normalize(query.trim());
  const opportunities = opportunityIds.map((id) => getOpportunityDetail(id)).filter(Boolean);
  const discussions = opportunities.flatMap((opportunity) => getOpportunityCommunityHub(opportunity!).questions.map((question) => ({ ...question, opportunity: opportunity! })));

  const results = useMemo(() => {
    if (!normalizedQuery) return null;
    const matches = (...values: (string | string[])[]) => normalize(values.flat().join(" ")).includes(normalizedQuery);
    return {
      goals: learnGoals.filter((goal) => matches(goal.title, goal.description, goal.topics)),
      opportunities: opportunities.filter((opportunity) => opportunity && matches(opportunity.title, opportunity.summary, opportunity.type, opportunity.organization)),
      guides: learnGuides.filter((guide) => matches(guide.title, guide.summary, guide.topics)),
      resources: learnResources.filter((resource) => matches(resource.title, resource.provider, resource.type)),
      stories: learnStories.filter((story) => matches(story.title, story.person, story.summary)),
      discussions: discussions.filter((discussion) => matches(discussion.title, discussion.preview)),
    };
  }, [discussions, normalizedQuery, opportunities]);

  const resultCount = results ? Object.values(results).reduce((total, items) => total + items.length, 0) : 0;
  const subscribe = (event: FormEvent) => {
    event.preventDefault();
    setSubscribed(true);
  };

  return <main className="min-h-screen bg-[#f5f7f5] font-[family-name:var(--font-poppins)] text-[#17372b]">
    <SiteHeader />
    <header className="border-b border-[#dce4e0] bg-white">
      <div className="mx-auto w-[min(1120px,calc(100%-40px))] py-9 md:py-11">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><span className="text-[10px] font-bold uppercase tracking-[.16em] text-[#078166]">Aprender</span><h1 className="mt-2 text-[clamp(2rem,5vw,3.35rem)] font-semibold leading-[1.02] tracking-[-.06em]">Tudo que ajuda você a avançar.</h1><p className="mt-3 max-w-xl text-[12px] leading-6 text-[#69766f]">Encontre o que precisa aprender e conecte conhecimento ao seu próximo objetivo.</p></div>
          <LearnCoach compact />
        </div>
        <div className="relative mt-7 max-w-3xl">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#078166]" size={19} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-15 w-full rounded-[18px] border border-[#cfdcd6] bg-[#fbfcfb] pl-13 pr-12 text-[13px] text-[#29493c] shadow-[0_7px_22px_rgba(28,54,43,.045)] outline-none transition placeholder:text-[#929d98] focus:border-[#84bca9] focus:bg-white focus:ring-4 focus:ring-[#079272]/7" placeholder="Busque guias, oportunidades, recursos ou temas..." aria-label="Buscar na base de conhecimento" />
          {query && <button type="button" onClick={() => setQuery("")} className="absolute right-4 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-[#7e8984] hover:bg-[#edf2ef]" aria-label="Limpar busca"><X size={15} /></button>}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2"><span className="mr-1 text-[8px] font-bold uppercase tracking-[.11em] text-[#89938e]">Buscas populares</span>{["Carta de motivação", "Pesquisa", "Olimpíadas", "Programação", "Bolsas"].map((term) => <button type="button" onClick={() => setQuery(term)} className="rounded-full border border-[#dce4e0] bg-white px-3 py-1.5 text-[8px] font-semibold text-[#607068] transition hover:border-[#a9cbbf] hover:text-[#078166]" key={term}>{term}</button>)}</div>
      </div>
    </header>

    <AnimatePresence mode="wait">
      {results && <motion.section key="results" className="border-b border-[#dce4e0] bg-[#eef4f1]" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
        <div className="mx-auto w-[min(1120px,calc(100%-40px))] py-8">
          <div className="mb-5 flex items-center justify-between"><div><span className="text-[9px] font-bold uppercase tracking-[.12em] text-[#078166]">Resultados conectados</span><h2 className="mt-1 text-xl font-semibold tracking-[-.035em]">{resultCount ? `${resultCount} caminhos para “${query}”` : `Nada encontrado para “${query}”`}</h2></div><button type="button" onClick={() => setQuery("")} className="text-[9px] font-semibold text-[#607068]">Fechar resultados</button></div>
          {resultCount > 0 ? <div className="grid gap-3 md:grid-cols-2">
            {results.goals.map((goal) => <Link href={`/aprender/${goal.slug}`} className="flex items-center gap-3 rounded-[15px] border border-[#d8e1dc] bg-white p-4 no-underline" key={goal.slug}><span className="text-lg">{goal.icon}</span><div><span className="text-[7px] font-bold uppercase tracking-[.1em] text-[#078166]">Objetivo</span><strong className="mt-1 block text-[11px] text-[#29493c]">{goal.title}</strong></div><ArrowRight className="ml-auto text-[#87948e]" size={13} /></Link>)}
            {results.opportunities.map((opportunity) => <Link href={getOpportunityCanonicalPath(opportunity!)} className="flex items-center gap-3 rounded-[15px] border border-[#d8e1dc] bg-white p-4 no-underline" key={opportunity!.id}><span className="grid size-9 place-items-center rounded-xl bg-[#fff5e5] text-base">🎯</span><div><span className="text-[7px] font-bold uppercase tracking-[.1em] text-[#a06a1f]">Oportunidade</span><strong className="mt-1 block text-[11px] text-[#29493c]">{opportunity!.title}</strong></div><ArrowRight className="ml-auto text-[#87948e]" size={13} /></Link>)}
            {results.guides.map((guide) => <Link href={`/aprender?busca=${encodeURIComponent(guide.title)}`} className="flex items-center gap-3 rounded-[15px] border border-[#d8e1dc] bg-white p-4 no-underline" key={guide.slug}><span className="grid size-9 place-items-center rounded-xl bg-[#edf7f2] text-base">📚</span><div><span className="text-[7px] font-bold uppercase tracking-[.1em] text-[#078166]">Guia</span><strong className="mt-1 block text-[11px] text-[#29493c]">{guide.title}</strong></div><ArrowRight className="ml-auto text-[#87948e]" size={13} /></Link>)}
            {results.resources.map((resource) => <a href={resource.href} className="flex items-center gap-3 rounded-[15px] border border-[#d8e1dc] bg-white p-4 no-underline" key={resource.id}><span className="grid size-9 place-items-center rounded-xl bg-[#edf2ff] text-base">🧰</span><div><span className="text-[7px] font-bold uppercase tracking-[.1em] text-[#526fa4]">Recurso · {resource.type}</span><strong className="mt-1 block text-[11px] text-[#29493c]">{resource.title}</strong></div><ArrowRight className="ml-auto text-[#87948e]" size={13} /></a>)}
            {results.stories.map((story) => <ComingSoon className="min-h-[72px] rounded-[15px]" key={story.id}><div className="flex items-center gap-3 rounded-[15px] border border-[#d8e1dc] bg-white p-4"><span className="text-base">✨</span><strong className="text-[11px]">{story.title}</strong></div></ComingSoon>)}
            {results.discussions.map((discussion) => <ComingSoon className="min-h-[72px] rounded-[15px]" key={discussion.id}><div className="flex items-center gap-3 rounded-[15px] border border-[#d8e1dc] bg-white p-4"><span className="text-base">💬</span><strong className="text-[11px]">{discussion.title}</strong></div></ComingSoon>)}
          </div> : <div className="rounded-[18px] border border-dashed border-[#c8d7d0] bg-white/70 p-7"><p className="text-[11px] leading-6 text-[#66756e]">Tente buscar pelo objetivo, pela habilidade ou pelo nome de uma oportunidade. O Coach também pode organizar um ponto de partida.</p><div className="mt-4"><LearnCoach compact /></div></div>}
        </div>
      </motion.section>}
    </AnimatePresence>

    <div className="mx-auto w-[min(1120px,calc(100%-40px))] py-10 md:py-14">
      <section id="objetivos" className="scroll-mt-24">
        <SectionHeader eyebrow="Aprenda por objetivo" title="Comece pelo lugar aonde você quer chegar." description="Cada objetivo reúne conhecimento, recursos e oportunidades em um só caminho." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{learnGoals.map((goal) => <Link href={`/aprender/${goal.slug}`} className={`group min-h-48 rounded-[20px] border p-5 no-underline transition hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(28,54,43,.07)] ${goalTones[goal.accent]}`} key={goal.slug}><div className="flex items-start justify-between"><span className="text-[26px]">{goal.icon}</span><ArrowRight size={14} className="transition group-hover:translate-x-1" /></div><h3 className="mt-7 text-[14px] font-semibold leading-5">{goal.title}</h3><p className="mt-2 text-[9px] leading-4 opacity-75">{goal.description}</p><span className="mt-4 block text-[8px] font-semibold">{goal.topics.slice(0, 2).join(" · ")}</span></Link>)}</div>
      </section>

      <section className="mt-16 md:mt-20"><SectionHeader eyebrow="Guias essenciais" title="Entenda o processo antes de começar." description="Guias evergreen, curtos e conectados a ações reais." action={<Link href="/aprender?busca=guia" className="inline-flex items-center gap-1.5 text-[9px] font-semibold text-[#078166] no-underline">Ver todos <ArrowRight size={12} /></Link>} /><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{learnGuides.slice(0, 6).map((guide) => <GuideCard guide={guide} key={guide.slug} />)}</div></section>

      <section className="mt-16 md:mt-20"><SectionHeader eyebrow="Recursos para aprender" title="Use, pratique e construa." description="Cursos, templates, roadmaps e materiais selecionados pelo que ajudam você a fazer." /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{learnResources.map((resource) => <ResourceCard resource={resource} key={resource.id} />)}</div></section>

      <section className="mt-16 md:mt-20"><SectionHeader eyebrow="Histórias" title="Caminhos reais tornam o próximo passo possível." description="Experiências conectadas aos recursos e oportunidades que ajudaram cada estudante." /><ComingSoon className="min-h-[300px] rounded-[24px]" message="Estamos preparando histórias verificadas e conectadas a cada oportunidade."><div className="grid gap-3 md:grid-cols-3">{learnStories.map((story) => <article className="flex min-h-64 flex-col rounded-[21px] border border-[#dce4e0] bg-white p-5" key={story.id}><span className="grid size-10 place-items-center rounded-[13px] bg-[#f2efff] text-lg">✨</span><h3 className="mt-5 text-[15px] font-semibold leading-6">{story.title}</h3><p className="mt-2 text-[9px] font-semibold text-[#7967d8]">{story.person}</p><p className="mt-3 text-[10px] leading-5 text-[#718078]">{story.summary}</p><span className="mt-auto inline-flex items-center gap-1.5 text-[9px] font-semibold text-[#078166]">Ver caminho <ArrowRight size={12} /></span></article>)}</div></ComingSoon></section>

      <section className="mt-16 md:mt-20"><SectionHeader eyebrow="Atualizações" title="O que mudou e por que importa." description="Novidades em ordem cronológica, com contexto para você agir." /><div className="overflow-hidden rounded-[22px] border border-[#dce4e0] bg-white">{learnUpdates.map((update, index) => { const Icon = updateIcons[update.type]; return <Link href={update.href} className={`group flex gap-4 p-5 text-[#29493c] no-underline transition hover:bg-[#f7faf8] sm:items-center sm:px-6 ${index > 0 ? "border-t border-[#e6ebe8]" : ""}`} key={update.id}><span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[#edf5f1] text-[#078166]"><Icon size={17} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[8px] font-bold uppercase tracking-[.1em] text-[#078166]">{update.type}</span><time className="text-[8px] text-[#929c97]">{update.date}</time></div><h3 className="mt-1.5 text-[12px] font-semibold">{update.title}</h3><p className="mt-1 text-[9px] leading-4 text-[#748079]">{update.description}</p></div><ArrowRight size={13} className="mt-2 shrink-0 text-[#8a9690] transition group-hover:translate-x-1 sm:mt-0" /></Link>; })}</div></section>

      <section className="mt-16 overflow-hidden rounded-[28px] border border-[#cdded6] bg-[#173b30] text-white shadow-[0_22px_60px_rgba(23,59,48,.14)] md:mt-20">
        <div className="grid gap-8 p-7 md:grid-cols-[1fr_.9fr] md:p-10"><div><span className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.13em] text-[#89d8bc]"><Sparkles size={13} />Atualizações semanais</span><h2 className="mt-3 text-[clamp(1.8rem,4vw,2.65rem)] font-semibold leading-[1.08] tracking-[-.05em]">Conhecimento útil, quando ele importa.</h2><p className="mt-4 max-w-lg text-[11px] leading-6 text-white/65">Receba novos guias, prazos e oportunidades ligados aos seus objetivos. Sem uma página separada e sem ruído.</p></div><div className="rounded-[20px] border border-white/12 bg-white/7 p-5">{subscribed ? <div className="grid min-h-40 place-items-center text-center"><div><span className="mx-auto grid size-11 place-items-center rounded-full bg-[#8ee2c3] text-[#173b30]"><Check size={19} /></span><strong className="mt-4 block text-[13px]">Tudo certo.</strong><p className="mt-2 text-[9px] text-white/60">Suas preferências de atualização foram salvas.</p></div></div> : <form onSubmit={subscribe}><span className="text-[9px] font-semibold text-white/70">Como você quer receber?</span><div className="mt-3 grid grid-cols-3 gap-2">{([{ id: "email", label: "E-mail", icon: Mail }, { id: "whatsapp", label: "WhatsApp", icon: MessageCircle }, { id: "both", label: "Ambos", icon: LibraryBig }] as const).map(({ id, label, icon: Icon }) => <button type="button" onClick={() => setDelivery(id)} className={`flex min-h-11 items-center justify-center gap-2 rounded-[12px] border text-[8px] font-semibold transition ${delivery === id ? "border-[#89d8bc] bg-[#89d8bc] text-[#173b30]" : "border-white/14 bg-white/5 text-white/70 hover:bg-white/10"}`} key={id}><Icon size={13} />{label}</button>)}</div>{delivery !== "whatsapp" && <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="mt-3 h-11 w-full rounded-[12px] border border-white/13 bg-white/8 px-4 text-[10px] text-white outline-none placeholder:text-white/35 focus:border-[#89d8bc]" placeholder="Seu melhor e-mail" />}<button className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-white text-[9px] font-semibold text-[#173b30] transition hover:bg-[#edf7f2]">Quero receber atualizações <ArrowRight size={13} /></button></form>}</div></div>
      </section>

      <section className="mt-8 flex flex-col items-start justify-between gap-5 rounded-[22px] border border-[#d7e2dd] bg-white p-6 sm:flex-row sm:items-center"><div><span className="text-[9px] font-bold uppercase tracking-[.12em] text-[#078166]">Não sabe o que aprender agora?</span><h2 className="mt-2 text-[18px] font-semibold tracking-[-.035em]">O Coach pode montar seu ponto de partida.</h2><p className="mt-2 text-[10px] leading-5 text-[#718078]">Uma recomendação baseada no seu objetivo e nas oportunidades que você acompanha.</p></div><LearnCoach /></section>
    </div>
  </main>;
}

function SectionHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><span className="text-[9px] font-bold uppercase tracking-[.14em] text-[#078166]">{eyebrow}</span><h2 className="mt-2 text-[clamp(1.55rem,3vw,2.15rem)] font-semibold leading-tight tracking-[-.045em]">{title}</h2><p className="mt-2 max-w-2xl text-[10px] leading-5 text-[#718078]">{description}</p></div>{action}</header>;
}

