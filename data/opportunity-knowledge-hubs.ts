import type { OpportunityDetail } from "@/data/opportunity-details";
import type { OpportunityCommunityHub } from "@/types/opportunity-knowledge-hub";

export function getOpportunityCommunityHub(opportunity: OpportunityDetail): OpportunityCommunityHub {
  return {
    opportunityId: opportunity.id,
    opportunitySlug: opportunity.slug,
    whatsappGroupUrl: process.env.NEXT_PUBLIC_SECONNECTA_WHATSAPP_COMMUNITY_URL ?? "https://chat.whatsapp.com/",
    activeNow: 14 + opportunity.id * 4,
    questions: [
      { id: "competition", opportunityId: opportunity.id, title: "Quão competitivo é este programa?", preview: `Quero entender o nível esperado e o que realmente diferencia uma candidatura para ${opportunity.title}.`, replies: 12, lastActivity: "Há 18 min", author: "Marina A.", topic: "Processo seletivo", difficulty: "Intermediária", applicationStage: "Explorando" },
      { id: "eligibility", opportunityId: opportunity.id, title: "Posso me candidatar estando no 2º ano?", preview: "Li os requisitos oficiais, mas fiquei em dúvida sobre como o nível de ensino é considerado.", replies: 8, lastActivity: "Há 1 h", author: "Pedro L.", topic: "Elegibilidade", difficulty: "Inicial", applicationStage: "Explorando" },
      { id: "motivation-letter", opportunityId: opportunity.id, title: "Como devo preparar minha carta de motivação?", preview: "Quais experiências vale destacar e como evitar que o texto pareça genérico?", replies: 6, lastActivity: "Ontem", author: "Ana C.", topic: "Carta de motivação", difficulty: "Intermediária", applicationStage: "Preparando candidatura" },
      { id: "brazil", opportunityId: opportunity.id, title: "Alguém do Brasil já foi aprovado antes?", preview: "Gostaria de ouvir como estudantes brasileiros organizaram documentos e preparação.", replies: 9, lastActivity: "Ontem", author: "Lucas R.", topic: "Experiências anteriores", difficulty: "Inicial", applicationStage: "Interessado" },
    ],
    approvedStudents: opportunity.people.slice(0, 3).map((person, index) => ({
      id: `approved-${index + 1}`,
      name: person.name,
      image: person.image,
      acceptedYear: 2025 - (index % 2),
      institution: index === 0 ? "Universidade de São Paulo" : index === 1 ? "Universidade Federal de Minas Gerais" : "Instituto Federal de São Paulo",
      story: person.journey,
    })),
    applicants: opportunity.people.slice(0, 3).map((person, index) => ({
      id: `applicant-${index + 1}`,
      name: index === 0 ? "Pedro" : index === 1 ? "Marina" : "João",
      image: person.image,
      stage: 2 + index,
      totalStages: 6,
      focus: index === 0 ? "Preparando portfólio" : index === 1 ? "Revisando carta de motivação" : "Organizando documentos",
      lastActive: index === 2 ? "Ativo ontem" : "Ativo hoje",
    })),
    experiences: [
      { id: "after-applying", title: "O que aprendi depois de me candidatar", excerpt: "O processo foi menos sobre ter um currículo perfeito e mais sobre explicar minhas escolhas.", author: "Luiza Mendes", connection: "Foi participante", readTime: "4 min" },
      { id: "interview", title: "Minha experiência na entrevista", excerpt: "As perguntas buscaram entender como eu pensava, não testar respostas decoradas.", author: "Isadora Lima", connection: "Foi aprovada", readTime: "3 min" },
      { id: "wish-knew", title: "O que eu gostaria de ter sabido antes", excerpt: "Começar o texto cedo teria deixado espaço para pedir feedback com calma.", author: "Rafael Costa", connection: "É mentor", readTime: "5 min" },
    ],
    preparation: [
      { id: "preparing-now", title: `${14 + opportunity.id * 4} estudantes estão preparando agora`, detail: "Veja quem está na mesma etapa que você.", participants: 14 + opportunity.id * 4, actionLabel: "Ver estudantes" },
      { id: "accountability", title: "Procurando parceiro de preparação", detail: "Combine pequenos check-ins até o prazo.", participants: 6, actionLabel: "Participar" },
      { id: "study-group", title: "Grupo de estudo desta semana", detail: "Encontro focado em dúvidas e organização.", participants: 9, actionLabel: "Ver grupo" },
      { id: "essay-review", title: "Rodada de revisão de textos", detail: "Troque feedback com outros candidatos.", participants: 5, actionLabel: "Pedir revisão" },
    ],
    updates: [
      { id: "deadline", title: "Prazo confirmado pela organização", detail: opportunity.deadlineNote, timestamp: "Hoje, 09:20", source: "official" },
      { id: "faq", title: "FAQ oficial recebeu novas respostas", detail: "A organização esclareceu dúvidas sobre documentos e participação.", timestamp: "Ontem", source: "official" },
      { id: "results", title: "Calendário de resultados atualizado", detail: "A data já aparece no cronograma da oportunidade.", timestamp: "Há 3 dias", source: "community" },
    ],
    sharedResources: [
      { id: "checklist", title: "Checklist para revisar a candidatura", description: "Uma lista curta para conferir documentos, textos e envio.", type: "Template", sharedBy: "Marina Alves", saves: 31, site: "Notion", href: "https://www.notion.so/templates", favicon: "https://www.notion.so/images/favicon.ico" },
      { id: "essay-example", title: "Melhores cartas de motivação comentadas", description: "Exemplos compartilhados com observações sobre clareza, evidências e narrativa.", type: "Cartas", sharedBy: "Luiza Mendes", saves: 42, site: "Google Docs", href: "https://docs.google.com/", favicon: "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico" },
      { id: "project-examples", title: "Projetos e portfólios de candidaturas aprovadas", description: "Referências práticas para entender profundidade, formato e apresentação.", type: "Exemplos", sharedBy: "Comunidade seConecta", saves: 36, site: "Notion", href: "https://www.notion.so/templates", favicon: "https://www.notion.so/images/favicon.ico" },
      { id: "interview-notes", title: "Experiências e perguntas de entrevista", description: "Relatos organizados por motivação, trajetória e interesse acadêmico.", type: "Entrevista", sharedBy: "Rafael Costa", saves: 27, site: "GitHub", href: "https://github.com/", favicon: "https://github.com/favicon.ico" },
      { id: "official-faq", title: "Resumo do FAQ oficial", description: "As respostas oficiais mais importantes, organizadas em linguagem direta.", type: "FAQ oficial", sharedBy: "Equipe seConecta", saves: 51, site: opportunity.organization, href: opportunity.officialUrl, favicon: opportunity.organizationLogo ?? "/icon.png" },
    ],
  };
}
