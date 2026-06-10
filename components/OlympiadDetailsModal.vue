<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue'

const props = withDefaults(defineProps<{
  item: any | null
  loadingDetail?: boolean
  isAdmin?: boolean
}>(), {
  loadingDetail: false,
  isAdmin: false,
})

const emit = defineEmits<{
  close: []
  edit: [item: any]
}>()

const selectedItem = computed(() => props.item)
const loadingDetail = computed(() => props.loadingDetail)
const isAdmin = computed(() => props.isAdmin)

type InfoTone = 'blue' | 'emerald' | 'amber' | 'zinc' | 'violet' | 'rose'

type DisplayCard = {
  title: string
  label: string
  lines: string[]
  icon: string
  tone: InfoTone
}

const DISPLAY_VALUE_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  ELITE: 'Elite',
  VERY_HIGH: 'Muito alta',
  EXTREME: 'Extrema',
  COMPETITIVE: 'Competitivo',
  EXPLORING: 'Explorando',
  BEGINNER: 'Iniciante',
  INTERMEDIATE: 'Intermediário',
  ADVANCED: 'Avançado',
  FUNDAMENTAL_1: 'Fundamental I',
  FUNDAMENTAL_2: 'Fundamental II',
  ENSINO_FUNDAMENTAL: 'Ensino fundamental',
  ENSINO_MEDIO: 'Ensino médio',
  ENSINO_MEDIO_1: '1º ano EM',
  ENSINO_MEDIO_2: '2º ano EM',
  ENSINO_MEDIO_3: '3º ano EM',
  TECNICO: 'Ensino técnico',
  ENSINO_TECNICO: 'Ensino técnico',
  HIGH_SCHOOL: 'Ensino médio',
  MIDDLE_SCHOOL: 'Fundamental II',
  ELEMENTARY_SCHOOL: 'Ensino fundamental',
  WEEKS: 'Semanas',
  DAYS: 'Dias',
  MONTHS: 'Meses',
  YEAR_PLUS: '1 ano ou mais',
  ONE_YEAR_PLUS: '1 ano ou mais',
  ANNUAL: 'Anual',
  YEARLY: 'Anual',
  MONTHLY: 'Mensal',
  WEEKLY: 'Semanal',
  ONE_TIME: 'Única',
  CONTINUOUS: 'Contínua',
  ONLINE: 'Online',
  PRESENTIAL: 'Presencial',
  HYBRID: 'Híbrida',
  NATIONAL: 'Nacional',
  INTERNATIONAL: 'Internacional',
  LOCAL: 'Local',
  REGIONAL: 'Regional',
  QUALIFIER: 'Seletiva',
  INDEPENDENT: 'Independente',
  FREE: 'Gratuita',
  PAID: 'Paga',
  MATH: 'Matemática',
  MATHEMATICS: 'Matemática',
  PROGRAMMING: 'Programação',
  COMPUTER_SCIENCE: 'Computação',
  PHYSICS: 'Física',
  CHEMISTRY: 'Química',
  BIOLOGY: 'Biologia',
  ASTRONOMY: 'Astronomia',
  LINGUISTICS: 'Linguística',
  HISTORY: 'História',
  GEOGRAPHY: 'Geografia',
  SCIENCE: 'Ciências',
  ROBOTICS: 'Robótica',
  WRITING: 'Redação e Humanidades',
  ECONOMICS: 'Economia',
  OTHER: 'Outras áreas',
}

const EMPTY_DISPLAY_VALUES = new Set(['unknown', 'undefined', 'null', 'none', 'n/a', 'na'])


const STRICT_OLYMPIAD_SUBJECT_DISPLAY: Record<string, string> = {
  MATHEMATICS: 'Matemática',
  MATH: 'Matemática',
  PROGRAMMING: 'Programação',
  INFORMATICS: 'Informática',
  COMPUTER_SCIENCE: 'Ciência da Computação',
  PHYSICS: 'Física',
  CHEMISTRY: 'Química',
  BIOLOGY: 'Biologia',
  ASTRONOMY: 'Astronomia',
  LINGUISTICS: 'Linguística',
  HISTORY: 'História',
  GEOGRAPHY: 'Geografia',
  SCIENCE: 'Ciências',
  ROBOTICS: 'Robótica',
  WRITING: 'Redação / escrita',
  ESSAY: 'Redação / escrita',
  LITERATURE: 'Literatura',
  HUMANITIES: 'Humanidades',
  ECONOMICS: 'Economia',
  FINANCE: 'Finanças',
}

function normalizeDisplayToken(value: string) {
  return stripAccents(value.trim())
    .replace(/[\s-]+/g, '_')
    .replace(/__+/g, '_')
    .toUpperCase()
}

function humanizeEnumLikeText(value: string) {
  const text = value.trim()
  if (!text) return ''

  const normalizedText = normalizeText(text)
  if (EMPTY_DISPLAY_VALUES.has(normalizedText)) return ''

  const token = normalizeDisplayToken(text)
  if (DISPLAY_VALUE_LABELS[token]) return DISPLAY_VALUE_LABELS[token]

  if (/^[A-Z0-9_]+$/.test(text) && text.includes('_')) {
    return text
      .toLowerCase()
      .split('_')
      .filter(Boolean)
      .map((part) => {
        if (part === 'em') return 'EM'
        if (part === 'ii') return 'II'
        if (part === 'iii') return 'III'
        return part.charAt(0).toUpperCase() + part.slice(1)
      })
      .join(' ')
  }

  return text
}

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
  fee_waiver_deadline: {
    label: 'Isenção',
    shortLabel: 'Isenção',
    tone: 'emerald',
    prefix: 'Isenção até',
  },
  payment_deadline: {
    label: 'Pagamento',
    shortLabel: 'Pagamento',
    tone: 'amber',
    prefix: 'Pagamento até',
  },
  answer_key: {
    label: 'Gabarito',
    shortLabel: 'Gabarito',
    tone: 'violet',
    prefix: 'Gabarito em',
  },
  cutoff_result: {
    label: 'Nota de corte',
    shortLabel: 'Nota de corte',
    tone: 'violet',
    prefix: 'Nota de corte em',
  },
  final_result: {
    label: 'Resultado final',
    shortLabel: 'Resultado final',
    tone: 'violet',
    prefix: 'Resultado em',
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
    tone: 'violet',
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
    tone: 'blue',
    prefix: 'Prazo em',
  },
}

const OLYMPIAD_FIELD_LABELS: Record<string, string> = {
  organizer: 'Organizador',
  olympiad_type: 'Tipo de olimpíada',
  olympiad_subject: 'Matérias da olimpíada',
  subject: 'Matéria',
  knowledge_areas: 'Áreas cobradas',
  school_level: 'Nível escolar',
  level: 'Nível',
  difficulty: 'Dificuldade',
  target_audience: 'Público-alvo',
  cost_info: 'Custo e isenções',
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

const COMPLEMENTARY_INFO_ORDER = [
  'olympiad_type',
  'olympiad_subject',
  'knowledge_areas',
  'subject',
  'school_level',
  'level',
  'difficulty',
  'individual_or_team',
  'syllabus',
  'recommended_background',
  'medal_system',
  'medal_criteria',
  'award_criteria',
  'training_resources',
  'source_notes',
]

function closeModal() {
  emit('close')
}

function handleEditOlympiad() {
  if (selectedItem.value) emit('edit', selectedItem.value)
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

function fmtDate(raw: string | null | undefined) {
  const dt = parseLocalDate(raw)
  if (!dt) return null

  return dt.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
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

function normalizeDisplayLines(value: any): string[] {
  if (value === null || value === undefined) return []

  if (Array.isArray(value)) {
    return value
      .flatMap(item => normalizeDisplayLines(item))
      .map(item => item.trim())
      .filter(Boolean)
  }

  if (typeof value === 'boolean') return [value ? 'Sim' : 'Não']
  if (typeof value === 'number') return [String(value)]

  if (typeof value === 'object') {
    const objectValue = value as Record<string, any>
    const directText = objectValue.title ?? objectValue.name ?? objectValue.label ?? objectValue.description

    if (directText) return normalizeDisplayLines(directText)

    return Object.values(objectValue)
      .flatMap(item => normalizeDisplayLines(item))
      .map(item => item.trim())
      .filter(Boolean)
  }

  const text = String(value).trim()
  if (!text) return []

  if ((text.startsWith('[') && text.endsWith(']')) || (text.startsWith('{') && text.endsWith('}'))) {
    try {
      const parsed = JSON.parse(text)
      const parsedLines = normalizeDisplayLines(parsed)
      if (parsedLines.length) return parsedLines
    } catch {}
  }

  if (text.includes(' · ')) {
    return text
      .split(' · ')
      .map(item => humanizeEnumLikeText(item))
      .filter(Boolean)
  }

  const displayText = humanizeEnumLikeText(text)
  return displayText ? [displayText] : []
}

function uniqueLines(lines: string[]) {
  const seen = new Set<string>()
  const clean: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    const key = normalizeText(trimmed)
    if (!trimmed || seen.has(key)) continue
    seen.add(key)
    clean.push(trimmed)
  }

  return clean
}

function toTextValue(value: any): string | null {
  const lines = uniqueLines(normalizeDisplayLines(value))
  return lines.length ? lines.join(' · ') : null
}

function getFirstText(...values: any[]) {
  for (const value of values) {
    const text = toTextValue(value)
    if (text) return text
  }

  return null
}

function getRawOlympiadJsonField(item: any, key: 'olympiad_type' | 'olympiad_subject') {
  const data = getData(item)
  const specifics = getSpecifics(item)

  return item?.[key] ?? data?.[key] ?? specifics?.[key] ?? null
}


function getOlympiadTypeKey(item: any) {
  const raw = getRawOlympiadJsonField(item, 'olympiad_type')
  const firstValue = uniqueLines(normalizeDisplayLines(raw))[0] ?? ''
  const text = normalizeText(firstValue)

  if (text.includes('regional')) return 'regional'
  if (text.includes('national') || text.includes('nacional')) return 'national'
  if (text.includes('qualifier') || text.includes('seletiva') || text.includes('classificatoria')) return 'qualifier'
  if (text.includes('international') || text.includes('internacional')) return 'international'
  if (text.includes('independent') || text.includes('independente')) return 'independent'

  return 'independent'
}

function getOlympiadTypeValue(item: any) {
  const key = getOlympiadTypeKey(item)
  return DISPLAY_VALUE_LABELS[key.toUpperCase()] ?? humanizeEnumLikeText(key)
}

function getOlympiadSubjectValue(item: any) {
  const rawSubjects = normalizeDisplayLines(getRawOlympiadJsonField(item, 'olympiad_subject'))
  const recognized: string[] = []

  for (const rawSubject of rawSubjects) {
    const label = STRICT_OLYMPIAD_SUBJECT_DISPLAY[normalizeDisplayToken(rawSubject)]
    if (label && !recognized.includes(label)) recognized.push(label)
  }

  return recognized.length ? recognized.join(' · ') : 'Outras áreas'
}

function getData(item: any) {
  return normalizeJsonObject(item?.category_data)
}

function getSpecifics(item: any) {
  return normalizeJsonObject(getData(item).specifics)
}

function makeCard(title: string, value: any, icon: string, tone: InfoTone = 'blue'): DisplayCard | null {
  const lines = uniqueLines(normalizeDisplayLines(value))
  if (!lines.length) return null

  return {
    title,
    label: lines.join(' · '),
    lines,
    icon,
    tone,
  }
}

function getTimelineKindMeta(event: any) {
  return TIMELINE_KIND_META[event?.kind] ?? TIMELINE_KIND_META.other
}

function getTimelineKindLabel(event: any) {
  return getTimelineKindMeta(event).label
}

function isTimelineEventPast(event: any) {
  const dt = parseLocalDate(event?.date)
  if (!dt) return false

  return dt.getTime() < Date.now()
}

function getTimelineKindTone(event: any) {
  if (isTimelineEventPast(event)) return 'passed'
  return getTimelineKindMeta(event).tone
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

function getOlympiadScope(item: any) {
  return getOlympiadTypeValue(item)
}

function getShortCostLabel(item: any) {
  const data = getData(item)
  const specifics = getSpecifics(item)
  const cost = getFirstText(data.cost_info, data.cost, specifics.cost_info, specifics.cost)

  if (item?.is_free) return 'Gratuita'
  if (!cost) return null

  if (cost.length > 130) return 'Possui taxa/custo informado'
  return cost
}

function getStrategicOverviewCards(item: any) {
  if (!item) return []

  const data = getData(item)
  const specifics = getSpecifics(item)
  const cards: Array<DisplayCard | null> = [
    makeCard('Organização', data.organizer ?? specifics.organizer, '🏛️', 'zinc'),
    makeCard('Tipo de olimpíada', getOlympiadTypeValue(item), '🧭', 'emerald'),
    makeCard('Matérias da olimpíada', getOlympiadSubjectValue(item), '📚', 'blue'),
    makeCard('Competitividade', item.competitiveness_level ?? data.competitiveness_level ?? specifics.competitiveness_level, '🔥', 'amber'),
    makeCard('Quem pode participar', item.target_education_levels ?? data.school_level ?? data.level ?? data.target_audience, '🎒', 'blue'),
    makeCard('Experiência indicada', item.recommended_experience_levels ?? data.recommended_experience_levels ?? specifics.recommended_experience_levels, '🧭', 'violet'),
    makeCard('Preparação', item.preparation_horizon ?? data.preparation_horizon ?? data.workload ?? specifics.preparation_horizon, '⏱️', 'zinc'),
    makeCard('Recorrência', item.recurrence_type ?? data.recurrence_type ?? specifics.recurrence_type, '🔁', 'emerald'),
    makeCard('Custo', getShortCostLabel(item), '💸', item?.is_free ? 'emerald' : 'amber'),
    //makeCard('Formato', item.exam_format_text ?? data.format ?? data.modality ?? data.exam_format ?? specifics.format ?? specifics.modality, '📝', 'emerald'),
    //makeCard('Fases', item.phases_text ?? data.phase_count ?? data.rounds ?? data.stages ?? specifics.stages ?? specifics.phases, '🪜', 'amber'),
  ]

  return cards.filter(Boolean) as DisplayCard[]
}

function getAudienceCards(item: any) {
  if (!item) return []

  const data = getData(item)
  const specifics = getSpecifics(item)
  const cards: Array<DisplayCard | null> = [
    //makeCard('Níveis mais indicados', item.target_education_levels ?? data.school_level ?? data.level ?? specifics.school_level ?? specifics.level, '🎒', 'blue'),
    makeCard('Público-alvo', data.target_audience ?? specifics.target_audience, '🎯', 'blue'),
    makeCard('Requisitos para participar', data.requirements ?? specifics.requirements, '📋', 'zinc'),
  ]

  return cards.filter(Boolean) as DisplayCard[]
}

function getCompetitionFlowCards(item: any) {
  if (!item) return []

  const data = getData(item)
  const specifics = getSpecifics(item)
  const cards: Array<DisplayCard | null> = [
    makeCard('Como entrar na olimpíada', data.application_process ?? data.registration_process ?? specifics.application_process ?? specifics.registration_process, '✅', 'blue'),
    makeCard('Estrutura das fases', specifics.stages ?? specifics.phases ?? data.stages ?? data.rounds ?? data.phase_count, '🪜', 'amber'),
    makeCard('Duração e formato das provas', specifics.duration ?? data.duration ?? data.exam_format ?? data.format, '⏳', 'emerald'),
    //makeCard('O que o estudante entrega/faz', specifics.deliverables ?? data.deliverables, '📝', 'zinc'),
    makeCard('Critérios de classificação', specifics.selection_criteria ?? data.selection_criteria ?? data.medal_criteria ?? data.award_criteria, '📊', 'violet'),
    makeCard('Conteúdo ou base recomendada', data.syllabus ?? specifics.syllabus ?? data.recommended_background ?? specifics.recommended_background, '📚', 'blue'),
    makeCard('Custo e isenções', data.cost_info ?? data.cost ?? specifics.cost_info ?? specifics.cost, '💸', item?.is_free ? 'emerald' : 'amber'),
    makeCard('Dedicação esperada', data.workload ?? specifics.workload ?? item.preparation_horizon, '⏱️', 'zinc'),
  ]

  return cards.filter(Boolean) as DisplayCard[]
}

function getValueCards(item: any) {
  if (!item) return []

  const data = getData(item)
  const specifics = getSpecifics(item)
  const cards: Array<DisplayCard | null> = [
    //makeCard('Objetivos que essa olimpíada atende', item.target_goals ?? data.target_goals ?? specifics.target_goals, '🎯', 'blue'),
    makeCard('Por que pode valer a pena', data.benefits ?? specifics.benefits, '✨', 'amber'),
    makeCard('Premiações e reconhecimento', specifics.prizes ?? data.prizes ?? data.awards ?? specifics.awards, '🏆', 'amber'),
    makeCard('Leitura estratégica', item.recommendation_notes ?? data.recommendation_notes ?? specifics.recommendation_notes, '💡', 'violet'),
  ]

  return cards.filter(Boolean) as DisplayCard[]
}

function makeInfoCard(key: string, value: any) {
  const title = OLYMPIAD_FIELD_LABELS[key] ?? key.replaceAll('_', ' ')
  return makeCard(title, value, getInfoIcon(title), getInfoTone(title))
}

function getOlympiadInfoCards(item: any) {
  const data = getData(item)
  const specifics = getSpecifics(item)
  const cards: DisplayCard[] = []
  const usedLabels = new Set<string>()

  for (const key of COMPLEMENTARY_INFO_ORDER) {
    const card = makeInfoCard(key, data[key] ?? specifics[key])
    if (card && !usedLabels.has(card.title)) {
      cards.push(card)
      usedLabels.add(card.title)
    }
  }

  return cards
}

function getCardLines(card: DisplayCard | any) {
  if (Array.isArray(card?.lines) && card.lines.length) return card.lines
  return uniqueLines(normalizeDisplayLines(card?.label))
}

function getInfoIcon(title: string) {
  const map: Record<string, string> = {
    Organizador: '🏛️',
    'Tipo de olimpíada': '🧭',
    'Matéria da olimpíada': '📚',
    Matéria: '📚',
    'Áreas cobradas': '🧠',
    'Nível escolar': '🎒',
    Nível: '🎒',
    Dificuldade: '⛰️',
    'Público-alvo': '🎯',
    'Custo e isenções': '💸',
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

function getInfoTone(title: string): InfoTone {
  if (['Como se inscrever', 'Como participar', 'Requisitos', 'Conteúdo cobrado', 'Base recomendada', 'Materiais de treino'].includes(title)) {
    return 'blue'
  }

  if (['Prêmios', 'Premiações', 'Sistema de medalhas', 'Critério de premiação', 'Benefícios'].includes(title)) {
    return 'amber'
  }

  if (['Custo', 'Custo e isenções', 'Formato', 'Modalidade', 'Formato da prova', 'Número de fases', 'Fases', 'Etapas', 'Dedicação esperada'].includes(title)) {
    return 'emerald'
  }

  if (['Observações'].includes(title)) {
    return 'zinc'
  }

  return 'blue'
}

function getResourceTone(ref: any): InfoTone {
  const text = normalizeText([
    ref?.title,
    ref?.name,
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
  const data = getData(item)
  const refs = Array.isArray(data.references)
    ? data.references
        .filter((ref: any) => ref?.url)
        .map((ref: any) => {
          const rawDescription = ref.description ?? null
          const description = rawDescription && normalizeText(rawDescription) !== 'unknown'
            ? rawDescription
            : null

          return {
            ...ref,
            title: ref.title ?? ref.name ?? 'Recurso',
            description,
          }
        })
    : []
  const extraRefs: any[] = []

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

function getCompetitivenessLabel(item: any) {
  return getFirstText(item?.competitiveness_level, getData(item).competitiveness_level, getSpecifics(item).competitiveness_level)
}


watch(
  selectedItem,
  (value) => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = value ? 'hidden' : ''
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="selectedItem" class="olympiads-modal-backdrop" @click.self="closeModal">
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
              @click="closeModal"
            >
              ×
            </button>

            <button
              v-if="isAdmin"
              type="button"
              class="olympiads-modal__cover-edit"
              @click="handleEditOlympiad"
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

                <span v-if="getOlympiadScope(selectedItem)" class="olympiads-scope-chip">
                  {{ getOlympiadScope(selectedItem) }}
                </span>

                <span v-if="getCompetitivenessLabel(selectedItem)" class="olympiads-competitiveness-chip">
                  Competitividade: {{ getCompetitivenessLabel(selectedItem) }}
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

            <div v-if="loadingDetail" class="olympiads-modal__loading">
              Carregando detalhes completos…
            </div>

                <section
                  v-if="getStrategicOverviewCards(selectedItem).length > 0"
                  class="olympiads-modal-section"
                >
              <h3>Informações gerais</h3>

              <div class="olympiads-strategy-grid">
                <div
                  v-for="card in getStrategicOverviewCards(selectedItem)"
                  :key="card.title"
                  :class="[
                    'olympiads-strategy-card',
                    `olympiads-strategy-card--${card.tone}`
                  ]"
                >
                  <span class="olympiads-strategy-card__title">
                    <b>{{ card.icon }}</b>
                    {{ card.title }}
                  </span>

                  <ul v-if="getCardLines(card).length > 1">
                    <li v-for="line in getCardLines(card)" :key="line">
                      {{ line }}
                    </li>
                  </ul>

                  <p v-else class="olympiads-card-text">{{ card.label }}</p>
                </div>
              </div>
            </section>

                <section
                  v-if="getAudienceCards(selectedItem).length > 0"
                  class="olympiads-modal-section"
                >
              <h3>Para quem essa olimpíada faz sentido</h3>

              <div class="olympiads-vertical-list">
                <div
                  v-for="card in getAudienceCards(selectedItem)"
                  :key="card.title"
                  :class="[
                    'olympiads-vertical-item',
                    `olympiads-vertical-item--${card.tone}`
                  ]"
                >
                  <span>{{ card.icon }} {{ card.title }}</span>

                  <ul v-if="getCardLines(card).length > 1">
                    <li v-for="line in getCardLines(card)" :key="line">
                      {{ line }}
                    </li>
                  </ul>

                  <p v-else class="olympiads-card-text">{{ card.label }}</p>
                </div>
              </div>
            </section>

                <section
                  v-if="getCompetitionFlowCards(selectedItem).length > 0"
                  class="olympiads-modal-section"
                >
              <h3>Como funciona na prática</h3>

              <div class="olympiads-vertical-list">
                <div
                  v-for="card in getCompetitionFlowCards(selectedItem)"
                  :key="card.title"
                  :class="[
                    'olympiads-vertical-item',
                    `olympiads-vertical-item--${card.tone}`
                  ]"
                >
                  <span>{{ card.icon }} {{ card.title }}</span>

                  <ul v-if="getCardLines(card).length > 1">
                    <li v-for="line in getCardLines(card)" :key="line">
                      {{ line }}
                    </li>
                  </ul>

                  <p v-else class="olympiads-card-text">{{ card.label }}</p>
                </div>
              </div>
            </section>

                <section
                  v-if="getValueCards(selectedItem).length > 0"
                  class="olympiads-modal-section"
                >
              <h3>Por que participar</h3>

              <div class="olympiads-vertical-list">
                <div
                  v-for="card in getValueCards(selectedItem)"
                  :key="card.title"
                  :class="[
                    'olympiads-vertical-item',
                    `olympiads-vertical-item--${card.tone}`
                  ]"
                >
                  <span>{{ card.icon }} {{ card.title }}</span>

                  <ul v-if="getCardLines(card).length > 1">
                    <li v-for="line in getCardLines(card)" :key="line">
                      {{ line }}
                    </li>
                  </ul>

                  <p v-else class="olympiads-card-text">{{ card.label }}</p>
                </div>
              </div>
            </section>

                <section
                  v-if="(selectedItem.timeline?.length ?? 0) > 0"
                  class="olympiads-modal-section"
                >
              <h3>Cronograma</h3>

              <div class="olympiads-timeline">
                <div
                  v-for="(event, idx) in selectedItem.timeline"
                  :key="idx"
                  :class="[
                    'olympiads-timeline__item',
                    isTimelineEventPast(event) && 'olympiads-timeline__item--passed',
                  ]"
                >
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

                <section
                  v-if="getOlympiadInfoCards(selectedItem).length > 0"
                  class="olympiads-modal-section"
                >
              <h3>Informações complementares</h3>

              <div class="olympiads-vertical-list">
                <div
                  v-for="card in getOlympiadInfoCards(selectedItem)"
                  :key="card.title"
                  :class="[
                    'olympiads-vertical-item',
                    `olympiads-vertical-item--${card.tone}`
                  ]"
                >
                  <span>{{ card.icon }} {{ card.title }}</span>

                  <ul v-if="getCardLines(card).length > 1">
                    <li v-for="line in getCardLines(card)" :key="line">
                      {{ line }}
                    </li>
                  </ul>

                  <p v-else class="olympiads-card-text">{{ card.label }}</p>
                </div>
              </div>
            </section>

                <section
                  v-if="getReferenceLinks(selectedItem).length > 0"
                  class="olympiads-modal-section"
                >
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
                  <span>{{ ref.title || ref.name || 'Recurso' }}</span>
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

                  <button type="button" class="olympiads-modal__secondary" @click="closeModal">
                    Fechar
                  </button>
                </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.olympiads-subject-badge,
.olympiads-deadline,
.olympiads-registration-chip,
.olympiads-free-chip,
.olympiads-muted-chip,
.olympiads-status-chip,
.olympiads-scope-chip,
.olympiads-competitiveness-chip {
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

.olympiads-scope-chip {
  background: #f0fdf4;
  color: #15803d;
  border-color: #bbf7d0;
}

.olympiads-competitiveness-chip {
  background: #fffbeb;
  color: #b45309;
  border-color: #fde68a;
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
  width: min(900px, 100%);
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
  max-width: 760px;
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
  scroll-margin-top: 18px;
}

.olympiads-modal-section:first-child {
  margin-top: 0;
}

.olympiads-modal-section h3 {
  margin: 0 0 13px;
  font-size: 17px;
  letter-spacing: -.025em;
}

.olympiads-strategy-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.olympiads-strategy-card {
  border: 1px solid #e7e5e4;
  border-radius: 18px;
  padding: 14px;
  background: #fafaf9;
}

.olympiads-strategy-card__title {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 7px;
  color: #374151;
  font-size: 12px;
  font-weight: 700;
}

.olympiads-strategy-card__title b {
  font-size: 15px;
  line-height: 1;
}

.olympiads-card-text {
  margin: 0;
  display: block;
  color: #44403c;
  font-size: 14px;
  line-height: 1.5;
  font-weight: 400;
}

.olympiads-strategy-card ul {
  margin: 0;
  padding-left: 17px;
  color: #44403c;
  line-height: 1.5;
  font-size: 13.5px;
  font-weight: 400;
}

.olympiads-strategy-card li {
  font-weight: 400;
}

.olympiads-strategy-card--blue {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.olympiads-strategy-card--blue .olympiads-strategy-card__title {
  color: #374151;
}

.olympiads-strategy-card--amber {
  background: #fffbeb;
  border-color: #fde68a;
}

.olympiads-strategy-card--amber .olympiads-strategy-card__title {
  color: #374151;
}

.olympiads-strategy-card--emerald {
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.olympiads-strategy-card--emerald .olympiads-strategy-card__title {
  color: #374151;
}

.olympiads-strategy-card--zinc {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.olympiads-strategy-card--zinc .olympiads-strategy-card__title {
  color: #374151;
}

.olympiads-strategy-card--violet {
  background: #f5f3ff;
  border-color: #ddd6fe;
}

.olympiads-strategy-card--violet .olympiads-strategy-card__title {
  color: #374151;
}

.olympiads-strategy-card--rose {
  background: #fff1f2;
  border-color: #fecdd3;
}

.olympiads-strategy-card--rose .olympiads-strategy-card__title {
  color: #374151;
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
  color: #374151;
  font-size: 12px;
  font-weight: 700;
}


.olympiads-vertical-item ul {
  margin: 0;
  padding-left: 18px;
  color: #44403c;
  line-height: 1.55;
  font-size: 14px;
  font-weight: 400;
}

.olympiads-vertical-item li {
  font-weight: 400;
}

.olympiads-vertical-item--blue {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.olympiads-vertical-item--blue span {
  color: #374151;
}

.olympiads-vertical-item--amber {
  background: #fffbeb;
  border-color: #fde68a;
}

.olympiads-vertical-item--amber span {
  color: #374151;
}

.olympiads-vertical-item--emerald {
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.olympiads-vertical-item--emerald span {
  color: #374151;
}

.olympiads-vertical-item--zinc {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.olympiads-vertical-item--zinc span {
  color: #374151;
}

.olympiads-vertical-item--violet {
  background: #f5f3ff;
  border-color: #ddd6fe;
}

.olympiads-vertical-item--violet span {
  color: #374151;
}

.olympiads-vertical-item--rose {
  background: #fff1f2;
  border-color: #fecdd3;
}

.olympiads-vertical-item--rose span {
  color: #374151;
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

.olympiads-timeline__dot--violet {
  background: #7c3aed;
  box-shadow: 0 0 0 5px #ede9fe;
}

.olympiads-timeline__dot--passed {
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

.olympiads-timeline__kind--violet {
  background: #f5f3ff;
  border-color: #ddd6fe;
  color: #7c3aed;
}

.olympiads-timeline__kind--passed {
  background: #f8fafc;
  border-color: #e2e8f0;
  color: #64748b;
}

.olympiads-timeline__item--passed strong,
.olympiads-timeline__item--passed .olympiads-timeline__date,
.olympiads-timeline__item--passed p {
  color: #64748b;
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

@media (max-width: 720px) {
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
    scroll-margin-top: 82px;
  }

  .olympiads-strategy-grid {
    grid-template-columns: 1fr;
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