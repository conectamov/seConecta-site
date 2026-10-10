import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, Clock3 } from "lucide-react";
import { curationWorkflowEnabled, staffApi } from "@/lib/staff-api";

type Overview = { stage_distribution: Record<string, number>; awaiting_initial_review: number; review_overdue: number; open_tasks: number; assigned_tasks: number; recently_published: number; high_interest_needing_review: number; tasks: { id: string; opportunity_id: number; opportunity_title: string; task_type: string; priority: number; due_at: string | null; assigned_to_me: boolean }[] };

export default async function StaffOverviewPage() {
  if (!curationWorkflowEnabled()) return <div className="staff-page"><section className="staff-disabled"><span className="staff-eyebrow">Rollout independente</span><h1>Curadoria ainda desativada</h1><p>A autenticação Staff está disponível, mas o workflow editorial permanece desligado neste ambiente.</p></section></div>;
  const data = await staffApi<Overview>("/staff/overview");
  return <div className="staff-page">
    <header className="staff-page-header"><div><span className="staff-eyebrow">Trabalho de hoje</span><h1>Visão geral da curadoria</h1><p>Priorize informação vencida e oportunidades de alto impacto. Popularidade organiza a fila, mas não decide qualidade.</p></div><Link href="/staff/oportunidades" className="staff-primary-button">Abrir fila <ArrowRight size={17} /></Link></header>
    <section className="staff-stat-grid">
      <article><AlertTriangle /><span>Revisões vencidas</span><strong>{data.review_overdue}</strong><p>Distribuição pausada quando a linha do tempo não é confiável.</p></article>
      <article><ClipboardList /><span>Aguardando revisão</span><strong>{data.awaiting_initial_review}</strong><p>{data.high_interest_needing_review} têm alto interesse e merecem prioridade humana.</p></article>
      <article><Clock3 /><span>Tarefas abertas</span><strong>{data.open_tasks}</strong><p>{data.assigned_tasks} já estão atribuídas a alguém.</p></article>
      <article><CheckCircle2 /><span>Publicadas recentemente</span><strong>{data.recently_published}</strong><p>Novas ou revisadas nos últimos 14 dias.</p></article>
    </section>
    <section className="staff-panel"><div className="staff-panel-heading"><div><span className="staff-eyebrow">Qualidade editorial</span><h2>Distribuição por estágio</h2></div></div><div className="stage-bars">{[0,1,2].map(stage => <div key={stage}><span>Stage {stage}</span><div><i style={{ width: `${Math.max(5, (data.stage_distribution[String(stage)] || 0) * 8)}%` }} /></div><strong>{data.stage_distribution[String(stage)] || 0}</strong></div>)}</div></section>
    <section className="staff-panel"><div className="staff-panel-heading"><div><span className="staff-eyebrow">Próximas ações</span><h2>Tarefas priorizadas</h2></div></div><div className="staff-task-list">{data.tasks.length ? data.tasks.map(task => <Link key={task.id} href={`/staff/oportunidades/${task.opportunity_id}`}><span><strong>{task.opportunity_title}</strong><small>{task.task_type.replaceAll("_", " ")}{task.assigned_to_me ? " · atribuída a você" : ""}</small></span><b>{task.priority}</b><ArrowRight size={16} /></Link>) : <p>Nenhuma tarefa aberta agora.</p>}</div></section>
  </div>;
}
