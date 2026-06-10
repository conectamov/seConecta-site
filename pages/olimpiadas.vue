  <script setup lang="ts">
  import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
  import OlympiadDetailsModal from '~/components/OlympiadDetailsModal.vue'

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


  const STRICT_OLYMPIAD_SUBJECT_VALUES: Record<string, string[]> = {
    math: ['Mathematics', 'Math', 'Matemática'],
    programming: ['Programming', 'Informatics', 'Computer Science', 'Programação', 'Informática', 'Computação'],
    physics: ['Physics', 'Física'],
    chemistry: ['Chemistry', 'Química'],
    biology: ['Biology', 'Biologia'],
    astronomy: ['Astronomy', 'Astronomia'],
    linguistics: ['Linguistics', 'Linguística'],
    history: ['History', 'História'],
    geography: ['Geography', 'Geografia'],
    science: ['Science', 'Ciências'],
    robotics: ['Robotics', 'Robótica'],
    writing: ['Writing', 'Essay', 'Literature', 'Humanities', 'Redação', 'Escrita', 'Literatura', 'Humanidades'],
    economics: ['Economics', 'Finance', 'Economia', 'Finanças'],
  }

  const OLYMPIAD_SUBJECT_VALUE_TO_KEY = Object.entries(STRICT_OLYMPIAD_SUBJECT_VALUES)
    .reduce((acc, [key, values]) => {
      for (const value of values) acc[normalizeFilterToken(value)] = key
      return acc
    }, {} as Record<string, string>)

  const OLYMPIAD_SUBJECT_CANONICAL_VALUE: Record<string, string> = {
    math: 'Mathematics',
    programming: 'Programming',
    physics: 'Physics',
    chemistry: 'Chemistry',
    biology: 'Biology',
    astronomy: 'Astronomy',
    linguistics: 'Linguistics',
    history: 'History',
    geography: 'Geography',
    science: 'Science',
    robotics: 'Robotics',
    writing: 'Writing',
    economics: 'Economics',
    other: 'Other',
  }

  const OLYMPIAD_TYPE_META: Record<string, { label: string; icon: string }> = {
    regional: { label: 'Regional', icon: '📍' },
    national: { label: 'Nacional', icon: '🇧🇷' },
    qualifier: { label: 'Pré-Seletiva', icon: '🎯' },
    international: { label: 'Internacional', icon: '🌎' },
    independent: { label: 'Independente', icon: '✨' },
  }

  const OLYMPIAD_TYPE_ORDER = ['regional', 'national', 'qualifier', 'international', 'independent']


  const LEVEL_OPTIONS = [
    { value: '', label: 'Todos os níveis' },
    { value: 'fundamental', label: 'Ensino fundamental' },
    { value: 'medio', label: 'Ensino médio' },
    { value: 'ambos', label: 'Fundamental e médio' },
    { value: 'internacional', label: 'Internacional' },
  ]

  const COMPETITIVENESS_FILTER_OPTIONS = [
    { value: '', label: 'Qualquer dificuldade' },
    { value: 'LOW', label: 'Baixa' },
    { value: 'MEDIUM', label: 'Média' },
    { value: 'HIGH', label: 'Alta' },
    { value: 'ELITE', label: 'Elite' },
  ]

  const EXPERIENCE_FILTER_OPTIONS = [
    { value: '', label: 'Qualquer experiência' },
    { value: 'EXPLORING', label: 'Explorando' },
    { value: 'BEGINNER', label: 'Iniciante' },
    { value: 'INTERMEDIATE', label: 'Intermediário' },
    { value: 'ADVANCED', label: 'Avançado' },
    { value: 'COMPETITIVE', label: 'Competitivo' },
  ]

  const PREPARATION_FILTER_OPTIONS = [
    { value: '', label: 'Qualquer preparo' },
    { value: 'NONE', label: 'Sem preparo prévio' },
    { value: 'DAYS', label: 'Dias' },
    { value: 'WEEKS', label: 'Semanas' },
    { value: 'MONTHS', label: 'Meses' },
    { value: 'YEAR_PLUS', label: '1 ano ou mais' },
  ]

  const RECURRENCE_FILTER_OPTIONS = [
    { value: '', label: 'Qualquer recorrência' },
    { value: 'ONE_TIME', label: 'Evento único' },
    { value: 'ANNUAL', label: 'Anual' },
    { value: 'SEMESTER', label: 'Semestral' },
    { value: 'MONTHLY', label: 'Mensal' },
    { value: 'ROLLING', label: 'Contínua/rolling' },
  ]

  type FilterOption = { value: string; label: string }

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

  function normalizeFilterToken(value: unknown) {
    return stripAccents(String(value ?? '').trim().toLowerCase())
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
  }

  function optionMatchesValue(value: any, selected: string, options: FilterOption[]) {
    if (!selected) return true

    const selectedOption = options.find(option => option.value === selected)
    const accepted = new Set([
      normalizeFilterToken(selected),
      normalizeFilterToken(selectedOption?.label ?? selected),
    ].filter(Boolean))

    return normalizeStringList(value).some(item => accepted.has(normalizeFilterToken(item)))
  }

  function textIncludesQuery(value: any, query: string) {
    const cleanQuery = normalizeText(query)
    if (!cleanQuery) return true
    return normalizeText(value).includes(cleanQuery)
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

  function normalizeStringList(value: any): string[] {
    if (Array.isArray(value)) {
      return value
        .map(item => String(item).trim())
        .filter(Boolean)
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) return normalizeStringList(parsed)
      } catch {}

      return value
        .split(',')
        .map(item => item.trim())
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

  function getOlympiadJsonFieldCandidates(item: any, key: 'olympiad_type' | 'olympiad_subject') {
    const data = normalizeJsonObject(item?.category_data)
    const specifics = normalizeJsonObject(data.specifics)

    if (key === 'olympiad_subject') {
      return [
        item?.olympiad_subject,
        item?.olympiad_subjects,
        item?.olympiadSubject,
        item?.olympiadSubjects,
        data?.olympiad_subject,
        data?.olympiad_subjects,
        data?.olympiadSubject,
        data?.olympiadSubjects,
        specifics?.olympiad_subject,
        specifics?.olympiad_subjects,
        specifics?.olympiadSubject,
        specifics?.olympiadSubjects,
      ]
    }

    return [
      item?.olympiad_type,
      item?.olympiadType,
      data?.olympiad_type,
      data?.olympiadType,
      specifics?.olympiad_type,
      specifics?.olympiadType,
    ]
  }

  function getRawOlympiadJsonField(item: any, key: 'olympiad_type' | 'olympiad_subject') {
    const candidates = getOlympiadJsonFieldCandidates(item, key)

    for (const candidate of candidates) {
      if (normalizeStringList(candidate).length > 0) return candidate
    }

    return null
  }

  function hasRawOlympiadJsonField(item: any, key: 'olympiad_type' | 'olympiad_subject') {
    return normalizeStringList(getRawOlympiadJsonField(item, key)).length > 0
  }

  function hasOlympiadJsonClassification(item: any) {
    return Boolean(
      hasRawOlympiadJsonField(item, 'olympiad_type') ||
      hasRawOlympiadJsonField(item, 'olympiad_subject')
    )
  }

  function normalizeOlympiadTypeKey(value: any) {
    const firstValue = normalizeStringList(value)[0] ?? ''
    const token = normalizeFilterToken(firstValue)

    if (OLYMPIAD_TYPE_ORDER.includes(token)) return token

    const labelMatch = OLYMPIAD_TYPE_ORDER.find(key =>
      normalizeFilterToken(OLYMPIAD_TYPE_META[key]?.label) === token
    )

    return labelMatch || 'independent'
  }

  function normalizeStrictOlympiadSubjectKeys(value: any) {
    const keys: string[] = []

    for (const subject of normalizeStringList(value)) {
      const key = OLYMPIAD_SUBJECT_VALUE_TO_KEY[normalizeFilterToken(subject)]
      if (key && !keys.includes(key)) keys.push(key)
    }

    return keys.length ? keys : ['other']
  }

  function normalizeStrictOlympiadSubjectValues(value: any) {
    const keys = normalizeStrictOlympiadSubjectKeys(value)
    if (keys.length === 1 && keys[0] === 'other') return []

    return keys.map(key => OLYMPIAD_SUBJECT_CANONICAL_VALUE[key] ?? key)
  }

  function getExplicitOlympiadSubjectKeys(item: any) {
    return normalizeStrictOlympiadSubjectKeys(getRawOlympiadJsonField(item, 'olympiad_subject'))
  }

  function getExplicitOlympiadTypeKey(item: any) {
    return normalizeOlympiadTypeKey(getRawOlympiadJsonField(item, 'olympiad_type'))
  }

  function isOlympiadCatalogItem(item: any) {
    return item?.category === 'OLYMPIAD' || hasOlympiadJsonClassification(item)
  }

  function getSubjectKeysFromItem(item: any) {
    return getExplicitOlympiadSubjectKeys(item)
  }

  function getSubjectKeyFromItem(item: any) {
    return getSubjectKeysFromItem(item)[0] ?? 'other'
  }

  function getOlympiadTypeKey(item: any) {
    return getExplicitOlympiadTypeKey(item) || 'independent'
  }

  function getOlympiadTypeLabel(item: any) {
    const key = getOlympiadTypeKey(item)
    return OLYMPIAD_TYPE_META[key]?.label ?? OLYMPIAD_TYPE_META.independent.label
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
    const normalizedSource = { ...o, category_data: categoryData }
    const hasOlympiadClassification = hasOlympiadJsonClassification(normalizedSource)
    const normalizedCategory = hasOlympiadClassification ? 'OLYMPIAD' : (o.category ?? 'OLYMPIAD')
    const rawOlympiadSubject = getRawOlympiadJsonField(normalizedSource, 'olympiad_subject')
    const hasOlympiadSubjectField = hasRawOlympiadJsonField(normalizedSource, 'olympiad_subject')
    const subjectKeys = getSubjectKeysFromItem(normalizedSource)
    const subjectKey = subjectKeys[0] ?? 'other'
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

    const detailLoaded = o?._detail_loaded === true

    return {
      id: o.id,
      slug: o.slug ?? null,
      title: o.title,
      excerpt: o.excerpt ?? o.description?.slice(0, 120) ?? '',
      description: o.description ?? '',
      category: normalizedCategory,
      olympiad_type: getOlympiadTypeKey(normalizedSource),
      olympiad_type_key: getOlympiadTypeKey(normalizedSource),
      olympiad_type_label: getOlympiadTypeLabel(normalizedSource),
      olympiad_type_meta: OLYMPIAD_TYPE_META[getOlympiadTypeKey(normalizedSource)] ?? OLYMPIAD_TYPE_META.independent,
      olympiad_subject: normalizeStrictOlympiadSubjectValues(rawOlympiadSubject),
      olympiad_subject_raw: rawOlympiadSubject,
      olympiad_subject_keys: subjectKeys,
      subject_keys: subjectKeys,
      has_olympiad_subject_field: hasOlympiadSubjectField,
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
      keywords: o.keywords ?? '',
      target_subjects: normalizeStringList(o.target_subjects),
      target_goals: normalizeStringList(o.target_goals),
      target_education_levels: normalizeStringList(o.target_education_levels),
      recommended_experience_levels: normalizeStringList(o.recommended_experience_levels),
      competitiveness_level: normalizeStringList(o.competitiveness_level),
      preparation_horizon: normalizeStringList(o.preparation_horizon),
      recurrence_type: normalizeStringList(o.recurrence_type),
      recommendation_notes: o.recommendation_notes ?? '',
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
  const detailLoadingId = ref<string | null>(null)

  const loading = ref(true)
  const loadingMore = ref(false)
  const error = ref<string | null>(null)
  const totalCount = ref(0)
  const currentPage = ref(1)
  const search = ref('')
  const activeSubjects = ref<string[]>([])
  const olympiadTypeFilter = ref('')
  const organizerFilter = ref('')
  const tagFilter = ref('')
  const competitivenessFilter = ref('')
  const experienceFilter = ref('')
  const preparationFilter = ref('')
  const recurrenceFilter = ref('')
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
  let olympiadDetailRequestSeq = 0

  const isAdmin = computed(() => !!(currentUser.value?.is_superuser || currentUser.value?.is_manager))

  const isSelectedItemLoadingDetail = computed(() => {
    const id = selectedItem.value?.id
    return id !== null && id !== undefined && detailLoadingId.value === String(id)
  })

  function buildOlympiadParams() {
    const params: Record<string, any> = {
      page: currentPage.value,
      limit: PAGE_SIZE,
      category: 'OLYMPIAD',
      include_olympiad_json_fields: true,
    }

    const cleanSearch = search.value.trim()
    if (cleanSearch) params.search = cleanSearch

    // Subject/type filtering is intentionally client-side here.
    // The catalog sectioning must use the olympiad_subject array extracted from each olympiad JSON,
    // and old card endpoints may not index those JSON fields consistently.
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

  function shouldHydrateCatalogSubject(item: any) {
    return Boolean(
      item?.id !== null &&
      item?.id !== undefined &&
      item?.detail_loaded !== true &&
      item?.has_olympiad_subject_field !== true
    )
  }

  async function hydrateCatalogSubjects(items: any[], requestSeq: number) {
    const hydrated = [...items]
    const targets = hydrated
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => shouldHydrateCatalogSubject(item))

    const concurrency = 6

    for (let start = 0; start < targets.length; start += concurrency) {
      const batch = targets.slice(start, start + concurrency)

      await Promise.allSettled(batch.map(async ({ item, index }) => {
        if (requestSeq !== olympiadRequestSeq) return

        const fullPayload = await fetchFullOlympiadDetail(item)
        hydrated[index] = normalize(fullPayload)
      }))
    }

    return hydrated
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
      const normalizedCards = data.map(normalize).filter(isOlympiadCatalogItem)
      const normalized = await hydrateCatalogSubjects(normalizedCards, requestSeq)

      if (requestSeq !== olympiadRequestSeq) return

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
    const idx = olympiads.value.findIndex(existing => String(existing.id) === String(normalized.id))

    if (idx >= 0) {
      olympiads.value.splice(idx, 1, normalized)
    } else {
      olympiads.value = [normalized, ...olympiads.value]
    }

    return normalized
  }

  async function fetchFullOlympiadDetail(item: any) {
    const id = item?.id
    const slug = item?.slug
    const endpoints = [
      id !== null && id !== undefined ? `/opportunity/${encodeURIComponent(String(id))}` : null,
      id !== null && id !== undefined ? `/olympiads/${encodeURIComponent(String(id))}` : null,
      slug ? `/opportunity/slug/${encodeURIComponent(String(slug))}` : null,
    ].filter(Boolean) as string[]

    let lastError: any = null

    for (const endpoint of endpoints) {
      try {
        const res = await get(endpoint)
        const payload = res.data?.data ?? res.data

        if (payload && typeof payload === 'object') {
          return {
            ...item,
            ...payload,
            id: payload.id ?? item.id,
            slug: payload.slug ?? item.slug,
            _detail_loaded: true,
          }
        }
      } catch (e) {
        lastError = e
      }
    }

    throw lastError || new Error('Não foi possível carregar os detalhes completos da olimpíada.')
  }

  async function selectOlympiad(item: any) {
    if (!item) return

    selectedItem.value = item

    const id = item.id
    if (id === null || id === undefined || item.detail_loaded) return

    const requestSeq = ++olympiadDetailRequestSeq
    const loadingId = String(id)
    detailLoadingId.value = loadingId

    try {
      const payload = await fetchFullOlympiadDetail(item)
      const full = upsertOlympiad(payload)

      if (requestSeq === olympiadDetailRequestSeq && String(selectedItem.value?.id) === String(full.id)) {
        selectedItem.value = full
      }
    } catch (e) {
      console.warn('Could not fetch full olympiad details:', id, e)
    } finally {
      if (requestSeq === olympiadDetailRequestSeq && detailLoadingId.value === loadingId) {
        detailLoadingId.value = null
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
      const payload = res.data?.data ?? res.data
      const item = upsertOlympiad({ ...payload, _detail_loaded: true })

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
      activeSubjects.value = []
      olympiadTypeFilter.value = ''
      organizerFilter.value = ''
      tagFilter.value = ''
      competitivenessFilter.value = ''
      experienceFilter.value = ''
      preparationFilter.value = ''
      recurrenceFilter.value = ''
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
      olympiadTypeFilter.value = ''
      organizerFilter.value = ''
      tagFilter.value = ''
      competitivenessFilter.value = ''
      experienceFilter.value = ''
      preparationFilter.value = ''
      recurrenceFilter.value = ''
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
    const index = activeSubjects.value.indexOf(subject)

    if (index >= 0) {
      activeSubjects.value.splice(index, 1)
      return
    }

    activeSubjects.value.push(subject)
  }

  function clearSubjectFilters() {
    activeSubjects.value = []
  }

  function setDeadlineFilter(value: QuickFilter) {
    quickFilter.value = value
  }

  function setOlympiadTypeFilter(value: string) {
    olympiadTypeFilter.value = value
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

  function itemMatchesSpecificSearch(item: any) {
    const data = normalizeJsonObject(item?.category_data)
    const specifics = normalizeJsonObject(data.specifics)

    if (organizerFilter.value && !textIncludesQuery([
      data.organizer,
      specifics.organizer,
      item.title,
    ], organizerFilter.value)) {
      return false
    }

    if (tagFilter.value && !textIncludesQuery([
      item.tags,
      item.keywords,
      item.target_subjects,
      item.target_goals,
      item.olympiad_subject,
      data.subject,
      data.olympiad_subject,
      data.knowledge_areas,
      specifics.type,
      item.title,
      item.excerpt,
    ], tagFilter.value)) {
      return false
    }

    if (competitivenessFilter.value && !optionMatchesValue([
      item.competitiveness_level,
      data.competitiveness_level,
      specifics.competitiveness_level,
    ], competitivenessFilter.value, COMPETITIVENESS_FILTER_OPTIONS)) {
      return false
    }

    if (experienceFilter.value && !optionMatchesValue([
      item.recommended_experience_levels,
      data.recommended_experience_levels,
      specifics.recommended_experience_levels,
    ], experienceFilter.value, EXPERIENCE_FILTER_OPTIONS)) {
      return false
    }

    if (preparationFilter.value && !optionMatchesValue([
      item.preparation_horizon,
      data.preparation_horizon,
      specifics.preparation_horizon,
    ], preparationFilter.value, PREPARATION_FILTER_OPTIONS)) {
      return false
    }

    if (recurrenceFilter.value && !optionMatchesValue([
      item.recurrence_type,
      data.recurrence_type,
      specifics.recurrence_type,
    ], recurrenceFilter.value, RECURRENCE_FILTER_OPTIONS)) {
      return false
    }

    return true
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
      .filter(item => !activeSubjects.value.length || activeSubjects.value.some(subject => item.subject_keys?.includes?.(subject)))
      .filter(item => !olympiadTypeFilter.value || item.olympiad_type_key === olympiadTypeFilter.value || item.olympiad_type === olympiadTypeFilter.value)
      .filter(itemMatchesLevel)
      .filter(itemMatchesQuickFilter)
      .filter(itemMatchesSpecificSearch)
  })

  const subjectCounts = computed(() => {
    const counts: Record<string, number> = {}

    for (const item of visibleOlympiads.value) {
      const keys = Array.isArray(item.subject_keys) && item.subject_keys.length ? item.subject_keys : ['other']
      for (const key of keys) counts[key] = (counts[key] ?? 0) + 1
    }

    return counts
  })


  const olympiadTypeCounts = computed(() => {
    const counts: Record<string, number> = {}

    for (const item of visibleOlympiads.value) {
      const key = item.olympiad_type_key || 'independent'
      counts[key] = (counts[key] ?? 0) + 1
    }

    return counts
  })

  const activeFilters = computed(
    () => (search.value ? 1 : 0)
      + (activeSubjects.value.length ? 1 : 0)
      + (olympiadTypeFilter.value ? 1 : 0)
      + (organizerFilter.value ? 1 : 0)
      + (tagFilter.value ? 1 : 0)
      + (competitivenessFilter.value ? 1 : 0)
      + (experienceFilter.value ? 1 : 0)
      + (preparationFilter.value ? 1 : 0)
      + (recurrenceFilter.value ? 1 : 0)
      + (levelFilter.value ? 1 : 0)
      + (freeOnly.value ? 1 : 0)
      + (onlineOnly.value ? 1 : 0)
      + (quickFilter.value ? 1 : 0)
      + (isAdmin.value && verificationFilter.value !== 'all' ? 1 : 0)
  )

  const filtersActive = computed(() => activeFilters.value > 0)

  const sideFiltersCount = computed(() => {
    return (quickFilter.value ? 1 : 0)
      + (olympiadTypeFilter.value ? 1 : 0)
      + (organizerFilter.value ? 1 : 0)
      + (tagFilter.value ? 1 : 0)
      + (competitivenessFilter.value ? 1 : 0)
      + (experienceFilter.value ? 1 : 0)
      + (preparationFilter.value ? 1 : 0)
      + (recurrenceFilter.value ? 1 : 0)
      + (levelFilter.value ? 1 : 0)
      + (onlineOnly.value ? 1 : 0)
      + (freeOnly.value ? 1 : 0)
      + (isAdmin.value && verificationFilter.value !== 'all' ? 1 : 0)
  })

  const hasClientOnlyFilter = computed(() =>
    !!quickFilter.value ||
    activeSubjects.value.length > 0 ||
    !!olympiadTypeFilter.value ||
    !!organizerFilter.value ||
    !!tagFilter.value ||
    !!competitivenessFilter.value ||
    !!experienceFilter.value ||
    !!preparationFilter.value ||
    !!recurrenceFilter.value ||
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
      const keys = Array.isArray(item.subject_keys) && item.subject_keys.length ? item.subject_keys : ['other']

      for (const key of keys) {
        if (!grouped[key]) grouped[key] = []
        if (!grouped[key].some(existing => existing.id === item.id)) {
          grouped[key].push({
            ...item,
            subject_key: key,
            subject_meta: SUBJECT_META[key] ?? SUBJECT_META.other,
          })
        }
      }
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
    () => [activeSubjects.value.join('|'), olympiadTypeFilter.value],
    () => {
      if (!filterWatchPaused.value) fetchOlympiads(true)
    }
  )

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


  onMounted(async () => {
    document.addEventListener('click', closeSideFiltersOnOutside)

    const querySubject = typeof route.query.subject === 'string'
      ? route.query.subject
      : ''

    const queryOpen = typeof route.query.open === 'string'
      ? route.query.open
      : ''

    if (querySubject && SUBJECT_META[querySubject]) {
      activeSubjects.value = [querySubject]
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
                :class="['olympiads-pill', activeSubjects.length === 0 && 'olympiads-pill--active']"
                @click="clearSubjectFilters"
              >
                Todas
                <small>{{ visibleOlympiads.length }}</small>
              </button>

              <button
                v-for="key in SUBJECT_ORDER"
                :key="key"
                v-show="(subjectCounts[key] ?? 0) > 0 || activeSubjects.includes(key)"
                type="button"
                :class="['olympiads-pill', activeSubjects.includes(key) && 'olympiads-pill--active']"
                :style="activeSubjects.includes(key) ? { '--pill-color': SUBJECT_META[key].color } : {}"
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
                <div class="olympiads-side-filter-section olympiads-side-filter-section--wide">
                  <span class="olympiads-side-filter-title">Busca específica</span>

                  <div class="olympiads-side-field-grid">
                    <label class="olympiads-side-field">
                      <span>Organizador</span>
                      <input
                        v-model="organizerFilter"
                        type="search"
                        class="olympiads-side-input"
                        placeholder="IMPA, SBF, NOIC…"
                      />
                    </label>

                    <label class="olympiads-side-field">
                      <span>Tags, assunto ou objetivo</span>
                      <input
                        v-model="tagFilter"
                        type="search"
                        class="olympiads-side-input"
                        placeholder="PIC, internacional, prova experimental…"
                      />
                    </label>
                  </div>
                </div>

                <div class="olympiads-side-filter-section">
                  <span class="olympiads-side-filter-title">Tipo de olimpíada</span>

                  <div class="olympiads-side-option-grid">
                    <button
                      type="button"
                      class="olympiads-side-option"
                      :class="{ 'olympiads-side-option--active': !olympiadTypeFilter }"
                      @click="setOlympiadTypeFilter('')"
                    >
                      Todos
                    </button>

                    <button
                      v-for="key in OLYMPIAD_TYPE_ORDER"
                      :key="key"
                      v-show="(olympiadTypeCounts[key] ?? 0) > 0 || olympiadTypeFilter === key"
                      type="button"
                      class="olympiads-side-option"
                      :class="{ 'olympiads-side-option--active': olympiadTypeFilter === key }"
                      @click="setOlympiadTypeFilter(key)"
                    >
                      {{ OLYMPIAD_TYPE_META[key].icon }} {{ OLYMPIAD_TYPE_META[key].label }}
                      <small>{{ olympiadTypeCounts[key] ?? 0 }}</small>
                    </button>
                  </div>
                </div>

                <div class="olympiads-side-filter-section">
                  <span class="olympiads-side-filter-title">Prazo</span>

                  <div class="olympiads-side-option-grid">
                    <button
                      type="button"
                      class="olympiads-side-option"
                      :class="{ 'olympiads-side-option--active': !quickFilter }"
                      @click="setDeadlineFilter('')"
                    >
                      Qualquer
                    </button>

                    <button
                      type="button"
                      class="olympiads-side-option"
                      :class="{ 'olympiads-side-option--active': quickFilter === 'open' }"
                      @click="setDeadlineFilter('open')"
                    >
                      Abertas
                    </button>

                    <button
                      type="button"
                      class="olympiads-side-option"
                      :class="{ 'olympiads-side-option--active': quickFilter === 'urgent' }"
                      @click="setDeadlineFilter('urgent')"
                    >
                      7 dias
                    </button>

                    <button
                      type="button"
                      class="olympiads-side-option"
                      :class="{ 'olympiads-side-option--active': quickFilter === 'opensSoon' }"
                      @click="setDeadlineFilter('opensSoon')"
                    >
                      Em breve
                    </button>

                    <button
                      type="button"
                      class="olympiads-side-option"
                      :class="{ 'olympiads-side-option--active': quickFilter === 'noRegistration' }"
                      @click="setDeadlineFilter('noRegistration')"
                    >
                      Sem ativa
                    </button>
                  </div>
                </div>

                <div class="olympiads-side-filter-section">
                  <span class="olympiads-side-filter-title">Perfil do estudante</span>

                  <select v-model="levelFilter" class="olympiads-select">
                    <option v-for="option in LEVEL_OPTIONS" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>

                  <select v-model="experienceFilter" class="olympiads-select">
                    <option v-for="option in EXPERIENCE_FILTER_OPTIONS" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </div>

                <div class="olympiads-side-filter-section">
                  <span class="olympiads-side-filter-title">Dificuldade e preparo</span>

                  <select v-model="competitivenessFilter" class="olympiads-select">
                    <option v-for="option in COMPETITIVENESS_FILTER_OPTIONS" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>

                  <select v-model="preparationFilter" class="olympiads-select">
                    <option v-for="option in PREPARATION_FILTER_OPTIONS" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </div>

                <div class="olympiads-side-filter-section">
                  <span class="olympiads-side-filter-title">Recorrência e formato</span>

                  <select v-model="recurrenceFilter" class="olympiads-select">
                    <option v-for="option in RECURRENCE_FILTER_OPTIONS" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>

                  <label class="olympiads-side-toggle">
                    <input v-model="onlineOnly" type="checkbox" />
                    <span>Online</span>
                  </label>

                  <label class="olympiads-side-toggle">
                    <input v-model="freeOnly" type="checkbox" />
                    <span>Gratuita</span>
                  </label>
                </div>

                <div v-if="isAdmin" class="olympiads-side-filter-section">
                  <span class="olympiads-side-filter-title">Revisão</span>

                  <div class="olympiads-side-option-grid">
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

                    <span class="olympiads-type-badge">
                      {{ item.olympiad_type_meta?.icon || '✨' }} {{ item.olympiad_type_label || 'Independente' }}
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

                    <span class="olympiads-type-badge">
                      {{ item.olympiad_type_meta?.icon || '✨' }} {{ item.olympiad_type_label || 'Independente' }}
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

      <OlympiadDetailsModal
        :item="selectedItem"
        :loading-detail="isSelectedItemLoadingDetail"
        :is-admin="isAdmin"
        @close="selectedItem = null"
        @edit="handleEditOlympiad"
      />
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
    width: min(680px, calc(100vw - 28px));
    max-height: min(72vh, 720px);
    overflow-y: auto;
    border: 1px solid #e7e5e4;
    border-radius: 20px;
    padding: 14px;
    background: white;
    box-shadow: 0 24px 80px rgba(0, 0, 0, .14);
    z-index: 30;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .olympiads-side-filter-section {
    display: grid;
    align-content: start;
    gap: 8px;
    padding: 12px;
    border: 1px solid #f0ece8;
    border-radius: 16px;
    background: #fff;
  }

  .olympiads-side-filter-section--wide {
    grid-column: 1 / -1;
  }

  .olympiads-side-filter-title {
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: #78716c;
  }

  .olympiads-side-field-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .olympiads-side-field {
    display: grid;
    gap: 5px;
  }

  .olympiads-side-field span {
    font-size: 12px;
    font-weight: 850;
    color: #57534e;
  }

  .olympiads-side-option-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
  }

  .olympiads-side-option,
  .olympiads-select,
  .olympiads-side-input {
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

  .olympiads-side-input {
    cursor: text;
  }

  .olympiads-side-input::placeholder {
    color: #a8a29e;
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
    grid-column: 1 / -1;
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

    .olympiads-side-filter-panel {
      left: 0;
      right: auto;
      width: min(100%, calc(100vw - 28px));
      grid-template-columns: 1fr;
    }

    .olympiads-side-field-grid,
    .olympiads-side-option-grid {
      grid-template-columns: 1fr;
    }

    .olympiads-count {
      display: none;
    }

    .olympiads-grid,
    .olympiads-grid--compact {
      grid-template-columns: 1fr;
    }

  }

  .olympiads-type-badge { display:inline-flex; align-items:center; gap:5px; border-radius:999px; padding:6px 8px; border:1px solid #e7e5e4; background:#f8fafc; color:#475569; font-size:11px; font-weight:900; line-height:1; }
  </style>