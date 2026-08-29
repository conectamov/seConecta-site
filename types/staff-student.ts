export type StaffRole = "CURATOR" | "ADMIN" | null;

export type AdminAccount = {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  staff_role: StaffRole;
  linked_student_id: string | null;
  password_change_required: boolean;
  password_changed_at: string | null;
  temporary_password_expires_at: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
};

export type AdminStudentListItem = {
  id: string;
  status: string;
  full_name: string | null;
  organization: string | null;
  identities: { provider: string; subject: string; verified_at?: string }[];
  legacy_links: { type: string; user_id: string | null; bot_user_answer_id: number | null }[];
  website_accounts?: { id: string; email: string; is_active: boolean }[];
  onboarding_complete?: boolean;
  recent_activity?: { opportunity_relationships: number; last_behavior_at: string | null };
  created_at?: string;
  updated_at: string;
};

export type StudentAdminDetail = {
  student: Record<string, unknown> & { id: string; status: string; created_at: string; updated_at: string };
  profile: (Record<string, unknown> & { updated_at: string }) | null;
  identities: Record<string, unknown>[];
  channels: Record<string, unknown>[];
  accounts: AdminAccount[];
  legacy_links: Record<string, unknown>[];
  preferences: (Record<string, unknown> & { updated_at: string; embedding_status: string }) | null;
  taxonomy: {
    taxonomy_version: number;
    subjects: Record<string, string>;
    primary_goals: Record<string, string>;
    goal_stages: Record<string, string>;
    education_levels: Record<string, string>;
    experience_levels: Record<string, string>;
    opportunity_types: Record<string, string>;
    practical_constraints: Record<string, string>;
  };
  observations: Record<string, unknown>[];
  recommendation_context: Record<string, unknown> | null;
  latest_recommendation: { run: Record<string, unknown> | null; impressions: Record<string, unknown>[] };
  journey_summary: { total: number; by_state: Record<string, number>; last_activity_at: string | null };
};

export type StudentAdminActivity = {
  journeys: Record<string, unknown>[];
  behavior_events: Record<string, unknown>[];
  journey_events: Record<string, unknown>[];
  feedback: Record<string, unknown>[];
  offset: number;
  limit: number;
};

export type StudentAdminAudit = {
  data: Record<string, unknown>[];
  offset: number;
  limit: number;
};
