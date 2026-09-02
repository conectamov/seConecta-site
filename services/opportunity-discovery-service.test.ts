import { describe, expect, it } from "vitest";
import {
  emptyDiscoveryFilters,
  filterDiscoveryOpportunities,
  getOpportunityActionCue,
  getOpportunitySubjectLabels,
  getOpportunityTypePresentation,
  selectAnonymousRecommendations,
  selectApiRecommendations,
  sortDiscoveryOpportunities,
} from "@/services/opportunity-discovery-service";
import type { Opportunity, OpportunityMetadata } from "@/types/opportunity-catalog";
import type { OnboardingProfile } from "@/types/onboarding";

function opportunity(id: number, title = `Oportunidade ${id}`): Opportunity {
  return {
    id, title, organization: "Organização pesquisável", description: "Resumo curto", category: "Olimpíada", area: "Matemática",
    deadline: "30 set.", deadlineGroup: "Depois", daysLeft: id, difficulty: "", competition: "", location: "Brasil", format: "Online",
    time: "", level: "Ensino Médio", language: "Português", fee: "Gratuito", added: 0, popularity: 0, accent: "green",
  };
}

function metadata(overrides: Partial<OpportunityMetadata> = {}): OpportunityMetadata {
  return {
    applicationStatus: "open", funding: "free", educationLevels: ["Ensino Médio"], themes: ["Matemática"], opportunityTypes: ["Olimpíada"],
    location: "Brasil", duration: "unknown", competition: "unknown", language: "unknown", subjects: ["MATHEMATICS"], goals: ["OLYMPIAD_TRAINING"],
    humanVerified: true, deliveryMode: "ONLINE", typeCode: "OLYMPIAD", actionable: true, ...overrides,
  };
}

const profile: OnboardingProfile = {
  onboardingVersion: 4, educationLevel: "Ensino Médio", current_grade: "2º ano", subjects: ["MATHEMATICS"], primary_goal: "OLYMPIAD_TRAINING",
  experience_level: "BEGINNER", themes: ["Matemática"], opportunityTypes: ["Olimpíada"],
};

describe("opportunity discovery", () => {
  it("keeps at most three unique human-readable subject labels", () => {
    expect(getOpportunitySubjectLabels([])).toEqual([]);
    expect(getOpportunitySubjectLabels(["Matemática"])).toEqual(["Matemática"]);
    expect(getOpportunitySubjectLabels(["Matemática", "Física", "Matemática", "Química", "Biologia"]))
      .toEqual(["Matemática", "Física", "Química"]);
    expect(getOpportunitySubjectLabels(["MATHEMATICS", "  Física  ", "AI_DATA"]))
      .toEqual(["Física"]);
  });

  it("does not render anonymous recommendations with fewer than three explicit matches", () => {
    const items = [opportunity(1), opportunity(2), opportunity(3)];
    const byId = { 1: metadata(), 2: metadata(), 3: metadata({ subjects: ["PHYSICS"], goals: ["RESEARCH"] }) };
    expect(selectAnonymousRecommendations(items, byId, profile, [])).toEqual([]);
  });

  it("excludes saved and unverified items from the recommendation threshold", () => {
    const items = [1, 2, 3, 4, 5].map((id) => opportunity(id));
    const byId = { 1: metadata(), 2: metadata(), 3: metadata(), 4: metadata(), 5: metadata({ humanVerified: false }) };
    expect(selectAnonymousRecommendations(items, byId, profile, [1])).toHaveLength(3);
    expect(selectAnonymousRecommendations(items, byId, profile, [1, 2])).toEqual([]);
  });

  it("keeps API recommendation order and never pads it with catalog items", () => {
    const items = [1, 2, 3, 4].map((id) => opportunity(id));
    const byId = { 1: metadata(), 2: metadata(), 3: metadata(), 4: metadata() };
    expect(selectApiRecommendations(items, byId, [3, 1, 2], []) .map((item) => item.id)).toEqual([3, 1, 2]);
    expect(selectApiRecommendations(items, byId, [1, 2], [])).toEqual([]);
  });

  it("combines OR inside a dimension and AND between dimensions", () => {
    const items = [opportunity(1), opportunity(2), opportunity(3)];
    const byId = {
      1: metadata({ themes: ["Matemática"], location: "Internacional" }),
      2: metadata({ themes: ["Física"], location: "Internacional" }),
      3: metadata({ themes: ["Matemática"], location: "Brasil" }),
    };
    const filters = { ...emptyDiscoveryFilters, themes: ["Matemática", "Física"], locations: ["Internacional"] };
    expect(filterDiscoveryOpportunities(items, byId, filters, "").map((item) => item.id)).toEqual([1, 2]);
  });

  it("shows verified open and unknown by default, while closed requires an explicit filter", () => {
    const items = [opportunity(1), opportunity(2), opportunity(3), opportunity(4)];
    const byId = { 1: metadata(), 2: metadata({ applicationStatus: "unknown" }), 3: metadata({ applicationStatus: "closed" }), 4: metadata({ humanVerified: false }) };
    expect(filterDiscoveryOpportunities(items, byId, emptyDiscoveryFilters, "").map((item) => item.id)).toEqual([1, 2]);
    expect(filterDiscoveryOpportunities(items, byId, { ...emptyDiscoveryFilters, applicationStatuses: ["closed"] }, "").map((item) => item.id)).toEqual([3]);
  });

  it("searches hidden organization text and sorts known deadlines before unknown ones", () => {
    const items = [opportunity(1), opportunity(2), opportunity(3)];
    items[0].organization = "Instituto Buscável";
    const byId = { 1: metadata(), 2: metadata({ applicationStatus: "unknown" }), 3: metadata() };
    expect(filterDiscoveryOpportunities(items, byId, emptyDiscoveryFilters, "buscável").map((item) => item.id)).toEqual([1]);
    expect(sortDiscoveryOpportunities([items[1], items[2], items[0]], byId).map((item) => item.id)).toEqual([1, 3, 2]);
  });

  it("maps every known opportunity family to a joyful icon and color with a neutral fallback", () => {
    expect(getOpportunityTypePresentation("OLYMPIAD", "Olimpíada")).toEqual({ label: "Olimpíada", icon: "trophy", tone: "gold" });
    expect(getOpportunityTypePresentation("COMPETITION", "Competição")).toMatchObject({ icon: "trophy", tone: "gold" });
    expect(getOpportunityTypePresentation("RESEARCH", "Pesquisa")).toMatchObject({ icon: "flask", tone: "mint" });
    expect(getOpportunityTypePresentation("SCHOLARSHIP", "Bolsa")).toMatchObject({ icon: "graduation", tone: "blue" });
    expect(getOpportunityTypePresentation("SUMMER_PROGRAM", "Programa de Verão")).toMatchObject({ icon: "sun", tone: "coral" });
    expect(getOpportunityTypePresentation("EVENT", "Evento")).toMatchObject({ icon: "calendar", tone: "coral" });
    expect(getOpportunityTypePresentation("MENTORSHIP", "Mentoria")).toMatchObject({ icon: "users", tone: "lilac" });
    expect(getOpportunityTypePresentation("VOLUNTEERING", "Voluntariado")).toMatchObject({ icon: "heart", tone: "lilac" });
    expect(getOpportunityTypePresentation("HACKATHON", "Hackathon")).toMatchObject({ icon: "code", tone: "violet" });
    expect(getOpportunityTypePresentation("WORKSHOP", "Workshop")).toMatchObject({ icon: "wrench", tone: "violet" });
    expect(getOpportunityTypePresentation("MUN", "Simulação da ONU")).toMatchObject({ icon: "landmark", tone: "violet" });
    expect(getOpportunityTypePresentation("NEW_TYPE", "Novo tipo")).toEqual({ label: "Novo tipo", icon: "sparkles", tone: "neutral" });
  });

  it("derives honest action cues only from lifecycle, deadline and actionable", () => {
    const item = opportunity(1);
    expect(getOpportunityActionCue(item, metadata())).toMatchObject({ label: "Inscreva-se agora", tone: "action" });
    expect(getOpportunityActionCue(item, metadata({ actionable: false }))).toMatchObject({ label: "Veja como participar", tone: "prepare" });
    expect(getOpportunityActionCue(item, metadata({ applicationStatus: "endingSoon" }))).toMatchObject({ label: "Últimos dias", tone: "urgent" });
    expect(getOpportunityActionCue(item, metadata({ applicationStatus: "openingSoon", openingForecast: "Abre em 15 set." }))).toEqual({ label: "Comece a se preparar", detail: "abre em 15 set.", tone: "prepare" });
    expect(getOpportunityActionCue(item, metadata({ applicationStatus: "evergreen" }))).toMatchObject({ label: "Explore no seu ritmo", tone: "explore" });
    expect(getOpportunityActionCue(item, metadata({ applicationStatus: "unknown" }))).toMatchObject({ label: "Acompanhe atualizações", tone: "follow" });
    expect(getOpportunityActionCue(item, metadata({ applicationStatus: "closed" }))).toMatchObject({ label: "Acompanhe o próximo ciclo", tone: "closed" });
  });
});
