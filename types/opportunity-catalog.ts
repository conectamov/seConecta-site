import type { OpportunityType, Theme } from "@/types/taxonomy";

export type Opportunity = {
  id: number;
  slug?: string | null;
  officialUrl?: string;
  title: string;
  organization: string;
  description: string;
  category: string;
  area: string;
  deadline: string;
  deadlineGroup: "Hoje" | "Esta semana" | "Este mês" | "Depois";
  daysLeft: number;
  difficulty: string;
  competition: string;
  location: string;
  format: string;
  time: string;
  level: string;
  language: string;
  fee: string;
  added: number;
  popularity: number;
  accent: "green" | "purple" | "blue" | "orange";
};

export type OpportunityMetadata = {
  applicationStatus: "open" | "endingSoon" | "openingSoon" | "evergreen" | "closed" | "unknown";
  funding: "free" | "fullScholarship" | "partialScholarship" | "unknown";
  educationLevels: string[];
  themes: (Theme | string)[];
  opportunityTypes: (OpportunityType | string)[];
  location: "Brasil" | "Internacional";
  duration: "upToWeek" | "oneToFourWeeks" | "oneToThreeMonths" | "overThreeMonths" | "unknown";
  competition: "veryCompetitive" | "competitive" | "accessible" | "unknown";
  language: "Português" | "Inglês" | "Espanhol" | "Outros" | "unknown";
  editorialPick?: boolean;
  openingForecast?: string;
  subjects: string[];
  goals: string[];
  humanVerified: boolean;
  deliveryMode: "ONLINE" | "IN_PERSON" | "HYBRID" | "UNKNOWN";
  typeCode: string;
  actionable: boolean;
};
