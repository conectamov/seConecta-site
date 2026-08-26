import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { OpportunityDetail } from "@/data/opportunity-details";
import type { OpportunityGuideDocument } from "@/types/opportunity-knowledge-hub";

type GuideFrontmatter = Partial<Pick<OpportunityGuideDocument, "title" | "summary" | "updatedAt" | "readTime">>;

function parseFrontmatter(source: string): { metadata: GuideFrontmatter; markdown: string } {
  if (!source.startsWith("---\n")) return { metadata: {}, markdown: source };
  const end = source.indexOf("\n---\n", 4);
  if (end === -1) return { metadata: {}, markdown: source };

  const metadata = source.slice(4, end).split("\n").reduce<GuideFrontmatter>((result, line) => {
    const separator = line.indexOf(":");
    if (separator === -1) return result;
    const key = line.slice(0, separator).trim() as keyof GuideFrontmatter;
    const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (["title", "summary", "updatedAt", "readTime"].includes(key)) result[key] = value;
    return result;
  }, {});

  return { metadata, markdown: source.slice(end + 5).trim() };
}

function createFallbackMarkdown(opportunity: OpportunityDetail) {
  const facts = opportunity.overview
    .map((item) => `| ${item.label} | ${item.value}${item.detail ? ` — ${item.detail}` : ""} |`)
    .join("\n");
  const requirements = opportunity.requirements
    .map((item) => `- [ ] **${item.label}** — ${item.detail}${item.required ? "" : " *(diferencial)*"}`)
    .join("\n");
  const timeline = opportunity.timeline.length
    ? `\n## Cronograma\n\n| Etapa | Data | O que acontece |\n| --- | --- | --- |\n${opportunity.timeline.map((item) => `| ${item.label} | ${item.date} | ${item.detail} |`).join("\n")}\n`
    : "";
  const faq = opportunity.popularQuestions.length
    ? `\n## Dúvidas frequentes\n\n${opportunity.popularQuestions.map((item) => `### ${item.question}\n\n${item.answer}`).join("\n\n")}\n`
    : "";

  return `## O que é esta oportunidade

${opportunity.summary}

${opportunity.description}

| Informação | Detalhe |
| --- | --- |
${facts}

## Quem pode participar

Esta oportunidade é voltada para estudantes de **${opportunity.educationLevel}**. Confirme os critérios completos e eventuais exceções na página oficial.

## O que preparar

${requirements}

> **Antes de começar:** o Guia organiza as informações para facilitar sua decisão, mas o edital e o site da organização continuam sendo as fontes definitivas.

## Como organizar a candidatura

1. Confirme sua elegibilidade.
2. Reúna os documentos objetivos.
3. Prepare textos e projetos com exemplos concretos.
4. Peça uma revisão antes do envio.
5. Guarde a confirmação da candidatura.
${timeline}
## Como funciona a seleção

${opportunity.guidance.body}

${opportunity.fitSummary}
${faq}
## Referências

- [Página oficial — ${opportunity.organization}](${opportunity.officialUrl})
- [Checklist da candidatura](/explorar/${opportunity.id}?secao=requisitos)
- [Materiais selecionados](/oportunidades/${opportunity.slug}?secao=materiais)
`;
}

export async function loadOpportunityGuide(opportunity: OpportunityDetail): Promise<OpportunityGuideDocument> {
  const guidePath = path.join(process.cwd(), "content", "opportunity-guides", `${opportunity.slug}.md`);
  let source: string | null = null;

  try {
    source = await readFile(guidePath, "utf8");
  } catch {
    // Opportunities without a curated file still receive a complete metadata-based guide.
  }

  const parsed = source ? parseFrontmatter(source) : { metadata: {}, markdown: createFallbackMarkdown(opportunity) };

  return {
    opportunityId: opportunity.id,
    slug: opportunity.slug,
    title: parsed.metadata.title ?? `Guia para ${opportunity.title}`,
    summary: parsed.metadata.summary ?? "Informações, etapas e referências para entender a oportunidade e preparar sua candidatura.",
    updatedAt: parsed.metadata.updatedAt ?? "Revisado em 23 de julho de 2026",
    readTime: parsed.metadata.readTime ?? "8 min de leitura",
    markdown: parsed.markdown,
  };
}
