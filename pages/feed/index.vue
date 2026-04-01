<script setup lang="ts">
useSeoMeta({ title: 'Feed — seConecta' })

const router = useRouter()
const { get, post: apiPost } = useAxios()
const { currentUser, isAuthenticated } = useAuth()

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let t: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }
}

const posts = ref<any[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const activeTag = ref('')
const page = ref(1)
const totalCount = ref(0)
const LIMIT = 8

type FeedMode = 'general' | 'personalized'
const feedMode = ref<FeedMode>('general')

const recommendedPosts = ref<any[]>([])
const recommendedLoading = ref(false)
const recommendedError = ref<string | null>(null)
const recommendedCarouselRef = ref<HTMLElement | null>(null)
const recommendedCanScrollLeft = ref(false)
const recommendedCanScrollRight = ref(false)

const hasMore = computed(() => posts.value.length < totalCount.value)
const hasInterests = computed(() => (currentUser.value?.interests?.length ?? 0) > 0)

const popularTags = ['carreira', 'tecnologia', 'startup', 'design', 'produto', 'python', 'gestão']
const todayLabel = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
})

const feedTitle = computed(() => {
  if (feedMode.value === 'personalized') return 'Para você'
  if (activeTag.value) return `#${activeTag.value}`
  return 'Explorar'
})

const recommendedDisplayPosts = computed(() => Array.isArray(recommendedPosts.value) ? recommendedPosts.value : [])

function normalizeArrayResponse(res: any) {
  return res?.data?.data ?? res?.data ?? []
}

function normalizeCountResponse(res: any, fallback = 0) {
  return typeof res?.data?.count === 'number' ? res.data.count : fallback
}

async function fetchPosts(reset = true) {
  if (reset) {
    page.value = 1
    loading.value = true
    posts.value = []
  } else {
    loadingMore.value = true
  }

  error.value = null

  try {
    let res: any

    if (feedMode.value === 'personalized' && isAuthenticated.value && hasInterests.value) {
      res = await get('/posts/feed', { params: { page: page.value, limit: LIMIT } })
    } else {
      const params: Record<string, any> = { page: page.value, limit: LIMIT }

      if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
      if (activeTag.value) params.tag = activeTag.value

      res = await get('/posts/', { params })
    }

    const data = normalizeArrayResponse(res)
    const count = normalizeCountResponse(res, data.length)

    if (reset) {
      posts.value = data
      totalCount.value = count
    } else {
      posts.value.push(...data)
      totalCount.value = Math.max(totalCount.value, count)
    }
  } catch (e) {
    console.error('Erro ao carregar posts:', e)
    error.value = 'Não foi possível carregar os posts.'
    if (reset) {
      posts.value = []
      totalCount.value = 0
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function fetchRecommended() {
  if (!isAuthenticated.value || !hasInterests.value) {
    recommendedPosts.value = []
    recommendedError.value = null
    recommendedLoading.value = false
    updateRecommendedCarouselState()
    return
  }

  recommendedLoading.value = true
  recommendedError.value = null

  try {
    let data: any[] = []

    try {
      const res = await apiPost('/posts/get-feed-posts', {})
      data = normalizeArrayResponse(res)
    } catch (err: any) {
      if (err?.response?.status === 405) {
        const res = await get('/posts/get-feed-posts')
        data = normalizeArrayResponse(res)
      } else {
        throw err
      }
    }

    recommendedPosts.value = Array.isArray(data) ? data : []
    await nextTick()
    updateRecommendedCarouselState()
  } catch (err) {
    console.error('Erro ao carregar recomendações:', err)
    recommendedPosts.value = []
    recommendedError.value = 'Não foi possível carregar recomendações.'
  } finally {
    recommendedLoading.value = false
  }
}

function updateRecommendedCarouselState() {
  const el = recommendedCarouselRef.value
  if (!el) {
    recommendedCanScrollLeft.value = false
    recommendedCanScrollRight.value = false
    return
  }

  const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth)
  recommendedCanScrollLeft.value = el.scrollLeft > 4
  recommendedCanScrollRight.value = el.scrollLeft < maxScrollLeft - 4
}

function scrollRecommendedCarousel(direction: number) {
  const el = recommendedCarouselRef.value
  if (!el) return

  const amount = Math.max(220, Math.min(340, Math.round(el.clientWidth * 0.8)))
  el.scrollBy({ left: direction * amount, behavior: 'smooth' })
}

function setTag(tag: string) {
  activeTag.value = activeTag.value === tag ? '' : tag
  feedMode.value = 'general'
  searchQuery.value = ''
  fetchPosts(true)
}

function setFeedMode(mode: FeedMode) {
  feedMode.value = mode
  activeTag.value = ''
  searchQuery.value = ''
  fetchPosts(true)
}

watch(
  searchQuery,
  debounce(() => {
    if (feedMode.value === 'personalized') feedMode.value = 'general'
    activeTag.value = ''
    fetchPosts(true)
  }, 400)
)

watch([isAuthenticated, hasInterests], async () => {
  if (isAuthenticated.value && hasInterests.value && !searchQuery.value && !activeTag.value) {
    feedMode.value = 'personalized'
  }
  await fetchRecommended()
}, { immediate: true })

onMounted(async () => {
  if (isAuthenticated.value && hasInterests.value && !searchQuery.value && !activeTag.value) {
    feedMode.value = 'personalized'
  }

  await fetchPosts(true)
  await nextTick()
  updateRecommendedCarouselState()
  window.addEventListener('resize', updateRecommendedCarouselState)
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('resize', updateRecommendedCarouselState)
  }
})

function openArticle(post: any) {
  router.push(`/feed/${post.slug || post.id}`)
}
</script>

<template>
  <div class="min-h-screen bg-[#f7f5f0]">
    <!-- heroFeed -->
    <section class="relative overflow-hidden py-16 px-8 bg-none" aria-labelledby="hero-heading">
      <div class="absolute rounded-full blur-[60px] opacity-10 pointer-events-none w-[300px] h-[300px] top-[5%] right-[5%] bg-[#079272] max-sm:hidden" aria-hidden="true"></div>
      <div class="absolute rounded-full blur-[60px] opacity-10 pointer-events-none w-[200px] h-[200px] bottom-[10%] right-[25%] bg-[#2464E8] max-sm:hidden" aria-hidden="true"></div>

      <div class="relative z-10 max-w-[900px] mx-auto w-full">
        <div data-aos="fade-up" class="flex items-center gap-2 text-[0.7rem] font-medium tracking-[0.14em] uppercase mb-6">
          <span class="w-[6px] h-[6px] rounded-full bg-green-500 relative before:content-[''] before:absolute before:inset-0 before:rounded-full before:bg-green-500 before:animate-ping"></span>
          <span>Feed ao vivo · {{ todayLabel }}</span>
        </div>

        <h1 id="hero-heading" class="font-extrabold text-black mb-4 leading-[1.1] tracking-[-0.03em] text-[clamp(2.5rem,7vw,4rem)]">
          <span data-aos="fade-up" data-aos-delay="50" class="block">Fique por dentro</span>
          <span data-aos="fade-up" data-aos-delay="150" class="block text-black">das últimas</span>
          <span data-aos="fade-up" data-aos-delay="250" class="block">
            <em class="not-italic bg-gradient-to-r from-[#079272] to-[#2464E8] bg-clip-text text-transparent">novidades!</em>
          </span>
        </h1>

        <p data-aos="fade-up" data-aos-delay="350" class="font-medium text-[#079272] max-w-[440px] leading-relaxed mb-8 text-base">
          Acompanhe oportunidades, eventos e histórias inspiradoras do mundo dos estudos no nosso feed personalizado!
        </p>
      </div>
    </section>

    <div class="bg-white">
      <div class="max-w-[900px] mx-auto px-4 md:px-8 pt-10 pb-4">
        <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 class="text-2xl font-bold text-[#111] tracking-[-0.02em]">{{ feedTitle }}</h2>

          <div v-if="isAuthenticated && hasInterests" class="flex gap-1 bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl p-1">
            <button
              v-for="m in [{ key: 'personalized' as FeedMode, label: 'Para você' }, { key: 'general' as FeedMode, label: 'Explorar' }]"
              :key="m.key"
              class="text-[0.75rem] font-semibold px-3 py-1.5 rounded-lg transition-all border-none cursor-pointer"
              :class="feedMode === m.key ? 'bg-white text-[#111] shadow-sm' : 'bg-transparent text-[#aaa] hover:text-[#555]'"
              @click="setFeedMode(m.key)"
            >
              {{ m.label }}
            </button>
          </div>
        </div>

        <div class="relative mb-4">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar posts, títulos..."
            class="w-full h-11 pl-11 pr-5 bg-white border border-[#e8e4dc] rounded-xl text-sm text-[#111] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all"
          />
          <svg
            v-if="loading && searchQuery"
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

        <div v-if="feedMode === 'general'" class="flex items-center gap-2 flex-wrap mb-2">
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
            ✕ limpar
          </button>
        </div>
      </div>

      <!-- Recommended carousel: compact and above the main list -->
      <section
        v-if="recommendedDisplayPosts.length > 0"
        class="max-w-[900px] mx-auto px-4 md:px-8 pb-3"
      >
        <div class="flex items-end justify-between gap-4 mb-3">
          <div>
            <h3 class="text-[1rem] md:text-[1.05rem] font-bold text-[#111] tracking-[-0.02em]">
              Recomendado para você
            </h3>
            <p class="text-[0.74rem] text-[#aaa] mt-1">
              Um recorte mais pessoal, sem ocupar muito espaço.
            </p>
          </div>

          <div class="flex gap-2">
            <button
              @click="scrollRecommendedCarousel(-1)"
              class="w-8 h-8 rounded-full border border-[#e8e4dc] bg-white flex items-center justify-center hover:border-[#079272] hover:text-[#079272] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="recommendedLoading || !recommendedCanScrollLeft"
              aria-label="Voltar recomendações"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <button
              @click="scrollRecommendedCarousel(1)"
              class="w-8 h-8 rounded-full border border-[#e8e4dc] bg-white flex items-center justify-center hover:border-[#079272] hover:text-[#079272] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="recommendedLoading || !recommendedCanScrollRight"
              aria-label="Avançar recomendações"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        <div
          ref="recommendedCarouselRef"
          class="recommended-carousel flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1"
          @scroll.passive="updateRecommendedCarouselState"
        >
          <button
            v-for="rec in recommendedDisplayPosts"
            :key="rec.id ?? rec.slug"
            class="snap-start shrink-0 w-[230px] sm:w-[250px] text-left bg-white border border-[#e8e4dc] rounded-2xl overflow-hidden hover:shadow-md hover:border-[#079272]/20 transition-all group cursor-pointer"
            @click="openArticle(rec)"
          >
            <div class="p-4 flex flex-col gap-3 h-full">
              <div class="flex items-start justify-between gap-2">
                <span
                  v-if="rec.similarity"
                  class="text-[0.6rem] font-semibold px-2 py-0.5 rounded-full bg-[#f0faf7] text-[#079272] border border-[#c5e8df] whitespace-nowrap"
                >
                  {{ Math.round(rec.similarity * 100) }}% match
                </span>

                <span
                  class="text-[0.6rem] font-semibold px-2 py-0.5 rounded-full"
                  :style="{ background: colorFor(rec) + '18', color: colorFor(rec) }"
                >
                  {{ labelFor(rec) }}
                </span>
              </div>

              <h4 class="text-[0.9rem] font-bold text-[#111] line-clamp-2 group-hover:text-[#079272] transition-colors">
                {{ rec.title }}
              </h4>

              <p v-if="rec.excerpt" class="text-[0.72rem] text-[#666] line-clamp-3">
                {{ rec.excerpt }}
              </p>

              <div class="pt-2 mt-auto flex items-center justify-between text-[0.65rem] text-[#aaa] border-t border-[#f7f5f0]">
                <span v-if="rec.deadline">
                  Prazo: {{ new Date(rec.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) }}
                </span>
                <span>Clique para ler</span>
              </div>
            </div>
          </button>
        </div>

        <div v-if="recommendedLoading" class="text-center py-4 text-sm text-[#aaa]">
          <svg class="animate-spin w-4 h-4 inline-block mr-2 text-[#079272]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Carregando recomendações...
        </div>

        <div v-else-if="recommendedError" class="text-center py-4 text-sm text-red-500">
          {{ recommendedError }}
        </div>
      </section>

      <main class="max-w-[900px] mx-auto px-4 md:px-8 pb-24 pt-2 flex flex-col gap-4">
        <template v-if="loading">
          <div v-for="i in 4" :key="i" class="bg-white rounded-2xl border border-[#e8e4dc] p-8 animate-pulse flex flex-col gap-3">
            <div class="flex gap-3">
              <div class="h-3 w-20 bg-[#f0ece5] rounded-full"></div>
              <div class="h-3 w-16 bg-[#f0ece5] rounded-full"></div>
            </div>
            <div class="h-5 w-3/4 bg-[#f0ece5] rounded-lg"></div>
            <div class="h-3.5 w-full bg-[#f0ece5] rounded"></div>
            <div class="h-3.5 w-4/5 bg-[#f0ece5] rounded"></div>
          </div>
        </template>

        <div v-else-if="error" class="flex flex-col items-center py-20 gap-4 text-center">
          <div class="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p class="text-sm font-light text-[#666]">{{ error }}</p>
          <button
            class="text-sm font-semibold px-5 py-2 bg-[#0d0d0d] text-white rounded-lg hover:bg-[#079272] transition-colors border-none cursor-pointer"
            @click="fetchPosts()"
          >
            Tentar novamente
          </button>
        </div>

        <div v-else-if="posts.length === 0" class="flex flex-col items-center py-20 gap-3 text-center">
          <div class="w-14 h-14 rounded-2xl bg-[#f7f5f0] flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <p class="text-sm font-light text-[#666]">
            <span v-if="feedMode === 'personalized'">Nenhum post corresponde aos seus interesses ainda.</span>
            <span v-else-if="activeTag">Nenhum post com a tag <strong>#{{ activeTag }}</strong>.</span>
            <span v-else-if="searchQuery">Nenhum resultado para "<strong>{{ searchQuery }}</strong>".</span>
            <span v-else>Nenhum post encontrado.</span>
          </p>
          <button
            v-if="feedMode === 'personalized' || activeTag || searchQuery"
            class="text-xs text-[#079272] underline border-none bg-transparent cursor-pointer"
            @click="setFeedMode('general'); activeTag = ''; searchQuery = ''"
          >
            Ver todos os posts
          </button>
        </div>

        <template v-else>
          <FeedPostCard
            v-for="(post, index) in posts"
            :key="post.id"
            :post="post"
            :index="index"
            @read="openArticle"
          />

          <div v-if="hasMore" class="flex justify-center pt-2">
            <button
              class="flex items-center gap-2 text-sm font-semibold px-8 py-3 border border-[#e8e4dc] text-[#666] rounded-xl hover:border-[#0d0d0d] hover:text-[#111] transition-all disabled:opacity-40 cursor-pointer bg-transparent"
              :disabled="loadingMore"
              @click="loadMore"
            >
              <svg v-if="loadingMore" class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              {{ loadingMore ? 'Carregando...' : `Carregar mais (${totalCount - posts.length} restantes)` }}
            </button>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<style scoped>
.recommended-carousel {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.recommended-carousel::-webkit-scrollbar {
  display: none;
}
</style>