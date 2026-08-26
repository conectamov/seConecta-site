export type EducationLevel = "Ensino Fundamental II" | "Ensino Médio" | "Universidade" | "Outro";

export type PrimaryGoal = "STUDY_ABROAD" | "OLYMPIADS" | "RESEARCH" | "TECHNOLOGY" | "CAREER" | "EXPLORING";

export type PreferredChannel = "WhatsApp" | "Site" | "E-mail";
export type Experience = "OLYMPIADS" | "RESEARCH" | "PROGRAMMING_PROJECTS" | "HACKATHONS" | "INTERNSHIPS" | "STUDY_ABROAD" | "COURSES" | "VOLUNTEERING" | "ENTREPRENEURSHIP" | "NONE";

export type OnboardingSubject = "COMPUTING" | "AI" | "MATHEMATICS" | "PHYSICS" | "CHEMISTRY" | "BIOLOGY" | "ENVIRONMENT" | "ECONOMICS" | "BUSINESS" | "LITERATURE" | "LANGUAGES" | "HISTORY" | "ARTS_DESIGN";
export type OnboardingActivity = "OLYMPIADS" | "RESEARCH" | "ENTREPRENEURSHIP" | "LEADERSHIP" | "PROJECTS" | "STUDY_ABROAD" | "SOCIAL_IMPACT" | "COMMUNICATION" | "COMMUNITIES" | "INTERNSHIPS";
export type OnboardingGoal = "UNIVERSITY" | "STUDY_ABROAD" | "WIN_MEDALS" | "DO_RESEARCH" | "WORK_IN_TECH" | "BUILD_STARTUP" | "ENTRANCE_EXAMS" | "STRONG_RESUME";
export type SchoolType = "PUBLIC" | "PRIVATE" | "OTHER";
export type NotificationPreference = "whatsapp" | "site" | "email";
export type ExperienceArea = "programming" | "olympiads" | "research" | "leadership";
export type OnboardingExperience = Partial<Record<ExperienceArea, string>>;

export type OnboardingProfile = {
  educationLevel: EducationLevel;
  previousExperiences: Experience[];
  themes: import("@/types/taxonomy").Theme[];
  opportunityTypes: import("@/types/taxonomy").OpportunityType[];
  primaryGoal: PrimaryGoal;
  preferredChannel: PreferredChannel;
  onboardingVersion?: 2;
  current_grade?: string;
  subjects?: OnboardingSubject[];
  activities?: OnboardingActivity[];
  goals?: OnboardingGoal[];
  experience?: OnboardingExperience;
  school_type?: SchoolType;
  notification_preference?: NotificationPreference;
};
