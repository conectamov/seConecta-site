<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Revisar Conteúdos — seConecta' })

const router = useRouter()
const { get, patch, delete: destroy } = useAxios() // Adicionado patch e destroy

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

// SOLUÇÃO DO BUG: Alterado para a rota correta conforme imagem do Swagger
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

    if (postsSearchQuery.value.trim()) params.search = postsSearchQuery.value.trim()

    // Rota correta para revisão (pendentes)
    const res = await get('/olympiads/pending', { params }) 
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

// ─────────────────────────────────────────────────────────────────────────────
// LÓGICA DE APROVAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

async function handleApproveOlympiad(id: number) {
  try {
    await patch(`/olympiads/${id}`, { approved: true })
    // Remove localmente após aprovação
    olympiads.value = olympiads.value.filter(o => o.id !== id)
    olympiadsTotalCount.value--
    if (selectedOlimpiad.value?.id === id) selectedOlimpiad.value = null
  } catch (err) {
    alert("Erro ao aprovar olimpíada. Verifique suas permissões.")
  }
}

async function handleApprovePost(id: number) {
  try {
    await patch(`/posts/${id}`, { approved: true })
    posts.value = posts.value.filter(p => p.id !== id)
    postsTotalCount.value--
  } catch (err) {
    alert("Erro ao aprovar post.")
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

const todayLabel = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
})

const feedTitle = computed(() => activeTag.value ? `#${activeTag.value}` : 'Fila de revisão')
const searchLoading = computed(() => (postsLoading.value || olympiadsLoading.value) && !!postsSearchQuery.value.trim())
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
          Obrigado por ajudar a moderar a comunidade. Aqui você revisa posts e olimpíadas que ainda não foram aprovados.
        </p>
      </div>
    </section>

    <div class="bg-white">
      <div class="max-w-[900px] mx-auto px-4 md:px-8 pt-10 pb-4">
        <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 class="text-2xl font-bold text-[#111] tracking-[-0.02em]">{{ feedTitle }}</h2>
          <button v-if="activeTag || postsSearchQuery" class="text-[0.72rem] font-semibold px-3 py-1.5 rounded-lg border border-[#e8e4dc] bg-white text-[#666] hover:border-[#079272]" @click="clearFilters">
            Limpar filtros
          </button>
        </div>

        <div class="relative mb-4">
          <input v-model="postsSearchQuery" type="text" placeholder="Buscar na fila de revisão..." class="w-full h-11 pl-11 pr-5 bg-white border border-[#e8e4dc] rounded-xl text-sm focus:ring-2 focus:ring-[#079272] outline-none transition-all" />
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        </div>
      </div>

      <main class="max-w-[900px] mx-auto px-4 md:px-8 pb-24 pt-2 flex flex-col gap-10">
        <section>
          <div class="flex items-center justify-between gap-3 mb-4">
            <h3 class="text-lg font-bold text-[#111]">Posts para Revisão</h3>
            <span class="text-[0.75rem] text-[#888]">{{ postsTotalCount }} pendentes</span>
          </div>

          <div v-if="posts.length === 0 && !postsLoading" class="py-10 text-center text-sm text-gray-500">
            Nenhum post aguardando revisão.
          </div>

          <div v-for="(post, index) in posts" :key="post.id" class="relative group">
            <FeedPostCard :post="post" :index="index" @read="openArticle" />
            <button 
              class="absolute top-4 right-4 z-10 bg-[#079272] text-white text-[0.7rem] font-bold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              @click.stop="handleApprovePost(post.id)"
            >
              APROVAR POST
            </button>
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

          <div v-if="olympiads.length === 0 && !olympiadsLoading" class="py-10 text-center text-sm text-gray-500">
            Nenhuma olimpíada aguardando revisão.
          </div>

          <div class="flex flex-col gap-4">
            <div v-for="o in olympiads" :key="o.id" class="relative group">
              <OlimpiadasOlimpiadCard :olimpiad="o" @open="selectedOlimpiad = $event" />
              <button 
                class="absolute top-1/2 -translate-y-1/2 right-6 z-10 bg-[#079272] text-white text-[0.7rem] font-bold px-4 py-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-xl"
                @click.stop="handleApproveOlympiad(o.id)"
              >
                APROVAR AGORA
              </button>
            </div>
          </div>

          <button v-if="hasMoreOlympiads" class="w-full mt-6 py-3 text-sm font-semibold border border-[#e8e4dc] rounded-xl hover:bg-gray-50" @click="loadMoreOlympiads">
            {{ olympiadsLoadingMore ? 'Carregando...' : 'Carregar mais olimpíadas' }}
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