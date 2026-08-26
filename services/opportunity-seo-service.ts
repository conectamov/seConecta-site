import type { Metadata } from "next";
import type { OpportunityDetail } from "@/data/opportunity-details";
import { getOpportunityCommunityHub } from "@/data/opportunity-knowledge-hubs";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://seconecta.com.br").replace(/\/$/, "");

export type OpportunityFaqItem = {
  question: string;
  answer: string;
  source: "official" | "community" | "ai-summary";
};

function compact(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, length: number) {
  const normalized = compact(value);
  if (normalized.length <= length) return normalized;
  return `${normalized.slice(0, length - 1).replace(/\s+\S*$/, "")}…`;
}

function displayName(opportunity: OpportunityDetail) {
  if (/^[A-ZÀ-Ý0-9]{2,10}$/.test(opportunity.organization)) return opportunity.organization;
  return opportunity.title;
}

export function getOpportunityCanonicalPath(opportunity: OpportunityDetail) {
  return `/oportunidades/${opportunity.slug}`;
}

export function getOpportunityCanonicalUrl(opportunity: OpportunityDetail) {
  return `${SITE_URL}${getOpportunityCanonicalPath(opportunity)}`;
}

export function generateOpportunityFaqs(opportunity: OpportunityDetail): OpportunityFaqItem[] {
  const hub = getOpportunityCommunityHub(opportunity);
  const required = opportunity.requirements.filter((item) => item.required).map((item) => item.label);
  const previousExperience = opportunity.requirements.find((item) => /experiência|projeto anterior/i.test(item.label));
  const preparation = opportunity.guidance.actions.length > 0
    ? opportunity.guidance.actions.join(" ")
    : opportunity.orientation.paragraphs[0];

  const candidates: OpportunityFaqItem[] = [
    {
      question: `O que é ${displayName(opportunity)}?`,
      answer: opportunity.description,
      source: "official",
    },
    {
      question: `Quem pode participar de ${displayName(opportunity)}?`,
      answer: `${opportunity.educationLevel} é o nível indicado para esta oportunidade.${required.length > 0 ? ` Entre os itens obrigatórios estão ${required.slice(0, 3).join(", ")}.` : ""} Confirme critérios específicos da edição no site oficial.`,
      source: "official",
    },
    {
      question: `Como funcionam as inscrições para ${displayName(opportunity)}?`,
      answer: opportunity.applicationStatus === "closed"
        ? `As inscrições desta edição estão encerradas. ${opportunity.deadlineNote}. Acompanhe a organização para saber quando o próximo ciclo será aberto.`
        : opportunity.applicationStatus === "upcoming"
          ? `As inscrições ainda não abriram. ${opportunity.deadlineNote}.`
          : `As inscrições estão abertas até ${opportunity.deadline}. ${opportunity.deadlineNote}. O envio deve ser feito pelo canal oficial da organização.`,
      source: "official",
    },
    {
      question: `Quão difícil ou competitivo é ${displayName(opportunity)}?`,
      answer: `A competitividade informada é ${opportunity.competitiveness.toLocaleLowerCase("pt-BR")}. A seleção pode variar por edição; use os requisitos e critérios oficiais como referência, não apenas o número de candidatos.`,
      source: "community",
    },
    {
      question: "Preciso ter experiência anterior?",
      answer: previousExperience
        ? `${previousExperience.detail}. ${previousExperience.required ? "Este item aparece como obrigatório." : "Ele pode ajudar, mas não aparece como obrigatório."}`
        : "Experiência anterior não aparece entre os requisitos obrigatórios cadastrados. Ainda assim, confirme as regras da edição no site oficial.",
      source: "community",
    },
    {
      question: `Como devo me preparar para ${displayName(opportunity)}?`,
      answer: truncate(`${preparation} Revise os requisitos, organize os documentos e reserve tempo para conferir o envio antes do prazo.`, 500),
      source: "ai-summary",
    },
    ...opportunity.popularQuestions.map((item) => ({
      question: item.question,
      answer: item.answer,
      source: "official" as const,
    })),
    ...hub.questions.slice(0, 2).map((item) => ({
      question: item.title,
      answer: item.topic === "Elegibilidade"
        ? `${opportunity.educationLevel} é o nível indicado. Confira idade, série e demais condições no regulamento oficial.`
        : item.topic === "Processo seletivo"
          ? `A competitividade informada é ${opportunity.competitiveness.toLocaleLowerCase("pt-BR")}. Uma candidatura clara, completa e alinhada aos critérios oficiais tende a ser mais forte.`
          : `Use os requisitos e o guia de ${opportunity.title} como base e confirme detalhes da edição no site oficial.`,
      source: "community" as const,
    })),
  ];

  const seen = new Set<string>();
  return candidates.filter((item) => {
    const key = item.question.toLocaleLowerCase("pt-BR").replace(/[?!.,]/g, "").trim();
    if (seen.has(key) || !compact(item.answer)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10);
}

export function generateOpportunityMetadata(opportunity: OpportunityDetail): Metadata {
  const year = new Date().getFullYear();
  const name = displayName(opportunity);
  const title = `${name} ${year} | Guia completo, inscrição, cronograma e preparação | seConecta`;
  const description = truncate(`Descubra quem pode participar de ${name}, inscrições, cronograma, preparação, materiais, dúvidas frequentes e acompanhe sua candidatura pelo seConecta.`, 160);
  const canonical = getOpportunityCanonicalUrl(opportunity);
  const image = new URL(opportunity.coverImage ?? "/icon.png", SITE_URL).toString();

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: canonical,
      siteName: "seConecta",
      title,
      description,
      images: [{ url: image, alt: opportunity.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

export function generateOpportunityJsonLd(opportunity: OpportunityDetail) {
  const canonical = getOpportunityCanonicalUrl(opportunity);
  const faqs = generateOpportunityFaqs(opportunity);
  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Oportunidades", item: `${SITE_URL}/explorar` },
      { "@type": "ListItem", position: 3, name: opportunity.title, item: canonical },
    ],
  };
  const opportunitySchema = {
    "@type": "EducationalOccupationalProgram",
    name: opportunity.title,
    description: opportunity.description,
    url: canonical,
    sameAs: opportunity.officialUrl,
    provider: {
      "@type": "Organization",
      name: opportunity.organization,
      url: opportunity.officialUrl,
      ...(opportunity.organizationLogo ? { logo: new URL(opportunity.organizationLogo, SITE_URL).toString() } : {}),
    },
    educationalLevel: opportunity.educationLevel,
    timeToComplete: opportunity.overview.find((item) => item.label === "Duração")?.value,
    occupationalCategory: opportunity.type,
  };
  const faqSchema = faqs.length > 0 ? {
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  } : null;

  return {
    "@context": "https://schema.org",
    "@graph": [opportunitySchema, breadcrumb, ...(faqSchema ? [faqSchema] : [])],
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
