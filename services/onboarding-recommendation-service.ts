import { apiRequest } from "@/services/seconecta-browser-api";
import type { OnboardingProfile } from "@/types/onboarding";
import type { OpportunityCatalogListApi } from "@/types/seconecta-api";

export type OnboardingRecommendationSummary = {
  compatibleOpportunities: number;
  openOpportunities: number;
  selectedSubjects: number;
  catalogSize: number;
  source: "catalog" | "unavailable";
};

export async function getOnboardingRecommendationSummary(profile: OnboardingProfile): Promise<OnboardingRecommendationSummary> {
  try {
    const result = await apiRequest<OpportunityCatalogListApi>("catalog/opportunities?limit=100");
    const profileSubjects = new Set<string>(profile.subjects);
    const compatible = result.data.filter((opportunity) =>
      opportunity.subjects.some((subject) => profileSubjects.has(subject))
      || opportunity.goals.includes(profile.primary_goal),
    );
    return {
      compatibleOpportunities: compatible.length,
      openOpportunities: compatible.filter((opportunity) => opportunity.applicationStatus === "open").length,
      selectedSubjects: profile.subjects.length,
      catalogSize: result.count,
      source: "catalog",
    };
  } catch {
    return {
      compatibleOpportunities: 0,
      openOpportunities: 0,
      selectedSubjects: profile.subjects.length,
      catalogSize: 0,
      source: "unavailable",
    };
  }
}
