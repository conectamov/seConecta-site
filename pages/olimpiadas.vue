<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

useSeoMeta({ title: 'Olimpíadas — seConecta' })

const route = useRoute()
const { get } = useAxios()

const PAGE_SIZE = 36

const PRIORITY_LABEL: Record<number, { label: string; color: string }> = {
  5: { label: 'Essencial', color: '#f59e0b' },
  4: { label: 'Muito recomendada', color: '#10b981' },
  3: { label: 'Destaque', color: '#6366f1' },
  2: { label: 'Boa para começar', color: '#0ea5e9' },
  1: { label: 'Relevante', color: '#a78bfa' },
  0: { label: '', color: '' },
}

const SUBJECT_META: Record<string, {
  label: string
  icon: string
  color: string
  aliases: string[]
}> = {
  math: {
    label: 'Matemática',
    icon: '📐',
    color: '#f59e0b',
    aliases: ['matematica', 'matemática', 'math', 'mathematics', 'obm', 'obmep', 'tm2'],
  },
  programming: {
    label: 'Programação',
    icon: '💻',
    color: '#2563eb',
    aliases: ['programacao', 'programação', 'informatica', 'informática', 'computacao', 'computação', 'programming', 'obi', 'ioi'],
  },
  physics: {
    label: 'Física',
    icon: '⚛️',
    color: '#7c3aed',
    aliases: ['fisica', 'física', 'physics', 'obf', 'ipho'],
  },
  chemistry: {
    label: 'Química',
    icon: '🧪',
    color: '#059669',
    aliases: ['quimica', 'química', 'chemistry', 'obq', 'icho'],
  },
  biology: {
    label: 'Biologia',
    icon: '🧬',
    color: '#16a34a',
    aliases: ['biologia', 'biology', 'obb', 'ibo'],
  },
  astronomy: {
    label: 'Astronomia',
    icon: '🪐',
    color: '#0ea5e9',
    aliases: ['astronomia', 'astronomy', 'oba', 'oaa', 'ioaa'],
  },
  linguistics: {
    label: 'Linguística',
    icon: '🗣️',
    color: '#db2777',
    aliases: ['linguistica', 'linguística', 'linguistics', 'obl', 'iol'],
  },
  history: {
    label: 'História',
    icon: '🏺',
    color: '#92400e',
    aliases: ['historia', 'história', 'history', 'onhb'],
  },
  geography: {
    label: 'Geografia',
    icon: '🗺️',
    color: '#0891b2',
    aliases: ['geografia', 'geography', 'geo', 'obg'],
  },
  science: {
    label: 'Ciências',
    icon: '🔭',
    color: '#65a30d',
    aliases: ['ciencias', 'ciências', 'science', 'ciencias da natureza', 'ciências da natureza'],
  },
  robotics: {
    label: 'Robótica',
    icon: '🤖',
    color: '#475569',
    aliases: ['robotica', 'robótica', 'robotics', 'obr'],
  },
  writing: {
    label: 'Redação e Humanidades',
    icon: '✍️',
    color: '#ea580c',
    aliases: ['redacao', 'redação', 'escrita', 'literatura', 'humanidades', 'essay', 'writing'],
  },
  economics: {
    label: 'Economia',
    icon: '📊',
    color: '#4f46e5',
    aliases: ['economia', 'economics', 'finance', 'financas', 'finanças'],
  },
  other: {
    label: 'Outras áreas',
    icon: '✨',
    color: '#64748b',
    aliases: [],
  },
}

const SUBJECT_ORDER = [
  'math',
  'programming',
  'physics',
  'chemistry',
  'biology',
  'astronomy',
  'linguistics',
  'history',
  'geography',
  'science',
  'robotics',
  'writing',
  'economics',
  'other',
]

const LEVEL_OPTIONS = [
  { value: '', label: 'Todos os níveis' },
  { value: 'fundamental', label: 'Ensino fundamental' },
  { value: 'medio', label: 'Ensino médio' },
  { value: 'ambos', label: 'Fundamental e médio' },
  { value: 'internacional', label: 'Internacional' },
]


type QuickFilter = 'open' | 'urgent' | 'opensSoon' | 'noRegistration' | ''
type RegistrationStatus = 'open' | 'opens_soon' | 'closed' | 'unknown'

const REGISTRATION_START_KINDS = new Set([
  'registration_start',
  'registration_open',
  'registration_opens',
  'application_start',
  'application_open',
  'applications_open',
  'inscricoes_abrem',
  'inicio_inscricoes',
])

const REGISTRATION_DEADLINE_KINDS = new Set([
  'registration_deadline',
  'registration_end',
  'registration_close',
  'registration_closes',
  'application_deadline',
  'application_end',
  'deadline_registration',
  'prazo_inscricao',
  'fim_inscricoes',
])

const TIMELINE_KIND_META: Record<string, { label: string; shortLabel: string; tone: string; prefix: string }> = {
  registration_start: {
    label: 'Início das inscrições',
    shortLabel: 'Abre inscrições',
    tone: 'emerald',
    prefix: 'Inscrições abrem em',
  },
  registration_deadline: {
    label: 'Prazo de inscrição',
    shortLabel: 'Prazo de inscrição',
    tone: 'amber',
    prefix: 'Inscrições até',
  },
  exam: {
    label: 'Prova',
    shortLabel: 'Prova',
    tone: 'blue',
    prefix: 'Prova em',
  },
  result: {
    label: 'Resultado',
    shortLabel: 'Resultado',
    tone: 'zinc',
    prefix: 'Resultado em',
  },
  phase: {
    label: 'Fase',
    shortLabel: 'Fase',
    tone: 'blue',
    prefix: 'Fase em',
  },
  submission_deadline: {
    label: 'Envio/submissão',
    shortLabel: 'Envio',
    tone: 'amber',
    prefix: 'Envio até',
  },
  other: {
    label: 'Evento',
    shortLabel: 'Evento',
    tone: 'zinc',
    prefix: 'Prazo em',
  },
}

const OLYMPIAD_FIELD_LABELS: Record<string, string> = {
  organizer: 'Organizador',
  subject: 'Matéria',
  olympiad_subject: 'Matéria',
  knowledge_areas: 'Áreas cobradas',
  school_level: 'Nível escolar',
  level: 'Nível',
  difficulty: 'Dificuldade',
  target_audience: 'Público-alvo',
  cost_info: 'Custo',
  format: 'Formato',
  modality: 'Modalidade',
  exam_format: 'Formato da prova',
  individual_or_team: 'Individual/equipe',
  phase_count: 'Número de fases',
  rounds: 'Fases',
  stages: 'Etapas',
  syllabus: 'Conteúdo cobrado',
  recommended_background: 'Base recomendada',
  requirements: 'Requisitos',
  registration_process: 'Como se inscrever',
  application_process: 'Como participar',
  medal_system: 'Sistema de medalhas',
  medal_criteria: 'Critério de premiação',
  award_criteria: 'Critério de premiação',
  prizes: 'Prêmios',
  awards: 'Premiações',
  benefits: 'Benefícios',
  previous_tests_url: 'Provas anteriores',
  official_rules_url: 'Regulamento',
  training_resources: 'Materiais de treino',
  workload: 'Dedicação esperada',
  source_notes: 'Observações',
}

const OLYMPIAD_INFO_ORDER = [
  'organizer',
  'subject',
  'olympiad_subject',
  'knowledge_areas',
  'school_level',
  'level',
  'difficulty',
  'target_audience',
  'cost_info',
  'format',
  'modality',
  'exam_format',
  'individual_or_team',
  'phase_count',
  'rounds',
  'stages',
  'syllabus',
  'recommended_background',
  'requirements',
  'registration_process',
  'application_process',
  'medal_system',
  'medal_criteria',
  'award_criteria',
  'prizes',
  'awards',
  'benefits',
  'training_resources',
  'workload',
  'source_notes',
]

function debounce<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout>

  return (...args: Parameters<T>) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
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

function parseLocalDate(raw: string | null | undefined): Date | null {
  if (!raw) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split('-').map(Number)
    return new Date(year, month - 1, day, 23, 59, 59)
  }

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}


function parseLocalStartDate(raw: string | null | undefined): Date | null {
  if (!raw) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split('-').map(Number)
    return new Date(year, month - 1, day, 0, 0, 0)
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

function formatDeadline(raw: string | null | undefined): {
  label: string
  urgent: boolean
  overdue: boolean
  daysLeft: number | null
} {
  const dt = parseLocalDate(raw)
  if (!dt) return { label: 'Sem prazo', urgent: false, overdue: false, daysLeft: null }

  const now = new Date()
  const diff = Math.ceil((dt.getTime() - now.getTime()) / 86_400_000)

  if (diff < 0) return { label: 'Encerrado', urgent: false, overdue: true, daysLeft: diff }
  if (diff === 0) return { label: 'Último dia!', urgent: true, overdue: false, daysLeft: 0 }
  if (diff <= 3) return { label: `${diff}d restante${diff > 1 ? 's' : ''}`, urgent: true, overdue: false, daysLeft: diff }
  if (diff <= 14) return { label: `${diff} dias`, urgent: false, overdue: false, daysLeft: diff }

  return { label: fmtShortDate(raw) ?? 'Sem prazo', urgent: false, overdue: false, daysLeft: diff }
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
  if (Array.isArray(value)) return value.filter(Boolean).map(String)

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String)
    } catch {}

    return value
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)
  }

  return []
}

function shouldShowTimelineEventOnCalendar(event: any) {
  if (!event || typeof event !== 'object') return false
  return event.show_on_calendar === true || event.show_on_calendar === 'true'
}

function normalizeTimelineKind(rawKind: unknown, event: any) {
  const explicitKind = normalizeText(rawKind).replaceAll('-', '_').replaceAll(' ', '_')

  if (REGISTRATION_START_KINDS.has(explicitKind)) return 'registration_start'
  if (REGISTRATION_DEADLINE_KINDS.has(explicitKind)) return 'registration_deadline'
  if (explicitKind === 'exam' || explicitKind === 'test' || explicitKind === 'prova') return 'exam'
  if (explicitKind === 'result' || explicitKind === 'resultado') return 'result'
  if (explicitKind === 'phase' || explicitKind === 'fase') return 'phase'
  if (explicitKind === 'submission_deadline' || explicitKind === 'submission' || explicitKind === 'envio') return 'submission_deadline'

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

  if (text.includes('inscri') || text.includes('registration') || text.includes('application')) {
    return 'registration_deadline'
  }

  if (text.includes('resultado')) return 'result'
  if (text.includes('prova') || text.includes('exame')) return 'exam'
  if (text.includes('fase')) return 'phase'
  if (text.includes('envio') || text.includes('submiss')) return 'submission_deadline'

  return explicitKind || 'other'
}

function getTimelineKindMeta(event: any) {
  return TIMELINE_KIND_META[event?.kind] ?? TIMELINE_KIND_META.other
}

function getTimelineKindLabel(event: any) {
  return getTimelineKindMeta(event).label
}

function getTimelineKindTone(event: any) {
  return getTimelineKindMeta(event).tone
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
    .filter(event => event && typeof event === 'object')
    .map(event => {
      const kind = normalizeTimelineKind(event.kind, event)

      return {
        ...event,
        kind,
        label: event.label ?? event.details ?? event.title ?? event.name ?? getTimelineKindMeta({ kind }).label,
        details: event.details ?? event.description ?? null,
        show_on_calendar: shouldShowTimelineEventOnCalendar(event),
      }
    })
}

function getDatedTimelineEvents(timeline: any[]) {
  return [...timeline]
    .map((event) => ({ ...event, _date: parseLocalDate(event?.date) }))
    .filter((event) => event._date)
    .sort((a, b) => a._date.getTime() - b._date.getTime())
}

function getFirstCalendarRelevantTimelineEvent(timeline: any[]) {
  const now = new Date()

  return getDatedTimelineEvents(timeline)
    .filter((event) => event.show_on_calendar === true)
    .filter((event) => event._date && event._date >= now)
    .sort((a, b) => a._date.getTime() - b._date.getTime())[0] ?? null
}

function getRegistrationInfo(timeline: any[]) {
  const now = new Date()
  const starts = timeline
    .filter(event => event?.kind === 'registration_start')
    .map(event => ({ ...event, _date: parseLocalStartDate(event?.date) }))
    .filter(event => event._date)
    .sort((a, b) => a._date.getTime() - b._date.getTime())

  const deadlines = timeline
    .filter(event => event?.kind === 'registration_deadline')
    .map(event => ({ ...event, _date: parseLocalDate(event?.date) }))
    .filter(event => event._date)
    .sort((a, b) => a._date.getTime() - b._date.getTime())
  const nextStart = starts.find(event => event._date >= now) ?? null
  const latestPastStart = [...starts].reverse().find(event => event._date < now) ?? null
  const nextDeadline = deadlines.find(event => event._date >= now) ?? null
  const latestDeadline = [...deadlines].reverse()[0] ?? null

  const hasAnyRegistrationEvent = starts.length > 0 || deadlines.length > 0
  const nextStartBelongsToCurrentCycle = Boolean(
    nextStart && nextDeadline && nextStart._date <= nextDeadline._date
  )
  const isOpen = Boolean(
    nextDeadline && !nextStartBelongsToCurrentCycle
  )
  const opensSoon = Boolean(!isOpen && nextStart)

  let status: RegistrationStatus = 'unknown'
  let displayEvent: any | null = null
  let deadlineEvent: any | null = null
  let startEvent: any | null = null

  if (isOpen) {
    status = 'open'
    displayEvent = nextDeadline
    deadlineEvent = nextDeadline
    startEvent = latestPastStart
  } else if (opensSoon) {
    status = 'opens_soon'
    displayEvent = nextStart
    deadlineEvent = nextDeadline
    startEvent = nextStart
  } else if (hasAnyRegistrationEvent) {
    status = 'closed'
    displayEvent = latestDeadline
    deadlineEvent = latestDeadline
    startEvent = latestPastStart
  }

  const daysUntilDeadline = deadlineEvent?._date
    ? Math.ceil((deadlineEvent._date.getTime() - now.getTime()) / 86_400_000)
    : null

  const daysUntilStart = startEvent?._date
    ? Math.ceil((startEvent._date.getTime() - now.getTime()) / 86_400_000)
    : null

  return {
    status,
    hasAnyRegistrationEvent,
    isOpen: status === 'open',
    opensSoon: status === 'opens_soon',
    displayEvent,
    deadlineEvent,
    startEvent,
    daysUntilDeadline,
    daysUntilStart,
  }
}

function getRegistrationStatusLabel(info: ReturnType<typeof getRegistrationInfo>) {
  if (info.status === 'open') return 'Inscrições abertas'
  if (info.status === 'opens_soon') return 'Inscrições em breve'
  if (info.status === 'closed') return 'Inscrições encerradas'
  return 'Sem inscrição cadastrada'
}

function getRegistrationActionLabel(info: ReturnType<typeof getRegistrationInfo>) {
  const raw = info.displayEvent?.date
  if (!raw) return ''

  const deadline = formatDeadline(raw)

  if (info.status === 'open') {
    if (deadline.urgent || (deadline.daysLeft !== null && deadline.daysLeft <= 14)) {
      return `Inscrições até · ${deadline.label}`
    }

    return `Inscrições até ${fmtShortDate(raw) ?? deadline.label}`
  }

  if (info.status === 'opens_soon') {
    if (deadline.daysLeft === 0) return 'Inscrições abrem hoje'
    if (deadline.daysLeft !== null && deadline.daysLeft > 0 && deadline.daysLeft <= 14) {
      return `Inscrições abrem em ${deadline.label}`
    }

    return `Inscrições abrem em ${fmtShortDate(raw) ?? deadline.label}`
  }

  if (info.status === 'closed') {
    return 'Inscrições encerradas'
  }

  return ''
}

function getTimelineLabel(event: any) {
  return (
    event?.details ??
    event?.description ??
    event?.label ??
    event?.title ??
    event?.name ??
    event?.event ??
    getTimelineKindLabel(event) ??
    'Evento'
  )
}

function getDeadlinePrefix(event: any) {
  if (event?.kind && TIMELINE_KIND_META[event.kind]) {
    return TIMELINE_KIND_META[event.kind].prefix
  }

  const text = normalizeText([
    event?.label,
    event?.details,
    event?.description,
    event?.title,
    event?.name,
  ])

  if (text.includes('resultado')) return 'Resultado em'
  if (text.includes('prova') || text.includes('exame')) return 'Prova em'
  if (text.includes('fase')) return 'Fase em'
  if (text.includes('envio') || text.includes('submiss')) return 'Envio até'
  if (text.includes('inscri')) return 'Inscrições até'

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
      .map(item => toTextValue(item))
      .filter(Boolean)

    return clean.length ? clean.join(' · ') : null
  }

  if (typeof value === 'object') return null

  const text = String(value).trim()
  return text || null
}

function getFirstText(...values: any[]) {
  for (const value of values) {
    const text = toTextValue(value)
    if (text) return text
  }

  return null
}

function inferSubjectKey(value: unknown) {
  const text = normalizeText(value)

  for (const key of SUBJECT_ORDER) {
    const meta = SUBJECT_META[key]
    if (!meta || key === 'other') continue

    if (meta.aliases.some(alias => text.includes(normalizeText(alias)))) {
      return key
    }
  }

  return 'other'
}

function getSubjectKeyFromItem(item: any) {
  const data = normalizeJsonObject(item?.category_data)
  const specifics = normalizeJsonObject(data.specifics)

  return inferSubjectKey([
    data.subject,
    data.olympiad_subject,
    data.main_subject,
    data.subject_area,
    data.discipline,
    data.area,
    specifics.subject,
    specifics.area,
    item?.tags,
    item?.keywords,
    item?.title,
  ])
}

function getLevelKey(value: unknown) {
  const text = normalizeText(value)

  const hasFundamental =
    text.includes('fundamental') ||
    text.includes('6') ||
    text.includes('7') ||
    text.includes('8') ||
    text.includes('9')

  const hasMedio =
    text.includes('medio') ||
    text.includes('ensino medio') ||
    text.includes('high school')

  const hasInternational =
    text.includes('internacional') ||
    text.includes('international') ||
    text.includes('global')

  if (hasInternational) return 'internacional'
  if (hasFundamental && hasMedio) return 'ambos'
  if (hasFundamental) return 'fundamental'
  if (hasMedio) return 'medio'

  return ''
}

function makeInfoCard(key: string, value: any) {
  const label = toTextValue(value)
  if (!label) return null

  return {
    title: OLYMPIAD_FIELD_LABELS[key] ?? key.replaceAll('_', ' '),
    label,
  }
}

function getOlympiadInfoCards(item: any) {
  const data = normalizeJsonObject(item?.category_data)
  const specifics = normalizeJsonObject(data.specifics)
  const cards: Array<{ title: string; label: string }> = []
  const usedLabels = new Set<string>()

  for (const key of OLYMPIAD_INFO_ORDER) {
    const card = makeInfoCard(key, data[key] ?? specifics[key])
    if (card && !usedLabels.has(card.title)) {
      cards.push(card)
      usedLabels.add(card.title)
    }
  }

  return cards
}

function getCardLines(card: any) {
  const value = card?.label

  if (!value) return []

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

function getInfoIcon(title: string) {
  const map: Record<string, string> = {
    Organizador: '🏛️',
    Matéria: '📚',
    'Áreas cobradas': '🧠',
    'Nível escolar': '🎒',
    Nível: '🎒',
    Dificuldade: '⛰️',
    'Público-alvo': '🎯',
    Custo: '💸',
    Formato: '🧭',
    Modalidade: '🧭',
    'Formato da prova': '📝',
    'Individual/equipe': '👥',
    'Número de fases': '🪜',
    Fases: '🪜',
    Etapas: '🪜',
    'Conteúdo cobrado': '📖',
    'Base recomendada': '💡',
    Requisitos: '📋',
    'Como se inscrever': '✅',
    'Como participar': '✅',
    'Sistema de medalhas': '🏅',
    'Critério de premiação': '🏅',
    Prêmios: '🏆',
    Premiações: '🏆',
    Benefícios: '✨',
    'Materiais de treino': '📚',
    'Dedicação esperada': '⏱️',
    Observações: '📝',
  }

  return map[title] ?? '•'
}

function getInfoTone(title: string) {
  if (['Como se inscrever', 'Como participar', 'Requisitos', 'Conteúdo cobrado', 'Base recomendada', 'Materiais de treino'].includes(title)) {
    return 'blue'
  }

  if (['Prêmios', 'Premiações', 'Sistema de medalhas', 'Critério de premiação', 'Benefícios'].includes(title)) {
    return 'amber'
  }

  if (['Custo', 'Formato', 'Modalidade', 'Formato da prova', 'Número de fases', 'Fases', 'Etapas', 'Dedicação esperada'].includes(title)) {
    return 'emerald'
  }

  if (['Observações'].includes(title)) {
    return 'zinc'
  }

  return 'blue'
}

function getResourceTone(ref: any) {
  const text = normalizeText([
    ref?.title,
    ref?.description,
    ref?.source_type,
    ref?.url,
  ])

  if (text.includes('prova') || text.includes('banco') || text.includes('treino') || text.includes('training')) {
    return 'blue'
  }

  if (text.includes('regulamento') || text.includes('rules') || text.includes('oficial')) {
    return 'emerald'
  }

  return 'blue'
}

function getReferenceLinks(item: any) {
  const data = normalizeJsonObject(item?.category_data)
  const refs = Array.isArray(data.references) ? data.references.filter((ref: any) => ref?.url) : []
  const extraRefs = []

  if (data.previous_tests_url) {
    extraRefs.push({
      title: 'Banco de provas',
      url: data.previous_tests_url,
      source_type: 'practice',
      description: 'Arquivo ou página com provas anteriores da olimpíada.',
    })
  }

  if (data.official_rules_url) {
    extraRefs.push({
      title: 'Regulamento',
      url: data.official_rules_url,
      source_type: 'official',
      description: 'Regulamento oficial da olimpíada.',
    })
  }

  return [...refs, ...extraRefs].filter((ref, index, arr) =>
    arr.findIndex(other => other.url === ref.url) === index
  )
}

function normalize(o: any) {
  const timeline = normalizeTimeline(o.timeline)
  const categoryData = normalizeJsonObject(o.category_data)
  const specifics = normalizeJsonObject(categoryData.specifics)
  const registrationInfo = getRegistrationInfo(timeline)
  const fallbackTimelineEvent = getFirstCalendarRelevantTimelineEvent(timeline)
  const nextTimelineEvent = registrationInfo.displayEvent ?? fallbackTimelineEvent
  const displayDeadlineRaw = nextTimelineEvent?.date ?? (timeline.length === 0 ? o.next_deadline : null)
  const deadline = formatDeadline(displayDeadlineRaw)
  const deadlineActionLabel = registrationInfo.displayEvent
    ? getRegistrationActionLabel(registrationInfo)
    : formatActionDeadline(nextTimelineEvent, displayDeadlineRaw)
  const registrationStatusLabel = getRegistrationStatusLabel(registrationInfo)
  const priority = typeof o.priority === 'number' ? Math.min(5, Math.max(0, o.priority)) : 0
  const subjectKey = getSubjectKeyFromItem({ ...o, category_data: categoryData })
  const subjectMeta = SUBJECT_META[subjectKey] ?? SUBJECT_META.other

  const levelText = getFirstText(
    categoryData.school_level,
    categoryData.level,
    categoryData.target_audience,
    specifics.school_level,
    specifics.level
  )

  const difficultyText = getFirstText(
    categoryData.difficulty,
    specifics.difficulty
  )

  const examFormatText = getFirstText(
    categoryData.exam_format,
    categoryData.format,
    categoryData.modality,
    specifics.exam_format,
    specifics.modality
  )

  const phasesText = getFirstText(
    categoryData.phase_count,
    categoryData.rounds,
    categoryData.stages,
    specifics.phase_count,
    specifics.phases,
    specifics.stages
  )

  const levelKey = getLevelKey([levelText, categoryData.target_audience, o.tags])

  const hasOwn = (key: string) => Object.prototype.hasOwnProperty.call(o ?? {}, key)
  const detailLoaded = Boolean(
    hasOwn('description') ||
    hasOwn('timeline') ||
    hasOwn('category_data') ||
    hasOwn('official_site_url')
  )

  return {
    id: o.id,
    slug: o.slug ?? null,
    title: o.title,
    excerpt: o.excerpt ?? o.description?.slice(0, 120) ?? '',
    description: o.description ?? '',
    category: o.category ?? 'OLYMPIAD',
    cover_url: o.cover_url ?? null,
    official_site_url: o.official_site_url ?? null,
    location: o.location ?? 'Online',
    is_free: !!o.is_free,
    next_deadline: displayDeadlineRaw,
    next_timeline_event: nextTimelineEvent,
    deadline,
    deadlineActionLabel,
    registration_info: registrationInfo,
    registration_status: registrationInfo.status,
    registrationStatusLabel,
    has_registration_info: registrationInfo.hasAnyRegistrationEvent,
    registration_is_open: registrationInfo.isOpen,
    registration_opens_soon: registrationInfo.opensSoon,
    registration_deadline: registrationInfo.deadlineEvent?.date ?? null,
    registration_start: registrationInfo.startEvent?.date ?? null,
    timeline,
    tags: normalizeTags(o.tags),
    category_data: categoryData,
    human_verified: !!o.human_verified,
    approved: !!o.approved,
    priority,
    priorityMeta: PRIORITY_LABEL[priority],
    created_at: o.created_at,
    updated_at: o.updated_at,
    detail_loaded: detailLoaded,
    subject_key: subjectKey,
    subject_meta: subjectMeta,
    level_text: levelText,
    level_key: levelKey,
    difficulty_text: difficultyText,
    exam_format_text: examFormatText,
    phases_text: phasesText,
  }
}

const olympiads = ref<any[]>([])
const selectedItem = ref<any | null>(null)
const detailLoadingSlug = ref<string | null>(null)

const loading = ref(true)
const loadingMore = ref(false)
const error = ref<string | null>(null)
const totalCount = ref(0)
const currentPage = ref(1)
const search = ref('')
const activeSubject = ref('')
const levelFilter = ref('')
const freeOnly = ref(false)
const onlineOnly = ref(false)
const quickFilter = ref<QuickFilter>('')
const verificationFilter = ref<'all' | 'verified' | 'pending'>('all')
const sideFiltersOpen = ref(false)
const sideFiltersRef = ref<HTMLElement | null>(null)
const pendingOpenSlug = ref<string | null>(null)
const filterWatchPaused = ref(false)

const currentUser = ref<any | null>(null)

let olympiadRequestSeq = 0

const isAdmin = computed(() => !!(currentUser.value?.is_superuser || currentUser.value?.is_manager))

const isSelectedItemLoadingDetail = computed(() => {
  const slug = selectedItem.value?.slug
  return !!slug && detailLoadingSlug.value === slug
})

function buildOlympiadParams() {
  const params: Record<string, any> = {
    page: currentPage.value,
    limit: PAGE_SIZE,
    category: 'OLYMPIAD',
  }

  const cleanSearch = search.value.trim()
  if (cleanSearch) params.search = cleanSearch

  if (freeOnly.value) params.is_free = true
  if (onlineOnly.value) params.location = 'Online'

  if (isAdmin.value && verificationFilter.value !== 'all') {
    params.human_verified = verificationFilter.value === 'verified'
  }

  return params
}

async function fetchCurrentUser() {
  try {
    const res = await get('/users/me')
    currentUser.value = res.data
  } catch {
    currentUser.value = null
  }
}

async function fetchOlympiads(reset = true) {
  const requestSeq = ++olympiadRequestSeq

  if (reset) {
    currentPage.value = 1
    loading.value = true
  } else {
    loadingMore.value = true
  }

  error.value = null

  try {
    const endpoint = isAdmin.value
      ? '/opportunity/admin/cards'
      : '/opportunity/cards'

    const res = await get(endpoint, { params: buildOlympiadParams() })

    if (requestSeq !== olympiadRequestSeq) return

    const data = res.data?.data ?? []
    const count = res.data?.count ?? 0
    const normalized = data.map(normalize).filter((item: any) => item.category === 'OLYMPIAD')

    if (reset) {
      olympiads.value = normalized
      totalCount.value = count
    } else {
      const seen = new Set(olympiads.value.map(item => item.id))
      olympiads.value.push(...normalized.filter((item: any) => !seen.has(item.id)))
    }

    if (pendingOpenSlug.value) {
      await openOlympiadBySlug(pendingOpenSlug.value)
    }
  } catch (e: any) {
    if (requestSeq !== olympiadRequestSeq) return
    error.value = e?.response?.data?.detail || e?.message || 'Erro ao carregar olimpíadas.'
  } finally {
    if (requestSeq === olympiadRequestSeq) {
      loading.value = false
      loadingMore.value = false
    }
  }
}

async function loadMore() {
  if (!hasMore.value || loadingMore.value) return
  currentPage.value++
  await fetchOlympiads(false)
}

function upsertOlympiad(item: any) {
  const normalized = normalize(item)
  const idx = olympiads.value.findIndex(existing => existing.id === normalized.id)

  if (idx >= 0) {
    olympiads.value.splice(idx, 1, normalized)
  } else {
    olympiads.value = [normalized, ...olympiads.value]
  }

  return normalized
}

async function selectOlympiad(item: any) {
  if (!item) return

  selectedItem.value = item

  if (!item.slug || item.detail_loaded) return

  try {
    detailLoadingSlug.value = item.slug

    const res = await get(`/opportunity/slug/${encodeURIComponent(item.slug)}`)
    const full = upsertOlympiad(res.data)

    if (selectedItem.value?.id === full.id) {
      selectedItem.value = full
    }
  } catch (e) {
    console.warn('Could not fetch full olympiad:', item.slug, e)
  } finally {
    if (detailLoadingSlug.value === item.slug) {
      detailLoadingSlug.value = null
    }
  }
}

async function openOlympiadBySlug(slug: string | null) {
  const cleanSlug = String(slug || '').trim()
  if (!cleanSlug) return

  const local = olympiads.value.find(item => item.slug === cleanSlug)

  if (local) {
    pendingOpenSlug.value = null
    await selectOlympiad(local)
    return
  }

  try {
    const res = await get(`/opportunity/slug/${encodeURIComponent(cleanSlug)}`)
    const item = upsertOlympiad(res.data)

    selectedItem.value = item
    pendingOpenSlug.value = null
  } catch (e) {
    console.warn('Could not open olympiad from slug:', cleanSlug, e)
  }
}

async function runWithPausedFilterWatch(fn: () => void) {
  filterWatchPaused.value = true
  fn()
  await nextTick()
  filterWatchPaused.value = false
  await fetchOlympiads(true)
}

async function clearFilters() {
  await runWithPausedFilterWatch(() => {
    search.value = ''
    activeSubject.value = ''
    levelFilter.value = ''
    freeOnly.value = false
    onlineOnly.value = false
    quickFilter.value = ''
    verificationFilter.value = 'all'
    sideFiltersOpen.value = false
  })
}

async function clearSideFilters() {
  await runWithPausedFilterWatch(() => {
    onlineOnly.value = false
    freeOnly.value = false
    quickFilter.value = ''
    levelFilter.value = ''
    verificationFilter.value = 'all'
  })
}

function handleAddOlympiad() {
  navigateTo({
    path: '/new-opportunity',
    query: { category: 'OLYMPIAD' },
  })
}

function handleGenericOpportunities() {
  navigateTo('/oportunidades')
}

function handleEditOlympiad(item: any) {
  const id = Number(item?.id)

  if (!Number.isInteger(id) || id <= 0) {
    console.warn('Olympiad without valid id:', item)
    return
  }

  navigateTo(`/oportunidades/edit/${id}`)
}

function setSubjectFilter(subject: string) {
  activeSubject.value = activeSubject.value === subject ? '' : subject
}

function setDeadlineFilter(value: QuickFilter) {
  quickFilter.value = value
}

function setVerificationFilter(value: 'all' | 'verified' | 'pending') {
  verificationFilter.value = value
}

function closeSideFiltersOnOutside(event: MouseEvent) {
  if (!sideFiltersOpen.value) return

  const target = event.target as Node | null
  if (sideFiltersRef.value && target && !sideFiltersRef.value.contains(target)) {
    sideFiltersOpen.value = false
  }
}

function itemMatchesQuickFilter(item: any) {
  if (!quickFilter.value) return true

  if (quickFilter.value === 'open') {
    return item.registration_is_open === true
  }

  if (quickFilter.value === 'urgent') {
    return item.registration_is_open === true &&
      item.registration_info?.daysUntilDeadline !== null &&
      item.registration_info?.daysUntilDeadline >= 0 &&
      item.registration_info?.daysUntilDeadline <= 7
  }

  if (quickFilter.value === 'opensSoon') {
    return item.registration_opens_soon === true
  }

  if (quickFilter.value === 'noRegistration') {
    return item.registration_is_open !== true && item.registration_opens_soon !== true
  }

  return true
}

function itemMatchesLevel(item: any) {
  if (!levelFilter.value) return true
  if (!item.level_key) return false

  if (levelFilter.value === 'fundamental') {
    return item.level_key === 'fundamental' || item.level_key === 'ambos'
  }

  if (levelFilter.value === 'medio') {
    return item.level_key === 'medio' || item.level_key === 'ambos'
  }

  return item.level_key === levelFilter.value
}

function prioritySort(items: any[]) {
  return [...items].sort((a, b) => {
    const byPriority = (b.priority ?? 0) - (a.priority ?? 0)
    if (byPriority !== 0) return byPriority

    const aDeadline = parseLocalDate(a.next_deadline)?.getTime() ?? Number.POSITIVE_INFINITY
    const bDeadline = parseLocalDate(b.next_deadline)?.getTime() ?? Number.POSITIVE_INFINITY
    if (aDeadline !== bDeadline) return aDeadline - bDeadline

    return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  })
}

const visibleOlympiads = computed(() => {
  return isAdmin.value
    ? olympiads.value.filter(item => {
        if (verificationFilter.value === 'pending') return item.human_verified !== true
        if (verificationFilter.value === 'verified') return item.human_verified === true
        return true
      })
    : olympiads.value.filter(item => item.human_verified === true)
})

const filtered = computed(() => {
  return visibleOlympiads.value
    .filter(item => !activeSubject.value || item.subject_key === activeSubject.value)
    .filter(itemMatchesLevel)
    .filter(itemMatchesQuickFilter)
})

const subjectCounts = computed(() => {
  const counts: Record<string, number> = {}

  for (const item of visibleOlympiads.value) {
    counts[item.subject_key] = (counts[item.subject_key] ?? 0) + 1
  }

  return counts
})

const activeFilters = computed(
  () => (search.value ? 1 : 0)
    + (activeSubject.value ? 1 : 0)
    + (levelFilter.value ? 1 : 0)
    + (freeOnly.value ? 1 : 0)
    + (onlineOnly.value ? 1 : 0)
    + (quickFilter.value ? 1 : 0)
    + (isAdmin.value && verificationFilter.value !== 'all' ? 1 : 0)
)

const filtersActive = computed(() => activeFilters.value > 0)

const sideFiltersCount = computed(() => {
  return (quickFilter.value ? 1 : 0)
    + (levelFilter.value ? 1 : 0)
    + (onlineOnly.value ? 1 : 0)
    + (freeOnly.value ? 1 : 0)
    + (isAdmin.value && verificationFilter.value !== 'all' ? 1 : 0)
})

const hasClientOnlyFilter = computed(() =>
  !!quickFilter.value ||
  !!activeSubject.value ||
  !!levelFilter.value
)

const displayCount = computed(() => {
  return hasClientOnlyFilter.value ? filtered.value.length : totalCount.value
})

const hasMore = computed(() => {
  return !hasClientOnlyFilter.value && olympiads.value.length < totalCount.value
})

const spotlightItems = computed(() => {
  if (filtersActive.value) return []
  return prioritySort(filtered.value.filter(item => item.priority >= 4)).slice(0, 6)
})

const sectionSourceItems = computed(() => {
  const spotlightIds = new Set(spotlightItems.value.map(item => item.id))

  return prioritySort(
    filtered.value.filter(item => !spotlightIds.has(item.id))
  )
})

const subjectSections = computed(() => {
  const grouped: Record<string, any[]> = {}

  for (const item of sectionSourceItems.value) {
    const key = item.subject_key || 'other'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(item)
  }

  return SUBJECT_ORDER
    .map(key => ({
      key,
      meta: SUBJECT_META[key] ?? SUBJECT_META.other,
      items: grouped[key] ?? [],
    }))
    .filter(section => section.items.length > 0)
})

const debouncedFetchOlympiads = debounce(() => {
  if (!filterWatchPaused.value) fetchOlympiads(true)
}, 350)

watch(search, () => {
  if (!filterWatchPaused.value) debouncedFetchOlympiads()
})

watch(
  [freeOnly, onlineOnly, verificationFilter],
  () => {
    if (!filterWatchPaused.value) fetchOlympiads(true)
  },
  { deep: true }
)

watch(isAdmin, (value) => {
  if (!value && verificationFilter.value !== 'all') {
    verificationFilter.value = 'all'
  }
})

watch(selectedItem, (val) => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = val ? 'hidden' : ''
  }
})

onMounted(async () => {
  document.addEventListener('click', closeSideFiltersOnOutside)

  const querySubject = typeof route.query.subject === 'string'
    ? route.query.subject
    : ''

  const queryOpen = typeof route.query.open === 'string'
    ? route.query.open
    : ''

  if (querySubject && SUBJECT_META[querySubject]) {
    activeSubject.value = querySubject
  }

  if (queryOpen) {
    pendingOpenSlug.value = queryOpen
  }

  await Promise.allSettled([
    fetchCurrentUser(),
    fetchOlympiads(true),
  ])

  if (isAdmin.value) {
    await fetchOlympiads(true)
  }
})

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }

  document.removeEventListener('click', closeSideFiltersOnOutside)
})
</script>

<template>
  <div class="olympiads-page">
    <section class="olympiads-hero">
      <div class="olympiads-hero__noise" aria-hidden="true"></div>

      <div class="olympiads-hero__inner">
        <div class="olympiads-hero__top">
          <button type="button" class="olympiads-back-link" @click="handleGenericOpportunities">
            ← Ver oportunidades gerais
          </button>

          <button type="button" class="olympiads-add-link" @click="handleAddOlympiad">
            + Sugerir olimpíada
          </button>
        </div>

        <div class="olympiads-hero__eyebrow">
          <span class="olympiads-hero__dot"></span>
          Olimpíadas acadêmicas
        </div>

        <h1 class="olympiads-hero__title">
          Explore olimpíadas por matéria
        </h1>

        <p class="olympiads-hero__sub">
          Competições acadêmicas separadas por área, com foco em prazos, fases, nível escolar e formato de prova.
        </p>

        <div class="olympiads-search">
          <svg class="olympiads-search__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>

          <input
            v-model="search"
            type="search"
            placeholder="Buscar por nome, matéria, conteúdo, tags…"
            class="olympiads-search__input"
          />

          <button v-if="search" type="button" @click="search = ''" class="olympiads-search__clear" aria-label="Limpar">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </section>

    <div class="olympiads-body">
      <div class="olympiads-filters">
        <div class="olympiads-filters__inner">
          <div class="olympiads-subject-pills" aria-label="Filtros de matéria">
            <button
              type="button"
              :class="['olympiads-pill', !activeSubject && 'olympiads-pill--active']"
              @click="activeSubject = ''"
            >
              Todas
              <small>{{ visibleOlympiads.length }}</small>
            </button>

            <button
              v-for="key in SUBJECT_ORDER"
              :key="key"
              v-show="(subjectCounts[key] ?? 0) > 0 || activeSubject === key"
              type="button"
              :class="['olympiads-pill', activeSubject === key && 'olympiads-pill--active']"
              :style="activeSubject === key ? { '--pill-color': SUBJECT_META[key].color } : {}"
              @click="setSubjectFilter(key)"
            >
              <span>{{ SUBJECT_META[key].icon }}</span>
              {{ SUBJECT_META[key].label }}
              <small>{{ subjectCounts[key] ?? 0 }}</small>
            </button>
          </div>

          <div class="olympiads-filters__right" ref="sideFiltersRef" @click.stop>
            <button
              type="button"
              class="olympiads-side-filter-btn"
              :class="{ 'olympiads-side-filter-btn--active': sideFiltersOpen || sideFiltersCount > 0 }"
              @click.stop="sideFiltersOpen = !sideFiltersOpen"
            >
              Filtros
              <span v-if="sideFiltersCount > 0">{{ sideFiltersCount }}</span>
            </button>

            <div v-if="sideFiltersOpen" class="olympiads-side-filter-panel" @click.stop>
              <div class="olympiads-side-filter-section">
                <span class="olympiads-side-filter-title">Prazo</span>

                <button
                  type="button"
                  class="olympiads-side-option"
                  :class="{ 'olympiads-side-option--active': !quickFilter }"
                  @click="setDeadlineFilter('')"
                >
                  Qualquer prazo
                </button>

                <button
                  type="button"
                  class="olympiads-side-option"
                  :class="{ 'olympiads-side-option--active': quickFilter === 'open' }"
                  @click="setDeadlineFilter('open')"
                >
                  Inscrições abertas
                </button>

                <button
                  type="button"
                  class="olympiads-side-option"
                  :class="{ 'olympiads-side-option--active': quickFilter === 'urgent' }"
                  @click="setDeadlineFilter('urgent')"
                >
                  Fecham em 7 dias
                </button>

                <button
                  type="button"
                  class="olympiads-side-option"
                  :class="{ 'olympiads-side-option--active': quickFilter === 'opensSoon' }"
                  @click="setDeadlineFilter('opensSoon')"
                >
                  Inscrições em breve
                </button>

                <button
                  type="button"
                  class="olympiads-side-option"
                  :class="{ 'olympiads-side-option--active': quickFilter === 'noRegistration' }"
                  @click="setDeadlineFilter('noRegistration')"
                >
                  Sem inscrição ativa
                </button>
              </div>

              <div class="olympiads-side-filter-section">
                <span class="olympiads-side-filter-title">Nível</span>

                <select v-model="levelFilter" class="olympiads-select">
                  <option v-for="option in LEVEL_OPTIONS" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>

              <div v-if="isAdmin" class="olympiads-side-filter-section">
                <span class="olympiads-side-filter-title">Revisão</span>

                <button
                  type="button"
                  class="olympiads-side-option"
                  :class="{ 'olympiads-side-option--active': verificationFilter === 'all' }"
                  @click="setVerificationFilter('all')"
                >
                  Todas
                </button>

                <button
                  type="button"
                  class="olympiads-side-option"
                  :class="{ 'olympiads-side-option--active': verificationFilter === 'pending' }"
                  @click="setVerificationFilter('pending')"
                >
                  Pendentes
                </button>

                <button
                  type="button"
                  class="olympiads-side-option"
                  :class="{ 'olympiads-side-option--active': verificationFilter === 'verified' }"
                  @click="setVerificationFilter('verified')"
                >
                  Verificadas
                </button>
              </div>

              <div class="olympiads-side-filter-section">
                <span class="olympiads-side-filter-title">Preferências</span>

                <label class="olympiads-side-toggle">
                  <input v-model="onlineOnly" type="checkbox" />
                  <span>Online</span>
                </label>

                <label class="olympiads-side-toggle">
                  <input v-model="freeOnly" type="checkbox" />
                  <span>Gratuita</span>
                </label>
              </div>

              <button
                v-if="sideFiltersCount > 0"
                type="button"
                class="olympiads-side-clear"
                @click="clearSideFilters"
              >
                Limpar filtros laterais
              </button>
            </div>

            <svg v-if="loading" class="olympiads-spinner" fill="none" viewBox="0 0 24 24">
              <circle class="olympiads-spinner__track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="olympiads-spinner__fill" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>

            <span class="olympiads-count">
              {{ displayCount.toLocaleString('pt-BR') }} olimpíada{{ displayCount !== 1 ? 's' : '' }}
            </span>

            <button v-if="activeFilters > 0" type="button" class="olympiads-clear" @click="clearFilters">
              Limpar
            </button>
          </div>
        </div>
      </div>

      <main class="olympiads-main">
        <div v-if="error && !loading" class="olympiads-state">
          <p class="olympiads-state__title">Erro ao carregar olimpíadas</p>
          <p class="olympiads-state__sub">{{ error }}</p>
          <button type="button" class="olympiads-btn olympiads-btn--primary" @click="fetchOlympiads(true)">
            Tentar novamente
          </button>
        </div>

        <div v-else-if="!loading && !error && filtered.length === 0" class="olympiads-state">
          <p class="olympiads-state__title">Nenhuma olimpíada encontrada</p>
          <p class="olympiads-state__sub">Tente outra matéria, remova filtros ou busque por outro termo.</p>
          <button type="button" class="olympiads-btn olympiads-btn--primary" @click="clearFilters">
            Limpar filtros
          </button>
        </div>

        <div v-else-if="loading && filtered.length === 0" class="olympiads-grid">
          <div v-for="i in 9" :key="i" class="olympiads-skeleton"></div>
        </div>

        <section v-if="spotlightItems.length > 0" class="olympiads-section">
          <div class="olympiads-section-header">
            <div class="olympiads-section-header__bar olympiads-section-header__bar--gold"></div>
            <h2>Olimpíadas essenciais</h2>
            <span>{{ spotlightItems.length }}</span>
          </div>

          <div class="olympiads-grid olympiads-grid--compact">
            <article
              v-for="item in spotlightItems"
              :key="item.id"
              class="olympiads-card olympiads-card--spotlight"
              role="button"
              tabindex="0"
              @click="selectOlympiad(item)"
              @keydown.enter="selectOlympiad(item)"
            >
              <div class="olympiads-card__cover">
                <img
                  v-if="item.cover_url"
                  :src="item.cover_url"
                  :alt="item.title"
                  class="olympiads-card__cover-img"
                  loading="lazy"
                  decoding="async"
                />

                <div
                  v-else
                  class="olympiads-card__cover-fallback"
                  :style="{ background: `linear-gradient(135deg, ${item.subject_meta.color}30, ${item.subject_meta.color}08)` }"
                >
                  <span>{{ item.subject_meta.icon }}</span>
                </div>

                <div class="olympiads-card__cover-overlay"></div>

                <span
                  v-if="item.next_deadline"
                  :class="[
                    'olympiads-cover-deadline',
                    item.deadline.urgent && 'olympiads-cover-deadline--urgent',
                    item.registration_status === 'open' && 'olympiads-cover-deadline--open',
                    item.registration_status === 'opens_soon' && 'olympiads-cover-deadline--soon',
                    item.registration_status === 'closed' && 'olympiads-cover-deadline--closed',
                  ]"
                >
                  {{ item.deadlineActionLabel }}
                </span>
              </div>

              <div class="olympiads-card__content">
                <div class="olympiads-card__top">
                  <span
                    class="olympiads-subject-badge"
                    :style="{ background: item.subject_meta.color + '16', color: item.subject_meta.color, borderColor: item.subject_meta.color + '35' }"
                  >
                    {{ item.subject_meta.icon }} {{ item.subject_meta.label }}
                  </span>

                  <button
                    v-if="isAdmin"
                    type="button"
                    class="olympiads-edit-btn"
                    @click.stop="handleEditOlympiad(item)"
                  >
                    Editar
                  </button>
                </div>

                <h3>{{ item.title }}</h3>
                <p>{{ item.excerpt }}</p>

                <div class="olympiads-card__bottom">
                  <span v-if="item.registration_status === 'open'" class="olympiads-registration-chip olympiads-registration-chip--open">Inscrições abertas</span>
                  <span v-else-if="item.registration_status === 'opens_soon'" class="olympiads-registration-chip olympiads-registration-chip--soon">Inscrições em breve</span>
                  <span v-else-if="item.has_registration_info" class="olympiads-muted-chip">Inscrições encerradas</span>
                  <span v-else class="olympiads-muted-chip">Sem inscrição cadastrada</span>
                  <span v-if="item.is_free" class="olympiads-free-chip">Gratuita</span>
                </div>

                <div class="olympiads-card__action">Ver detalhes →</div>
              </div>
            </article>
          </div>
        </section>

        <section
          v-for="section in subjectSections"
          :key="section.key"
          class="olympiads-section"
        >
          <div class="olympiads-section-header">
            <div class="olympiads-section-header__bar" :style="{ background: section.meta.color }"></div>
            <h2>
              <span>{{ section.meta.icon }}</span>
              {{ section.meta.label }}
            </h2>
            <span>{{ section.items.length }}</span>
          </div>

          <div class="olympiads-grid">
            <article
              v-for="item in section.items"
              :key="item.id"
              class="olympiads-card"
              role="button"
              tabindex="0"
              @click="selectOlympiad(item)"
              @keydown.enter="selectOlympiad(item)"
            >
              <div class="olympiads-card__cover">
                <img
                  v-if="item.cover_url"
                  :src="item.cover_url"
                  :alt="item.title"
                  class="olympiads-card__cover-img"
                  loading="lazy"
                  decoding="async"
                />

                <div
                  v-else
                  class="olympiads-card__cover-fallback"
                  :style="{ background: `linear-gradient(135deg, ${item.subject_meta.color}30, ${item.subject_meta.color}08)` }"
                >
                  <span>{{ item.subject_meta.icon }}</span>
                </div>

                <div class="olympiads-card__cover-overlay"></div>

                <span
                  v-if="item.next_deadline"
                  :class="[
                    'olympiads-cover-deadline',
                    item.deadline.urgent && 'olympiads-cover-deadline--urgent',
                    item.registration_status === 'open' && 'olympiads-cover-deadline--open',
                    item.registration_status === 'opens_soon' && 'olympiads-cover-deadline--soon',
                    item.registration_status === 'closed' && 'olympiads-cover-deadline--closed',
                  ]"
                >
                  {{ item.deadlineActionLabel }}
                </span>
              </div>

              <div class="olympiads-card__content">
                <div class="olympiads-card__top">
                  <span
                    class="olympiads-subject-badge"
                    :style="{ background: item.subject_meta.color + '16', color: item.subject_meta.color, borderColor: item.subject_meta.color + '35' }"
                  >
                    {{ item.subject_meta.icon }} {{ item.subject_meta.label }}
                  </span>

                  <button
                    v-if="isAdmin"
                    type="button"
                    class="olympiads-edit-btn"
                    @click.stop="handleEditOlympiad(item)"
                  >
                    Editar
                  </button>
                </div>

                <h3>{{ item.title }}</h3>
                <p>{{ item.excerpt }}</p>

                <div class="olympiads-card__bottom">
                  <span v-if="item.registration_status === 'open'" class="olympiads-registration-chip olympiads-registration-chip--open">Inscrições abertas</span>
                  <span v-else-if="item.registration_status === 'opens_soon'" class="olympiads-registration-chip olympiads-registration-chip--soon">Inscrições em breve</span>
                  <span v-else-if="item.has_registration_info" class="olympiads-muted-chip">Inscrições encerradas</span>
                  <span v-else class="olympiads-muted-chip">Sem inscrição cadastrada</span>
                  <span v-if="item.is_free" class="olympiads-free-chip">Gratuita</span>
                </div>

                <div class="olympiads-card__action">Ver detalhes →</div>
              </div>
            </article>
          </div>
        </section>

        <div v-if="hasMore" class="olympiads-load-more">
          <button
            type="button"
            class="olympiads-btn olympiads-btn--ghost"
            :disabled="loadingMore"
            @click="loadMore"
          >
            {{ loadingMore ? 'Carregando…' : `Carregar mais (${totalCount - olympiads.length} restantes)` }}
          </button>
        </div>
      </main>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="selectedItem" class="olympiads-modal-backdrop" @click.self="selectedItem = null">
          <div class="olympiads-modal" role="dialog" :aria-label="selectedItem.title">
            <div class="olympiads-modal__cover">
              <img
                v-if="selectedItem.cover_url"
                :src="selectedItem.cover_url"
                :alt="selectedItem.title"
                class="olympiads-modal__cover-img"
              />

              <div
                v-else
                class="olympiads-modal__cover-fallback"
                :style="{ background: `linear-gradient(135deg, ${selectedItem.subject_meta.color}33, ${selectedItem.subject_meta.color}11)` }"
              >
                <span>{{ selectedItem.subject_meta.icon }}</span>
              </div>

              <div class="olympiads-modal__cover-overlay"></div>

              <button
                type="button"
                class="olympiads-modal__close"
                aria-label="Fechar"
                @click="selectedItem = null"
              >
                ×
              </button>

              <button
                v-if="isAdmin"
                type="button"
                class="olympiads-modal__cover-edit"
                @click="handleEditOlympiad(selectedItem)"
              >
                Editar
              </button>
            </div>

            <div class="olympiads-modal__body">
              <div class="olympiads-modal__header">
                <div class="olympiads-modal__badges">
                  <span
                    class="olympiads-subject-badge"
                    :style="{ background: selectedItem.subject_meta.color + '16', color: selectedItem.subject_meta.color, borderColor: selectedItem.subject_meta.color + '35' }"
                  >
                    {{ selectedItem.subject_meta.icon }} {{ selectedItem.subject_meta.label }}
                  </span>

                  <span v-if="selectedItem.human_verified" class="olympiads-status-chip olympiads-status-chip--verified">
                    Verificada
                  </span>

                  <span v-else-if="isAdmin" class="olympiads-status-chip olympiads-status-chip--pending">
                    Pendente
                  </span>

                  <span v-if="selectedItem.is_free" class="olympiads-free-chip">
                    Gratuita
                  </span>


                  <span
                    v-if="selectedItem.registration_status === 'open'"
                    class="olympiads-registration-chip olympiads-registration-chip--open"
                  >
                    Inscrições abertas
                  </span>

                  <span
                    v-else-if="selectedItem.registration_status === 'opens_soon'"
                    class="olympiads-registration-chip olympiads-registration-chip--soon"
                  >
                    Inscrições em breve
                  </span>

                  <span
                    v-else-if="selectedItem.has_registration_info"
                    class="olympiads-muted-chip"
                  >
                    Inscrições encerradas
                  </span>
                </div>

                <h2>{{ selectedItem.title }}</h2>

                <p v-if="selectedItem.description || selectedItem.excerpt">
                  {{ selectedItem.description || selectedItem.excerpt }}
                </p>

                <div class="olympiads-modal__quick">
                  <span
                    v-if="selectedItem.next_deadline"
                    :class="[
                      'olympiads-deadline',
                      selectedItem.deadline.urgent && 'olympiads-deadline--urgent',
                      selectedItem.registration_status === 'open' && 'olympiads-deadline--open',
                      selectedItem.registration_status === 'opens_soon' && 'olympiads-deadline--soon',
                      selectedItem.registration_status === 'closed' && 'olympiads-deadline--closed',
                    ]"
                  >
                    {{ selectedItem.deadlineActionLabel }}
                  </span>

                  <span v-if="selectedItem.location" class="olympiads-muted-chip">
                    {{ selectedItem.location }}
                  </span>
                </div>
              </div>

              <div v-if="isSelectedItemLoadingDetail" class="olympiads-modal__loading">
                Carregando detalhes completos…
              </div>

              <section
                v-if="selectedItem.level_text || selectedItem.exam_format_text || selectedItem.phases_text || selectedItem.difficulty_text"
                class="olympiads-modal-section"
              >
                <h3>Resumo rápido</h3>

                <div class="olympiads-vertical-list">
                  <div v-if="selectedItem.level_text" class="olympiads-vertical-item olympiads-vertical-item--blue">
                    <span>Nível</span>
                    <strong>{{ selectedItem.level_text }}</strong>
                  </div>

                  <div v-if="selectedItem.exam_format_text" class="olympiads-vertical-item olympiads-vertical-item--emerald">
                    <span>Formato</span>
                    <strong>{{ selectedItem.exam_format_text }}</strong>
                  </div>

                  <div v-if="selectedItem.phases_text" class="olympiads-vertical-item olympiads-vertical-item--amber">
                    <span>Fases</span>
                    <strong>{{ selectedItem.phases_text }}</strong>
                  </div>

                  <div v-if="selectedItem.difficulty_text" class="olympiads-vertical-item olympiads-vertical-item--zinc">
                    <span>Dificuldade</span>
                    <strong>{{ selectedItem.difficulty_text }}</strong>
                  </div>
                </div>
              </section>

              <section v-if="selectedItem.timeline.length > 0" class="olympiads-modal-section">
                <h3>Cronograma</h3>

                <div class="olympiads-timeline">
                  <div v-for="(event, idx) in selectedItem.timeline" :key="idx" class="olympiads-timeline__item">
                    <div
                      class="olympiads-timeline__dot"
                      :class="[
                        event.show_on_calendar && 'olympiads-timeline__dot--active',
                        `olympiads-timeline__dot--${getTimelineKindTone(event)}`,
                      ]"
                    ></div>

                    <div>
                      <div class="olympiads-timeline__head">
                        <strong>{{ event.label || getTimelineLabel(event) }}</strong>
                        <span class="olympiads-timeline__kind" :class="`olympiads-timeline__kind--${getTimelineKindTone(event)}`">
                          {{ getTimelineKindLabel(event) }}
                        </span>
                      </div>
                      <span v-if="event.date" class="olympiads-timeline__date">{{ fmtDate(event.date) }}</span>
                      <p v-if="event.details">{{ event.details }}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section v-if="getOlympiadInfoCards(selectedItem).length > 0" class="olympiads-modal-section">
                <h3>Informações específicas</h3>

                <div class="olympiads-vertical-list">
                  <div
                    v-for="card in getOlympiadInfoCards(selectedItem)"
                    :key="card.title"
                    :class="[
                      'olympiads-vertical-item',
                      `olympiads-vertical-item--${getInfoTone(card.title)}`
                    ]"
                  >
                    <span>{{ getInfoIcon(card.title) }} {{ card.title }}</span>

                    <ul v-if="getCardLines(card).length > 1">
                      <li v-for="line in getCardLines(card)" :key="line">
                        {{ line }}
                      </li>
                    </ul>

                    <strong v-else>{{ card.label }}</strong>
                  </div>
                </div>
              </section>

              <section v-if="getReferenceLinks(selectedItem).length > 0" class="olympiads-modal-section">
                <h3>Recursos</h3>

                <div class="olympiads-vertical-list">
                  <a
                    v-for="ref in getReferenceLinks(selectedItem)"
                    :key="ref.url"
                    :href="ref.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    :class="[
                      'olympiads-vertical-item',
                      'olympiads-vertical-item--link',
                      `olympiads-vertical-item--${getResourceTone(ref)}`
                    ]"
                  >
                    <span>{{ ref.title || 'Recurso' }}</span>
                    <strong>{{ ref.description || ref.url }}</strong>
                  </a>
                </div>
              </section>

              <div class="olympiads-modal__actions">
                <a
                  v-if="selectedItem.official_site_url"
                  :href="selectedItem.official_site_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="olympiads-modal__primary"
                >
                  Acessar site oficial
                </a>

                <button type="button" class="olympiads-modal__secondary" @click="selectedItem = null">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.olympiads-page {
  min-height: 100vh;
  background: #fafaf9;
  color: #1c1917;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.olympiads-hero {
  position: relative;
  overflow: hidden;
  padding: 26px 18px 38px;
  background: linear-gradient(135deg, #052e2b 0%, #064e3b 50%, #0f766e 100%);
  color: white;
}

.olympiads-hero__noise {
  position: absolute;
  inset: 0;
  opacity: .07;
  background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0);
  background-size: 28px 28px;
}

.olympiads-hero__inner {
  position: relative;
  z-index: 1;
  max-width: 1040px;
  margin: 0 auto;
}

.olympiads-hero__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 28px;
}

.olympiads-back-link,
.olympiads-add-link {
  border: 1px solid rgba(255, 255, 255, .22);
  background: rgba(255, 255, 255, .10);
  color: white;
  border-radius: 999px;
  padding: 9px 13px;
  font-weight: 900;
  font-size: 13px;
  cursor: pointer;
}

.olympiads-add-link {
  background: white;
  color: #065f46;
}

.olympiads-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 7px 11px;
  border: 1px solid rgba(255, 255, 255, .18);
  border-radius: 999px;
  background: rgba(255, 255, 255, .10);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .08em;
  text-transform: uppercase;
  margin-bottom: 15px;
}

.olympiads-hero__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #86efac;
  box-shadow: 0 0 0 6px rgba(134, 239, 172, .16);
}

.olympiads-hero__title {
  max-width: 720px;
  margin: 0;
  font-size: clamp(2.1rem, 4.2vw, 4rem);
  line-height: 1;
  letter-spacing: -.055em;
  font-weight: 850;
}

.olympiads-hero__sub {
  max-width: 640px;
  margin: 14px 0 22px;
  color: rgba(255, 255, 255, .78);
  font-size: 1rem;
  line-height: 1.55;
}

.olympiads-search {
  position: relative;
  max-width: 720px;
}

.olympiads-search__icon {
  position: absolute;
  left: 17px;
  top: 50%;
  transform: translateY(-50%);
  width: 19px;
  height: 19px;
  color: #059669;
  pointer-events: none;
}

.olympiads-search__input {
  width: 100%;
  border: none;
  border-radius: 18px;
  padding: 15px 52px 15px 48px;
  font: inherit;
  font-size: 15px;
  outline: none;
  color: #1c1917;
  background: rgba(255, 255, 255, .96);
  box-shadow: 0 16px 48px rgba(0, 0, 0, .18);
}

.olympiads-search__clear {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 31px;
  height: 31px;
  border: none;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #f5f5f4;
  color: #57534e;
  cursor: pointer;
}

.olympiads-search__clear svg {
  width: 17px;
  height: 17px;
}

.olympiads-filters {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid rgba(231, 229, 228, .95);
  background: rgba(250, 250, 249, .88);
  backdrop-filter: blur(18px);
}

.olympiads-filters__inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 13px 18px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.olympiads-subject-pills {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 2px;
}

.olympiads-subject-pills::-webkit-scrollbar {
  display: none;
}

.olympiads-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid #e7e5e4;
  border-radius: 999px;
  padding: 8px 12px;
  background: white;
  color: #57534e;
  font-weight: 900;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
}

.olympiads-pill small {
  color: inherit;
  opacity: .8;
}

.olympiads-pill--active {
  color: white;
  border-color: transparent;
  background: var(--pill-color, #059669);
}

.olympiads-filters__right {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.olympiads-side-filter-btn {
  border: 1px solid #d6d3d1;
  background: white;
  color: #292524;
  border-radius: 999px;
  padding: 8px 12px;
  font-weight: 900;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.olympiads-side-filter-btn span {
  display: inline-grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: #059669;
  color: white;
  font-size: 12px;
}

.olympiads-side-filter-btn--active {
  border-color: #10b981;
  background: #ecfdf5;
  color: #065f46;
}

.olympiads-side-filter-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  width: min(320px, calc(100vw - 28px));
  border: 1px solid #e7e5e4;
  border-radius: 20px;
  padding: 14px;
  background: white;
  box-shadow: 0 24px 80px rgba(0, 0, 0, .14);
  z-index: 30;
}

.olympiads-side-filter-section {
  display: grid;
  gap: 8px;
  padding: 10px 0;
}

.olympiads-side-filter-section + .olympiads-side-filter-section {
  border-top: 1px solid #f0ece8;
}

.olympiads-side-filter-title {
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: #78716c;
}

.olympiads-side-option,
.olympiads-select {
  width: 100%;
  border: 1px solid #e7e5e4;
  background: #fafaf9;
  color: #44403c;
  border-radius: 12px;
  padding: 10px 11px;
  text-align: left;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.olympiads-side-option--active {
  border-color: #a7f3d0;
  background: #ecfdf5;
  color: #065f46;
}

.olympiads-side-toggle {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #44403c;
  font-weight: 800;
  cursor: pointer;
}

.olympiads-side-toggle input {
  accent-color: #059669;
}

.olympiads-side-clear {
  width: 100%;
  margin-top: 10px;
  border: none;
  border-radius: 12px;
  padding: 10px 12px;
  background: #f5f5f4;
  color: #44403c;
  font-weight: 900;
  cursor: pointer;
}

.olympiads-count {
  color: #78716c;
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
}

.olympiads-clear {
  border: none;
  background: transparent;
  color: #059669;
  font-weight: 900;
  cursor: pointer;
}

.olympiads-main {
  max-width: 1120px;
  margin: 0 auto;
  padding: 28px 18px 72px;
}

.olympiads-section {
  margin-top: 30px;
}

.olympiads-section:first-child {
  margin-top: 0;
}

.olympiads-section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 14px;
}

.olympiads-section-header__bar {
  width: 5px;
  height: 22px;
  border-radius: 999px;
  background: #10b981;
}

.olympiads-section-header__bar--gold {
  background: linear-gradient(180deg, #f59e0b, #facc15);
}

.olympiads-section-header h2 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  letter-spacing: -.035em;
}

.olympiads-section-header > span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 26px;
  padding: 0 8px;
  border-radius: 999px;
  background: #f5f5f4;
  color: #78716c;
  font-size: 12px;
  font-weight: 900;
}

.olympiads-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.olympiads-grid--compact {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.olympiads-card {
  overflow: hidden;
  border-radius: 18px;
  background: white;
  border: 1px solid #e7e5e4;
  cursor: pointer;
  transition: transform .15s ease, border-color .15s ease, box-shadow .15s ease;
}

.olympiads-card:hover {
  transform: translateY(-2px);
  border-color: #d6d3d1;
  box-shadow: 0 14px 42px rgba(0, 0, 0, .08);
}

.olympiads-card--spotlight {
  border-color: #fde68a;
  background: linear-gradient(180deg, #fffdf5, #ffffff);
}

.olympiads-card__cover {
  position: relative;
  height: 112px;
  overflow: hidden;
  background: #f5f5f4;
}

.olympiads-card__cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.olympiads-card__cover-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}

.olympiads-card__cover-fallback span {
  font-size: 2.4rem;
}

.olympiads-card__cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, .08), rgba(0, 0, 0, .42));
}

.olympiads-cover-deadline {
  position: absolute;
  left: 12px;
  bottom: 10px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 9px;
  background: rgba(255, 255, 255, .92);
  color: #065f46;
  font-size: 11px;
  font-weight: 950;
  backdrop-filter: blur(8px);
}

.olympiads-cover-deadline--urgent {
  color: #b91c1c;
}


.olympiads-cover-deadline--open {
  color: #065f46;
}

.olympiads-cover-deadline--soon {
  color: #1d4ed8;
}

.olympiads-cover-deadline--closed {
  color: #57534e;
}

.olympiads-card__content {
  padding: 15px;
}

.olympiads-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 11px;
}

.olympiads-card h3 {
  margin: 0 0 7px;
  font-size: 16px;
  line-height: 1.25;
  letter-spacing: -.025em;
}

.olympiads-card p {
  margin: 0;
  color: #78716c;
  font-size: 13px;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 38px;
}

.olympiads-card__bottom {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 12px;
}

.olympiads-card__action {
  margin-top: 12px;
  color: #059669;
  font-size: 13px;
  font-weight: 950;
}

.olympiads-subject-badge,
.olympiads-deadline,
.olympiads-registration-chip,
.olympiads-free-chip,
.olympiads-muted-chip,
.olympiads-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 999px;
  padding: 6px 9px;
  border: 1px solid #e7e5e4;
  font-size: 11px;
  font-weight: 950;
  line-height: 1;
}

.olympiads-deadline {
  background: #f8fafc;
  color: #334155;
  border-color: #e2e8f0;
}

.olympiads-deadline--urgent {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}


.olympiads-deadline--open,
.olympiads-registration-chip--open {
  background: #ecfdf5;
  color: #047857;
  border-color: #a7f3d0;
}

.olympiads-deadline--soon,
.olympiads-registration-chip--soon {
  background: #eff6ff;
  color: #2563eb;
  border-color: #bfdbfe;
}

.olympiads-deadline--closed {
  background: #f5f5f4;
  color: #78716c;
  border-color: #e7e5e4;
}

.olympiads-free-chip {
  background: #ecfdf5;
  color: #047857;
  border-color: #a7f3d0;
}

.olympiads-muted-chip {
  background: #f5f5f4;
  color: #78716c;
  border-color: #e7e5e4;
}

.olympiads-status-chip--verified {
  background: #ecfdf5;
  color: #047857;
  border-color: #a7f3d0;
}

.olympiads-status-chip--pending {
  background: #fff7ed;
  color: #c2410c;
  border-color: #fed7aa;
}

.olympiads-edit-btn {
  border: none;
  border-radius: 999px;
  padding: 6px 9px;
  background: #f5f5f4;
  color: #44403c;
  font-size: 11px;
  font-weight: 950;
  cursor: pointer;
}

.olympiads-state {
  max-width: 520px;
  margin: 80px auto;
  text-align: center;
}

.olympiads-state__title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 950;
  letter-spacing: -.03em;
}

.olympiads-state__sub {
  margin: 0 0 18px;
  color: #78716c;
  line-height: 1.55;
}

.olympiads-btn {
  border: none;
  border-radius: 14px;
  padding: 12px 16px;
  font-weight: 950;
  cursor: pointer;
}

.olympiads-btn--primary {
  background: #059669;
  color: white;
}

.olympiads-btn--ghost {
  background: white;
  color: #292524;
  border: 1px solid #e7e5e4;
}

.olympiads-load-more {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

.olympiads-skeleton {
  height: 280px;
  border-radius: 18px;
  background:
    linear-gradient(90deg, #f5f5f4 25%, #fff 37%, #f5f5f4 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

.olympiads-spinner {
  width: 22px;
  height: 22px;
  color: #059669;
  animation: spin 1s linear infinite;
}

.olympiads-spinner__track {
  opacity: .22;
}

.olympiads-spinner__fill {
  opacity: .86;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.olympiads-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, .58);
  backdrop-filter: blur(10px);
}

.olympiads-modal {
  width: min(820px, 100%);
  max-height: min(90vh, 900px);
  overflow: hidden;
  border-radius: 26px;
  background: white;
  box-shadow: 0 30px 120px rgba(0, 0, 0, .35);
  display: grid;
  grid-template-rows: 190px minmax(0, 1fr);
}

.olympiads-modal__cover {
  position: relative;
  overflow: hidden;
  background: #f5f5f4;
}

.olympiads-modal__cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.olympiads-modal__cover-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}

.olympiads-modal__cover-fallback span {
  font-size: 4rem;
}

.olympiads-modal__cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, .22), transparent 42%, rgba(0, 0, 0, .42));
}

.olympiads-modal__close,
.olympiads-modal__cover-edit {
  position: absolute;
  top: 14px;
  z-index: 2;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, .92);
  color: #292524;
  font-weight: 950;
  cursor: pointer;
  backdrop-filter: blur(8px);
}

.olympiads-modal__close {
  right: 14px;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  font-size: 23px;
  font-weight: 700;
}

.olympiads-modal__cover-edit {
  right: 60px;
  height: 38px;
  padding: 0 13px;
  font-size: 12px;
}

.olympiads-modal__body {
  overflow-y: auto;
  padding: 28px;
}

.olympiads-modal__header {
  max-width: 680px;
}

.olympiads-modal__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.olympiads-modal__header h2 {
  margin: 0 0 12px;
  font-size: clamp(1.6rem, 3vw, 2.4rem);
  line-height: 1.06;
  letter-spacing: -.045em;
}

.olympiads-modal__header p {
  margin: 0;
  color: #57534e;
  line-height: 1.65;
}

.olympiads-modal__quick {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.olympiads-modal__loading {
  margin-top: 20px;
  padding: 12px 14px;
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 850;
  font-size: 13px;
}

.olympiads-modal-section {
  margin-top: 24px;
  padding-left: 18px;
  border-left: 3px solid #d1fae5;
}

.olympiads-modal-section h3 {
  margin: 0 0 13px;
  font-size: 17px;
  letter-spacing: -.025em;
}

.olympiads-vertical-list {
  display: grid;
  gap: 10px;
}

.olympiads-vertical-item {
  display: block;
  border: 1px solid #e7e5e4;
  border-radius: 16px;
  padding: 13px 14px;
  background: #fafaf9;
  text-decoration: none;
  color: inherit;
}

.olympiads-vertical-item span {
  display: block;
  margin-bottom: 5px;
  color: #78716c;
  font-size: 12px;
  font-weight: 900;
}

.olympiads-vertical-item strong {
  display: block;
  color: #292524;
  font-size: 14px;
  line-height: 1.45;
}

.olympiads-vertical-item ul {
  margin: 0;
  padding-left: 18px;
  color: #44403c;
  line-height: 1.55;
  font-size: 14px;
}

.olympiads-vertical-item--blue {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.olympiads-vertical-item--blue span {
  color: #2563eb;
}

.olympiads-vertical-item--amber {
  background: #fffbeb;
  border-color: #fde68a;
}

.olympiads-vertical-item--amber span {
  color: #b45309;
}

.olympiads-vertical-item--emerald {
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.olympiads-vertical-item--emerald span {
  color: #047857;
}

.olympiads-vertical-item--zinc {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.olympiads-vertical-item--zinc span {
  color: #475569;
}

.olympiads-vertical-item--link {
  transition: transform .15s ease, border-color .15s ease;
}

.olympiads-vertical-item--link:hover {
  transform: translateY(-1px);
  border-color: #60a5fa;
}

.olympiads-timeline {
  display: grid;
  gap: 13px;
}

.olympiads-timeline__item {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 12px;
}

.olympiads-timeline__dot {
  width: 12px;
  height: 12px;
  margin-top: 4px;
  border-radius: 999px;
  background: #d6d3d1;
  box-shadow: 0 0 0 5px #f5f5f4;
}

.olympiads-timeline__dot--active {
  background: #10b981;
  box-shadow: 0 0 0 5px #d1fae5;
}

.olympiads-timeline__dot--amber {
  background: #f59e0b;
  box-shadow: 0 0 0 5px #fef3c7;
}

.olympiads-timeline__dot--blue {
  background: #2563eb;
  box-shadow: 0 0 0 5px #dbeafe;
}

.olympiads-timeline__dot--emerald {
  background: #10b981;
  box-shadow: 0 0 0 5px #d1fae5;
}

.olympiads-timeline__dot--zinc {
  background: #94a3b8;
  box-shadow: 0 0 0 5px #f1f5f9;
}

.olympiads-timeline__head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.olympiads-timeline strong {
  display: block;
  color: #292524;
}

.olympiads-timeline__date {
  display: block;
  color: #059669;
  font-size: 13px;
  font-weight: 900;
  margin-bottom: 4px;
}

.olympiads-timeline__kind {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 7px;
  font-size: 11px;
  font-weight: 950;
  border: 1px solid #e7e5e4;
  background: #f8fafc;
  color: #475569;
}

.olympiads-timeline__kind--emerald {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #047857;
}

.olympiads-timeline__kind--amber {
  background: #fffbeb;
  border-color: #fde68a;
  color: #b45309;
}

.olympiads-timeline__kind--blue {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #2563eb;
}

.olympiads-timeline__kind--zinc {
  background: #f8fafc;
  border-color: #e2e8f0;
  color: #475569;
}

.olympiads-timeline p {
  margin: 0;
  color: #78716c;
  line-height: 1.5;
}

.olympiads-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 26px;
}

.olympiads-modal__primary,
.olympiads-modal__secondary {
  border: none;
  border-radius: 14px;
  padding: 12px 16px;
  font-weight: 950;
  text-decoration: none;
  cursor: pointer;
}

.olympiads-modal__primary {
  background: #059669;
  color: white;
}

.olympiads-modal__secondary {
  background: #f5f5f4;
  color: #44403c;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity .18s ease;
}

.modal-enter-active .olympiads-modal,
.modal-leave-active .olympiads-modal {
  transition: transform .18s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .olympiads-modal,
.modal-leave-to .olympiads-modal {
  transform: translateY(12px) scale(.98);
}

@media (max-width: 980px) {
  .olympiads-grid,
  .olympiads-grid--compact {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .olympiads-hero {
    padding: 22px 14px 30px;
  }

  .olympiads-hero__top {
    flex-direction: column;
    align-items: stretch;
    margin-bottom: 22px;
  }

  .olympiads-back-link,
  .olympiads-add-link {
    width: 100%;
  }

  .olympiads-hero__title {
    font-size: clamp(2rem, 10vw, 3rem);
  }

  .olympiads-filters__inner {
    align-items: stretch;
    flex-direction: column;
  }

  .olympiads-filters__right {
    justify-content: space-between;
  }

  .olympiads-count {
    display: none;
  }

  .olympiads-grid,
  .olympiads-grid--compact {
    grid-template-columns: 1fr;
  }

  .olympiads-modal-backdrop {
    padding: 0;
    align-items: end;
  }

  .olympiads-modal {
    width: 100%;
    max-height: 94vh;
    border-radius: 24px 24px 0 0;
    grid-template-rows: 170px minmax(0, 1fr);
  }

  .olympiads-modal__body {
    padding: 22px;
  }

  .olympiads-modal-section {
    padding-left: 14px;
  }

  .olympiads-modal__actions {
    flex-direction: column;
  }

  .olympiads-modal__primary,
  .olympiads-modal__secondary {
    width: 100%;
    text-align: center;
  }
}
</style>