<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({ title: 'Início — seConecta' })

type TimelineKind =
  | 'registration_start'
  | 'registration_deadline'
  | 'exam'
  | 'phase'
  | 'result'
  | 'submission_deadline'
  | 'other'
  | string

type TimelineItem = {
  kind: TimelineKind
  label: string
  date: string
  details?: string | null
  show_on_calendar: boolean
}

type HomeOpportunity = {
  id: number
  slug: string | null
  title: string
  category: string
  subject?: string | null
  excerpt: string
  location: string
  is_free: boolean
  priority: number
  cover_url?: string | null
  tags: string[]
  timeline: TimelineItem[]
  availability_context?: string | null
  fit_band?: string | null
  selection_bucket?: string | null
  recommendation_score?: number | null
  reason?: string | null
  reasons?: string[]
}

type HomePost = {
  id: number
  slug?: string | null
  title: string
  type: 'Jornal' | 'Guia' | 'Notícia' | 'Post'
  excerpt: string
  read_time: string
  tag: string
}

const router = useRouter()
const { get } = useAxios()
const { currentUser, restoreSession } = useAuth()

const opportunities = ref<HomeOpportunity[]>([])
const recommendedOpportunities = ref<HomeOpportunity[]>([])
const posts = ref<HomePost[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

function normalizeJsonObject(value: any) {
  if (!value) return {}

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value
  }

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

function normalizeTags(value: any): string[] {
  if (Array.isArray(value)) {
    return value
      .map(tag => String(tag).trim())
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)

      if (Array.isArray(parsed)) {
        return parsed
          .map(tag => String(tag).trim())
          .filter(Boolean)
      }
    } catch {}

    return value
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)
  }

  return []
}

function getDateValue(event: any): string | null {
  return event?.date || event?.start_date || event?.end_date || null
}

function normalizeTimeline(value: any, fallbackDeadline?: string | null): TimelineItem[] {
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

  const normalized = timeline
    .filter(event => event && typeof event === 'object')
    .map((event) => {
      const date = getDateValue(event)

      if (!date) return null

      return {
        kind: event.kind || 'other',
        label: event.label || event.details || event.title || event.name || 'Evento',
        date,
        details: event.details || event.description || null,
        show_on_calendar: event.show_on_calendar === true || event.show_on_calendar === 'true',
      }
    })
    .filter(Boolean) as TimelineItem[]

  if (normalized.length === 0 && fallbackDeadline) {
    normalized.push({
      kind: 'other',
      label: 'Próximo prazo',
      date: fallbackDeadline,
      details: 'Data importante cadastrada para esta oportunidade.',
      show_on_calendar: true,
    })
  }

  return normalized
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

function formatShortDate(raw: string | null | undefined) {
  const date = parseLocalDate(raw)

  if (!date) return 'Sem data'

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

function daysUntil(raw: string | null | undefined) {
  const target = parseLocalDate(raw)

  if (!target) return null

  const now = new Date()
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000)
}

function getTimelineKindLabel(kind: TimelineKind) {
  const labels: Record<string, string> = {
    registration_start: 'Inscrições abrem',
    registration_deadline: 'Inscrições fecham',
    exam: 'Prova',
    phase: 'Fase',
    result: 'Resultado',
    submission_deadline: 'Envio até',
    other: 'Evento',
  }

  return labels[kind] || 'Evento'
}

function getTimelineTone(kind: TimelineKind) {
  if (kind === 'registration_deadline') return 'urgent'
  if (kind === 'registration_start') return 'open'
  if (kind === 'exam' || kind === 'phase') return 'blue'
  if (kind === 'result') return 'purple'

  return 'neutral'
}

function normalizeOpportunity(raw: any): HomeOpportunity {
  const categoryData = normalizeJsonObject(raw?.category_data)
  const tags = normalizeTags(raw?.tags)

  const subject =
    categoryData.subject ||
    categoryData.area ||
    categoryData.field ||
    categoryData.theme ||
    raw?.subject ||
    null

  const timeline = normalizeTimeline(raw?.timeline, raw?.next_deadline)

  return {
    id: Number(raw?.id),
    slug: raw?.slug ?? null,
    title: raw?.title || 'Oportunidade sem título',
    category: raw?.category || 'OPPORTUNITY',
    subject,
    excerpt: raw?.excerpt || raw?.description?.slice(0, 160) || 'Oportunidade cadastrada no seConecta.',
    location: raw?.location || 'Online',
    is_free: Boolean(raw?.is_free),
    priority: typeof raw?.priority === 'number' ? raw.priority : 0,
    cover_url: raw?.cover_url || null,
    tags,
    timeline,
    availability_context: raw?.availability_context ?? null,
    fit_band: raw?.fit_band ?? null,
    selection_bucket: raw?.selection_bucket ?? null,
    recommendation_score: typeof raw?.recommendation_score === 'number' ? raw.recommendation_score : null,
    reason: raw?.reason ?? null,
    reasons: Array.isArray(raw?.reasons) ? raw.reasons : [],
  }
}

function normalizePost(raw: any): HomePost {
  const tags = normalizeTags(raw?.tags)
  const rawType = String(raw?.type || raw?.post_type || '').toUpperCase()

  let type: HomePost['type'] = 'Post'

  if (rawType.includes('GUIDE') || rawType.includes('GUIA')) type = 'Guia'
  else if (rawType.includes('NEWS') || rawType.includes('NOTÍCIA') || rawType.includes('NOTICIA')) type = 'Notícia'
  else if (raw?.title?.toLowerCase?.().includes('jornal')) type = 'Jornal'

  return {
    id: Number(raw?.id),
    slug: raw?.slug ?? null,
    title: raw?.title || 'Post sem título',
    type,
    excerpt: raw?.excerpt || raw?.description?.slice(0, 150) || raw?.content?.slice(0, 150) || '',
    read_time: raw?.read_time || '3min',
    tag: tags[0] || raw?.category || 'seconecta',
  }
}

function normalizeInterests(value: any): string[] {
  if (Array.isArray(value)) {
    return value
      .map(item => String(item).trim())
      .filter(Boolean)
      .slice(0, 6)
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)

      if (Array.isArray(parsed)) {
        return parsed
          .map(item => String(item).trim())
          .filter(Boolean)
          .slice(0, 6)
      }
    } catch {}

    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
      .slice(0, 6)
  }

  return []
}

function getRegistrationStatus(item: HomeOpportunity) {
  const now = new Date()

  const starts = item.timeline
    .filter(event => event.kind === 'registration_start')
    .map(event => parseLocalDate(event.date))
    .filter(Boolean) as Date[]

  const deadlines = item.timeline
    .filter(event => event.kind === 'registration_deadline')
    .map(event => parseLocalDate(event.date))
    .filter(Boolean) as Date[]

  starts.sort((a, b) => a.getTime() - b.getTime())
  deadlines.sort((a, b) => a.getTime() - b.getTime())

  const nextStart = starts.find(date => date >= now) || null
  const nextDeadline = deadlines.find(date => date >= now) || null
  const lastStart = [...starts].reverse().find(date => date <= now) || null

  if ((!starts.length || lastStart) && nextDeadline) {
    return {
      key: 'open',
      label: 'Inscrições abertas',
      detail: `até ${formatShortDate(nextDeadline.toISOString())}`,
    }
  }

  if (nextStart && nextDeadline) {
    return {
      key: 'soon',
      label: 'Abrem em breve',
      detail: formatShortDate(nextStart.toISOString()),
    }
  }

  return {
    key: 'none',
    label: 'Sem inscrição ativa',
    detail: '',
  }
}

function getOpportunityStatus(item: HomeOpportunity) {
  const availability = String(item.availability_context || '').toUpperCase()

  if (availability === 'APPLY_NOW') {
    return {
      key: 'open',
      label: 'Para agora',
      detail: '',
    }
  }

  if (availability === 'CLOSING_SOON') {
    return {
      key: 'urgent',
      label: 'Prazo próximo',
      detail: '',
    }
  }

  if (availability === 'EVERGREEN') {
    return {
      key: 'evergreen',
      label: 'Disponível',
      detail: '',
    }
  }

  if (availability === 'PREPARE_NOW') {
    return {
      key: 'soon',
      label: 'Prepare-se',
      detail: '',
    }
  }

  if (availability === 'WATCH_NEXT_CYCLE') {
    return {
      key: 'watch',
      label: 'Próximo ciclo',
      detail: '',
    }
  }

  return getRegistrationStatus(item)
}

function getFitBandLabel(item: HomeOpportunity) {
  const fitBand = String(item.fit_band || '').toUpperCase()

  const labels: Record<string, string> = {
    SAFETY: 'Bom começo',
    TARGET: 'Ideal para você',
    REACH: 'Desafio possível',
    ASPIRATIONAL: 'Meta futura',
  }

  return labels[fitBand] || ''
}

function getOpportunityPath(item: HomeOpportunity) {
  const open = item.slug || String(item.id)

  if (item.category === 'OLYMPIAD') {
    return {
      path: '/olimpiadas',
      query: { open },
    }
  }

  return {
    path: '/oportunidades',
    query: { open },
  }
}

function openOpportunity(item: HomeOpportunity) {
  router.push(getOpportunityPath(item))
}

function openPost(post: HomePost) {
  router.push(`/feed/${post.slug || post.id}`)
}

async function fetchHome() {
  loading.value = true
  error.value = null
  recommendedOpportunities.value = []

  try {
    await restoreSession()

    const shouldFetchPersonalized = Boolean(currentUser.value?.preferences_set)

    const personalizedRecommendationsPromise = shouldFetchPersonalized
      ? get('/opportunity/recommended/for-you', {
          params: {
            surface: 'HOME',
            track: 'mixed',
            limit: 8,
            candidate_limit: 200,
          },
        })
      : Promise.resolve(null)

    const [opportunitiesResult, personalizedRecommendationsResult, postsResult] = await Promise.allSettled([
      get('/opportunity/cards', {
        params: {
          page: 1,
          limit: 8,
        },
      }),
      personalizedRecommendationsPromise,
      get('/posts/feed', {
        params: {
          page: 1,
          limit: 3,
        },
      }).catch(() => get('/posts/', {
        params: {
          page: 1,
          limit: 3,
        },
      })),
    ])

    if (opportunitiesResult.status === 'fulfilled') {
      const data = opportunitiesResult.value.data?.data ?? []
      opportunities.value = data.map(normalizeOpportunity)
    }

    if (
      personalizedRecommendationsResult.status === 'fulfilled' &&
      personalizedRecommendationsResult.value
    ) {
      const data = personalizedRecommendationsResult.value.data?.data ?? []
      recommendedOpportunities.value = data.map(normalizeOpportunity)
    }

    if (personalizedRecommendationsResult.status === 'rejected') {
      console.warn('[home] Could not load personalized recommendations:', personalizedRecommendationsResult.reason)
    }

    if (postsResult.status === 'fulfilled') {
      const data = postsResult.value.data?.data ?? []
      posts.value = data.map(normalizePost)
    }

    if (opportunitiesResult.status === 'rejected' && postsResult.status === 'rejected') {
      throw new Error('Não foi possível carregar seu painel.')
    }
  } catch (e: any) {
    error.value = e?.response?.data?.detail || e?.message || 'Não foi possível carregar seu painel.'
  } finally {
    loading.value = false
  }
}

const firstName = computed(() => {
  const name =
    currentUser.value?.full_name ||
    currentUser.value?.username ||
    currentUser.value?.email ||
    'estudante'

  return String(name).trim().split(' ')[0]
})

const userInitial = computed(() => {
  return firstName.value.charAt(0).toUpperCase()
})

const hasPreferencesSet = computed(() => Boolean(currentUser.value?.preferences_set))

const userInterests = computed(() => {
  return normalizeInterests(
    currentUser.value?.interests ||
    currentUser.value?.subjects ||
    currentUser.value?.areas ||
    currentUser.value?.profile_interests,
  )
})

const agendaItems = computed(() => {
  return opportunities.value
    .flatMap(item =>
      item.timeline
        .filter(event => event.show_on_calendar)
        .map(event => {
          const daysLeft = daysUntil(event.date)
          const date = parseLocalDate(event.date)

          return {
            opportunity: item,
            event,
            date,
            daysLeft,
          }
        })
    )
    .filter(item => item.date && item.daysLeft !== null && item.daysLeft >= 0)
    .sort((a, b) => {
      return (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0)
    })
    .slice(0, 5)
})

const fallbackRecommendedItems = computed(() => {
  return [...opportunities.value]
    .sort((a, b) => {
      const priorityDiff = b.priority - a.priority

      if (priorityDiff !== 0) return priorityDiff

      const aDate = a.timeline
        .map(event => parseLocalDate(event.date)?.getTime())
        .filter(Boolean)
        .sort((x, y) => Number(x) - Number(y))[0] ?? Number.POSITIVE_INFINITY

      const bDate = b.timeline
        .map(event => parseLocalDate(event.date)?.getTime())
        .filter(Boolean)
        .sort((x, y) => Number(x) - Number(y))[0] ?? Number.POSITIVE_INFINITY

      return Number(aDate) - Number(bDate)
    })
    .slice(0, 4)
})

const recommendedItems = computed(() => {
  if (hasPreferencesSet.value && recommendedOpportunities.value.length > 0) {
    return recommendedOpportunities.value.slice(0, 4)
  }

  return fallbackRecommendedItems.value
})

const recommendationSectionDescription = computed(() => {
  if (hasPreferencesSet.value && recommendedOpportunities.value.length > 0) {
    return 'Selecionadas pelo seu perfil, interesses, nível e momento atual.'
  }

  if (hasPreferencesSet.value) {
    return 'Não consegui carregar recomendações personalizadas agora; mostrando oportunidades recentes em destaque.'
  }

  return 'Uma seleção curta, misturando prioridade, prazo e oportunidades recentes.'
})

const urgentCount = computed(() => {
  return agendaItems.value.filter(item => item.daysLeft !== null && item.daysLeft <= 10).length
})

const nextAction = computed(() => {
  const urgent = agendaItems.value.find(item => item.daysLeft !== null && item.daysLeft <= 10)

  if (urgent) {
    return {
      title: `${urgentCount.value} prazo${urgentCount.value > 1 ? 's' : ''} importante${urgentCount.value > 1 ? 's' : ''} nos próximos dias`,
      text: `${urgent.opportunity.title}: ${getTimelineKindLabel(urgent.event.kind).toLowerCase()} em ${formatShortDate(urgent.event.date)}.`,
      cta: 'Ver agenda',
      action: () => router.push('/calendario'),
    }
  }

  if (recommendedItems.value.length > 0) {
    return {
      title: 'Novas recomendações para você',
      text: 'Encontramos oportunidades recentes para explorar no seConecta.',
      cta: 'Ver recomendações',
      action: () => router.push('/oportunidades'),
    }
  }

  return {
    title: 'Monte seu perfil para receber recomendações melhores',
    text: 'Escolha seus interesses e acompanhe oportunidades, olimpíadas e guias em um só lugar.',
    cta: 'Editar perfil',
    action: () => router.push('/perfil'),
  }
})

onMounted(fetchHome)
</script>

<template>
  <div class="home-page">
    <main class="home-main">
      <header class="home-topbar">
        <div>
          <p class="page-eyebrow">Início</p>
          <h1>Bom te ver, {{ firstName }}.</h1>
        </div>

        <button type="button" class="profile-pill" @click="router.push('/perfil')">
          <span>{{ userInitial }}</span>
          Meu perfil
        </button>
      </header>

      <div v-if="loading" class="home-loading">
        <div class="loading-block loading-block--hero" />
        <div class="loading-grid">
          <div v-for="i in 4" :key="i" class="loading-block" />
        </div>
      </div>

      <div v-else-if="error" class="home-error">
        <strong>Não foi possível carregar seu painel.</strong>
        <span>{{ error }}</span>
        <button type="button" @click="fetchHome">Tentar novamente</button>
      </div>

      <template v-else>
        <section class="next-step-card">
          <div class="next-step-card__content">
            <span class="soft-badge">Seu próximo passo</span>
            <h2>{{ nextAction.title }}</h2>
            <p>{{ nextAction.text }}</p>

            <div class="next-step-card__actions">
              <button type="button" class="primary-btn" @click="nextAction.action">
                {{ nextAction.cta }}
              </button>

              <button type="button" class="ghost-btn" @click="router.push('/calendario')">
                Abrir calendário
              </button>
            </div>
          </div>

          <div class="next-step-card__aside">
            <span>Interesses</span>

            <div v-if="userInterests.length > 0" class="interest-list">
              <small v-for="interest in userInterests" :key="interest">
                #{{ interest }}
              </small>
            </div>

            <p v-else class="empty-aside">
              Complete seu perfil para personalizar melhor o painel.
            </p>
          </div>
        </section>

        <section class="home-section">
          <div class="section-header">
            <div>
              <h2>Para você agora</h2>
              <p>{{ recommendationSectionDescription }}</p>
            </div>

            <button type="button" class="text-btn" @click="router.push('/oportunidades')">
              Ver tudo
            </button>
          </div>

          <div v-if="recommendedItems.length > 0" class="recommendation-grid">
            <article
              v-for="item in recommendedItems"
              :key="item.id"
              class="opportunity-card"
              role="button"
              tabindex="0"
              @click="openOpportunity(item)"
              @keydown.enter="openOpportunity(item)"
            >
              <div class="opportunity-card__cover">
                <img v-if="item.cover_url" :src="item.cover_url" :alt="item.title" />

                <div v-else class="cover-fallback">
                  {{ item.subject?.charAt(0) || item.category?.charAt(0) || '✦' }}
                </div>

                <span
                  class="registration-chip"
                  :class="`registration-chip--${getOpportunityStatus(item).key}`"
                >
                  {{ getOpportunityStatus(item).label }}
                </span>
              </div>

              <div class="opportunity-card__body">
                <div class="card-meta">
                  <span>{{ item.subject || item.category }}</span>
                  <span v-if="getFitBandLabel(item)">{{ getFitBandLabel(item) }}</span>
                  <span v-else-if="item.is_free">Gratuita</span>
                </div>

                <h3>{{ item.title }}</h3>
                <p>{{ item.excerpt }}</p>

                <div v-if="item.tags.length > 0" class="tag-row">
                  <small v-for="tag in item.tags.slice(0, 2)" :key="tag">
                    #{{ tag }}
                  </small>
                </div>
              </div>
            </article>
          </div>

          <div v-else class="empty-card">
            <strong>Nenhuma recomendação ainda.</strong>
            <span>Quando novas oportunidades forem cadastradas, elas aparecerão aqui.</span>
          </div>
        </section>

        <div class="home-columns">
          <section class="home-section agenda-section">
            <div class="section-header">
              <div>
                <h2>Próximas datas</h2>
                <p>Agenda acionável com inscrições, provas e resultados.</p>
              </div>

              <button type="button" class="text-btn" @click="router.push('/calendario')">
                Calendário
              </button>
            </div>

            <div v-if="agendaItems.length > 0" class="agenda-list">
              <article
                v-for="item in agendaItems"
                :key="`${item.opportunity.id}-${item.event.date}-${item.event.label}`"
                class="agenda-item"
                role="button"
                tabindex="0"
                @click="openOpportunity(item.opportunity)"
                @keydown.enter="openOpportunity(item.opportunity)"
              >
                <div class="agenda-date">
                  <strong>{{ formatShortDate(item.event.date).split(' ')[0] }}</strong>
                  <span>{{ formatShortDate(item.event.date).split(' ')[1] }}</span>
                </div>

                <div class="agenda-content">
                  <span
                    class="agenda-kind"
                    :class="`agenda-kind--${getTimelineTone(item.event.kind)}`"
                  >
                    {{ getTimelineKindLabel(item.event.kind) }}
                  </span>

                  <h3>{{ item.opportunity.title }}</h3>
                  <p>{{ item.event.details || item.event.label }}</p>
                </div>
              </article>
            </div>

            <div v-else class="empty-card empty-card--compact">
              <strong>Sem datas próximas.</strong>
              <span>Novos prazos aparecem aqui quando forem cadastrados.</span>
            </div>
          </section>

          <section class="home-section news-section">
            <div class="section-header">
              <div>
                <h2>Novidades e guias</h2>
                <p>Posts recentes do feed e Jornal seConecta.</p>
              </div>

              <button type="button" class="text-btn" @click="router.push('/feed')">
                Feed
              </button>
            </div>

            <div v-if="posts.length > 0" class="news-list">
              <article
                v-for="post in posts"
                :key="post.id"
                class="news-item"
                role="button"
                tabindex="0"
                @click="openPost(post)"
                @keydown.enter="openPost(post)"
              >
                <div>
                  <span>{{ post.type }} · {{ post.read_time }}</span>
                  <h3>{{ post.title }}</h3>
                  <p>{{ post.excerpt }}</p>
                </div>

                <small>#{{ post.tag }}</small>
              </article>
            </div>

            <div v-else class="empty-card empty-card--compact">
              <strong>Nenhum post recente.</strong>
              <span>Os próximos guias e notícias aparecerão aqui.</span>
            </div>
          </section>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(7, 146, 114, .08), transparent 32rem),
    #fafaf9;
  color: #1c1917;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.home-main {
  max-width: 1160px;
  width: 100%;
  margin: 0 auto;
  padding: 30px 28px 80px;
}

.home-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.page-eyebrow {
  margin: 0 0 4px;
  color: #079272;
  font-size: .72rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .12em;
}

.home-topbar h1 {
  margin: 0;
  color: #111;
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  letter-spacing: -.05em;
  line-height: 1;
}

.profile-pill {
  border: 1px solid #e8e4dc;
  background: white;
  color: #444;
  border-radius: 999px;
  padding: 8px 12px 8px 8px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 850;
  cursor: pointer;
}

.profile-pill span {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #0f172a;
  color: white;
  display: grid;
  place-items: center;
}

.next-step-card {
  border: 1px solid #d6f3ea;
  border-radius: 28px;
  padding: 26px;
  background:
    linear-gradient(135deg, rgba(7, 146, 114, .12), transparent 55%),
    white;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 18px;
  box-shadow: 0 18px 60px rgba(7, 146, 114, .08);
}

.soft-badge {
  display: inline-flex;
  width: fit-content;
  border: 1px solid #a7f3d0;
  background: #ecfdf5;
  color: #047857;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: .7rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.next-step-card h2 {
  margin: 14px 0 8px;
  color: #111;
  font-size: clamp(1.35rem, 2.5vw, 2.1rem);
  letter-spacing: -.04em;
  line-height: 1.1;
}

.next-step-card p {
  margin: 0;
  color: #666;
  line-height: 1.6;
  max-width: 620px;
}

.next-step-card__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.primary-btn,
.ghost-btn {
  border: none;
  border-radius: 14px;
  padding: 11px 15px;
  font-size: .84rem;
  font-weight: 950;
  cursor: pointer;
}

.primary-btn {
  background: #079272;
  color: white;
}

.ghost-btn {
  background: #f7f5f0;
  color: #555;
}

.next-step-card__aside {
  border: 1px solid #e8e4dc;
  background: rgba(255,255,255,.7);
  border-radius: 22px;
  padding: 16px;
}

.next-step-card__aside > span {
  display: block;
  color: #999;
  font-size: .72rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .08em;
  margin-bottom: 10px;
}

.interest-list {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.interest-list small,
.tag-row small {
  border-radius: 999px;
  background: #f0faf7;
  color: #079272;
  border: 1px solid #c5e8df;
  padding: 5px 8px;
  font-size: .68rem;
  font-weight: 850;
}

.empty-aside {
  font-size: .78rem;
}

.home-section {
  margin-top: 30px;
}

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.section-header h2 {
  margin: 0 0 5px;
  color: #111;
  font-size: 1.15rem;
  letter-spacing: -.03em;
}

.section-header p {
  margin: 0;
  color: #888;
  font-size: .82rem;
  line-height: 1.45;
}

.text-btn {
  border: none;
  background: transparent;
  color: #079272;
  font-weight: 950;
  cursor: pointer;
  white-space: nowrap;
}

.recommendation-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.opportunity-card,
.agenda-section,
.news-section,
.empty-card {
  border: 1px solid #e8e4dc;
  background: white;
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 12px 42px rgba(0, 0, 0, .04);
}

.opportunity-card {
  cursor: pointer;
  transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
}

.opportunity-card:hover {
  transform: translateY(-2px);
  border-color: #cdebe2;
  box-shadow: 0 18px 50px rgba(7, 146, 114, .08);
}

.opportunity-card__cover {
  position: relative;
  height: 110px;
  background: #f0fdfa;
}

.opportunity-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 2rem;
  font-weight: 950;
  color: #079272;
  background:
    radial-gradient(circle at top right, rgba(7, 146, 114, .18), transparent 10rem),
    #ecfdf5;
}

.registration-chip {
  position: absolute;
  left: 10px;
  bottom: 10px;
  border-radius: 999px;
  padding: 5px 8px;
  font-size: .65rem;
  font-weight: 950;
  background: white;
  color: #57534e;
}

.registration-chip--open {
  background: #dcfce7;
  color: #166534;
}

.registration-chip--soon {
  background: #eff6ff;
  color: #1d4ed8;
}

.registration-chip--urgent {
  background: #fef2f2;
  color: #b91c1c;
}

.registration-chip--evergreen {
  background: #ecfdf5;
  color: #047857;
}

.registration-chip--watch {
  background: #fefce8;
  color: #854d0e;
}

.registration-chip--none {
  background: #f5f5f4;
  color: #78716c;
}

.opportunity-card__body {
  padding: 14px;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: #999;
  font-size: .68rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .05em;
  margin-bottom: 8px;
}

.opportunity-card h3,
.agenda-item h3,
.news-item h3 {
  margin: 0;
  color: #111;
  letter-spacing: -.025em;
}

.opportunity-card h3 {
  font-size: .94rem;
  line-height: 1.22;
}

.opportunity-card p,
.agenda-item p,
.news-item p {
  color: #777;
  line-height: 1.5;
}

.opportunity-card p {
  margin: 8px 0 12px;
  font-size: .78rem;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.home-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  align-items: start;
}

.agenda-section,
.news-section,
.empty-card {
  padding: 20px;
}

.agenda-list,
.news-list {
  display: grid;
  gap: 10px;
}

.agenda-item {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  gap: 12px;
  padding: 12px;
  border-radius: 17px;
  background: #fafaf9;
  border: 1px solid #f0ece8;
  cursor: pointer;
}

.agenda-date {
  border-radius: 15px;
  background: white;
  border: 1px solid #e8e4dc;
  display: grid;
  place-items: center;
  align-content: center;
  min-height: 58px;
}

.agenda-date strong {
  color: #111;
  font-size: 1.05rem;
}

.agenda-date span {
  color: #999;
  font-size: .68rem;
  font-weight: 900;
  text-transform: uppercase;
}

.agenda-kind {
  display: inline-flex;
  width: fit-content;
  border-radius: 999px;
  padding: 4px 7px;
  font-size: .64rem;
  font-weight: 950;
  margin-bottom: 6px;
}

.agenda-kind--urgent {
  background: #fef2f2;
  color: #b91c1c;
}

.agenda-kind--open {
  background: #ecfdf5;
  color: #047857;
}

.agenda-kind--blue {
  background: #eff6ff;
  color: #1d4ed8;
}

.agenda-kind--purple {
  background: #f5f3ff;
  color: #6d28d9;
}

.agenda-kind--neutral {
  background: #f5f5f4;
  color: #57534e;
}

.agenda-item h3 {
  font-size: .86rem;
}

.agenda-item p {
  margin: 4px 0 0;
  font-size: .76rem;
}

.news-item {
  padding: 14px;
  border: 1px solid #f0ece8;
  background: #fafaf9;
  border-radius: 17px;
  display: grid;
  gap: 10px;
  cursor: pointer;
}

.news-item span {
  color: #079272;
  font-size: .68rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .06em;
}

.news-item h3 {
  font-size: .9rem;
  margin-top: 5px;
}

.news-item p {
  margin: 6px 0 0;
  font-size: .78rem;
}

.news-item small {
  color: #999;
  font-weight: 850;
}

.empty-card {
  display: grid;
  gap: 4px;
  color: #777;
}

.empty-card strong {
  color: #111;
  font-size: .92rem;
}

.empty-card span {
  font-size: .82rem;
}

.empty-card--compact {
  box-shadow: none;
  background: #fafaf9;
}

.home-loading {
  display: grid;
  gap: 18px;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.loading-block {
  min-height: 220px;
  border-radius: 22px;
  background: linear-gradient(90deg, #f5f5f4, #ffffff, #f5f5f4);
  background-size: 240% 100%;
  animation: pulse 1.4s ease infinite;
  border: 1px solid #e8e4dc;
}

.loading-block--hero {
  min-height: 230px;
  border-radius: 28px;
}

.home-error {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #991b1b;
  border-radius: 22px;
  padding: 22px;
  display: grid;
  gap: 8px;
}

.home-error strong {
  color: #7f1d1d;
}

.home-error button {
  margin-top: 8px;
  width: fit-content;
  border: none;
  border-radius: 12px;
  background: #991b1b;
  color: white;
  padding: 10px 13px;
  font-weight: 850;
  cursor: pointer;
}

@keyframes pulse {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 1080px) {
  .home-main {
    padding: 24px 16px 70px;
  }

  .next-step-card {
    grid-template-columns: 1fr;
  }

  .recommendation-grid,
  .loading-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home-columns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .home-topbar {
    align-items: flex-start;
  }

  .profile-pill {
    display: none;
  }

  .recommendation-grid,
  .loading-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .next-step-card {
    padding: 20px;
    border-radius: 22px;
  }
}
</style>