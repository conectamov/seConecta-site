import type { EducationLevel, OnboardingExperienceLevel, OnboardingOpportunityCategory, OnboardingPrimaryGoal, OnboardingSubject } from "@/types/onboarding";

export type OnboardingOption<T extends string = string> = { value: T; title: string; icon?: string; description?: string };

export const educationOptions: OnboardingOption<EducationLevel>[] = [
  { value: "Ensino Fundamental II", title: "Ensino Fundamental II", icon: "📘" },
  { value: "Ensino Médio", title: "Ensino Médio", icon: "🎓" },
  { value: "Universidade", title: "Universidade", icon: "🏛️" },
  { value: "Outro", title: "Outro", icon: "🌎" },
];

export const gradeOptions: Record<"Ensino Fundamental II" | "Ensino Médio", OnboardingOption[]> = {
  "Ensino Fundamental II": ["6º", "7º", "8º", "9º"].map((value) => ({ value, title: value })),
  "Ensino Médio": ["1º", "2º", "3º"].map((value) => ({ value, title: value })),
};

export const subjectOptions: OnboardingOption<OnboardingSubject>[] = [
  { value: "COMPUTER_SCIENCE", title: "Computação", icon: "💻" },
  { value: "ARTIFICIAL_INTELLIGENCE", title: "Inteligência Artificial", icon: "🤖" },
  { value: "MATHEMATICS", title: "Matemática", icon: "📐" },
  { value: "PHYSICS", title: "Física", icon: "⚛️" },
  { value: "CHEMISTRY", title: "Química", icon: "🧪" },
  { value: "BIOLOGY", title: "Biologia", icon: "🧬" },
  { value: "ENVIRONMENTAL_SCIENCE", title: "Ciências Ambientais", icon: "🌎" },
  { value: "ECONOMICS", title: "Economia", icon: "📈" },
  { value: "BUSINESS", title: "Negócios", icon: "💼" },
  { value: "LITERATURE", title: "Literatura", icon: "📚" },
  { value: "LANGUAGES", title: "Idiomas", icon: "🌍" },
  { value: "HISTORY", title: "História", icon: "🏛️" },
  { value: "ARTS", title: "Artes & Design", icon: "🎨" },
];

export const primaryGoalOptions: OnboardingOption<OnboardingPrimaryGoal>[] = [
  { value: "STUDY_ABROAD", title: "Estudar fora", icon: "🌍", description: "Programas internacionais, bolsas e intercâmbios." },
  { value: "COLLEGE_PREP", title: "Vestibulares e universidade no Brasil", icon: "🎓", description: "Preparação e experiências que fortalecem sua entrada na universidade." },
  { value: "OLYMPIAD_TRAINING", title: "Olimpíadas", icon: "🏅", description: "Competições de conhecimento e preparação olímpica." },
  { value: "RESEARCH", title: "Pesquisa científica", icon: "🔬", description: "Iniciação científica, laboratórios e mentoria." },
  { value: "SKILL_BUILDING", title: "Aprender habilidades e criar projetos", icon: "🚀", description: "Cursos, projetos práticos e experiências mão na massa." },
  { value: "SOCIAL_IMPACT", title: "Impacto social", icon: "❤️", description: "Voluntariado, iniciativas e transformação da comunidade." },
  { value: "CAREER_EXPLORATION", title: "Carreira e estágios", icon: "💼", description: "Conhecer profissões e conquistar primeiras experiências." },
  { value: "DISCOVER_OPPORTUNITIES", title: "Ainda estou explorando", icon: "🧭", description: "Quero conhecer caminhos antes de escolher uma direção." },
];

export const opportunityFormatOptions: OnboardingOption<OnboardingOpportunityCategory>[] = [
  { value: "MENTORSHIP", title: "Mentoria", icon: "🤝", description: "Programas com acompanhamento, orientação ou mentores." },
];

export const experienceOptions: OnboardingOption<OnboardingExperienceLevel>[] = [
  { value: "EXPLORING", title: "Estou descobrindo interesses e oportunidades", icon: "🌱", description: "Ainda estou conhecendo as possibilidades." },
  { value: "BEGINNER", title: "Já sei algumas áreas, mas preciso de orientação", icon: "🧭", description: "Tenho interesse e quero entender meus próximos passos." },
  { value: "INTERMEDIATE", title: "Já participei de projetos, programas, olimpíadas ou iniciativas", icon: "🛠️", description: "Já transformei interesse em experiência prática." },
  { value: "ADVANCED", title: "Já tenho experiências e resultados fortes", icon: "⭐", description: "Quero me preparar para oportunidades mais seletivas." },
  { value: "COMPETITIVE", title: "Já fui premiado ou selecionado", icon: "🏆", description: "Busco desafios de alto nível." },
];
