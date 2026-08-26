import type { OpportunityDetail } from "@/data/opportunity-details";
import type { JourneyStage, OpportunityJourney } from "@/types/opportunity-journey";

export type JourneyOpportunityItem = {
  /** Includes a transient, automatically-derived stage for planner display logic. */
  relationship: OpportunityJourney & { stage: JourneyStage };
  opportunity: OpportunityDetail;
  daysLeft?: number;
};

export type JourneyPriority = JourneyOpportunityItem & {
  reason: string;
  nextAction: string;
  actionEstimate?: string;
  health: "onTrack" | "attention" | "urgent";
  healthLabel: string;
  progress: {
    completed: number;
    total: number;
    label: string;
  };
  community: {
    text: string;
    actionLabel: string;
  };
  latestUpdate: {
    text: string;
    timestamp: string;
    kind: "material" | "deadline" | "discussion" | "faq";
  };
};

export type JourneyGroup = {
  id: "active" | "watching" | "archived";
  title: string;
  description: string;
  items: JourneyOpportunityItem[];
};

export type JourneyReminder = {
  opportunityId: number;
  text: string;
};

export type JourneyUpdate = {
  id: string;
  opportunityId: number;
  icon: "opening" | "deadline" | "result" | "material" | "community" | "mentor" | "person" | "saved" | "checklist";
  text: string;
  timestamp: string;
  actionLabel: string;
  href: string;
};

export type JourneyMission = {
  opportunityId?: number;
  title: string;
  context: string;
  why: string;
  minutes: number;
  unlocks: string;
  href: string;
};

export type JourneyGlobalProgress = {
  completedOpportunities: number;
  activeOpportunities: number;
  streakDays: number;
  weeklyCompleted: number;
  weeklyTotal: number;
  milestones: string[];
};

export type JourneyDailyAction = {
  id: string;
  opportunityId?: number;
  title: string;
  context: string;
  minutes: number;
  actionLabel: string;
  href: string;
  kind: "application" | "material" | "community";
};

export type JourneyCommunityActivity = {
  id: string;
  opportunityId: number;
  person: string;
  initials: string;
  text: string;
  timestamp: string;
  actionLabel: "Conversar" | "Responder" | "Ver discussão";
};

export type JourneyMaterial = {
  opportunityId: number;
  opportunityTitle: string;
  title: string;
  type: string;
};

export type JourneyMaterialGroup = {
  opportunityId: number;
  opportunityTitle: string;
  materials: JourneyMaterial[];
};

export type JourneyProgressItem = {
  label: string;
  complete: boolean;
};

export type JourneyPlan = {
  focus: string[];
  updates: JourneyUpdate[];
  mission: JourneyMission;
  globalProgress: JourneyGlobalProgress;
  priorities: JourneyPriority[];
  /** Opportunities intentionally kept for later, outside the active application workload. */
  observing: JourneyPriority[];
  projects: JourneyPriority[];
  accomplishments: JourneyPriority[];
  dailyActions: JourneyDailyAction[];
  totalDailyMinutes: number;
  communityActivity: JourneyCommunityActivity[];
  groups: JourneyGroup[];
  reminders: JourneyReminder[];
  materialGroups: JourneyMaterialGroup[];
  coachInsight: string;
  coachReasons: string[];
  progress: JourneyProgressItem[];
  momentum: string[];
};

export const journeyStageLabels: Record<JourneyStage, string> = {
  watching: "Acompanhando",
  interested: "Interessado",
  visitedOfficialPage: "Interessado",
  preparing: "Preparando",
  applied: "Inscrito",
  waitingForResult: "Aguardando resultado",
  accepted: "Aceito",
  participating: "Participando",
  rejected: "Não selecionado",
  completed: "Concluído",
  archived: "Arquivado",
};
