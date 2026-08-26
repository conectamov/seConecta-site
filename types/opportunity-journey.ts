/**
 * A student's relationship with an opportunity. This is deliberately separate
 * from opportunity catalog data so it can later be persisted and surfaced in
 * Minha Jornada without changing the catalog model.
 */
export type JourneyModelId = "application" | "competition" | "event";

export type OpportunityIntent = "apply" | "follow" | "deciding";
export type OpportunityObjective = "following" | "applying" | "participating";
export type ApplicationResult = "pending" | "approved" | "rejected";
export type OpportunityPriority = "high" | "medium" | "low";

export type JourneyStage =
  | "watching"
  | "interested"
  | "visitedOfficialPage"
  | "preparing"
  | "applied"
  | "waitingForResult"
  | "accepted"
  | "participating"
  | "rejected"
  | "completed"
  | "archived";

export type JourneyState = JourneyStage;

export type JourneyModel = {
  id: JourneyModelId;
  stages: readonly JourneyStage[];
  initialStageForIntent: Record<OpportunityIntent, JourneyStage>;
};

export const applicationJourneyModel: JourneyModel = {
  id: "application",
  stages: ["watching", "interested", "visitedOfficialPage", "preparing", "applied", "waitingForResult", "accepted", "participating", "rejected", "completed", "archived"],
  initialStageForIntent: {
    apply: "interested",
    follow: "watching",
    deciding: "interested",
  },
};

export type OpportunityJourney = {
  opportunityId: number;
  userId: string;
  modelId: JourneyModelId;
  /** The only relationship state the student normally chooses manually. */
  objective: OpportunityObjective;
  saved: true;
  priority: OpportunityPriority;
  /** Application outcome is separate from both the objective and checklist progress. */
  applicationResult: ApplicationResult;
  completed: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  officialPageVisitedAt?: string;
  /** Persists the approval milestone so it can still be celebrated in later stages. */
  acceptedAt?: string;
  /**
   * Preparation progress belongs to the student-opportunity relationship.
   * IDs reference the opportunity requirements so catalog content can evolve
   * independently from a student's completed work.
   */
  applicationProgress: {
    completedItemIds: string[];
    updatedAt: string;
  };
  /** Optional model-specific stage, e.g. "2ª fase" for an olympiad. */
  workflowStage?: {
    id: string;
    label: string;
    position?: number;
    total?: number;
  };
};

export type RecommendationFeedbackScore = -1 | 0 | 1;

export type RecommendationFeedback = {
  opportunityId: number;
  userId: string;
  feedbackScore: RecommendationFeedbackScore;
  timestamp: string;
};

export function createOpportunityJourney({
  opportunityId,
  intent,
  priority,
  userId = "local-student",
  model = applicationJourneyModel,
}: {
  opportunityId: number;
  intent: OpportunityIntent;
  priority?: OpportunityPriority;
  userId?: string;
  model?: JourneyModel;
}): OpportunityJourney {
  const timestamp = new Date().toISOString();
  return {
    opportunityId,
    userId,
    modelId: model.id,
    objective: intent === "follow" ? "following" : "applying",
    saved: true,
    priority: priority ?? (intent === "follow" ? "low" : "high"),
    applicationResult: "pending",
    completed: false,
    archived: false,
    applicationProgress: { completedItemIds: [], updatedAt: timestamp },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/**
 * Compatibility view used by planners and labels. It is always inferred from
 * objective, checklist progress and result; users never edit it directly.
 */
export function deriveJourneyStage(journey: OpportunityJourney): JourneyStage {
  if (journey.archived) return "archived";
  if (journey.completed) return "completed";
  if (journey.objective === "following") return "watching";
  if (journey.objective === "participating") return "accepted";
  if (journey.applicationResult === "approved") return "accepted";
  if (journey.applicationResult === "rejected") return "rejected";

  const completedIds = journey.applicationProgress.completedItemIds;
  if (completedIds.includes("application:confirm-submission")) return "waitingForResult";
  if (completedIds.includes("application:submit")) return "applied";
  if (completedIds.length > 0) return "preparing";
  if (journey.officialPageVisitedAt) return "visitedOfficialPage";
  return "interested";
}
