import { notFound } from "next/navigation";
import { OpportunityEditor } from "@/components/staff/opportunity-editor";
import { curationWorkflowEnabled, staffApi } from "@/lib/staff-api";
import type { StaffOpportunityDetail } from "@/types/staff";

export default async function StaffOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!curationWorkflowEnabled()) notFound();
  try { const [detail, metrics] = await Promise.all([staffApi<StaffOpportunityDetail>(`/staff/opportunities/${encodeURIComponent(id)}`), staffApi<NonNullable<StaffOpportunityDetail["metrics"]>>(`/staff/opportunities/${encodeURIComponent(id)}/metrics?days=30`)]); return <OpportunityEditor initial={{ ...detail, metrics }} />; }
  catch { notFound(); }
}
