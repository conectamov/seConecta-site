"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check, Circle, ExternalLink, Plus, Save, ShieldCheck } from "lucide-react";
import type { Checklist, StaffOpportunityDetail } from "@/types/staff";

async function mutate(path: string, body: unknown) {
  const response = await fetch(`/api/staff/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : data.detail?.message || "Não foi possível concluir.");
  return data;
}

export function OpportunityEditor({ initial }: { initial: StaffOpportunityDetail }) {
  const [data, setData] = useState(initial);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [selectedStage, setSelectedStage] = useState<1 | 2>(data.curation.stage === 2 ? 2 : 1);
  const checklist: Checklist = selectedStage === 2 ? data.checklists.stage_2 : data.checklists.stage_1;
  const blockers = useMemo(() => checklist.items.filter(item => !item.passed), [checklist]);

  async function persist(form: FormData, quiet = false) {
    setPending(true); if (!quiet) setMessage("");
    const csv = (name: string) => String(form.get(name) || "").split(",").map(value => value.trim()).filter(Boolean);
    const num = (name: string) => { const value = String(form.get(name) || ""); return value ? Number(value) : null; };
    const body = { opportunity: {
      title: form.get("title"), organization: form.get("organization"), excerpt: form.get("excerpt"), description: form.get("description"), official_site_url: form.get("official_site_url"),
      location: form.get("location"), cost_kind: form.get("cost_kind"), cost_notes: form.get("cost_notes"), delivery_mode: form.get("delivery_mode"), recurrence_pattern: form.get("recurrence_pattern"),
      languages: csv("languages"), target_subjects: csv("target_subjects"), target_goals: csv("target_goals"), target_education_levels: csv("target_education_levels"), preparation_min_days: num("preparation_min_days"), preparation_max_days: num("preparation_max_days"),
    }, curation: { recommendation_enabled: form.get("recommendation_enabled") === "on", editorial_value_score: num("editorial_value_score"), editorial_value_reason: form.get("editorial_value_reason"), verified_at: form.get("verified_at") ? new Date(String(form.get("verified_at"))).toISOString() : null, next_review_at: form.get("next_review_at") ? new Date(String(form.get("next_review_at"))).toISOString() : null } };
    try {
      const response = await fetch(`/api/staff/opportunities/${data.opportunity.id}/draft`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const updated = await response.json(); if (!response.ok) throw new Error(updated.detail || "Falha ao salvar"); setData(updated); setMessage(quiet ? "Alterações salvas automaticamente como rascunho." : "Rascunho salvo. Nada foi publicado automaticamente.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Falha ao salvar"); } finally { setPending(false); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await persist(new FormData(event.currentTarget));
  }

  async function publish() {
    setPending(true); setMessage("");
    try { const updated = await mutate(`opportunities/${data.opportunity.id}/publish`, { stage: selectedStage }); setData(updated); setMessage(`Stage ${selectedStage} publicado com sucesso.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Falha ao publicar"); } finally { setPending(false); }
  }

  async function addMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    try { await mutate(`opportunities/${data.opportunity.id}/materials`, { title: form.get("material_title"), url: form.get("material_url"), material_type: form.get("material_type"), reviewed: true, position: data.materials.length }); location.reload(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Falha ao adicionar material"); }
  }

  const opportunity = data.opportunity;
  const curation = data.curation;
  const dateInput = (value: unknown) => typeof value === "string" ? value.slice(0, 10) : "";
  return <div className="staff-editor-layout">
    <div className="staff-editor-main">
      <header className="staff-page-header compact"><div><span className="staff-eyebrow">Opportunity #{opportunity.id}</span><h1>{opportunity.title}</h1><p>{data.lifecycle.status} · {data.lifecycle.reason}</p></div>{opportunity.official_site_url && <a className="staff-secondary-button" href={String(opportunity.official_site_url)} target="_blank">Fonte oficial <ExternalLink size={16} /></a>}</header>
      <form onSubmit={save} onBlur={(event) => { if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) void persist(new FormData(event.currentTarget), true); }} className="staff-editor-form">
        <EditorSection title="Informação básica" description="O estudante precisa reconhecer rapidamente o que é e quem oferece.">
          <label>Título<input name="title" defaultValue={String(opportunity.title || "")} required /></label><label>Organização<input name="organization" defaultValue={String(opportunity.organization || "")} /></label>
          <label className="wide">Resumo curto<textarea name="excerpt" defaultValue={String(opportunity.excerpt || "")} rows={2} /></label><label className="wide">Descrição<textarea name="description" defaultValue={String(opportunity.description || "")} rows={6} /></label><label className="wide">URL oficial<input name="official_site_url" type="url" defaultValue={String(opportunity.official_site_url || "")} /></label>
        </EditorSection>
        <EditorSection title="Público e recomendação" description="Use códigos canônicos separados por vírgula; a API continuará validando a taxonomia.">
          <label>Etapas de ensino<input name="target_education_levels" defaultValue={(opportunity.target_education_levels || []).join(", ")} /></label><label>Assuntos<input name="target_subjects" defaultValue={(opportunity.target_subjects || []).join(", ")} /></label><label className="wide">Objetivos<input name="target_goals" defaultValue={(opportunity.target_goals || []).join(", ")} /></label>
        </EditorSection>
        <EditorSection title="Custo e acesso" description="Desconhecido é válido quando foi explicitamente verificado; nunca use texto solto como categoria.">
          <label>Custo<select name="cost_kind" defaultValue={String(opportunity.cost_kind || "UNKNOWN")}><option>FREE</option><option>PAID</option><option>VARIABLE</option><option>UNKNOWN</option></select></label><label>Modalidade<select name="delivery_mode" defaultValue={String(opportunity.delivery_mode || "UNKNOWN")}><option>ONLINE</option><option>IN_PERSON</option><option>HYBRID</option><option>UNKNOWN</option></select></label><label>Localização<input name="location" defaultValue={String(opportunity.location || "")} /></label><label>Idiomas<input name="languages" defaultValue={(opportunity.languages || []).join(", ")} /></label><label className="wide">Notas de custo<input name="cost_notes" defaultValue={String(opportunity.cost_notes || "")} /></label>
        </EditorSection>
        <EditorSection title="Ciclo e preparação" description="O estágio editorial não é perdido quando uma data vence; a distribuição pode ser pausada até a revisão.">
          <label>Recorrência<select name="recurrence_pattern" defaultValue={String(opportunity.recurrence_pattern || "UNKNOWN")}><option>ONE_TIME</option><option>ANNUAL</option><option>ROLLING</option><option>EVERGREEN</option><option>IRREGULAR</option><option>UNKNOWN</option></select></label><label>Preparação mínima (dias)<input name="preparation_min_days" type="number" min="0" defaultValue={String(opportunity.preparation_min_days ?? "")} /></label><label>Preparação máxima (dias)<input name="preparation_max_days" type="number" min="0" defaultValue={String(opportunity.preparation_max_days ?? "")} /></label><label>Verificada em<input name="verified_at" type="date" defaultValue={dateInput(curation.verified_at)} /></label><label>Próxima revisão<input name="next_review_at" type="date" defaultValue={dateInput(curation.next_review_at)} /></label>
        </EditorSection>
        <EditorSection title="Valor editorial" description="Popularidade ajuda a ordenar tarefas. Esta avaliação humana explica por que vale o tempo do estudante.">
          <label>Nota (1–5)<input name="editorial_value_score" type="number" min="1" max="5" defaultValue={String(curation.editorial_value_score ?? "")} /></label><label className="wide">Justificativa<textarea name="editorial_value_reason" rows={3} defaultValue={String(curation.editorial_value_reason || "")} /></label><label className="checkbox wide"><input name="recommendation_enabled" type="checkbox" defaultChecked={Boolean(curation.recommendation_enabled)} /> Permitir recomendação quando todos os outros gates estiverem válidos</label>
        </EditorSection>
        <div className="staff-save-bar"><span>{message || "Alterações são rascunhos até uma publicação explícita."}</span><button className="staff-primary-button" disabled={pending}><Save size={17} />{pending ? "Salvando…" : "Salvar rascunho"}</button></div>
      </form>
      <section className="staff-panel"><div className="staff-panel-heading"><div><span className="staff-eyebrow">Fontes revisadas</span><h2>Materiais</h2></div></div><div className="material-list">{data.materials.map(material => <a key={material.id} href={material.url} target="_blank"><span><strong>{material.title}</strong><small>{material.material_type} · {material.reviewed ? "revisado" : "pendente"}</small></span><ExternalLink size={16} /></a>)}</div><form className="material-add" onSubmit={addMaterial}><input name="material_title" placeholder="Nome do material" required /><input name="material_url" type="url" placeholder="https://…" required /><select name="material_type"><option>OFFICIAL</option><option>RULES</option><option>PREPARATION</option><option>GUIDE</option><option>EXAMPLE</option><option>OTHER</option></select><button><Plus size={16} />Adicionar revisado</button></form></section>
      {data.metrics && <section className="staff-panel"><div className="staff-panel-heading"><div><span className="staff-eyebrow">Últimos {data.metrics.period_days} dias</span><h2>Contexto de engajamento</h2></div></div><div className="staff-metric-strip"><div><strong>{data.metrics.impressions}</strong><span>impressões</span></div><div><strong>{data.metrics.unique_opens}</strong><span>aberturas únicas</span></div><div><strong>{data.metrics.unique_saves}</strong><span>salvamentos únicos</span></div><div><strong>{data.metrics.application_starts}</strong><span>candidaturas iniciadas</span></div></div><p className="staff-privacy-note">{data.metrics.privacy_threshold_met ? `Taxa de abertura ${Math.round((data.metrics.open_rate || 0) * 100)}% · taxa de salvamento ${Math.round((data.metrics.save_rate || 0) * 100)}%.` : "As taxas ficam ocultas até existirem 10 estudantes únicos no período. Engajamento prioriza a fila, mas nunca muda Stage ou ranking sozinho."}</p></section>}
    </div>
    <aside className="staff-checklist"><div className="staff-checklist-sticky"><span className="staff-eyebrow">Checklist objetivo</span><h2>Publicar com confiança</h2><div className="stage-switch"><button className={selectedStage === 1 ? "active" : ""} onClick={() => setSelectedStage(1)}>Stage 1</button><button className={selectedStage === 2 ? "active" : ""} onClick={() => setSelectedStage(2)}>Stage 2</button></div><div className="checklist-progress"><strong>{checklist.items.length - blockers.length}/{checklist.items.length}</strong><span>requisitos atendidos</span></div><ul>{checklist.items.map(item => <li className={item.passed ? "passed" : ""} key={item.key}>{item.passed ? <Check size={15} /> : <Circle size={15} />}<span>{item.label}</span></li>)}</ul><div className="action-preview"><span>Modo sugerido ao estudante</span><strong>{data.preview.action_mode.replaceAll("_", " ")}</strong><small>{data.preview.feed_eligible ? "Elegível para distribuição" : `Pausada: ${data.preview.feed_blockers.join(", ")}`}</small></div><button className="staff-primary-button full" disabled={!checklist.passed || pending} onClick={publish}><ShieldCheck size={17} />Publicar Stage {selectedStage}</button><small className="checklist-note">O servidor recalcula tudo antes de publicar. Esta interface nunca transforma um rascunho em publicação sozinha.</small></div></aside>
  </div>;
}

function EditorSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="staff-editor-section"><header><h2>{title}</h2><p>{description}</p></header><div className="staff-field-grid">{children}</div></section>; }
