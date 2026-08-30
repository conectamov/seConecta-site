import type { MetadataRoute } from "next";
import { getCanonicalCatalog } from "@/services/opportunity-catalog-service";
import { SITE_URL } from "@/services/opportunity-seo-service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getCanonicalCatalog().catch(() => ({ data: [], count: 0 }));
  const opportunityPages = catalog.data.map((opportunity) => ({
      url: `${SITE_URL}/oportunidades/${opportunity.slug ?? opportunity.id}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));

  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/explorar`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    ...opportunityPages,
  ];
}
