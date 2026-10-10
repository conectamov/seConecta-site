import type { OpportunityIntent, OpportunityJourney, OpportunityPriority, RecommendationFeedback, RecommendationFeedbackScore } from "@/types/opportunity-journey";
import { createOpportunityJourney } from "@/types/opportunity-journey";

export const LOCAL_STUDENT_ID = "local-student";
export const APPLICATION_UNDERSTAND_ID = "application:understand-program";
export const APPLICATION_REQUIREMENTS_ID = "application:check-requirements";
export const APPLICATION_SUBMIT_ID = "application:submit";
export const APPLICATION_CONFIRM_SUBMISSION_ID = "application:confirm-submission";
export function createRequirementChecklistId(label: string) {
  return `requirement:${label.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")}`;
}

export function saveJourneyOpportunity(opportunityId: number, intent: OpportunityIntent, priority?: OpportunityPriority) {
  return createOpportunityJourney({ opportunityId, intent, priority, userId: LOCAL_STUDENT_ID });
}

export function markOfficialPageVisited(journey: OpportunityJourney): OpportunityJourney {
  const timestamp = new Date().toISOString();
  return { ...journey, officialPageVisitedAt: timestamp, updatedAt: timestamp };
}

export function createRecommendationFeedback(opportunityId: number, feedbackScore: RecommendationFeedbackScore): RecommendationFeedback {
  return { opportunityId, userId: LOCAL_STUDENT_ID, feedbackScore, timestamp: new Date().toISOString() };
}
