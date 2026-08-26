import type { MetadataRoute } from "next";
import { opportunityIds, getOpportunityDetail } from "@/data/opportunity-details";
import { learnGoals } from "@/data/learn-content";
import { getOpportunityCanonicalUrl, SITE_URL } from "@/services/opportunity-seo-service";

export default function sitemap(): MetadataRoute.Sitemap {
  const opportunityPages = opportunityIds.flatMap((id) => {
    const opportunity = getOpportunityDetail(id);
    return opportunity ? [{
      url: getOpportunityCanonicalUrl(opportunity),
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    }] : [];
  });

  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/explorar`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/aprender`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    ...learnGoals.map((goal) => ({
      url: `${SITE_URL}/aprender/${goal.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...opportunityPages,
  ];
}
