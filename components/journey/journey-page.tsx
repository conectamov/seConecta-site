"use client";

import { ArrowRight, Bookmark, CalendarDays, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useOpportunityJourney } from "@/components/opportunity-journey-provider";
import { useOpportunityCatalog } from "@/components/opportunity-catalog-provider";
import { useAuthentication } from "@/components/auth/authentication-provider";
import { OpportunityWorkspaceNav } from "@/components/opportunity-workspace-nav";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppHelpLink } from "@/components/whatsapp-help-link";
const statusOrder = { open: 0, endingSoon: 0, evergreen: 0, openingSoon: 1, unknown: 2, closed: 3 } as const;
const statusCopy = { open: "Inscrições abertas", endingSoon: "Encerrando em breve", evergreen: "Inscrições abertas", openingSoon: "Abre em breve", unknown: "Prazo a confirmar", closed: "Inscrições encerradas" } as const;

export function JourneyPage() {
  const { journeys, ready, removeJourney } = useOpportunityJourney();
  const { session } = useAuthentication();
  const { opportunities, opportunityMetadata, ready: catalogReady, error: catalogError } = useOpportunityCatalog();
  const saved = useMemo(() => journeys
    .map((item) => ({ relationship: item, opportunity: opportunities.find((opportunity) => opportunity.id === item.opportunityId) }))
    .filter((item): item is typeof item & { opportunity: NonNullable<typeof item.opportunity> } => Boolean(item.opportunity))
    .sort((a, b) => statusOrder[opportunityMetadata[a.opportunity.id].applicationStatus] - statusOrder[opportunityMetadata[b.opportunity.id].applicationStatus] || a.opportunity.deadline.localeCompare(b.opportunity.deadline)), [journeys, opportunities, opportunityMetadata]);

  return <main className="min-h-screen bg-[#f4f7f5] font-[family-name:var(--font-poppins)] text-[#17372b]">
    <SiteHeader />
    <OpportunityWorkspaceNav active="journey" />
    <header className="border-b border-[#dce4e0] bg-white"><div className="mx-auto w-[min(1040px,calc(100%-40px))] py-10 sm:py-14"><span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#078166]">Minha Jornada</span><h1 className="mt-2 text-[clamp(2.2rem,5vw,3.8rem)] font-semibold tracking-[-.06em]">Oportunidades que você salvou</h1><p className="mt-3 max-w-2xl text-[12px] leading-6 text-[#66736d]">Um lugar simples para reencontrar prazos e continuar explorando quando fizer sentido.</p></div></header>

    <section className="mx-auto w-[min(1040px,calc(100%-40px))] py-8 sm:py-12">
      {!ready || !catalogReady ? <div className="h-40 animate-pulse rounded-[24px] bg-[#e5ece8]" /> : catalogError ? <div className="rounded-[24px] border border-[#e2d7d4] bg-white p-8 text-center"><h2 className="font-semibold">Não foi possível sincronizar sua Jornada</h2><p className="mt-2 text-sm text-[#718078]">{catalogError}</p></div> : saved.length === 0 ? <div className="grid min-h-72 place-items-center rounded-[26px] border border-dashed border-[#c8d5cf] bg-white p-8 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-[16px] bg-[#eaf7f1] text-[#078166]"><Bookmark size={20} /></span><h2 className="mt-5 text-xl font-semibold tracking-[-.035em]">Sua Jornada está vazia</h2><p className="mx-auto mt-2 max-w-md text-[11px] leading-5 text-[#718078]">Salve oportunidades interessantes para encontrá-las rapidamente depois.</p><Link href="/explorar" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#079272] px-5 text-[10px] font-semibold text-white no-underline">Explorar oportunidades <ArrowRight size={14} /></Link></div></div>
        : <div className="grid gap-3">{saved.map(({ opportunity }) => { const applicationStatus = opportunityMetadata[opportunity.id].applicationStatus; return <article className="grid gap-5 rounded-[22px] border border-[#d8e1dc] bg-white p-5 shadow-[0_8px_24px_rgba(28,54,43,.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(28,54,43,.07)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" key={opportunity.id}>
          <div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[8px] font-bold ${["open", "endingSoon", "evergreen"].includes(applicationStatus) ? "bg-[#e9f7f1] text-[#078166]" : applicationStatus === "openingSoon" ? "bg-[#fff4df] text-[#95661e]" : "bg-[#eef1ef] text-[#69756f]"}`}>{statusCopy[applicationStatus]}</span><span className="text-[8px] font-medium text-[#89938e]">{opportunity.organization}</span></div><h2 className="mt-3 text-[16px] font-semibold leading-6 tracking-[-.03em]">{opportunity.title}</h2><p className="mt-2 flex items-center gap-2 text-[9px] text-[#748079]"><CalendarDays size={13} className="text-[#079272]" />{opportunity.deadline} · {opportunity.location}</p></div>
          <div className="flex flex-wrap gap-2"><Link href={`/oportunidades/${opportunity.slug ?? opportunity.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#079272] px-4 text-[9px] font-semibold text-white no-underline">Ver oportunidade <ExternalLink size={12} /></Link><button type="button" onClick={() => removeJourney(opportunity.id)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#e2d7d4] px-4 text-[9px] font-semibold text-[#a05242] hover:bg-[#fff2ef]"><Trash2 size={12} />Remover</button></div>
        </article>; })}</div>}
    </section>
    <WhatsAppHelpLink floating />
    <footer className="border-t border-[#dce4e0] bg-white py-7 text-center text-[9px] text-[#89938e]">{session ? "Jornada sincronizada com sua conta seConecta." : "Entre com seu WhatsApp para sincronizar esta Jornada entre seus dispositivos."}</footer>
  </main>;
}
