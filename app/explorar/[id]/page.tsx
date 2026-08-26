import { notFound, permanentRedirect } from "next/navigation";
import { getOpportunityDetail, opportunityIds } from "@/data/opportunity-details";
import { getOpportunityCanonicalPath } from "@/services/opportunity-seo-service";

type OpportunityPageProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return opportunityIds.map((id) => ({ id: String(id) }));
}

export default async function OpportunityPage({ params }: OpportunityPageProps) {
  const { id } = await params;
  const opportunity = getOpportunityDetail(Number(id));
  if (!opportunity) notFound();
  permanentRedirect(getOpportunityCanonicalPath(opportunity));
}
