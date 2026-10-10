export type OpportunityMaterial = {
  id: string;
  title: string;
  url: string;
  materialType: "OFFICIAL" | "RULES" | "PREPARATION" | "GUIDE" | "EXAMPLE" | "OTHER";
  reviewedAt: string | null;
  position: number;
};

export type OpportunityDetail = {
  id: number;
  slug: string;
  title: string;
  organization: string;
  officialUrl: string;
  organizationLogo?: string;
  coverImage?: string;
  type: string;
  location: string;
  educationLevel: string;
  deadline: string;
  deadlineNote: string;
  competitiveness: string;
  applicationStatus: "open" | "closed" | "upcoming" | "unknown";
  summary: string;
  description: string;
  fitSummary?: string;
  orientation: {
    recommendation: "prioritize" | "consider" | "deprioritize";
    headline: string;
    paragraphs: string[];
    considerations: string[];
    now: { label: string; text: string }[];
    alternative?: { message: string; categories: string[] };
  };
  recommendationReasons: string[];
  overview: { label: string; value: string; detail?: string }[];
  requirements: { label: string; detail: string; required: boolean }[];
  trajectory: { label: string; context: string; active?: boolean }[];
  guidance: { title: string; body: string; actions: string[] };
  timeline: { date: string; label: string; detail: string; current?: boolean }[];
  people: { name: string; role: string; journey: string; image: string; helpsWith: string[] }[];
  studentJourneys: { name: string; image: string; location: string; steps: string[] }[];
  similar: { id: number; type: string; title: string; fit: string; deadline: string; slug?: string }[];
  discoveryCategories: { label: string; description: string; query: string }[];
  suggestedQuestions: {
    orientation: string[];
    requirements: string[];
    trajectory: string[];
  };
  materials: OpportunityMaterial[];
  humanVerified: boolean;
  lastVerifiedAt: string | null;
  canonicalSource: true;
};
