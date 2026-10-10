export type ProfileStepId = "name" | "notifications" | "location" | "school" | "grade" | "languages" | "availability" | "future" | "motivation" | "picture";

export type LanguageProficiency = "Básico" | "Intermediário" | "Avançado" | "Fluente";

export type JourneyProfileExtension = {
  firstName?: string;
  preferredName?: string;
  notificationChannel?: "whatsapp" | "email" | "none";
  city?: string;
  country?: string;
  institution?: string;
  gradeOrGraduation?: string;
  languages?: { language: string; proficiency: LanguageProficiency }[];
  weeklyAvailability?: number;
  futurePlans?: string[];
  motivation?: string;
  profilePictureDataUrl?: string;
  skippedSteps?: ProfileStepId[];
  updatedAt?: string;
};
