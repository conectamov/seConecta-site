import type { OnboardingAnswers } from "@/data/onboarding-flow";
import type { Experience, NotificationPreference, OnboardingProfile, PreferredChannel, PrimaryGoal } from "@/types/onboarding";
import type { OpportunityType, Theme } from "@/types/taxonomy";

const STORAGE_KEY = "seconecta:onboarding-profile";

const subjectThemeMap: Partial<Record<NonNullable<OnboardingProfile["subjects"]>[number], Theme>> = {
  COMPUTING: "Ciências da Computação",
  AI: "Inteligência Artificial",
  MATHEMATICS: "Matemática",
  PHYSICS: "Física",
  CHEMISTRY: "Química",
  BIOLOGY: "Biologia",
  ENVIRONMENT: "Meio Ambiente",
  ECONOMICS: "Economia",
  BUSINESS: "Empreendedorismo",
  HISTORY: "História",
  ARTS_DESIGN: "Artes",
};

const activityTypeMap: Partial<Record<NonNullable<OnboardingProfile["activities"]>[number], OpportunityType>> = {
  OLYMPIADS: "Olimpíada",
  RESEARCH: "Pesquisa",
  ENTREPRENEURSHIP: "Competição",
  LEADERSHIP: "Mentoria",
  PROJECTS: "Competição",
  STUDY_ABROAD: "Programa de Verão",
  SOCIAL_IMPACT: "Voluntariado",
  COMMUNITIES: "Mentoria",
  INTERNSHIPS: "Mentoria",
};

const notificationChannelMap: Record<NotificationPreference, PreferredChannel> = {
  whatsapp: "WhatsApp",
  site: "Site",
  email: "E-mail",
};

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function derivePrimaryGoal(answers: OnboardingAnswers): PrimaryGoal {
  if (answers.goals.includes("STUDY_ABROAD")) return "STUDY_ABROAD";
  if (answers.goals.includes("WIN_MEDALS")) return "OLYMPIADS";
  if (answers.goals.includes("DO_RESEARCH")) return "RESEARCH";
  if (answers.goals.some((goal) => goal === "WORK_IN_TECH" || goal === "BUILD_STARTUP")) return "TECHNOLOGY";
  if (answers.goals.some((goal) => goal === "UNIVERSITY" || goal === "ENTRANCE_EXAMS" || goal === "STRONG_RESUME")) return "CAREER";
  return "EXPLORING";
}

function deriveExperiences(answers: OnboardingAnswers): Experience[] {
  const experiences: Experience[] = [];
  if (answers.experience.programming && !["none", "beginner"].includes(answers.experience.programming)) experiences.push("PROGRAMMING_PROJECTS");
  if (answers.experience.olympiads && answers.experience.olympiads !== "none") experiences.push("OLYMPIADS");
  if (answers.experience.research && answers.experience.research !== "none") experiences.push("RESEARCH");
  if (answers.activities.includes("ENTREPRENEURSHIP")) experiences.push("ENTREPRENEURSHIP");
  if (answers.activities.includes("INTERNSHIPS")) experiences.push("INTERNSHIPS");
  if (answers.activities.includes("STUDY_ABROAD")) experiences.push("STUDY_ABROAD");
  if (answers.activities.includes("SOCIAL_IMPACT")) experiences.push("VOLUNTEERING");
  return experiences.length ? unique(experiences) : ["NONE"];
}

export const onboardingService = {
  load(): OnboardingProfile | null {
    if (typeof window === "undefined") return null;

    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      if (!value) return null;
      const profile = JSON.parse(value) as OnboardingProfile & { interests?: string[] };
      if (profile.themes && profile.opportunityTypes) return profile;

      const oldInterests = profile.interests ?? [];
      const themes = oldInterests.map((interest) => ({ IA: "Inteligência Artificial", Programação: "Ciências da Computação", Tecnologia: "Ciências da Computação", Olimpíadas: "Matemática" }[interest] ?? interest)).filter((interest): interest is Theme => ["Inteligência Artificial", "Matemática", "Física", "Química", "Biologia", "Robótica", "Artes", "Empreendedorismo"].includes(interest));
      const opportunityTypes = oldInterests.map((interest) => ({ Olimpíadas: "Olimpíada", Pesquisa: "Pesquisa", Bolsas: "Bolsa", Intercâmbios: "Programa de Verão" }[interest])).filter((interest): interest is OpportunityType => Boolean(interest));
      return { ...profile, themes, opportunityTypes };
    } catch {
      return null;
    }
  },

  save(profile: OnboardingProfile) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  },

  createProfile(answers: OnboardingAnswers, notificationPreference: NotificationPreference): OnboardingProfile {
    const themes = unique(answers.subjects.map((subject) => subjectThemeMap[subject]).filter((theme): theme is Theme => Boolean(theme)));
    const opportunityTypes = unique(answers.activities.map((activity) => activityTypeMap[activity]).filter((type): type is OpportunityType => Boolean(type)));
    return {
      onboardingVersion: 2,
      educationLevel: answers.educationLevel ?? "Outro",
      current_grade: answers.current_grade ?? undefined,
      subjects: answers.subjects,
      activities: answers.activities,
      goals: answers.goals,
      experience: answers.experience,
      school_type: answers.school_type ?? undefined,
      notification_preference: notificationPreference,
      themes,
      opportunityTypes,
      primaryGoal: derivePrimaryGoal(answers),
      previousExperiences: deriveExperiences(answers),
      preferredChannel: notificationChannelMap[notificationPreference],
    };
  },
};
