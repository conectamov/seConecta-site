import type { OpportunityType, Theme } from "@/types/taxonomy";

export type EducationLevel = "Ensino Fundamental II" | "Ensino Médio" | "Universidade" | "Outro";
export type OnboardingSubject = "COMPUTER_SCIENCE" | "ARTIFICIAL_INTELLIGENCE" | "MATHEMATICS" | "PHYSICS" | "CHEMISTRY" | "BIOLOGY" | "ENVIRONMENTAL_SCIENCE" | "ECONOMICS" | "BUSINESS" | "LITERATURE" | "LANGUAGES" | "HISTORY" | "ARTS";
export type OnboardingPrimaryGoal = "STUDY_ABROAD" | "COLLEGE_PREP" | "OLYMPIAD_TRAINING" | "RESEARCH" | "SKILL_BUILDING" | "SOCIAL_IMPACT" | "CAREER_EXPLORATION" | "DISCOVER_OPPORTUNITIES";
export type OnboardingExperienceLevel = "EXPLORING" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "COMPETITIVE";

export type OnboardingProfile = {
  onboardingVersion: 4;
  educationLevel: EducationLevel;
  current_grade: string;
  subjects: OnboardingSubject[];
  primary_goal: OnboardingPrimaryGoal;
  experience_level: OnboardingExperienceLevel;
  /** Derived compatibility fields consumed by the current recommendation ranking. */
  themes: Theme[];
  opportunityTypes: OpportunityType[];
};

export type BackendUserPreferencesPayload = {
  profile_type: "STUDENT";
  education_levels: string[];
  current_grade: string;
  experience_levels: OnboardingExperienceLevel[];
  subjects: string[];
  interests: string[];
  goals: string[];
  wants_international?: true;
};
