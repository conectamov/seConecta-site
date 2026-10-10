import Link from "next/link";
import { ArrowUpRight, Filter, Search } from "lucide-react";
import { NewOpportunity } from "@/components/staff/new-opportunity";
import { notFound } from "next/navigation";
import { curationWorkflowEnabled } from "@/lib/staff-api";
import { staffApi } from "@/lib/staff-api";
import type { StaffOpportunityRow } from "@/types/staff";

export default async function StaffOpportunitiesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!curationWorkflowEnabled()) notFound();
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const key of ["search", "stage", "lifecycle", "review_status", "engagement"]) if (params[key]) query.set(key, params[key]!);
  const result = await staffApi<{ data: StaffOpportunityRow[]; count: number }>(`/staff/opportunities?${query}`);
  return <div className="staff-page">
    <header className="staff-page-header"><div><span className="staff-eyebrow">Fila de trabalho</span><h1>Oportunidades</h1><p>O estágio mede completude editorial. O ciclo e a revisão determinam se a oportunidade pode ser distribuída agora.</p></div><NewOpportunity /></header>
    <form className="staff-filter-bar">
      <label className="staff-search"><Search size={17} /><input name="search" defaultValue={params.search} placeholder="Buscar por oportunidade ou organização" /></label>
      <select name="stage" defaultValue={params.stage || ""}><option value="">Todos os estágios</option><option value="0">Stage 0</option><option value="1">Stage 1</option><option value="2">Stage 2</option></select>
      <select name="lifecycle" defaultValue={params.lifecycle || ""}><option value="">Todos os ciclos</option><option value="open">Aberta</option><option value="upcoming">Próxima</option><option value="closed">Encerrada</option><option value="unknown">Desconhecida</option></select>
      <select name="review_status" defaultValue={params.review_status || ""}><option value="">Toda revisão</option><option value="overdue">Revisão vencida</option></select>
      <select name="engagement" defaultValue={params.engagement || ""}><option value="">Todo engajamento</option><option value="high">Alto interesse</option></select>
      <button><Filter size={16} /> Filtrar</button>
    </form>
    <section className="staff-table-card">
      <div className="staff-table-head"><span>Oportunidade</span><span>Qualidade</span><span>Ciclo</span><span>Próxima revisão</span><span /></div>
      {result.data.length === 0 ? <div className="staff-empty">Nenhuma oportunidade encontrada com esses filtros.</div> : result.data.map(item => <Link href={`/staff/oportunidades/${item.id}`} className="staff-table-row" key={item.id}>
        <div><strong>{item.title}</strong><span>{item.organization || "Organização não informada"}</span></div>
        <div><b className={`stage-badge stage-${item.stage}`}>Stage {item.stage}</b><small>{item.editorial_value_score ? `${item.editorial_value_score}/5` : "sem nota"}{item.engagement_students >= 10 ? ` · ${item.engagement_students} estudantes` : ""}</small></div>
        <div><b className={`lifecycle-badge ${item.lifecycle}`}>{item.lifecycle}</b><small>{item.publication_status.toLowerCase().replaceAll("_", " ")}</small></div>
        <div><span>{item.next_review_at ? new Intl.DateTimeFormat("pt-BR").format(new Date(item.next_review_at)) : "Não definida"}</span></div>
        <ArrowUpRight size={18} />
      </Link>)}
    </section>
  </div>;
}
