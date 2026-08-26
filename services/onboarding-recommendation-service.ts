import { getOpportunityDetail, opportunityIds } from "@/data/opportunity-details";
import type { OnboardingProfile } from "@/types/onboarding";

export type OnboardingRecommendationSummary = {
  compatibleOpportunities: number;
  recommendedPaths: number;
  openOpportunities: number;
  connectedGoals: number;
  source: "backend" | "local-fallback";
};

type RecommendationBackendResponse = Partial<Omit<OnboardingRecommendationSummary, "source">>;

function localFallback(profile: OnboardingProfile): OnboardingRecommendationSummary {
  const opportunities = opportunityIds.map((id) => getOpportunityDetail(id)).filter(Boolean);
  const matching = opportunities.filter((opportunity) => {
    if (!opportunity) return false;
    const searchable = `${opportunity.type} ${opportunity.title} ${opportunity.summary}`.toLocaleLowerCase("pt-BR");
    return profile.themes.some((theme) => searchable.includes(theme.toLocaleLowerCase("pt-BR")))
      || profile.opportunityTypes.some((type) => searchable.includes(type.toLocaleLowerCase("pt-BR")));
  });
  const compatible = matching.length || opportunities.length;
  const open = matching.filter((opportunity) => opportunity?.applicationStatus === "open").length
    || opportunities.filter((opportunity) => opportunity?.applicationStatus === "open").length;

  return {
    compatibleOpportunities: compatible,
    recommendedPaths: Math.max(1, Math.min(3, profile.goals?.length ?? 1)),
    openOpportunities: open,
    connectedGoals: Math.max(1, profile.goals?.length ?? 1),
    source: "local-fallback",
  };
}

export async function getOnboardingRecommendationSummary(profile: OnboardingProfile): Promise<OnboardingRecommendationSummary> {
  const endpoint = process.env.NEXT_PUBLIC_ONBOARDING_RECOMMENDATIONS_ENDPOINT;
  if (!endpoint) return localFallback(profile);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
      signal: AbortSignal.timeout(2200),
    });
    if (!response.ok) throw new Error("Recommendation endpoint unavailable");
    const data = await response.json() as RecommendationBackendResponse;
    const fallback = localFallback(profile);
    return {
      compatibleOpportunities: data.compatibleOpportunities ?? fallback.compatibleOpportunities,
      recommendedPaths: data.recommendedPaths ?? fallback.recommendedPaths,
      openOpportunities: data.openOpportunities ?? fallback.openOpportunities,
      connectedGoals: data.connectedGoals ?? fallback.connectedGoals,
      source: "backend",
    };
  } catch {
    return localFallback(profile);
  }
}
