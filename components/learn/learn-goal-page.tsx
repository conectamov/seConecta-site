import { ArrowLeft, ArrowRight, CalendarClock, Check, ChevronRight, MessageCircle, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { ComingSoon } from "@/components/coming-soon";
import { GuideCard, ResourceCard } from "@/components/learn/learn-cards";
import { LearnCoach } from "@/components/learn/learn-coach";
import { SiteHeader } from "@/components/site-header";
import { getOpportunityDetail } from "@/data/opportunity-details";
import { learnGoals, learnGuides, learnResources, learnStories, learnUpdates, type LearnGoal } from "@/data/learn-content";
import { getOpportunityCanonicalPath } from "@/services/opportunity-seo-service";

const accents = {
  gold: "from-[#fff7d8] to-[#fbfcf8] text-[#80600a]",
  blue: "from-[#eaf3ff] to-[#fbfcf8] text-[#315f96]",
  green: "from-[#e5f6ee] to-[#fbfcf8] text-[#08745d]",
  violet: "from-[#efebff] to-[#fbfcf8] text-[#6551b4]",
  rose: "from-[#ffedef] to-[#fbfcf8] text-[#9c4b59]",
  orange: "from-[#ffefe2] to-[#fbfcf8] text-[#965529]",
  cyan: "from-[#e5f6f7] to-[#fbfcf8] text-[#256d75]",
  slate: "from-[#edf2ef] to-[#fbfcf8] text-[#435b52]",
};

export function LearnGoalPage({ goal }: { goal: LearnGoal }) {
  const opportunities = goal.opportunityIds.map((id) => getOpportunityDetail(id)).filter(Boolean);
  const guides = learnGuides.filter((guide) => guide.goalSlugs.includes(goal.slug));
  const resources = learnResources.filter((resource) => resource.goalSlugs.includes(goal.slug));
  const stories = learnStories.filter((story) => story.goalSlugs.includes(goal.slug));
  const updates = learnUpdates.filter((update) => update.goalSlugs.includes(goal.slug));
  const otherGoals = learnGoals.filter((item) => item.slug !== goal.slug).slice(0, 4);

  return <main className="min-h-screen bg-[#f5f7f5] font-[family-name:var(--font-poppins)] text-[#17372b]">
    <SiteHeader />
    <header className={`border-b border-[#dce4e0] bg-gradient-to-br ${accents[goal.accent]}`}>
      <div className="mx-auto w-[min(1120px,calc(100%-40px))] py-8 md:py-11">
        <Link href="/aprender" className="inline-flex items-center gap-2 text-[9px] font-semibold text-[#607068] no-underline hover:text-[#078166]"><ArrowLeft size={12} />Voltar para Aprender</Link>
        <div className="mt-7 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div className="max-w-2xl"><span className="text-[34px]">{goal.icon}</span><h1 className="mt-4 text-[clamp(2.2rem,5vw,3.8rem)] font-semibold leading-[1] tracking-[-.065em]">{goal.title}</h1><p className="mt-4 max-w-xl text-[12px] leading-6 text-[#5e6d66]">{goal.description}</p><div className="mt-5 flex flex-wrap gap-2">{goal.topics.map((topic) => <span className="rounded-full border border-current/15 bg-white/60 px-3 py-1.5 text-[8px] font-semibold" key={topic}>{topic}</span>)}</div></div><LearnCoach compact /></div>
      </div>
    </header>

    <div className="mx-auto grid w-[min(1120px,calc(100%-40px))] gap-8 py-10 md:grid-cols-[210px_minmax(0,1fr)] md:items-start md:py-12">
      <aside className="sticky top-[90px] hidden rounded-[18px] border border-[#dce4e0] bg-white p-3 md:block">
        <span className="block px-3 py-2 text-[8px] font-bold uppercase tracking-[.12em] text-[#8a9690]">Neste objetivo</span>
        {[["oportunidades", "Oportunidades"], ["guias", "Guias"], ["recursos", "Recursos"], ["historias", "Histórias"], ["atualizacoes", "Atualizações"]].map(([id, label], index) => <a href={`#${id}`} className={`flex min-h-10 items-center gap-3 rounded-[11px] px-3 text-[9px] font-semibold text-[#52615a] no-underline hover:bg-[#edf7f2] hover:text-[#078166] ${index === 0 ? "bg-[#edf7f2] text-[#078166]" : ""}`} key={id}><span className="text-[8px] text-[#9aa49f]">0{index + 1}</span>{label}</a>)}
      </aside>

      <div className="min-w-0">
        <section className="scroll-mt-28" id="oportunidades">
          <GoalSectionTitle eyebrow="Aplique o que aprender" title="Oportunidades recomendadas" description="Caminhos onde este objetivo se transforma em experiência real." />
          <div className="grid gap-3 sm:grid-cols-2">{opportunities.map((opportunity) => opportunity && <Link href={getOpportunityCanonicalPath(opportunity)} className="group flex min-h-56 flex-col rounded-[21px] border border-[#dce4e0] bg-white p-5 no-underline transition hover:-translate-y-0.5 hover:border-[#acd0c2] hover:shadow-[0_12px_32px_rgba(28,54,43,.06)]" key={opportunity.id}><div className="flex items-center justify-between"><span className="rounded-full bg-[#fff4df] px-2.5 py-1 text-[8px] font-bold text-[#9a6920]">🎯 {opportunity.type}</span><ArrowRight size={13} className="text-[#88938e] transition group-hover:translate-x-1" /></div><h3 className="mt-5 text-[15px] font-semibold leading-6 text-[#29493c]">{opportunity.title}</h3><p className="mt-2 line-clamp-2 text-[9px] leading-5 text-[#718078]">{opportunity.summary}</p><div className="mt-auto flex items-center justify-between border-t border-[#e6ebe8] pt-4"><span className="text-[8px] font-semibold text-[#607068]">{opportunity.organization}</span><span className="inline-flex items-center gap-1.5 text-[8px] font-semibold text-[#b35b42]"><CalendarClock size={11} />{opportunity.deadline}</span></div></Link>)}</div>
        </section>

        <section className="mt-14 scroll-mt-28" id="guias"><GoalSectionTitle eyebrow="Entenda o processo" title="Guias recomendados" description="Leia o suficiente para agir com clareza." /><div className="grid gap-3 sm:grid-cols-2">{guides.length ? guides.map((guide) => <GuideCard guide={guide} compact key={guide.slug} />) : <KnowledgeEmpty label="Novos guias estão sendo organizados para este objetivo." />}</div></section>

        <section className="mt-14 scroll-mt-28" id="recursos"><GoalSectionTitle eyebrow="Pratique" title="Recursos para avançar" description="Materiais escolhidos pela utilidade, não pelo formato." /><div className="grid gap-3 sm:grid-cols-2">{resources.length ? resources.map((resource) => <ResourceCard resource={resource} key={resource.id} />) : <KnowledgeEmpty label="Estamos selecionando recursos confiáveis para este objetivo." />}</div></section>

        <section className="mt-14"><div className="flex flex-col items-start justify-between gap-4 rounded-[21px] border border-[#cfe0d8] bg-[#edf7f2] p-6 sm:flex-row sm:items-center"><div><span className="inline-flex items-center gap-2 text-[8px] font-bold uppercase tracking-[.12em] text-[#078166]"><Sparkles size={12} />Coach</span><h2 className="mt-2 text-[17px] font-semibold tracking-[-.035em]">Não sabe qual desses caminhos escolher?</h2><p className="mt-2 text-[9px] leading-5 text-[#65756d]">Receba uma sequência curta baseada no seu nível e no que já está na sua Jornada.</p></div><LearnCoach /></div></section>

        <section className="mt-14 scroll-mt-28" id="historias"><GoalSectionTitle eyebrow="Experiências reais" title="Histórias e comunidade" description="O que outras pessoas aprenderam ao perseguir este mesmo objetivo." /><ComingSoon className="min-h-56 rounded-[22px]" message="Histórias e discussões verificadas chegam em breve."><div className="grid gap-3 sm:grid-cols-2">{stories.map((story) => <article className="min-h-44 rounded-[18px] border border-[#dce4e0] bg-white p-5" key={story.id}><span className="text-lg">✨</span><h3 className="mt-4 text-[13px] font-semibold">{story.title}</h3><p className="mt-2 text-[9px] text-[#718078]">{story.summary}</p></article>)}<article className="min-h-44 rounded-[18px] border border-[#dce4e0] bg-white p-5"><MessageCircle size={18} className="text-[#078166]" /><h3 className="mt-4 text-[13px] font-semibold">Discussões da comunidade</h3><p className="mt-2 text-[9px] text-[#718078]">Perguntas e respostas ligadas a {goal.shortTitle.toLocaleLowerCase("pt-BR")}.</p></article></div></ComingSoon></section>

        <section className="mt-14 scroll-mt-28" id="atualizacoes"><GoalSectionTitle eyebrow="Continue atento" title="Atualizações deste objetivo" description="Mudanças recentes que podem alterar seu próximo passo." /><div className="divide-y divide-[#e5ebe8] overflow-hidden rounded-[20px] border border-[#dce4e0] bg-white">{updates.length ? updates.map((update) => <Link href={update.href} className="group flex items-center gap-4 p-5 text-[#29493c] no-underline hover:bg-[#f7faf8]" key={update.id}><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#edf5f1] text-[#078166]"><Target size={15} /></span><div className="min-w-0 flex-1"><span className="text-[7px] font-bold uppercase tracking-[.1em] text-[#078166]">{update.type} · {update.date}</span><strong className="mt-1 block text-[11px]">{update.title}</strong><p className="mt-1 text-[9px] leading-4 text-[#748079]">{update.description}</p></div><ChevronRight size={13} className="shrink-0 text-[#8b9691] transition group-hover:translate-x-1" /></Link>) : <KnowledgeEmpty label="Nenhuma atualização importante agora." />}</div></section>

        <section className="mt-14"><GoalSectionTitle eyebrow="Explore outro caminho" title="Objetivos relacionados" description="Conhecimento se conecta; seu próximo objetivo pode começar daqui." /><div className="grid gap-2 sm:grid-cols-2">{otherGoals.map((item) => <Link href={`/aprender/${item.slug}`} className="flex min-h-14 items-center gap-3 rounded-[15px] border border-[#dce4e0] bg-white px-4 text-[10px] font-semibold text-[#456156] no-underline transition hover:border-[#afd0c3] hover:text-[#078166]" key={item.slug}><span className="text-base">{item.icon}</span>{item.title}<ArrowRight size={12} className="ml-auto" /></Link>)}</div></section>
      </div>
    </div>
  </main>;
}

function GoalSectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header className="mb-5"><span className="text-[8px] font-bold uppercase tracking-[.13em] text-[#078166]">{eyebrow}</span><h2 className="mt-1.5 text-[clamp(1.4rem,3vw,1.9rem)] font-semibold tracking-[-.04em]">{title}</h2><p className="mt-2 text-[9px] leading-5 text-[#718078]">{description}</p></header>;
}

function KnowledgeEmpty({ label }: { label: string }) {
  return <div className="col-span-full flex min-h-32 items-center gap-3 rounded-[18px] border border-dashed border-[#ccd9d3] bg-white/60 p-5"><span className="grid size-9 place-items-center rounded-full bg-[#eaf7f1] text-[#078166]"><Check size={14} /></span><p className="text-[9px] leading-5 text-[#6f7d76]">{label}</p></div>;
}

