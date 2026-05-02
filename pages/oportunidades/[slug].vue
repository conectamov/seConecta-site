<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

useSeoMeta({ title: 'Oportunidades — seConecta' })

const route = useRoute()
const { get } = useAxios()

const CATEGORY_META: Record<string, {
  label: string
  icon: string
  color: string
  bg: string
  ring: string
  text: string
  dot: string
}> = {
  COMPETITION:     { label: 'Competição',       icon: '🏆', color: '#f59e0b', bg: 'bg-amber-50',   ring: 'ring-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-400' },
  OLYMPIAD:        { label: 'Olimpíada',         icon: '🔬', color: '#10b981', bg: 'bg-emerald-50', ring: 'ring-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  MUN:             { label: 'MUN',               icon: '🌐', color: '#6366f1', bg: 'bg-indigo-50',  ring: 'ring-indigo-200',  text: 'text-indigo-700',  dot: 'bg-indigo-400' },
  SCHOLARSHIP:     { label: 'Bolsa de estudos',  icon: '🎓', color: '#8b5cf6', bg: 'bg-violet-50',  ring: 'ring-violet-200',  text: 'text-violet-700',  dot: 'bg-violet-400' },
  SUMMER_PROGRAM:  { label: 'Programa de verão', icon: '☀️', color: '#0ea5e9', bg: 'bg-sky-50',     ring: 'ring-sky-200',     text: 'text-sky-700',     dot: 'bg-sky-400' },
  WORKSHOP:        { label: 'Workshop',          icon: '🛠️', color: '#ec4899', bg: 'bg-pink-50',    ring: 'ring-pink-200',    text: 'text-pink-700',    dot: 'bg-pink-400' },
  VOLUNTEERING:    { label: 'Voluntariado',      icon: '🤝', color: '#14b8a6', bg: 'bg-teal-50',    ring: 'ring-teal-200',    text: 'text-teal-700',    dot: 'bg-teal-400' },
  EXTRACURRICULAR: { label: 'Extracurricular',   icon: '⚡', color: '#f97316', bg: 'bg-orange-50',  ring: 'ring-orange-200',  text: 'text-orange-700',  dot: 'bg-orange-400' },
  INITIATIVE:      { label: 'Iniciativa',        icon: '💡', color: '#84cc16', bg: 'bg-lime-50',    ring: 'ring-lime-200',    text: 'text-lime-700',    dot: 'bg-lime-400' },
  POST:            { label: 'Post',              icon: '📌', color: '#6b7280', bg: 'bg-zinc-50',    ring: 'ring-zinc-200',    text: 'text-zinc-600',    dot: 'bg-zinc-400' },
}

const PRIORITY_LABEL: Record<number, { label: string; color: string; glow: string }> = {
  5: { label: 'Melhores oportunidades', color: '#f59e0b', glow: 'rgba(245,158,11,0.28)' },
  4: { label: 'Em destaque', color: '#10b981', glow: 'rgba(16,185,129,0.24)' },
  3: { label: 'Destaque', color: '#6366f1', glow: 'rgba(99,102,241,0.20)' },
  2: { label: 'Recomendado', color: '#0ea5e9', glow: 'rgba(14,165,233,0.18)' },
  1: { label: 'Relevante', color: '#a78bfa', glow: 'rgba(167,139,250,0.14)' },
  0: { label: '', color: '', glow: '' },
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

function debounce<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
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

function getTimelineLabel(event: any) {
  return (
    event?.details ??
    event?.description ??
    event?.label ??
    event?.title ??
    event?.name ??
    event?.event ??
    'Evento'
  )
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

function shouldShowTimelineEventOnCalendar(event: any) {
  // Regra estrita:
  // Só aparece no calendário se o dado vier explicitamente como true.
  // Eventos antigos sem show_on_calendar NÃO devem ser inferidos por palavras como "deadline".
  if (!event || typeof event !== 'object') return false

  return event.show_on_calendar === true || event.show_on_calendar === 'true'
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
    .map(event => ({
      ...event,
      label: event.label ?? event.details ?? event.title ?? event.name ?? 'Evento',
      details: event.details ?? event.description ?? null,
      show_on_calendar: shouldShowTimelineEventOnCalendar(event),
    }))
}

function normalizeTags(value: any) {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.filter(Boolean)
    } catch {}
    return value.split(',').map(tag => tag.trim()).filter(Boolean)
  }
  return []
}

function getFirstCalendarRelevantTimelineEvent(timeline: any[]) {
  const now = new Date()

  return [...timeline]
    .map((event) => ({ ...event, _date: parseLocalDate(event?.date) }))
    .filter((event) => event.show_on_calendar === true)
    .filter((event) => event._date && event._date >= now)
    .sort((a, b) => a._date.getTime() - b._date.getTime())[0] ?? null
}

function getDeadlinePrefix(event: any) {
  const text = [
    event?.label,
    event?.details,
    event?.description,
    event?.title,
    event?.name,
  ].filter(Boolean).join(' ').toLowerCase()

  if (text.includes('prova') || text.includes('exame')) return 'Prova em'
  if (text.includes('resultado')) return 'Resultado em'
  if (text.includes('envio') || text.includes('submiss')) return 'Envio até'
  if (text.includes('candidatura') || text.includes('application') || text.includes('apply')) return 'Candidatura até'
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

function makeInfoCard(key: string, value: any) {
  const label = toTextValue(value)
  if (!label) return null

  return {
    title: CATEGORY_DATA_LABELS[key] ?? key.replaceAll('_', ' '),
    label,
  }
}

function getCategoryDataCards(item: any) {
  const data = item?.category_data ?? {}
  const cards: Array<{ title: string; label: string }> = []

  for (const key of CATEGORY_DATA_ORDER) {
    const card = makeInfoCard(key, data[key])
    if (card) cards.push(card)
  }

  const specifics = data.specifics ?? {}

  for (const key of SPECIFICS_ORDER) {
    const card = makeInfoCard(key, specifics[key])
    if (card) cards.push(card)
  }

  return cards.filter(card => card.title !== 'Tipo')
}

function getCardHighlights(item: any) {
  const priorityTitles = [
    'Organizador',
    'Público-alvo',
    'Custo',
    'Formato',
    'Prêmios',
    'Etapas',
    'Máx. palavras',
  ]

  return getCategoryDataCards(item)
    .filter(card => priorityTitles.includes(card.title))
    .slice(0, 2)
}

function getReferenceLinks(item: any) {
  const refs = normalizeJsonObject(item?.category_data).references
  return Array.isArray(refs) ? refs.filter((ref) => ref?.url) : []
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

function normalize(o: any) {
  const meta = CATEGORY_META[o.category] ?? CATEGORY_META.POST
  const timeline = normalizeTimeline(o.timeline)
  const categoryData = normalizeJsonObject(o.category_data)
  const nextTimelineEvent = getFirstCalendarRelevantTimelineEvent(timeline)
  const displayDeadlineRaw = nextTimelineEvent?.date ?? (timeline.length === 0 ? o.next_deadline : null)
  const deadline = formatDeadline(displayDeadlineRaw)
  const deadlineActionLabel = formatActionDeadline(nextTimelineEvent, displayDeadlineRaw)
  const priority = typeof o.priority === 'number' ? Math.min(5, Math.max(0, o.priority)) : 0

  return {
    id: o.id,
    slug: o.slug ?? null,
    title: o.title,
    excerpt: o.excerpt ?? o.description?.slice(0, 160) ?? '',
    description: o.description ?? '',
    category: o.category,
    categoryMeta: meta,
    cover_url: o.cover_url ?? null,
    official_site_url: o.official_site_url ?? null,
    location: o.location ?? 'Online',
    is_free: !!o.is_free,
    next_deadline: displayDeadlineRaw,
    next_timeline_event: nextTimelineEvent,
    deadline,
    deadlineActionLabel,
    timeline,
    tags: normalizeTags(o.tags),
    category_data: categoryData,
    human_verified: !!o.human_verified,
    priority,
    priorityMeta: PRIORITY_LABEL[priority],
    created_at: o.created_at,
    updated_at: o.updated_at,
  }
}

const opportunities = ref<any[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref<string | null>(null)
const totalCount = ref(0)
const currentPage = ref(1)
const PAGE_SIZE = 24

const selectedItem = ref<any | null>(null)
const search = ref('')
const activeCategories = ref<string[]>([])
const freeOnly = ref(false)
const onlineOnly = ref(false)
const quickFilter = ref<'open' | 'urgent' | 'noDeadline' | ''>('')
const sideFiltersOpen = ref(false)
const sideFiltersRef = ref<HTMLElement | null>(null)
const pendingOpenSlug = ref<string | null>(null)
const openingFromSlug = ref(false)

const currentUser = ref<any | null>(null)
const isAdmin = computed(() => !!(currentUser.value?.is_superuser || currentUser.value?.is_manager))

async function fetchCurrentUser() {
  try {
    const res = await get('/users/me')
    currentUser.value = res.data
  } catch {
    currentUser.value = null
  }
}

async function fetchOpportunities(reset = true) {
  if (reset) {
    currentPage.value = 1
    loading.value = true
  } else {
    loadingMore.value = true
  }

  error.value = null

  try {
    const clientCategoryFilter = activeCategories.value.length !== 1

    const params: Record<string, any> = {
      page: currentPage.value,
      limit: clientCategoryFilter ? 100 : PAGE_SIZE,
    }

    if (search.value.trim()) params.search = search.value.trim()

    // Backend aceita uma categoria por vez. Com múltiplas categorias — ou Todos,
    // que aqui exclui OLYMPIAD — buscamos um lote maior e filtramos no client.
    if (activeCategories.value.length === 1) {
      params.category = activeCategories.value[0]
    }

    if (freeOnly.value) params.is_free = true
    if (onlineOnly.value) params.location = 'Online'

    const res = await get('/opportunity/', { params })
    const data = res.data?.data ?? []
    const count = res.data?.count ?? 0
    const normalized = data.map(normalize)

    if (reset) {
      opportunities.value = normalized
      totalCount.value = count
    } else {
      opportunities.value.push(...normalized)
    }

    if (pendingOpenSlug.value) {
      await openOpportunityBySlug(pendingOpenSlug.value)
    }
  } catch (e: any) {
    error.value = e?.response?.data?.detail || e?.message || 'Erro ao carregar oportunidades.'
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function loadMore() {
  if (!hasMore.value || loadingMore.value) return
  currentPage.value++
  await fetchOpportunities(false)
}

async function openOpportunityBySlug(slug: string | null) {
  const cleanSlug = String(slug || '').trim()
  if (!cleanSlug) return

  const local = opportunities.value.find(item => item.slug === cleanSlug)

  if (local) {
    selectedItem.value = local
    pendingOpenSlug.value = null
    return
  }

  try {
    openingFromSlug.value = true

    const res = await get(`/opportunity/slug/${encodeURIComponent(cleanSlug)}`)
    const item = normalize(res.data)

    if (item?.category && !activeCategories.value.includes(item.category)) {
      activeCategories.value = [item.category]
    }

    if (!opportunities.value.some(existing => existing.id === item.id)) {
      opportunities.value = [item, ...opportunities.value]
    }

    selectedItem.value = item
    pendingOpenSlug.value = null
  } catch (e) {
    console.warn('Could not open opportunity from slug:', cleanSlug, e)
  } finally {
    openingFromSlug.value = false
  }
}

function clearFilters() {
  search.value = ''
  activeCategories.value = []
  freeOnly.value = false
  onlineOnly.value = false
  quickFilter.value = ''
  sideFiltersOpen.value = false
  fetchOpportunities(true)
}

function handleAddOpportunity() {
  navigateTo('/new-opportunity')
}

function handleEditOpportunity(item: any) {
  const id = Number(item?.id)

  if (!Number.isInteger(id) || id <= 0) {
    console.warn("Opportunity without valid id:", item)
    return
  }

  navigateTo(`/oportunidades/edit/${id}`)
}


function toggleTypeFilter(value: string) {
  if (!value) {
    activeCategories.value = []
    return
  }

  if (activeCategories.value.includes(value)) {
    activeCategories.value = activeCategories.value.filter(category => category !== value)
    return
  }

  activeCategories.value = [...activeCategories.value, value]
}

function toggleQuickFilter(value: 'open' | 'urgent' | 'noDeadline') {
  quickFilter.value = quickFilter.value === value ? '' : value
}

function setDeadlineFilter(value: 'open' | 'urgent' | 'noDeadline' | '') {
  quickFilter.value = value
}

function closeSideFiltersOnOutside(event: MouseEvent) {
  if (!sideFiltersOpen.value) return

  const target = event.target as Node | null
  if (sideFiltersRef.value && target && !sideFiltersRef.value.contains(target)) {
    sideFiltersOpen.value = false
  }
}

const activeDeadlineLabel = computed(() => {
  const map: Record<string, string> = {
    open: 'Inscrições abertas',
    urgent: 'Fecham em 7 dias',
    noDeadline: 'Sem prazo ativo',
  }

  return quickFilter.value ? map[quickFilter.value] : 'Qualquer prazo'
})

const sideFiltersCount = computed(() => {
  return (quickFilter.value ? 1 : 0) + (onlineOnly.value ? 1 : 0) + (freeOnly.value ? 1 : 0)
})

function itemMatchesQuickFilter(item: any) {
  if (!quickFilter.value) return true

  if (quickFilter.value === 'open') {
    return !!item.next_deadline && item.deadline.overdue === false
  }

  if (quickFilter.value === 'urgent') {
    return item.deadline.daysLeft !== null && item.deadline.daysLeft >= 0 && item.deadline.daysLeft <= 7
  }

  if (quickFilter.value === 'noDeadline') {
    return !item.next_deadline
  }

  return true
}

watch(search, debounce(() => fetchOpportunities(true), 400))
watch(activeCategories, () => fetchOpportunities(true), { deep: true })
watch(freeOnly, () => fetchOpportunities(true))
watch(onlineOnly, () => fetchOpportunities(true))

watch(selectedItem, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
})

onMounted(async () => {
  document.addEventListener('click', closeSideFiltersOnOutside)

  const queryCategory = typeof route.query.category === 'string'
    ? route.query.category
    : ''

  const queryOpen = typeof route.query.open === 'string'
    ? route.query.open
    : ''

  if (queryCategory) {
    activeCategories.value = [queryCategory]
  }

  if (queryOpen) {
    pendingOpenSlug.value = queryOpen
  }

  await fetchCurrentUser()
  await fetchOpportunities(true)
})

onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('click', closeSideFiltersOnOutside)
})

const filtered = computed(() => {
  const visible = isAdmin.value
    ? opportunities.value
    : opportunities.value.filter(item => item.human_verified === true)

  return visible
    .filter(item => {
      // A página geral não mostra olimpíadas no primeiro "Todos".
      // Olimpíadas vivem na página /olimpiadas e só aparecem aqui se o usuário filtrar explicitamente.
      if (activeCategories.value.length === 0) return item.category !== 'OLYMPIAD'
      return activeCategories.value.includes(item.category)
    })
    .filter(itemMatchesQuickFilter)
})

const displayCount = computed(() => {
  const clientFiltered = quickFilter.value || activeCategories.value.length !== 1
  return clientFiltered ? filtered.value.length : totalCount.value
})

const hasMore = computed(() => {
  const clientFiltered = quickFilter.value || activeCategories.value.length !== 1
  return !clientFiltered && opportunities.value.length < totalCount.value
})

const activeFilters = computed(
  () => (search.value ? 1 : 0) + (activeCategories.value.length ? 1 : 0) + (freeOnly.value ? 1 : 0) + (onlineOnly.value ? 1 : 0) + (quickFilter.value ? 1 : 0)
)
const filtersActive = computed(() => activeFilters.value > 0)

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

// Prioridade visual:
// 5 → seção horizontal "Escolhas editoriais". Nunca vira banner gigante único.
// 4 → seção horizontal "Prioridade alta".
// 3 → permanece no grid com badge "Destaque".
// 2 → permanece no grid com badge "Recomendado".
// 1 → apenas ordena acima do normal, sem poluir visualmente.
// 0 → normal.
const editorialItems = computed(() =>
  filtersActive.value ? [] : prioritySort(filtered.value.filter(o => o.priority === 5))
)

const highPriorityItems = computed(() =>
  filtersActive.value ? [] : prioritySort(filtered.value.filter(o => o.priority === 4))
)

const gridItems = computed(() => {
  if (filtersActive.value) return prioritySort(filtered.value)
  return prioritySort(filtered.value.filter(o => o.priority <= 3))
})

const hasPrioritySections = computed(() =>
  editorialItems.value.length > 0 || highPriorityItems.value.length > 0
)

const CATEGORY_SECTION_ORDER = [
  'COMPETITION',
  'SCHOLARSHIP',
  'SUMMER_PROGRAM',
  'MUN',
  'WORKSHOP',
  'VOLUNTEERING',
  'EXTRACURRICULAR',
  'INITIATIVE',
  'POST',
]

const shouldSplitByCategory = computed(() => {
  // A divisão por categoria funciona melhor na primeira visão "Todos".
  // Quando o usuário busca/filtra, voltamos para uma lista única para não fragmentar demais.
  return (
    activeCategories.value.length === 0 &&
    !search.value.trim() &&
    !quickFilter.value &&
    !freeOnly.value &&
    !onlineOnly.value
  )
})

const categorySections = computed(() => {
  if (!shouldSplitByCategory.value) return []

  return CATEGORY_SECTION_ORDER
    .map(category => {
      const meta = CATEGORY_META[category]
      const items = gridItems.value.filter(item => item.category === category)

      return {
        category,
        title: meta?.label ?? category,
        icon: meta?.icon ?? '✨',
        color: meta?.color ?? '#10b981',
        items,
      }
    })
    .filter(section => section.items.length > 0)
})

const showCategorySections = computed(() => categorySections.value.length > 0)
</script>

<template>
  <div class="opp-page">
    <section class="opp-hero">
      <div class="opp-hero__noise" aria-hidden="true"></div>
      <div class="opp-hero__glow opp-hero__glow--a" aria-hidden="true"></div>
      <div class="opp-hero__glow opp-hero__glow--b" aria-hidden="true"></div>

      <div class="opp-hero__inner">
        <div class="opp-hero__eyebrow">
          <span class="opp-hero__dot"></span>
          Atualizado em tempo real
        </div>

        <h1 class="opp-hero__title">
          Encontre sua próxima
          <em class="opp-hero__em">oportunidade</em>
        </h1>

        <p class="opp-hero__sub">
          Bolsas, olimpíadas, workshops e muito mais — curado para estudantes do ensino médio e fundamental.
        </p>

        <div class="opp-search">
          <svg class="opp-search__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
          <input
            v-model="search"
            type="search"
            placeholder="Buscar por nome, área, tags…"
            class="opp-search__input"
          />
          <button v-if="search" @click="search = ''" class="opp-search__clear" aria-label="Limpar">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p class="opp-hero__cta-hint">
          Não encontrou?
          <button @click="handleAddOpportunity" class="opp-hero__cta-link">Sugira uma oportunidade →</button>
        </p>
      </div>
    </section>

    <div class="opp-body">
      <div class="opp-filters">
        <div class="opp-filters__inner">
          <div class="opp-type-pills" aria-label="Filtros de tipo">
            <button
              type="button"
              @click="toggleTypeFilter('')"
              :class="['opp-pill', activeCategories.length === 0 && 'opp-pill--active']"
            >
              Todos
            </button>

            <button
              v-for="(meta, key) in CATEGORY_META"
              :key="key"
              type="button"
              @click="toggleTypeFilter(String(key))"
              :class="['opp-pill', activeCategories.includes(String(key)) && 'opp-pill--active']"
              :title="String(key) === 'OLYMPIAD' ? 'Olimpíadas têm uma página própria em /olimpiadas' : meta.label"
            >
              <span>{{ meta.icon }}</span> {{ meta.label }}
            </button>
          </div>

          <div class="opp-filters__right" ref="sideFiltersRef">
            <button
              type="button"
              class="opp-side-filter-btn"
              :class="{ 'opp-side-filter-btn--active': sideFiltersOpen || sideFiltersCount > 0 }"
              @click="sideFiltersOpen = !sideFiltersOpen"
            >
              Filtros
              <span v-if="sideFiltersCount > 0">{{ sideFiltersCount }}</span>
            </button>

            <div v-if="sideFiltersOpen" class="opp-side-filter-panel">
              <div class="opp-side-filter-section">
                <span class="opp-side-filter-title">Prazo</span>

                <button
                  type="button"
                  class="opp-side-option"
                  :class="{ 'opp-side-option--active': !quickFilter }"
                  @click="setDeadlineFilter('')"
                >
                  Qualquer prazo
                </button>

                <button
                  type="button"
                  class="opp-side-option"
                  :class="{ 'opp-side-option--active': quickFilter === 'open' }"
                  @click="setDeadlineFilter('open')"
                >
                  Inscrições abertas
                </button>

                <button
                  type="button"
                  class="opp-side-option"
                  :class="{ 'opp-side-option--active': quickFilter === 'urgent' }"
                  @click="setDeadlineFilter('urgent')"
                >
                  Fecham em 7 dias
                </button>

                <button
                  type="button"
                  class="opp-side-option"
                  :class="{ 'opp-side-option--active': quickFilter === 'noDeadline' }"
                  @click="setDeadlineFilter('noDeadline')"
                >
                  Sem prazo ativo
                </button>
              </div>

              <div class="opp-side-filter-section">
                <span class="opp-side-filter-title">Preferências</span>

                <label class="opp-side-toggle">
                  <input v-model="onlineOnly" type="checkbox" />
                  <span>Online</span>
                </label>

                <label class="opp-side-toggle">
                  <input v-model="freeOnly" type="checkbox" />
                  <span>Gratuito</span>
                </label>
              </div>

              <button
                v-if="sideFiltersCount > 0"
                type="button"
                class="opp-side-clear"
                @click="onlineOnly = false; freeOnly = false; quickFilter = ''"
              >
                Limpar filtros laterais
              </button>
            </div>

            <svg v-if="loading" class="opp-spinner" fill="none" viewBox="0 0 24 24">
              <circle class="opp-spinner__track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opp-spinner__fill" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>

            <span class="opp-count">
              {{ displayCount.toLocaleString('pt-BR') }} resultado{{ displayCount !== 1 ? 's' : '' }}
            </span>

            <button v-if="activeFilters > 0" @click="clearFilters" class="opp-clear">
              Limpar
            </button>
          </div>
        </div>
      </div>

      <main class="opp-main">
        <div v-if="error && !loading" class="opp-state">
          <div class="opp-state__icon opp-state__icon--error">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <p class="opp-state__title">Erro ao carregar oportunidades</p>
          <p class="opp-state__sub">{{ error }}</p>
          <button @click="fetchOpportunities(true)" class="opp-btn opp-btn--primary">Tentar novamente</button>
        </div>

        <div v-else-if="!loading && !error && filtered.length === 0" class="opp-state">
          <div class="opp-state__icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
            </svg>
          </div>
          <p class="opp-state__title">Nenhuma oportunidade encontrada</p>
          <p class="opp-state__sub">Tente outros termos ou remova os filtros aplicados.</p>
          <button @click="clearFilters" class="opp-btn opp-btn--primary">Limpar filtros</button>
        </div>

        <div v-else-if="loading && filtered.length === 0" class="opp-grid">
          <div v-for="i in 9" :key="i" class="opp-skeleton"></div>
        </div>

        <div v-if="editorialItems.length > 0" class="opp-priority-section">
          <div class="opp-section-header">
            <div class="opp-section-header__bar opp-section-header__bar--editorial"></div>
            <h2 class="opp-section-header__title">Melhores oportunidades</h2>
            <span class="opp-section-header__count">{{ editorialItems.length }}</span>
          </div>

          <div class="opp-editorial-row">
            <article
              v-for="item in editorialItems"
              :key="item.id"
              class="opp-editorial-card"
              @click="selectedItem = item"
              role="button"
              tabindex="0"
              @keydown.enter="selectedItem = item"
            >
              <div class="opp-editorial-card__cover">
                <img
                  v-if="item.cover_url"
                  :src="item.cover_url"
                  :alt="item.title"
                  class="opp-editorial-card__img"
                  loading="lazy"
                />
                <div
                  v-else
                  class="opp-editorial-card__fallback"
                  :style="{ background: `linear-gradient(135deg, ${item.categoryMeta.color}28, ${item.categoryMeta.color}08)` }"
                >
                  <span>{{ item.categoryMeta.icon }}</span>
                </div>

                <div class="opp-editorial-card__overlay"></div>

                <div class="opp-editorial-card__badges">
                  <span class="opp-editorial-card__pick">★ Oportunidade de ouro</span>
                  <button
                    v-if="isAdmin"
                    @click.stop="handleEditOpportunity(item)"
                    class="opp-edit-btn opp-edit-btn--dark"
                  >
                    Editar
                  </button>
                </div>

                <div
                  v-if="item.next_deadline"
                  class="opp-editorial-card__deadline"
                  :class="{ 'opp-editorial-card__deadline--urgent': item.deadline.urgent }"
                >
                  {{ item.deadlineActionLabel }}
                </div>
              </div>

              <div class="opp-editorial-card__body">
                <div class="opp-editorial-card__meta">
                  <span
                    class="opp-badge"
                    :style="{ background: item.categoryMeta.color + '18', color: item.categoryMeta.color, border: `1px solid ${item.categoryMeta.color}35` }"
                  >
                    {{ item.categoryMeta.icon }} {{ item.categoryMeta.label }}
                  </span>
                  <span v-if="item.is_free" class="opp-badge opp-badge--free">Gratuito</span>
                </div>

                <h3 class="opp-editorial-card__title">{{ item.title }}</h3>
                <p class="opp-editorial-card__excerpt">{{ item.excerpt }}</p>
              </div>
            </article>
          </div>
        </div>

        <div v-if="highPriorityItems.length > 0" class="opp-featured-section">
          <div class="opp-section-header">
            <div class="opp-section-header__bar"></div>
            <h2 class="opp-section-header__title">Em destaque</h2>
            <span class="opp-section-header__count">{{ highPriorityItems.length }}</span>
          </div>

          <div class="opp-featured-row">
            <article
              v-for="item in highPriorityItems"
              :key="item.id"
              class="opp-featured-card"
              @click="selectedItem = item"
              role="button"
              tabindex="0"
              @keydown.enter="selectedItem = item"
            >
              <div class="opp-featured-card__cover">
                <img v-if="item.cover_url" :src="item.cover_url" :alt="item.title" class="opp-card__img" loading="lazy" />
                <div
                  v-else
                  class="opp-card__cover-fallback"
                  :style="{ background: `linear-gradient(135deg, ${item.categoryMeta.color}25, ${item.categoryMeta.color}08)` }"
                >
                  <span class="opp-card__cover-emoji">{{ item.categoryMeta.icon }}</span>
                </div>

                <div class="opp-featured-card__glow-ring" :style="{ '--glow': item.priorityMeta.glow }"></div>

                <div class="opp-card__badges">
                  <span
                    class="opp-badge"
                    :style="{ background: item.categoryMeta.color + '22', color: item.categoryMeta.color, border: `1px solid ${item.categoryMeta.color}44` }"
                  >
                    {{ item.categoryMeta.icon }} {{ item.categoryMeta.label }}
                  </span>
                  <button
                    v-if="isAdmin"
                    @click.stop="handleEditOpportunity(item)"
                    class="opp-edit-btn"
                  >
                    Editar
                  </button>
                </div>

                <div class="opp-featured-card__priority-chip" :style="{ background: item.priorityMeta.color }">
                  {{ item.priorityMeta.label }}
                </div>

                <div
                  v-if="item.next_deadline"
                  class="opp-card__deadline"
                  :class="{ 'opp-card__deadline--urgent': item.deadline.urgent, 'opp-card__deadline--overdue': item.deadline.overdue }"
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                  </svg>
                  {{ item.deadlineActionLabel }}
                </div>
              </div>

              <div class="opp-card__body">
                <h3 class="opp-card__title">{{ item.title }}</h3>
                <p class="opp-card__excerpt">{{ item.excerpt }}</p>

                <div class="opp-card__meta">
                  <span class="opp-meta-chip">{{ item.location }}</span>
                  <span v-if="item.is_free" class="opp-meta-chip opp-meta-chip--free">Gratuito</span>
                </div>
              </div>
            </article>
          </div>
        </div>

        <template v-if="showCategorySections">
          <section
            v-for="section in categorySections"
            :key="section.category"
            class="opp-category-section"
          >
            <div class="opp-section-header" style="margin-bottom: 14px;">
              <div class="opp-section-header__bar" :style="{ background: section.color }"></div>
              <h2 class="opp-section-header__title">
                <span>{{ section.icon }}</span>
                {{ section.title }}
              </h2>
              <span class="opp-section-header__count">{{ section.items.length }}</span>
            </div>

            <div class="opp-category-row">
          <article
            v-for="item in section.items"
            :key="item.id"
            class="opp-card"
            :class="{
              'opp-card--urgent': item.deadline.urgent,
              'opp-card--overdue': item.deadline.overdue,
              'opp-card--priority': item.priority >= 2 && item.priority <= 3
            }"
            @click="selectedItem = item"
            role="button"
            tabindex="0"
            @keydown.enter="selectedItem = item"
          >
            <div class="opp-card__cover">
              <img
                v-if="item.cover_url"
                :src="item.cover_url"
                :alt="item.title"
                class="opp-card__img"
                loading="lazy"
              />
              <div
                v-else
                class="opp-card__cover-fallback"
                :style="{ background: `linear-gradient(135deg, ${item.categoryMeta.color}22, ${item.categoryMeta.color}08)` }"
              >
                <span class="opp-card__cover-emoji">{{ item.categoryMeta.icon }}</span>
              </div>

              <div class="opp-card__badges">
                <span
                  class="opp-badge"
                  :style="{ background: item.categoryMeta.color + '22', color: item.categoryMeta.color, border: `1px solid ${item.categoryMeta.color}44` }"
                >
                  {{ item.categoryMeta.icon }} {{ item.categoryMeta.label }}
                </span>

                <span v-if="item.human_verified" class="opp-badge opp-badge--verified" title="Verificado pela equipe seConecta">
                  ✓ Verificado
                </span>

                <span v-else-if="isAdmin" class="opp-badge opp-badge--pending" title="Ainda não verificado">
                  Pendente
                </span>

                <button
                  v-if="isAdmin"
                  @click.stop="handleEditOpportunity(item)"
                  class="opp-edit-btn"
                >
                  Editar
                </button>
              </div>

              <div
                v-if="item.priority >= 2 && item.priority <= 3"
                class="opp-card__priority-strip"
                :style="{
                  background: item.priorityMeta.color + '15',
                  color: item.priorityMeta.color,
                  borderColor: item.priorityMeta.color + '35'
                }"
              >
                ★ {{ item.priorityMeta.label }}
              </div>

              <div
                v-if="item.next_deadline"
                class="opp-card__deadline"
                :class="{
                  'opp-card__deadline--urgent': item.deadline.urgent,
                  'opp-card__deadline--overdue': item.deadline.overdue
                }"
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                </svg>
                {{ item.deadlineActionLabel }}
              </div>
            </div>

            <div class="opp-card__body">
              <h3 class="opp-card__title">{{ item.title }}</h3>
              <p class="opp-card__excerpt">{{ item.excerpt }}</p>

              <div v-if="getCardHighlights(item).length > 0" class="opp-card__facts">
                <div v-for="fact in getCardHighlights(item)" :key="fact.title" class="opp-card__fact">
                  <span>{{ fact.title }}</span>
                  <strong>{{ fact.label }}</strong>
                </div>
              </div>

              <div class="opp-card__meta">
                <span class="opp-meta-chip">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {{ item.location }}
                </span>

                <span v-if="item.is_free" class="opp-meta-chip opp-meta-chip--free">
                  Gratuito
                </span>
              </div>

              <div v-if="item.tags.length > 0" class="opp-card__tags">
                <span v-for="tag in item.tags.slice(0, 3)" :key="tag" class="opp-tag">{{ tag }}</span>
                <span v-if="item.tags.length > 3" class="opp-tag opp-tag--more">+{{ item.tags.length - 3 }}</span>
              </div>

              <div class="opp-card__action">Ver detalhes →</div>
            </div>
          </article>
            </div>
          </section>
        </template>

        <template v-else>
        <div v-if="gridItems.length > 0 && hasPrioritySections" class="opp-section-header" style="margin-bottom: 16px;">
          <div class="opp-section-header__bar"></div>
          <h2 class="opp-section-header__title">Todas as oportunidades</h2>
          <span class="opp-section-header__count">{{ gridItems.length }}</span>
        </div>

        <div v-if="gridItems.length > 0" class="opp-grid">
          <article
            v-for="item in gridItems"
            :key="item.id"
            class="opp-card"
            :class="{
              'opp-card--urgent': item.deadline.urgent,
              'opp-card--overdue': item.deadline.overdue,
              'opp-card--priority': item.priority >= 2 && item.priority <= 3
            }"
            @click="selectedItem = item"
            role="button"
            tabindex="0"
            @keydown.enter="selectedItem = item"
          >
            <div class="opp-card__cover">
              <img
                v-if="item.cover_url"
                :src="item.cover_url"
                :alt="item.title"
                class="opp-card__img"
                loading="lazy"
              />
              <div
                v-else
                class="opp-card__cover-fallback"
                :style="{ background: `linear-gradient(135deg, ${item.categoryMeta.color}22, ${item.categoryMeta.color}08)` }"
              >
                <span class="opp-card__cover-emoji">{{ item.categoryMeta.icon }}</span>
              </div>

              <div class="opp-card__badges">
                <span
                  class="opp-badge"
                  :style="{ background: item.categoryMeta.color + '22', color: item.categoryMeta.color, border: `1px solid ${item.categoryMeta.color}44` }"
                >
                  {{ item.categoryMeta.icon }} {{ item.categoryMeta.label }}
                </span>

                <span v-if="item.human_verified" class="opp-badge opp-badge--verified" title="Verificado pela equipe seConecta">
                  ✓ Verificado
                </span>

                <span v-else-if="isAdmin" class="opp-badge opp-badge--pending" title="Ainda não verificado">
                  Pendente
                </span>

                <button
                  v-if="isAdmin"
                  @click.stop="handleEditOpportunity(item)"
                  class="opp-edit-btn"
                >
                  Editar
                </button>
              </div>

              <div
                v-if="item.priority >= 2 && item.priority <= 3"
                class="opp-card__priority-strip"
                :style="{
                  background: item.priorityMeta.color + '15',
                  color: item.priorityMeta.color,
                  borderColor: item.priorityMeta.color + '35'
                }"
              >
                ★ {{ item.priorityMeta.label }}
              </div>

              <div
                v-if="item.next_deadline"
                class="opp-card__deadline"
                :class="{
                  'opp-card__deadline--urgent': item.deadline.urgent,
                  'opp-card__deadline--overdue': item.deadline.overdue
                }"
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                </svg>
                {{ item.deadlineActionLabel }}
              </div>
            </div>

            <div class="opp-card__body">
              <h3 class="opp-card__title">{{ item.title }}</h3>
              <p class="opp-card__excerpt">{{ item.excerpt }}</p>

              <div v-if="getCardHighlights(item).length > 0" class="opp-card__facts">
                <div v-for="fact in getCardHighlights(item)" :key="fact.title" class="opp-card__fact">
                  <span>{{ fact.title }}</span>
                  <strong>{{ fact.label }}</strong>
                </div>
              </div>

              <div class="opp-card__meta">
                <span class="opp-meta-chip">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {{ item.location }}
                </span>

                <span v-if="item.is_free" class="opp-meta-chip opp-meta-chip--free">
                  Gratuito
                </span>
              </div>

              <div v-if="item.tags.length > 0" class="opp-card__tags">
                <span v-for="tag in item.tags.slice(0, 3)" :key="tag" class="opp-tag">{{ tag }}</span>
                <span v-if="item.tags.length > 3" class="opp-tag opp-tag--more">+{{ item.tags.length - 3 }}</span>
              </div>

              <div class="opp-card__action">Ver detalhes →</div>
            </div>
          </article>
        </div>


        </template>

        <div v-if="hasMore" class="opp-load-more">
          <button @click="loadMore" :disabled="loadingMore" class="opp-btn opp-btn--ghost">
            <svg v-if="loadingMore" class="opp-spinner opp-spinner--sm" fill="none" viewBox="0 0 24 24">
              <circle class="opp-spinner__track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opp-spinner__fill" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            {{ loadingMore ? 'Carregando…' : `Carregar mais (${totalCount - opportunities.length} restantes)` }}
          </button>
        </div>
      </main>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="selectedItem" class="opp-modal-backdrop" @click.self="selectedItem = null">
          <div class="opp-modal" role="dialog" :aria-label="selectedItem.title">
            <div class="opp-modal__cover">
              <img
                v-if="selectedItem.cover_url"
                :src="selectedItem.cover_url"
                :alt="selectedItem.title"
                class="opp-modal__cover-img"
              />
              <div
                v-else
                class="opp-modal__cover-fallback"
                :style="{ background: `linear-gradient(135deg, ${selectedItem.categoryMeta.color}33, ${selectedItem.categoryMeta.color}11)` }"
              >
                <span style="font-size: 3rem">{{ selectedItem.categoryMeta.icon }}</span>
              </div>
              <div class="opp-modal__cover-overlay"></div>

              <button @click="selectedItem = null" class="opp-modal__close" aria-label="Fechar">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <button
                v-if="isAdmin"
                @click="handleEditOpportunity(selectedItem)"
                class="opp-modal__edit"
              >
                Editar
              </button>
            </div>

            <div class="opp-modal__body">
              <div class="opp-modal__header">
                <div class="opp-modal__badges">
                  <span
                    class="opp-badge"
                    :style="{ background: selectedItem.categoryMeta.color + '22', color: selectedItem.categoryMeta.color, border: `1px solid ${selectedItem.categoryMeta.color}44` }"
                  >
                    {{ selectedItem.categoryMeta.icon }} {{ selectedItem.categoryMeta.label }}
                  </span>
                  <span v-if="selectedItem.human_verified" class="opp-badge opp-badge--verified">✓ Verificado</span>
                  <span v-else-if="isAdmin" class="opp-badge opp-badge--pending">Pendente</span>
                  <span v-if="selectedItem.is_free" class="opp-badge opp-badge--free">Gratuito</span>
                  <span
                    v-if="selectedItem.priority >= 2"
                    class="opp-badge"
                    :style="{ background: selectedItem.priorityMeta.color + '18', color: selectedItem.priorityMeta.color, border: `1px solid ${selectedItem.priorityMeta.color}35` }"
                  >
                    ★ {{ selectedItem.priorityMeta.label }}
                  </span>
                </div>

                <h2 class="opp-modal__title">{{ selectedItem.title }}</h2>

                <div class="opp-modal__quick">
                  <div
                    v-if="selectedItem.next_deadline"
                    class="opp-modal__info-item"
                    :class="{ 'opp-modal__info-item--urgent': selectedItem.deadline.urgent, 'opp-modal__info-item--overdue': selectedItem.deadline.overdue }"
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                    </svg>
                    <span>{{ selectedItem.deadlineActionLabel }}</span>
                  </div>

                  <div v-else class="opp-modal__info-item opp-modal__info-item--muted">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Sem prazo acionável agora</span>
                  </div>

                  <div class="opp-modal__info-item">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{{ selectedItem.location }}</span>
                  </div>
                </div>
              </div>

              <div class="opp-modal__section">
                <h3 class="opp-modal__section-title">Sobre a oportunidade</h3>
                <p class="opp-modal__text">{{ selectedItem.description }}</p>
              </div>

              <div v-if="selectedItem.timeline.length > 0" class="opp-modal__section">
                <h3 class="opp-modal__section-title">Cronograma</h3>
                <div class="opp-timeline">
                  <div
                    v-for="(event, idx) in selectedItem.timeline"
                    :key="idx"
                    class="opp-timeline__item"
                    :class="{ 'opp-timeline__item--past': event.date && parseLocalDate(event.date) && parseLocalDate(event.date)! < new Date() }"
                  >
                    <div class="opp-timeline__dot"></div>
                    <div class="opp-timeline__content">
                      <span class="opp-timeline__label">{{ getTimelineLabel(event) }}</span>
                      <span v-if="event.date" class="opp-timeline__date">{{ fmtDate(event.date) }}</span>
                      <span v-if="event.show_on_calendar" class="opp-timeline__calendar-badge">Aparece no calendário</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="getCategoryDataCards(selectedItem).length > 0" class="opp-modal__section">
                <h3 class="opp-modal__section-title">Informações importantes</h3>

                <div class="opp-info-stack">
                  <article
                    v-for="card in getCategoryDataCards(selectedItem)"
                    :key="card.title"
                    class="opp-info-card"
                    :class="`opp-info-card--${getInfoVariant(card.title)}`"
                  >
                    <div class="opp-info-card__icon">
                      {{ getInfoIcon(card.title) }}
                    </div>

                    <div class="opp-info-card__content">
                      <span class="opp-info-card__title">
                        {{ card.title }}
                      </span>

                      <p
                        v-if="getCardLines(card).length === 1"
                        class="opp-info-card__text"
                      >
                        {{ getCardLines(card)[0] }}
                      </p>

                      <ul
                        v-else
                        class="opp-info-card__list"
                      >
                        <li
                          v-for="line in getCardLines(card)"
                          :key="line"
                        >
                          {{ line }}
                        </li>
                      </ul>
                    </div>
                  </article>
                </div>
              </div>


              
              <div v-if="getReferenceLinks(selectedItem).length > 0" class="opp-modal__section">
                <h3 class="opp-modal__section-title">Links de referência</h3>
                
                <div class="opp-reference-list">
                  <a
                  v-for="ref in getReferenceLinks(selectedItem)"
                    :key="ref.url"
                    :href="ref.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="opp-reference-card"
                  >
                  <span class="opp-reference-card__title">{{ ref.title || 'Referência' }}</span>
                    <span v-if="ref.description" class="opp-reference-card__desc">{{ ref.description }}</span>
                    <span class="opp-reference-card__url">{{ ref.source_type || 'link' }}</span>
                  </a>
                </div>
              </div>
              <div v-if="selectedItem.tags.length > 0" class="opp-modal__section">
                <h3 class="opp-modal__section-title">Tags</h3>
                <div class="opp-card__tags">
                  <span v-for="tag in selectedItem.tags" :key="tag" class="opp-tag">{{ tag }}</span>
                </div>
              </div>
              
              <div v-if="selectedItem.official_site_url" class="opp-modal__cta">
                <a
                  :href="selectedItem.official_site_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="opp-btn opp-btn--cta"
                >
                  Acessar site oficial
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;1,400&display=swap');

.opp-page { font-family: 'DM Sans', sans-serif; background: #fafaf9; min-height: 100vh; color: #1c1917; overflow-x: hidden; }
.opp-hero { position: relative; overflow: hidden; background: #0f1117; padding: 68px 24px 58px; display: flex; justify-content: center; }
.opp-hero__noise { position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E"); opacity: .6; pointer-events: none; }
.opp-hero__glow { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; opacity: .35; }
.opp-hero__glow--a { width: 500px; height: 500px; background: radial-gradient(circle, #10b981 0%, transparent 70%); top: -160px; left: 10%; }
.opp-hero__glow--b { width: 400px; height: 400px; background: radial-gradient(circle, #6366f1 0%, transparent 70%); bottom: -120px; right: 15%; }
.opp-hero__inner { position: relative; z-index: 1; max-width: 640px; width: 100%; text-align: center; }
.opp-hero__eyebrow { display: inline-flex; align-items: center; gap: 8px; font-family: 'Sora', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #6ee7b7; background: rgba(16, 185, 129, .1); border: 1px solid rgba(16, 185, 129, .2); padding: 5px 14px; border-radius: 100px; margin-bottom: 28px; }
.opp-hero__dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; animation: pulse-dot 2s ease-in-out infinite; }
@keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .5; transform: scale(.7); } }
.opp-hero__title { font-family: 'Sora', sans-serif; font-size: clamp(2rem, 5.5vw, 3.25rem); font-weight: 800; line-height: 1.06; letter-spacing: -.025em; color: #f9fafb; margin-bottom: 16px; }
.opp-hero__em { font-style: normal; background: linear-gradient(135deg, #34d399, #6ee7b7, #a7f3d0); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.opp-hero__sub { font-size: 15px; line-height: 1.65; color: #9ca3af; max-width: 420px; margin: 0 auto 32px; }
.opp-search { position: relative; max-width: 480px; margin: 0 auto; }
.opp-search__icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #6b7280; pointer-events: none; }
.opp-search__input { width: 100%; padding: 14px 44px; border-radius: 14px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); color: #f9fafb; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: all .2s; }
.opp-search__input::placeholder { color: #6b7280; }
.opp-search__input:focus { background: rgba(255,255,255,.09); border-color: rgba(16, 185, 129, .4); box-shadow: 0 0 0 3px rgba(16, 185, 129, .12); }
.opp-search__clear { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.08); border: none; border-radius: 50%; color: #9ca3af; cursor: pointer; transition: background .15s; }
.opp-search__clear:hover { background: rgba(255,255,255,.14); }
.opp-search__clear svg { width: 11px; height: 11px; }
.opp-hero__cta-hint { margin-top: 14px; font-size: 12px; color: #6b7280; }
.opp-hero__cta-link { color: #34d399; font-weight: 600; background: none; border: none; cursor: pointer; padding: 0; transition: color .15s; }
.opp-hero__cta-link:hover { color: #6ee7b7; }
.opp-body { background: #fafaf9; }
.opp-filters {
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(250,250,249,.94);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid #e7e5e4;
  overflow: hidden;
}

.opp-filters__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px 24px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 14px;
}

.opp-type-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 4px;
  scrollbar-width: thin;
  scrollbar-color: #d6d3d1 transparent;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  touch-action: pan-x;
}

.opp-type-pills::-webkit-scrollbar {
  height: 5px;
}

.opp-type-pills::-webkit-scrollbar-thumb {
  background: #d6d3d1;
  border-radius: 999px;
}

.opp-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 13px;
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid #e7e5e4;
  background: white;
  color: #78716c;
  cursor: pointer;
  white-space: nowrap;
  transition: all .15s;
  flex: 0 0 auto;
}

.opp-pill:hover {
  color: #1c1917;
  border-color: #d6d3d1;
}

.opp-pill--active {
  background: #1c1917;
  color: white;
  border-color: #1c1917;
}

.opp-filters__right {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

.opp-side-filter-btn {
  height: 34px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid #e7e5e4;
  border-radius: 9px;
  background: white;
  color: #57534e;
  padding: 0 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all .15s;
}

.opp-side-filter-btn:hover,
.opp-side-filter-btn--active {
  border-color: #10b981;
  background: #ecfdf5;
  color: #047857;
}

.opp-side-filter-btn span {
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #10b981;
  color: white;
  font-size: 10px;
  font-weight: 900;
}

.opp-side-filter-panel {
  position: absolute;
  top: calc(100% + 9px);
  right: 0;
  z-index: 60;
  width: 270px;
  padding: 12px;
  border-radius: 16px;
  background: white;
  border: 1px solid #e7e5e4;
  box-shadow: 0 22px 70px rgba(0,0,0,.16);
}

.opp-side-filter-section + .opp-side-filter-section {
  margin-top: 13px;
  padding-top: 13px;
  border-top: 1px solid #f0ece8;
}

.opp-side-filter-title {
  display: block;
  margin-bottom: 8px;
  font-family: 'Sora', sans-serif;
  font-size: 10px;
  font-weight: 800;
  color: #a8a29e;
  text-transform: uppercase;
  letter-spacing: .075em;
}

.opp-side-option {
  width: 100%;
  min-height: 34px;
  display: flex;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: #57534e;
  padding: 7px 9px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 700;
  text-align: left;
}

.opp-side-option:hover {
  background: #fafaf9;
  border-color: #e7e5e4;
}

.opp-side-option--active {
  background: #ecfdf5;
  color: #047857;
  border-color: #a7f3d0;
}

.opp-side-toggle {
  min-height: 36px;
  display: flex;
  align-items: center;
  gap: 9px;
  color: #57534e;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.opp-side-toggle input {
  width: 15px;
  height: 15px;
  accent-color: #10b981;
}

.opp-side-clear {
  width: 100%;
  margin-top: 13px;
  border: none;
  border-radius: 10px;
  background: #f5f5f4;
  color: #57534e;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.opp-side-clear:hover {
  background: #e7e5e4;
  color: #1c1917;
}

.opp-admin-add { border: none; border-radius: 9px; background: #1c1917; color: white; padding: 7px 12px; font-weight: 700; font-size: 12px; cursor: pointer; }
.opp-toggle { display: flex; align-items: center; gap: 7px; padding: 6px 12px 6px 8px; border-radius: 8px; font-size: 12px; font-weight: 500; font-family: 'DM Sans', sans-serif; border: 1px solid #e7e5e4; background: white; color: #78716c; cursor: pointer; transition: all .2s; }
.opp-toggle--on { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
.opp-toggle__knob { width: 24px; height: 14px; border-radius: 100px; background: #d6d3d1; position: relative; transition: background .2s; flex-shrink: 0; }
.opp-toggle__knob::after { content: ''; position: absolute; width: 10px; height: 10px; border-radius: 50%; background: white; top: 2px; left: 2px; transition: transform .2s; box-shadow: 0 1px 2px rgba(0,0,0,.2); }
.opp-toggle--on .opp-toggle__knob { background: #10b981; }
.opp-toggle--on .opp-toggle__knob::after { transform: translateX(10px); }
.opp-count { font-size: 11px; font-weight: 500; color: #a8a29e; white-space: nowrap; }
.opp-clear { font-size: 11px; font-weight: 700; color: #059669; background: none; border: none; cursor: pointer; white-space: nowrap; padding: 0; transition: color .15s; }
.opp-clear:hover { color: #047857; }
.opp-spinner { width: 14px; height: 14px; animation: spin .8s linear infinite; color: #a8a29e; }
.opp-spinner--sm { width: 13px; height: 13px; }
.opp-spinner__track { opacity: .2; }
.opp-spinner__fill { opacity: .8; }
@keyframes spin { to { transform: rotate(360deg); } }
.opp-main { max-width: 1512px; margin: 0 auto; padding: 32px 24px 80px; }
.opp-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 24px; text-align: center; gap: 12px; }
.opp-state__icon { width: 52px; height: 52px; background: #f5f5f4; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #d6d3d1; margin-bottom: 4px; }
.opp-state__icon svg { width: 22px; height: 22px; }
.opp-state__icon--error { background: #fff1f2; color: #fca5a5; }
.opp-state__title { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 700; color: #1c1917; }
.opp-state__sub { font-size: 13px; color: #a8a29e; max-width: 280px; line-height: 1.5; }
.opp-skeleton { height: 340px; border-radius: 16px; background: linear-gradient(90deg, #f5f5f4 25%, #ece8e4 50%, #f5f5f4 75%); background-size: 200% 100%; animation: shimmer 1.6s ease-in-out infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.opp-grid { display: grid; grid-template-columns: repeat(auto-fill, 360px); gap: 18px; justify-content: start; }

.opp-category-section {
  margin-bottom: 34px;
}

.opp-category-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, 360px);
  gap: 18px;
  justify-content: start;
  overflow: visible;
  padding: 2px 2px 18px;
}
.opp-card { width: 360px; height: 382px; background: white; border-radius: 16px; border: 1px solid #f0ece8; overflow: hidden; cursor: pointer; transition: transform .2s, box-shadow .2s, border-color .2s; display: flex; flex-direction: column; }
.opp-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,.09); border-color: #e7e5e4; }
.opp-card:focus-visible { outline: 2px solid #10b981; outline-offset: 2px; }
.opp-card--urgent { border-color: #fed7aa; }
.opp-card--urgent:hover { border-color: #fdba74; }
.opp-card__cover { position: relative; height: 176px; overflow: hidden; background: #f5f5f4; flex-shrink: 0; }
.opp-card__img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s; }
.opp-card:hover .opp-card__img { transform: scale(1.04); }
.opp-card__cover-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.opp-card__cover-emoji { font-size: 2.5rem; opacity: .7; }
.opp-card__badges { position: absolute; top: 10px; left: 10px; right: 10px; display: flex; flex-wrap: wrap; gap: 5px; align-items: flex-start; }
.opp-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 6px; font-family: 'Sora', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: .01em; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
.opp-badge--verified { background: rgba(255,255,255,.9); color: #059669; border: 1px solid rgba(16,185,129,.3); }
.opp-badge--pending { background: rgba(251,191,36,.9); color: #78350f; border: 1px solid rgba(245,158,11,.35); }
.opp-badge--free { background: rgba(16,185,129,.15); color: #047857; border: 1px solid rgba(16,185,129,.25); }
.opp-edit-btn { margin-left: auto; border: 1px solid rgba(0,0,0,.1); background: rgba(255,255,255,.92); color: #292524; border-radius: 8px; padding: 4px 9px; font-size: 10.5px; font-weight: 800; cursor: pointer; backdrop-filter: blur(8px); }
.opp-edit-btn--dark { background: rgba(255,255,255,.16); color: white; border-color: rgba(255,255,255,.25); }
.opp-card__priority-strip { position: absolute; left: 10px; bottom: 10px; display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px; border-radius: 8px; border: 1px solid; font-size: 10.5px; font-weight: 800; backdrop-filter: blur(8px); }
.opp-card__deadline { position: absolute; bottom: 10px; right: 10px; display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; font-family: 'Sora', sans-serif; background: rgba(28,25,23,.75); color: #e7e5e4; backdrop-filter: blur(8px); }
.opp-card__deadline svg { width: 12px; height: 12px; }
.opp-card__deadline--urgent { background: rgba(234,88,12,.85); color: white; }
.opp-card__deadline--overdue { background: rgba(107,114,128,.7); color: #e7e5e4; }
.opp-card__body { padding: 16px; display: flex; flex-direction: column; gap: 9px; flex: 1; overflow: hidden; }
.opp-card__facts, .opp-card__tags { display: none; }
.opp-card__meta { margin-top: auto; }
.opp-card__title { font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 700; line-height: 1.35; color: #1c1917; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.opp-card__excerpt { font-size: 12.5px; line-height: 1.55; color: #78716c; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; flex: 1; }
.opp-card__facts { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.opp-card__fact { min-width: 0; padding: 7px 8px; border-radius: 8px; background: #fafaf9; border: 1px solid #e7e5e4; display: flex; flex-direction: column; gap: 2px; }
.opp-card__fact span { font-size: 9.5px; font-weight: 800; color: #a8a29e; text-transform: uppercase; letter-spacing: .04em; }
.opp-card__fact strong { font-size: 11.5px; font-weight: 800; color: #292524; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.opp-card__meta { display: flex; flex-wrap: wrap; gap: 6px; }
.opp-meta-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 500; color: #78716c; background: #f5f5f4; padding: 3px 8px; border-radius: 6px; border: 1px solid #e7e5e4; }
.opp-meta-chip svg { width: 11px; height: 11px; }
.opp-meta-chip--free { background: #ecfdf5; color: #065f46; border-color: #a7f3d0; }
.opp-card__tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 2px; }
.opp-tag { font-size: 10.5px; font-weight: 500; color: #a8a29e; background: #f5f5f4; border: 1px solid #e7e5e4; padding: 2px 8px; border-radius: 5px; }
.opp-tag--more { background: none; color: #c4b5a5; border-color: transparent; }
.opp-card__action { margin-top: 2px; font-size: 11.5px; font-weight: 800; color: #059669; }
.opp-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all .18s; }
.opp-btn--primary { background: #059669; color: white; }
.opp-btn--primary:hover { background: #047857; }
.opp-btn--ghost { background: white; color: #57534e; border: 1px solid #e7e5e4; }
.opp-btn--ghost:hover { color: #1c1917; border-color: #d6d3d1; background: #fafaf9; }
.opp-btn--ghost:disabled { opacity: .5; cursor: not-allowed; }
.opp-btn--cta { background: #1c1917; color: white; padding: 13px 24px; border-radius: 12px; font-size: 14px; width: 100%; justify-content: center; }
.opp-btn--cta:hover { background: #292524; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,.18); }
.opp-btn--cta svg { width: 16px; height: 16px; }
.opp-load-more { display: flex; justify-content: center; margin-top: 40px; }

.opp-section-header { display: flex; align-items: center; gap: 9px; margin-bottom: 14px; }
.opp-section-header__bar { width: 3px; height: 18px; border-radius: 999px; background: linear-gradient(to bottom, #10b981, #6366f1); }
.opp-section-header__bar--editorial { background: linear-gradient(to bottom, #f59e0b, #f97316); }
.opp-section-header__title { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 800; color: #1c1917; letter-spacing: -.02em; }
.opp-section-header__count { font-size: 11px; font-weight: 800; color: #a8a29e; background: #f5f5f4; border: 1px solid #e7e5e4; padding: 2px 7px; border-radius: 999px; }
.opp-priority-section, .opp-featured-section { margin-bottom: 34px; }
.opp-editorial-row { display: grid; grid-auto-flow: column; grid-auto-columns: 360px; gap: 18px; overflow-x: auto; padding: 2px 2px 12px; scroll-snap-type: x proximity; scrollbar-width: none; }
.opp-editorial-row::-webkit-scrollbar { display: none; }
.opp-editorial-card { width: 360px; height: 382px; scroll-snap-align: start; background: white; border: 1px solid #f0ece8; border-radius: 18px; overflow: hidden; cursor: pointer; display: flex; flex-direction: column; transition: transform .18s, box-shadow .18s, border-color .18s; }
.opp-editorial-card:hover { transform: translateY(-3px); box-shadow: 0 16px 42px rgba(0,0,0,.10); border-color: #fde68a; }
.opp-editorial-card__cover { position: relative; height: 176px; background: #f5f5f4; overflow: hidden; }
.opp-editorial-card__img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s; }
.opp-editorial-card:hover .opp-editorial-card__img { transform: scale(1.04); }
.opp-editorial-card__fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.opp-editorial-card__fallback span { font-size: 3rem; opacity: .75; }
.opp-editorial-card__overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.50), transparent 55%); pointer-events: none; }
.opp-editorial-card__badges { position: absolute; top: 11px; left: 11px; right: 11px; display: flex; align-items: flex-start; gap: 6px; z-index: 1; }
.opp-editorial-card__pick { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 999px; font-family: 'Sora', sans-serif; font-size: 10px; font-weight: 800; color: #78350f; background: rgba(253, 224, 71, .92); border: 1px solid rgba(245,158,11,.35); backdrop-filter: blur(8px); }
.opp-editorial-card__deadline { position: absolute; right: 11px; bottom: 11px; z-index: 1; padding: 5px 10px; border-radius: 999px; font-family: 'Sora', sans-serif; font-size: 10.5px; font-weight: 800; color: white; background: rgba(28,25,23,.72); backdrop-filter: blur(8px); }
.opp-editorial-card__deadline--urgent { background: rgba(234,88,12,.9); }
.opp-editorial-card__body { padding: 16px; display: flex; flex-direction: column; gap: 9px; }
.opp-editorial-card__meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.opp-editorial-card__title { font-family: 'Sora', sans-serif; font-size: 15px; line-height: 1.32; font-weight: 800; color: #1c1917; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.opp-editorial-card__excerpt { font-size: 12.5px; line-height: 1.55; color: #78716c; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.opp-featured-row { display: grid; grid-auto-flow: column; grid-auto-columns: 360px; gap: 18px; overflow-x: auto; padding: 2px 2px 12px; scrollbar-width: none; }
.opp-featured-row::-webkit-scrollbar { display: none; }
.opp-featured-card { width: 360px; height: 382px; background: white; border: 1px solid #e7e5e4; border-radius: 16px; overflow: hidden; cursor: pointer; display: flex; flex-direction: column; transition: transform .18s, box-shadow .18s, border-color .18s; }
.opp-featured-card:hover { transform: translateY(-3px); box-shadow: 0 14px 34px rgba(0,0,0,.09); border-color: #a7f3d0; }
.opp-featured-card__cover { position: relative; height: 176px; overflow: hidden; background: #f5f5f4; flex-shrink: 0; }
.opp-featured-card__glow-ring { position: absolute; inset: 0; box-shadow: inset 0 0 0 1px var(--glow); pointer-events: none; }
.opp-featured-card__priority-chip { position: absolute; left: 10px; bottom: 10px; display: inline-flex; align-items: center; color: white; padding: 4px 10px; border-radius: 999px; font-family: 'Sora', sans-serif; font-size: 10.5px; font-weight: 800; box-shadow: 0 6px 16px rgba(0,0,0,.18); }
.opp-modal-backdrop { position: fixed; inset: 0; z-index: 100; background: rgba(15,17,23,.6); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); display: flex; align-items: flex-end; justify-content: center; padding: 0; }
@media (min-width: 640px) { .opp-modal-backdrop { align-items: center; padding: 24px; } }
.opp-modal { background: white; border-radius: 24px 24px 0 0; width: 100%; max-width: 680px; max-height: 92dvh; overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none; box-shadow: 0 -8px 48px rgba(0,0,0,.2); }
.opp-modal::-webkit-scrollbar { display: none; }
@media (min-width: 640px) { .opp-modal { border-radius: 24px; box-shadow: 0 24px 80px rgba(0,0,0,.28); } }
.opp-modal__cover { position: relative; height: 220px; background: #f5f5f4; overflow: hidden; flex-shrink: 0; border-radius: 24px 24px 0 0; }
.opp-modal__cover-img { width: 100%; height: 100%; object-fit: cover; }
.opp-modal__cover-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.opp-modal__cover-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.35), transparent 60%); }
.opp-modal__close { position: absolute; top: 14px; right: 14px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.45); backdrop-filter: blur(8px); border: none; border-radius: 50%; color: white; cursor: pointer; transition: background .15s; z-index: 1; }
.opp-modal__close:hover { background: rgba(0,0,0,.65); }
.opp-modal__close svg { width: 15px; height: 15px; }
.opp-modal__edit { position: absolute; left: 14px; top: 14px; z-index: 2; border: 1px solid rgba(255,255,255,.25); background: rgba(0,0,0,.45); color: white; border-radius: 999px; padding: 8px 13px; font-weight: 800; font-size: 12px; cursor: pointer; backdrop-filter: blur(8px); }
.opp-modal__body { padding: 24px; display: flex; flex-direction: column; gap: 24px; }
.opp-modal__header { display: flex; flex-direction: column; gap: 10px; }
.opp-modal__badges { display: flex; flex-wrap: wrap; gap: 6px; }
.opp-modal__title { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 800; line-height: 1.2; letter-spacing: -.02em; color: #1c1917; }
.opp-modal__quick { display: flex; flex-wrap: wrap; gap: 10px; }
.opp-modal__info-item { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 500; color: #78716c; }
.opp-modal__info-item svg { width: 14px; height: 14px; }
.opp-modal__info-item--urgent { color: #ea580c; font-weight: 600; }
.opp-modal__info-item--overdue { color: #9ca3af; }
.opp-modal__info-item--muted { color: #a8a29e; }
.opp-modal__section { display: flex; flex-direction: column; gap: 10px; }
.opp-modal__section-title { font-family: 'Sora', sans-serif; font-size: 11px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; color: #a8a29e; }
.opp-modal__text { font-size: 14px; line-height: 1.7; color: #44403c; white-space: pre-line; }
.opp-info-stack { display: flex; flex-direction: column; gap: 20px; }
.opp-info-card { width: 100%; display: grid; grid-template-columns: 34px 1fr; gap: 14px; padding: 17px 18px; border-radius: 14px; border: 1px solid #e7e5e4; background: #fafaf9; }
.opp-info-card__icon { width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
.opp-info-card__content { min-width: 0; display: flex; flex-direction: column; gap: 7px; }
.opp-info-card__title { font-family: 'Sora', sans-serif; font-size: 10.5px; line-height: 1.2; font-weight: 800; text-transform: uppercase; letter-spacing: .065em; }
.opp-info-card__text { font-size: 13.5px; line-height: 1.75; font-weight: 500; margin: 0; }
.opp-info-card__list { margin: 0; padding-left: 16px; display: flex; flex-direction: column; gap: 7px; }
.opp-info-card__list li { font-size: 13.5px; line-height: 1.65; font-weight: 500; }
.opp-info-card--blue { background: #eff6ff; border-color: #bfdbfe; }
.opp-info-card--blue .opp-info-card__icon { background: #dbeafe; }
.opp-info-card--blue .opp-info-card__title,
.opp-info-card--blue .opp-info-card__text,
.opp-info-card--blue .opp-info-card__list li { color: #1d4ed8; }
.opp-info-card--amber { background: #fffbeb; border-color: #fde68a; }
.opp-info-card--amber .opp-info-card__icon { background: #fef3c7; }
.opp-info-card--amber .opp-info-card__title,
.opp-info-card--amber .opp-info-card__text,
.opp-info-card--amber .opp-info-card__list li { color: #b45309; }
.opp-info-card--emerald { background: #ecfdf5; border-color: #a7f3d0; }
.opp-info-card--emerald .opp-info-card__icon { background: #d1fae5; }
.opp-info-card--emerald .opp-info-card__title,
.opp-info-card--emerald .opp-info-card__text,
.opp-info-card--emerald .opp-info-card__list li { color: #047857; }
.opp-info-card--zinc { background: #fafaf9; border-color: #e7e5e4; }
.opp-info-card--zinc .opp-info-card__icon { background: #f5f5f4; }
.opp-info-card--zinc .opp-info-card__title { color: #71717a; }
.opp-info-card--zinc .opp-info-card__text,
.opp-info-card--zinc .opp-info-card__list li { color: #44403c; }
.opp-timeline { display: flex; flex-direction: column; gap: 0; padding-left: 8px; }
.opp-timeline__item { display: flex; align-items: flex-start; gap: 14px; padding-bottom: 16px; position: relative; }
.opp-timeline__item:not(:last-child)::before { content: ''; position: absolute; left: 5px; top: 20px; bottom: 0; width: 1px; background: #e7e5e4; }
.opp-timeline__dot { width: 11px; height: 11px; border-radius: 50%; background: #10b981; border: 2px solid white; box-shadow: 0 0 0 2px #10b981; flex-shrink: 0; margin-top: 3px; }
.opp-timeline__item--past .opp-timeline__dot { background: #d6d3d1; box-shadow: 0 0 0 2px #d6d3d1; }
.opp-timeline__content { display: flex; flex-direction: column; gap: 2px; }
.opp-timeline__label { font-size: 13.5px; font-weight: 600; color: #1c1917; }
.opp-timeline__date { font-size: 12px; color: #a8a29e; }
.opp-timeline__calendar-badge { width: fit-content; margin-top: 3px; font-size: 10px; font-weight: 800; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 7px; border-radius: 999px; }
.opp-reference-list { display: flex; flex-direction: column; gap: 8px; }
.opp-reference-card { display: flex; flex-direction: column; gap: 3px; padding: 11px 12px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; text-decoration: none; transition: all .15s; }
.opp-reference-card:hover { background: #f1f5f9; border-color: #cbd5e1; }
.opp-reference-card__title { font-size: 13px; font-weight: 800; color: #0f172a; }
.opp-reference-card__desc { font-size: 12px; color: #64748b; line-height: 1.45; }
.opp-reference-card__url { font-size: 10px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: .06em; }
.opp-modal__cta { padding-top: 8px; padding-bottom: 8px; }
.modal-enter-active, .modal-leave-active { transition: opacity .22s ease; }
.modal-enter-active .opp-modal, .modal-leave-active .opp-modal { transition: transform .28s cubic-bezier(.34, 1.56, .64, 1), opacity .22s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .opp-modal { transform: translateY(40px); opacity: 0; }
.modal-leave-to .opp-modal { transform: translateY(40px); opacity: 0; }



@media (max-width: 860px) {
  .opp-filters__inner {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .opp-filters__right {
    justify-content: space-between;
  }

  .opp-side-filter-panel {
    position: fixed;
    top: 118px;
    right: 14px;
    left: 14px;
    width: auto;
    max-height: 58vh;
    overflow: auto;
  }
}


@media (max-width: 640px) {
  .opp-hero {
    padding: 46px 18px 38px;
  }

  .opp-hero__title {
    font-size: clamp(2rem, 13vw, 3rem);
  }

  .opp-filters__inner {
    padding: 10px 14px;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: 8px;
    max-width: 100%;
    overflow: hidden;
  }

  .opp-type-pills {
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }

  .opp-filters__right {
    gap: 7px;
  }

  .opp-count {
    display: none;
  }

  .opp-clear {
    display: none;
  }

  .opp-side-filter-btn {
    height: 34px;
    padding: 0 10px;
  }

  .opp-side-filter-panel {
    position: fixed;
    top: 112px;
    right: 12px;
    left: 12px;
    width: auto;
    max-height: 58vh;
    overflow: auto;
  }

  .opp-main {
    max-width: none;
    padding: 22px 0 64px;
    overflow: hidden;
  }

  .opp-state {
    margin: 0 16px;
  }

  .opp-section-header {
    margin: 0 16px 12px;
  }

  .opp-category-section {
    margin-bottom: 28px;
  }

  .opp-priority-section,
  .opp-featured-section {
    margin-bottom: 28px;
  }

  /* Netflix-like horizontal rails on mobile */
  .opp-editorial-row,
  .opp-featured-row,
  .opp-grid,
  .opp-category-row {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 2px 16px 16px;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
    touch-action: pan-x;
  }

  .opp-editorial-row::-webkit-scrollbar,
  .opp-featured-row::-webkit-scrollbar,
  .opp-grid::-webkit-scrollbar,
  .opp-category-row::-webkit-scrollbar {
    display: none;
  }

  .opp-card,
  .opp-featured-card,
  .opp-editorial-card {
    flex: 0 0 78vw;
    width: auto;
    height: 360px;
    max-width: 330px;
    min-width: 260px;
    scroll-snap-align: start;
  }

  .opp-card:hover,
  .opp-featured-card:hover,
  .opp-editorial-card:hover {
    transform: none;
    box-shadow: none;
  }

  .opp-card__cover,
  .opp-featured-card__cover,
  .opp-editorial-card__cover {
    height: 154px;
  }

  .opp-card__body,
  .opp-editorial-card__body {
    padding: 14px;
  }

  .opp-card__facts {
    display: none;
  }

  .opp-card__excerpt,
  .opp-editorial-card__excerpt {
    -webkit-line-clamp: 2;
  }

  .opp-card__tags {
    display: none;
  }

  .opp-modal__body {
    padding: 20px;
  }
}
</style>