"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Opportunity, OpportunityMetadata } from "@/types/opportunity-catalog";
import { apiRequest } from "@/services/seconecta-browser-api";
import type { OpportunityCatalogItemApi, OpportunityCatalogListApi } from "@/types/seconecta-api";

type OpportunityCatalogContextValue = {
  opportunities: Opportunity[];
  opportunityMetadata: Record<number, OpportunityMetadata>;
  ready: boolean;
  error: string | null;
};

const OpportunityCatalogContext = createContext<OpportunityCatalogContextValue | null>(null);

const subjectLabels: Record<string, string> = {
  COMPUTER_SCIENCE: "Ciências da Computação",
  ARTIFICIAL_INTELLIGENCE: "Inteligência Artificial",
  AI_DATA: "Inteligência Artificial",
  MATHEMATICS: "Matemática",
  PHYSICS: "Física",
  CHEMISTRY: "Química",
  BIOLOGY: "Biologia",
  ENVIRONMENTAL_SCIENCE: "Meio Ambiente",
  ECONOMICS: "Economia",
  BUSINESS: "Empreendedorismo",
  ENTREPRENEURSHIP: "Empreendedorismo",
  LITERATURE: "Literatura",
  LANGUAGES: "Idiomas",
  LANGUAGES_WRITING: "Idiomas",
  HISTORY: "História",
  HUMANITIES: "Humanidades",
  ARTS: "Artes",
};

const typeLabels: Record<string, string> = {
  OLYMPIAD: "Olimpíada",
  RESEARCH: "Pesquisa",
  SCHOLARSHIP: "Bolsa",
  SUMMER_PROGRAM: "Programa de Verão",
  COMPETITION: "Competição",
  EVENT: "Evento",
  HACKATHON: "Hackathon",
  VOLUNTEERING: "Voluntariado",
  MENTORSHIP: "Mentoria",
  MUN: "Simulação da ONU",
  EXTRACURRICULAR: "Programa extracurricular",
  INITIATIVE: "Iniciativa",
  WORKSHOP: "Workshop",
  POST: "Conteúdo",
};

const educationLabels: Record<string, string> = {
  MIDDLE_SCHOOL: "Ensino Fundamental II",
  HIGH_SCHOOL: "Ensino Médio",
  FUNDAMENTAL_2: "Ensino Fundamental II",
  ENSINO_MEDIO_1: "1º ano do Ensino Médio",
  ENSINO_MEDIO_2: "2º ano do Ensino Médio",
  ENSINO_MEDIO_3: "3º ano do Ensino Médio",
  GAP_YEAR: "Gap year",
  UNDERGRAD: "Universidade",
  UNDERGRADUATE: "Universidade",
  OTHER: "Outros",
};

function daysUntil(date: string | null) {
  if (!date) return 9999;
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000));
}

function formatDate(date: string | null) {
  if (!date) return "Prazo não informado";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(date));
}

function mapStatus(item: OpportunityCatalogItemApi): OpportunityMetadata["applicationStatus"] {
  if (item.applicationStatus === "upcoming") return "openingSoon";
  if (item.applicationStatus === "closed") return "closed";
  if (item.applicationStatus === "unknown") return "unknown";
  return daysUntil(item.applicationsCloseAt) <= 7 ? "endingSoon" : "open";
}

function mapCatalog(data: OpportunityCatalogItemApi[]) {
  const opportunities: Opportunity[] = [];
  const metadata: Record<number, OpportunityMetadata> = {};

  for (const item of data) {
    const daysLeft = daysUntil(item.applicationsCloseAt);
    const opportunityTypes = [typeLabels[item.type] ?? item.type].filter(Boolean);
    const themes = item.subjects.map((subject) => subjectLabels[subject] ?? subject);
    const international = !/brasil/i.test(item.location) && /internacional|international|exterior|global|world|mundial|portugal|estados unidos|canad|europa|reino unido/i.test(`${item.location} ${item.tags.join(" ")}`);
    opportunities.push({
      id: item.id,
      slug: item.slug,
      officialUrl: item.officialUrl ?? undefined,
      title: item.title,
      organization: item.organization ?? "Organização não informada",
      description: item.summary,
      category: opportunityTypes[0] ?? "Oportunidade",
      area: themes[0] ?? "Educação",
      deadline: formatDate(item.applicationsCloseAt),
      deadlineGroup: daysLeft === 0 ? "Hoje" : daysLeft <= 7 ? "Esta semana" : daysLeft <= 31 ? "Este mês" : "Depois",
      daysLeft,
      difficulty: "Consulte os requisitos",
      competition: "Não informada",
      location: item.location || "Local não informado",
      format: "Consulte os detalhes",
      time: "Carga horária não informada",
      level: item.educationLevels.map((level) => educationLabels[level] ?? level).join(" · ") || "Público não informado",
      language: "Não informado",
      fee: item.isFree ? "Gratuito" : "Consulte os custos",
      added: 0,
      popularity: 0,
      accent: item.type === "OLYMPIAD" ? "orange" : item.type === "RESEARCH" ? "green" : item.type === "SCHOLARSHIP" ? "blue" : "purple",
    });
    metadata[item.id] = {
      applicationStatus: mapStatus(item),
      funding: item.isFree ? "free" : "unknown",
      educationLevels: item.educationLevels.map((level) => educationLabels[level] ?? level),
      themes,
      opportunityTypes,
      location: international ? "Internacional" : "Brasil",
      duration: "unknown",
      competition: "unknown",
      language: "unknown",
      openingForecast: item.applicationsOpenAt ? `Abre em ${formatDate(item.applicationsOpenAt)}` : undefined,
    };
  }
  return { opportunities, metadata };
}

export function OpportunityCatalogProvider({ children }: { children: ReactNode }) {
  const [apiItems, setApiItems] = useState<OpportunityCatalogItemApi[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiRequest<OpportunityCatalogListApi>("/catalog/opportunities?limit=100")
      .then((result) => { if (active) setApiItems(result.data); })
      .catch(() => { if (active) { setApiItems([]); setError("Não foi possível carregar o catálogo agora. Tente novamente em instantes."); } });
    return () => { active = false; };
  }, []);

  const value = useMemo<OpportunityCatalogContextValue>(() => {
    if (apiItems === null) return { opportunities: [], opportunityMetadata: {}, ready: false, error: null };
    const mapped = mapCatalog(apiItems);
    return { opportunities: mapped.opportunities, opportunityMetadata: mapped.metadata, ready: true, error };
  }, [apiItems, error]);

  return <OpportunityCatalogContext.Provider value={value}>{children}</OpportunityCatalogContext.Provider>;
}

export function useOpportunityCatalog() {
  const context = useContext(OpportunityCatalogContext);
  if (!context) throw new Error("useOpportunityCatalog must be used inside OpportunityCatalogProvider");
  return context;
}
