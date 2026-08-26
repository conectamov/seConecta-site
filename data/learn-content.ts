export type LearnGoal = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
  accent: "gold" | "blue" | "green" | "violet" | "rose" | "orange" | "cyan" | "slate";
  opportunityIds: number[];
  topics: string[];
};

export type LearnGuide = {
  slug: string;
  title: string;
  summary: string;
  icon: string;
  minutes: number;
  difficulty: "Começando" | "Intermediário" | "Avançado";
  updatedAt: string;
  goalSlugs: string[];
  topics: string[];
};

export type LearnResource = {
  id: string;
  type: "Curso" | "Template" | "Roadmap" | "Playlist" | "Livro" | "Repositório" | "Site oficial";
  title: string;
  provider: string;
  difficulty: "Começando" | "Intermediário" | "Avançado";
  estimatedTime: string;
  goalSlugs: string[];
  opportunityIds: number[];
  href: string;
};

export type LearnStory = {
  id: string;
  title: string;
  person: string;
  summary: string;
  goalSlugs: string[];
  opportunityIds: number[];
};

export type LearnUpdate = {
  id: string;
  type: "Oportunidade" | "Prazo" | "Guia" | "Resultado" | "Comunicado";
  title: string;
  description: string;
  date: string;
  href: string;
  goalSlugs: string[];
};

export const learnGoals: LearnGoal[] = [
  { slug: "olimpiadas", title: "Conquistar olimpíadas", shortTitle: "Olimpíadas", description: "Crie uma base de estudo, pratique com intenção e chegue mais preparado às provas.", icon: "🏅", accent: "gold", opportunityIds: [2, 6], topics: ["OBMEP", "OBI", "Matemática", "Programação competitiva"] },
  { slug: "programacao", title: "Aprender programação", shortTitle: "Programação", description: "Do primeiro código a projetos que demonstram o que você sabe construir.", icon: "💻", accent: "blue", opportunityIds: [1, 4, 6], topics: ["Lógica", "Python", "Web", "Portfólio"] },
  { slug: "pesquisa", title: "Fazer pesquisa", shortTitle: "Pesquisa", description: "Transforme curiosidade em pergunta, método, projeto e iniciação científica.", icon: "🔬", accent: "green", opportunityIds: [1, 3], topics: ["Método científico", "Projeto", "Mentoria", "Iniciação científica"] },
  { slug: "estudar-fora", title: "Estudar fora", shortTitle: "Estudar fora", description: "Entenda candidaturas internacionais, documentação e como contar sua trajetória.", icon: "🌍", accent: "violet", opportunityIds: [7, 8], topics: ["Application", "Inglês", "Essays", "Universidades"] },
  { slug: "bolsas", title: "Conquistar bolsas", shortTitle: "Bolsas", description: "Encontre financiamento e prepare uma candidatura que mostre contexto e potencial.", icon: "🎓", accent: "rose", opportunityIds: [4, 7], topics: ["Bolsas", "Carta de motivação", "Documentos", "Entrevista"] },
  { slug: "projetos", title: "Construir projetos", shortTitle: "Projetos", description: "Saia da ideia, entregue algo real e transforme o processo em evidência de aprendizado.", icon: "🚀", accent: "orange", opportunityIds: [1, 5], topics: ["Ideação", "Execução", "Portfólio", "Impacto"] },
  { slug: "inteligencia-artificial", title: "Aprender Inteligência Artificial", shortTitle: "Inteligência Artificial", description: "Construa fundamentos e avance até aplicações próprias, com responsabilidade.", icon: "🧠", accent: "cyan", opportunityIds: [1, 6], topics: ["Python", "Dados", "Machine Learning", "Ética"] },
  { slug: "lideranca", title: "Desenvolver liderança", shortTitle: "Liderança", description: "Aprenda a mobilizar pessoas, conduzir projetos e comunicar uma visão.", icon: "🧭", accent: "slate", opportunityIds: [5, 8], topics: ["Comunicação", "Equipe", "Impacto", "Iniciativa"] },
];

export const learnGuides: LearnGuide[] = [
  { slug: "carta-de-motivacao", title: "Como escrever uma carta de motivação", summary: "Um método prático para conectar trajetória, intenção e oportunidade sem soar genérico.", icon: "✍️", minutes: 12, difficulty: "Começando", updatedAt: "18 jul 2026", goalSlugs: ["bolsas", "estudar-fora"], topics: ["Carta de motivação", "Candidatura"] },
  { slug: "preparacao-obi", title: "Como se preparar para a OBI", summary: "Trilha de fundamentos, prática e provas anteriores organizada por estágio.", icon: "🧩", minutes: 10, difficulty: "Intermediário", updatedAt: "16 jul 2026", goalSlugs: ["olimpiadas", "programacao"], topics: ["OBI", "Algoritmos"] },
  { slug: "comecar-pesquisa", title: "Como começar uma pesquisa ainda na escola", summary: "Da primeira pergunta até uma conversa produtiva com um possível orientador.", icon: "🔬", minutes: 14, difficulty: "Começando", updatedAt: "12 jul 2026", goalSlugs: ["pesquisa"], topics: ["Pesquisa", "Mentoria"] },
  { slug: "carta-recomendacao", title: "Como pedir uma carta de recomendação", summary: "Escolha a pessoa certa, dê contexto e facilite uma recomendação específica.", icon: "💬", minutes: 8, difficulty: "Começando", updatedAt: "9 jul 2026", goalSlugs: ["estudar-fora", "bolsas"], topics: ["Recomendação", "Documentos"] },
  { slug: "portfolio", title: "Como construir um portfólio que mostra progresso", summary: "Organize projetos, decisões e aprendizados para tornar seu potencial visível.", icon: "🗂️", minutes: 11, difficulty: "Intermediário", updatedAt: "4 jul 2026", goalSlugs: ["programacao", "projetos", "inteligencia-artificial"], topics: ["Portfólio", "Projetos"] },
  { slug: "estudar-olimpiadas", title: "Como estudar para olimpíadas sem se perder", summary: "Planeje ciclos de teoria, questões e revisão que cabem na sua rotina.", icon: "🏅", minutes: 9, difficulty: "Começando", updatedAt: "28 jun 2026", goalSlugs: ["olimpiadas"], topics: ["Rotina", "Olimpíadas"] },
];

export const learnResources: LearnResource[] = [
  { id: "roadmap-python", type: "Roadmap", title: "Python: do zero ao primeiro projeto", provider: "seConecta", difficulty: "Começando", estimatedTime: "6 semanas", goalSlugs: ["programacao", "inteligencia-artificial"], opportunityIds: [1, 4], href: "#" },
  { id: "template-motivacao", type: "Template", title: "Roteiro para carta de motivação", provider: "seConecta", difficulty: "Começando", estimatedTime: "35 min", goalSlugs: ["bolsas", "estudar-fora"], opportunityIds: [7, 8], href: "#" },
  { id: "curso-cs50", type: "Curso", title: "CS50: introdução à ciência da computação", provider: "Harvard", difficulty: "Começando", estimatedTime: "12 semanas", goalSlugs: ["programacao"], opportunityIds: [4, 6], href: "https://cs50.harvard.edu/x/" },
  { id: "provas-obmep", type: "Site oficial", title: "Provas e soluções da OBMEP", provider: "OBMEP", difficulty: "Intermediário", estimatedTime: "Contínuo", goalSlugs: ["olimpiadas"], opportunityIds: [2], href: "https://www.obmep.org.br/provas.htm" },
  { id: "roadmap-pesquisa", type: "Roadmap", title: "Primeiro projeto de pesquisa", provider: "seConecta", difficulty: "Começando", estimatedTime: "4 semanas", goalSlugs: ["pesquisa", "projetos"], opportunityIds: [3], href: "#" },
  { id: "github-portfolio", type: "Repositório", title: "Modelo de portfólio para estudantes", provider: "Comunidade seConecta", difficulty: "Intermediário", estimatedTime: "2 horas", goalSlugs: ["programacao", "projetos"], opportunityIds: [1, 4], href: "https://github.com/" },
];

export const learnStories: LearnStory[] = [
  { id: "maria-yygs", title: "Como Maria chegou ao YYGS", person: "Maria Santos", summary: "As escolhas, dúvidas e ajustes que fortaleceram sua candidatura.", goalSlugs: ["estudar-fora", "bolsas"], opportunityIds: [7] },
  { id: "escola-publica-mit", title: "Da escola pública ao MIT", person: "João Victor", summary: "Uma trajetória construída com projetos, olimpíadas e apoio coletivo.", goalSlugs: ["estudar-fora", "projetos"], opportunityIds: [8] },
  { id: "ouro-obmep", title: "O que mudou até o ouro na OBMEP", person: "Ana Clara", summary: "Como prática deliberada e análise de erros transformaram sua preparação.", goalSlugs: ["olimpiadas"], opportunityIds: [2] },
];

export const learnUpdates: LearnUpdate[] = [
  { id: "update-obi", type: "Oportunidade", title: "Inscrições da OBI foram abertas", description: "Confira as datas e organize a preparação a partir do seu nível.", date: "Hoje, 09:20", href: "/explorar", goalSlugs: ["olimpiadas", "programacao"] },
  { id: "update-guide", type: "Guia", title: "Novo guia: carta de motivação", description: "Um roteiro para sair da página em branco e chegar a uma narrativa específica.", date: "Ontem", href: "/aprender?busca=carta%20de%20motivação", goalSlugs: ["bolsas", "estudar-fora"] },
  { id: "update-deadline", type: "Prazo", title: "3 oportunidades encerram nesta semana", description: "Revise seus itens pendentes antes de enviar a candidatura.", date: "22 jul", href: "/explorar", goalSlugs: ["bolsas", "pesquisa"] },
  { id: "update-results", type: "Resultado", title: "Resultados da 1ª fase da OBMEP", description: "A lista foi publicada; veja também como se preparar para a próxima etapa.", date: "20 jul", href: "/explorar", goalSlugs: ["olimpiadas"] },
  { id: "update-bulletin", type: "Comunicado", title: "5 recursos que a equipe salvou esta semana", description: "Uma seleção curta para programação, pesquisa e candidaturas.", date: "18 jul", href: "/aprender", goalSlugs: ["programacao", "pesquisa", "estudar-fora"] },
];

export function getLearnGoal(slug: string) {
  return learnGoals.find((goal) => goal.slug === slug);
}

