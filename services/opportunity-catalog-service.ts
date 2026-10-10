import "server-only";

import type { OpportunityDetail } from "@/types/opportunity-detail";
import type { OpportunityCatalogItemApi, OpportunityCatalogListApi, OpportunityDetailApi } from "@/types/seconecta-api";
import type { OpportunityGuideDocument } from "@/types/opportunity-knowledge-hub";

const typeLabels: Record<string, string> = { OLYMPIAD: "Olimpíada", RESEARCH: "Pesquisa", SCHOLARSHIP: "Bolsa", SUMMER_PROGRAM: "Programa de Verão", COMPETITION: "Competição", EVENT: "Evento", HACKATHON: "Hackathon", VOLUNTEERING: "Voluntariado", MENTORSHIP: "Mentoria", MUN: "Simulação da ONU", EXTRACURRICULAR: "Programa extracurricular", INITIATIVE: "Iniciativa", WORKSHOP: "Workshop", POST: "Conteúdo" };
const educationLabels: Record<string, string> = { MIDDLE_SCHOOL: "Ensino Fundamental II", HIGH_SCHOOL: "Ensino Médio", FUNDAMENTAL_2: "Ensino Fundamental II", ENSINO_MEDIO_1: "1º ano do Ensino Médio", ENSINO_MEDIO_2: "2º ano do Ensino Médio", ENSINO_MEDIO_3: "3º ano do Ensino Médio", GAP_YEAR: "Gap year", UNDERGRAD: "Universidade", UNDERGRADUATE: "Universidade", OTHER: "Outros" };
const competitivenessLabels: Record<string, string> = { LOW: "Acessível", MEDIUM: "Competitiva", HIGH: "Muito competitiva", UNKNOWN: "Não informada" };
const languageLabels: Record<string, string> = { "pt-BR": "Português", pt: "Português", en: "Inglês", es: "Espanhol" };

function apiRoot() {
  const configured = process.env.SECONNECTA_API_URL?.replace(/\/+$/, "");
  if (!configured) throw new Error("SECONNECTA_API_URL is not configured");
  return configured.endsWith("/api/v1") ? configured : `${configured}/api/v1`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Prazo não informado";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

function readString(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) if (typeof record[key] === "string") return record[key] as string;
  return "";
}

function readStringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function mapTimeline(records: Array<Record<string, unknown>>, item: OpportunityDetailApi): OpportunityDetail["timeline"] {
  const mapped = records.map((record) => ({ date: readString(record, "date", "when"), label: readString(record, "label", "title", "name"), detail: readString(record, "detail", "description"), current: record.current === true })).filter((record) => record.label);
  if (mapped.length) return mapped;
  return [
    ...(item.applicationOpensAt ? [{ date: formatDate(item.applicationOpensAt), label: "Inscrições abrem", detail: "Data informada pela oportunidade" }] : []),
    ...(item.applicationClosesAt ? [{ date: formatDate(item.applicationClosesAt), label: "Inscrições encerram", detail: item.deadlineNote ?? "Confirme o horário na página oficial", current: item.applicationStatus === "open" }] : []),
    ...(item.programStartsAt ? [{ date: formatDate(item.programStartsAt), label: "Programa começa", detail: "Data prevista" }] : []),
    ...(item.programEndsAt ? [{ date: formatDate(item.programEndsAt), label: "Programa termina", detail: "Data prevista" }] : []),
  ];
}

function mapOrientation(item: OpportunityDetailApi): OpportunityDetail["orientation"] {
  const guidance = item.guidance ?? {};
  const guidanceTitle = readString(guidance, "title", "headline");
  const guidanceBody = readString(guidance, "body", "description", "summary");
  const recommendation = item.applicationStatus === "closed" || item.applicationStatus === "unknown" ? "deprioritize" : "consider";
  const headline = guidanceTitle || (item.applicationStatus === "open" ? "As inscrições estão abertas." : item.applicationStatus === "upcoming" ? "Este é um bom momento para se preparar." : item.applicationStatus === "closed" ? "A edição atual está encerrada." : "O cronograma precisa ser confirmado.");
  return {
    recommendation,
    headline,
    paragraphs: [guidanceBody || item.idealCandidateSummary || item.summary].filter(Boolean),
    considerations: [...(item.subjects ?? []), ...(item.goals ?? [])].slice(0, 6),
    now: [
      { label: "Situação", text: item.deadlineNote ?? headline },
      ...(item.preparationMinDays != null || item.preparationMaxDays != null ? [{ label: "Preparação", text: `Reserve ${item.preparationMinDays ?? "?"}–${item.preparationMaxDays ?? "?"} dias para se preparar.` }] : []),
    ],
  };
}

function mapRelated(items: OpportunityCatalogItemApi[]): OpportunityDetail["similar"] {
  return items.slice(0, 4).map((item) => ({
    id: item.id,
    slug: item.slug ?? undefined,
    type: typeLabels[item.type] ?? item.type,
    title: item.title,
    fit: item.summary,
    deadline: formatDate(item.applicationsCloseAt),
  }));
}

export function mapOpportunityDetail(item: OpportunityDetailApi, related: OpportunityCatalogItemApi[] = []): OpportunityDetail {
  const languages = item.languages ?? [];
  const guidance = item.guidance ?? {};
  const overview = item.overview?.length ? item.overview.map((entry) => ({ label: entry.label, value: entry.value, detail: entry.detail ?? undefined })) : [
    { label: "Formato", value: item.deliveryFormat ?? item.deliveryMode ?? "Não informado" },
    { label: "Custo", value: item.costKind === "FREE" ? "Gratuito" : item.costInformation ?? item.costNotes ?? "Não informado" },
    { label: "Idioma", value: languages.map((language) => languageLabels[language] ?? language).join(" · ") || "Não informado" },
    { label: "Carga horária", value: item.workload ?? "Não informada" },
  ];
  const guidanceActions = readStringList(guidance.actions);
  const guidanceBody = readString(guidance, "body", "description", "summary") || item.idealCandidateSummary || item.summary;
  return {
    id: item.id,
    slug: item.slug ?? String(item.id),
    title: item.title,
    organization: item.organization ?? "Organização não informada",
    officialUrl: item.officialUrl ?? "",
    organizationLogo: item.organizationLogo ?? undefined,
    coverImage: item.coverImage ?? undefined,
    type: typeLabels[item.type] ?? item.type,
    location: [item.location, item.deliveryFormat].filter(Boolean).join(" · ") || "Local não informado",
    educationLevel: (item.educationLevels ?? []).map((level) => educationLabels[level] ?? level).join(" · ") || item.targetAudience || "Público não informado",
    deadline: formatDate(item.applicationClosesAt ?? item.deadline),
    deadlineNote: item.deadlineNote ?? (item.applicationStatus === "unknown" ? "Cronograma ainda não confirmado" : "Confirme o horário na página oficial"),
    competitiveness: (item.competitiveness ?? []).map((level) => competitivenessLabels[level] ?? level).join(" · ") || "Não informada",
    applicationStatus: item.applicationStatus,
    summary: item.summary,
    description: item.description || item.summary,
    fitSummary: item.idealCandidateSummary ?? undefined,
    orientation: mapOrientation(item),
    recommendationReasons: [],
    overview,
    requirements: (item.requirements ?? []).map((entry) => ({ label: entry.label, detail: entry.detail, required: entry.required })),
    trajectory: (item.trajectory ?? []).map((entry) => ({ label: readString(entry, "label", "title", "name"), context: readString(entry, "context", "detail", "description"), active: entry.active === true })).filter((entry) => entry.label),
    guidance: { title: readString(item.guidance, "title", "headline") || "Como se preparar", body: guidanceBody, actions: guidanceActions },
    timeline: mapTimeline(item.timeline ?? [], item),
    people: [],
    studentJourneys: [],
    similar: mapRelated(related),
    discoveryCategories: [],
    suggestedQuestions: { orientation: [], requirements: [], trajectory: [] },
    materials: item.materials ?? [],
    humanVerified: item.humanVerified,
    lastVerifiedAt: item.lastVerifiedAt ?? null,
    canonicalSource: true,
  };
}

export function mapOpportunityGuide(item: OpportunityDetailApi, opportunity: OpportunityDetail): OpportunityGuideDocument {
  return {
    opportunityId: item.id,
    slug: opportunity.slug,
    title: item.guide.title,
    summary: item.guide.summary ?? "Informações e etapas para entender esta oportunidade.",
    updatedAt: new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(item.guide.updatedAt)),
    readTime: `${item.guide.readTimeMinutes} min de leitura`,
    markdown: item.guide.markdown,
  };
}

export async function getCanonicalCatalog(limit = 100) {
  const response = await fetch(`${apiRoot()}/catalog/opportunities?limit=${limit}`, { next: { revalidate: 300 } });
  if (!response.ok) throw new Error(`Catalog API returned ${response.status}`);
  return response.json() as Promise<OpportunityCatalogListApi>;
}

export async function getCanonicalOpportunity(identifier: string) {
  const response = await fetch(`${apiRoot()}/catalog/opportunities/${encodeURIComponent(identifier)}`, { next: { revalidate: 300 } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Catalog API returned ${response.status}`);
  return response.json() as Promise<OpportunityDetailApi>;
}

export async function loadCanonicalOpportunity(identifier: string) {
  const [item, catalog] = await Promise.all([getCanonicalOpportunity(identifier), getCanonicalCatalog()]);
  if (!item) return null;
  const related = catalog.data
    .filter((candidate) => candidate.id !== item.id)
    .filter((candidate) => candidate.type === item.type || candidate.subjects.some((subject) => item.subjects.includes(subject)))
    .slice(0, 4);
  const opportunity = mapOpportunityDetail(item, related);
  return { opportunity, guide: mapOpportunityGuide(item, opportunity) };
}
