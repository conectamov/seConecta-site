<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

useSeoMeta({ title: 'Olimpíadas — seConecta' })

const { get } = useAxios()

// ─── Status mapping ──────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Inscrições abertas',
  SOON: 'Em breve',
  ONGOING: 'Em andamento',
  CLOSED: 'Encerrada',
}

const STATUS_ENUM: Record<string, string> = {
  'Inscrições abertas': 'OPEN',
  'Em breve': 'SOON',
  'Em andamento': 'ONGOING',
  'Encerrada': 'CLOSED',
}

const statusOptions = Object.keys(STATUS_ENUM)

// ─── Normalize API → shape expected by child components ──────────────────────

function normalize(o: any) {
  const statusLabel = STATUS_LABEL[o.status] ?? o.status

  return {
    id: o.id,
    name: o.title,
    title: o.title,
    description: o.description ?? '',
    organizer: o.organizer ?? '',

    banner_url: o.cover_url,
    cover_url: o.cover_url,

    status: statusLabel,
    statusEnum: o.status,

    area: o.categories?.[0] ?? '',
    tags: o.categories ?? [],
    categories: o.levels ?? [],
    levels: o.levels ?? [],
    languages: o.languages ?? [],
    modalities: o.modalities ?? [],

    rating: o.rating,
    participants_count: o.participants_count ?? null,
    difficulty_level: o.difficulty,
    estimated_duration: o.duration,

    location: o.location,
    target_audience: o.target_audience,
    taxes: o.is_free ? 'Gratuito' : 'Pago',
    is_free: o.is_free,
    certificate: o.has_certificate,
    has_certificate: o.has_certificate,
    mentorship_available: o.has_mentorship,
    has_mentorship: o.has_mentorship,
    international: o.location?.toLowerCase().includes('internacional') ?? false,
    team_allowed: false,

    start_date: o.start_date,
    end_date: o.end_date,
    next_edition_date: o.next_edition_date,

    application_process: o.how_to_register,
    prizes: o.prizes,
    requirements: o.requirements,

    website: o.official_site_url,
    official_site_url: o.official_site_url,
    past_exams_url: null,
    resources: o.resources ?? [],

    highlighted: o.is_featured,
    is_featured: o.is_featured,

    author_name: o.author_name,
    author_profile_url: o.author_profile_url,

    popularity_score: o.rating ? Math.round(o.rating * 20) : 0,
    deadline_countdown: null,
  }
}

// ─── State ───────────────────────────────────────────────────────────────────

const olimpiads = ref<any[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref<string | null>(null)
const totalCount = ref(0)
const currentPage = ref(1)
const PAGE_SIZE = 50

const selectedOlimpiad = ref<any | null>(null)
const search = ref('')
const activeStatus = ref('')

// ─── Request system (same pattern as feed page) ──────────────────────────────

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let t: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }
}

async function fetchOlimpiads(reset = true) {
  if (reset) {
    currentPage.value = 1
    loading.value = true
  } else {
    loadingMore.value = true
  }

  error.value = null

  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      limit: PAGE_SIZE,
    }

    if (search.value.trim()) params.search = search.value.trim()

    if (activeStatus.value) {
      const enumVal = STATUS_ENUM[activeStatus.value]
      if (enumVal) params.status = enumVal
    }

    // Adjust this path if your axios baseURL is different.
    const res = await get('/olympiads/', { params })

    const data = res.data?.data ?? []
    const count = res.data?.count ?? 0
    const normalized = data.map(normalize)

    if (reset) {
      olimpiads.value = normalized
      totalCount.value = count
    } else {
      olimpiads.value.push(...normalized)
    }
  } catch (e: any) {
    error.value =
      e?.response?.data?.detail ||
      e?.message ||
      'Erro ao carregar olimpíadas.'
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function loadMore() {
  if (!hasMore.value || loadingMore.value) return
  currentPage.value++
  await fetchOlimpiads(false)
}

// ─── Reactive filters ───────────────────────────────────────────────────────

watch(
  search,
  debounce(() => {
    fetchOlimpiads(true)
  }, 400)
)

watch(activeStatus, () => {
  fetchOlimpiads(true)
})

onMounted(() => {
  fetchOlimpiads(true)
})

// ─── Derived UI state ────────────────────────────────────────────────────────

const filtered = computed(() => olimpiads.value)

const highlighted = computed(() => filtered.value.filter(o => o.highlighted))

const featuredOlimpiad = computed(() =>
  filtered.value
    .filter(o => o.highlighted)
    .sort((a, b) => (b.popularity_score ?? 0) - (a.popularity_score ?? 0))[0] ?? null
)

const TAG_META: Record<string, { label: string; icon: string; order: number }> = {
  tecnologia: { label: 'Tecnologia', icon: '💻', order: 1 },
  programação: { label: 'Programação', icon: '👨‍💻', order: 2 },
  matemática: { label: 'Matemática', icon: '🔢', order: 3 },
  ciências: { label: 'Ciências', icon: '🔬', order: 4 },
  linguagens: { label: 'Linguagens', icon: '📝', order: 5 },
  nacional: { label: 'Nacional', icon: '🇧🇷', order: 6 },
  internacional: { label: 'Internacional', icon: '🌍', order: 7 },
}

const tagSections = computed(() => {
  const map = new Map<string, any[]>()

  filtered.value.forEach(o => {
    o.tags.forEach((tag: string) => {
      if (!map.has(tag)) map.set(tag, [])
      map.get(tag)!.push(o)
    })
  })

  return [...map.entries()]
    .map(([tag, items]) => ({
      tag,
      items,
      icon: TAG_META[tag]?.icon ?? '🏆',
      label: TAG_META[tag]?.label ?? (tag.charAt(0).toUpperCase() + tag.slice(1)),
      order: TAG_META[tag]?.order ?? 99,
    }))
    .sort((a, b) => a.order - b.order)
})

const activeFilterCount = computed(
  () => (search.value ? 1 : 0) + (activeStatus.value ? 1 : 0)
)

const hasMore = computed(() => olimpiads.value.length < totalCount.value)

function clearFilters() {
  search.value = ''
  activeStatus.value = ''
  fetchOlimpiads(true)
}

// ─── Carousel helpers ────────────────────────────────────────────────────────

const rowEls: Record<string, HTMLElement> = {}

function setRowRef(el: Element | null, tag: string) {
  if (el instanceof HTMLElement) rowEls[tag] = el
}

function scrollRow(tag: string, dir: number) {
  rowEls[tag]?.scrollBy({ left: dir * 700, behavior: 'smooth' })
}

// ─── Styling helpers ─────────────────────────────────────────────────────────

const statusColor: Record<string, string> = {
  'Inscrições abertas': 'bg-emerald-500/20 text-emerald-700 ring-1 ring-emerald-500/30',
  'Em andamento': 'bg-blue-500/20 text-blue-700 ring-1 ring-blue-500/30',
  'Em breve': 'bg-amber-500/20 text-amber-700 ring-1 ring-amber-500/30',
  'Encerrada': 'bg-zinc-500/20 text-zinc-600 ring-1 ring-zinc-500/30',
}

function statusPillClass(s: string) {
  return (
    statusColor[s]
      ?.replace('text-emerald-700', 'text-emerald-300')
      ?.replace('text-blue-700', 'text-blue-300')
      ?.replace('text-amber-700', 'text-amber-300')
      ?.replace('text-zinc-600', 'text-zinc-400')
    ?? statusColor['Encerrada']
  )
}

// participants_count is already a formatted string from the API ("130k", "18.5M" …)
// falls back to numeric formatting if a raw number somehow arrives
function fmtCount(n: any) {
  if (!n && n !== 0) return ''
  if (typeof n === 'string') return n
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return Math.round(n / 1_000) + 'k'
  return String(n)
}
</script>

<template>
  <div class="font-sans antialiased">
    <!-- Hero -->
    <section class="relative overflow-hidden flex items-center min-h-[400px]">
      <div class="relative z-10 max-w-4xl mx-auto px-6 md:px-10 py-16 md:py-20">
        <h1
          class="font-extrabold leading-[1.06] tracking-tight mb-4 text-center"
          style="font-size: clamp(1.9rem, 5.5vw, 3.2rem);"
        >
          <span class="block">Descubra as melhores</span>
          <span class="block gradient-text bg-clip-text text-transparent">oportunidades</span>
        </h1>

        <p class="text-[15px] leading-relaxed max-w-[420px] text-gray-600 mb-8 text-center mx-auto">
          Olimpíadas científicas para estudantes do ensino fundamental e médio.
          Aprenda, compita e conquiste seu futuro.
        </p>

        <div class="relative max-w-lg mx-auto">
          <svg
            class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="black" stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"
            />
          </svg>

          <input
            v-model="search"
            type="search"
            placeholder="Buscar por nome, área ou tag..."
            class="w-full pl-11 pr-10 py-3.5 rounded-xl text-[13.5px] text-gray-800
                   bg-white/10 border border-black/15 focus:outline-none
                   focus:bg-white/15 focus:border-emerald-600/40 transition-all"
          />

          <button
            v-if="search"
            @click="search = ''"
            class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full
                   bg-white/10 hover:bg-white/20 text-zinc-400 flex items-center
                   justify-center transition-colors"
            aria-label="Limpar busca"
          >
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </section>

    <div class="bg-white">
      <div class="sticky top-0 z-30 bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)]
                  max-w-[900px] mx-auto px-4 md:px-8 pt-10 pb-4">
        <div class="max-w-screen-2xl mx-auto px-6 md:px-10">
          <div class="flex items-center gap-3 py-2.5 overflow-x-auto
                      [scrollbar-width:none] [-ms-overflow-style:none]
                      [&::-webkit-scrollbar]:hidden">
            <span class="shrink-0 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
              Filtrar
            </span>
            <div class="w-px h-3.5 bg-zinc-200 shrink-0"></div>

            <div class="flex items-center gap-1.5">
              <button
                @click="activeStatus = ''"
                :class="[
                  'px-3 py-1.25 rounded-lg text-xs font-medium border transition-all',
                  !activeStatus
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                    : 'bg-white text-zinc-500 border-zinc-200 hover:text-zinc-700 hover:border-zinc-300'
                ]"
              >Todos</button>

              <button
                v-for="opt in statusOptions"
                :key="opt"
                @click="activeStatus = opt === activeStatus ? '' : opt"
                :class="[
                  'px-3 py-1.25 rounded-lg text-xs font-medium border transition-all whitespace-nowrap',
                  activeStatus === opt
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                    : 'bg-white text-zinc-500 border-zinc-200 hover:text-zinc-700 hover:border-zinc-300'
                ]"
              >{{ opt }}</button>
            </div>

            <div class="flex items-center gap-3 ml-auto shrink-0">
              <svg
                v-if="loading"
                class="w-3.5 h-3.5 text-zinc-400 animate-spin"
                fill="none" viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"/>
              </svg>

              <span class="text-[11px] text-zinc-400 font-medium tabular-nums whitespace-nowrap">
                {{ totalCount }} resultado{{ totalCount !== 1 ? 's' : '' }}
              </span>

              <button
                v-if="activeFilterCount > 0"
                @click="clearFilters"
                class="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800
                       transition-colors whitespace-nowrap"
              >Limpar</button>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white max-w-[900px] mx-auto px-4 md:px-8 pt-10 pb-4">
        <div v-if="error && !loading" class="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div class="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874
                   1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
              />
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15.75h.007v.008H12v-.008z"/>
            </svg>
          </div>
          <p class="text-[15px] font-semibold text-zinc-700 mb-1.5">Erro ao carregar olimpíadas</p>
          <p class="text-[13px] text-zinc-400 mb-6 max-w-xs leading-relaxed">{{ error }}</p>
          <button
            @click="fetchOlimpiads(true)"
            class="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white
                   text-[13px] font-semibold rounded-xl transition-colors"
          >Tentar novamente</button>
        </div>

        <div
          v-else-if="!loading && !error && filtered.length === 0"
          class="flex flex-col items-center justify-center py-28 px-6 text-center"
        >
          <div class="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-zinc-300" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"/>
            </svg>
          </div>
          <p class="text-[15px] font-semibold text-zinc-700 mb-1.5">Nenhuma olimpíada encontrada</p>
          <p class="text-[13px] text-zinc-400 mb-6 max-w-xs leading-relaxed">
            Tente outros termos ou remova os filtros aplicados.
          </p>
          <button
            @click="clearFilters"
            class="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white
                   text-[13px] font-semibold rounded-xl transition-colors"
          >Limpar filtros</button>
        </div>

        <div v-if="loading && filtered.length === 0" class="px-6 md:px-10 mb-12 space-y-10">
          <div class="h-[260px] md:h-[320px] rounded-2xl bg-zinc-100 animate-pulse"></div>

          <div v-for="i in 3" :key="i">
            <div class="h-4 w-32 rounded bg-zinc-100 animate-pulse mb-4"></div>
            <div class="flex gap-5">
              <div
                v-for="j in 3"
                :key="j"
                class="w-[220px] shrink-0 h-[280px] rounded-xl bg-zinc-100 animate-pulse"
              ></div>
            </div>
          </div>
        </div>

        <template v-if="filtered.length > 0">
          <div
            v-if="featuredOlimpiad && !search && !activeStatus"
            class="px-6 md:px-10 mb-12"
          >
            <div
              @click="selectedOlimpiad = featuredOlimpiad"
              class="relative h-[260px] md:h-[320px] rounded-2xl overflow-hidden
                     cursor-pointer group shadow-md hover:shadow-2xl transition-shadow"
            >
              <img
                :src="featuredOlimpiad.banner_url"
                :alt="featuredOlimpiad.name"
                class="absolute inset-0 w-full h-full object-cover
                       group-hover:scale-105 transition-transform duration-700"
              />

              <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
              <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
              <div class="absolute inset-0"
                style="background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.25) 100%)">
              </div>

              <div class="absolute inset-0 flex flex-col justify-end p-7 md:p-10">
                <div class="flex flex-wrap gap-2 mb-3">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-400/90 text-amber-900">
                    Em Destaque
                  </span>

                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-sm',
                      statusPillClass(featuredOlimpiad.status)
                    ]"
                  >{{ featuredOlimpiad.status }}</span>

                  <span
                    v-if="featuredOlimpiad.international"
                    class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-violet-500/25 text-violet-200 ring-1 ring-violet-500/30 backdrop-blur-sm"
                  >Internacional</span>
                </div>

                <h2 class="text-white text-[clamp(1.2rem,3vw,1.75rem)] font-bold leading-tight tracking-tight max-w-lg mb-1.5">
                  {{ featuredOlimpiad.name }}
                </h2>

                <p class="text-[13px] text-white/60 max-w-sm mb-5 line-clamp-2 hidden sm:block leading-relaxed">
                  {{ featuredOlimpiad.description }}
                </p>

                <div class="flex items-center gap-5 flex-wrap">
                  <span
                    v-if="featuredOlimpiad.participants_count"
                    class="flex items-center gap-1.5 text-[12px] text-white/55 font-medium"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857
                           M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0
                           a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    {{ fmtCount(featuredOlimpiad.participants_count) }} inscritos
                  </span>

                  <span
                    v-if="featuredOlimpiad.rating"
                    class="flex items-center gap-1 text-[12px] text-amber-400 font-semibold"
                  >
                    <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462
                               c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292
                               c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034
                               c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118
                               L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    {{ featuredOlimpiad.rating.toFixed(1) }}
                  </span>

                  <button
                    class="inline-flex items-center gap-1.5 px-4 py-1.75 rounded-full bg-white text-zinc-900 text-xs font-bold hover:bg-zinc-100 transition-all hover:gap-2"
                  >
                    Ver detalhes
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="highlighted.length > 0" class="mb-10">
            <div class="flex items-center gap-2.5 px-6 md:px-10 mb-4">
              <div class="w-0.5 h-[18px] rounded-full bg-gradient-to-b from-emerald-600 to-blue-600"></div>
              <h2 class="text-[15px] font-bold text-zinc-900 tracking-tight">Em Destaque</h2>
              <span class="text-[11px] font-semibold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full tabular-nums">
                {{ highlighted.length }}
              </span>
            </div>

            <div class="relative group/row">
              <button
                @click="scrollRow('highlighted', -1)"
                class="absolute left-3 top-[calc(50%-18px)] z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white border border-zinc-200 shadow-md text-zinc-500 opacity-0 group-hover/row:opacity-100 hover:shadow-lg hover:text-zinc-900 hover:border-zinc-300 transition-all scale-90 group-hover/row:scale-100 active:scale-95"
                aria-label="Rolar para esquerda"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>

              <div
                :ref="el => setRowRef(el, 'highlighted')"
                class="flex gap-5 overflow-x-auto px-6 md:px-10 pb-3 scroll-smooth
                       [scrollbar-width:none] [-ms-overflow-style:none]
                       [&::-webkit-scrollbar]:hidden"
              >
                <OlimpiadasOlimpiadCard
                  v-for="o in highlighted"
                  :key="o.id"
                  :olimpiad="o"
                  @open="selectedOlimpiad = $event"
                />
                <div class="w-2 shrink-0"></div>
              </div>

              <button
                @click="scrollRow('highlighted', 1)"
                class="absolute right-3 top-[calc(50%-18px)] z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white border border-zinc-200 shadow-md text-zinc-500 opacity-0 group-hover/row:opacity-100 hover:shadow-lg hover:text-zinc-900 hover:border-zinc-300 transition-all scale-90 group-hover/row:scale-100 active:scale-95"
                aria-label="Rolar para direita"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>

          <div v-for="section in tagSections" :key="section.tag" class="mb-10">
            <div class="flex items-center gap-2.5 px-6 md:px-10 mb-4">
              <div class="w-0.5 h-[18px] rounded-full bg-gradient-to-b from-emerald-600 to-blue-600"></div>
              <h2 class="text-[15px] font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <span class="text-[15px] leading-none">{{ section.icon }}</span>
                {{ section.label }}
              </h2>
              <span class="text-[11px] font-semibold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full tabular-nums">
                {{ section.items.length }}
              </span>
            </div>

            <div class="relative group/row">
              <button
                @click="scrollRow(section.tag, -1)"
                class="absolute left-3 top-[calc(50%-18px)] z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white border border-zinc-200 shadow-md text-zinc-500 opacity-0 group-hover/row:opacity-100 hover:shadow-lg hover:text-zinc-900 hover:border-zinc-300 transition-all scale-90 group-hover/row:scale-100 active:scale-95"
                :aria-label="`Rolar ${section.label} para esquerda`"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>

              <div
                :ref="el => setRowRef(el, section.tag)"
                class="flex gap-5 overflow-x-auto px-6 md:px-10 pb-3 scroll-smooth
                       [scrollbar-width:none] [-ms-overflow-style:none]
                       [&::-webkit-scrollbar]:hidden"
              >
                <OlimpiadasOlimpiadCard
                  v-for="o in section.items"
                  :key="o.id"
                  :olimpiad="o"
                  @open="selectedOlimpiad = $event"
                />
                <div class="w-2 shrink-0"></div>
              </div>

              <button
                @click="scrollRow(section.tag, 1)"
                class="absolute right-3 top-[calc(50%-18px)] z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white border border-zinc-200 shadow-md text-zinc-500 opacity-0 group-hover/row:opacity-100 hover:shadow-lg hover:text-zinc-900 hover:border-zinc-300 transition-all scale-90 group-hover/row:scale-100 active:scale-95"
                :aria-label="`Rolar ${section.label} para direita`"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>

          <div v-if="hasMore" class="flex justify-center pb-12 mt-4">
            <button
              @click="loadMore"
              :disabled="loadingMore"
              class="px-6 py-2.5 rounded-xl border border-zinc-200 text-[13px] font-semibold text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg
                v-if="loadingMore"
                class="w-3.5 h-3.5 animate-spin text-zinc-400"
                fill="none" viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              {{ loadingMore ? 'Carregando…' : 'Carregar mais' }}
            </button>
          </div>
        </template>
      </div>
    </div>

    <OlimpiadasOlimpiadModal
      :olimpiad="selectedOlimpiad"
      @close="selectedOlimpiad = null"
    />
  </div>
</template>