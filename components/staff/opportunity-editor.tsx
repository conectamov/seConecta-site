"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { Braces, Check, Circle, ExternalLink, Pencil, Plus, Save, ShieldCheck } from "lucide-react";
import type { Checklist, StaffOpportunityDetail } from "@/types/staff";

import { ChoiceField, MultipleChoiceField } from "./opportunity-fields";
import { OpportunityRow } from "./opportunity-row";

const fieldLabels: Record<string, string> = {
  target_education_levels: "Etapas de ensino", target_subjects: "Assuntos", target_goals: "Objetivos",
  recommended_experience_levels: "Experiência", languages: "Idiomas", official_site_url: "URL oficial", cost_kind: "Custo", delivery_mode: "Modalidade",
  scholarship_availability: "Bolsas", recurrence_pattern: "Recorrência",
  preparation_min_days: "Preparação mínima", preparation_max_days: "Preparação máxima",
  verified_at: "Verificada em", next_review_at: "Próxima revisão",
};

function formatValues(fields: Record<string, unknown[]>) {
  return Object.entries(fields).map(([field, values]) =>
    `${fieldLabels[field] || field}: ${values.map(value => String(value)).join(", ")}`
  ).join(". ");
}

function requestError(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map(item => `${item.loc?.at(-1)}: ${item.msg}`).join(". ");
  if (detail && typeof detail === "object" && "message" in detail) {
    const fields = "fields" in detail ? formatValues(detail.fields as Record<string, unknown[]>) : "";
    return [detail.message, fields].filter(Boolean).join(" ");
  }
  return "Não foi possível concluir.";
}

async function mutate(path: string, body: unknown) {
  const response = await fetch(`/api/staff/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(requestError(data.detail));
  return data;
}

export function OpportunityEditor({ initial, isAdmin }: { initial: StaffOpportunityDetail; isAdmin: boolean }) {
  const [data, setData] = useState(initial);
  const saves = useRef(Promise.resolve());
  const lastSaveFailed = useRef(false);
  const options = initial.field_options;
  const [removed, setRemoved] = useState(formatValues(initial.removed_values || {}));
  const [view, setView] = useState<"editor" | "json">("editor");
  const showRow = isAdmin && view === "json";
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [selectedStage, setSelectedStage] = useState<1 | 2>(data.curation.stage === 2 ? 2 : 1);
  const checklist: Checklist = selectedStage === 2 ? data.checklists.stage_2 : data.checklists.stage_1;
  const blockers = useMemo(() => checklist.items.filter(item => !item.passed), [checklist]);

  function applyDetail(updated: StaffOpportunityDetail) {
    setData(current => ({ ...updated, metrics: current.metrics }));
    const notice = formatValues(updated.removed_values || {});
    if (notice) setRemoved(notice);
  }

  async function persist(form: FormData, quiet = false) {
    setPending(true); if (!quiet) setMessage("");
    const selected = (name: string) => form.getAll(name).map(String);
    const languages = [...selected("languages"), ...String(form.get("additional_languages") || "").split(/[\s,]+/).filter(Boolean)];
    const primary = String(form.get("category"));
    const categories = [...new Set([primary, ...selected("categories")])];
    const savedDate = (name: "verified_at" | "next_review_at") => {
      const value = String(form.get(name) || "");
      const previous = data.curation[name];
      if (previous?.slice(0, 10) === value) return previous;
      return value ? new Date(value).toISOString() : null;
    };
    const num = (name: string) => { const value = String(form.get(name) || ""); return value ? Number(value) : null; };
    const body = { opportunity: {
      title: form.get("title"), organization: form.get("organization"), excerpt: form.get("excerpt"), description: form.get("description"), official_site_url: form.get("official_site_url") || null, category: primary, categories,
      target_audience: form.get("target_audience") || null, scholarship_availability: form.get("scholarship_availability"),
      location: form.get("location"), cost_kind: form.get("cost_kind"), cost_notes: form.get("cost_notes"), delivery_mode: form.get("delivery_mode"), recurrence_pattern: form.get("recurrence_pattern"),
      languages, recommended_experience_levels: selected("recommended_experience_levels"), target_subjects: selected("target_subjects"), target_goals: selected("target_goals"), target_education_levels: selected("target_education_levels"), preparation_min_days: num("preparation_min_days"), preparation_max_days: num("preparation_max_days"),
    }, curation: { recommendation_enabled: form.get("recommendation_enabled") === "on", editorial_value_score: num("editorial_value_score"), editorial_value_reason: form.get("editorial_value_reason"), verified_at: savedDate("verified_at"), next_review_at: savedDate("next_review_at") } };
    try {
      const response = await fetch(`/api/staff/opportunities/${data.opportunity.id}/draft`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const updated = await response.json();
      if (!response.ok) throw new Error(requestError(updated.detail));
      lastSaveFailed.current = false;
      applyDetail(updated);
      setMessage(quiet ? "Alterações salvas automaticamente." : "Rascunho salvo.");
    } catch (error) { lastSaveFailed.current = true; setMessage(error instanceof Error ? error.message : "Falha ao salvar"); } finally { setPending(false); }
  }

  function queueSave(form: HTMLFormElement, quiet: boolean) {
    if (!form.reportValidity()) return;
    const snapshot = new FormData(form);
    saves.current = saves.current.then(() => persist(snapshot, quiet));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    queueSave(event.currentTarget, false);
  }

  async function publish() {
    setPending(true); setMessage("");
    try { await saves.current; if (lastSaveFailed.current) throw new Error("Corrija os campos e salve o rascunho antes de publicar."); const updated = await mutate(`opportunities/${data.opportunity.id}/publish`, { stage: selectedStage }); applyDetail(updated); setMessage(`Stage ${selectedStage} publicado com sucesso.`); }
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
  const previewHref = opportunity.approved
    ? `/oportunidades/${encodeURIComponent(opportunity.slug || opportunity.id)}`
    : `/oportunidades/${opportunity.id}/previa`;
  return <div className={`staff-editor-layout${showRow ? " staff-editor-json-layout" : ""}`}>
    <div className="staff-editor-main">
      <header className="staff-page-header compact"><div><span className="staff-eyebrow">Oportunidade #{opportunity.id}</span><h1>{opportunity.title}</h1><p>{data.lifecycle.status} · {data.lifecycle.reason}</p></div>{opportunity.official_site_url && <a className="staff-secondary-button" href={String(opportunity.official_site_url)} target="_blank">Fonte oficial <ExternalLink size={16} /></a>}</header>
      <div className="staff-view-buttons" role="group" aria-label="Visualizações da oportunidade">
        <button type="button" className={showRow ? "staff-secondary-button" : "staff-primary-button"} aria-pressed={!showRow} onClick={() => setView("editor")}><Pencil size={16} />Editor</button>
        {isAdmin && <button type="button" className={showRow ? "staff-primary-button" : "staff-secondary-button"} aria-pressed={showRow} onClick={() => setView("json")}><Braces size={16} />Dados em JSON</button>}
        <a className="staff-secondary-button" href={previewHref} target="_blank" rel="noopener noreferrer">Pré-visualizar <ExternalLink size={16} /></a>
      </div>
      {showRow && <OpportunityRow key={String(opportunity.updated_at)} opportunityId={opportunity.id} />}
      <div hidden={showRow}>
      {removed && <p className="staff-field-notice" role="status">Valores inválidos removidos deste registro. {removed}</p>}
      <form onSubmit={save} className="staff-editor-form"
        onChange={event => {
          const target = event.target;
          if (target instanceof HTMLSelectElement || (target instanceof HTMLInputElement && target.type === "checkbox")) queueSave(event.currentTarget, true);
        }}
        onBlur={event => {
          const target = event.target;
          if (target instanceof HTMLTextAreaElement || (target instanceof HTMLInputElement && target.type !== "checkbox")) {
            if (target.value !== target.defaultValue) queueSave(event.currentTarget, true);
          }
        }}>
        <EditorSection title="Informação básica" description="Identifique a oportunidade e a organização responsável.">
          <label>Título<input name="title" defaultValue={opportunity.title} maxLength={256} required /></label>
          <label>Organização<input name="organization" defaultValue={opportunity.organization || ""} /></label>
          <ChoiceField name="category" label="Categoria principal" options={options.category} value={String(opportunity.category)} />
          <MultipleChoiceField name="categories" label="Categorias adicionais" options={options.category}
            values={(opportunity.categories || []).filter(code => code !== opportunity.category)} />
          <label className="wide">Resumo curto<textarea name="excerpt" defaultValue={opportunity.excerpt || ""} maxLength={512} rows={2} /></label>
          <label className="wide">Descrição<textarea name="description" defaultValue={opportunity.description} rows={6} /></label>
          <label className="wide">URL oficial<input name="official_site_url" type="url" pattern="https?://.+" maxLength={1024} defaultValue={opportunity.official_site_url || ""} /></label>
        </EditorSection>
        <EditorSection title="Público e recomendação" description="Selecione todas as opções aplicáveis. Deixe o campo vazio se o público ainda for desconhecido.">
          <MultipleChoiceField name="target_education_levels" label="Etapas de ensino" options={options.target_education_levels} values={opportunity.target_education_levels || []} />
          <MultipleChoiceField name="target_subjects" label="Assuntos" options={options.target_subjects} values={opportunity.target_subjects || []} />
          <MultipleChoiceField name="target_goals" label="Objetivos" options={options.target_goals} values={opportunity.target_goals || []} />
          <MultipleChoiceField name="recommended_experience_levels" label="Experiência recomendada" options={options.recommended_experience_levels} values={opportunity.recommended_experience_levels || []} />
          <label className="wide">Detalhes do público e exceções<textarea name="target_audience" defaultValue={String(opportunity.target_audience || "")} rows={2} placeholder="Ex.: aceita estudantes do 9º ano que completarão 15 anos até julho." /></label>
        </EditorSection>
        <EditorSection title="Custo e acesso" description="Registre as condições de participação e os idiomas usados no programa.">
          <ChoiceField name="cost_kind" label="Custo" options={options.cost_kind} value={String(opportunity.cost_kind)} />
          <ChoiceField name="scholarship_availability" label="Bolsas" options={options.scholarship_availability} value={String(opportunity.scholarship_availability)} />
          <ChoiceField name="delivery_mode" label="Modalidade" options={options.delivery_mode} value={String(opportunity.delivery_mode)} />
          <label>Localização<input name="location" defaultValue={opportunity.location || ""} /></label>
          <MultipleChoiceField name="languages" label="Idiomas" options={options.languages} values={opportunity.languages || []} />
          <label className="wide">Notas de custo<input name="cost_notes" defaultValue={String(opportunity.cost_notes || "")} /></label>
        </EditorSection>
        <EditorSection title="Ciclo e preparação" description="Informe o intervalo de preparação e as datas de revisão.">
          <ChoiceField name="recurrence_pattern" label="Recorrência" options={options.recurrence_pattern} value={String(opportunity.recurrence_pattern)} />
          <label>Preparação mínima (dias)<input name="preparation_min_days" type="number" min="0" defaultValue={opportunity.preparation_min_days ?? ""} /></label>
          <label>Preparação máxima (dias)<input name="preparation_max_days" type="number" min="0" defaultValue={opportunity.preparation_max_days ?? ""} /></label>
          <label>Verificada em<input name="verified_at" type="date" defaultValue={dateInput(curation.verified_at)} /></label>
          <label>Próxima revisão<input name="next_review_at" type="date" defaultValue={dateInput(curation.next_review_at)} /></label>
        </EditorSection>
        <EditorSection title="Valor editorial" description="Popularidade ajuda a ordenar tarefas. Esta avaliação humana explica por que vale o tempo do estudante.">
          <label>Nota (1–5)<input name="editorial_value_score" type="number" min="1" max="5" defaultValue={String(curation.editorial_value_score ?? "")} /></label><label className="wide">Justificativa<textarea name="editorial_value_reason" rows={3} defaultValue={String(curation.editorial_value_reason || "")} /></label><label className="checkbox wide"><input name="recommendation_enabled" type="checkbox" defaultChecked={Boolean(curation.recommendation_enabled)} /> Permitir recomendação quando todos os outros gates estiverem válidos</label>
        </EditorSection>
        <div className="staff-save-bar"><span role="status">{message || "Alterações são rascunhos até uma publicação explícita."}</span><button className="staff-primary-button" disabled={pending}><Save size={17} />{pending ? "Salvando…" : "Salvar rascunho"}</button></div>
      </form>
      <section className="staff-panel"><div className="staff-panel-heading"><div><span className="staff-eyebrow">Fontes revisadas</span><h2>Materiais</h2></div></div><div className="material-list">{data.materials.map(material => <a key={material.id} href={material.url} target="_blank"><span><strong>{material.title}</strong><small>{material.material_type} · {material.reviewed ? "revisado" : "pendente"}</small></span><ExternalLink size={16} /></a>)}</div><form className="material-add" onSubmit={addMaterial}><input name="material_title" maxLength={256} placeholder="Nome do material" required /><input name="material_url" type="url" pattern="https?://.+" maxLength={2048} placeholder="https://…" required /><select aria-label="Tipo de material" name="material_type">{Object.entries(options.material_type).map(([code, text]) => <option key={code} value={code}>{text}</option>)}</select><button><Plus size={16} />Adicionar revisado</button></form></section>
      {data.metrics && <section className="staff-panel"><div className="staff-panel-heading"><div><span className="staff-eyebrow">Últimos {data.metrics.period_days} dias</span><h2>Contexto de engajamento</h2></div></div><div className="staff-metric-strip"><div><strong>{data.metrics.impressions}</strong><span>impressões</span></div><div><strong>{data.metrics.unique_opens}</strong><span>aberturas únicas</span></div><div><strong>{data.metrics.unique_saves}</strong><span>salvamentos únicos</span></div><div><strong>{data.metrics.application_starts}</strong><span>candidaturas iniciadas</span></div></div><p className="staff-privacy-note">{data.metrics.privacy_threshold_met ? `Taxa de abertura ${Math.round((data.metrics.open_rate || 0) * 100)}% · taxa de salvamento ${Math.round((data.metrics.save_rate || 0) * 100)}%.` : "As taxas ficam ocultas até existirem 10 estudantes únicos no período. Engajamento prioriza a fila, mas nunca muda Stage ou ranking sozinho."}</p></section>}
    </div>
    </div>
    {!showRow && <aside className="staff-checklist"><div className="staff-checklist-sticky"><span className="staff-eyebrow">Checklist objetivo</span><h2>Publicar com confiança</h2><div className="stage-switch"><button className={selectedStage === 1 ? "active" : ""} onClick={() => setSelectedStage(1)}>Stage 1</button><button className={selectedStage === 2 ? "active" : ""} onClick={() => setSelectedStage(2)}>Stage 2</button></div><div className="checklist-progress"><strong>{checklist.items.length - blockers.length}/{checklist.items.length}</strong><span>requisitos atendidos</span></div><ul>{checklist.items.map(item => <li className={item.passed ? "passed" : ""} key={item.key}>{item.passed ? <Check size={15} /> : <Circle size={15} />}<span>{item.label}</span></li>)}</ul><div className="action-preview"><span>Modo sugerido ao estudante</span><strong>{data.preview.action_mode.replaceAll("_", " ")}</strong><small>{data.preview.feed_eligible ? "Elegível para distribuição" : `Pausada: ${data.preview.feed_blockers.join(", ")}`}</small></div><button className="staff-primary-button full" disabled={!checklist.passed || pending} onClick={publish}><ShieldCheck size={17} />Publicar Stage {selectedStage}</button><small className="checklist-note">O servidor recalcula tudo antes de publicar. Esta interface nunca transforma um rascunho em publicação sozinha.</small></div></aside>}
  </div>;
}

function EditorSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="staff-editor-section"><header><h2>{title}</h2><p>{description}</p></header><div className="staff-field-grid">{children}</div></section>; }
