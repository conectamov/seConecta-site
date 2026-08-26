import type { Metadata } from "next";
import type { OpportunityDetail } from "@/types/opportunity-detail";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://beta.seconecta.org").replace(/\/$/, "");

function compact(value: string) { return value.replace(/\s+/g, " ").trim(); }
function truncate(value: string, length: number) {
  const normalized = compact(value);
  return normalized.length <= length ? normalized : `${normalized.slice(0, length - 1).replace(/\s+\S*$/, "")}…`;
}
function displayName(opportunity: OpportunityDetail) {
  return /^[A-ZÀ-Ý0-9]{2,10}$/.test(opportunity.organization) ? opportunity.organization : opportunity.title;
}

export function getOpportunityCanonicalPath(opportunity: OpportunityDetail) { return `/oportunidades/${opportunity.slug}`; }
export function getOpportunityCanonicalUrl(opportunity: OpportunityDetail) { return `${SITE_URL}${getOpportunityCanonicalPath(opportunity)}`; }

export function generateOpportunityMetadata(opportunity: OpportunityDetail): Metadata {
  const year = new Date().getFullYear();
  const name = displayName(opportunity);
  const title = `${name} ${year} | Inscrição, cronograma e guia completo | seConecta`;
  const description = truncate(`Conheça ${name}: quem pode participar, prazo, requisitos, cronograma, materiais e informações oficiais para decidir seu próximo passo.`, 160);
  const canonical = getOpportunityCanonicalUrl(opportunity);
  const image = new URL(opportunity.coverImage ?? "/icon.png", SITE_URL).toString();
  return {
    title, description, alternates: { canonical }, robots: { index: true, follow: true },
    openGraph: { type: "website", locale: "pt_BR", url: canonical, siteName: "seConecta", title, description, images: [{ url: image, alt: opportunity.title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export function generateOpportunityJsonLd(opportunity: OpportunityDetail) {
  const canonical = getOpportunityCanonicalUrl(opportunity);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOccupationalProgram", name: opportunity.title, description: opportunity.description,
        url: canonical, sameAs: opportunity.officialUrl,
        provider: { "@type": "Organization", name: opportunity.organization, url: opportunity.officialUrl, ...(opportunity.organizationLogo ? { logo: new URL(opportunity.organizationLogo, SITE_URL).toString() } : {}) },
        educationalLevel: opportunity.educationLevel,
        timeToComplete: opportunity.overview.find((item) => item.label === "Duração")?.value,
        occupationalCategory: opportunity.type,
      },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Oportunidades", item: `${SITE_URL}/explorar` },
        { "@type": "ListItem", position: 3, name: opportunity.title, item: canonical },
      ] },
    ],
  };
}

export function serializeJsonLd(value: unknown) { return JSON.stringify(value).replace(/</g, "\\u003c"); }
