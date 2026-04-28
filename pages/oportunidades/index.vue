<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

useSeoMeta({ title: 'Oportunidades — seConecta' })

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
//  COMPETITION:     { label: 'Competição',       icon: '🏆', color: '#f59e0b', bg: 'bg-amber-50',   ring: 'ring-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-400' },
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

function normalizeTimeline(value: any) {
  if (Array.isArray(value)) return value

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return []
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

function getFirstUpcomingTimelineEvent(timeline: any[]) {
  const now = new Date()

  return [...timeline]
    .map((event) => ({ ...event, _date: parseLocalDate(event?.date) }))
    .filter((event) => event._date && event._date >= now)
    .sort((a, b) => a._date.getTime() - b._date.getTime())[0] ?? null
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
  const nextTimelineEvent = getFirstUpcomingTimelineEvent(timeline)
  const displayDeadlineRaw = nextTimelineEvent?.date ?? o.next_deadline ?? null
  const deadline = formatDeadline(displayDeadlineRaw)
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
const activeCategory = ref('')
const freeOnly = ref(false)

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
    const params: Record<string, any> = { page: currentPage.value, limit: PAGE_SIZE }
    if (search.value.trim()) params.search = search.value.trim()
    if (activeCategory.value) params.category = activeCategory.value
    if (freeOnly.value) params.is_free = true
    if (isAdmin.value) params.approved_only = false

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

function clearFilters() {
  search.value = ''
  activeCategory.value = ''
  freeOnly.value = false
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

watch(search, debounce(() => fetchOpportunities(true), 400))
watch(activeCategory, () => fetchOpportunities(true))
watch(freeOnly, () => fetchOpportunities(true))

watch(selectedItem, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
})

onMounted(async () => {
  await fetchCurrentUser()
  await fetchOpportunities(true)
})

onUnmounted(() => {
  document.body.style.overflow = ''
})

const filtered = computed(() => opportunities.value)
const hasMore = computed(() => opportunities.value.length < totalCount.value)
const activeFilters = computed(
  () => (search.value ? 1 : 0) + (activeCategory.value ? 1 : 0) + (freeOnly.value ? 1 : 0)
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
          <div class="opp-filters__pills">
            <button
              @click="activeCategory = ''"
              :class="['opp-pill', !activeCategory && 'opp-pill--active']"
            >
              Todos
            </button>

            <button
              v-for="(meta, key) in CATEGORY_META"
              :key="key"
              @click="activeCategory = activeCategory === key ? '' : key"
              :class="['opp-pill', activeCategory === key && 'opp-pill--active']"
            >
              <span>{{ meta.icon }}</span> {{ meta.label }}
            </button>
          </div>

          <div class="opp-filters__right">
            <button
              @click="freeOnly = !freeOnly"
              :class="['opp-toggle', freeOnly && 'opp-toggle--on']"
              :title="freeOnly ? 'Mostrar todos' : 'Apenas gratuitos'"
            >
              <span class="opp-toggle__knob"></span>
              Gratuito
            </button>

            <svg v-if="loading" class="opp-spinner" fill="none" viewBox="0 0 24 24">
              <circle class="opp-spinner__track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opp-spinner__fill" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>

            <span class="opp-count">
              {{ totalCount.toLocaleString('pt-BR') }} resultado{{ totalCount !== 1 ? 's' : '' }}
            </span>

            <button v-if="activeFilters > 0" @click="clearFilters" class="opp-clear">
              Limpar ({{ activeFilters }})
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
                  {{ item.deadline.label }}
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
                  {{ item.deadline.label }}
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
                {{ item.deadline.label }}
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
            </div>
          </article>
        </div>

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
                    <span>
                      <template v-if="selectedItem.next_timeline_event">
                        {{ getTimelineLabel(selectedItem.next_timeline_event) }} · {{ selectedItem.deadline.label }}
                      </template>
                      <template v-else>
                        {{ selectedItem.deadline.label }}
                      </template>
                    </span>
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

.opp-page { font-family: 'DM Sans', sans-serif; background: #fafaf9; min-height: 100vh; color: #1c1917; }
.opp-hero { position: relative; overflow: hidden; background: #0f1117; padding: 80px 24px 72px; display: flex; justify-content: center; }
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
.opp-filters { position: sticky; top: 0; z-index: 30; background: rgba(250,250,249,.9); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid #e7e5e4; }
.opp-filters__inner { max-width: 1200px; margin: 0 auto; padding: 12px 24px; display: flex; align-items: center; gap: 16px; }
.opp-filters__pills { display: flex; align-items: center; gap: 6px; overflow-x: auto; flex: 1; scrollbar-width: none; -ms-overflow-style: none; }
.opp-filters__pills::-webkit-scrollbar { display: none; }
.opp-pill { display: inline-flex; align-items: center; gap: 5px; padding: 6px 13px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; border: 1px solid #e7e5e4; background: white; color: #78716c; cursor: pointer; white-space: nowrap; transition: all .15s; }
.opp-pill:hover { color: #1c1917; border-color: #d6d3d1; }
.opp-pill--active { background: #1c1917; color: white; border-color: #1c1917; }
.opp-filters__right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
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
.opp-main { max-width: 1200px; margin: 0 auto; padding: 32px 24px 80px; }
.opp-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 24px; text-align: center; gap: 12px; }
.opp-state__icon { width: 52px; height: 52px; background: #f5f5f4; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #d6d3d1; margin-bottom: 4px; }
.opp-state__icon svg { width: 22px; height: 22px; }
.opp-state__icon--error { background: #fff1f2; color: #fca5a5; }
.opp-state__title { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 700; color: #1c1917; }
.opp-state__sub { font-size: 13px; color: #a8a29e; max-width: 280px; line-height: 1.5; }
.opp-skeleton { height: 340px; border-radius: 16px; background: linear-gradient(90deg, #f5f5f4 25%, #ece8e4 50%, #f5f5f4 75%); background-size: 200% 100%; animation: shimmer 1.6s ease-in-out infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.opp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
.opp-card { background: white; border-radius: 16px; border: 1px solid #f0ece8; overflow: hidden; cursor: pointer; transition: transform .2s, box-shadow .2s, border-color .2s; display: flex; flex-direction: column; }
.opp-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,.09); border-color: #e7e5e4; }
.opp-card:focus-visible { outline: 2px solid #10b981; outline-offset: 2px; }
.opp-card--urgent { border-color: #fed7aa; }
.opp-card--urgent:hover { border-color: #fdba74; }
.opp-card__cover { position: relative; height: 160px; overflow: hidden; background: #f5f5f4; flex-shrink: 0; }
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
.opp-card__body { padding: 18px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
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
.opp-editorial-row { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(280px, 360px); gap: 18px; overflow-x: auto; padding: 2px 2px 12px; scroll-snap-type: x proximity; scrollbar-width: none; }
.opp-editorial-row::-webkit-scrollbar { display: none; }
.opp-editorial-card { scroll-snap-align: start; background: white; border: 1px solid #f0ece8; border-radius: 18px; overflow: hidden; cursor: pointer; display: flex; flex-direction: column; transition: transform .18s, box-shadow .18s, border-color .18s; }
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
.opp-featured-row { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(260px, 330px); gap: 18px; overflow-x: auto; padding: 2px 2px 12px; scrollbar-width: none; }
.opp-featured-row::-webkit-scrollbar { display: none; }
.opp-featured-card { background: white; border: 1px solid #e7e5e4; border-radius: 16px; overflow: hidden; cursor: pointer; transition: transform .18s, box-shadow .18s, border-color .18s; }
.opp-featured-card:hover { transform: translateY(-3px); box-shadow: 0 14px 34px rgba(0,0,0,.09); border-color: #a7f3d0; }
.opp-featured-card__cover { position: relative; height: 154px; overflow: hidden; background: #f5f5f4; }
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
@media (max-width: 640px) {
  .opp-hero { padding: 60px 20px 56px; }
  .opp-filters__inner { padding: 10px 16px; }
  .opp-main { padding: 20px 16px 60px; }
  .opp-grid { grid-template-columns: 1fr; gap: 14px; }
  .opp-modal__body { padding: 20px; }
  .opp-filters__right { gap: 8px; }
  .opp-toggle span:not(.opp-toggle__knob) { display: none; }
  .opp-card__facts { grid-template-columns: 1fr; }
}
</style>