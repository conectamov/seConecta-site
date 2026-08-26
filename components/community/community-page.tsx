import { ArrowRight, BookOpen, MessageCircle, Users } from "lucide-react";
import Link from "next/link";
import { ComingSoon } from "@/components/coming-soon";
import { SiteHeader } from "@/components/site-header";
import { getOpportunityDetail, opportunityIds } from "@/data/opportunity-details";
import { getOpportunityCommunityHub } from "@/data/opportunity-knowledge-hubs";

export function CommunityPage() {
  const hubs = opportunityIds
    .slice(0, 8)
    .map((id) => getOpportunityDetail(id)!)
    .filter(Boolean)
    .map((opportunity) => ({ opportunity, hub: getOpportunityCommunityHub(opportunity) }))
    .sort((a, b) => b.hub.activeNow - a.hub.activeNow);
  const whatsappUrl = process.env.NEXT_PUBLIC_SECONNECTA_WHATSAPP_COMMUNITY_URL ?? "https://chat.whatsapp.com/";

  return <main className="min-h-screen bg-[#f4f7f5] font-[family-name:var(--font-poppins)] text-[#17372b]">
    <SiteHeader />
    <ComingSoon
      className="min-h-[calc(100vh-72px)]"
      message="A Comunidade seConecta está sendo preparada. Enquanto isso, entre no nosso grupo para trocar experiências e tirar dúvidas."
      action={<a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#079272] px-5 text-[10px] font-semibold text-white no-underline transition hover:bg-[#06785e]"><MessageCircle size={15} />Entrar no grupo do WhatsApp</a>}
    >
      <div>
        <section className="border-b border-[#dbe3df] bg-white">
          <div className="mx-auto w-[min(1080px,calc(100%-40px))] py-10">
            <span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#078166]">Comunidade</span>
            <h1 className="mt-2 max-w-3xl text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-[1.04] tracking-[-.06em]">Conhecimento nasce ao redor de oportunidades.</h1>
            <p className="mt-3 max-w-2xl text-[12px] leading-6 text-[#66736d]">Escolha uma discussão para ver perguntas, experiências, recursos e pessoas ligadas àquela oportunidade.</p>
          </div>
        </section>
        <div className="mx-auto w-[min(1080px,calc(100%-40px))] py-9">
          <section>
            <div className="mb-6 flex items-end justify-between gap-4">
              <div><span className="text-[9px] font-bold uppercase tracking-[.12em] text-[#078166]">Discussões</span><h2 className="mt-1 text-2xl font-semibold tracking-[-.04em]">Comunidades mais ativas</h2></div>
              <Link href="/explorar" className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#078166] no-underline">Explorar oportunidades <ArrowRight size={11} /></Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{hubs.map(({ opportunity, hub }) => <Link href={`/comunidade/${opportunity.slug}`} className="group flex min-h-48 flex-col rounded-[20px] border border-[#d8e1dc] bg-white p-5 no-underline shadow-[0_9px_26px_rgba(28,54,43,.04)]" key={opportunity.id}><span className="text-[8px] font-bold uppercase tracking-[.1em] text-[#7967d8]">{opportunity.type}</span><h3 className="mt-3 text-[14px] font-semibold leading-5 text-[#29493c]">{opportunity.title}</h3><p className="mt-2 line-clamp-2 text-[9px] leading-4 text-[#748079]">{hub.questions[0]?.title}</p><div className="mt-auto flex items-center justify-between gap-3 border-t border-[#e7ece9] pt-4">{hub.activeNow > 10 && <span className="inline-flex items-center gap-1.5 text-[8px] font-semibold text-[#078166]"><Users size={11} />{hub.activeNow} participantes</span>}<span className="ml-auto inline-flex items-center gap-1 text-[8px] text-[#748079]"><MessageCircle size={11} />{hub.questions.length} perguntas</span></div></Link>)}</div>
          </section>
          <aside className="mt-8 flex flex-col gap-5 rounded-[22px] border border-[#d8e1dc] bg-white p-5 sm:flex-row sm:items-center">
            <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-[#eaf7f1] text-[#078166]"><BookOpen size={18} /></span>
            <div className="flex-1"><h2 className="text-[13px] font-semibold tracking-[-.025em]">Cada conversa começa com uma oportunidade.</h2><p className="mt-1 text-[9px] leading-5 text-[#66736d]">Abra uma discussão para perguntar, responder ou compartilhar uma experiência com contexto.</p></div>
            <Link href="/explorar" className="inline-flex min-h-10 items-center justify-center gap-1 rounded-full border border-[#cbd8d2] px-4 text-[9px] font-semibold text-[#078166] no-underline">Encontrar oportunidade <ArrowRight size={11} /></Link>
          </aside>
        </div>
      </div>
    </ComingSoon>
  </main>;
}
