import { describe, expect, it } from "vitest";
import { toBackendUserPreferences } from "@/services/onboarding-service";

describe("canonical onboarding mapper", () => {
  it("writes one canonical Student preference snapshot", () => {
    expect(toBackendUserPreferences({
      onboardingVersion: 4,
      educationLevel: "Ensino Médio",
      current_grade: "2º",
      subjects: ["MATHEMATICS", "ARTIFICIAL_INTELLIGENCE", "MATHEMATICS"],
      primary_goal: "STUDY_ABROAD",
      experience_level: "BEGINNER",
      themes: ["Matemática", "Inteligência Artificial"],
      opportunityTypes: ["Programa de Verão"],
    })).toEqual({
      profile_type: "STUDENT",
      education_levels: ["ENSINO_MEDIO_2"],
      current_grade: "2º",
      experience_levels: ["BEGINNER"],
      subjects: ["MATHEMATICS", "ARTIFICIAL_INTELLIGENCE"],
      interests: [],
      goals: ["STUDY_ABROAD"],
      wants_international: true,
    });
  });
});
