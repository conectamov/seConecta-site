import { BookOpenCheck, ExternalLink } from "lucide-react";
import type { OpportunityDetail } from "@/types/opportunity-detail";

const materialLabels: Record<string, string> = {
  OFFICIAL: "Fonte oficial",
  RULES: "Regulamento",
  PREPARATION: "Preparação",
  GUIDE: "Guia",
  EXAMPLE: "Exemplo",
  OTHER: "Material",
};

export function OpportunityMaterialsPanel({ opportunity }: { opportunity: OpportunityDetail }) {
  return <div>
    <header className="mb-7 border-b border-[#e5e9e6] pb-6">
      <span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#079272]">Curadoria para avançar</span>
      <h2 className="mt-2 text-[clamp(1.65rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-.045em] text-[#1c372c]">Materiais para esta oportunidade.</h2>
      <p className="mt-2 max-w-2xl text-xs leading-6 text-[#69756f]">Somente referências ativas e revisadas pela equipe de curadoria.</p>
    </header>

    {opportunity.materials.length > 0 ? <section aria-labelledby="curated-materials-title">
      <h3 id="curated-materials-title" className="sr-only">Links selecionados</h3>
      <div className="divide-y divide-[#e5ebe8] overflow-hidden rounded-[20px] border border-[#d8e1dc] bg-white">{opportunity.materials.map((material) => <a href={material.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-4 p-4 text-[#29493c] no-underline transition hover:bg-[#f7faf8] sm:p-5" key={material.id}>
        <span className="grid size-10 shrink-0 place-items-center rounded-[12px] border border-[#e0e6e3] bg-[#f7faf8] text-[#078166]"><BookOpenCheck size={17} /></span>
        <span className="min-w-0 flex-1"><b className="rounded-full bg-[#edf5f1] px-2 py-1 text-[7px] font-bold uppercase tracking-[.08em] text-[#078166]">{materialLabels[material.materialType] ?? materialLabels.OTHER}</b><strong className="mt-2 block text-[11px] leading-5">{material.title}</strong>{material.reviewedAt && <small className="mt-1 block text-[8px] text-[#89938e]">Revisado pela curadoria</small>}</span>
        <ExternalLink size={14} className="mt-1 shrink-0 text-[#9aa49f] transition group-hover:text-[#078166]" />
      </a>)}</div>
    </section> : <div className="rounded-[20px] border border-dashed border-[#cfdad4] bg-[#f7faf8] p-6 text-center"><BookOpenCheck className="mx-auto text-[#079272]" size={22} /><p className="mt-3 text-[11px] font-semibold text-[#29493c]">Ainda não há materiais revisados para esta oportunidade.</p><p className="mt-1 text-[9px] leading-5 text-[#748079]">Consulte a fonte oficial enquanto a curadoria prepara esta seção.</p></div>}

    <p className="mt-4 flex items-center gap-2 text-[8px] leading-4 text-[#8a958f]"><BookOpenCheck size={12} className="shrink-0" />Requisitos e prazos devem sempre ser confirmados na fonte oficial.</p>
  </div>;
}
