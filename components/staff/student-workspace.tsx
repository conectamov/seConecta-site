"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Copy, KeyRound, ShieldCheck } from "lucide-react";
import type { AdminAccount, StudentAdminActivity, StudentAdminAudit, StudentAdminDetail } from "@/types/staff-student";

type Tab = "overview" | "profile" | "recommendation" | "activity" | "metadata";

async function mutate(path: string, method: "PATCH" | "POST", body: unknown) {
  const response = await fetch(`/api/staff/admin/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Não foi possível salvar a alteração");
  return data;
}

function text(value: unknown) { return typeof value === "string" ? value : ""; }
function bool(value: unknown) { return Boolean(value); }
function list(value: unknown) { return Array.isArray(value) ? value.map(String) : []; }
function dateValue(value: unknown) { return typeof value === "string" && value ? value.slice(0, 10) : ""; }
function formatDate(value: unknown) { return typeof value === "string" && value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Não registrado"; }

function FieldList({ values }: { values: Record<string, unknown>[] }) {
  if (!values.length) return <p className="staff-empty compact">Nenhum registro.</p>;
  return <div className="student-record-list">{values.map((value, index) => <article key={String(value.id || index)}><dl>{Object.entries(value).filter(([key, item]) => item !== null && item !== "" && !["metadata_json", "payload"].includes(key)).slice(0, 8).map(([key, item]) => <div key={key}><dt>{key.replaceAll("_", " ")}</dt><dd>{typeof item === "object" ? JSON.stringify(item) : String(item)}</dd></div>)}</dl></article>)}</div>;
}

export function StudentWorkspace({ initialDetail, activity, audit }: { initialDetail: StudentAdminDetail; activity: StudentAdminActivity; audit: StudentAdminAudit }) {
  const [detail, setDetail] = useState(initialDetail);
  const [tab, setTab] = useState<Tab>("overview");
  const [reason, setReason] = useState("Correção administrativa solicitada pelo estudante");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const profile: Record<string, unknown> = detail.profile ?? {};
  const preferences: Record<string, unknown> = detail.preferences ?? {};
  const displayName = text(profile.full_name) || "Student sem nome";

  async function run(action: () => Promise<void>, success: string) {
    try { setError(""); setMessage(""); await action(); setMessage(success); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Falha na alteração"); }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run(async () => {
      const updated = await mutate(`students/${detail.student.id}/profile`, "PATCH", {
        full_name: form.get("full_name") || null,
        birthdate: form.get("birthdate") ? `${form.get("birthdate")}T00:00:00Z` : null,
        public_title: form.get("public_title") || null,
        organization: form.get("organization") || null,
        location: form.get("location") || null,
        bio: form.get("bio") || null,
        profile_picture_url: form.get("profile_picture_url") || null,
        instagram: form.get("instagram") || null,
        linkedin: form.get("linkedin") || null,
        matching_enabled: form.get("matching_enabled") === "on",
        opportunities_enabled: form.get("opportunities_enabled") === "on",
        private_account: form.get("private_account") === "on",
        reason,
        expected_updated_at: text(profile.updated_at) || text(detail.student.updated_at),
      });
      setDetail(current => ({ ...current, profile: updated }));
    }, "Perfil atualizado e registrado na auditoria.");
  }

  async function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run(async () => {
      const updated = await mutate(`students/${detail.student.id}/preferences`, "PATCH", {
        preferences: {
          subjects: form.getAll("subjects"),
          goals: form.get("goal") ? [form.get("goal")] : [],
          education_levels: form.get("education_level") ? [form.get("education_level")] : [],
          experience_levels: form.get("experience_level") ? [form.get("experience_level")] : [],
          current_grade: form.get("current_grade") || null,
          school_type: form.get("school_type") || null,
          activities: text(form.get("activities")).split(",").map(item => item.trim()).filter(Boolean),
          goal_context: form.get("goal_stage") ? { stage: form.get("goal_stage") } : {},
          notifications_enabled: form.get("notifications_enabled") === "on",
          prefers_free: form.get("prefers_free") === "on",
          prefers_online: form.get("prefers_online") === "on",
          accepts_english: form.get("accepts_english") === "on",
          wants_international: form.get("wants_international") === "on",
        },
        reason,
        expected_updated_at: text(preferences.updated_at) || text(detail.student.updated_at),
      });
      setDetail(current => ({ ...current, preferences: updated }));
    }, "Preferências canônicas atualizadas.");
  }

  async function saveAccount(event: FormEvent<HTMLFormElement>, account: AdminAccount) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run(async () => {
      const updated = await mutate(`accounts/${account.id}`, "PATCH", {
        email: form.get("email"), username: form.get("username"), full_name: form.get("full_name") || null,
        reason, expected_updated_at: account.updated_at,
      });
      setDetail(current => ({ ...current, accounts: current.accounts.map(item => item.id === account.id ? updated : item) }));
    }, "Conta atualizada.");
  }

  async function passwordReset(account: AdminAccount) {
    await run(async () => { await mutate(`accounts/${account.id}/password-reset`, "POST", { reason, expected_updated_at: account.updated_at }); }, "E-mail de redefinição enviado.");
  }

  async function createTemporaryPassword(account: AdminAccount) {
    await run(async () => {
      const result = await mutate(`accounts/${account.id}/temporary-password`, "POST", { reason, expected_updated_at: account.updated_at });
      setTemporaryPassword(result.temporary_password);
      setDetail(current => ({ ...current, accounts: current.accounts.map(item => item.id === account.id ? { ...item, password_change_required: true, temporary_password_expires_at: result.expires_at } : item) }));
    }, "Senha temporária criada. Ela será mostrada apenas nesta tela.");
  }

  const context = useMemo(() => detail.recommendation_context ? JSON.stringify(detail.recommendation_context, null, 2) : "Sem contexto gerado.", [detail.recommendation_context]);
  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Visão geral" }, { id: "profile", label: "Perfil e acesso" }, { id: "recommendation", label: "Recomendações" }, { id: "activity", label: "Jornada e atividade" }, { id: "metadata", label: "Metadados e auditoria" },
  ];

  return <div className="staff-page student-workspace">
    <Link href="/staff/usuarios" className="student-back"><ArrowLeft size={15} /> Pessoas e acessos</Link>
    <header className="staff-page-header compact"><div><span className="staff-eyebrow">Student canônico</span><h1>{displayName}</h1><p>{detail.student.id} · criado em {formatDate(detail.student.created_at)}</p></div><span className={`status-pill ${String(detail.student.status).toLowerCase()}`}>{String(detail.student.status)}</span></header>
    <nav className="student-workspace-tabs" aria-label="Informações do Student">{tabs.map(item => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>{item.label}</button>)}</nav>
    {(message || error) && <div className={`student-workspace-notice ${error ? "error" : ""}`}>{error || message}</div>}
    <label className="student-admin-reason">Motivo das alterações<input value={reason} onChange={event => setReason(event.target.value)} /></label>

    {tab === "overview" && <div className="student-overview-grid">
      <section className="staff-editor-section"><header><span className="staff-eyebrow">Identidade</span><h2>Canais e autenticação</h2></header><FieldList values={detail.identities} /><FieldList values={detail.channels} />{detail.accounts.length === 0 && <p className="student-auth-note">Autenticação por WhatsApp · sem conta de e-mail/senha.</p>}</section>
      <section className="staff-editor-section"><header><span className="staff-eyebrow">Jornada</span><h2>{detail.journey_summary.total} oportunidades relacionadas</h2></header><div className="student-summary-pills">{Object.entries(detail.journey_summary.by_state).map(([state, count]) => <span key={state}>{state}: <b>{count}</b></span>)}</div><p>Última atividade: {formatDate(detail.journey_summary.last_activity_at)}</p></section>
      <section className="staff-editor-section"><header><span className="staff-eyebrow">Onboarding</span><h2>{detail.preferences ? "Perfil de recomendação disponível" : "Onboarding ainda incompleto"}</h2></header><p>Taxonomia v{detail.taxonomy.taxonomy_version} · embedding {text(preferences.embedding_status) || "não criado"}</p><p>{detail.observations.length} observações preservadas entre confirmações e inferências.</p></section>
      <section className="staff-editor-section"><header><span className="staff-eyebrow">Conta</span><h2>{detail.accounts.length ? `${detail.accounts.length} conta(s) vinculada(s)` : "WhatsApp-only"}</h2></header>{detail.accounts.map(account => <p key={account.id}>{account.email} · {account.staff_role || "Regular"}</p>)}</section>
    </div>}

    {tab === "profile" && <div className="student-editor-stack">
      <form className="staff-editor-section staff-editor-form" onSubmit={saveProfile}><header><span className="staff-eyebrow">Perfil canônico</span><h2>Dados declarados pelo Student</h2><p>Campos compartilhados também são sincronizados com a conta legada vinculada.</p></header><div className="staff-field-grid">
        <label>Nome completo<input name="full_name" defaultValue={text(profile.full_name)} /></label><label>Data de nascimento<input name="birthdate" type="date" defaultValue={dateValue(profile.birthdate)} /></label><label>Título público<input name="public_title" defaultValue={text(profile.public_title)} /></label><label>Escola ou organização<input name="organization" defaultValue={text(profile.organization)} /></label><label>Localização<input name="location" defaultValue={text(profile.location)} /></label><label>Foto de perfil<input name="profile_picture_url" type="url" defaultValue={text(profile.profile_picture_url)} /></label><label>Instagram<input name="instagram" defaultValue={text(profile.instagram)} /></label><label>LinkedIn<input name="linkedin" defaultValue={text(profile.linkedin)} /></label><label className="wide">Bio<textarea name="bio" rows={4} defaultValue={text(profile.bio)} /></label>
        <label className="checkbox"><input name="opportunities_enabled" type="checkbox" defaultChecked={bool(profile.opportunities_enabled)} /> Receber oportunidades</label><label className="checkbox"><input name="matching_enabled" type="checkbox" defaultChecked={bool(profile.matching_enabled)} /> Matching habilitado</label><label className="checkbox"><input name="private_account" type="checkbox" defaultChecked={profile.private_account !== false} /> Conta privada</label>
      </div><button className="staff-primary-button" disabled={!reason.trim()}>Salvar perfil</button></form>
      {detail.accounts.map(account => <form className="staff-editor-section staff-editor-form" key={account.id} onSubmit={event => saveAccount(event, account)}><header><span className="staff-eyebrow">Conta vinculada</span><h2>{account.email}</h2><p>A senha atual nunca é recuperável ou exibida.</p></header><div className="staff-field-grid"><label>E-mail<input name="email" type="email" defaultValue={account.email} /></label><label>Username<input name="username" defaultValue={account.username} /></label><label>Nome da conta<input name="full_name" defaultValue={account.full_name || ""} /></label><div className="student-credential-status"><ShieldCheck size={17} /><span>{account.password_change_required ? "Troca de senha obrigatória" : `Senha alterada: ${formatDate(account.password_changed_at)}`}</span></div></div><div className="student-account-actions"><button className="staff-primary-button">Salvar conta</button><button type="button" className="staff-secondary-button" onClick={() => passwordReset(account)}>Enviar redefinição</button><button type="button" className="staff-secondary-button danger" onClick={() => createTemporaryPassword(account)}><KeyRound size={15} /> Emergência</button></div></form>)}
      {temporaryPassword && <section className="temporary-password-card"><CheckCircle2 size={20} /><div><strong>Senha temporária — exibição única</strong><code>{temporaryPassword}</code><small>Expira em uma hora e exige troca antes de qualquer acesso.</small></div><button onClick={() => navigator.clipboard.writeText(temporaryPassword)} aria-label="Copiar senha temporária"><Copy size={16} /></button></section>}
    </div>}

    {tab === "recommendation" && <div className="student-editor-stack"><form className="staff-editor-section staff-editor-form" onSubmit={savePreferences}><header><span className="staff-eyebrow">Snapshot canônico</span><h2>Preferências confirmadas</h2><p>Alterações criam proveniência ADMIN_CORRECTION e não modificam inferências ou eventos.</p></header><div className="staff-field-grid">
      <label>Etapa educacional<select name="education_level" defaultValue={list(preferences.education_levels)[0] || ""}><option value="">Não informado</option>{Object.entries(detail.taxonomy.education_levels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Série atual<input name="current_grade" defaultValue={text(preferences.current_grade)} /></label><label>Objetivo principal<select name="goal" defaultValue={list(preferences.goals)[0] || ""}><option value="">Não informado</option>{Object.entries(detail.taxonomy.primary_goals).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Etapa do objetivo<select name="goal_stage" defaultValue={text((preferences.goal_context as Record<string, unknown> | undefined)?.stage)}><option value="">Não informado</option>{Object.entries(detail.taxonomy.goal_stages).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Experiência<select name="experience_level" defaultValue={list(preferences.experience_levels)[0] || ""}><option value="">Não informado</option>{Object.entries(detail.taxonomy.experience_levels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Tipo de escola<input name="school_type" defaultValue={text(preferences.school_type)} /></label><label className="wide">Atividades<input name="activities" defaultValue={list(preferences.activities).join(", ")} placeholder="Pesquisa, liderança, projetos" /></label><fieldset className="wide student-subjects"><legend>Matérias</legend>{Object.entries(detail.taxonomy.subjects).map(([value, label]) => <label key={value}><input type="checkbox" name="subjects" value={value} defaultChecked={list(preferences.subjects).includes(value)} />{label}</label>)}</fieldset><fieldset className="wide student-constraints"><legend>Restrições e preferências práticas</legend>{[["notifications_enabled", "Notificações"], ["prefers_free", "Prefere gratuitas"], ["prefers_online", "Prefere online"], ["accepts_english", "Aceita inglês"], ["wants_international", "Interesse internacional"]].map(([name, label]) => <label key={name}><input type="checkbox" name={name} defaultChecked={bool(preferences[name])} />{label}</label>)}</fieldset>
    </div><button className="staff-primary-button" disabled={!reason.trim()}>Salvar preferências</button></form><section className="staff-editor-section"><header><span className="staff-eyebrow">Sinais preservados</span><h2>Observações e inferências</h2></header><FieldList values={detail.observations} /></section><section className="staff-editor-section"><header><span className="staff-eyebrow">Contexto efetivo</span><h2>Resumo usado pelo recomendador</h2></header><pre className="student-json">{context}</pre></section></div>}

    {tab === "activity" && <div className="student-editor-stack"><section className="staff-editor-section"><header><span className="staff-eyebrow">Jornada</span><h2>Oportunidades acompanhadas</h2></header><FieldList values={activity.journeys} /></section><section className="staff-editor-section"><header><span className="staff-eyebrow">Comportamento</span><h2>Eventos recentes</h2></header><FieldList values={[...activity.behavior_events, ...activity.journey_events]} /></section><section className="staff-editor-section"><header><span className="staff-eyebrow">Feedback explícito</span><h2>Respostas às recomendações</h2></header><FieldList values={activity.feedback} /></section></div>}

    {tab === "metadata" && <div className="student-editor-stack"><section className="staff-editor-section"><header><span className="staff-eyebrow">Compatibilidade</span><h2>Vínculos e metadados</h2></header><FieldList values={detail.legacy_links} /><pre className="student-json">{JSON.stringify({ student: detail.student, preferences: detail.preferences ? { normalization_status: detail.preferences.normalization_status, taxonomy_version: detail.preferences.taxonomy_version, preference_schema_version: detail.preferences.preference_schema_version, preference_provenance: detail.preferences.preference_provenance } : null }, null, 2)}</pre></section><section className="staff-editor-section"><header><span className="staff-eyebrow">Auditoria imutável</span><h2>Alterações administrativas</h2></header><FieldList values={audit.data} /></section></div>}
  </div>;
}
