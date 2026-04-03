<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Revisar Conteúdos — seConecta' })

const router = useRouter()
const { get } = useAxios()

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let t: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Posts pendentes
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

const popularTags = ['carreira', 'tecnologia', 'startup', 'design', 'produto', 'python', 'gestão']

// ─────────────────────────────────────────────────────────────────────────────
// Olimpíadas pendentes
// ─────────────────────────────────────────────────────────────────────────────

const olympiads = ref<any[]>([])
const olympiadsLoading = ref(true)
const olympiadsLoadingMore = ref(false)
const olympiadsError = ref<string | null>(null)
const olympiadsPage = ref(1)
const olympiadsTotalCount = ref(0)
const OLYMPIADS_LIMIT = 8

const hasMoreOlympiads = computed(() => olympiads.value.length < olympiadsTotalCount.value)
const selectedOlimpiad = ref<any | null>(null)

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI
// ─────────────────────────────────────────────────────────────────────────────

const todayLabel = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
})

const searchLoading = computed(
  () =>
    (postsLoading.value || postsLoadingMore.value || olympiadsLoading.value || olympiadsLoadingMore.value) &&
    !!postsSearchQuery.value.trim()
)

const hasAnyError = computed(() => postsError.value || olympiadsError.value)

const feedTitle = computed(() => {
  if (activeTag.value) return `#${activeTag.value}`
  return 'Fila de revisão'
})

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
      approved: false,
    }

    if (postsSearchQuery.value.trim()) params.search = postsSearchQuery.value.trim()

    const res = await get('/olympiads/', { params })
    const data = res.data?.data ?? []
    const count = res.data?.count ?? 0

    if (reset) {
      olympiads.value = data
      olympiadsTotalCount.value = count
    } else {
      olympiads.value.push(...data)
    }
  } catch {
    olympiadsError.value = 'Não foi possível carregar as olimpíadas pendentes.'
  } finally {
    olympiadsLoading.value = false
    olympiadsLoadingMore.value = false
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

function refreshAll() {
  fetchPosts(true)
  fetchOlympiads(true)
}

function setTag(tag: string) {
  activeTag.value = activeTag.value === tag ? '' : tag
  postsSearchQuery.value = ''
  refreshAll()
}

watch(
  postsSearchQuery,
  debounce(() => {
    activeTag.value = ''
    refreshAll()
  }, 400)
)

onMounted(() => {
  refreshAll()
})

function openArticle(post: any) {
  router.push(`/feed/${post.slug || post.id}`)
}

function clearFilters() {
  activeTag.value = ''
  postsSearchQuery.value = ''
  refreshAll()
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatOlympiadDate(value: any) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}
</script>

<template>
  <div class="min-h-screen">
    <!-- Hero -->
    <section class="relative overflow-hidden py-16 px-8 bg-none" aria-labelledby="hero-heading">
      <div class="absolute rounded-full blur-[60px] opacity-10 pointer-events-none w-[300px] h-[300px] top-[5%] right-[5%] bg-[#079272] max-sm:hidden" aria-hidden="true"></div>
      <div class="absolute rounded-full blur-[60px] opacity-10 pointer-events-none w-[200px] h-[200px] bottom-[10%] right-[25%] bg-[#2464E8] max-sm:hidden" aria-hidden="true"></div>

      <div class="relative z-10 max-w-[900px] mx-auto w-full">
        <div data-aos="fade-up" class="flex items-center gap-2 text-[0.7rem] font-medium tracking-[0.14em] uppercase mb-6">
          <span class="w-[6px] h-[6px] rounded-full bg-green-500 relative before:content-[''] before:absolute before:inset-0 before:rounded-full before:bg-green-500 before:animate-ping"></span>
          <span>Feed ao vivo · {{ todayLabel }}</span>
        </div>

        <h1
          id="hero-heading"
          class="font-extrabold text-black mb-4 leading-[1.1] tracking-[-0.03em] text-[clamp(2.5rem,7vw,5rem)]"
        >
          Avalie conteúdos pendentes
        </h1>

        <p data-aos="fade-up" class="font-medium text-[#079272] max-w-[520px] leading-relaxed mb-8 text-base">
          Obrigado por ajudar a moderar a comunidade. Aqui você revisa posts e olimpíadas que ainda não foram aprovados.
        </p>
      </div>
    </section>

    <div class="bg-white">
      <div class="max-w-[900px] mx-auto px-4 md:px-8 pt-10 pb-4">
        <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 class="text-2xl font-bold text-[#111] tracking-[-0.02em]">{{ feedTitle }}</h2>

          <button
            v-if="activeTag || postsSearchQuery"
            class="text-[0.72rem] font-semibold px-3 py-1.5 rounded-lg border border-[#e8e4dc] bg-white text-[#666] hover:border-[#079272] hover:text-[#079272] transition-all"
            @click="clearFilters"
          >
            Limpar filtros
          </button>
        </div>

        <div class="relative mb-4">
          <svg
            class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            v-model="postsSearchQuery"
            type="text"
            placeholder="Buscar posts e olimpíadas pendentes..."
            class="w-full h-11 pl-11 pr-5 bg-white border border-[#e8e4dc] rounded-xl text-sm text-[#111] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all"
          />

          <svg
            v-if="searchLoading"
            class="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#079272]"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>

        <div class="flex items-center gap-2 flex-wrap mb-2">
          <button
            v-for="tag in popularTags"
            :key="tag"
            class="text-[0.72rem] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer"
            :class="activeTag === tag ? 'bg-[#0d0d0d] text-white border-[#0d0d0d]' : 'bg-white text-[#666] border-[#e8e4dc] hover:border-[#079272] hover:text-[#079272]'"
            @click="setTag(tag)"
          >
            #{{ tag }}
          </button>

          <button
            v-if="activeTag"
            class="text-[0.72rem] text-[#aaa] hover:text-red-500 transition-colors cursor-pointer border-none bg-transparent"
            @click="setTag('')"
          >
            ✕ limpar tag
          </button>
        </div>
      </div>

      <main class="max-w-[900px] mx-auto px-4 md:px-8 pb-24 pt-2 flex flex-col gap-10">
        <!-- Global error notice -->
        <div v-if="hasAnyError" class="grid gap-3">
          <div v-if="postsError" class="flex items-center justify-between gap-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[0.83rem]">
            <div class="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {{ postsError }}
            </div>
            <button class="font-semibold underline" @click="fetchPosts(true)">Tentar novamente</button>
          </div>

          <div v-if="olympiadsError" class="flex items-center justify-between gap-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[0.83rem]">
            <div class="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {{ olympiadsError }}
            </div>
            <button class="font-semibold underline" @click="fetchOlympiads(true)">Tentar novamente</button>
          </div>
        </div>

        <!-- POSTS SECTION -->
        <section>
          <div class="flex items-center justify-between gap-3 mb-4">
            <h3 class="text-lg font-bold text-[#111] tracking-[-0.02em]">Posts pendentes</h3>
            <span class="text-[0.75rem] text-[#888]">{{ postsTotalCount }} total</span>
          </div>

          <template v-if="postsLoading && posts.length === 0">
            <div v-for="i in 4" :key="i" class="bg-white rounded-2xl border border-[#e8e4dc] p-8 animate-pulse flex flex-col gap-3">
              <div class="flex gap-3">
                <div class="h-3 w-20 bg-[#f0ece5] rounded-full"></div>
                <div class="h-3 w-16 bg-[#f0ece5] rounded-full"></div>
              </div>
              <div class="h-5 w-3/4 bg-[#f0ece5] rounded-lg"></div>
              <div class="h-3.5 w-full bg-[#f0ece5] rounded"></div>
              <div class="h-3.5 w-4/5 bg-[#f0ece5] rounded"></div>
              <div class="flex justify-between mt-1">
                <div class="flex gap-2">
                  <div class="h-8 w-16 bg-[#f0ece5] rounded-lg"></div>
                  <div class="h-8 w-8 bg-[#f0ece5] rounded-lg"></div>
                </div>
                <div class="h-8 w-20 bg-[#f0ece5] rounded-lg"></div>
              </div>
            </div>
          </template>

          <div v-else-if="posts.length === 0" class="flex flex-col items-center py-20 gap-3 text-center">
            <div class="w-14 h-14 rounded-2xl bg-[#f7f5f0] flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <p class="text-sm font-light text-[#666]">
              <span v-if="activeTag">Nenhum post com a tag <strong>#{{ activeTag }}</strong>.</span>
              <span v-else-if="postsSearchQuery">Nenhum resultado para "<strong>{{ postsSearchQuery }}</strong>".</span>
              <span v-else>Nenhum post pendente. Tudo em dia!</span>
            </p>
          </div>

          <template v-else>
            <FeedPostCard
              v-for="(post, index) in posts"
              :key="post.id"
              :post="post"
              :index="index"
              @read="openArticle"
            />

            <div v-if="hasMorePosts" class="flex justify-center pt-2">
              <button
                class="flex items-center gap-2 text-sm font-semibold px-8 py-3 border border-[#e8e4dc] text-[#666] rounded-xl hover:border-[#0d0d0d] hover:text-[#111] transition-all disabled:opacity-40 cursor-pointer bg-transparent"
                :disabled="postsLoadingMore"
                @click="loadMorePosts"
              >
                <svg v-if="postsLoadingMore" class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                {{ postsLoadingMore ? 'Carregando...' : `Carregar mais (${postsTotalCount - posts.length} restantes)` }}
              </button>
            </div>
          </template>
        </section>

        <!-- OLYMPIADS SECTION -->
        <section>
          <div class="flex items-center justify-between gap-3 mb-4">
            <h3 class="text-lg font-bold text-[#111] tracking-[-0.02em]">Olimpíadas pendentes</h3>
            <span class="text-[0.75rem] text-[#888]">{{ olympiadsTotalCount }} total</span>
          </div>

          <template v-if="olympiadsLoading && olympiads.length === 0">
            <div v-for="i in 4" :key="i" class="bg-white rounded-2xl border border-[#e8e4dc] p-8 animate-pulse flex flex-col gap-3">
              <div class="flex gap-3">
                <div class="h-3 w-24 bg-[#f0ece5] rounded-full"></div>
                <div class="h-3 w-16 bg-[#f0ece5] rounded-full"></div>
              </div>
              <div class="h-5 w-3/4 bg-[#f0ece5] rounded-lg"></div>
              <div class="h-3.5 w-full bg-[#f0ece5] rounded"></div>
              <div class="h-3.5 w-4/5 bg-[#f0ece5] rounded"></div>
              <div class="flex justify-between mt-1">
                <div class="flex gap-2">
                  <div class="h-8 w-20 bg-[#f0ece5] rounded-lg"></div>
                  <div class="h-8 w-8 bg-[#f0ece5] rounded-lg"></div>
                </div>
                <div class="h-8 w-20 bg-[#f0ece5] rounded-lg"></div>
              </div>
            </div>
          </template>

          <div v-else-if="olympiads.length === 0" class="flex flex-col items-center py-20 gap-3 text-center">
            <div class="w-14 h-14 rounded-2xl bg-[#f7f5f0] flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <p class="text-sm font-light text-[#666]">
              <span v-if="postsSearchQuery">Nenhuma olimpíada para "<strong>{{ postsSearchQuery }}</strong>".</span>
              <span v-else>Nenhuma olimpíada pendente.</span>
            </p>
          </div>

          <template v-else>
            <div class="flex flex-col gap-4">
              <OlimpiadasOlimpiadCard
                v-for="o in olympiads"
                :key="o.id"
                :olimpiad="o"
                @open="selectedOlimpiad = $event"
              />
            </div>

            <div v-if="hasMoreOlympiads" class="flex justify-center pt-2">
              <button
                class="flex items-center gap-2 text-sm font-semibold px-8 py-3 border border-[#e8e4dc] text-[#666] rounded-xl hover:border-[#0d0d0d] hover:text-[#111] transition-all disabled:opacity-40 cursor-pointer bg-transparent"
                :disabled="olympiadsLoadingMore"
                @click="loadMoreOlympiads"
              >
                <svg v-if="olympiadsLoadingMore" class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                {{ olympiadsLoadingMore ? 'Carregando...' : `Carregar mais (${olympiadsTotalCount - olympiads.length} restantes)` }}
              </button>
            </div>
          </template>
        </section>
      </main>
    </div>

    <OlimpiadasOlimpiadModal
      :olimpiad="selectedOlimpiad"
      @close="selectedOlimpiad = null"
    />
  </div>
</template>