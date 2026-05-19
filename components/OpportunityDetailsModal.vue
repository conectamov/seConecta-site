<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  opportunity: any | null
  isAdmin?: boolean
}>()

const emit = defineEmits<{
  close: []
  edit: [item: any]
  loaded: [item: any]
}>()

const { get } = useAxios()

const CATEGORY_META: Record<string, {
  label: string
  icon: string
  color: string
}> = {
  COMPETITION: { label: 'Competição', icon: '🏆', color: '#f59e0b' },
  OLYMPIAD: { label: 'Olimpíada', icon: '🏅', color: '#10b981' },
  MUN: { label: 'MUN', icon: '🌐', color: '#6366f1' },
  SCHOLARSHIP: { label: 'Bolsa de estudos', icon: '🎓', color: '#8b5cf6' },
  SUMMER_PROGRAM: { label: 'Programa de verão', icon: '☀️', color: '#0ea5e9' },
  WORKSHOP: { label: 'Workshop', icon: '🛠️', color: '#ec4899' },
  VOLUNTEERING: { label: 'Voluntariado', icon: '🤝', color: '#14b8a6' },
  EXTRACURRICULAR: { label: 'Extracurricular', icon: '⚡', color: '#f97316' },
  INITIATIVE: { label: 'Iniciativa', icon: '💡', color: '#84cc16' },
  POST: { label: 'Post', icon: '📌', color: '#6b7280' },
}

const PRIORITY_LABEL: Record<number, { label: string; color: string }> = {
  5: { label: 'Melhores oportunidades', color: '#f59e0b' },
  4: { label: 'Em destaque', color: '#10b981' },
  3: { label: 'Destaque', color: '#6366f1' },
  2: { label: 'Recomendado', color: '#0ea5e9' },
  1: { label: 'Relevante', color: '#a78bfa' },
  0: { label: '', color: '' },
}

const CATEGORY_DATA_LABELS: Record<string, string> = {
  organizer: 'Organizador',
  target_audience: 'Público-alvo',
  requirements: 'Requisitos',
  benefits: 'Benefícios',
  application_process: 'Como participar',
  cost_info: 'Custo',
  format: 'Formato',
  workload: 'Carga/Duração',
  source_notes: 'Observações',
  type: 'Tipo',
  prizes: 'Prêmios',
  stages: 'Etapas',
  min_words: 'Mín. palavras',
  max_words: 'Máx. palavras',
  duration: 'Duração',
  deliverables: 'Entregáveis',
  selection_criteria: 'Critérios de seleção',
}

const CATEGORY_DATA_ORDER = [
  'organizer',
  'target_audience',
  'cost_info',
  'format',
  'workload',
  'requirements',
  'benefits',
  'application_process',
  'source_notes',
]

const SPECIFICS_ORDER = [
  'prizes',
  'stages',
  'min_words',
  'max_words',
  'duration',
  'deliverables',
  'selection_criteria',
]

const SUBJECT_LABELS: Record<string, string> = {
  MATHEMATICS: 'Matemática',
  COMPUTER_SCIENCE: 'Computação',
  PROGRAMMING: 'Programação',
  AI_DATA: 'IA e dados',
  PHYSICS: 'Física',
  CHEMISTRY: 'Química',
  BIOLOGY: 'Biologia',
  HUMANITIES: 'Humanidades',
  COGNITIVE_SCIENCE: 'Ciência cognitiva',
  PHILOSOPHY: 'Filosofia',
  LOGIC: 'Lógica',
  RESEARCH: 'Pesquisa',
  LEADERSHIP_IMPACT: 'Liderança e impacto',
  LANGUAGES_WRITING: 'Idiomas e escrita',
  BUSINESS: 'Negócios',
  ENGINEERING: 'Engenharia',
  ARTS_DESIGN: 'Artes e design',
}

const GOAL_LABELS: Record<string, string> = {
  DISCOVER_OPPORTUNITIES: 'Descobrir oportunidades',
  OLYMPIAD_TRAINING: 'Treinar para olimpíadas',
  COLLEGE_PREP: 'Preparação universitária',
  RESEARCH: 'Pesquisa',
  RESEARCH_EXPLORATION: 'Explorar pesquisa',
  SKILL_BUILDING: 'Desenvolver habilidades',
  SOCIAL_IMPACT: 'Impacto social',
  CAREER_EXPLORATION: 'Explorar carreira',
  INTERNATIONAL_EXPERIENCE: 'Experiência internacional',
  ACADEMIC_ENRICHMENT: 'Enriquecimento acadêmico',
}

const EDUCATION_LEVEL_LABELS: Record<string, string> = {
  FUNDAMENTAL_1: 'Fundamental I',
  FUNDAMENTAL_2: 'Fundamental II',
  ENSINO_MEDIO_1: '1º ano EM',
  ENSINO_MEDIO_2: '2º ano EM',
  ENSINO_MEDIO_3: '3º ano EM',
  HIGH_SCHOOL: 'Ensino médio',
  GAP_YEAR: 'Gap year',
  UNDERGRADUATE: 'Graduação',
  UNDERGRADUATE_EARLY: 'Início da graduação',
  OTHER: 'Outro',
}

const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
  EXPLORING: 'Explorando',
  BEGINNER: 'Iniciante',
  INTERMEDIATE: 'Intermediário',
  ADVANCED: 'Avançado',
  COMPETITIVE: 'Competitivo',
}

const COMPETITIVENESS_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  SELECTIVE: 'Seletiva',
  HIGHLY_SELECTIVE: 'Muito seletiva',
  ELITE: 'Elite',
}

const PREPARATION_HORIZON_LABELS: Record<string, string> = {
  NONE: 'Sem preparo prévio',
  DAYS: 'Alguns dias',
  WEEKS: 'Algumas semanas',
  MONTHS: 'Alguns meses',
  YEAR_PLUS: '1 ano ou mais',
  LONG_TERM: 'Longo prazo',
}

const RECURRENCE_TYPE_LABELS: Record<string, string> = {
  ONE_TIME: 'Edição única',
  ANNUAL: 'Anual',
  SEMESTER: 'Semestral',
  MONTHLY: 'Mensal',
  ROLLING: 'Contínua',
  RECURRING: 'Recorrente',
  UNKNOWN: 'Não informado',
}

const TIMELINE_KIND_META: Record<string, {
  label: string
  shortLabel: string
  tone: string
  icon: string
}> = {
  registration_start: {
    label: 'Início das inscrições',
    shortLabel: 'Abre inscrições',
    tone: 'emerald',
    icon: '🟢',
  },
  registration_deadline: {
    label: 'Prazo de inscrição',
    shortLabel: 'Prazo final',
    tone: 'amber',
    icon: '⏰',
  },
  exam: {
    label: 'Prova',
    shortLabel: 'Prova',
    tone: 'blue',
    icon: '📝',
  },
  result: {
    label: 'Resultado',
    shortLabel: 'Resultado',
    tone: 'purple',
    icon: '📣',
  },
  phase: {
    label: 'Fase',
    shortLabel: 'Fase',
    tone: 'blue',
    icon: '🪜',
  },
  submission_deadline: {
    label: 'Envio/submissão',
    shortLabel: 'Envio',
    tone: 'amber',
    icon: '📦',
  },
  interview: {
    label: 'Entrevista',
    shortLabel: 'Entrevista',
    tone: 'purple',
    icon: '🎙️',
  },
  program_start: {
    label: 'Início do programa',
    shortLabel: 'Início',
    tone: 'emerald',
    icon: '🚀',
  },
  program_end: {
    label: 'Fim do programa',
    shortLabel: 'Fim',
    tone: 'zinc',
    icon: '🏁',
  },
  other: {
    label: 'Evento',
    shortLabel: 'Evento',
    tone: 'zinc',
    icon: '📅',
  },
}

const REQUEST_TIMEOUT_MS = 12000

const localOpportunity = ref<any | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
let requestSeq = 0

function withTimeout<T>(promise: Promise<T>, ms = REQUEST_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Tempo limite ao carregar detalhes.'))
      }, ms)
    }),
  ])
}

function extractResponseData(res: any) {
  return res?.data?.data ?? res?.data ?? res
}

function getErrorMessage(err: any, fallback: string) {
  return err?.response?.data?.detail || err?.data?.detail || err?.message || fallback
}


function stripAccents(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return ''

  if (Array.isArray(value)) {
    return value.map(normalizeText).filter(Boolean).join(' ')
  }

  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map(normalizeText)
      .filter(Boolean)
      .join(' ')
  }

  return stripAccents(String(value).toLowerCase().trim())
}

function normalizeJsonObject(value: any) {
  if (!value) return {}
  if (typeof value === 'object' && !Array.isArray(value)) return value

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }

  return {}
}

function normalizeTags(value: any) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean)
    } catch {}

    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
  }

  return []
}

function normalizeRecommendationList(value: any): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    const text = value.trim()
    if (!text) return []

    try {
      const parsed = JSON.parse(text)

      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter(Boolean)
      }
    } catch {}

    return text
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function humanizeRecommendationValue(value: string, labels: Record<string, string> = {}) {
  const clean = String(value || '').trim()
  if (!clean) return ''

  const key = clean.toUpperCase()
  if (labels[key]) return labels[key]

  return clean
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase())
}

function normalizeTimelineKind(rawKind: unknown, event: any) {
  const explicitKind = normalizeText(rawKind).replaceAll('-', '_').replaceAll(' ', '_')

  if (explicitKind in TIMELINE_KIND_META) return explicitKind

  const text = normalizeText([
    event?.label,
    event?.details,
    event?.description,
    event?.title,
    event?.name,
  ])

  if (text.includes('inscri') && (text.includes('abre') || text.includes('inicio') || text.includes('come'))) {
    return 'registration_start'
  }

  if (
    text.includes('inscri') ||
    text.includes('registration') ||
    text.includes('application') ||
    text.includes('candidatura')
  ) {
    return 'registration_deadline'
  }

  if (text.includes('resultado')) return 'result'
  if (text.includes('prova') || text.includes('exame') || text.includes('test')) return 'exam'
  if (text.includes('entrevista') || text.includes('interview')) return 'interview'
  if (text.includes('fase') || text.includes('phase')) return 'phase'
  if (text.includes('envio') || text.includes('submiss') || text.includes('submission')) return 'submission_deadline'
  if (text.includes('inicio') || text.includes('start')) return 'program_start'
  if (text.includes('fim') || text.includes('end')) return 'program_end'

  return explicitKind || 'other'
}

function getTimelineKindMeta(event: any) {
  return TIMELINE_KIND_META[event?.kind] ?? TIMELINE_KIND_META.other
}

function normalizeTimeline(value: any) {
  let timeline: any[] = []

  if (Array.isArray(value)) {
    timeline = value
  } else if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      timeline = Array.isArray(parsed) ? parsed : []
    } catch {
      timeline = []
    }
  }

  return timeline
    .filter((event) => event && typeof event === 'object')
    .map((event) => {
      const kind = normalizeTimelineKind(event.kind, event)

      return {
        ...event,
        kind,
        label: event.label ?? event.details ?? event.title ?? event.name ?? getTimelineKindMeta({ kind }).label,
        details: event.details ?? event.description ?? null,
        date: event.date ?? event.datetime ?? event.deadline ?? event.start_date ?? event.end_date ?? null,
        show_on_calendar: event.show_on_calendar === true || event.show_on_calendar === 'true',
      }
    })
}

function parseLocalDate(raw: string | null | undefined): Date | null {
  if (!raw) return null

  const clean = String(raw).slice(0, 10)

  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [year, month, day] = clean.split('-').map(Number)
    return new Date(year, month - 1, day, 23, 59, 59)
  }

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function fmtDate(raw: string | null | undefined) {
  const dt = parseLocalDate(raw)
  if (!dt) return null

  return dt.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function fmtShortDate(raw: string | null | undefined) {
  const dt = parseLocalDate(raw)
  if (!dt) return null

  return dt.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

function formatDeadline(raw: string | null | undefined) {
  const dt = parseLocalDate(raw)
  if (!dt) {
    return {
      label: 'Sem prazo acionável',
      urgent: false,
      overdue: false,
      daysLeft: null as number | null,
    }
  }

  const now = new Date()
  const diff = Math.ceil((dt.getTime() - now.getTime()) / 86_400_000)

  if (diff < 0) {
    return {
      label: 'Encerrado',
      urgent: false,
      overdue: true,
      daysLeft: diff,
    }
  }

  if (diff === 0) {
    return {
      label: 'Último dia!',
      urgent: true,
      overdue: false,
      daysLeft: 0,
    }
  }

  if (diff <= 3) {
    return {
      label: `${diff}d restante${diff > 1 ? 's' : ''}`,
      urgent: true,
      overdue: false,
      daysLeft: diff,
    }
  }

  if (diff <= 14) {
    return {
      label: `${diff} dias`,
      urgent: false,
      overdue: false,
      daysLeft: diff,
    }
  }

  return {
    label: fmtShortDate(raw) ?? 'Sem prazo',
    urgent: false,
    overdue: false,
    daysLeft: diff,
  }
}

function getFirstTimelineDeadline(timeline: any[]) {
  const now = new Date()

  return [...timeline]
    .map((event) => ({
      ...event,
      _date: parseLocalDate(event?.date),
    }))
    .filter((event) => event._date && event._date >= now)
    .sort((a, b) => a._date.getTime() - b._date.getTime())[0] ?? null
}

function getDeadlinePrefix(event: any) {
  if (event?.kind && TIMELINE_KIND_META[event.kind]) {
    const map: Record<string, string> = {
      registration_start: 'Inscrições abrem em',
      registration_deadline: 'Inscrições até',
      exam: 'Prova em',
      result: 'Resultado em',
      phase: 'Fase em',
      submission_deadline: 'Envio até',
      interview: 'Entrevista em',
      program_start: 'Início em',
      program_end: 'Fim em',
    }

    return map[event.kind] ?? 'Prazo em'
  }

  return 'Prazo em'
}

function formatActionDeadline(event: any, raw: string | null | undefined) {
  if (!raw) return ''

  const deadline = formatDeadline(raw)
  const prefix = getDeadlinePrefix(event)

  if (deadline.urgent || (deadline.daysLeft !== null && deadline.daysLeft <= 14)) {
    return `${prefix} · ${deadline.label}`
  }

  return `${prefix} ${fmtShortDate(raw) ?? deadline.label}`
}

function toTextValue(value: any): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  if (typeof value === 'number') return String(value)

  if (Array.isArray(value)) {
    const clean = value
      .map((item) => toTextValue(item))
      .filter(Boolean)

    return clean.length ? clean.join(' · ') : null
  }

  if (typeof value === 'object') return null

  const text = String(value).trim()
  return text || null
}

function makeInfoCard(key: string, value: any) {
  const label = toTextValue(value)
  if (!label) return null

  return {
    title: CATEGORY_DATA_LABELS[key] ?? key.replaceAll('_', ' '),
    label,
  }
}

function getInfoIcon(title: string) {
  const map: Record<string, string> = {
    Organizador: '🏛️',
    'Público-alvo': '🎯',
    Custo: '💸',
    Formato: '🧭',
    'Carga/Duração': '⏱️',
    Requisitos: '📋',
    Benefícios: '✨',
    'Como participar': '✅',
    Observações: '📝',
    Prêmios: '🏅',
    Etapas: '🪜',
    'Mín. palavras': '✍️',
    'Máx. palavras': '✍️',
    Duração: '⏱️',
    Entregáveis: '📦',
    'Critérios de seleção': '🔎',
  }

  return map[title] ?? '•'
}

function getInfoVariant(title: string) {
  if (['Como participar', 'Requisitos', 'Critérios de seleção', 'Entregáveis'].includes(title)) {
    return 'blue'
  }

  if (['Prêmios', 'Benefícios'].includes(title)) {
    return 'amber'
  }

  if (['Custo', 'Formato', 'Carga/Duração', 'Duração', 'Etapas', 'Máx. palavras', 'Mín. palavras'].includes(title)) {
    return 'emerald'
  }

  if (['Público-alvo', 'Organizador'].includes(title)) {
    return 'purple'
  }

  return 'zinc'
}

function getCardLines(card: any) {
  const value = card?.label

  if (!value) return []

  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String)
  }

  const text = String(value).trim()

  if (!text) return []

  if (text.includes(' · ')) {
    return text
      .split(' · ')
      .map((part) => part.trim())
      .filter(Boolean)
  }

  return [text]
}

function normalizeOpportunity(raw: any) {
  if (!raw) return null

  const category = raw.category ?? ''
  const fallbackMeta = {
    label: 'Oportunidade',
    icon: '✨',
    color: '#10b981',
  }

  const categoryMeta = CATEGORY_META[category] ?? raw.categoryMeta ?? fallbackMeta
  const timeline = normalizeTimeline(raw.timeline)
  const categoryData = normalizeJsonObject(raw.category_data)
  const nextTimelineEvent = getFirstTimelineDeadline(timeline)
  const displayDeadlineRaw = nextTimelineEvent?.date ?? raw.next_deadline ?? null
  const deadline = formatDeadline(displayDeadlineRaw)
  const priority = typeof raw.priority === 'number'
    ? Math.min(5, Math.max(0, raw.priority))
    : 0

  return {
    ...raw,
    id: raw.id,
    slug: raw.slug ?? null,
    title: raw.title ?? 'Carregando oportunidade...',
    excerpt: raw.excerpt ?? raw.description?.slice?.(0, 160) ?? '',
    description: raw.description ?? '',
    content: raw.content ?? '',
    category,
    categoryMeta,
    cover_url: raw.cover_url ?? null,
    official_site_url: raw.official_site_url ?? null,
    location: raw.location ?? 'Online',
    is_free: !!raw.is_free,
    next_deadline: displayDeadlineRaw,
    next_timeline_event: nextTimelineEvent,
    deadline,
    deadlineActionLabel: formatActionDeadline(nextTimelineEvent, displayDeadlineRaw),
    timeline,
    tags: normalizeTags(raw.tags),
    target_subjects: normalizeRecommendationList(raw.target_subjects ?? raw.target_subejcts),
    target_goals: normalizeRecommendationList(raw.target_goals),
    target_education_levels: normalizeRecommendationList(raw.target_education_levels),
    recommended_experience_levels: normalizeRecommendationList(raw.recommended_experience_levels),
    competitiveness_level: normalizeRecommendationList(raw.competitiveness_level),
    preparation_horizon: normalizeRecommendationList(raw.preparation_horizon),
    recurrence_type: normalizeRecommendationList(raw.recurrence_type),
    recommendation_notes: typeof raw.recommendation_notes === 'string' ? raw.recommendation_notes.trim() : null,
    category_data: categoryData,
    human_verified: !!raw.human_verified,
    approved: !!raw.approved,
    priority,
    priorityMeta: PRIORITY_LABEL[priority] ?? PRIORITY_LABEL[0],
  }
}

async function fetchFullOpportunity(base: any) {
  if (!base) return

  const currentRequest = ++requestSeq
  const slug = String(base.slug || '').trim()
  const id = Number(base.id)

  if (!slug && (!Number.isInteger(id) || id <= 0)) {
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    let raw: any | null = null
    let firstError: any | null = null

    if (slug) {
      try {
        const res = await withTimeout(
          get(`/opportunity/slug/${encodeURIComponent(slug)}`),
        )
        raw = extractResponseData(res)
      } catch (err) {
        firstError = err
      }
    }

    if (!raw && Number.isInteger(id) && id > 0) {
      try {
        const res = await withTimeout(get(`/opportunity/${id}`))
        raw = extractResponseData(res)
      } catch (err) {
        firstError = err
      }
    }

    if (currentRequest !== requestSeq) return

    if (!raw) throw firstError || new Error('Oportunidade não encontrada.')

    const merged = {
      ...base,
      ...raw,
    }

    localOpportunity.value = merged
    emit('loaded', merged)
  } catch (err: any) {
    if (currentRequest !== requestSeq) return

    console.warn('[OpportunityDetailsModal] Could not load full opportunity:', err)

    error.value = getErrorMessage(
      err,
      'Não consegui carregar os detalhes completos dessa oportunidade.',
    )
  } finally {
    if (currentRequest === requestSeq) {
      loading.value = false
    }
  }
}

const item = computed(() => {
  return normalizeOpportunity(localOpportunity.value ?? props.opportunity)
})

const accentColor = computed(() => item.value?.categoryMeta?.color ?? '#079272')

const description = computed(() => {
  const current = item.value
  if (!current) return ''

  return (
    current.description ||
    current.content ||
    current.excerpt ||
    current.category_data?.description ||
    current.category_data?.summary ||
    ''
  )
})

const infoCards = computed(() => {
  const current = item.value
  if (!current) return []

  const data = current.category_data ?? {}
  const cards: Array<{ title: string; label: string }> = []

  for (const key of CATEGORY_DATA_ORDER) {
    const card = makeInfoCard(key, data[key])
    if (card) cards.push(card)
  }

  const specifics = normalizeJsonObject(data.specifics)

  for (const key of SPECIFICS_ORDER) {
    const card = makeInfoCard(key, specifics[key])
    if (card) cards.push(card)
  }

  return cards.filter((card) => card.title !== 'Tipo')
})

const recommendationCards = computed(() => {
  const current = item.value
  if (!current) return []

  const cards = [
    {
      title: 'Áreas relacionadas',
      icon: '🧠',
      values: normalizeRecommendationList(current.target_subjects),
      labels: SUBJECT_LABELS,
      variant: 'blue',
    },
    {
      title: 'Boa para objetivos',
      icon: '🎯',
      values: normalizeRecommendationList(current.target_goals),
      labels: GOAL_LABELS,
      variant: 'emerald',
    },
    {
      title: 'Nível escolar sugerido',
      icon: '🎒',
      values: normalizeRecommendationList(current.target_education_levels),
      labels: EDUCATION_LEVEL_LABELS,
      variant: 'purple',
    },
    {
      title: 'Nível recomendado',
      icon: '📈',
      values: normalizeRecommendationList(current.recommended_experience_levels),
      labels: EXPERIENCE_LEVEL_LABELS,
      variant: 'purple',
    },
    {
      title: 'Competitividade',
      icon: '🏁',
      values: normalizeRecommendationList(current.competitiveness_level),
      labels: COMPETITIVENESS_LABELS,
      variant: 'amber',
    },
    {
      title: 'Tempo de preparo',
      icon: '⏳',
      values: normalizeRecommendationList(current.preparation_horizon),
      labels: PREPARATION_HORIZON_LABELS,
      variant: 'blue',
    },
    {
      title: 'Recorrência',
      icon: '🔁',
      values: normalizeRecommendationList(current.recurrence_type),
      labels: RECURRENCE_TYPE_LABELS,
      variant: 'zinc',
    },
  ]

  return cards
    .map((card) => ({
      ...card,
      values: card.values
        .map((value) => humanizeRecommendationValue(value, card.labels))
        .filter(Boolean),
    }))
    .filter((card) => card.values.length > 0)
})

const recommendationNotes = computed(() => {
  const current = item.value
  if (!current?.recommendation_notes) return ''

  return String(current.recommendation_notes).trim()
})

const referenceLinks = computed(() => {
  const current = item.value
  if (!current) return []

  const refs = normalizeJsonObject(current.category_data).references
  return Array.isArray(refs) ? refs.filter((ref) => ref?.url) : []
})

const displayTimeline = computed(() => {
  const current = item.value
  if (!current) return []

  return [...current.timeline]
    .map((event) => {
      const date = parseLocalDate(event.date)
      const kindMeta = getTimelineKindMeta(event)

      return {
        ...event,
        _date: date,
        formattedDate: fmtDate(event.date),
        shortDate: fmtShortDate(event.date),
        kindMeta,
        tone: kindMeta.tone,
      }
    })
    .filter((event) => event.label || event.details || event.formattedDate)
    .sort((a, b) => {
      const aTime = a._date?.getTime?.() ?? Number.POSITIVE_INFINITY
      const bTime = b._date?.getTime?.() ?? Number.POSITIVE_INFINITY
      return aTime - bTime
    })
})

const heroSubline = computed(() => {
  const current = item.value
  if (!current) return ''

  const parts = [
    current.location,
    current.is_free ? 'Gratuita' : null,
    current.deadlineActionLabel || null,
  ].filter(Boolean)

  return parts.join(' · ')
})


function getReferenceTitle(ref: any, index: number) {
  return ref?.title || ref?.label || ref?.name || `Recurso ${index + 1}`
}

function retryLoadDetails() {
  if (!props.opportunity) return
  fetchFullOpportunity(props.opportunity)
}

function closeModal() {
  requestSeq++
  loading.value = false
  error.value = null
  localOpportunity.value = null
  emit('close')
}

watch(
  () => props.opportunity
    ? `${props.opportunity.id ?? ''}:${props.opportunity.slug ?? ''}`
    : '',
  async () => {
    requestSeq++

    const base = props.opportunity

    localOpportunity.value = base
    loading.value = false
    error.value = null

    if (!base) return

    await fetchFullOpportunity(base)
  },
  { immediate: true },
)


onBeforeUnmount(() => {
  requestSeq++
  loading.value = false
})
</script>

<template>
  <Teleport to="body">
    <Transition name="opportunity-modal">
      <div
        v-if="item"
        class="opportunity-modal-backdrop"
        @click.self="closeModal"
      >
        <article
          class="opportunity-modal"
          role="dialog"
          aria-modal="true"
          :aria-label="item.title"
          :style="{ '--accent': accentColor }"
        >
          <header class="opportunity-modal__cover">
            <img
              v-if="item.cover_url"
              :src="item.cover_url"
              :alt="item.title"
              class="opportunity-modal__cover-img"
            >

            <div
              v-else
              class="opportunity-modal__cover-fallback"
              :style="{ background: `linear-gradient(135deg, ${item.categoryMeta.color}38, ${item.categoryMeta.color}10)` }"
            >
              <span>{{ item.categoryMeta.icon }}</span>
            </div>

            <div class="opportunity-modal__cover-overlay" />

            <button
              type="button"
              class="opportunity-modal__close"
              aria-label="Fechar"
              @click="closeModal"
            >
              ×
            </button>

            <button
              v-if="isAdmin && item.id"
              type="button"
              class="opportunity-modal__edit"
              @click="emit('edit', item)"
            >
              Editar
            </button>

            <div class="opportunity-modal__cover-content">
              <div class="opportunity-modal__badges opportunity-modal__badges--on-cover">
                <span
                  class="opportunity-badge opportunity-badge--glass"
                  :style="{
                    background: item.categoryMeta.color + '24',
                    color: '#fff',
                    borderColor: item.categoryMeta.color + '55',
                  }"
                >
                  {{ item.categoryMeta.icon }} {{ item.categoryMeta.label }}
                </span>

                <span v-if="item.human_verified" class="opportunity-badge opportunity-badge--glass">
                  ✓ Verificado
                </span>

                <span v-if="item.priority >= 2" class="opportunity-badge opportunity-badge--glass">
                  ★ {{ item.priorityMeta.label }}
                </span>
              </div>

              <h2 class="opportunity-modal__title">
                {{ item.title }}
              </h2>

              <p v-if="heroSubline" class="opportunity-modal__subline">
                {{ heroSubline }}
              </p>
            </div>
          </header>

          <main class="opportunity-modal__body">
            <div class="opportunity-radar-warning-slot">
              <OpportunityRadarCalendarPanel
                :opportunity="item"
                :accent-color="accentColor"
              />
            </div>

            <section class="opportunity-quick-grid" aria-label="Resumo rápido da oportunidade">
              <div
                class="opportunity-quick-card opportunity-quick-card--deadline"
                :class="{
                  'opportunity-quick-card--urgent': item.deadline.urgent,
                  'opportunity-quick-card--overdue': item.deadline.overdue,
                }"
              >
                <span class="opportunity-quick-card__icon">⏰</span>
                <div>
                  <small>Próxima ação</small>
                  <strong>{{ item.deadlineActionLabel || 'Sem prazo acionável' }}</strong>
                </div>
              </div>

              <div class="opportunity-quick-card opportunity-quick-card--location">
                <span class="opportunity-quick-card__icon">📍</span>
                <div>
                  <small>Local</small>
                  <strong>{{ item.location }}</strong>
                </div>
              </div>

              <div class="opportunity-quick-card opportunity-quick-card--cost">
                <span class="opportunity-quick-card__icon">💸</span>
                <div>
                  <small>Custo</small>
                  <strong>{{ item.is_free ? 'Gratuita' : 'Verificar custo' }}</strong>
                </div>
              </div>
            </section>

            <div v-if="loading" class="opportunity-loading">
              <span class="opportunity-loading__spinner" />
              Carregando detalhes completos...
            </div>

            <div v-if="error" class="opportunity-error">
              <span>{{ error }}</span>
              <button type="button" @click="retryLoadDetails">Tentar de novo</button>
            </div>

            <section class="opportunity-section opportunity-section--about">
              <header class="opportunity-section__header">
                <span class="opportunity-section__bar" />
                <div>
                  <h3>Sobre a oportunidade</h3>
                  <p>O que é, para quem serve e por que pode valer atenção.</p>
                </div>
              </header>

              <p v-if="description" class="opportunity-description">
                {{ description }}
              </p>

              <p v-else class="opportunity-empty">
                Ainda não temos uma descrição completa para esta oportunidade.
              </p>
            </section>

            <section v-if="infoCards.length > 0" class="opportunity-section">
              <header class="opportunity-section__header">
                <span class="opportunity-section__bar opportunity-section__bar--emerald" />
                <div>
                  <h3>Informações importantes</h3>
                  <p>Dados práticos para decidir se faz sentido continuar.</p>
                </div>
              </header>

              <div class="opportunity-info-grid">
                <div
                  v-for="card in infoCards"
                  :key="card.title"
                  class="opportunity-info-card"
                  :class="`opportunity-info-card--${getInfoVariant(card.title)}`"
                >
                  <div class="opportunity-info-card__icon">
                    {{ getInfoIcon(card.title) }}
                  </div>

                  <div>
                    <strong>{{ card.title }}</strong>

                    <ul>
                      <li
                        v-for="line in getCardLines(card)"
                        :key="line"
                      >
                        {{ line }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section
              v-if="recommendationCards.length > 0 || recommendationNotes"
              class="opportunity-section"
            >
              <header class="opportunity-section__header">
                <span class="opportunity-section__bar opportunity-section__bar--purple" />
                <div>
                  <h3>Perfil recomendado</h3>
                  <p>Como essa oportunidade se conecta com interesses, preparo e objetivos.</p>
                </div>
              </header>

              <div v-if="recommendationCards.length > 0" class="opportunity-recommendation-grid">
                <div
                  v-for="card in recommendationCards"
                  :key="card.title"
                  class="opportunity-recommendation-card"
                  :class="`opportunity-recommendation-card--${card.variant}`"
                >
                  <div class="opportunity-recommendation-card__icon">
                    {{ card.icon }}
                  </div>

                  <div>
                    <strong>{{ card.title }}</strong>

                    <div class="opportunity-recommendation-card__chips">
                      <span
                        v-for="value in card.values"
                        :key="value"
                      >
                        {{ value }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p v-if="recommendationNotes" class="opportunity-recommendation-note">
                {{ recommendationNotes }}
              </p>
            </section>

            <section v-if="displayTimeline.length > 0" class="opportunity-section opportunity-section--timeline">
              <header class="opportunity-section__header">
                <span class="opportunity-section__bar opportunity-section__bar--amber" />
                <div>
                  <h3>Linha do tempo</h3>
                  <p>Datas mais importantes em ordem cronológica.</p>
                </div>
              </header>

              <div class="opportunity-timeline">
                <article
                  v-for="event in displayTimeline"
                  :key="`${event.label}-${event.date}`"
                  class="opportunity-timeline__item"
                >
                  <div
                    class="opportunity-timeline__dot"
                    :class="[
                      event.show_on_calendar && 'opportunity-timeline__dot--active',
                      `opportunity-timeline__dot--${event.tone}`,
                    ]"
                  />

                  <div class="opportunity-timeline__content">
                    <div class="opportunity-timeline__head">
                      <strong>{{ event.label }}</strong>
                      <span
                        class="opportunity-timeline__kind"
                        :class="`opportunity-timeline__kind--${event.tone}`"
                      >
                        {{ event.kindMeta.shortLabel }}
                      </span>
                    </div>

                    <span v-if="event.formattedDate" class="opportunity-timeline__date">
                      {{ event.formattedDate }}
                    </span>

                    <p v-if="event.details">{{ event.details }}</p>
                  </div>
                </article>
              </div>
            </section>

            <section v-if="referenceLinks.length > 0" class="opportunity-section">
              <header class="opportunity-section__header">
                <span class="opportunity-section__bar opportunity-section__bar--blue" />
                <div>
                  <h3>Recursos</h3>
                  <p>Links úteis para conferir detalhes, inscrição ou regulamento.</p>
                </div>
              </header>

              <div class="opportunity-links">
                <a
                  v-for="(ref, index) in referenceLinks"
                  :key="ref.url"
                  :href="ref.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="opportunity-link"
                >
                  <span>🔗</span>
                  <div>
                    <strong>{{ getReferenceTitle(ref, index) }}</strong>
                    <small>{{ ref.description || 'Abrir recurso' }}</small>
                  </div>
                </a>
              </div>
            </section>

            <section v-if="item.tags.length > 0" class="opportunity-section opportunity-section--compact">
              <header class="opportunity-section__header">
                <span class="opportunity-section__bar opportunity-section__bar--zinc" />
                <div>
                  <h3>Tags</h3>
                </div>
              </header>

              <div class="opportunity-tags">
                <span
                  v-for="tag in item.tags"
                  :key="tag"
                  class="opportunity-tag"
                >
                  {{ tag }}
                </span>
              </div>
            </section>

            <footer class="opportunity-modal__actions">
              <button
                type="button"
                class="opportunity-secondary-action"
                @click="closeModal"
              >
                Fechar
              </button>

              <a
                v-if="item.official_site_url"
                :href="item.official_site_url"
                target="_blank"
                rel="noopener noreferrer"
                class="opportunity-primary-action"
              >
                Acessar site oficial →
              </a>
            </footer>
          </main>
        </article>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.opportunity-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  padding: 24px;
  background: rgba(15, 23, 42, .62);
  backdrop-filter: blur(10px);
  display: grid;
  place-items: center;
}

.opportunity-modal {
  --accent: #079272;
  width: min(840px, 100%);
  max-height: min(92vh, 960px);
  overflow: auto;
  border-radius: 30px;
  background: #fff;
  box-shadow: 0 30px 100px rgba(15, 23, 42, .38);
  scrollbar-width: thin;
  scrollbar-color: #d6d3d1 transparent;
}

.opportunity-modal__cover {
  height: 270px;
  position: relative;
  overflow: hidden;
  background: #0f172a;
}

.opportunity-modal__cover-img,
.opportunity-modal__cover-fallback {
  width: 100%;
  height: 100%;
}

.opportunity-modal__cover-img {
  object-fit: cover;
  transform: scale(1.01);
}

.opportunity-modal__cover-fallback {
  display: grid;
  place-items: center;
}

.opportunity-modal__cover-fallback span {
  font-size: 4.1rem;
  filter: drop-shadow(0 20px 45px rgba(15, 23, 42, .22));
}

.opportunity-modal__cover-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 42%, transparent), transparent 34%),
    linear-gradient(to bottom, rgba(15, 23, 42, .08), rgba(15, 23, 42, .78));
}

.opportunity-modal__close,
.opportunity-modal__edit {
  position: absolute;
  top: 16px;
  border: none;
  cursor: pointer;
  font-weight: 950;
  z-index: 3;
  backdrop-filter: blur(8px);
}

.opportunity-modal__close {
  right: 16px;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: rgba(15, 23, 42, .72);
  color: white;
  font-size: 1.25rem;
}

.opportunity-modal__edit {
  left: 16px;
  border-radius: 999px;
  padding: 10px 14px;
  background: rgba(15, 23, 42, .74);
  color: white;
  font-size: .78rem;
}

.opportunity-modal__cover-content {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 22px;
  z-index: 2;
  display: grid;
  gap: 10px;
}

.opportunity-modal__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.opportunity-modal__badges--on-cover {
  margin-bottom: 2px;
}

.opportunity-badge {
  border: 1px solid;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: .72rem;
  font-weight: 900;
  line-height: 1;
}

.opportunity-badge--glass {
  background: rgba(255, 255, 255, .14);
  color: white;
  border-color: rgba(255, 255, 255, .28);
  box-shadow: 0 12px 28px rgba(15, 23, 42, .18);
  backdrop-filter: blur(10px);
}

.opportunity-badge--verified {
  background: #ecfdf5;
  color: #047857;
  border-color: #bbf7d0;
}

.opportunity-badge--pending {
  background: #fff7ed;
  color: #c2410c;
  border-color: #fed7aa;
}

.opportunity-badge--free {
  background: #eff6ff;
  color: #2563eb;
  border-color: #bfdbfe;
}

.opportunity-modal__title {
  margin: 0;
  max-width: 720px;
  color: white;
  font-size: clamp(1.75rem, 4vw, 2.7rem);
  line-height: 1.03;
  letter-spacing: -.055em;
  text-shadow: 0 18px 45px rgba(15, 23, 42, .36);
}

.opportunity-modal__subline {
  margin: 0;
  color: rgba(255, 255, 255, .82);
  font-size: .92rem;
  line-height: 1.35;
}

.opportunity-modal__body {
  padding: 24px;
  display: grid;
  gap: 22px;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 8%, transparent), transparent 22rem),
    #fff;
}

.opportunity-radar-warning-slot {
  display: block;
}

.opportunity-quick-grid {
  display: grid;
  grid-template-columns: 1.25fr 1fr 1fr;
  gap: 12px;
}

.opportunity-quick-card {
  border: 1px solid #e7e5e4;
  border-radius: 22px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 11px;
  background: #fafaf9;
  color: #44403c;
}

.opportunity-quick-card__icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 15px;
  background: white;
  border: 1px solid rgba(15, 23, 42, .06);
  flex-shrink: 0;
}

.opportunity-quick-card small {
  display: block;
  margin-bottom: 3px;
  color: #a8a29e;
  font-size: .65rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .07em;
}

.opportunity-quick-card strong {
  color: #1c1917;
  font-size: .88rem;
  line-height: 1.25;
}

.opportunity-quick-card--deadline {
  background: #fffbeb;
  border-color: #fde68a;
}

.opportunity-quick-card--urgent {
  background: #fff7ed;
  border-color: #fdba74;
}

.opportunity-quick-card--overdue {
  background: #fef2f2;
  border-color: #fecaca;
}

.opportunity-quick-card--location {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.opportunity-quick-card--cost {
  background: #ecfdf5;
  border-color: #bbf7d0;
}

.opportunity-loading {
  border: 1px solid #dbeafe;
  background: #eff6ff;
  color: #1d4ed8;
  border-radius: 16px;
  padding: 11px 13px;
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: .82rem;
  font-weight: 850;
}

.opportunity-loading__spinner {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 2px solid rgba(37, 99, 235, .2);
  border-top-color: #2563eb;
  animation: spin .7s linear infinite;
}

.opportunity-error {
  margin: 0;
  border-radius: 16px;
  background: #fef2f2;
  color: #b91c1c;
  padding: 12px 14px;
  font-size: .84rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.opportunity-error button {
  border: none;
  border-radius: 999px;
  background: #b91c1c;
  color: white;
  padding: 7px 10px;
  font-size: .74rem;
  font-weight: 950;
  cursor: pointer;
  white-space: nowrap;
}

.opportunity-section {
  display: grid;
  gap: 13px;
}

.opportunity-section--compact {
  gap: 10px;
}

.opportunity-section__header {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.opportunity-section__bar {
  width: 4px;
  min-height: 36px;
  border-radius: 999px;
  background: linear-gradient(to bottom, var(--accent), #6366f1);
  flex-shrink: 0;
}

.opportunity-section__bar--emerald {
  background: linear-gradient(to bottom, #10b981, #14b8a6);
}

.opportunity-section__bar--purple {
  background: linear-gradient(to bottom, #8b5cf6, #6366f1);
}

.opportunity-section__bar--amber {
  background: linear-gradient(to bottom, #f59e0b, #f97316);
}

.opportunity-section__bar--blue {
  background: linear-gradient(to bottom, #0ea5e9, #2563eb);
}

.opportunity-section__bar--zinc {
  background: linear-gradient(to bottom, #94a3b8, #64748b);
}

.opportunity-section h3 {
  margin: 0;
  color: #1c1917;
  font-size: .9rem;
  font-weight: 950;
  letter-spacing: -.01em;
}

.opportunity-section__header p {
  margin: 3px 0 0;
  color: #94a3b8;
  font-size: .78rem;
  line-height: 1.35;
}

.opportunity-description {
  margin: 0;
  color: #44403c;
  font-size: .98rem;
  line-height: 1.78;
  white-space: pre-line;
}

.opportunity-empty {
  margin: 0;
  color: #9ca3af;
  font-size: .9rem;
  line-height: 1.6;
  font-style: italic;
}

.opportunity-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.opportunity-info-card {
  border: 1px solid #e7e5e4;
  border-radius: 22px;
  padding: 14px;
  display: flex;
  gap: 12px;
  background: #fff;
}

.opportunity-info-card--blue {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.opportunity-info-card--amber {
  background: #fffbeb;
  border-color: #fde68a;
}

.opportunity-info-card--emerald {
  background: #ecfdf5;
  border-color: #bbf7d0;
}

.opportunity-info-card--purple {
  background: #f5f3ff;
  border-color: #ddd6fe;
}

.opportunity-info-card--zinc {
  background: #fafaf9;
  border-color: #e7e5e4;
}

.opportunity-info-card__icon,
.opportunity-recommendation-card__icon {
  width: 36px;
  height: 36px;
  border-radius: 15px;
  background: rgba(255, 255, 255, .78);
  border: 1px solid rgba(15, 23, 42, .05);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.opportunity-info-card strong,
.opportunity-recommendation-card strong {
  display: block;
  color: #1c1917;
  font-size: .86rem;
  margin-bottom: 7px;
}

.opportunity-info-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 5px;
}

.opportunity-info-card li {
  color: #57534e;
  font-size: .8rem;
  line-height: 1.48;
}

.opportunity-recommendation-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.opportunity-recommendation-card {
  border: 1px solid #e7e5e4;
  border-radius: 22px;
  padding: 14px;
  display: flex;
  gap: 12px;
  background: #fafaf9;
}

.opportunity-recommendation-card--blue {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.opportunity-recommendation-card--emerald {
  background: #ecfdf5;
  border-color: #bbf7d0;
}

.opportunity-recommendation-card--amber {
  background: #fffbeb;
  border-color: #fde68a;
}

.opportunity-recommendation-card--purple {
  background: #f5f3ff;
  border-color: #ddd6fe;
}

.opportunity-recommendation-card--zinc {
  background: #fafaf9;
  border-color: #e7e5e4;
}

.opportunity-recommendation-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.opportunity-recommendation-card__chips span {
  border-radius: 999px;
  background: rgba(255, 255, 255, .82);
  border: 1px solid rgba(120, 113, 108, .14);
  color: #44403c;
  padding: 5px 9px;
  font-size: .73rem;
  font-weight: 850;
}

.opportunity-recommendation-note {
  margin: 0;
  border-radius: 20px;
  background: linear-gradient(135deg, #f8fafc, #eef2ff);
  border: 1px solid #dbe4ff;
  color: #475569;
  padding: 14px 15px;
  font-size: .88rem;
  line-height: 1.65;
}

.opportunity-timeline {
  display: grid;
  gap: 17px;
  padding: 2px 0 2px 2px;
}

.opportunity-timeline__item {
  position: relative;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 15px;
}

.opportunity-timeline__item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 5.5px;
  top: 25px;
  bottom: -13px;
  width: 2px;
  border-radius: 999px;
  background: #e7e5e4;
}

.opportunity-timeline__dot {
  position: relative;
  z-index: 1;
  width: 13px;
  height: 13px;
  margin-top: 5px;
  border-radius: 999px;
  background: #d6d3d1;
  box-shadow: 0 0 0 6px #f5f5f4;
}

.opportunity-timeline__dot--active {
  background: #10b981;
  box-shadow: 0 0 0 6px #d1fae5;
}

.opportunity-timeline__dot--amber {
  background: #f59e0b;
  box-shadow: 0 0 0 6px #fef3c7;
}

.opportunity-timeline__dot--blue {
  background: #2563eb;
  box-shadow: 0 0 0 6px #dbeafe;
}

.opportunity-timeline__dot--emerald {
  background: #10b981;
  box-shadow: 0 0 0 6px #d1fae5;
}

.opportunity-timeline__dot--purple {
  background: #7c3aed;
  box-shadow: 0 0 0 6px #ede9fe;
}

.opportunity-timeline__dot--zinc {
  background: #94a3b8;
  box-shadow: 0 0 0 6px #f1f5f9;
}

.opportunity-timeline__content {
  min-width: 0;
  border: 1px solid #e7e5e4;
  border-radius: 18px;
  padding: 14px 15px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(15, 23, 42, .045);
}

.opportunity-timeline__head {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.opportunity-timeline__head strong {
  color: #292524;
  font-size: 1.05rem;
  line-height: 1.32;
  font-weight: 950;
  letter-spacing: -.018em;
}

.opportunity-timeline__kind {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 8px;
  font-size: .72rem;
  font-weight: 950;
  border: 1px solid #e7e5e4;
  background: #f8fafc;
  color: #475569;
  white-space: nowrap;
}

.opportunity-timeline__kind--emerald {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #047857;
}

.opportunity-timeline__kind--amber {
  background: #fffbeb;
  border-color: #fde68a;
  color: #b45309;
}

.opportunity-timeline__kind--blue {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #2563eb;
}

.opportunity-timeline__kind--purple {
  background: #f5f3ff;
  border-color: #ddd6fe;
  color: #6d28d9;
}

.opportunity-timeline__kind--zinc {
  background: #f8fafc;
  border-color: #e2e8f0;
  color: #475569;
}

.opportunity-timeline__date {
  display: block;
  color: #059669;
  font-size: .92rem;
  font-weight: 950;
  margin-bottom: 6px;
}

.opportunity-timeline p {
  margin: 0;
  color: #78716c;
  font-size: .9rem;
  line-height: 1.58;
}

.opportunity-tags,
.opportunity-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.opportunity-tag {
  border-radius: 999px;
  background: #f5f5f4;
  border: 1px solid #e7e5e4;
  color: #57534e;
  padding: 7px 10px;
  font-size: .75rem;
  font-weight: 850;
}

.opportunity-links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.opportunity-link {
  min-width: 0;
  border: 1px solid #dbeafe;
  border-radius: 18px;
  padding: 12px;
  color: #1d4ed8;
  text-decoration: none;
  font-size: .82rem;
  font-weight: 900;
  background: #eff6ff;
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.opportunity-link:hover {
  border-color: #93c5fd;
  transform: translateY(-1px);
}

.opportunity-link strong,
.opportunity-link small {
  display: block;
}

.opportunity-link small {
  margin-top: 3px;
  color: #64748b;
  font-size: .72rem;
  line-height: 1.35;
  font-weight: 750;
}

.opportunity-modal__actions {
  border-top: 1px solid #f0ece8;
  padding-top: 18px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.opportunity-primary-action,
.opportunity-secondary-action {
  border: none;
  border-radius: 15px;
  padding: 12px 16px;
  font-size: .86rem;
  font-weight: 950;
  cursor: pointer;
  text-decoration: none;
}

.opportunity-primary-action {
  background: var(--accent);
  color: white;
  box-shadow: 0 14px 34px color-mix(in srgb, var(--accent) 28%, transparent);
}

.opportunity-secondary-action {
  background: #f5f5f4;
  color: #57534e;
}

.opportunity-modal-enter-active,
.opportunity-modal-leave-active {
  transition: opacity .16s ease;
}

.opportunity-modal-enter-active .opportunity-modal,
.opportunity-modal-leave-active .opportunity-modal {
  transition: transform .16s ease, opacity .16s ease;
}

.opportunity-modal-enter-from,
.opportunity-modal-leave-to {
  opacity: 0;
}

.opportunity-modal-enter-from .opportunity-modal,
.opportunity-modal-leave-to .opportunity-modal {
  transform: translateY(10px) scale(.985);
  opacity: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 760px) {
  .opportunity-modal-backdrop {
    padding: 10px;
    align-items: end;
  }

  .opportunity-modal {
    max-height: 94vh;
    border-radius: 28px 28px 0 0;
  }

  .opportunity-modal__cover {
    height: auto;
    min-height: 0;
    overflow: visible;
    background: #fff;
  }

  .opportunity-modal__cover-img,
  .opportunity-modal__cover-fallback {
    height: 162px;
    border-radius: 0;
  }

  .opportunity-modal__cover-img {
    object-position: center;
  }

  .opportunity-modal__cover-overlay {
    bottom: auto;
    height: 162px;
    background:
      radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 34%, transparent), transparent 42%),
      linear-gradient(to bottom, rgba(15, 23, 42, .08), rgba(15, 23, 42, .38));
  }

  .opportunity-modal__cover-content {
    position: relative;
    left: auto;
    right: auto;
    bottom: auto;
    padding: 15px 18px 18px;
    background: #fff;
    border-bottom: 1px solid #f0ece8;
  }

  .opportunity-modal__badges--on-cover .opportunity-badge--glass {
    background: #f8fafc !important;
    color: #334155 !important;
    border-color: #e2e8f0 !important;
    box-shadow: none;
  }

  .opportunity-modal__title {
    color: #0f172a;
    text-shadow: none;
    font-size: clamp(1.35rem, 6.4vw, 1.75rem);
    line-height: 1.13;
    letter-spacing: -.04em;
  }

  .opportunity-modal__subline {
    color: #64748b;
    font-size: .86rem;
  }

  .opportunity-modal__body {
    padding: 18px;
  }

  .opportunity-quick-grid,
  .opportunity-info-grid,
  .opportunity-recommendation-grid,
  .opportunity-links {
    grid-template-columns: 1fr;
  }

  .opportunity-timeline {
    gap: 15px;
  }

  .opportunity-timeline__item {
    grid-template-columns: 20px minmax(0, 1fr);
    gap: 12px;
  }

  .opportunity-timeline__item:not(:last-child)::before {
    left: 5px;
    top: 24px;
    bottom: -12px;
  }

  .opportunity-timeline__dot {
    width: 12px;
    height: 12px;
    box-shadow: 0 0 0 5px #f5f5f4;
  }

  .opportunity-timeline__content {
    padding: 13px 14px;
    border-radius: 16px;
  }

  .opportunity-timeline__head strong {
    font-size: 1rem;
  }

  .opportunity-timeline__date {
    font-size: .88rem;
  }

  .opportunity-modal__actions {
    flex-direction: column-reverse;
  }

  .opportunity-primary-action,
  .opportunity-secondary-action {
    width: 100%;
    text-align: center;
  }
}
</style>