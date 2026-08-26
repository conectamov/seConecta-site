export type OpportunityGuideDocument = {
  opportunityId: number;
  slug: string;
  title: string;
  summary: string;
  updatedAt: string;
  readTime: string;
  markdown: string;
};

export type CommunityQuestion = {
  id: string;
  opportunityId: number;
  title: string;
  preview: string;
  author: string;
  replies: number;
  lastActivity: string;
  topic: string;
  difficulty: "Inicial" | "Intermediária" | "Avançada";
  applicationStage: string;
};
export type CommunityExperience = { id: string; title: string; excerpt: string; author: string; connection: string; readTime: string };
export type CommunityPreparation = { id: string; title: string; detail: string; participants: number; actionLabel: string };
export type CommunityUpdate = { id: string; title: string; detail: string; timestamp: string; source: "official" | "community" };
export type CommunitySharedResource = { id: string; title: string; description: string; type: string; sharedBy: string; saves: number; site: string; href: string; favicon: string };
export type CommunityApprovedStudent = { id: string; name: string; image: string; acceptedYear: number; institution: string; story: string };
export type CommunityApplicant = { id: string; name: string; image: string; stage: number; totalStages: number; focus: string; lastActive: string };

export type OpportunityCommunityHub = {
  opportunityId: number;
  opportunitySlug: string;
  whatsappGroupUrl: string;
  activeNow: number;
  questions: CommunityQuestion[];
  approvedStudents: CommunityApprovedStudent[];
  applicants: CommunityApplicant[];
  experiences: CommunityExperience[];
  preparation: CommunityPreparation[];
  updates: CommunityUpdate[];
  sharedResources: CommunitySharedResource[];
};
