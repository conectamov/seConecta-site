import { notFound } from "next/navigation";
import { OpportunityEditor } from "@/components/staff/opportunity-editor";
import { curationWorkflowEnabled, staffApi } from "@/lib/staff-api";
import type { StaffMe, StaffOpportunityDetail } from "@/types/staff";

export default async function StaffOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!curationWorkflowEnabled()) notFound();
  const path = `/staff/opportunities/${encodeURIComponent(id)}`;
  try {
    const [detail, metrics, me] = await Promise.all([
      staffApi<StaffOpportunityDetail>(path),
      staffApi<NonNullable<StaffOpportunityDetail["metrics"]>>(`${path}/metrics?days=30`),
      staffApi<StaffMe>("/staff-auth/me"),
    ]);
    return <OpportunityEditor key={id} initial={{ ...detail, metrics }} isAdmin={me.staff_role === "ADMIN"} />;
  } catch {
    notFound();
  }
}
