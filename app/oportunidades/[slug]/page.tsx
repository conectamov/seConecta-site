import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OpportunityDetailPage } from "@/components/opportunity-detail/opportunity-detail-page";
import { getOpportunityDetailBySlug, opportunitySlugs } from "@/data/opportunity-details";
import { loadOpportunityGuide } from "@/services/opportunity-guide-markdown-service";
import { generateOpportunityJsonLd, generateOpportunityMetadata, serializeJsonLd } from "@/services/opportunity-seo-service";

type OpportunityPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;

export function generateStaticParams() {
  return opportunitySlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: OpportunityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const opportunity = getOpportunityDetailBySlug(slug);
  return opportunity ? generateOpportunityMetadata(opportunity) : {};
}

export default async function OpportunityPage({ params }: OpportunityPageProps) {
  const { slug } = await params;
  const opportunity = getOpportunityDetailBySlug(slug);
  if (!opportunity) notFound();
  const guideDocument = await loadOpportunityGuide(opportunity);
  const jsonLd = generateOpportunityJsonLd(opportunity);

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
    <OpportunityDetailPage opportunity={opportunity} guideDocument={guideDocument} />
  </>;
}
