import type {
  BackendUserPreferencesPayload,
  EducationLevel,
  OnboardingExperienceLevel,
  OnboardingOpportunityCategory,
  OnboardingPrimaryGoal,
  OnboardingProfile,
  OnboardingSubject,
} from "@/types/onboarding";
import type { OpportunityType, Theme } from "@/types/taxonomy";
import { apiRequest } from "@/services/seconecta-browser-api";
import type { StudentPreferencesApi } from "@/types/seconecta-api";
import type { ActivationContext } from "@/services/student-activation-service";

const STORAGE_KEY = "seconecta:onboarding-profile";

const subjectThemeMap: Partial<Record<OnboardingSubject, Theme>> = {
  COMPUTER_SCIENCE: "Ciências da Computação", ARTIFICIAL_INTELLIGENCE: "Inteligência Artificial", MATHEMATICS: "Matemática", PHYSICS: "Física",
  CHEMISTRY: "Química", BIOLOGY: "Biologia", ENVIRONMENTAL_SCIENCE: "Meio Ambiente", ECONOMICS: "Economia",
  BUSINESS: "Empreendedorismo", LITERATURE: "Filosofia", HISTORY: "História", ARTS: "Artes",
};

const educationMap: Record<EducationLevel, string> = {
  "Ensino Fundamental II": "FUNDAMENTAL_2", "Ensino Médio": "ENSINO_MEDIO_1", Universidade: "UNDERGRADUATE", Outro: "OTHER",
};

function backendEducationLevel(level: EducationLevel, grade: string) {
  if (level !== "Ensino Médio") return educationMap[level];
  if (grade.startsWith("2")) return "ENSINO_MEDIO_2";
  if (grade.startsWith("3")) return "ENSINO_MEDIO_3";
  return "ENSINO_MEDIO_1";
}

function deriveTypes(subjects: OnboardingSubject[], goals: OnboardingPrimaryGoal[], categories: OnboardingOpportunityCategory[]): OpportunityType[] {
  const types: OpportunityType[] = ["Programa de Verão"];
  if (goals.includes("OLYMPIAD_TRAINING") || subjects.some((subject) => ["MATHEMATICS", "PHYSICS", "CHEMISTRY", "BIOLOGY", "COMPUTER_SCIENCE", "ARTIFICIAL_INTELLIGENCE"].includes(subject))) types.push("Olimpíada");
  if (goals.includes("RESEARCH") || subjects.some((subject) => ["ARTIFICIAL_INTELLIGENCE", "BIOLOGY", "PHYSICS", "CHEMISTRY", "ENVIRONMENTAL_SCIENCE"].includes(subject))) types.push("Pesquisa");
  if (goals.includes("SKILL_BUILDING") || subjects.some((subject) => ["COMPUTER_SCIENCE", "ARTIFICIAL_INTELLIGENCE", "BUSINESS", "ARTS"].includes(subject))) types.push("Hackathon");
  if (goals.includes("SOCIAL_IMPACT")) types.push("Voluntariado");
  if (categories.includes("MENTORSHIP")) types.push("Mentoria");
  return [...new Set(types)];
}

type CreateProfileInput = {
  onboardingVersion?: 4 | 5;
  educationLevel: EducationLevel;
  current_grade: string;
  subjects: OnboardingSubject[];
  goals: OnboardingPrimaryGoal[];
  categories: OnboardingOpportunityCategory[];
  experience_level: OnboardingExperienceLevel;
};

type StoredProfile = Partial<OnboardingProfile> & {
  primaryGoal?: string;
  previousExperiences?: string[];
};

function normalizeStoredProfile(stored: StoredProfile): OnboardingProfile | null {
  if (!stored.educationLevel || !stored.current_grade) return null;
  const legacySubjects: Record<string, OnboardingSubject> = { COMPUTING: "COMPUTER_SCIENCE", AI: "ARTIFICIAL_INTELLIGENCE", ENVIRONMENT: "ENVIRONMENTAL_SCIENCE", ARTS_DESIGN: "ARTS" };
  const subjects = (stored.subjects ?? []).map((subject) => legacySubjects[subject] ?? subject).filter((subject): subject is OnboardingSubject => Object.hasOwn(subjectThemeMap, subject));
  const primaryGoal = stored.primary_goal ?? (stored.primaryGoal === "STUDY_ABROAD" ? "STUDY_ABROAD" : undefined);
  const goals = stored.goals?.length ? stored.goals : [primaryGoal ?? "DISCOVER_OPPORTUNITIES"];
  const categories = stored.categories ?? [];
  const experienceLevel = stored.experience_level ?? (stored.previousExperiences?.length ? "INTERMEDIATE" : undefined);
  return {
    onboardingVersion: stored.onboardingVersion === 5 ? 5 : 4,
    educationLevel: stored.educationLevel,
    current_grade: stored.current_grade,
    subjects,
    primary_goal: goals[0],
    goals,
    categories,
    experience_level: experienceLevel ?? "EXPLORING",
    themes: subjects.map((subject) => subjectThemeMap[subject]).filter((theme): theme is Theme => Boolean(theme)),
    opportunityTypes: deriveTypes(subjects, goals, categories),
  };
}

export function toBackendUserPreferences(profile: OnboardingProfile): BackendUserPreferencesPayload {
  return {
    profile_type: "STUDENT",
    education_levels: [backendEducationLevel(profile.educationLevel, profile.current_grade)],
    current_grade: profile.current_grade,
    experience_levels: [profile.experience_level],
    subjects: [...new Set(profile.subjects)],
    interests: [],
    goals: [...new Set(profile.goals?.length ? profile.goals : [profile.primary_goal])].slice(0, 3),
    categories: [...new Set(profile.categories ?? [])],
    ...((profile.goals ?? [profile.primary_goal]).includes("STUDY_ABROAD") ? { wants_international: true as const } : {}),
  };
}

export const onboardingService = {
  load(): OnboardingProfile | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? normalizeStoredProfile(JSON.parse(raw) as StoredProfile) : null;
    } catch { return null; }
  },
  save(profile: OnboardingProfile) { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); },
  createProfile(input: CreateProfileInput): OnboardingProfile {
    return normalizeStoredProfile(input) as OnboardingProfile;
  },
  toBackendPreferences: toBackendUserPreferences,
  sync(profile: OnboardingProfile) {
    return apiRequest<StudentPreferencesApi>("students/me/preferences", {
      method: "PATCH",
      body: JSON.stringify(toBackendUserPreferences(profile)),
    });
  },
  createWhatsAppHandoff(profile: OnboardingProfile, activation?: ActivationContext) {
    return apiRequest<{ whatsapp_url: string }>("student-onboarding/handoffs", {
      method: "POST",
      body: JSON.stringify({
        preferences: toBackendUserPreferences(profile),
        ...(activation ? {
          activation_session_id: activation.sessionId,
          activation_variant: activation.variant,
        } : {}),
      }),
    });
  },
};
