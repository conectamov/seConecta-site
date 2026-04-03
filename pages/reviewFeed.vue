<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Revisar Conteúdos — seConecta' })

const router = useRouter()
const { get, post } = useAxios()

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let t: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }
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

const popularTags = ['carreira', 'tecnologia', 'startup', 'design', 'produto', 'python', 'gestão']

// ─────────────────────────────────────────────────────────────────────────────
// OLYMPIADS
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
const approvingId = ref<number | null>(null)

// ─────────────────────────────────────────────────────────────────────────────
// SHARED
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
// REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

async function fetchPosts(reset = true) {
  if (reset) {
    postsPage.value = 1
    postsLoading.value = true
  } else postsLoadingMore.value = true

  postsError.value = null

  try {
    const params: any = { page: postsPage.value, limit: POSTS_LIMIT }
    if (postsSearchQuery.value.trim()) params.search = postsSearchQuery.value.trim()
    if (activeTag.value) params.tag = activeTag.value

    const res = await get('/posts/pending', { params })

    if (reset) {
      posts.value = res.data?.data ?? []
      postsTotalCount.value = res.data?.count ?? 0
    } else {
      posts.value.push(...(res.data?.data ?? []))
    }
  } catch {
    postsError.value = 'Erro ao carregar posts.'
  } finally {
    postsLoading.value = postsLoadingMore.value = false
  }
}

async function fetchOlympiads(reset = true) {
  if (reset) {
    olympiadsPage.value = 1
    olympiadsLoading.value = true
  } else olympiadsLoadingMore.value = true

  olympiadsError.value = null

  try {
    const params: any = {
      page: olympiadsPage.value,
      limit: OLYMPIADS_LIMIT,
      approved: false,
    }

    if (postsSearchQuery.value.trim()) params.search = postsSearchQuery.value.trim()

    const res = await get('/olympiads/', { params })

    if (reset) {
      olympiads.value = res.data?.data ?? []
      olympiadsTotalCount.value = res.data?.count ?? 0
    } else {
      olympiads.value.push(...(res.data?.data ?? []))
    }
  } catch {
    olympiadsError.value = 'Erro ao carregar olimpíadas.'
  } finally {
    olympiadsLoading.value = olympiadsLoadingMore.value = false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// APPROVE OLYMPIAD ✅
// ─────────────────────────────────────────────────────────────────────────────

async function approveOlympiad(id: number) {
  if (approvingId.value) return
  approvingId.value = id

  try {
    await post(`/olympiads/${id}/approve`)
    
    // remove instantly from UI (feels faster)
    olympiads.value = olympiads.value.filter(o => o.id !== id)
    olympiadsTotalCount.value--

  } catch (e) {
    alert('Erro ao aprovar olimpíada.')
  } finally {
    approvingId.value = null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOAD MORE
// ─────────────────────────────────────────────────────────────────────────────

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

watch(postsSearchQuery, debounce(() => {
  activeTag.value = ''
  refreshAll()
}, 400))

onMounted(refreshAll)

function openArticle(post: any) {
  router.push(`/feed/${post.slug || post.id}`)
}

function clearFilters() {
  activeTag.value = ''
  postsSearchQuery.value = ''
  refreshAll()
}
</script>

<template>
  <main class="max-w-[900px] mx-auto px-4 md:px-8 pb-24 pt-10 flex flex-col gap-10">

    <!-- OLYMPIADS -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold">Olimpíadas pendentes</h3>
        <span class="text-xs text-gray-500">{{ olympiadsTotalCount }}</span>
      </div>

      <div class="flex flex-col gap-4">
        <div
          v-for="o in olympiads"
          :key="o.id"
          class="bg-white border rounded-xl p-4 flex flex-col gap-3"
        >
          <div class="flex justify-between items-start">
            <div>
              <h4 class="font-bold text-lg">{{ o.title }}</h4>
              <p class="text-sm text-gray-500">{{ o.organizer }}</p>
            </div>

            <!-- APPROVE BUTTON -->
            <button
              @click="approveOlympiad(o.id)"
              :disabled="approvingId === o.id"
              class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#079272] hover:opacity-90 disabled:opacity-50"
            >
              {{ approvingId === o.id ? 'Aprovando...' : 'Aprovar' }}
            </button>
          </div>

          <p class="text-sm text-gray-600 line-clamp-2">
            {{ o.description }}
          </p>

          <div class="text-xs text-gray-400 flex gap-4">
            <span>Início: {{ formatOlympiadDate(o.start_date) }}</span>
            <span>Fim: {{ formatOlympiadDate(o.end_date) }}</span>
          </div>
        </div>
      </div>

      <div v-if="hasMoreOlympiads" class="flex justify-center pt-4">
        <button
          @click="loadMoreOlympiads"
          class="px-6 py-2 border rounded-lg text-sm"
        >
          Carregar mais
        </button>
      </div>
    </section>

  </main>
</template>