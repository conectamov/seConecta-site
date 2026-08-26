export type OpportunityDetail = {
  id: number;
  slug: string;
  title: string;
  organization: string;
  officialUrl: string;
  organizationLogo?: string;
  coverImage?: string;
  type: string;
  location: string;
  educationLevel: string;
  deadline: string;
  deadlineNote: string;
  competitiveness: string;
  applicationStatus: "open" | "closed" | "upcoming";
  summary: string;
  description: string;
  fitSummary: string;
  orientation: {
    recommendation: "prioritize" | "consider" | "deprioritize";
    headline: string;
    paragraphs: string[];
    considerations: string[];
    now: { label: string; text: string }[];
    alternative?: { message: string; categories: string[] };
  };
  recommendationReasons: string[];
  overview: { label: string; value: string; detail?: string }[];
  requirements: { label: string; detail: string; required: boolean }[];
  trajectory: { label: string; context: string; active?: boolean }[];
  guidance: { title: string; body: string; actions: string[] };
  timeline: { date: string; label: string; detail: string; current?: boolean }[];
  people: { name: string; role: string; journey: string; image: string; helpsWith: string[] }[];
  studentJourneys: { name: string; image: string; location: string; steps: string[] }[];
  similar: { id: number; type: string; title: string; fit: string; deadline: string }[];
  discoveryCategories: { label: string; description: string; query: string }[];
  popularQuestions: { question: string; answer: string }[];
  suggestedQuestions: {
    orientation: string[];
    requirements: string[];
    trajectory: string[];
  };
};

const primaryOpportunity: OpportunityDetail = {
  id: 1,
  slug: "programa-de-verao-em-inteligencia-artificial",
  title: "Programa de Verão em Inteligência Artificial",
  organization: "Instituto de Computação Aplicada",
  officialUrl: "https://institutodecomputacaoaplicada.org/programa-de-verao-em-inteligencia-artificial",
  coverImage: "/yygs-cover.jpg",
  type: "Programa de Verão",
  location: "São Paulo, SP · Híbrido",
  educationLevel: "Ensino Médio",
  deadline: "21 de julho",
  deadlineNote: "5 dias para se candidatar",
  competitiveness: "Alta",
  applicationStatus: "open",
  summary: "Quatro semanas desenvolvendo um projeto de IA com pesquisadores e estudantes de todo o Brasil — com bolsa integral para participantes selecionados.",
  description: "Durante quatro semanas, estudantes selecionados desenvolvem um projeto orientado de Inteligência Artificial em encontros híbridos com pesquisadores. O programa combina introdução técnica, acompanhamento e uma apresentação final, com apoio de transporte e alimentação para participantes bolsistas.",
  fitSummary: "Faz sentido se você quer transformar interesse em tecnologia em uma primeira experiência orientada de pesquisa.",
  orientation: {
    recommendation: "prioritize",
    headline: "Achamos que esta oportunidade merece sua atenção.",
    paragraphs: [
      "Ela combina bastante com seu interesse em Inteligência Artificial e pesquisa. Além disso, você já acompanha programas semelhantes, o que indica que ela faz sentido neste momento da sua jornada.",
      "Como as inscrições encerram em cinco dias, recomendamos priorizá-la ainda esta semana.",
    ],
    considerations: ["Pesquisa", "Inteligência Artificial", "Ensino Médio", "Programas intensivos", "Objetivo: experiência prática"],
    now: [
      { label: "Prazo", text: "Faltam 5 dias para o encerramento das inscrições." },
      { label: "Prioridade", text: "Ela merece atenção antes de outras oportunidades que você acompanha porque o prazo termina primeiro." },
      { label: "Preparação", text: "Reserve entre 8 e 12 horas nesta semana para concluir a candidatura com calma." },
    ],
  },
  recommendationReasons: ["Pesquisa", "Inteligência Artificial", "Ensino Médio", "Programas intensivos"],
  overview: [
    { label: "Duração", value: "4 semanas", detail: "6h por semana" },
    { label: "Local", value: "São Paulo", detail: "Encontros híbridos" },
    { label: "Idioma", value: "Português" },
    { label: "Formato", value: "Híbrido", detail: "Aulas e projeto" },
    { label: "Custo", value: "Gratuito" },
    { label: "Bolsa", value: "Integral", detail: "Transporte e alimentação" },
    { label: "Concorrência", value: "Alta", detail: "Seleção nacional" },
    { label: "Preparação", value: "8–12 horas", detail: "Estimativa seConecta" },
  ],
  requirements: [
    { label: "Formulário de candidatura", detail: "Informações acadêmicas e interesses", required: true },
    { label: "Texto de motivação", detail: "Até 500 palavras sobre uma pergunta que você quer investigar", required: true },
    { label: "Histórico escolar", detail: "PDF simples emitido pela escola", required: true },
    { label: "Carta de recomendação", detail: "De professor ou orientador que conheça seu trabalho", required: true },
    { label: "Projeto ou experiência anterior", detail: "Ajuda, mas não é obrigatório", required: false },
    { label: "Entrevista online", detail: "20 minutos para finalistas", required: true },
  ],
  trajectory: [
    { label: "Clube ou curso de tecnologia", context: "Uma primeira base" },
    { label: "Programa de Verão em IA", context: "Você está aqui", active: true },
    { label: "Iniciação científica", context: "Aprofundar uma pergunta" },
    { label: "Feira nacional de ciências", context: "Compartilhar resultados" },
  ],
  guidance: {
    title: "Vale considerar com atenção.",
    body: "Você já demonstrou interesse em pesquisa e Inteligência Artificial. Este programa pode ser uma boa ponte entre curiosidade e experiência prática, mas exige preparação concentrada nesta semana.",
    actions: ["Comece pelo texto de motivação — é a parte que mais exige reflexão.", "Peça a carta de recomendação até amanhã.", "Reserve dois blocos de 90 minutos para revisar a candidatura."],
  },
  timeline: [
    { date: "03 jun", label: "Inscrições abertas", detail: "Formulário disponível" },
    { date: "21 jul", label: "Inscrições encerram", detail: "Até 23h59", current: true },
    { date: "05 ago", label: "Entrevistas", detail: "Finalistas recebem convite" },
    { date: "12 ago", label: "Resultados", detail: "Divulgação por e-mail" },
    { date: "02 set", label: "Programa começa", detail: "Encontro de abertura" },
  ],
  people: [
    { name: "Luiza Mendes", role: "Foi participante", journey: "Pesquisa aplicada em IA na escola pública", image: "/trajectory-luiza.png", helpsWith: ["candidatura", "rotina do programa"] },
    { name: "Rafael Costa", role: "É mentor", journey: "Da feira de ciências ao laboratório", image: "/trajectory-rafael.png", helpsWith: ["preparação", "projeto de pesquisa"] },
    { name: "Isadora Lima", role: "Foi aprovada", journey: "Programação, hackathons e bolsa em tecnologia", image: "/trajectory-isadora.png", helpsWith: ["entrevista", "texto de motivação"] },
  ],
  studentJourneys: [
    { name: "Luiza", image: "/trajectory-luiza.png", location: "Salvador · Escola pública", steps: ["Clube de Ciência", "Programa de Verão em IA", "Pesquisa aplicada", "Feira Brasileira de Ciências"] },
    { name: "Rafael", image: "/trajectory-rafael.png", location: "Manaus · Ensino médio", steps: ["Curso online", "Projeto autoral", "Programa de Verão em IA", "Iniciação científica"] },
  ],
  similar: [
    { id: 3, type: "Pesquisa", title: "Iniciação Científica Júnior em Biotecnologia", fit: "Para começar com mentoria", deadline: "Até 31 jul" },
    { id: 4, type: "Bolsa", title: "Bolsa Jovens Talentos em Tecnologia", fit: "Formação mais longa e gratuita", deadline: "Até 28 jul" },
    { id: 7, type: "Competição", title: "Maratona Brasileira de Programação Júnior", fit: "Para colocar conhecimento em prática", deadline: "Até 24 jul" },
  ],
  discoveryCategories: [
    { label: "Pesquisa científica", description: "Transforme curiosidade em investigação orientada.", query: "Pesquisa" },
    { label: "Programas de verão", description: "Experiências intensivas para ampliar repertório.", query: "Programa de Verão" },
    { label: "Hackathons", description: "Construa projetos em equipe e sob pressão.", query: "Hackathon" },
    { label: "Olimpíadas", description: "Desenvolva conhecimento por meio de desafios.", query: "Olimpíada" },
    { label: "Intercâmbios", description: "Descubra caminhos acadêmicos internacionais.", query: "Intercâmbio" },
  ],
  popularQuestions: [
    { question: "Posso participar sendo do 1º ano?", answer: "Sim. Estudantes de qualquer ano do Ensino Médio podem participar, desde que consigam cumprir a carga semanal." },
    { question: "Preciso saber inglês?", answer: "Não. As atividades e a candidatura são realizadas em português." },
    { question: "Qual costuma ser o perfil dos selecionados?", answer: "Curiosidade, clareza de motivação e disposição para desenvolver um projeto contam mais do que experiência avançada." },
    { question: "Quanto tempo leva a candidatura?", answer: "Reserve entre 8 e 12 horas, distribuídas em alguns dias, para preparar e revisar tudo com calma." },
  ],
  suggestedQuestions: {
    orientation: ["Sou competitivo para esta oportunidade?", "Devo priorizá-la entre as que acompanho?", "O que costuma destacar uma candidatura?"],
    requirements: ["Quanto tempo devo reservar para cada item?", "Quem pode escrever minha recomendação?", "Como começar o texto de motivação?"],
    trajectory: ["Como esta oportunidade complementa minha jornada?", "Qual pode ser meu próximo passo depois dela?", "Preciso seguir todas essas etapas?"],
  },
};

const catalogSummaries: Record<number, Pick<OpportunityDetail, "title" | "organization" | "type" | "officialUrl">> = {
  1: { title: primaryOpportunity.title, organization: primaryOpportunity.organization, type: primaryOpportunity.type, officialUrl: primaryOpportunity.officialUrl },
  2: { title: "Olimpíada Brasileira de Matemática — 2ª fase", organization: "OBMEP", type: "Olimpíada", officialUrl: "https://www.obmep.org.br/" },
  3: { title: "Iniciação Científica Júnior em Biotecnologia", organization: "Laboratório Horizonte", type: "Pesquisa", officialUrl: "https://laboratoriohorizonte.org.br/iniciacao-cientifica" },
  4: { title: "Bolsa Jovens Talentos em Tecnologia", organization: "Fundação Pró-Futuro", type: "Bolsa", officialUrl: "https://fundacaoprofuturo.org.br/jovens-talentos" },
  5: { title: "Desafio Nacional de Soluções Climáticas", organization: "Impacta Jovem", type: "Competição", officialUrl: "https://impactajovem.org.br/desafio-climatico" },
  6: { title: "Summer School de Ciência de Dados", organization: "Universidade Atlântica", type: "Programa de Verão", officialUrl: "https://universidadeatlantica.edu/summer-school-data" },
  7: { title: "Maratona Brasileira de Programação Júnior", organization: "Sociedade Brasileira de Computação", type: "Competição", officialUrl: "https://www.sbc.org.br/" },
  8: { title: "Programa Jovens Empreendedores", organization: "Instituto Geração", type: "Mentoria", officialUrl: "https://institutogeracao.org.br/jovens-empreendedores" },
  9: { title: "Mentoria para Bolsas Internacionais", organization: "Pontes Educação", type: "Mentoria", officialUrl: "https://ponteseducacao.org.br/mentoria-bolsas" },
};

export function getOpportunityDetail(id: number): OpportunityDetail | null {
  const catalogItem = catalogSummaries[id];
  if (!catalogItem) return null;
  if (id === 1) return primaryOpportunity;

  const detail: OpportunityDetail = {
    ...primaryOpportunity,
    ...catalogItem,
    coverImage: undefined,
    id,
    slug: (() => {
      const acronym = catalogItem.organization.trim();
      const uniqueAcronym = /^[A-Z0-9]{2,10}$/.test(acronym)
        && Object.values(catalogSummaries).filter((item) => item.organization === acronym).length === 1;
      return (uniqueAcronym ? acronym : catalogItem.title).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    })(),
    summary: `${catalogItem.title} é uma experiência selecionada pela seConecta para estudantes que querem avançar com orientação e clareza sobre os próximos passos.`,
    description: `${catalogItem.title} oferece uma experiência estruturada para estudantes do Ensino Médio conhecerem a área, desenvolverem habilidades práticas e entenderem os próximos passos possíveis. Consulte a organização responsável para confirmar formato, conteúdo e regras desta edição.`,
    fitSummary: `Faz sentido para estudantes que desejam explorar ${catalogItem.type.toLowerCase()} e transformar interesse em experiência concreta.`,
    recommendationReasons: [catalogItem.type, "Ensino Médio", "Gratuito", "Combina com seus interesses"],
    trajectory: primaryOpportunity.trajectory.map((step, index) => index === 1 ? { ...step, label: catalogItem.title } : step),
    similar: primaryOpportunity.similar.filter((item) => item.id !== id),
  };

  if (id === 2) {
    return {
      ...detail,
      deadline: "Inscrições encerradas",
      deadlineNote: "Acompanhe a próxima edição",
      applicationStatus: "closed",
      orientation: {
        recommendation: "deprioritize",
        headline: "Talvez esta não seja a melhor prioridade para você neste momento.",
        paragraphs: [
          "As inscrições desta edição já encerraram e você ainda está construindo a preparação necessária para a segunda fase.",
          "Pelo que sabemos até agora, outras oportunidades abertas parecem oferecer um retorno maior para os objetivos que você definiu.",
        ],
        considerations: ["Matemática", "Ensino Médio", "Inscrições encerradas", "Preparação olímpica"],
        now: [
          { label: "Situação", text: "A edição atual não aceita novas inscrições." },
          { label: "Prioridade", text: "Concentre seu tempo em uma oportunidade aberta com prazo próximo." },
          { label: "Preparação", text: "Use este ciclo para fortalecer sua base e acompanhar a próxima edição." },
        ],
        alternative: {
          message: "Se o seu objetivo é avançar em matemática, estas trilhas podem fazer mais sentido agora:",
          categories: ["Olimpíadas com inscrições abertas", "Mentorias de matemática", "Programas de preparação"],
        },
      },
    };
  }

  return detail;
}

export const opportunityIds = Object.keys(catalogSummaries).map(Number);
export const opportunitySlugs = opportunityIds.map((id) => getOpportunityDetail(id)!).map((opportunity) => opportunity.slug);

export function getOpportunityDetailBySlug(slug: string): OpportunityDetail | null {
  return opportunityIds.map((id) => getOpportunityDetail(id)).find((opportunity) => opportunity?.slug === slug) ?? null;
}
