import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommunityPage } from "@/components/community/community-page";
import { getOpportunityDetailBySlug, opportunitySlugs } from "@/data/opportunity-details";

type CommunityHubRouteProps = { params: Promise<{ slug: string }>; searchParams: Promise<{ tab?: string }> };

export function generateStaticParams() {
  return opportunitySlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: CommunityHubRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const opportunity = getOpportunityDetailBySlug(slug);
  return opportunity ? { title: `Discussão sobre ${opportunity.title} | seConecta`, description: `Perguntas, experiências e recursos relacionados a ${opportunity.title}.` } : {};
}

export default async function Page({ params, searchParams }: CommunityHubRouteProps) {
  const { slug } = await params;
  await searchParams;
  const opportunity = getOpportunityDetailBySlug(slug);
  if (!opportunity) notFound();
  return <CommunityPage />;
}
