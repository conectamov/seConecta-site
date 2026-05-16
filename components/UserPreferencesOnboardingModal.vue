<script setup lang="ts">
type PreferencesOptions = {
  profile_types: string[]
  education_levels: string[]
  experience_levels: string[]
  goals: string[]
  categories: string[]
}

type PreferencesPayload = {
  profile_type: string
  education_levels: string[]
  experience_levels: string[]
  interests: string[]
  subjects: string[]
  categories: string[]
  goals: string[]
  prefers_free: boolean
  prefers_online: boolean
  accepts_english: boolean
  wants_international: boolean
}

type ChoiceOption = {
  value: string
  title: string
  description?: string
  icon?: string
  accent?: 'green' | 'blue' | 'purple' | 'orange' | 'pink' | 'slate'
}

const SNOOZE_KEY = 'seconecta_preferences_onboarding_snoozed_until'
const SNOOZE_DAYS = 3
const STEP_WAIT_MS = 500
const TOTAL_STEPS = 6

const { get, put } = useAxios()
const { currentUser, authReady, fetchMe } = useAuth()

const mounted = ref(false)
const snoozeChecked = ref(false)
const snoozedUntil = ref<number | null>(null)
const forcedOpen = ref(false)

const loadingOptions = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

const currentStep = ref(0)
const changingStep = ref(false)
const modalRef = ref<HTMLElement | null>(null)

const options = ref<PreferencesOptions>({
  profile_types: [],
  education_levels: [],
  experience_levels: [],
  goals: [],
  categories: [],
})

const form = reactive<PreferencesPayload>({
  profile_type: 'STUDENT',
  education_levels: [],
  experience_levels: [],
  interests: [],
  subjects: [],
  categories: [],
  goals: [],
  prefers_free: true,
  prefers_online: true,
  accepts_english: true,
  wants_international: true,
})

const hasPreferencesSet = computed(() => {
  return currentUser.value?.preferences_set === true
})

const isSnoozed = computed(() => {
  if (!snoozedUntil.value) return false
  return Date.now() < snoozedUntil.value
})

const shouldShowModal = computed(() => {
  if (!mounted.value) return false
  if (!authReady.value) return false
  if (!snoozeChecked.value) return false
  if (!currentUser.value) return false
  if (hasPreferencesSet.value) return false

  if (forcedOpen.value) return true

  return !isSnoozed.value
})

const isStudent = computed(() => form.profile_type === 'STUDENT')
const isMentor = computed(() => form.profile_type === 'MENTOR')
const isEducator = computed(() => form.profile_type === 'EDUCATOR')

const roleOptions: ChoiceOption[] = [
  {
    value: 'STUDENT',
    title: 'Estudante',
    description: 'Quero descobrir oportunidades, olimpíadas, guias e próximos passos.',
    icon: '🎒',
    accent: 'green',
  },
  {
    value: 'MENTOR',
    title: 'Mentor(a)',
    description: 'Quero orientar estudantes e compartilhar caminhos que eu já conheço.',
    icon: '🤝',
    accent: 'blue',
  },
  {
    value: 'EDUCATOR',
    title: 'Educador(a) ou organização',
    description: 'Quero levar oportunidades, materiais e orientação para meus estudantes.',
    icon: '🏫',
    accent: 'purple',
  },
]

const profileTypeLabel: Record<string, string> = {
  STUDENT: 'Estudante',
  MENTOR: 'Mentor(a)',
  EDUCATOR: 'Educador(a) ou organização',
}

const educationLevelLabel: Record<string, string> = {
  FUNDAMENTAL_1: 'Fundamental I',
  FUNDAMENTAL_2: 'Fundamental II',
  ENSINO_MEDIO_1: '1º ano do ensino médio',
  ENSINO_MEDIO_2: '2º ano do ensino médio',
  ENSINO_MEDIO_3: '3º ano do ensino médio',
  GAP_YEAR: 'Gap year',
  UNDERGRADUATE: 'Graduação',
  OTHER: 'Outro',
}

const categoryLabel: Record<string, string> = {
  POST: 'Posts',
  COMPETITION: 'Competições',
  OLYMPIAD: 'Olimpíadas',
  MUN: 'MUN',
  EXTRACURRICULAR: 'Extracurriculares',
  INITIATIVE: 'Iniciativas estudantis',
  SCHOLARSHIP: 'Bolsas',
  VOLUNTEERING: 'Voluntariado',
  SUMMER_PROGRAM: 'Programas de verão',
  WORKSHOP: 'Workshops',
}

const goalLabel: Record<string, string> = {
  DISCOVER_OPPORTUNITIES: 'Descobrir oportunidades',
  OLYMPIAD_TRAINING: 'Olimpíadas acadêmicas',
  COLLEGE_PREP: 'Aplicações universitárias',
  RESEARCH: 'Pesquisa',
  SKILL_BUILDING: 'Aprender habilidades',
  SOCIAL_IMPACT: 'Impacto social',
  CAREER_EXPLORATION: 'Explorar carreiras',
}

const educationChoices = computed<ChoiceOption[]>(() => {
  if (isStudent.value) {
    return [
      {
        value: 'FUNDAMENTAL_2',
        title: 'Fundamental II',
        description: 'Ainda estou no início da trajetória escolar.',
        icon: '🌱',
        accent: 'green',
      },
      {
        value: 'ENSINO_MEDIO_1',
        title: '1º ano EM',
        description: 'Quero começar a construir minha trajetória.',
        icon: '1️⃣',
        accent: 'blue',
      },
      {
        value: 'ENSINO_MEDIO_2',
        title: '2º ano EM',
        description: 'Quero organizar oportunidades, olimpíadas e projetos.',
        icon: '2️⃣',
        accent: 'purple',
      },
      {
        value: 'ENSINO_MEDIO_3',
        title: '3º ano EM',
        description: 'Quero priorizar prazos, aplicações e próximos passos.',
        icon: '3️⃣',
        accent: 'orange',
      },
      {
        value: 'GAP_YEAR',
        title: 'Gap year',
        description: 'Estou planejando minha próxima etapa.',
        icon: '🧭',
        accent: 'slate',
      },
      {
        value: 'UNDERGRADUATE',
        title: 'Graduação',
        description: 'Já estou na universidade, mas quero acompanhar oportunidades.',
        icon: '🎓',
        accent: 'pink',
      },
    ]
  }

  if (isMentor.value) {
    return [
      {
        value: 'FUNDAMENTAL_2',
        title: 'Fundamental II',
        description: 'Quero ajudar estudantes mais novos a começar.',
        icon: '🌱',
        accent: 'green',
      },
      {
        value: 'ENSINO_MEDIO_1',
        title: '1º ano EM',
        description: 'Quero orientar estudantes que estão começando o ensino médio.',
        icon: '1️⃣',
        accent: 'blue',
      },
      {
        value: 'ENSINO_MEDIO_2',
        title: '2º ano EM',
        description: 'Quero ajudar estudantes a ganhar direção.',
        icon: '2️⃣',
        accent: 'purple',
      },
      {
        value: 'ENSINO_MEDIO_3',
        title: '3º ano EM',
        description: 'Quero orientar estudantes em decisões e aplicações.',
        icon: '3️⃣',
        accent: 'orange',
      },
      {
        value: 'GAP_YEAR',
        title: 'Gap year',
        description: 'Quero ajudar estudantes em transição.',
        icon: '🧭',
        accent: 'slate',
      },
    ]
  }

  return [
    {
      value: 'FUNDAMENTAL_1',
      title: 'Fundamental I',
      description: 'Atendo estudantes mais novos.',
      icon: '🌿',
      accent: 'green',
    },
    {
      value: 'FUNDAMENTAL_2',
      title: 'Fundamental II',
      description: 'Atendo estudantes em fase de descoberta.',
      icon: '🌱',
      accent: 'blue',
    },
    {
      value: 'ENSINO_MEDIO_1',
      title: '1º ano EM',
      description: 'Quero apoiar estudantes começando o ensino médio.',
      icon: '1️⃣',
      accent: 'purple',
    },
    {
      value: 'ENSINO_MEDIO_2',
      title: '2º ano EM',
      description: 'Quero apoiar estudantes buscando direção.',
      icon: '2️⃣',
      accent: 'orange',
    },
    {
      value: 'ENSINO_MEDIO_3',
      title: '3º ano EM',
      description: 'Quero apoiar estudantes perto de decisões importantes.',
      icon: '3️⃣',
      accent: 'pink',
    },
    {
      value: 'GAP_YEAR',
      title: 'Gap year',
      description: 'Atendo estudantes em transição.',
      icon: '🧭',
      accent: 'slate',
    },
  ]
})

const experienceChoices = computed<ChoiceOption[]>(() => {
  if (isStudent.value) {
    return [
      {
        value: 'EXPLORING',
        title: 'Começando do zero',
        description: 'Ainda não sei bem por onde começar.',
        icon: '✨',
        accent: 'green',
      },
      {
        value: 'BEGINNER',
        title: 'Iniciante',
        description: 'Já tenho algum interesse, mas preciso de orientação.',
        icon: '🌱',
        accent: 'blue',
      },
      {
        value: 'INTERMEDIATE',
        title: 'Intermediário',
        description: 'Já estudo ou participo de algumas oportunidades.',
        icon: '🚀',
        accent: 'purple',
      },
      {
        value: 'ADVANCED',
        title: 'Avançado',
        description: 'Já tenho experiência e quero oportunidades mais fortes.',
        icon: '🏆',
        accent: 'orange',
      },
    ]
  }

  if (isMentor.value) {
    return [
      {
        value: 'EXPLORING',
        title: 'Estudantes começando do zero',
        description: 'Quero ajudar quem ainda não sabe por onde começar.',
        icon: '✨',
        accent: 'green',
      },
      {
        value: 'BEGINNER',
        title: 'Iniciantes',
        description: 'Quero ajudar estudantes no começo da jornada.',
        icon: '🌱',
        accent: 'blue',
      },
      {
        value: 'INTERMEDIATE',
        title: 'Intermediários',
        description: 'Quero orientar estudantes que já começaram.',
        icon: '🚀',
        accent: 'purple',
      },
      {
        value: 'ADVANCED',
        title: 'Avançados',
        description: 'Quero ajudar estudantes buscando oportunidades competitivas.',
        icon: '🏆',
        accent: 'orange',
      },
    ]
  }

  return [
    {
      value: 'EXPLORING',
      title: 'Sem direção clara',
      description: 'Estudantes que ainda precisam descobrir caminhos possíveis.',
      icon: '✨',
      accent: 'green',
    },
    {
      value: 'BEGINNER',
      title: 'Iniciantes',
      description: 'Estudantes que precisam de primeiros passos bem guiados.',
      icon: '🌱',
      accent: 'blue',
    },
    {
      value: 'INTERMEDIATE',
      title: 'Intermediários',
      description: 'Estudantes que já demonstram interesse e precisam avançar.',
      icon: '🚀',
      accent: 'purple',
    },
    {
      value: 'ADVANCED',
      title: 'Avançados',
      description: 'Estudantes prontos para oportunidades mais seletivas.',
      icon: '🏆',
      accent: 'orange',
    },
  ]
})

const subjectChoices = computed<ChoiceOption[]>(() => {
  const baseSubjects: ChoiceOption[] = [
    {
      value: 'MATHEMATICS',
      title: 'Matemática',
      description: isMentor.value ? 'Olimpíadas, resolução de problemas e base matemática.' : 'Olimpíadas, raciocínio e desafios.',
      icon: '➗',
      accent: 'blue',
    },
    {
      value: 'PROGRAMMING',
      title: 'Programação',
      description: isMentor.value ? 'Programação competitiva, projetos e lógica.' : 'Lógica, computação, OBI e projetos.',
      icon: '💻',
      accent: 'purple',
    },
    {
      value: 'AI_DATA',
      title: 'IA e dados',
      description: isMentor.value ? 'IA, dados, modelos e projetos aplicados.' : 'Inteligência artificial, dados e tecnologia.',
      icon: '🤖',
      accent: 'green',
    },
    {
      value: 'PHYSICS',
      title: 'Física',
      description: 'Olimpíadas, ciência e problemas aplicados.',
      icon: '🪐',
      accent: 'orange',
    },
    {
      value: 'CHEMISTRY',
      title: 'Química',
      description: 'Ciência, olimpíadas e laboratório.',
      icon: '🧪',
      accent: 'pink',
    },
    {
      value: 'BIOLOGY',
      title: 'Biologia',
      description: 'Ciências da vida, olimpíadas e pesquisa.',
      icon: '🧬',
      accent: 'green',
    },
    {
      value: 'HUMANITIES',
      title: 'Humanas',
      description: 'História, geografia, política, escrita e sociedade.',
      icon: '📚',
      accent: 'slate',
    },
    {
      value: 'LANGUAGES_WRITING',
      title: 'Línguas e escrita',
      description: 'Inglês, redação, comunicação e aplicações.',
      icon: '✍️',
      accent: 'orange',
    },
    {
      value: 'RESEARCH',
      title: 'Pesquisa',
      description: 'Projetos acadêmicos, iniciação científica e investigação.',
      icon: '🔎',
      accent: 'purple',
    },
    {
      value: 'LEADERSHIP_IMPACT',
      title: 'Liderança e impacto',
      description: 'Projetos sociais, clubes, voluntariado e iniciativas.',
      icon: '🌎',
      accent: 'green',
    },
  ]

  if (isStudent.value) {
    return [
      {
        value: 'NOT_SURE',
        title: 'Ainda não sei',
        description: 'Quero explorar áreas antes de escolher uma direção.',
        icon: '🧭',
        accent: 'slate',
      },
      ...baseSubjects,
    ]
  }

  if (isMentor.value) {
    return [
      {
        value: 'GENERAL_GUIDANCE',
        title: 'Orientação geral',
        description: 'Posso ajudar com direção, rotina, oportunidades e próximos passos.',
        icon: '🧭',
        accent: 'slate',
      },
      ...baseSubjects,
    ]
  }

  return [
    {
      value: 'MULTIPLE_AREAS',
      title: 'Várias áreas',
      description: 'Quero mostrar oportunidades diversas para meus estudantes.',
      icon: '🧭',
      accent: 'slate',
    },
    ...baseSubjects,
  ]
})

const categoryChoices = computed<ChoiceOption[]>(() => {
  const fallback: ChoiceOption[] = [
    {
      value: 'OLYMPIAD',
      title: 'Olimpíadas',
      description: 'Competições acadêmicas e desafios por área.',
      icon: '🏅',
      accent: 'blue',
    },
    {
      value: 'COMPETITION',
      title: 'Competições',
      description: 'Hackathons, desafios, prêmios e chamadas competitivas.',
      icon: '⚡',
      accent: 'purple',
    },
    {
      value: 'SCHOLARSHIP',
      title: 'Bolsas',
      description: 'Bolsas de estudo, programas financiados e apoio financeiro.',
      icon: '🎓',
      accent: 'green',
    },
    {
      value: 'SUMMER_PROGRAM',
      title: 'Programas',
      description: 'Camps, programas de verão e imersões acadêmicas.',
      icon: '☀️',
      accent: 'orange',
    },
    {
      value: 'RESEARCH',
      title: 'Pesquisa',
      description: 'Iniciação científica, grupos de pesquisa e projetos acadêmicos.',
      icon: '🔬',
      accent: 'pink',
    },
    {
      value: 'VOLUNTEERING',
      title: 'Voluntariado',
      description: 'Projetos sociais, serviço comunitário e impacto.',
      icon: '🤲',
      accent: 'green',
    },
    {
      value: 'WORKSHOP',
      title: 'Workshops',
      description: 'Aulas, oficinas, eventos e encontros de formação.',
      icon: '🛠️',
      accent: 'slate',
    },
    {
      value: 'MUN',
      title: 'MUN',
      description: 'Simulações da ONU, debate e relações internacionais.',
      icon: '🌐',
      accent: 'blue',
    },
    {
      value: 'EXTRACURRICULAR',
      title: 'Extracurriculares',
      description: 'Atividades, clubes, projetos e experiências formativas.',
      icon: '🎯',
      accent: 'purple',
    },
    {
      value: 'INITIATIVE',
      title: 'Iniciativas estudantis',
      description: 'Projetos criados por estudantes e comunidades.',
      icon: '🚀',
      accent: 'orange',
    },
  ]

  const allowed = options.value.categories?.length ? options.value.categories : fallback.map((item) => item.value)

  return fallback.filter((item) => allowed.includes(item.value))
})

const goalChoices = computed<ChoiceOption[]>(() => {
  const base: ChoiceOption[] = [
    {
      value: 'DISCOVER_OPPORTUNITIES',
      title: isStudent.value ? 'Descobrir caminhos' : 'Mostrar caminhos',
      description: isStudent.value
        ? 'Receber sugestões para saber por onde começar.'
        : 'Ajudar estudantes a encontrarem possibilidades reais.',
      icon: '🧭',
      accent: 'green',
    },
    {
      value: 'OLYMPIAD_TRAINING',
      title: isStudent.value ? 'Evoluir em olimpíadas' : 'Apoiar olimpíadas',
      description: isStudent.value
        ? 'Encontrar olimpíadas, materiais e próximos passos.'
        : 'Levar olimpíadas e trilhas de estudo para estudantes.',
      icon: '🏅',
      accent: 'blue',
    },
    {
      value: 'COLLEGE_PREP',
      title: isStudent.value ? 'Preparar aplicações' : 'Orientar aplicações',
      description: 'Bolsas, universidades, currículo e preparação de longo prazo.',
      icon: '🎓',
      accent: 'purple',
    },
    {
      value: 'RESEARCH',
      title: isStudent.value ? 'Começar pesquisa' : 'Apoiar pesquisa',
      description: 'Iniciação científica, projetos acadêmicos e orientação.',
      icon: '🔎',
      accent: 'pink',
    },
    {
      value: 'SKILL_BUILDING',
      title: isStudent.value ? 'Aprender habilidades' : 'Desenvolver habilidades',
      description: 'Programação, escrita, inglês, comunicação e projetos.',
      icon: '🛠️',
      accent: 'orange',
    },
    {
      value: 'SOCIAL_IMPACT',
      title: isStudent.value ? 'Criar impacto' : 'Estimular impacto',
      description: 'Projetos sociais, liderança e iniciativas estudantis.',
      icon: '🌎',
      accent: 'green',
    },
    {
      value: 'CAREER_EXPLORATION',
      title: isStudent.value ? 'Explorar carreiras' : 'Ajudar na escolha de carreira',
      description: 'Conhecer áreas, rotas e possibilidades de futuro.',
      icon: '🧪',
      accent: 'slate',
    },
  ]

  const allowed = options.value.goals?.length ? options.value.goals : base.map((item) => item.value)

  return base.filter((item) => allowed.includes(item.value))
})

const preferenceChoices = computed(() => {
  return [
    {
      key: 'prefers_free',
      title: isStudent.value ? 'Priorizar gratuitas' : 'Priorizar opções gratuitas',
      description: isStudent.value
        ? 'Mostrar primeiro oportunidades sem custo.'
        : 'Facilitar indicações acessíveis para estudantes.',
      icon: '💚',
      accent: 'green',
    },
    {
      key: 'prefers_online',
      title: isStudent.value ? 'Priorizar online' : 'Incluir opções online',
      description: 'Valorizar oportunidades que podem ser feitas de qualquer lugar.',
      icon: '💻',
      accent: 'blue',
    },
    {
      key: 'accepts_english',
      title: isStudent.value ? 'Aceito inglês' : 'Mostrar oportunidades em inglês',
      description: 'Incluir oportunidades, guias ou programas em inglês.',
      icon: '🌐',
      accent: 'purple',
    },
    {
      key: 'wants_international',
      title: isStudent.value ? 'Quero internacionais' : 'Incluir internacionais',
      description: 'Mostrar programas, bolsas e experiências fora do Brasil.',
      icon: '✈️',
      accent: 'orange',
    },
  ] as const
})

const currentStepCopy = computed(() => {
  if (currentStep.value === 0) {
    return {
      eyebrow: 'Passo 1 de 6',
      title: 'Como você quer usar o seConecta?',
      subtitle: 'A experiência muda de acordo com o seu papel: estudante, mentor ou educador/organização.',
    }
  }

  if (currentStep.value === 1) {
    if (isStudent.value) {
      return {
        eyebrow: 'Passo 2 de 6',
        title: 'Como você vê seu nível hoje?',
        subtitle: 'Isso ajuda o seConecta a não te jogar direto em oportunidades avançadas demais.',
      }
    }

    if (isMentor.value) {
      return {
        eyebrow: 'Passo 2 de 6',
        title: 'Que nível de estudante você quer mentorar?',
        subtitle: 'Escolha o perfil que mais combina com o tipo de ajuda que você quer oferecer.',
      }
    }

    return {
      eyebrow: 'Passo 2 de 6',
      title: 'Que nível de estudante você quer alcançar?',
      subtitle: 'Isso ajuda a plataforma a sugerir oportunidades mais adequadas para sua escola ou organização.',
    }
  }

  if (currentStep.value === 2) {
    if (isStudent.value) {
      return {
        eyebrow: 'Passo 3 de 6',
        title: 'Quais áreas te interessam?',
        subtitle: 'Você pode marcar “ainda não sei” se estiver em fase de descoberta.',
      }
    }

    if (isMentor.value) {
      return {
        eyebrow: 'Passo 3 de 6',
        title: 'Quais áreas você consegue orientar?',
        subtitle: 'Escolha áreas em que você pode ensinar, guiar ou indicar caminhos.',
      }
    }

    return {
      eyebrow: 'Passo 3 de 6',
      title: 'Quais áreas fazem sentido para seus estudantes?',
      subtitle: 'Isso ajuda o seConecta a organizar oportunidades úteis para sua comunidade.',
    }
  }

  if (currentStep.value === 3) {
    if (isStudent.value) {
      return {
        eyebrow: 'Passo 4 de 6',
        title: 'Em que ano escolar você está?',
        subtitle: 'A plataforma vai adaptar prazos, oportunidades e próximos passos ao seu momento.',
      }
    }

    if (isMentor.value) {
      return {
        eyebrow: 'Passo 4 de 6',
        title: 'Quais anos escolares você quer apoiar?',
        subtitle: 'Marque os grupos de estudantes com quem você se sente confortável em ajudar.',
      }
    }

    return {
      eyebrow: 'Passo 4 de 6',
      title: 'Quais anos escolares sua escola ou organização atende?',
      subtitle: 'Isso ajuda a priorizar materiais e oportunidades para os estudantes certos.',
    }
  }

  if (currentStep.value === 4) {
    if (isStudent.value) {
      return {
        eyebrow: 'Passo 5 de 6',
        title: 'Que tipos de oportunidades você quer ver?',
        subtitle: 'Escolha os formatos que mais combinam com sua trajetória agora.',
      }
    }

    if (isMentor.value) {
      return {
        eyebrow: 'Passo 5 de 6',
        title: 'Que oportunidades você quer indicar para estudantes?',
        subtitle: 'Isso ajuda a plataforma a conectar sua mentoria com oportunidades reais.',
      }
    }

    return {
      eyebrow: 'Passo 5 de 6',
      title: 'O que você quer mostrar para seus estudantes?',
      subtitle: 'Escolha os tipos de oportunidades que fazem sentido para divulgar na sua comunidade.',
    }
  }

  return {
    eyebrow: 'Passo 6 de 6',
    title: 'Finalize seu radar personalizado',
    subtitle: 'Últimos ajustes para o seConecta montar recomendações mais úteis para você.',
  }
})

const progressPercent = computed(() => {
  return ((currentStep.value + 1) / TOTAL_STEPS) * 100
})

const selectedRole = computed(() => {
  return roleOptions.find((role) => role.value === form.profile_type) || roleOptions[0]
})

const canContinue = computed(() => {
  if (saving.value || changingStep.value || loadingOptions.value) return false

  if (currentStep.value === 0) return Boolean(form.profile_type)
  if (currentStep.value === 1) return form.experience_levels.length > 0
  if (currentStep.value === 2) return form.subjects.length > 0
  if (currentStep.value === 3) return form.education_levels.length > 0
  if (currentStep.value === 4) return form.categories.length > 0
  if (currentStep.value === 5) return form.goals.length > 0

  return false
})

const continueLabel = computed(() => {
  if (saving.value) return 'Salvando...'
  if (changingStep.value) return 'Preparando...'
  if (currentStep.value === TOTAL_STEPS - 1) return 'Salvar preferências'
  return 'Continuar'
})

function labelFor(value: string, labels: Record<string, string>) {
  return labels[value] || value
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function readSnooze() {
  if (!import.meta.client) return

  const raw = localStorage.getItem(SNOOZE_KEY)
  const parsed = raw ? Number(raw) : 0

  snoozedUntil.value = Number.isFinite(parsed) && parsed > 0 ? parsed : null
  snoozeChecked.value = true
}

function writeSnooze() {
  if (!import.meta.client) return

  const until = Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000

  localStorage.setItem(SNOOZE_KEY, String(until))
  snoozedUntil.value = until
  forcedOpen.value = false

  window.dispatchEvent(
    new CustomEvent('user-preferences-onboarding-snoozed', {
      detail: { snoozedUntil: until },
    }),
  )
}

function clearSnooze() {
  if (!import.meta.client) return

  localStorage.removeItem(SNOOZE_KEY)
  snoozedUntil.value = null

  window.dispatchEvent(new CustomEvent('user-preferences-onboarding-cleared'))
}

function toggleArrayValue(target: string[], value: string) {
  const index = target.indexOf(value)

  if (index >= 0) {
    target.splice(index, 1)
    return
  }

  target.push(value)
}

function setSingleArrayValue(target: string[], value: string) {
  target.splice(0, target.length, value)
}

function toggleSubject(value: string) {
  if (value === 'NOT_SURE') {
    setSingleArrayValue(form.subjects, value)
    return
  }

  const notSureIndex = form.subjects.indexOf('NOT_SURE')
  if (notSureIndex >= 0) form.subjects.splice(notSureIndex, 1)

  toggleArrayValue(form.subjects, value)
}

function selectRole(value: string) {
  form.profile_type = value

  if (value !== 'STUDENT') {
    const notSureIndex = form.subjects.indexOf('NOT_SURE')
    if (notSureIndex >= 0) form.subjects.splice(notSureIndex, 1)
  }
}

function selectEducationLevel(value: string) {
  if (isStudent.value) {
    setSingleArrayValue(form.education_levels, value)
    return
  }

  toggleArrayValue(form.education_levels, value)
}

function toggleBooleanPreference(key: keyof Pick<
  PreferencesPayload,
  'prefers_free' | 'prefers_online' | 'accepts_english' | 'wants_international'
>) {
  form[key] = !form[key]
}

function buildInterests() {
  return Array.from(
    new Set([
      form.profile_type,
      ...form.subjects,
      ...form.categories,
      ...form.goals,
      ...form.education_levels,
      ...form.experience_levels,
    ]),
  )
}

async function loadOptions() {
  if (loadingOptions.value) return
  if (options.value.categories.length && options.value.goals.length) return

  loadingOptions.value = true

  try {
    const res = await get('/users/me/preferences/options')

    options.value = {
      profile_types: res.data?.profile_types || [],
      education_levels: res.data?.education_levels || [],
      experience_levels: res.data?.experience_levels || [],
      goals: res.data?.goals || [],
      categories: res.data?.categories || [],
    }
  } catch (err) {
    console.warn('[preferences onboarding] Could not load options:', err)

    options.value = {
      profile_types: ['STUDENT', 'MENTOR', 'EDUCATOR'],
      education_levels: [
        'FUNDAMENTAL_1',
        'FUNDAMENTAL_2',
        'ENSINO_MEDIO_1',
        'ENSINO_MEDIO_2',
        'ENSINO_MEDIO_3',
        'GAP_YEAR',
        'UNDERGRADUATE',
        'OTHER',
      ],
      experience_levels: ['EXPLORING', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      goals: [
        'DISCOVER_OPPORTUNITIES',
        'OLYMPIAD_TRAINING',
        'COLLEGE_PREP',
        'RESEARCH',
        'SKILL_BUILDING',
        'SOCIAL_IMPACT',
        'CAREER_EXPLORATION',
      ],
      categories: [
        'COMPETITION',
        'OLYMPIAD',
        'MUN',
        'EXTRACURRICULAR',
        'INITIATIVE',
        'SCHOLARSHIP',
        'VOLUNTEERING',
        'SUMMER_PROGRAM',
        'WORKSHOP',
      ],
    }
  } finally {
    loadingOptions.value = false
  }
}

function doLater() {
  writeSnooze()
}

function resetWizard() {
  currentStep.value = 0
  changingStep.value = false
  error.value = null
}

async function goBack() {
  if (changingStep.value || saving.value) return
  if (currentStep.value <= 0) return

  changingStep.value = true
  await sleep(STEP_WAIT_MS)
  currentStep.value -= 1
  changingStep.value = false

  await nextTick()
  modalRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

async function goNext() {
  if (!canContinue.value) return

  error.value = null

  if (currentStep.value === TOTAL_STEPS - 1) {
    await savePreferences()
    return
  }

  changingStep.value = true
  await sleep(STEP_WAIT_MS)
  currentStep.value += 1
  changingStep.value = false

  await nextTick()
  modalRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

async function savePreferences() {
  error.value = null
  saving.value = true

  const payload: PreferencesPayload = {
    ...form,
    interests: buildInterests(),
  }

  try {
    await put('/users/me/preferences', payload)

    clearSnooze()
    forcedOpen.value = false

    if (currentUser.value) {
      currentUser.value.preferences_set = true
    }

    window.dispatchEvent(new CustomEvent('user-preferences-onboarding-completed'))

    resetWizard()
  } catch (err: any) {
    console.error('[preferences onboarding] Could not save preferences:', err)

    error.value =
      err?.response?.data?.detail ||
      'Não consegui salvar suas preferências agora. Tente de novo em alguns segundos.'
  } finally {
    saving.value = false
  }
}

async function openForced() {
  forcedOpen.value = true
  clearSnooze()
  resetWizard()
  await loadOptions()
}

onMounted(async () => {
  mounted.value = true
  readSnooze()

  window.addEventListener('open-user-preferences-onboarding', openForced)

  if (!hasPreferencesSet.value && !isSnoozed.value) {
    await loadOptions()
  }
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  window.removeEventListener('open-user-preferences-onboarding', openForced)
})

watch(
  shouldShowModal,
  async (visible) => {
    if (visible) await loadOptions()
  },
  { immediate: false },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="preferences-modal">
      <div
        v-if="shouldShowModal"
        class="preferences-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preferences-title"
      >
        <section ref="modalRef" class="preferences-modal">
          <header class="preferences-header">
            <div class="header-orb header-orb--one" />
            <div class="header-orb header-orb--two" />

            <div class="preferences-header__content">
              <div class="preferences-header__topline">
                <p class="eyebrow">{{ currentStepCopy.eyebrow }}</p>
                <span class="role-badge">
                  <span>{{ selectedRole.icon }}</span>
                  {{ labelFor(form.profile_type, profileTypeLabel) }}
                </span>
              </div>

              <h2 id="preferences-title">{{ currentStepCopy.title }}</h2>
              <p>{{ currentStepCopy.subtitle }}</p>

              <div class="progress-shell" aria-hidden="true">
                <div class="progress-bar" :style="{ width: `${progressPercent}%` }" />
              </div>
            </div>

            <button
              type="button"
              class="close-button"
              aria-label="Fazer depois"
              @click="doLater"
            >
              ×
            </button>
          </header>

          <div v-if="loadingOptions" class="loading-box">
            <span class="loading-spinner" />
            Carregando preferências...
          </div>

          <form v-else class="preferences-form" @submit.prevent="goNext">
            <Transition name="step-fade" mode="out-in">
              <section v-if="changingStep" key="changing" class="step-loading">
                <span class="loading-spinner loading-spinner--large" />
                <strong>Montando a próxima etapa...</strong>
                <p>Estamos ajustando as perguntas ao seu perfil.</p>
              </section>

              <section v-else-if="currentStep === 0" key="step-1" class="step-panel">
                <div class="choice-grid choice-grid--roles">
                  <button
                    v-for="role in roleOptions"
                    :key="role.value"
                    type="button"
                    class="choice-card"
                    :class="[
                      `choice-card--${role.accent || 'green'}`,
                      { 'choice-card--active': form.profile_type === role.value },
                    ]"
                    @click="selectRole(role.value)"
                  >
                    <span class="choice-card__icon">{{ role.icon }}</span>
                    <span class="choice-card__body">
                      <strong>{{ role.title }}</strong>
                      <small>{{ role.description }}</small>
                    </span>
                    <span class="choice-card__check">✓</span>
                  </button>
                </div>
              </section>

              <section v-else-if="currentStep === 1" key="step-2" class="step-panel">
                <div class="choice-grid">
                  <button
                    v-for="level in experienceChoices"
                    :key="level.value"
                    type="button"
                    class="choice-card"
                    :class="[
                      `choice-card--${level.accent || 'green'}`,
                      { 'choice-card--active': form.experience_levels.includes(level.value) },
                    ]"
                    @click="setSingleArrayValue(form.experience_levels, level.value)"
                  >
                    <span class="choice-card__icon">{{ level.icon }}</span>
                    <span class="choice-card__body">
                      <strong>{{ level.title }}</strong>
                      <small>{{ level.description }}</small>
                    </span>
                    <span class="choice-card__check">✓</span>
                  </button>
                </div>
              </section>

              <section v-else-if="currentStep === 2" key="step-3" class="step-panel">
                <div class="choice-grid">
                  <button
                    v-for="subject in subjectChoices"
                    :key="subject.value"
                    type="button"
                    class="choice-card"
                    :class="[
                      `choice-card--${subject.accent || 'green'}`,
                      { 'choice-card--active': form.subjects.includes(subject.value) },
                    ]"
                    @click="toggleSubject(subject.value)"
                  >
                    <span class="choice-card__icon">{{ subject.icon }}</span>
                    <span class="choice-card__body">
                      <strong>{{ subject.title }}</strong>
                      <small>{{ subject.description }}</small>
                    </span>
                    <span class="choice-card__check">✓</span>
                  </button>
                </div>
              </section>

              <section v-else-if="currentStep === 3" key="step-4" class="step-panel">
                <div class="choice-grid">
                  <button
                    v-for="level in educationChoices"
                    :key="level.value"
                    type="button"
                    class="choice-card"
                    :class="[
                      `choice-card--${level.accent || 'green'}`,
                      { 'choice-card--active': form.education_levels.includes(level.value) },
                    ]"
                    @click="selectEducationLevel(level.value)"
                  >
                    <span class="choice-card__icon">{{ level.icon }}</span>
                    <span class="choice-card__body">
                      <strong>{{ level.title }}</strong>
                      <small>{{ level.description }}</small>
                    </span>
                    <span class="choice-card__check">✓</span>
                  </button>
                </div>
              </section>

              <section v-else-if="currentStep === 4" key="step-5" class="step-panel">
                <div class="choice-grid">
                  <button
                    v-for="category in categoryChoices"
                    :key="category.value"
                    type="button"
                    class="choice-card"
                    :class="[
                      `choice-card--${category.accent || 'green'}`,
                      { 'choice-card--active': form.categories.includes(category.value) },
                    ]"
                    @click="toggleArrayValue(form.categories, category.value)"
                  >
                    <span class="choice-card__icon">{{ category.icon }}</span>
                    <span class="choice-card__body">
                      <strong>{{ category.title || labelFor(category.value, categoryLabel) }}</strong>
                      <small>{{ category.description }}</small>
                    </span>
                    <span class="choice-card__check">✓</span>
                  </button>
                </div>
              </section>

              <section v-else key="step-6" class="step-panel step-panel--final">
                <div class="form-block">
                  <div class="form-block__header">
                    <span>🎯</span>
                    <div>
                      <strong>
                        {{
                          isStudent
                            ? 'O que você quer construir agora?'
                            : isMentor
                              ? 'Como você quer ajudar estudantes?'
                              : 'Como o seConecta deve apoiar sua comunidade?'
                        }}
                      </strong>
                      <small>Escolha pelo menos uma opção.</small>
                    </div>
                  </div>

                  <div class="choice-grid choice-grid--compact">
                    <button
                      v-for="goal in goalChoices"
                      :key="goal.value"
                      type="button"
                      class="mini-card"
                      :class="[
                        `mini-card--${goal.accent || 'green'}`,
                        { 'mini-card--active': form.goals.includes(goal.value) },
                      ]"
                      @click="toggleArrayValue(form.goals, goal.value)"
                    >
                      <span>{{ goal.icon }}</span>
                      <strong>{{ goal.title || labelFor(goal.value, goalLabel) }}</strong>
                      <small>{{ goal.description }}</small>
                    </button>
                  </div>
                </div>

                <div class="form-block">
                  <div class="form-block__header">
                    <span>⚙️</span>
                    <div>
                      <strong>Preferências rápidas</strong>
                      <small>Toque para ligar ou desligar cada filtro.</small>
                    </div>
                  </div>

                  <div class="preference-grid">
                    <button
                      v-for="preference in preferenceChoices"
                      :key="preference.key"
                      type="button"
                      class="preference-card"
                      :class="[
                        `preference-card--${preference.accent}`,
                        { 'preference-card--active': form[preference.key] },
                      ]"
                      @click="toggleBooleanPreference(preference.key)"
                    >
                      <span class="preference-card__icon">{{ preference.icon }}</span>
                      <span>
                        <strong>{{ preference.title }}</strong>
                        <small>{{ preference.description }}</small>
                      </span>
                      <span class="toggle-dot" />
                    </button>
                  </div>
                </div>
              </section>
            </Transition>

            <p v-if="error" class="error-message">
              {{ error }}
            </p>

            <footer class="preferences-actions">
              <button type="button" class="secondary-button" @click="doLater">
                Fazer depois
              </button>

              <div class="preferences-actions__right">
                <button
                  v-if="currentStep > 0"
                  type="button"
                  class="ghost-button"
                  :disabled="changingStep || saving"
                  @click="goBack"
                >
                  Voltar
                </button>

                <button type="submit" class="primary-button" :disabled="!canContinue">
                  <span v-if="changingStep || saving" class="button-spinner" />
                  {{ continueLabel }}
                </button>
              </div>
            </footer>
          </form>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.preferences-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(13, 167, 144, .22), transparent 32%),
    radial-gradient(circle at bottom right, rgba(124, 58, 237, .2), transparent 30%),
    rgba(15, 23, 42, .48);
  backdrop-filter: blur(8px);
  display: grid;
  place-items: center;
}

.preferences-modal {
  width: min(840px, 100%);
  max-height: min(90vh, 900px);
  overflow: auto;
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, .85);
  background: #fff;
  box-shadow: 0 30px 100px rgba(15, 23, 42, .28);
}

.preferences-header {
  position: sticky;
  top: 0;
  z-index: 2;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(236, 253, 245, .98), rgba(255, 255, 255, .98) 48%, rgba(245, 243, 255, .98));
  border-bottom: 1px solid #f0ece8;
  padding: 24px;
  display: flex;
  gap: 18px;
  justify-content: space-between;
}

.header-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(3px);
  opacity: .55;
  pointer-events: none;
}

.header-orb--one {
  width: 110px;
  height: 110px;
  right: 74px;
  top: -48px;
  background: #a7f3d0;
}

.header-orb--two {
  width: 86px;
  height: 86px;
  right: 10px;
  bottom: -42px;
  background: #ddd6fe;
}

.preferences-header__content {
  position: relative;
  z-index: 1;
  flex: 1;
}

.preferences-header__topline {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.eyebrow {
  margin: 0;
  color: #079272;
  font-size: .72rem;
  font-weight: 950;
  letter-spacing: .11em;
  text-transform: uppercase;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(13, 167, 144, .22);
  background: rgba(255, 255, 255, .78);
  color: #115e59;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: .72rem;
  font-weight: 900;
}

.preferences-header h2 {
  margin: 0;
  color: #111827;
  font-size: clamp(1.35rem, 3vw, 2rem);
  letter-spacing: -.045em;
  line-height: 1.05;
}

.preferences-header p:not(.eyebrow) {
  margin: 9px 0 0;
  color: #6b7280;
  max-width: 620px;
  line-height: 1.5;
  font-size: .94rem;
}

.progress-shell {
  width: min(420px, 100%);
  height: 9px;
  margin-top: 18px;
  border-radius: 999px;
  background: rgba(226, 232, 240, .9);
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, .08);
}

.progress-bar {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #0da790, #7c3aed);
  transition: width .28s ease;
}

.close-button {
  position: relative;
  z-index: 1;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid #e7e5e4;
  background: white;
  color: #57534e;
  font-size: 1.35rem;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform .15s ease, background .15s ease;
}

.close-button:hover {
  transform: rotate(6deg) scale(1.04);
  background: #fafaf9;
}

.loading-box,
.step-loading {
  margin: 24px;
  padding: 28px;
  border-radius: 24px;
  background: linear-gradient(135deg, #fafaf9, #f8fafc);
  color: #78716c;
  font-weight: 850;
  display: grid;
  justify-items: center;
  gap: 10px;
  text-align: center;
}

.step-loading strong {
  color: #292524;
  font-size: 1rem;
}

.step-loading p {
  margin: 0;
  color: #78716c;
  font-size: .88rem;
  font-weight: 700;
}

.loading-spinner,
.button-spinner {
  display: inline-block;
  border-radius: 999px;
  border: 2px solid rgba(13, 167, 144, .2);
  border-top-color: #0da790;
  animation: spin .7s linear infinite;
}

.loading-spinner {
  width: 22px;
  height: 22px;
}

.loading-spinner--large {
  width: 34px;
  height: 34px;
  border-width: 3px;
}

.button-spinner {
  width: 14px;
  height: 14px;
  border-color: rgba(255, 255, 255, .35);
  border-top-color: white;
}

.preferences-form {
  padding: 24px;
  display: grid;
  gap: 20px;
}

.step-panel {
  min-height: 330px;
}

.step-panel--final {
  display: grid;
  gap: 18px;
}

.choice-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.choice-grid--roles {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.choice-grid--compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.choice-card,
.mini-card,
.preference-card {
  position: relative;
  border: 1px solid #e7e5e4;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition:
    transform .16s ease,
    border-color .16s ease,
    box-shadow .16s ease,
    background .16s ease;
}

.choice-card {
  min-height: 132px;
  border-radius: 24px;
  padding: 16px;
  display: grid;
  align-content: start;
  gap: 14px;
}

.choice-card:hover,
.mini-card:hover,
.preference-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 40px rgba(15, 23, 42, .08);
}

.choice-card__icon {
  width: 42px;
  height: 42px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 1.25rem;
  background: var(--soft);
}

.choice-card__body {
  display: grid;
  gap: 6px;
  padding-right: 24px;
}

.choice-card strong,
.mini-card strong,
.preference-card strong {
  color: #1c1917;
  font-size: .96rem;
  font-weight: 950;
  letter-spacing: -.02em;
}

.choice-card small,
.mini-card small,
.preference-card small {
  color: #78716c;
  font-size: .8rem;
  line-height: 1.42;
  font-weight: 700;
}

.choice-card__check {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: white;
  background: var(--accent);
  opacity: 0;
  transform: scale(.7);
  transition: opacity .16s ease, transform .16s ease;
  font-size: .78rem;
  font-weight: 950;
}

.choice-card--active {
  border-color: var(--accent);
  background: linear-gradient(135deg, var(--soft), white 72%);
  box-shadow: 0 18px 50px var(--shadow);
}

.choice-card--active .choice-card__check {
  opacity: 1;
  transform: scale(1);
}

.choice-card--green,
.mini-card--green,
.preference-card--green {
  --accent: #0da790;
  --soft: #ecfdf5;
  --shadow: rgba(13, 167, 144, .13);
}

.choice-card--blue,
.mini-card--blue,
.preference-card--blue {
  --accent: #2563eb;
  --soft: #eff6ff;
  --shadow: rgba(37, 99, 235, .13);
}

.choice-card--purple,
.mini-card--purple,
.preference-card--purple {
  --accent: #7c3aed;
  --soft: #f5f3ff;
  --shadow: rgba(124, 58, 237, .13);
}

.choice-card--orange,
.mini-card--orange,
.preference-card--orange {
  --accent: #ea580c;
  --soft: #fff7ed;
  --shadow: rgba(234, 88, 12, .13);
}

.choice-card--pink,
.mini-card--pink,
.preference-card--pink {
  --accent: #db2777;
  --soft: #fdf2f8;
  --shadow: rgba(219, 39, 119, .13);
}

.choice-card--slate,
.mini-card--slate,
.preference-card--slate {
  --accent: #475569;
  --soft: #f8fafc;
  --shadow: rgba(71, 85, 105, .13);
}

.form-block {
  border: 1px solid #f0ece8;
  border-radius: 26px;
  padding: 16px;
  background: #fff;
}

.form-block__header {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.form-block__header > span {
  width: 36px;
  height: 36px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: #f5f5f4;
  flex-shrink: 0;
}

.form-block__header div {
  display: grid;
  gap: 3px;
}

.form-block__header strong {
  color: #1c1917;
  font-size: .92rem;
  font-weight: 950;
}

.form-block__header small {
  color: #78716c;
  font-size: .78rem;
  font-weight: 750;
}

.mini-card {
  min-height: 116px;
  border-radius: 20px;
  padding: 13px;
  display: grid;
  gap: 7px;
  align-content: start;
}

.mini-card span {
  font-size: 1.15rem;
}

.mini-card--active {
  border-color: var(--accent);
  background: linear-gradient(135deg, var(--soft), white 72%);
  box-shadow: 0 14px 36px var(--shadow);
}

.preference-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.preference-card {
  border-radius: 20px;
  padding: 13px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
}

.preference-card__icon {
  width: 34px;
  height: 34px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: var(--soft);
}

.preference-card span:nth-child(2) {
  display: grid;
  gap: 3px;
}

.toggle-dot {
  width: 36px;
  height: 22px;
  border-radius: 999px;
  background: #e7e5e4;
  position: relative;
  transition: background .16s ease;
}

.toggle-dot::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: white;
  box-shadow: 0 1px 4px rgba(15, 23, 42, .18);
  transition: transform .16s ease;
}

.preference-card--active {
  border-color: var(--accent);
  background: linear-gradient(135deg, var(--soft), white 72%);
}

.preference-card--active .toggle-dot {
  background: var(--accent);
}

.preference-card--active .toggle-dot::after {
  transform: translateX(14px);
}

.error-message {
  margin: 0;
  padding: 12px 14px;
  border-radius: 16px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: .84rem;
  font-weight: 800;
}

.preferences-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid #f0ece8;
  padding-top: 18px;
}

.preferences-actions__right {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.secondary-button,
.ghost-button,
.primary-button {
  border: none;
  border-radius: 16px;
  padding: 12px 16px;
  font-size: .86rem;
  font-weight: 950;
  cursor: pointer;
  transition: transform .15s ease, opacity .15s ease, background .15s ease;
}

.secondary-button:hover,
.ghost-button:hover,
.primary-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.secondary-button {
  background: #f5f5f4;
  color: #57534e;
}

.ghost-button {
  background: white;
  color: #57534e;
  border: 1px solid #e7e5e4;
}

.primary-button {
  min-width: 142px;
  background: linear-gradient(135deg, #079272, #0f766e);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 14px 32px rgba(7, 146, 114, .22);
}

.primary-button:disabled,
.ghost-button:disabled {
  opacity: .55;
  cursor: not-allowed;
  transform: none;
}

.preferences-modal-enter-active,
.preferences-modal-leave-active {
  transition: opacity .16s ease;
}

.preferences-modal-enter-active .preferences-modal,
.preferences-modal-leave-active .preferences-modal {
  transition: transform .16s ease, opacity .16s ease;
}

.preferences-modal-enter-from,
.preferences-modal-leave-to {
  opacity: 0;
}

.preferences-modal-enter-from .preferences-modal,
.preferences-modal-leave-to .preferences-modal {
  transform: translateY(10px) scale(.985);
  opacity: 0;
}

.step-fade-enter-active,
.step-fade-leave-active {
  transition: opacity .16s ease, transform .16s ease;
}

.step-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.step-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 820px) {
  .choice-grid,
  .choice-grid--roles,
  .choice-grid--compact,
  .preference-grid {
    grid-template-columns: 1fr;
  }

  .step-panel {
    min-height: auto;
  }
}

@media (max-width: 720px) {
  .preferences-backdrop {
    padding: 10px;
    align-items: end;
  }

  .preferences-modal {
    max-height: 92vh;
    border-radius: 26px 26px 0 0;
  }

  .preferences-header,
  .preferences-form {
    padding: 18px;
  }

  .preferences-actions {
    flex-direction: column-reverse;
  }

  .preferences-actions__right {
    width: 100%;
    flex-direction: column-reverse;
  }

  .secondary-button,
  .ghost-button,
  .primary-button {
    width: 100%;
  }
}
</style>