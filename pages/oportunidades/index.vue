<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'

useSeoMeta({ title: 'Oportunidades — seConecta' })

const { get } = useAxios()

// ─── Category config ─────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function debounce<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms) }
}

function formatDeadline(raw: string | null | undefined): {
  label: string
  urgent: boolean
  overdue: boolean
  daysLeft: number | null
} {
  if (!raw) return { label: 'Sem prazo', urgent: false, overdue: false, daysLeft: null }
  const dt = new Date(raw)
  const now = new Date()
  const diff = Math.ceil((dt.getTime() - now.getTime()) / 86_400_000)
  if (diff < 0)  return { label: 'Encerrado',              urgent: false, overdue: true,  daysLeft: diff }
  if (diff === 0) return { label: 'Último dia!',           urgent: true,  overdue: false, daysLeft: 0 }
  if (diff <= 3)  return { label: `${diff}d restante${diff > 1 ? 's' : ''}`, urgent: true, overdue: false, daysLeft: diff }
  if (diff <= 14) return { label: `${diff} dias`,          urgent: false, overdue: false, daysLeft: diff }
  return {
    label: dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    urgent: false, overdue: false, daysLeft: diff,
  }
}

function fmtDate(raw: string | null | undefined) {
  if (!raw) return null
  return new Date(raw).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function normalize(o: any) {
  const meta = CATEGORY_META[o.category] ?? CATEGORY_META['POST']
  const deadline = formatDeadline(o.next_deadline)

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
    next_deadline: o.next_deadline ?? null,
    deadline,
    timeline: Array.isArray(o.timeline) ? o.timeline : [],
    tags: Array.isArray(o.tags) ? o.tags : [],
    category_data: o.category_data ?? {},
    human_verified: !!o.human_verified,
    created_at: o.created_at,
    updated_at: o.updated_at,
  }
}

// ─── State ────────────────────────────────────────────────────────────────────

const opportunities  = ref<any[]>([])
const loading        = ref(true)
const loadingMore    = ref(false)
const error          = ref<string | null>(null)
const totalCount     = ref(0)
const currentPage    = ref(1)
const PAGE_SIZE      = 24

const selectedItem   = ref<any | null>(null)
const search         = ref('')
const activeCategory = ref('')
const freeOnly       = ref(false)

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchOpportunities(reset = true) {
  if (reset) { currentPage.value = 1; loading.value = true }
  else { loadingMore.value = true }
  error.value = null

  try {
    const params: Record<string, any> = { page: currentPage.value, limit: PAGE_SIZE }
    if (search.value.trim())    params.search   = search.value.trim()
    if (activeCategory.value)   params.category = activeCategory.value
    if (freeOnly.value)         params.is_free  = true

    const res = await get('/opportunity/', { params })
    const data  = res.data?.data ?? []
    const count = res.data?.count ?? 0
    const normalized = data.map(normalize)

    if (reset) { opportunities.value = normalized; totalCount.value = count }
    else        { opportunities.value.push(...normalized) }
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

// ─── Watchers ─────────────────────────────────────────────────────────────────

watch(search, debounce(() => fetchOpportunities(true), 400))
watch(activeCategory, () => fetchOpportunities(true))
watch(freeOnly, () => fetchOpportunities(true))
onMounted(() => fetchOpportunities(true))

// ─── Derived ──────────────────────────────────────────────────────────────────

const filtered  = computed(() => opportunities.value)
const hasMore   = computed(() => opportunities.value.length < totalCount.value)
const activeFilters = computed(() =>
  (search.value ? 1 : 0) + (activeCategory.value ? 1 : 0) + (freeOnly.value ? 1 : 0)
)

function clearFilters() {
  search.value = ''
  activeCategory.value = ''
  freeOnly.value = false
  fetchOpportunities(true)
}

// ─── Modal scroll lock ────────────────────────────────────────────────────────

watch(selectedItem, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
})
onUnmounted(() => { document.body.style.overflow = '' })

// ─── Navigate to add ─────────────────────────────────────────────────────────

function handleAddOpportunity() { navigateTo('/new-opportunity') }
</script>

<template>
  <div class="opp-page">

    <!-- ── HERO ─────────────────────────────────────────────────────────────── -->
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

        <!-- search -->
        <div class="opp-search">
          <svg class="opp-search__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"/>
          </svg>
          <input
            v-model="search"
            type="search"
            placeholder="Buscar por nome, área, tags…"
            class="opp-search__input"
          />
          <button v-if="search" @click="search = ''" class="opp-search__clear" aria-label="Limpar">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <p class="opp-hero__cta-hint">
          Não encontrou?
          <button @click="handleAddOpportunity" class="opp-hero__cta-link">Sugira uma oportunidade →</button>
        </p>
      </div>
    </section>

    <!-- ── BODY ──────────────────────────────────────────────────────────────── -->
    <div class="opp-body">

      <!-- sticky filter bar -->
      <div class="opp-filters">
        <div class="opp-filters__inner">
          <!-- category pills -->
          <div class="opp-filters__pills">
            <button
              @click="activeCategory = ''"
              :class="['opp-pill', !activeCategory && 'opp-pill--active']"
            >Todos</button>

            <button
              v-for="(meta, key) in CATEGORY_META"
              :key="key"
              @click="activeCategory = activeCategory === key ? '' : key"
              :class="['opp-pill', activeCategory === key && 'opp-pill--active']"
            >
              <span>{{ meta.icon }}</span> {{ meta.label }}
            </button>
          </div>

          <!-- right controls -->
          <div class="opp-filters__right">
            <!-- free toggle -->
            <button
              @click="freeOnly = !freeOnly"
              :class="['opp-toggle', freeOnly && 'opp-toggle--on']"
              :title="freeOnly ? 'Mostrar todos' : 'Apenas gratuitos'"
            >
              <span class="opp-toggle__knob"></span>
              Gratuito
            </button>

            <!-- spinner -->
            <svg v-if="loading" class="opp-spinner" fill="none" viewBox="0 0 24 24">
              <circle class="opp-spinner__track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opp-spinner__fill" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
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

      <!-- ── MAIN CONTENT ────────────────────────────────────────────────────── -->
      <main class="opp-main">

        <!-- Error -->
        <div v-if="error && !loading" class="opp-state">
          <div class="opp-state__icon opp-state__icon--error">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
          </div>
          <p class="opp-state__title">Erro ao carregar oportunidades</p>
          <p class="opp-state__sub">{{ error }}</p>
          <button @click="fetchOpportunities(true)" class="opp-btn opp-btn--primary">Tentar novamente</button>
        </div>

        <!-- Empty -->
        <div v-else-if="!loading && !error && filtered.length === 0" class="opp-state">
          <div class="opp-state__icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"/>
            </svg>
          </div>
          <p class="opp-state__title">Nenhuma oportunidade encontrada</p>
          <p class="opp-state__sub">Tente outros termos ou remova os filtros aplicados.</p>
          <button @click="clearFilters" class="opp-btn opp-btn--primary">Limpar filtros</button>
        </div>

        <!-- Skeleton -->
        <div v-else-if="loading && filtered.length === 0" class="opp-grid">
          <div v-for="i in 9" :key="i" class="opp-skeleton"></div>
        </div>

        <!-- Cards grid -->
        <div v-if="filtered.length > 0" class="opp-grid">
          <article
            v-for="item in filtered"
            :key="item.id"
            class="opp-card"
            :class="{ 'opp-card--urgent': item.deadline.urgent, 'opp-card--overdue': item.deadline.overdue }"
            @click="selectedItem = item"
            role="button"
            tabindex="0"
            @keydown.enter="selectedItem = item"
          >
            <!-- cover or gradient fallback -->
            <div class="opp-card__cover">
              <img
                v-if="item.cover_url"
                :src="item.cover_url"
                :alt="item.title"
                class="opp-card__img"
                loading="lazy"
              />
              <div v-else class="opp-card__cover-fallback" :style="{ background: `linear-gradient(135deg, ${item.categoryMeta.color}22, ${item.categoryMeta.color}08)` }">
                <span class="opp-card__cover-emoji">{{ item.categoryMeta.icon }}</span>
              </div>

              <!-- badges overlay -->
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
              </div>

              <!-- deadline chip -->
              <div
                v-if="item.next_deadline"
                class="opp-card__deadline"
                :class="{
                  'opp-card__deadline--urgent': item.deadline.urgent,
                  'opp-card__deadline--overdue': item.deadline.overdue
                }"
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"/></svg>
                {{ item.deadline.label }}
              </div>
            </div>

            <div class="opp-card__body">
              <h3 class="opp-card__title">{{ item.title }}</h3>
              <p class="opp-card__excerpt">{{ item.excerpt }}</p>

              <div class="opp-card__meta">
                <!-- location -->
                <span class="opp-meta-chip">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  {{ item.location }}
                </span>

                <!-- free -->
                <span v-if="item.is_free" class="opp-meta-chip opp-meta-chip--free">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Gratuito
                </span>
              </div>

              <!-- tags -->
              <div v-if="item.tags.length > 0" class="opp-card__tags">
                <span v-for="tag in item.tags.slice(0, 3)" :key="tag" class="opp-tag">{{ tag }}</span>
                <span v-if="item.tags.length > 3" class="opp-tag opp-tag--more">+{{ item.tags.length - 3 }}</span>
              </div>
            </div>
          </article>
        </div>

        <!-- Load more -->
        <div v-if="hasMore" class="opp-load-more">
          <button @click="loadMore" :disabled="loadingMore" class="opp-btn opp-btn--ghost">
            <svg v-if="loadingMore" class="opp-spinner opp-spinner--sm" fill="none" viewBox="0 0 24 24">
              <circle class="opp-spinner__track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opp-spinner__fill" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            {{ loadingMore ? 'Carregando…' : `Carregar mais (${totalCount - opportunities.length} restantes)` }}
          </button>
        </div>

      </main>
    </div>

    <!-- ── MODAL ──────────────────────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="selectedItem" class="opp-modal-backdrop" @click.self="selectedItem = null">
          <div class="opp-modal" role="dialog" :aria-label="selectedItem.title">

            <!-- Modal cover -->
            <div class="opp-modal__cover">
              <img
                v-if="selectedItem.cover_url"
                :src="selectedItem.cover_url"
                :alt="selectedItem.title"
                class="opp-modal__cover-img"
              />
              <div v-else class="opp-modal__cover-fallback" :style="{ background: `linear-gradient(135deg, ${selectedItem.categoryMeta.color}33, ${selectedItem.categoryMeta.color}11)` }">
                <span style="font-size: 3rem">{{ selectedItem.categoryMeta.icon }}</span>
              </div>
              <div class="opp-modal__cover-overlay"></div>

              <!-- Close button -->
              <button @click="selectedItem = null" class="opp-modal__close" aria-label="Fechar">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Modal body -->
            <div class="opp-modal__body">
              <!-- header -->
              <div class="opp-modal__header">
                <div class="opp-modal__badges">
                  <span
                    class="opp-badge"
                    :style="{ background: selectedItem.categoryMeta.color + '22', color: selectedItem.categoryMeta.color, border: `1px solid ${selectedItem.categoryMeta.color}44` }"
                  >
                    {{ selectedItem.categoryMeta.icon }} {{ selectedItem.categoryMeta.label }}
                  </span>
                  <span v-if="selectedItem.human_verified" class="opp-badge opp-badge--verified">✓ Verificado</span>
                  <span v-if="selectedItem.is_free" class="opp-badge opp-badge--free">Gratuito</span>
                </div>

                <h2 class="opp-modal__title">{{ selectedItem.title }}</h2>

                <!-- quick info row -->
                <div class="opp-modal__quick">
                  <div v-if="selectedItem.next_deadline" class="opp-modal__info-item"
                    :class="{ 'opp-modal__info-item--urgent': selectedItem.deadline.urgent, 'opp-modal__info-item--overdue': selectedItem.deadline.overdue }">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"/></svg>
                    <span>{{ selectedItem.deadline.label }}</span>
                  </div>

                  <div class="opp-modal__info-item">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span>{{ selectedItem.location }}</span>
                  </div>
                </div>
              </div>

              <!-- description -->
              <div class="opp-modal__section">
                <h3 class="opp-modal__section-title">Sobre a oportunidade</h3>
                <p class="opp-modal__text">{{ selectedItem.description }}</p>
              </div>

              <!-- timeline -->
              <div v-if="selectedItem.timeline.length > 0" class="opp-modal__section">
                <h3 class="opp-modal__section-title">Cronograma</h3>
                <div class="opp-timeline">
                  <div
                    v-for="(event, idx) in selectedItem.timeline"
                    :key="idx"
                    class="opp-timeline__item"
                    :class="{ 'opp-timeline__item--past': event.date && new Date(event.date) < new Date() }"
                  >
                    <div class="opp-timeline__dot"></div>
                    <div class="opp-timeline__content">
                      <span class="opp-timeline__label">{{ event.label ?? event.title ?? event.name ?? 'Evento' }}</span>
                      <span v-if="event.date" class="opp-timeline__date">{{ fmtDate(event.date) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- tags -->
              <div v-if="selectedItem.tags.length > 0" class="opp-modal__section">
                <h3 class="opp-modal__section-title">Tags</h3>
                <div class="opp-card__tags">
                  <span v-for="tag in selectedItem.tags" :key="tag" class="opp-tag">{{ tag }}</span>
                </div>
              </div>

              <!-- CTA -->
              <div v-if="selectedItem.official_site_url" class="opp-modal__cta">
                <a
                  :href="selectedItem.official_site_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="opp-btn opp-btn--cta"
                >
                  Acessar site oficial
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
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
/* ── Fonts ──────────────────────────────────────────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;1,400&display=swap');

/* ── Base ───────────────────────────────────────────────────────────────────── */
.opp-page {
  font-family: 'DM Sans', sans-serif;
  background: #fafaf9;
  min-height: 100vh;
  color: #1c1917;
}

/* ── Hero ───────────────────────────────────────────────────────────────────── */
.opp-hero {
  position: relative;
  overflow: hidden;
  background: #0f1117;
  padding: 80px 24px 72px;
  display: flex;
  justify-content: center;
}

.opp-hero__noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  opacity: 0.6;
  pointer-events: none;
}

.opp-hero__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  opacity: 0.35;
}
.opp-hero__glow--a {
  width: 500px; height: 500px;
  background: radial-gradient(circle, #10b981 0%, transparent 70%);
  top: -160px; left: 10%;
}
.opp-hero__glow--b {
  width: 400px; height: 400px;
  background: radial-gradient(circle, #6366f1 0%, transparent 70%);
  bottom: -120px; right: 15%;
}

.opp-hero__inner {
  position: relative;
  z-index: 1;
  max-width: 640px;
  width: 100%;
  text-align: center;
}

.opp-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: 'Sora', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6ee7b7;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 5px 14px;
  border-radius: 100px;
  margin-bottom: 28px;
}

.opp-hero__dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.7); }
}

.opp-hero__title {
  font-family: 'Sora', sans-serif;
  font-size: clamp(2rem, 5.5vw, 3.25rem);
  font-weight: 800;
  line-height: 1.06;
  letter-spacing: -0.025em;
  color: #f9fafb;
  margin-bottom: 16px;
}

.opp-hero__em {
  font-style: normal;
  background: linear-gradient(135deg, #34d399, #6ee7b7, #a7f3d0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.opp-hero__sub {
  font-size: 15px;
  line-height: 1.65;
  color: #9ca3af;
  max-width: 420px;
  margin: 0 auto 32px;
}

/* ── Search ─────────────────────────────────────────────────────────────────── */
.opp-search {
  position: relative;
  max-width: 480px;
  margin: 0 auto;
}

.opp-search__icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px; height: 16px;
  color: #6b7280;
  pointer-events: none;
}

.opp-search__input {
  width: 100%;
  padding: 14px 44px 14px 44px;
  border-radius: 14px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  color: #f9fafb;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}
.opp-search__input::placeholder { color: #6b7280; }
.opp-search__input:focus {
  background: rgba(255,255,255,0.09);
  border-color: rgba(16, 185, 129, 0.4);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
}

.opp-search__clear {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.08);
  border: none;
  border-radius: 50%;
  color: #9ca3af;
  cursor: pointer;
  transition: background 0.15s;
}
.opp-search__clear:hover { background: rgba(255,255,255,0.14); }
.opp-search__clear svg { width: 11px; height: 11px; }

.opp-hero__cta-hint {
  margin-top: 14px;
  font-size: 12px;
  color: #6b7280;
}

.opp-hero__cta-link {
  color: #34d399;
  font-weight: 600;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}
.opp-hero__cta-link:hover { color: #6ee7b7; }

/* ── Body ───────────────────────────────────────────────────────────────────── */
.opp-body {
  background: #fafaf9;
}

/* ── Filters ────────────────────────────────────────────────────────────────── */
.opp-filters {
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(250,250,249,0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid #e7e5e4;
}

.opp-filters__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.opp-filters__pills {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  flex: 1;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.opp-filters__pills::-webkit-scrollbar { display: none; }

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
  transition: all 0.15s;
}
.opp-pill:hover { color: #1c1917; border-color: #d6d3d1; }
.opp-pill--active {
  background: #1c1917;
  color: white;
  border-color: #1c1917;
}

.opp-filters__right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.opp-toggle {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px 6px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  border: 1px solid #e7e5e4;
  background: white;
  color: #78716c;
  cursor: pointer;
  transition: all 0.2s;
}
.opp-toggle--on {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #065f46;
}

.opp-toggle__knob {
  width: 24px; height: 14px;
  border-radius: 100px;
  background: #d6d3d1;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}
.opp-toggle__knob::after {
  content: '';
  position: absolute;
  width: 10px; height: 10px;
  border-radius: 50%;
  background: white;
  top: 2px; left: 2px;
  transition: transform 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.opp-toggle--on .opp-toggle__knob {
  background: #10b981;
}
.opp-toggle--on .opp-toggle__knob::after {
  transform: translateX(10px);
}

.opp-count {
  font-size: 11px;
  font-weight: 500;
  color: #a8a29e;
  white-space: nowrap;
}

.opp-clear {
  font-size: 11px;
  font-weight: 700;
  color: #059669;
  background: none;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  padding: 0;
  transition: color 0.15s;
}
.opp-clear:hover { color: #047857; }

/* ── Spinner ────────────────────────────────────────────────────────────────── */
.opp-spinner {
  width: 14px; height: 14px;
  animation: spin 0.8s linear infinite;
  color: #a8a29e;
}
.opp-spinner--sm { width: 13px; height: 13px; }
.opp-spinner__track { opacity: 0.2; }
.opp-spinner__fill { opacity: 0.8; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Main ───────────────────────────────────────────────────────────────────── */
.opp-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}

/* ── State ──────────────────────────────────────────────────────────────────── */
.opp-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
  gap: 12px;
}
.opp-state__icon {
  width: 52px; height: 52px;
  background: #f5f5f4;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  color: #d6d3d1;
  margin-bottom: 4px;
}
.opp-state__icon svg { width: 22px; height: 22px; }
.opp-state__icon--error { background: #fff1f2; color: #fca5a5; }
.opp-state__title { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 700; color: #1c1917; }
.opp-state__sub { font-size: 13px; color: #a8a29e; max-width: 280px; line-height: 1.5; }

/* ── Skeleton ───────────────────────────────────────────────────────────────── */
.opp-skeleton {
  height: 340px;
  border-radius: 16px;
  background: linear-gradient(90deg, #f5f5f4 25%, #ece8e4 50%, #f5f5f4 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Grid ───────────────────────────────────────────────────────────────────── */
.opp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

/* ── Card ───────────────────────────────────────────────────────────────────── */
.opp-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #f0ece8;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  display: flex;
  flex-direction: column;
}
.opp-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.09);
  border-color: #e7e5e4;
}
.opp-card:focus-visible {
  outline: 2px solid #10b981;
  outline-offset: 2px;
}

.opp-card--urgent { border-color: #fed7aa; }
.opp-card--urgent:hover { border-color: #fdba74; }

.opp-card__cover {
  position: relative;
  height: 160px;
  overflow: hidden;
  background: #f5f5f4;
  flex-shrink: 0;
}
.opp-card__img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}
.opp-card:hover .opp-card__img { transform: scale(1.04); }

.opp-card__cover-fallback {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
}
.opp-card__cover-emoji { font-size: 2.5rem; opacity: 0.7; }

.opp-card__badges {
  position: absolute;
  top: 10px; left: 10px;
  display: flex; flex-wrap: wrap; gap: 5px;
}

.opp-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 6px;
  font-family: 'Sora', sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.01em;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.opp-badge--verified {
  background: rgba(255,255,255,0.9);
  color: #059669;
  border: 1px solid rgba(16,185,129,0.3);
}
.opp-badge--free {
  background: rgba(16,185,129,0.15);
  color: #047857;
  border: 1px solid rgba(16,185,129,0.25);
}

.opp-card__deadline {
  position: absolute;
  bottom: 10px; right: 10px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Sora', sans-serif;
  background: rgba(28, 25, 23, 0.75);
  color: #e7e5e4;
  backdrop-filter: blur(8px);
}
.opp-card__deadline svg { width: 12px; height: 12px; }
.opp-card__deadline--urgent { background: rgba(234, 88, 12, 0.85); color: white; }
.opp-card__deadline--overdue { background: rgba(107,114,128,0.7); color: #e7e5e4; }

.opp-card__body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.opp-card__title {
  font-family: 'Sora', sans-serif;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.35;
  color: #1c1917;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.opp-card__excerpt {
  font-size: 12.5px;
  line-height: 1.55;
  color: #78716c;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.opp-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.opp-meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  color: #78716c;
  background: #f5f5f4;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid #e7e5e4;
}
.opp-meta-chip svg { width: 11px; height: 11px; }
.opp-meta-chip--free { background: #ecfdf5; color: #065f46; border-color: #a7f3d0; }

.opp-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 2px;
}

.opp-tag {
  font-size: 10.5px;
  font-weight: 500;
  color: #a8a29e;
  background: #f5f5f4;
  border: 1px solid #e7e5e4;
  padding: 2px 8px;
  border-radius: 5px;
}
.opp-tag--more {
  background: none;
  color: #c4b5a5;
  border-color: transparent;
}

/* ── Buttons ────────────────────────────────────────────────────────────────── */
.opp-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 10px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.18s;
}
.opp-btn--primary {
  background: #059669;
  color: white;
}
.opp-btn--primary:hover { background: #047857; }

.opp-btn--ghost {
  background: white;
  color: #57534e;
  border: 1px solid #e7e5e4;
}
.opp-btn--ghost:hover { color: #1c1917; border-color: #d6d3d1; background: #fafaf9; }
.opp-btn--ghost:disabled { opacity: 0.5; cursor: not-allowed; }

.opp-btn--cta {
  background: #1c1917;
  color: white;
  padding: 13px 24px;
  border-radius: 12px;
  font-size: 14px;
  width: 100%;
  justify-content: center;
}
.opp-btn--cta:hover { background: #292524; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.18); }
.opp-btn--cta svg { width: 16px; height: 16px; }

/* ── Load more ──────────────────────────────────────────────────────────────── */
.opp-load-more {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

/* ── Modal ──────────────────────────────────────────────────────────────────── */
.opp-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(15, 17, 23, 0.6);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
}

@media (min-width: 640px) {
  .opp-modal-backdrop {
    align-items: center;
    padding: 24px;
  }
}

.opp-modal {
  background: white;
  border-radius: 24px 24px 0 0;
  width: 100%;
  max-width: 600px;
  max-height: 92dvh;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  box-shadow: 0 -8px 48px rgba(0,0,0,0.2);
}
.opp-modal::-webkit-scrollbar { display: none; }

@media (min-width: 640px) {
  .opp-modal { border-radius: 24px; box-shadow: 0 24px 80px rgba(0,0,0,0.28); }
}

.opp-modal__cover {
  position: relative;
  height: 220px;
  background: #f5f5f4;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 24px 24px 0 0;
}
.opp-modal__cover-img {
  width: 100%; height: 100%;
  object-fit: cover;
}
.opp-modal__cover-fallback {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
}
.opp-modal__cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.35), transparent 60%);
}

.opp-modal__close {
  position: absolute;
  top: 14px; right: 14px;
  width: 34px; height: 34px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(8px);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: background 0.15s;
  z-index: 1;
}
.opp-modal__close:hover { background: rgba(0,0,0,0.65); }
.opp-modal__close svg { width: 15px; height: 15px; }

.opp-modal__body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.opp-modal__header { display: flex; flex-direction: column; gap: 10px; }

.opp-modal__badges { display: flex; flex-wrap: wrap; gap: 6px; }

.opp-modal__title {
  font-family: 'Sora', sans-serif;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: #1c1917;
}

.opp-modal__quick {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.opp-modal__info-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 500;
  color: #78716c;
}
.opp-modal__info-item svg { width: 14px; height: 14px; }
.opp-modal__info-item--urgent { color: #ea580c; font-weight: 600; }
.opp-modal__info-item--overdue { color: #9ca3af; }

.opp-modal__section { display: flex; flex-direction: column; gap: 10px; }

.opp-modal__section-title {
  font-family: 'Sora', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #a8a29e;
}

.opp-modal__text {
  font-size: 14px;
  line-height: 1.7;
  color: #44403c;
}

/* ── Timeline ───────────────────────────────────────────────────────────────── */
.opp-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-left: 8px;
}

.opp-timeline__item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding-bottom: 16px;
  position: relative;
}
.opp-timeline__item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 20px;
  bottom: 0;
  width: 1px;
  background: #e7e5e4;
}

.opp-timeline__dot {
  width: 11px; height: 11px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid white;
  box-shadow: 0 0 0 2px #10b981;
  flex-shrink: 0;
  margin-top: 3px;
}

.opp-timeline__item--past .opp-timeline__dot {
  background: #d6d3d1;
  box-shadow: 0 0 0 2px #d6d3d1;
}

.opp-timeline__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.opp-timeline__label {
  font-size: 13.5px;
  font-weight: 600;
  color: #1c1917;
}

.opp-timeline__date {
  font-size: 12px;
  color: #a8a29e;
}

/* ── Modal CTA ──────────────────────────────────────────────────────────────── */
.opp-modal__cta {
  padding-top: 8px;
  padding-bottom: 8px;
}

/* ── Modal transitions ──────────────────────────────────────────────────────── */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.22s ease;
}
.modal-enter-active .opp-modal,
.modal-leave-active .opp-modal {
  transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.22s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .opp-modal {
  transform: translateY(40px);
  opacity: 0;
}
.modal-leave-to .opp-modal {
  transform: translateY(40px);
  opacity: 0;
}

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .opp-hero { padding: 60px 20px 56px; }
  .opp-filters__inner { padding: 10px 16px; }
  .opp-main { padding: 20px 16px 60px; }
  .opp-grid { grid-template-columns: 1fr; gap: 14px; }
  .opp-modal__body { padding: 20px; }
  .opp-filters__right { gap: 8px; }
  .opp-toggle span:not(.opp-toggle__knob) { display: none; }
}
</style>