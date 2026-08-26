import type { EducationLevel, ExperienceArea, OnboardingActivity, OnboardingGoal, OnboardingSubject, SchoolType } from "@/types/onboarding";

export type OnboardingOption<T extends string = string> = {
  value: T;
  title: string;
  icon?: string;
  description?: string;
  recommended?: boolean;
};

export type OnboardingAnswers = {
  educationLevel: EducationLevel | null;
  current_grade: string | null;
  subjects: OnboardingSubject[];
  activities: OnboardingActivity[];
  goals: OnboardingGoal[];
  experience: Partial<Record<ExperienceArea, string>>;
  school_type: SchoolType | null;
};

export type OnboardingStepConfig = {
  id: string;
  title: string;
  subtitle?: string;
  type: "grade" | "multi-select" | "single-select" | "experience";
  backendField: keyof OnboardingAnswers | `experience.${ExperienceArea}`;
  options: readonly OnboardingOption[];
  min?: number;
  max?: number;
  condition?: (answers: OnboardingAnswers) => boolean;
};

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

const subjectOptions: OnboardingOption<OnboardingSubject>[] = [
  { value: "COMPUTING", title: "Computação", icon: "💻" },
  { value: "AI", title: "Inteligência Artificial", icon: "🤖" },
  { value: "MATHEMATICS", title: "Matemática", icon: "📐" },
  { value: "PHYSICS", title: "Física", icon: "⚛️" },
  { value: "CHEMISTRY", title: "Química", icon: "🧪" },
  { value: "BIOLOGY", title: "Biologia", icon: "🧬" },
  { value: "ENVIRONMENT", title: "Ciências Ambientais", icon: "🌎" },
  { value: "ECONOMICS", title: "Economia", icon: "📈" },
  { value: "BUSINESS", title: "Negócios", icon: "💼" },
  { value: "LITERATURE", title: "Literatura", icon: "📚" },
  { value: "LANGUAGES", title: "Idiomas", icon: "🌍" },
  { value: "HISTORY", title: "História", icon: "🏛️" },
  { value: "ARTS_DESIGN", title: "Artes & Design", icon: "🎨" },
];

const activityOptions: OnboardingOption<OnboardingActivity>[] = [
  { value: "OLYMPIADS", title: "Olimpíadas", icon: "🏅" },
  { value: "RESEARCH", title: "Pesquisa", icon: "🔬" },
  { value: "ENTREPRENEURSHIP", title: "Empreendedorismo", icon: "🚀" },
  { value: "LEADERSHIP", title: "Liderança", icon: "👥" },
  { value: "PROJECTS", title: "Projetos", icon: "💡" },
  { value: "STUDY_ABROAD", title: "Estudar no Exterior", icon: "🌍" },
  { value: "SOCIAL_IMPACT", title: "Impacto Social", icon: "❤️" },
  { value: "COMMUNICATION", title: "Comunicação", icon: "🎤" },
  { value: "COMMUNITIES", title: "Comunidades", icon: "🤝" },
  { value: "INTERNSHIPS", title: "Estágios", icon: "💼" },
];

const goalOptions: OnboardingOption<OnboardingGoal>[] = [
  { value: "UNIVERSITY", title: "Entrar em uma universidade", icon: "🎓" },
  { value: "STUDY_ABROAD", title: "Estudar fora", icon: "🌍" },
  { value: "WIN_MEDALS", title: "Ganhar medalhas", icon: "🏅" },
  { value: "DO_RESEARCH", title: "Fazer pesquisa", icon: "🔬" },
  { value: "WORK_IN_TECH", title: "Trabalhar com tecnologia", icon: "💻" },
  { value: "BUILD_STARTUP", title: "Criar uma startup", icon: "🚀" },
  { value: "ENTRANCE_EXAMS", title: "Vestibular", icon: "📖" },
  { value: "STRONG_RESUME", title: "Construir um currículo forte", icon: "💼" },
];

export const onboardingBaseSteps: OnboardingStepConfig[] = [
  { id: "grade", title: "Em qual série você está?", type: "grade", backendField: "current_grade", options: educationOptions },
  { id: "subjects", title: "Quais assuntos você gostaria de explorar?", subtitle: "Escolha até 5 áreas.", type: "multi-select", backendField: "subjects", options: subjectOptions, min: 1, max: 5 },
  { id: "activities", title: "Como você gostaria de crescer?", subtitle: "Escolha até 3.", type: "multi-select", backendField: "activities", options: activityOptions, min: 1, max: 3 },
  { id: "goals", title: "Quais são seus principais objetivos?", subtitle: "Escolha até 3.", type: "multi-select", backendField: "goals", options: goalOptions, min: 1, max: 3 },
];

export const onboardingExperienceSteps: OnboardingStepConfig[] = [
  {
    id: "experience-programming", title: "Qual é o seu nível de programação?", subtitle: "Uma resposta já é suficiente.", type: "experience", backendField: "experience.programming",
    options: ["Nunca programei", "Iniciante", "Já desenvolvi projetos", "Já participei de competições"].map((title, index) => ({ value: ["none", "beginner", "projects", "competitions"][index], title })),
    condition: ({ subjects, goals }) => subjects.some((subject) => subject === "COMPUTING" || subject === "AI") || goals.includes("WORK_IN_TECH"),
  },
  {
    id: "experience-olympiads", title: "Qual é sua experiência com olimpíadas?", subtitle: "Isso ajusta o nível das recomendações.", type: "experience", backendField: "experience.olympiads",
    options: ["Nunca participei", "Já participei", "Tenho Menção Honrosa", "Sou medalhista"].map((title, index) => ({ value: ["none", "participated", "honorable_mention", "medalist"][index], title })),
    condition: ({ activities, goals }) => activities.includes("OLYMPIADS") || goals.includes("WIN_MEDALS"),
  },
  {
    id: "experience-research", title: "Qual é sua experiência com pesquisa?", subtitle: "Considere projetos feitos dentro ou fora da escola.", type: "experience", backendField: "experience.research",
    options: ["Nenhuma", "Projetos escolares", "Pesquisa científica"].map((title, index) => ({ value: ["none", "school_projects", "scientific_research"][index], title })),
    condition: ({ activities, goals }) => activities.includes("RESEARCH") || goals.includes("DO_RESEARCH"),
  },
  {
    id: "experience-leadership", title: "Qual é sua experiência com liderança?", subtitle: "Não precisa ter tido um cargo formal.", type: "experience", backendField: "experience.leadership",
    options: ["Nenhuma", "Participei de grupos", "Criei um projeto ou organização"].map((title, index) => ({ value: ["none", "groups", "created_project"][index], title })),
    condition: ({ activities }) => activities.includes("LEADERSHIP") || activities.includes("COMMUNITIES"),
  },
];

export const schoolStep: OnboardingStepConfig = {
  id: "school", title: "Você estuda em:", type: "single-select", backendField: "school_type",
  options: [
    { value: "PUBLIC", title: "Escola Pública", icon: "🏫" },
    { value: "PRIVATE", title: "Escola Particular", icon: "🏫" },
    { value: "OTHER", title: "Outro", icon: "🌎" },
  ],
};

export function getOnboardingQuestionSteps(answers: OnboardingAnswers) {
  return [...onboardingBaseSteps, ...onboardingExperienceSteps.filter((step) => step.condition?.(answers)), schoolStep];
}

