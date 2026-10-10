export type JourneyModelId = "application" | "competition" | "event";
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

export type OpportunityWorkflowStage = {
  id: string;
  label: string;
  position?: number;
  total?: number;
};

export type StudentOpportunityRelationship = {
  opportunityId: number;
  studentId: string;
  modelId: JourneyModelId;
  objective: OpportunityObjective;
  saved: boolean;
  priority: OpportunityPriority;
  applicationResult: ApplicationResult;
  stage: JourneyStage;
  completed: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  officialPageVisitedAt?: string | null;
  acceptedAt?: string | null;
  applicationProgress: {
    completedItemIds: string[];
    updatedAt: string;
  };
  workflowStage?: OpportunityWorkflowStage | null;
  version: number;
};

export type OpportunityRequirement = {
  id: string;
  label: string;
  detail: string;
  required: boolean;
  position: number;
};

export type OpportunityEdition = {
  applicationStatus: "open" | "closed" | "upcoming" | "unknown";
  applicationsOpenAt?: string | null;
  applicationsCloseAt?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  deadlineNote?: string | null;
  timeline: Record<string, unknown>[];
  source: "canonicalOpportunity" | "legacyOpportunityFallback";
};

export type OpportunityGuide = {
  id?: string | null;
  opportunityId: number;
  title: string;
  summary?: string | null;
  markdown: string;
  version?: number | null;
  updatedAt: string;
  readTimeMinutes: number;
  curated: boolean;
};

export type OpportunityDetailApi = {
  id: number;
  slug?: string | null;
  title: string;
  organization?: string | null;
  organizationLogo?: string | null;
  officialUrl?: string | null;
  coverImage?: string | null;
  type: string;
  location: string;
  educationLevels: string[];
  targetAudience?: string | null;
  deliveryFormat?: string | null;
  costInformation?: string | null;
  workload?: string | null;
  isFree: boolean;
  competitiveness: string[];
  applicationStatus: "open" | "closed" | "upcoming" | "unknown";
  applicationOpensAt?: string | null;
  applicationClosesAt?: string | null;
  programStartsAt?: string | null;
  programEndsAt?: string | null;
  deadline?: string | null;
  deadlineNote?: string | null;
  summary: string;
  description: string;
  idealCandidateSummary?: string | null;
  subjects: string[];
  goals: string[];
  experienceLevels: string[];
  preparationHorizons: string[];
  recurrenceTypes: string[];
  tags: string[];
  overview: { label: string; value: string; detail?: string | null }[];
  edition: OpportunityEdition;
  requirements: OpportunityRequirement[];
  applicationProcess: (Record<string, unknown> | string)[];
  benefits: (Record<string, unknown> | string)[];
  trajectory: Record<string, unknown>[];
  guidance: Record<string, unknown>;
  timeline: Record<string, unknown>[];
  popularQuestions: Record<string, unknown>[];
  suggestedQuestions: Record<string, string[]>;
  references: (Record<string, unknown> | string)[];
  guide: OpportunityGuide;
  stats: {
    preparingStudentCount: number | null;
    privacyThreshold: number;
    thresholdMet: boolean;
  };
  humanVerified: boolean;
  lastVerifiedAt?: string | null;
  updatedAt: string;
  costKind: "FREE" | "PAID" | "VARIABLE" | "UNKNOWN";
  priceAmountMinor: number | null;
  currency: string | null;
  costNotes: string | null;
  scholarshipAvailability: "NONE" | "PARTIAL" | "FULL" | "PARTIAL_OR_FULL" | "UNKNOWN";
  deliveryMode: "ONLINE" | "IN_PERSON" | "HYBRID" | "UNKNOWN";
  recurrencePattern: "ONE_TIME" | "ANNUAL" | "ROLLING" | "EVERGREEN" | "IRREGULAR" | "UNKNOWN";
  preparationMinDays: number | null;
  preparationMaxDays: number | null;
  languages: string[];
  materials: Array<{
    id: string;
    title: string;
    url: string;
    materialType: "OFFICIAL" | "RULES" | "PREPARATION" | "GUIDE" | "EXAMPLE" | "OTHER";
    editionId: string | null;
    reviewedAt: string | null;
    position: number;
  }>;
  curation: {
    stage: number;
    publicationStatus: "PUBLISHED";
    verifiedAt: string | null;
    nextReviewAt: string | null;
  } | null;
};

export type RecommendationFeedback = {
  id: string;
  opportunityId: number;
  feedbackScore: -1 | 0 | 1;
  recommendationId?: string | null;
  surface?: string | null;
  sourceChannel: string;
  createdAt: string;
};

export type AnonymousOpportunityRelationship = {
  opportunityId: number;
  modelId?: JourneyModelId;
  objective: OpportunityObjective;
  priority: OpportunityPriority;
  applicationResult?: ApplicationResult;
  completed?: boolean;
  officialPageVisitedAt?: string;
  completedItemIds?: string[];
  workflowStage?: OpportunityWorkflowStage | null;
};

export type StudentProfileApi = {
  studentId: string;
  status: "ACTIVE" | "DISABLED" | "MERGED";
  fullName: string | null;
  profilePictureUrl: string | null;
};

export type WhatsAppChallengeApi = {
  challenge_id: string;
  expires_in_seconds: number;
};

export type PreferenceTaxonomyApi = {
  taxonomy_version: number;
  subjects: Record<string, string>;
  primary_goals: Record<string, string>;
  goal_stages: Record<string, string>;
  education_levels: Record<string, string>;
  experience_levels: Record<string, string>;
  opportunity_types: Record<string, string>;
  practical_constraints: Record<string, string>;
};

export type StudentPreferencesApi = {
  student_id: string;
  education_levels: string[];
  experience_levels: string[];
  subjects: string[];
  goals: string[];
  current_grade: string | null;
  activities: string[];
  goal_context: Record<string, string>;
  school_type: string | null;
  taxonomy_version: number;
  normalization_status: string;
};

export type OpportunityCatalogItemApi = {
  id: number;
  slug: string | null;
  title: string;
  organization: string | null;
  summary: string;
  type: string;
  coverImage: string | null;
  officialUrl: string | null;
  location: string;
  isFree: boolean;
  applicationStatus: "open" | "closed" | "upcoming" | "unknown";
  actionable: boolean;
  applicationsOpenAt: string | null;
  applicationsCloseAt: string | null;
  educationLevels: string[];
  subjects: string[];
  goals: string[];
  tags: string[];
  humanVerified: boolean;
  lastVerifiedAt: string | null;
  costKind: "FREE" | "PAID" | "VARIABLE" | "UNKNOWN";
  priceAmountMinor: number | null;
  currency: string | null;
  scholarshipAvailability: "NONE" | "PARTIAL" | "FULL" | "PARTIAL_OR_FULL" | "UNKNOWN";
  deliveryMode: "ONLINE" | "IN_PERSON" | "HYBRID" | "UNKNOWN";
  recurrencePattern: "ONE_TIME" | "ANNUAL" | "ROLLING" | "EVERGREEN" | "IRREGULAR" | "UNKNOWN";
  preparationMinDays: number | null;
  preparationMaxDays: number | null;
  languages: string[];
};

export type OpportunityCatalogListApi = {
  data: OpportunityCatalogItemApi[];
  count: number;
};

export type OpportunityRequirementApi = OpportunityRequirement;
export type StudentOpportunityRelationshipApi = StudentOpportunityRelationship;

export type RecommendationItemApi = {
  impression_id: string;
  opportunity_id: number;
  title: string;
  organization: string | null;
  slug: string | null;
  category: string;
  excerpt: string | null;
  cover_url: string | null;
  official_url: string | null;
  lifecycle_status: string;
  actionable: boolean;
  applications_open_at: string | null;
  applications_close_at: string | null;
  journey_stage: string | null;
  saved_status: string | null;
  score: number;
  retrieval_score: number;
  reasons: string[];
};

export type RecommendationResultApi = {
  run_id: string;
  algorithm_version: string;
  candidate_count: number;
  items: RecommendationItemApi[];
};
