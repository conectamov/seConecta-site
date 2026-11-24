import { notFound } from "next/navigation";
import { OpportunityDetailPage } from "@/components/opportunity-detail/opportunity-detail-page";
import { curationWorkflowEnabled, staffApi, staffPortalEnabled } from "@/lib/staff-api";
import { mapOpportunityDetail, mapOpportunityGuide } from "@/services/opportunity-catalog-service";
import type { OpportunityDetailApi } from "@/types/seconecta-api";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function StaffOpportunityPreview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: id } = await params;
  if (!staffPortalEnabled() || !curationWorkflowEnabled() || !/^\d+$/.test(id)) notFound();
  let item: OpportunityDetailApi;
  try {
    item = await staffApi<OpportunityDetailApi>(`/staff/opportunities/${id}/preview`);
  } catch (error) {
    if (error instanceof Error && /STAFF_UNAUTHENTICATED|STAFF_API_(401|403|404):/.test(error.message)) notFound();
    throw error;
  }
  const opportunity = mapOpportunityDetail(item);
  return <OpportunityDetailPage opportunity={opportunity} guideDocument={mapOpportunityGuide(item, opportunity)} />;
}
