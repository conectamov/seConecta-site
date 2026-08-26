import { notFound, permanentRedirect } from "next/navigation";
import { getCanonicalOpportunity } from "@/services/opportunity-catalog-service";

type OpportunityPageProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return [];
}

export default async function OpportunityPage({ params }: OpportunityPageProps) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const opportunity = await getCanonicalOpportunity(id);
  if (!opportunity) notFound();
  permanentRedirect(`/oportunidades/${opportunity.slug ?? opportunity.id}`);
}
