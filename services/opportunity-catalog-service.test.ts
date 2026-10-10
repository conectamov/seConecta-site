import { describe, expect, it, vi } from "vitest";
import type { OpportunityDetailApi } from "@/types/seconecta-api";

vi.mock("server-only", () => ({}));

describe("canonical catalog adapter", () => {
  it("keeps factual API fields and does not invent personalization", async () => {
    const { mapOpportunityDetail } = await import("@/services/opportunity-catalog-service");
    const item = {
      id: 42, slug: "olimpiada-exemplo", title: "Olimpíada Exemplo", organization: "Instituto Exemplo", organizationLogo: null,
      officialUrl: "https://example.org", coverImage: null, type: "OLYMPIAD", location: "Brasil", educationLevels: ["HIGH_SCHOOL"],
      targetAudience: null, deliveryFormat: "Online", costInformation: null, workload: null, isFree: true, competitiveness: [],
      applicationStatus: "open", applicationOpensAt: null, applicationClosesAt: "2027-01-20T00:00:00Z", programStartsAt: null, programEndsAt: null,
      deadline: "2027-01-20T00:00:00Z", deadlineNote: null, summary: "Uma competição nacional.", description: "Descrição oficial.", idealCandidateSummary: null,
      subjects: ["MATHEMATICS"], goals: ["OLYMPIAD_TRAINING"], experienceLevels: [], preparationHorizons: [], recurrenceTypes: [], tags: [],
      overview: [], requirements: [], applicationProcess: [], benefits: [], trajectory: [], guidance: {}, timeline: [], popularQuestions: [], suggestedQuestions: {}, references: [],
      guide: { opportunityId: 42, title: "Guia", summary: null, markdown: "## Guia", updatedAt: "2026-08-22T00:00:00Z", readTimeMinutes: 2, curated: true },
      stats: { preparingStudentCount: null, privacyThreshold: 10, thresholdMet: false }, humanVerified: true, lastVerifiedAt: "2026-08-22T00:00:00Z", updatedAt: "2026-08-22T00:00:00Z",
    } as unknown as OpportunityDetailApi;
    const mapped = mapOpportunityDetail(item);
    expect(mapped).toMatchObject({ id: 42, type: "Olimpíada", summary: "Uma competição nacional.", canonicalSource: true, humanVerified: true, recommendationReasons: [], similar: [] });
    expect(mapped.orientation.headline).toBe("As inscrições estão abertas.");
    expect(mapped.recommendationReasons).toEqual([]);
    expect(mapped.materials).toEqual([]);
  });
});
