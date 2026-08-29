"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Globe2,
  KeyRound,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import type {
  AdminAccount,
  StudentAdminActivity,
  StudentAdminAudit,
  StudentAdminDetail,
} from "@/types/staff-student";

type Tab = "overview" | "profile" | "recommendation" | "activity" | "metadata";

async function mutate(path: string, method: "PATCH" | "POST", body: unknown) {
  const response = await fetch(`/api/staff/admin/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.detail || "Não foi possível salvar a alteração");
  return data;
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}
function bool(value: unknown) {
  return Boolean(value);
}
function list(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}
function dateValue(value: unknown) {
  return typeof value === "string" && value ? value.slice(0, 10) : "";
}
function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function formatDate(value: unknown) {
  if (typeof value !== "string" || !value) return "Não registrado";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Não registrado"
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}
function formatRelativeDate(value: unknown) {
  if (typeof value !== "string" || !value) return "Não registrado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Não registrado";
  const days = Math.round((date.getTime() - Date.now()) / 86_400_000);
  if (Math.abs(days) > 30) return formatDate(value);
  return new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" }).format(
    days,
    "day",
  );
}
function formatPhone(value: unknown) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55"))
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  if (digits.length === 12 && digits.startsWith("55"))
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  return value ? String(value) : "Não conectado";
}
const technicalLabels: Record<string, string> = {
  student_id: "Student ID",
  identity_id: "Identity ID",
  provider_subject: "Identificador do provedor",
  verification_source: "Origem da verificação",
  verified_at: "Verificado em",
  created_at: "Criado em",
  updated_at: "Atualizado em",
  last_inbound_at: "Última mensagem recebida",
  proactive_messages_enabled: "Mensagens proativas",
  normalization_status: "Normalização",
  taxonomy_version: "Versão da taxonomia",
  source: "Origem",
  status: "Status",
  dimension: "Dimensão",
  canonical_value: "Valor canônico",
  raw_value: "Valor original",
};
function fieldLabel(key: string) {
  return technicalLabels[key] || key.replaceAll("_", " ");
}
function formatFieldValue(key: string, value: unknown) {
  if (typeof value === "boolean") return value ? "Ativado" : "Desativado";
  if (/(?:_at|date)$/.test(key)) return formatDate(value);
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Nenhum";
  if (value && typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function FieldList({
  values,
  expanded = false,
}: {
  values: Record<string, unknown>[];
  expanded?: boolean;
}) {
  if (!values.length)
    return <p className="staff-empty compact">Nenhum registro.</p>;
  return (
    <div className="student-record-list">
      {values.map((value, index) => (
        <article key={String(value.id || index)}>
          <dl>
            {Object.entries(value)
              .filter(
                ([key, item]) =>
                  item !== null &&
                  item !== "" &&
                  !["metadata_json", "payload", "feature_values"].includes(key),
              )
              .slice(0, expanded ? undefined : 8)
              .map(([key, item]) => (
                <div key={key}>
                  <dt>{fieldLabel(key)}</dt>
                  <dd>{formatFieldValue(key, item)}</dd>
                </div>
              ))}
          </dl>
        </article>
      ))}
    </div>
  );
}

function InfoList({
  items,
}: {
  items: { label: string; value: string; hint?: string }[];
}) {
  return (
    <dl className="student-human-list">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>
            {item.value}
            <small>{item.hint}</small>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function StudentWorkspace({
  initialDetail,
  activity,
  audit,
}: {
  initialDetail: StudentAdminDetail;
  activity: StudentAdminActivity;
  audit: StudentAdminAudit;
}) {
  const [detail, setDetail] = useState(initialDetail);
  const [tab, setTab] = useState<Tab>("overview");
  const [reason, setReason] = useState(
    "Correção administrativa solicitada pelo estudante",
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const profile: Record<string, unknown> = detail.profile ?? {};
  const preferences: Record<string, unknown> = detail.preferences ?? {};
  const displayName = text(profile.full_name) || "Student sem nome";

  async function run(
    action: () => Promise<void>,
    success: string | (() => string),
  ) {
    try {
      setError("");
      setMessage("");
      await action();
      setMessage(typeof success === "function" ? success() : success);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha na alteração");
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run(async () => {
      const updated = await mutate(
        `students/${detail.student.id}/profile`,
        "PATCH",
        {
          full_name: form.get("full_name") || null,
          birthdate: form.get("birthdate")
            ? `${form.get("birthdate")}T00:00:00Z`
            : null,
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
          expected_updated_at:
            text(profile.updated_at) || text(detail.student.updated_at),
        },
      );
      setDetail((current) => ({ ...current, profile: updated }));
    }, "Perfil atualizado e registrado na auditoria.");
  }

  async function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    let savedEmbeddingStatus = "PENDING";
    await run(
      async () => {
        const updated = await mutate(
          `students/${detail.student.id}/preferences`,
          "PATCH",
          {
            preferences: {
              subjects: form.getAll("subjects"),
              goals: form.get("goal") ? [form.get("goal")] : [],
              education_levels: form.get("education_level")
                ? [form.get("education_level")]
                : [],
              experience_levels: form.get("experience_level")
                ? [form.get("experience_level")]
                : [],
              current_grade: form.get("current_grade") || null,
              school_type: form.get("school_type") || null,
              activities: text(form.get("activities"))
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
              goal_context: form.get("goal_stage")
                ? { stage: form.get("goal_stage") }
                : {},
              notifications_enabled: form.get("notifications_enabled") === "on",
              prefers_free: form.get("prefers_free") === "on",
              prefers_online: form.get("prefers_online") === "on",
              accepts_english: form.get("accepts_english") === "on",
              wants_international: form.get("wants_international") === "on",
            },
            reason,
            expected_updated_at:
              text(preferences.updated_at) || text(detail.student.updated_at),
          },
        );
        savedEmbeddingStatus = text(updated.embedding_status) || "PENDING";
        setDetail((current) => ({ ...current, preferences: updated }));
      },
      () =>
        savedEmbeddingStatus === "READY"
          ? "Preferências canônicas atualizadas. O embedding já está pronto para as próximas recomendações."
          : "Preferências canônicas atualizadas. O embedding ficou pendente, mas o perfil estruturado já será usado nas próximas recomendações.",
    );
  }

  async function saveAccount(
    event: FormEvent<HTMLFormElement>,
    account: AdminAccount,
  ) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run(async () => {
      const updated = await mutate(`accounts/${account.id}`, "PATCH", {
        email: form.get("email"),
        username: form.get("username"),
        full_name: form.get("full_name") || null,
        reason,
        expected_updated_at: account.updated_at,
      });
      setDetail((current) => ({
        ...current,
        accounts: current.accounts.map((item) =>
          item.id === account.id ? updated : item,
        ),
      }));
    }, "Conta atualizada.");
  }

  async function passwordReset(account: AdminAccount) {
    await run(async () => {
      await mutate(`accounts/${account.id}/password-reset`, "POST", {
        reason,
        expected_updated_at: account.updated_at,
      });
    }, "E-mail de redefinição enviado.");
  }

  async function createTemporaryPassword(account: AdminAccount) {
    await run(async () => {
      const result = await mutate(
        `accounts/${account.id}/temporary-password`,
        "POST",
        { reason, expected_updated_at: account.updated_at },
      );
      setTemporaryPassword(result.temporary_password);
      setDetail((current) => ({
        ...current,
        accounts: current.accounts.map((item) =>
          item.id === account.id
            ? {
                ...item,
                password_change_required: true,
                temporary_password_expires_at: result.expires_at,
              }
            : item,
        ),
      }));
    }, "Senha temporária criada. Ela será mostrada apenas nesta tela.");
  }

  const context = useMemo(
    () =>
      detail.recommendation_context
        ? JSON.stringify(detail.recommendation_context, null, 2)
        : "Sem contexto gerado.",
    [detail.recommendation_context],
  );
  const whatsappIdentity = detail.identities.find(
    (item) => text(item.provider) === "WHATSAPP",
  );
  const whatsappChannel = detail.channels.find(
    (item) =>
      text(item.channel) === "WHATSAPP" && text(item.status) !== "REVOKED",
  );
  const hasWebsite = detail.accounts.length > 0;
  const accessLabel =
    whatsappIdentity && hasWebsite
      ? "Site + WhatsApp"
      : whatsappIdentity
        ? "Só WhatsApp"
        : hasWebsite
          ? "Só site"
          : "Sem acesso ativo";
  const educationLevel = list(preferences.education_levels)[0];
  const goal = list(preferences.goals)[0];
  const goalContext = record(preferences.goal_context);
  const confirmedObservations = detail.observations.filter(
    (item) => text(item.status) === "CONFIRMED",
  ).length;
  const inferredObservations = detail.observations.filter(
    (item) => text(item.status) === "INFERRED",
  ).length;
  const latestRun = record(detail.latest_recommendation.run);
  const stateLabels: Record<string, string> = {
    saved: "Salvas",
    interested: "Com interesse",
    preparing: "Preparando",
    applying: "Aplicando",
    applied: "Aplicadas",
    completed: "Concluídas",
    dismissed: "Dispensadas",
    following: "Acompanhando",
  };
  const taxonomyLabel = (group: Record<string, string>, value: string) =>
    group[value] || value || "Não informado";
  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Visão geral" },
    { id: "profile", label: "Perfil e acesso" },
    { id: "recommendation", label: "Recomendações" },
    { id: "activity", label: "Jornada e atividade" },
    { id: "metadata", label: "Metadados e auditoria" },
  ];

  return (
    <div className="staff-page student-workspace">
      <Link href="/staff/usuarios" className="student-back">
        <ArrowLeft size={15} /> Pessoas e acessos
      </Link>
      <header className="staff-page-header compact">
        <div>
          <span className="staff-eyebrow">Student canônico</span>
          <h1>{displayName}</h1>
          <p>
            {accessLabel} · perfil criado em{" "}
            {formatDate(detail.student.created_at)}
          </p>
        </div>
        <span
          className={`status-pill ${String(detail.student.status).toLowerCase()}`}
        >
          {String(detail.student.status) === "ACTIVE"
            ? "Ativo"
            : String(detail.student.status) === "DISABLED"
              ? "Desativado"
              : "Mesclado"}
        </span>
      </header>
      <nav
        className="student-workspace-tabs"
        aria-label="Informações do Student"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            className={tab === item.id ? "active" : ""}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      {(message || error) && (
        <div className={`student-workspace-notice ${error ? "error" : ""}`}>
          {error || message}
        </div>
      )}
      <label className="student-admin-reason">
        Motivo das alterações
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </label>

      {tab === "overview" && (
        <div className="student-overview-stack">
          <section className="student-overview-hero">
            <div>
              <span className="staff-eyebrow">Resumo</span>
              <h2>
                {detail.preferences
                  ? "Perfil pronto para personalização"
                  : "Onboarding ainda incompleto"}
              </h2>
              <p>
                Uma única identidade de recomendação, independentemente do canal
                usado pelo estudante.
              </p>
            </div>
            <div className="student-hero-facts">
              <span>
                <Globe2 size={15} />
                {accessLabel}
              </span>
              <span>
                <Activity size={15} />
                {formatRelativeDate(
                  detail.journey_summary.last_activity_at ||
                    whatsappChannel?.last_inbound_at,
                )}
              </span>
              <span>
                <Sparkles size={15} />
                {text(preferences.embedding_status) === "READY"
                  ? "Embedding pronto"
                  : "Embedding pendente"}
              </span>
            </div>
          </section>
          <div className="student-overview-grid humanized">
            <section className="staff-editor-section">
              <header>
                <UserRound size={19} />
                <div>
                  <span className="staff-eyebrow">Dados do estudante</span>
                  <h2>Perfil declarado</h2>
                </div>
              </header>
              <InfoList
                items={[
                  { label: "Nome", value: displayName },
                  {
                    label: "Etapa educacional",
                    value: taxonomyLabel(
                      detail.taxonomy.education_levels,
                      educationLevel,
                    ),
                  },
                  {
                    label: "Série atual",
                    value: taxonomyLabel(
                      detail.taxonomy.education_levels,
                      text(preferences.current_grade),
                    ),
                  },
                  {
                    label: "Escola ou organização",
                    value: text(profile.organization) || "Não informada",
                  },
                  {
                    label: "Localização",
                    value: text(profile.location) || "Não informada",
                  },
                ]}
              />
            </section>
            <section className="staff-editor-section">
              <header>
                <Smartphone size={19} />
                <div>
                  <span className="staff-eyebrow">Acessos conectados</span>
                  <h2>{accessLabel}</h2>
                </div>
              </header>
              <div className="student-access-cards">
                {whatsappIdentity && (
                  <article>
                    <b>WhatsApp</b>
                    <strong>
                      {formatPhone(whatsappIdentity.provider_subject)}
                    </strong>
                    <span>
                      {text(whatsappChannel?.status) === "ACTIVE"
                        ? "Canal ativo"
                        : "Identidade verificada"}{" "}
                      · última mensagem{" "}
                      {formatRelativeDate(whatsappChannel?.last_inbound_at)}
                    </span>
                    <small>
                      Mensagens proativas:{" "}
                      {bool(whatsappChannel?.proactive_messages_enabled)
                        ? "ativadas"
                        : "desativadas"}
                    </small>
                  </article>
                )}
                {detail.accounts.map((account) => (
                  <article key={account.id}>
                    <b>Site</b>
                    <strong>{account.email}</strong>
                    <span>
                      {account.is_active ? "Conta ativa" : "Conta desativada"}
                    </span>
                    <small>
                      Senha:{" "}
                      {account.password_change_required
                        ? "troca obrigatória"
                        : "configurada"}
                    </small>
                  </article>
                ))}
                {!whatsappIdentity && !detail.accounts.length && (
                  <p className="staff-empty compact">
                    Nenhum acesso ativo conectado.
                  </p>
                )}
              </div>
            </section>
            <section className="staff-editor-section recommendation-profile-card">
              <header>
                <Target size={19} />
                <div>
                  <span className="staff-eyebrow">Perfil de recomendação</span>
                  <h2>
                    {goal
                      ? taxonomyLabel(detail.taxonomy.primary_goals, goal)
                      : "Objetivo ainda não informado"}
                  </h2>
                </div>
              </header>
              {detail.preferences ? (
                <>
                  <div className="student-preference-groups">
                    <div>
                      <span>Matérias</span>
                      <p>
                        {list(preferences.subjects)
                          .map((item) =>
                            taxonomyLabel(detail.taxonomy.subjects, item),
                          )
                          .join(" · ") || "Não informadas"}
                      </p>
                    </div>
                    <div>
                      <span>Contexto do objetivo</span>
                      <p>
                        {taxonomyLabel(
                          detail.taxonomy.goal_stages,
                          text(goalContext.stage),
                        )}
                      </p>
                    </div>
                    <div>
                      <span>Atividades e interesses</span>
                      <p>
                        {list(preferences.activities).join(" · ") ||
                          "Não informados"}
                      </p>
                    </div>
                    <div>
                      <span>Preferências práticas</span>
                      <p>
                        {[
                          ["prefers_free", "Gratuitas"],
                          ["prefers_online", "Online"],
                          ["accepts_english", "Aceita inglês"],
                          ["wants_international", "Internacionais"],
                        ]
                          .filter(([key]) => bool(preferences[key]))
                          .map(([, label]) => label)
                          .join(" · ") || "Nenhuma marcada"}
                      </p>
                    </div>
                  </div>
                  <footer>
                    <span>{confirmedObservations} sinais confirmados</span>
                    <span>{inferredObservations} inferências</span>
                    <span>Taxonomia v{detail.taxonomy.taxonomy_version}</span>
                  </footer>
                </>
              ) : (
                <p className="student-overview-empty">
                  Este Student ainda não concluiu o contexto mínimo para
                  recomendações personalizadas.
                </p>
              )}
            </section>
            <section className="staff-editor-section">
              <header>
                <Activity size={19} />
                <div>
                  <span className="staff-eyebrow">Jornada</span>
                  <h2>
                    {detail.journey_summary.total} oportunidades relacionadas
                  </h2>
                </div>
              </header>
              {detail.journey_summary.total ? (
                <>
                  <div className="student-journey-metrics">
                    {Object.entries(detail.journey_summary.by_state).map(
                      ([state, count]) => (
                        <div key={state}>
                          <b>{count}</b>
                          <span>{stateLabels[state] || state}</span>
                        </div>
                      ),
                    )}
                  </div>
                  <p>
                    Última movimentação{" "}
                    {formatRelativeDate(
                      detail.journey_summary.last_activity_at,
                    )}
                    .
                  </p>
                </>
              ) : (
                <p className="student-overview-empty">
                  Ainda não salvou, acompanhou ou iniciou nenhuma oportunidade.
                </p>
              )}
            </section>
            <section className="staff-editor-section recommendation-signals-card">
              <header>
                <Sparkles size={19} />
                <div>
                  <span className="staff-eyebrow">Sinais e recomendações</span>
                  <h2>
                    {latestRun.created_at
                      ? "Recomendador já executado"
                      : "Sem recomendações registradas"}
                  </h2>
                </div>
              </header>
              {latestRun.created_at ? (
                <InfoList
                  items={[
                    {
                      label: "Última execução",
                      value: formatDate(latestRun.created_at),
                      hint: text(latestRun.surface)
                        ? `Canal: ${text(latestRun.surface)}`
                        : undefined,
                    },
                    {
                      label: "Versão do algoritmo",
                      value:
                        text(latestRun.algorithm_version) || "Não registrada",
                    },
                    {
                      label: "Oportunidades exibidas",
                      value: String(
                        detail.latest_recommendation.impressions.length,
                      ),
                    },
                    {
                      label: "Contexto",
                      value: `Schema v${String(latestRun.context_schema_version || "—")}`,
                    },
                  ]}
                />
              ) : (
                <p className="student-overview-empty">
                  Quando uma recomendação for gerada, esta área mostrará o
                  canal, a versão e os resultados apresentados.
                </p>
              )}
              <div className="student-learning-note">
                <b>Aprendizado comportamental ainda não altera o ranking.</b>
                <span>
                  As interações estão sendo preservadas como sinais para a
                  evolução futura; hoje, as próximas recomendações usam o perfil
                  canônico acima.
                </span>
              </div>
            </section>
          </div>
        </div>
      )}

      {tab === "profile" && (
        <div className="student-editor-stack">
          <form
            className="staff-editor-section staff-editor-form"
            onSubmit={saveProfile}
          >
            <header>
              <span className="staff-eyebrow">Perfil canônico</span>
              <h2>Dados declarados pelo Student</h2>
              <p>
                Campos compartilhados também são sincronizados com a conta
                legada vinculada.
              </p>
            </header>
            <div className="staff-field-grid">
              <label>
                Nome completo
                <input
                  name="full_name"
                  defaultValue={text(profile.full_name)}
                />
              </label>
              <label>
                Data de nascimento
                <input
                  name="birthdate"
                  type="date"
                  defaultValue={dateValue(profile.birthdate)}
                />
              </label>
              <label>
                Título público
                <input
                  name="public_title"
                  defaultValue={text(profile.public_title)}
                />
              </label>
              <label>
                Escola ou organização
                <input
                  name="organization"
                  defaultValue={text(profile.organization)}
                />
              </label>
              <label>
                Localização
                <input name="location" defaultValue={text(profile.location)} />
              </label>
              <label>
                Foto de perfil
                <input
                  name="profile_picture_url"
                  type="url"
                  defaultValue={text(profile.profile_picture_url)}
                />
              </label>
              <label>
                Instagram
                <input
                  name="instagram"
                  defaultValue={text(profile.instagram)}
                />
              </label>
              <label>
                LinkedIn
                <input name="linkedin" defaultValue={text(profile.linkedin)} />
              </label>
              <label className="wide">
                Bio
                <textarea
                  name="bio"
                  rows={4}
                  defaultValue={text(profile.bio)}
                />
              </label>
              <label className="checkbox">
                <input
                  name="opportunities_enabled"
                  type="checkbox"
                  defaultChecked={bool(profile.opportunities_enabled)}
                />{" "}
                Receber oportunidades
              </label>
              <label className="checkbox">
                <input
                  name="matching_enabled"
                  type="checkbox"
                  defaultChecked={bool(profile.matching_enabled)}
                />{" "}
                Matching habilitado
              </label>
              <label className="checkbox">
                <input
                  name="private_account"
                  type="checkbox"
                  defaultChecked={profile.private_account !== false}
                />{" "}
                Conta privada
              </label>
            </div>
            <button className="staff-primary-button" disabled={!reason.trim()}>
              Salvar perfil
            </button>
          </form>
          {detail.accounts.map((account) => (
            <form
              className="staff-editor-section staff-editor-form"
              key={account.id}
              onSubmit={(event) => saveAccount(event, account)}
            >
              <header>
                <span className="staff-eyebrow">Conta vinculada</span>
                <h2>{account.email}</h2>
                <p>A senha atual nunca é recuperável ou exibida.</p>
              </header>
              <div className="staff-field-grid">
                <label>
                  E-mail
                  <input
                    name="email"
                    type="email"
                    defaultValue={account.email}
                  />
                </label>
                <label>
                  Username
                  <input name="username" defaultValue={account.username} />
                </label>
                <label>
                  Nome da conta
                  <input
                    name="full_name"
                    defaultValue={account.full_name || ""}
                  />
                </label>
                <div className="student-credential-status">
                  <ShieldCheck size={17} />
                  <span>
                    {account.password_change_required
                      ? "Troca de senha obrigatória"
                      : `Senha alterada: ${formatDate(account.password_changed_at)}`}
                  </span>
                </div>
              </div>
              <div className="student-account-actions">
                <button className="staff-primary-button">Salvar conta</button>
                <button
                  type="button"
                  className="staff-secondary-button"
                  onClick={() => passwordReset(account)}
                >
                  Enviar redefinição
                </button>
                <button
                  type="button"
                  className="staff-secondary-button danger"
                  onClick={() => createTemporaryPassword(account)}
                >
                  <KeyRound size={15} /> Emergência
                </button>
              </div>
            </form>
          ))}
          {temporaryPassword && (
            <section className="temporary-password-card">
              <CheckCircle2 size={20} />
              <div>
                <strong>Senha temporária — exibição única</strong>
                <code>{temporaryPassword}</code>
                <small>
                  Expira em uma hora e exige troca antes de qualquer acesso.
                </small>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(temporaryPassword)}
                aria-label="Copiar senha temporária"
              >
                <Copy size={16} />
              </button>
            </section>
          )}
        </div>
      )}

      {tab === "recommendation" && (
        <div className="student-editor-stack">
          <form
            className="staff-editor-section staff-editor-form"
            onSubmit={savePreferences}
          >
            <header>
              <span className="staff-eyebrow">Snapshot canônico</span>
              <h2>Preferências confirmadas</h2>
              <p>
                Alterações criam proveniência ADMIN_CORRECTION e não modificam
                inferências ou eventos.
              </p>
            </header>
            <div className="staff-field-grid">
              <label>
                Etapa educacional
                <select
                  name="education_level"
                  defaultValue={list(preferences.education_levels)[0] || ""}
                >
                  <option value="">Não informado</option>
                  {Object.entries(detail.taxonomy.education_levels).map(
                    ([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label>
                Série atual
                <input
                  name="current_grade"
                  defaultValue={text(preferences.current_grade)}
                />
              </label>
              <label>
                Objetivo principal
                <select
                  name="goal"
                  defaultValue={list(preferences.goals)[0] || ""}
                >
                  <option value="">Não informado</option>
                  {Object.entries(detail.taxonomy.primary_goals).map(
                    ([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label>
                Etapa do objetivo
                <select
                  name="goal_stage"
                  defaultValue={text(
                    (
                      preferences.goal_context as
                        | Record<string, unknown>
                        | undefined
                    )?.stage,
                  )}
                >
                  <option value="">Não informado</option>
                  {Object.entries(detail.taxonomy.goal_stages).map(
                    ([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label>
                Experiência
                <select
                  name="experience_level"
                  defaultValue={list(preferences.experience_levels)[0] || ""}
                >
                  <option value="">Não informado</option>
                  {Object.entries(detail.taxonomy.experience_levels).map(
                    ([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label>
                Tipo de escola
                <input
                  name="school_type"
                  defaultValue={text(preferences.school_type)}
                />
              </label>
              <label className="wide">
                Atividades
                <input
                  name="activities"
                  defaultValue={list(preferences.activities).join(", ")}
                  placeholder="Pesquisa, liderança, projetos"
                />
              </label>
              <fieldset className="wide student-subjects">
                <legend>Matérias</legend>
                {Object.entries(detail.taxonomy.subjects).map(
                  ([value, label]) => (
                    <label key={value}>
                      <input
                        type="checkbox"
                        name="subjects"
                        value={value}
                        defaultChecked={list(preferences.subjects).includes(
                          value,
                        )}
                      />
                      {label}
                    </label>
                  ),
                )}
              </fieldset>
              <fieldset className="wide student-constraints">
                <legend>Restrições e preferências práticas</legend>
                {[
                  ["notifications_enabled", "Notificações"],
                  ["prefers_free", "Prefere gratuitas"],
                  ["prefers_online", "Prefere online"],
                  ["accepts_english", "Aceita inglês"],
                  ["wants_international", "Interesse internacional"],
                ].map(([name, label]) => (
                  <label key={name}>
                    <input
                      type="checkbox"
                      name={name}
                      defaultChecked={bool(preferences[name])}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
            </div>
            <button className="staff-primary-button" disabled={!reason.trim()}>
              Salvar preferências
            </button>
          </form>
          <section className="staff-editor-section">
            <header>
              <span className="staff-eyebrow">Sinais preservados</span>
              <h2>Observações e inferências</h2>
            </header>
            <FieldList values={detail.observations} />
          </section>
          <section className="staff-editor-section">
            <header>
              <span className="staff-eyebrow">Contexto efetivo</span>
              <h2>Resumo usado pelo recomendador</h2>
            </header>
            <pre className="student-json">{context}</pre>
          </section>
        </div>
      )}

      {tab === "activity" && (
        <div className="student-editor-stack">
          <section className="staff-editor-section">
            <header>
              <span className="staff-eyebrow">Jornada</span>
              <h2>Oportunidades acompanhadas</h2>
            </header>
            <FieldList values={activity.journeys} />
          </section>
          <section className="staff-editor-section">
            <header>
              <span className="staff-eyebrow">Comportamento</span>
              <h2>Eventos recentes</h2>
            </header>
            <FieldList
              values={[...activity.behavior_events, ...activity.journey_events]}
            />
          </section>
          <section className="staff-editor-section">
            <header>
              <span className="staff-eyebrow">Feedback explícito</span>
              <h2>Respostas às recomendações</h2>
            </header>
            <FieldList values={activity.feedback} />
          </section>
        </div>
      )}

      {tab === "metadata" && (
        <div className="student-editor-stack">
          <section className="staff-editor-section">
            <header>
              <span className="staff-eyebrow">Identidades técnicas</span>
              <h2>Canais, provedores e vínculos</h2>
              <p>
                Dados de diagnóstico preservados fora da visão operacional
                principal.
              </p>
            </header>
            <details className="student-technical-details">
              <summary>Identidades verificadas</summary>
              <FieldList values={detail.identities} expanded />
            </details>
            <details className="student-technical-details">
              <summary>Canais de entrega</summary>
              <FieldList values={detail.channels} expanded />
            </details>
            <details className="student-technical-details">
              <summary>Vínculos legados</summary>
              <FieldList values={detail.legacy_links} expanded />
            </details>
            <details className="student-technical-details">
              <summary>Estado técnico do perfil</summary>
              <FieldList
                values={[
                  {
                    student_id: detail.student.id,
                    created_at: detail.student.created_at,
                    updated_at: detail.student.updated_at,
                    normalization_status:
                      detail.preferences?.normalization_status,
                    taxonomy_version: detail.preferences?.taxonomy_version,
                    preference_schema_version:
                      detail.preferences?.preference_schema_version,
                    preference_provenance:
                      detail.preferences?.preference_provenance,
                  },
                ]}
                expanded
              />
            </details>
          </section>
          <section className="staff-editor-section">
            <header>
              <span className="staff-eyebrow">Auditoria imutável</span>
              <h2>Alterações administrativas</h2>
            </header>
            <FieldList values={audit.data} expanded />
          </section>
        </div>
      )}
    </div>
  );
}
