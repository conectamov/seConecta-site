export type StaffMe = { id: string; email: string; full_name: string | null; staff_role: "CURATOR" | "ADMIN" };

export type StaffOpportunityRow = {
  id: number;
  title: string;
  organization: string | null;
  category: string;
  stage: number;
  publication_status: string;
  lifecycle: string;
  next_review_at: string | null;
  editorial_value_score: number | null;
  recommendation_enabled: boolean;
  engagement_students: number;
  engagement_priority: number;
};

export type Checklist = {
  version: string;
  requested_stage: number;
  passed: boolean;
  items: { key: string; passed: boolean; label: string }[];
};

export type StaffOpportunityDetail = {
  opportunity: Record<string, unknown> & { id: number; title: string; organization?: string; excerpt?: string; description: string; official_site_url?: string; location?: string; cost_kind?: string; delivery_mode?: string; recurrence_pattern?: string; languages?: string[]; preparation_min_days?: number; preparation_max_days?: number; target_subjects?: string[]; target_goals?: string[]; target_education_levels?: string[] };
  curation: Record<string, unknown> & { stage: number; publication_status: string; recommendation_enabled: boolean; editorial_value_score?: number; editorial_value_reason?: string; verified_at?: string; next_review_at?: string };
  lifecycle: { status: string; reason: string; applications_open_at: string | null; applications_close_at: string | null };
  checklists: { stage_1: Checklist; stage_2: Checklist };
  preview: { action_mode: string; feed_eligible: boolean; feed_blockers: string[] };
  materials: { id: string; title: string; url: string; material_type: string; active: boolean; reviewed: boolean; position: number }[];
  tasks: { id: string; task_type: string; status: string; due_at?: string; priority: number }[];
  metrics?: { period_days: number; impressions: number; unique_opens: number; unique_saves: number; application_starts: number; explicit_interest: number; unique_interested_students: number; privacy_threshold_met: boolean; open_rate: number | null; save_rate: number | null };
};
