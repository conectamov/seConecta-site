<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Revisar Conteúdos — seConecta' })

const router = useRouter()
const { get, patch } = useAxios()

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let t: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }
}

function safeDateString(value: any) {
  if (!value || typeof value !== 'string') return null
  return value.split('T')[0]
}

function formatDate(value: any) {
  const str = safeDateString(value)
  if (!str) return '—'
  const d = new Date(str)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR')
}

function slugOrId(item: any) {
  return item?.slug || item?.id
}

// ─────────────────────────────────────────────────────────────────────────────
// POSTS
// ─────────────────────────────────────────────────────────────────────────────
const posts = ref<any[]>([])
const postsLoading = ref(true)
const postsLoadingMore = ref(false)
const postsError = ref<string | null>(null)
const postsSearchQuery = ref('')
const activeTag = ref('')
const postsPage = ref(1)
const postsTotalCount = ref(0)
const POSTS_LIMIT = 8

const hasMorePosts = computed(() => posts.value.length < postsTotalCount.value)

// ─────────────────────────────────────────────────────────────────────────────
// OLIMPÍADAS
// ─────────────────────────────────────────────────────────────────────────────
const olympiads = ref<any[]>([])
const olympiadsLoading = ref(true)
const olympiadsLoadingMore = ref(false)
const olympiadsError = ref<string | null>(null)
const olympiadsSearchQuery = ref('')
const olympiadsPage = ref(1)
const olympiadsTotalCount = ref(0)
const OLYMPIADS_LIMIT = 8

const hasMoreOlympiads = computed(() => olympiads.value.length < olympiadsTotalCount.value)
const selectedOlimpiad = ref<any | null>(null)

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Inscrições abertas',
  SOON: 'Em breve',
  ONGOING: 'Em andamento',
  CLOSED: 'Encerrada',
}

function normalizeResource(r: any) {
  if (!r || typeof r !== 'object') return null

  const name = r.name ?? r.title ?? r.label ?? r.text ?? r.description ?? 'Recurso'
  const url = r.url ?? r.href ?? r.link ?? r.website ?? r.official_site_url ?? r.external_url ?? null

  return {
    ...r,
    name,
    title: name,
    label: name,
    url,
    href: url,
    link: url,
  }
}

function normalizeOlympiad(o: any) {
  const resources = Array.isArray(o.resources)
    ? o.resources.map(normalizeResource).filter(Boolean)
    : []

  const startDate = safeDateString(o.start_date)
  const endDate = safeDateString(o.end_date)
  const nextEditionDate = safeDateString(o.next_edition_date)
  const statusLabel = STATUS_LABEL[o.status] ?? o.status ?? ''

  return {
    id: o.id,
    name: o.title,
    title: o.title,
    slug: o.slug ?? null,
    description: o.description ?? '',
    organizer: o.organizer ?? '',

    banner_url: o.cover_url,
    cover_url: o.cover_url,
    coverUrl: o.cover_url,
    bannerUrl: o.cover_url,

    status: statusLabel,
    statusEnum: o.status,
    status_label: statusLabel,

    area: o.categories?.[0] ?? '',
    tags: o.categories ?? [],
    categories: o.levels ?? [],
    levels: o.levels ?? [],
    languages: o.languages ?? [],
    modalities: o.modalities ?? [],

    rating: o.rating ?? null,
    participants_count: o.participants_count ?? null,
    difficulty_level: o.difficulty ?? null,
    estimated_duration: o.duration ?? null,

    location: o.location ?? '',
    target_audience: o.target_audience ?? '',
    taxes: o.is_free ? 'Gratuito' : 'Pago',
    is_free: !!o.is_free,
    certificate: !!o.has_certificate,
    has_certificate: !!o.has_certificate,
    mentorship_available: !!o.has_mentorship,
    has_mentorship: !!o.has_mentorship,
    international: (o.location ?? '').toLowerCase().includes('internacional'),
    team_allowed: false,

    start_date: startDate,
    end_date: endDate,
    next_edition_date: nextEditionDate,

    startDate,
    endDate,
    nextEditionDate,
    starts_at: startDate,
    ends_at: endDate,
    startsAt: startDate,
    endsAt: endDate,
    inicio: startDate,
    termino: endDate,
    start: startDate,
    end: endDate,

    start_date_raw: o.start_date ?? null,
    end_date_raw: o.end_date ?? null,
    next_edition_date_raw: o.next_edition_date ?? null,

    application_process: o.how_to_register ?? '',
    how_to_register: o.how_to_register ?? '',
    prizes: o.prizes ?? '',
    requirements: o.requirements ?? '',

    website: o.official_site_url ?? '',
    official_site_url: o.official_site_url ?? '',
    officialSiteUrl: o.official_site_url ?? '',
    past_exams_url: null,
    resources,

    highlighted: !!o.is_featured,
    is_featured: !!o.is_featured,
    approved: !!o.approved,

    author_id: o.author_id ?? null,
    author_name: o.author_name ?? '',
    author_profile_url: o.author_profile_url ?? '',

    popularity_score: o.rating ? Math.round(o.rating * 20) : 0,
    deadline_countdown: null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GUIDES
// ─────────────────────────────────────────────────────────────────────────────
const guides = ref<any[]>([])
const guidesLoading = ref(true)
const guidesLoadingMore = ref(false)
const guidesError = ref<string | null>(null)
const guidesSearchQuery = ref('')
const guidesPage = ref(1)
const guidesTotalCount = ref(0)
const GUIDES_LIMIT = 8

const hasMoreGuides = computed(() => guides.value.length < guidesTotalCount.value)

function normalizeGuide(g: any) {
  const tags = Array.isArray(g.tags) ? g.tags : []
  const createdAt = safeDateString(g.created_at)
  const updatedAt = safeDateString(g.updated_at)

  return {
    id: g.id,
    title: g.title ?? '',
    name: g.title ?? '',
    slug: g.slug ?? null,
    description_md: g.description_md ?? '',
    excerpt: g.excerpt ?? '',
    cover_url: g.cover_url ?? '',
    coverUrl: g.cover_url ?? '',
    approved: !!g.approved,
    parent_guide_id: g.parent_guide_id ?? null,
    tags,
    author_id: g.author_id ?? null,
    created_at: createdAt,
    updated_at: updatedAt,
    createdAt,
    updatedAt,
    preview: (g.excerpt ?? g.description_md ?? '').slice(0, 180),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Requests
// ─────────────────────────────────────────────────────────────────────────────
async function fetchPosts(reset = true) {
  if (reset) {
    postsPage.value = 1
    postsLoading.value = true
  } else {
    postsLoadingMore.value = true
  }
  postsError.value = null

  try {
    const params: Record<string, any> = {
      page: postsPage.value,
      limit: POSTS_LIMIT,
    }
    if (postsSearchQuery.value.trim()) params.search = postsSearchQuery.value.trim()
    if (activeTag.value) params.tag = activeTag.value

    const res = await get('/posts/pending', { params })
    const data = res.data?.data ?? []
    const count = res.data?.count ?? 0

    if (reset) {
      posts.value = data
      postsTotalCount.value = count
    } else {
      posts.value.push(...data)
    }
  } catch {
    postsError.value = 'Não foi possível carregar os posts pendentes.'
  } finally {
    postsLoading.value = false
    postsLoadingMore.value = false
  }
}

async function fetchOlympiads(reset = true) {
  if (reset) {
    olympiadsPage.value = 1
    olympiadsLoading.value = true
  } else {
    olympiadsLoadingMore.value = true
  }
  olympiadsError.value = null

  try {
    const params: Record<string, any> = {
      page: olympiadsPage.value,
      limit: OLYMPIADS_LIMIT,
    }

    if (olympiadsSearchQuery.value.trim()) params.search = olympiadsSearchQuery.value.trim()

    const res = await get('/olympiads/pending', { params })
    const data = res.data?.data ?? []
    const count = res.data?.count ?? 0
    const normalized = data.map(normalizeOlympiad)

    if (reset) {
      olympiads.value = normalized
      olympiadsTotalCount.value = count
    } else {
      olympiads.value.push(...normalized)
    }
  } catch {
    olympiadsError.value = 'Não foi possível carregar as olimpíadas pendentes.'
  } finally {
    olympiadsLoading.value = false
    olympiadsLoadingMore.value = false
  }
}

async function fetchGuides(reset = true) {
  if (reset) {
    guidesPage.value = 1
    guidesLoading.value = true
  } else {
    guidesLoadingMore.value = true
  }
  guidesError.value = null

  try {
    const params: Record<string, any> = {
      page: guidesPage.value,
      limit: GUIDES_LIMIT,
    }

    if (guidesSearchQuery.value.trim()) params.search = guidesSearchQuery.value.trim()

    const res = await get('/guides/pending', { params })
    const data = res.data?.data ?? []
    const count = res.data?.count ?? 0
    const normalized = data.map(normalizeGuide)

    if (reset) {
      guides.value = normalized
      guidesTotalCount.value = count
    } else {
      guides.value.push(...normalized)
    }
  } catch {
    guidesError.value = 'Não foi possível carregar os guias pendentes.'
  } finally {
    guidesLoading.value = false
    guidesLoadingMore.value = false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────────
async function handleApproveOlympiad(id: number) {
  try {
    await patch(`/olympiads/${id}`, { approved: true })
    olympiads.value = olympiads.value.filter(o => o.id !== id)
    olympiadsTotalCount.value = Math.max(0, olympiadsTotalCount.value - 1)
    if (selectedOlimpiad.value?.id === id) selectedOlimpiad.value = null
  } catch {
    alert('Erro ao aprovar olimpíada. Verifique suas permissões.')
  }
}

async function handleApprovePost(id: number) {
  try {
    await patch(`/posts/${id}`, { approved: true })
    posts.value = posts.value.filter(p => p.id !== id)
    postsTotalCount.value = Math.max(0, postsTotalCount.value - 1)
  } catch {
    alert('Erro ao aprovar post.')
  }
}

async function handleApproveGuide(id: number) {
  try {
    await patch(`/guides/${id}`, { approved: true })
    guides.value = guides.value.filter(g => g.id !== id)
    guidesTotalCount.value = Math.max(0, guidesTotalCount.value - 1)
  } catch {
    alert('Erro ao aprovar guia. Verifique suas permissões.')
  }
}

async function loadMorePosts() {
  if (!hasMorePosts.value || postsLoadingMore.value) return
  postsPage.value++
  await fetchPosts(false)
}

async function loadMoreOlympiads() {
  if (!hasMoreOlympiads.value || olympiadsLoadingMore.value) return
  olympiadsPage.value++
  await fetchOlympiads(false)
}

async function loadMoreGuides() {
  if (!hasMoreGuides.value || guidesLoadingMore.value) return
  guidesPage.value++
  await fetchGuides(false)
}

function refreshAll() {
  fetchPosts(true)
  fetchOlympiads(true)
  fetchGuides(true)
}

function clearFilters() {
  activeTag.value = ''
  postsSearchQuery.value = ''
  olympiadsSearchQuery.value = ''
  guidesSearchQuery.value = ''
  refreshAll()
}

function openArticle(post: any) {
  router.push(`/feed/${post.slug || post.id}`)
}

onMounted(() => {
  refreshAll()
})

watch(
  postsSearchQuery,
  debounce(() => {
    activeTag.value = ''
    refreshAll()
  }, 400)
)

watch(
  olympiadsSearchQuery,
  debounce(() => {
    refreshAll()
  }, 400)
)

watch(
  guidesSearchQuery,
  debounce(() => {
    refreshAll()
  }, 400)
)

const todayLabel = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
})

const feedTitle = computed(() => activeTag.value ? `#${activeTag.value}` : 'Fila de revisão')
const searchLoading = computed(() => (postsLoading.value || olympiadsLoading.value || guidesLoading.value) && !!(postsSearchQuery.value.trim() || olympiadsSearchQuery.value.trim() || guidesSearchQuery.value.trim()))
</script>

<template>
  <div class="min-h-screen">
    <section class="relative overflow-hidden py-16 px-8 bg-none">
      <div class="relative z-10 max-w-[900px] mx-auto w-full">
        <div class="flex items-center gap-2 text-[0.7rem] font-medium tracking-[0.14em] uppercase mb-6">
          <span class="w-[6px] h-[6px] rounded-full bg-green-500 relative before:content-[''] before:absolute before:inset-0 before:rounded-full before:bg-green-500 before:animate-ping"></span>
          <span>Moderação Ativa · {{ todayLabel }}</span>
        </div>

        <h1 class="font-extrabold text-black mb-4 leading-[1.1] tracking-[-0.03em] text-[clamp(2.5rem,7vw,5rem)]">
          Avalie conteúdos pendentes
        </h1>
        <p class="font-medium text-[#079272] max-w-[520px] leading-relaxed mb-8 text-base">
          Obrigado por ajudar a moderar a comunidade. Aqui você revisa posts, olimpíadas e guias que ainda não foram aprovados.
        </p>
      </div>
    </section>

    <div class="bg-white">
      <div class="max-w-[900px] mx-auto px-4 md:px-8 pt-10 pb-4">
        <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 class="text-2xl font-bold text-[#111] tracking-[-0.02em]">{{ feedTitle }}</h2>
          <button v-if="activeTag || postsSearchQuery || olympiadsSearchQuery || guidesSearchQuery" class="text-[0.72rem] font-semibold px-3 py-1.5 rounded-lg border border-[#e8e4dc] bg-white text-[#666] hover:border-[#079272]" @click="clearFilters">
            Limpar filtros
          </button>
        </div>

        <div class="grid gap-3 md:grid-cols-3 mb-8">
          <div class="relative">
            <input v-model="postsSearchQuery" type="text" placeholder="Buscar posts..." class="w-full h-11 pl-11 pr-5 bg-white border border-[#e8e4dc] rounded-xl text-sm focus:ring-2 focus:ring-[#079272] outline-none transition-all" />
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </div>

          <div class="relative">
            <input v-model="olympiadsSearchQuery" type="text" placeholder="Buscar olimpíadas..." class="w-full h-11 pl-11 pr-5 bg-white border border-[#e8e4dc] rounded-xl text-sm focus:ring-2 focus:ring-[#079272] outline-none transition-all" />
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </div>

          <div class="relative">
            <input v-model="guidesSearchQuery" type="text" placeholder="Buscar guias..." class="w-full h-11 pl-11 pr-5 bg-white border border-[#e8e4dc] rounded-xl text-sm focus:ring-2 focus:ring-[#079272] outline-none transition-all" />
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </div>
        </div>
      </div>

      <main class="max-w-[900px] mx-auto px-4 md:px-8 pb-24 pt-2 flex flex-col gap-10">
        <section>
          <div class="flex items-center justify-between gap-3 mb-4">
            <h3 class="text-lg font-bold text-[#111]">Posts para Revisão</h3>
            <span class="text-[0.75rem] text-[#888]">{{ postsTotalCount }} pendentes</span>
          </div>

          <div v-if="postsError" class="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{{ postsError }}</div>
          <div v-if="posts.length === 0 && !postsLoading" class="py-10 text-center text-sm text-gray-500">Nenhum post aguardando revisão.</div>

          <div v-for="(post, index) in posts" :key="post.id" class="relative group">
            <FeedPostCard :post="post" :index="index" @read="openArticle" />
            <button class="absolute top-4 right-4 z-10 bg-[#079272] text-white text-[0.7rem] font-bold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" @click.stop="handleApprovePost(post.id)">APROVAR POST</button>
          </div>

          <button v-if="hasMorePosts" class="w-full mt-4 py-3 text-sm font-semibold border border-[#e8e4dc] rounded-xl hover:bg-gray-50" @click="loadMorePosts">
            {{ postsLoadingMore ? 'Carregando...' : 'Carregar mais posts' }}
          </button>
        </section>

        <section>
          <div class="flex items-center justify-between gap-3 mb-4">
            <h3 class="text-lg font-bold text-[#111]">Olimpíadas para Revisão</h3>
            <span class="text-[0.75rem] text-[#888]">{{ olympiadsTotalCount }} pendentes</span>
          </div>

          <div v-if="olympiadsError" class="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{{ olympiadsError }}</div>
          <div v-if="olympiads.length === 0 && !olympiadsLoading" class="py-10 text-center text-sm text-gray-500">Nenhuma olimpíada aguardando revisão.</div>

          <div class="flex flex-col gap-4">
            <div v-for="o in olympiads" :key="o.id" class="relative group">
              <OlimpiadasOlimpiadCard :olimpiad="o" @open="selectedOlimpiad = o" />
              <button class="absolute top-1/2 -translate-y-1/2 right-6 z-10 bg-[#079272] text-white text-[0.7rem] font-bold px-4 py-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-xl" @click.stop="handleApproveOlympiad(o.id)">APROVAR AGORA</button>
            </div>
          </div>

          <button v-if="hasMoreOlympiads" class="w-full mt-6 py-3 text-sm font-semibold border border-[#e8e4dc] rounded-xl hover:bg-gray-50" @click="loadMoreOlympiads">
            {{ olympiadsLoadingMore ? 'Carregando...' : 'Carregar mais olimpíadas' }}
          </button>
        </section>

        <section>
          <div class="flex items-center justify-between gap-3 mb-4">
            <h3 class="text-lg font-bold text-[#111]">Guias para Revisão</h3>
            <span class="text-[0.75rem] text-[#888]">{{ guidesTotalCount }} pendentes</span>
          </div>

          <div v-if="guidesError" class="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{{ guidesError }}</div>
          <div v-if="guides.length === 0 && !guidesLoading" class="py-10 text-center text-sm text-gray-500">Nenhum guia aguardando revisão.</div>

          <div class="grid gap-4">
            <article v-for="guide in guides" :key="guide.id" class="relative overflow-hidden rounded-2xl border border-[#e8e4dc] bg-white shadow-sm group">
              <div class="grid md:grid-cols-[220px_1fr]">
                <div class="min-h-[180px] bg-gradient-to-br from-[#0f172a] to-[#334155] relative overflow-hidden">
                  <img
                    v-if="guide.coverUrl || guide.cover_url"
                    :src="guide.coverUrl || guide.cover_url"
                    :alt="guide.title"
                    class="absolute inset-0 w-full h-full object-cover"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent"></div>
                  <div class="absolute left-4 top-4 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/90 text-[11px] font-semibold text-[#111] backdrop-blur-sm">
                    <span class="w-2 h-2 rounded-full" :class="guide.approved ? 'bg-emerald-500' : 'bg-amber-500'"></span>
                    <span>{{ guide.approved ? 'Aprovado' : 'Pendente' }}</span>
                  </div>
                  <div class="absolute left-4 bottom-4 right-4 text-white">
                    <p class="text-[11px] uppercase tracking-[0.12em] text-white/70 font-semibold">Guia</p>
                    <h4 class="text-[1.05rem] font-extrabold leading-tight mt-1 line-clamp-3">{{ guide.title }}</h4>
                  </div>
                </div>

                <div class="p-5 md:p-6 flex flex-col gap-4">
                  <div class="flex items-center justify-between gap-3 flex-wrap">
                    <div class="text-[11px] text-[#888]">
                      Criado em <span class="font-semibold text-[#555]">{{ formatDate(guide.created_at) }}</span>
                      <span v-if="guide.updated_at"> · Atualizado em <span class="font-semibold text-[#555]">{{ formatDate(guide.updated_at) }}</span></span>
                    </div>
                    <div v-if="guide.parent_guide_id" class="text-[11px] px-2.5 py-1 rounded-full bg-[#f8fafc] border border-[#e8e4dc] text-[#666]">
                      Guia pai: #{{ guide.parent_guide_id }}
                    </div>
                  </div>

                  <p class="text-sm text-[#555] leading-relaxed line-clamp-3">
                    {{ guide.excerpt || guide.preview || 'Sem resumo disponível.' }}
                  </p>

                  <div v-if="guide.tags?.length" class="flex flex-wrap gap-2">
                    <span
                      v-for="tag in guide.tags.slice(0, 8)"
                      :key="tag"
                      class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#079272]/10 text-[#079272]"
                    >
                      #{{ tag }}
                    </span>
                  </div>

                  <div class="flex items-center justify-between gap-3 mt-auto pt-2 flex-wrap">
                    <div class="text-[11px] text-[#aaa]">
                      slug: <span class="font-mono text-[#777]">{{ guide.slug || '—' }}</span>
                    </div>

                    <div class="flex items-center gap-2">
                      <button
                        class="px-3 py-2 rounded-xl border border-[#e8e4dc] text-[0.75rem] font-semibold text-[#666] hover:bg-[#f8fafc]"
                        @click="selectedOlimpiad = null"
                      >
                        Ver mais tarde
                      </button>
                      <button
                        class="px-4 py-2 rounded-xl bg-[#079272] text-white text-[0.75rem] font-bold hover:bg-[#067d62] transition-colors"
                        @click="handleApproveGuide(guide.id)"
                      >
                        APROVAR GUIA
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <button v-if="hasMoreGuides" class="w-full mt-6 py-3 text-sm font-semibold border border-[#e8e4dc] rounded-xl hover:bg-gray-50" @click="loadMoreGuides">
            {{ guidesLoadingMore ? 'Carregando...' : 'Carregar mais guias' }}
          </button>
        </section>
      </main>
    </div>

    <OlimpiadasOlimpiadModal
      :olimpiad="selectedOlimpiad"
      @close="selectedOlimpiad = null"
    >
      <template #footer v-if="selectedOlimpiad">
        <div class="flex justify-end p-4 border-t bg-gray-50 rounded-b-2xl">
          <button
            class="bg-[#079272] text-white font-bold px-6 py-2 rounded-xl hover:bg-[#067d62] transition-colors"
            @click="handleApproveOlympiad(selectedOlimpiad.id)"
          >
            Aprovar Conteúdo
          </button>
        </div>
      </template>
    </OlimpiadasOlimpiadModal>
  </div>
</template>
