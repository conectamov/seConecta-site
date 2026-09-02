import type { Opportunity, OpportunityMetadata } from "@/types/opportunity-catalog";
import type { OnboardingProfile } from "@/types/onboarding";

export type DiscoveryFilterState = {
  themes: string[];
  opportunityTypes: string[];
  locations: string[];
  funding: string[];
  deliveryModes: string[];
  educationLevels: string[];
  applicationStatuses: string[];
};

export const emptyDiscoveryFilters: DiscoveryFilterState = {
  themes: [],
  opportunityTypes: [],
  locations: [],
  funding: [],
  deliveryModes: [],
  educationLevels: [],
  applicationStatuses: [],
};

export type OpportunityTypePresentation = {
  label: string;
  icon: "trophy" | "flask" | "graduation" | "sun" | "calendar" | "users" | "heart" | "code" | "wrench" | "landmark" | "sparkles";
  tone: "gold" | "mint" | "blue" | "coral" | "lilac" | "violet" | "neutral";
};

const typePresentation: Record<string, Pick<OpportunityTypePresentation, "icon" | "tone">> = {
  OLYMPIAD: { icon: "trophy", tone: "gold" },
  COMPETITION: { icon: "trophy", tone: "gold" },
  RESEARCH: { icon: "flask", tone: "mint" },
  SCHOLARSHIP: { icon: "graduation", tone: "blue" },
  SUMMER_PROGRAM: { icon: "sun", tone: "coral" },
  EVENT: { icon: "calendar", tone: "coral" },
  MENTORSHIP: { icon: "users", tone: "lilac" },
  VOLUNTEERING: { icon: "heart", tone: "lilac" },
  HACKATHON: { icon: "code", tone: "violet" },
  WORKSHOP: { icon: "wrench", tone: "violet" },
  MUN: { icon: "landmark", tone: "violet" },
};

export function getOpportunityTypePresentation(typeCode: string, label: string): OpportunityTypePresentation {
  return { label: label || "Oportunidade", ...(typePresentation[typeCode] ?? { icon: "sparkles", tone: "neutral" }) };
}

export type OpportunityActionCue = {
  label: string;
  detail: string;
  tone: "action" | "urgent" | "prepare" | "explore" | "follow" | "closed";
};

export function getOpportunityActionCue(opportunity: Opportunity, metadata: OpportunityMetadata): OpportunityActionCue {
  switch (metadata.applicationStatus) {
    case "endingSoon":
      return { label: "Últimos dias", detail: `até ${opportunity.deadline}`, tone: "urgent" };
    case "open":
      return metadata.actionable
        ? { label: "Inscreva-se agora", detail: `até ${opportunity.deadline}`, tone: "action" }
        : { label: "Veja como participar", detail: `até ${opportunity.deadline}`, tone: "prepare" };
    case "openingSoon":
      return { label: "Comece a se preparar", detail: metadata.openingForecast?.toLocaleLowerCase("pt-BR") ?? "abre em breve", tone: "prepare" };
    case "evergreen":
      return { label: "Explore no seu ritmo", detail: "inscrições contínuas", tone: "explore" };
    case "closed":
      return { label: "Acompanhe o próximo ciclo", detail: "inscrições encerradas", tone: "closed" };
    default:
      return { label: "Acompanhe atualizações", detail: "prazo a confirmar", tone: "follow" };
  }
}

export function isDiscoveryEligible(metadata: OpportunityMetadata, includeClosed = false) {
  if (!metadata.humanVerified) return false;
  return includeClosed || metadata.applicationStatus !== "closed";
}

function intersects(left: readonly string[], right: readonly string[]) {
  return left.some((value) => right.includes(value));
}

export function matchesExplicitProfile(metadata: OpportunityMetadata, profile: OnboardingProfile) {
  return intersects(metadata.subjects, profile.subjects) || metadata.goals.includes(profile.primary_goal);
}

export function selectAnonymousRecommendations(
  opportunities: Opportunity[],
  metadataById: Record<number, OpportunityMetadata>,
  profile: OnboardingProfile | null,
  savedIds: readonly number[],
) {
  if (!profile) return [];
  const saved = new Set(savedIds);
  const matches = opportunities
    .filter((item) => !saved.has(item.id))
    .filter((item) => isDiscoveryEligible(metadataById[item.id]))
    .filter((item) => matchesExplicitProfile(metadataById[item.id], profile));
  return matches.length >= 3 ? matches.slice(0, 3) : [];
}

export function selectApiRecommendations(
  opportunities: Opportunity[],
  metadataById: Record<number, OpportunityMetadata>,
  recommendationIds: readonly number[],
  savedIds: readonly number[],
) {
  const order = new Map(recommendationIds.map((id, index) => [id, index]));
  const saved = new Set(savedIds);
  const matches = opportunities
    .filter((item) => order.has(item.id) && !saved.has(item.id))
    .filter((item) => isDiscoveryEligible(metadataById[item.id]))
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return matches.length >= 3 ? matches.slice(0, 3) : [];
}

function statusMatches(statuses: readonly string[], status: OpportunityMetadata["applicationStatus"]) {
  if (!statuses.length) return true;
  return statuses.some((selected) => selected === "open"
    ? ["open", "endingSoon", "openingSoon", "evergreen"].includes(status)
    : selected === status);
}

export function filterDiscoveryOpportunities(
  opportunities: Opportunity[],
  metadataById: Record<number, OpportunityMetadata>,
  filters: DiscoveryFilterState,
  query: string,
) {
  const term = query.trim().toLocaleLowerCase("pt-BR");
  const includeClosed = filters.applicationStatuses.includes("closed");

  return opportunities.filter((item) => {
    const metadata = metadataById[item.id];
    if (!metadata || !isDiscoveryEligible(metadata, includeClosed)) return false;
    if (metadata.applicationStatus === "closed" && !includeClosed) return false;
    const searchable = [
      item.title,
      item.organization,
      item.description,
      item.category,
      item.area,
      ...metadata.themes,
      ...metadata.opportunityTypes,
      ...metadata.subjects,
      ...metadata.goals,
    ].join(" ").toLocaleLowerCase("pt-BR");

    return (!term || searchable.includes(term))
      && (!filters.themes.length || intersects(metadata.themes, filters.themes))
      && (!filters.opportunityTypes.length || intersects(metadata.opportunityTypes, filters.opportunityTypes))
      && (!filters.locations.length || filters.locations.includes(metadata.location))
      && (!filters.funding.length || filters.funding.includes(metadata.funding))
      && (!filters.deliveryModes.length || filters.deliveryModes.includes(metadata.deliveryMode))
      && (!filters.educationLevels.length || intersects(metadata.educationLevels, filters.educationLevels))
      && statusMatches(filters.applicationStatuses, metadata.applicationStatus);
  });
}

function statusRank(status: OpportunityMetadata["applicationStatus"]) {
  if (status === "unknown") return 1;
  if (status === "closed") return 2;
  return 0;
}

export function sortDiscoveryOpportunities(
  opportunities: Opportunity[],
  metadataById: Record<number, OpportunityMetadata>,
) {
  return [...opportunities].sort((a, b) => {
    const statusDifference = statusRank(metadataById[a.id].applicationStatus) - statusRank(metadataById[b.id].applicationStatus);
    if (statusDifference) return statusDifference;
    if (metadataById[a.id].applicationStatus === "unknown") return a.title.localeCompare(b.title, "pt-BR");
    return a.daysLeft - b.daysLeft || a.title.localeCompare(b.title, "pt-BR");
  });
}

export function countActiveFilters(filters: DiscoveryFilterState) {
  return Object.values(filters).reduce((total, values) => total + values.length, 0);
}
