import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OpportunityDetailPage } from "@/components/opportunity-detail/opportunity-detail-page";
import { loadCanonicalOpportunity } from "@/services/opportunity-catalog-service";
import { generateOpportunityJsonLd, generateOpportunityMetadata, serializeJsonLd } from "@/services/opportunity-seo-service";

type OpportunityPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: OpportunityPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const result = await loadCanonicalOpportunity(slug);
    return result ? generateOpportunityMetadata(result.opportunity) : {};
  } catch { return {}; }
}

export default async function OpportunityPage({ params }: OpportunityPageProps) {
  const { slug } = await params;
  const result = await loadCanonicalOpportunity(slug);
  if (!result) notFound();
  const { opportunity, guide: guideDocument } = result;
  const jsonLd = generateOpportunityJsonLd(opportunity);

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
    <OpportunityDetailPage opportunity={opportunity} guideDocument={guideDocument} />
  </>;
}
