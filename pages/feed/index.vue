<script setup lang="ts">
useSeoMeta({ title: 'Feed — seConecta' })

const router = useRouter()
const { get } = useAxios()
const { currentUser, isAuthenticated } = useAuth()

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let t: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay) }
}

// State for Posts (Histórias)
const posts       = ref<any[]>([])
const loading     = ref(true)
const loadingMore = ref(false)
const error       = ref<string | null>(null)
const searchQuery = ref('')
const activeTag   = ref('')
const page        = ref(1)
const totalCount  = ref(0)
const LIMIT       = 8

// State for Guides (Guias)
const guides        = ref<any[]>([])
const loadingGuides = ref(false)
const guidesError   = ref<string | null>(null)

// View Toggle: 'stories' (Histórias) vs 'guides' (Guias)
type ViewTab = 'stories' | 'guides'
const activeView = ref<ViewTab>('stories')

type FeedMode = 'general' | 'personalized'
const feedMode = ref<FeedMode>('general')

const hasMore        = computed(() => posts.value.length < totalCount.value)
const hasInterests   = computed(() => (currentUser.value?.interests?.length ?? 0) > 0)
const popularTags    = ['oportunidade', 'olimpíada', 'inscrições', 'camp', 'exterior', 'stem', 'tecnologia']
const todayLabel     = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })

// Fetching Logic
async function fetchPosts(reset = true) {
  if (reset) { page.value = 1; loading.value = true }
  else loadingMore.value = true
  error.value = null
  try {
    let res
    if (feedMode.value === 'personalized' && isAuthenticated.value) {
      res = await get('/posts/feed', { params: { page: page.value, limit: LIMIT } })
    } else {
      const params: Record<string, any> = { page: page.value, limit: LIMIT }
      if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
      if (activeTag.value) params.tag = activeTag.value
      res = await get('/posts/', { params })
    }
    const data  = res.data.data  ?? []
    const count = res.data.count ?? 0
    if (reset) { posts.value = data; totalCount.value = count }
    else posts.value.push(...data)
  } catch {
    error.value = 'Não foi possível carregar os posts.'
  } finally {
    loading.value = loadingMore.value = false
  }
}

async function fetchGuides() {
  loadingGuides.value = true
  guidesError.value = null
  try {
    // Calling the guides endpoint we created earlier
    const res = await get('/guides/')
    guides.value = res.data.data ?? []
  } catch {
    guidesError.value = 'Não foi possível carregar os guias.'
  } finally {
    loadingGuides.value = false
  }
}

async function loadMore() {
  if (!hasMore.value || loadingMore.value) return
  page.value++
  await fetchPosts(false)
}

function setTag(tag: string) {
  activeTag.value   = activeTag.value === tag ? '' : tag
  feedMode.value    = 'general'
  searchQuery.value = ''
  fetchPosts(true)
}

function setFeedMode(mode: FeedMode) {
  feedMode.value    = mode
  activeTag.value   = ''
  searchQuery.value = ''
  fetchPosts(true)
}

function switchTab(tab: ViewTab) {
  activeView.value = tab
  if (tab === 'guides' && guides.value.length === 0) {
    fetchGuides()
  }
}

watch(searchQuery, debounce(() => {
  if (feedMode.value === 'personalized') feedMode.value = 'general'
  activeTag.value = ''
  fetchPosts(true)
}, 400))

onMounted(() => {
  if (isAuthenticated.value && hasInterests.value) feedMode.value = 'personalized'
  fetchPosts()
})

const feedTitle = computed(() => {
  if (activeView.value === 'guides') return 'Guias de Estudo'
  if (feedMode.value === 'personalized') return 'Para você'
  if (activeTag.value) return `${activeTag.value}`
  return 'Explorar'
})
</script>

<template>
  <div class="min-h-screen">
    <section class="relative overflow-hidden py-16 px-8 bg-none">
      <div class="absolute rounded-full blur-[60px] opacity-10 pointer-events-none w-[300px] h-[300px] top-[5%] right-[5%] bg-[#079272] max-sm:hidden"></div>
      <div class="absolute rounded-full blur-[60px] opacity-10 pointer-events-none w-[200px] h-[200px] bottom-[10%] right-[25%] bg-[#2464E8] max-sm:hidden"></div>

      <div class="relative z-10 max-w-[900px] mx-auto w-full text-center md:text-left">
        <div data-aos="fade-up" class="flex items-center justify-center md:justify-start gap-2 text-[0.7rem] font-medium tracking-[0.14em] uppercase mb-6">
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
      <div class="max-w-[900px] mx-auto px-4 md:px-8 pt-4 pb-4">
        
        <div v-if="!isAuthenticated" class="mb-8 bg-[#fffdf5] border border-[#f5d480] rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div class="flex items-start md:items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-[#fef5d4] flex items-center justify-center flex-shrink-0">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d9a000" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="3"/></svg>
            </div>
            <div>
              <h3 class="text-[0.95rem] font-bold text-[#8a6500] mb-1">Você ainda não está conectado</h3>
              <p class="text-[0.85rem] text-[#a67c00] leading-snug">Faça login para salvar conteúdos e acessar seu feed personalizado.</p>
            </div>
          </div>
          <button @click="router.push('/login')" class="flex-shrink-0 text-[0.85rem] font-bold px-5 py-2.5 bg-[#d9a000] text-white rounded-xl hover:bg-[#b38600] transition-colors border-none cursor-pointer">
            Fazer login
          </button>
        </div>

        <div class="flex items-center gap-1 bg-[#f7f5f0] border border-[#e8e4dc] rounded-2xl p-1.5 w-fit mb-10 mx-auto md:mx-0">
          <button 
            @click="switchTab('stories')"
            class="flex items-center gap-2 px-6 py-2 rounded-xl text-[0.85rem] font-bold transition-all border-none cursor-pointer"
            :class="activeView === 'stories' ? 'bg-white text-[#111] shadow-sm' : 'text-[#aaa] hover:text-[#777] bg-transparent'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            Histórias
          </button>
          <button 
            @click="switchTab('guides')"
            class="flex items-center gap-2 px-6 py-2 rounded-xl text-[0.85rem] font-bold transition-all border-none cursor-pointer"
            :class="activeView === 'guides' ? 'bg-white text-[#111] shadow-sm' : 'text-[#aaa] hover:text-[#777] bg-transparent'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            Guias
          </button>
        </div>

        <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 class="text-2xl font-bold text-[#111] tracking-[-0.02em]">{{ feedTitle }}</h2>
          
          <div v-if="activeView === 'stories' && isAuthenticated && hasInterests" class="flex gap-1 bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl p-1">
            <button
              v-for="m in [{ key: 'personalized' as FeedMode, label: 'Para você' }, { key: 'general' as FeedMode, label: 'Explorar' }]"
              :key="m.key"
              class="text-[0.75rem] font-semibold px-3 py-1.5 rounded-lg transition-all border-none cursor-pointer"
              :class="feedMode === m.key ? 'bg-white text-[#111] shadow-sm' : 'bg-transparent text-[#aaa] hover:text-[#555]'"
              @click="setFeedMode(m.key)"
            >{{ m.label }}</button>
          </div>
        </div>

        <div class="relative mb-4">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            v-model="searchQuery" 
            type="text" 
            :placeholder="activeView === 'stories' ? 'Buscar posts, histórias...' : 'Buscar guias de estudo...'"
            class="w-full h-11 pl-11 pr-5 bg-white border border-[#e8e4dc] rounded-xl text-sm text-[#111] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all" 
          />
        </div>

        <div v-if="activeView === 'stories' && feedMode === 'general'" class="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            v-for="tag in popularTags" :key="tag"
            class="whitespace-nowrap text-[0.72rem] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer"
            :class="activeTag === tag ? 'bg-[#0d0d0d] text-white border-[#0d0d0d]' : 'bg-white text-[#666] border-[#e8e4dc] hover:border-[#079272] hover:text-[#079272]'"
            @click="setTag(tag)"
          >#{{ tag }}</button>
        </div>
      </div>

      <main class="max-w-[900px] mx-auto px-4 md:px-8 pb-24 pt-2">

        <div v-if="activeView === 'stories'" class="flex flex-col gap-4">
          <template v-if="loading">
            <div v-for="i in 3" :key="i" class="bg-white rounded-2xl border border-[#e8e4dc] p-8 animate-pulse flex flex-col gap-3">
              <div class="h-3 w-20 bg-[#f0ece5] rounded-full"></div>
              <div class="h-5 w-3/4 bg-[#f0ece5] rounded-lg"></div>
              <div class="h-3.5 w-full bg-[#f0ece5] rounded"></div>
            </div>
          </template>

          <template v-else-if="posts.length">
            <FeedPostCard 
              v-for="(post, index) in posts" 
              :key="post.id" 
              :post="post" 
              :index="index" 
              @read="(p) => router.push(`/feed/${p.slug || p.id}`)" 
            />
            
            <div v-if="hasMore" class="flex justify-center pt-4">
              <button @click="loadMore" :disabled="loadingMore" class="flex items-center gap-2 text-sm font-semibold px-8 py-3 border border-[#e8e4dc] text-[#666] rounded-xl hover:border-[#0d0d0d] hover:text-[#111] transition-all bg-transparent cursor-pointer">
                {{ loadingMore ? 'Carregando...' : 'Carregar mais' }}
              </button>
            </div>
          </template>

          <div v-else class="text-center py-20">
             <p class="text-[#aaa]">Nenhuma história encontrada.</p>
          </div>
        </div>

        <div v-else class="flex flex-col gap-6">
          <template v-if="loadingGuides">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="i in 4" :key="i" class="h-48 bg-[#f7f5f0] rounded-2xl animate-pulse"></div>
            </div>
          </template>

          <div v-else-if="guides.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              v-for="guide in guides" 
              :key="guide.id"
              @click="router.push(`/guides/${guide.id}`)"
              class="group bg-white rounded-2xl border border-[#e8e4dc] p-6 hover:border-[#079272] transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-xl bg-[#079272]/10 flex items-center justify-center text-[#079272]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                </div>
                <span class="text-[0.65rem] font-bold uppercase tracking-wider text-[#aaa]">{{ guide.posts?.length || 0 }} etapas</span>
              </div>
              <h3 class="font-bold text-[#111] group-hover:text-[#079272] transition-colors mb-2">{{ guide.title }}</h3>
              <p class="text-[0.8rem] text-[#777] line-clamp-2 leading-relaxed">{{ guide.description }}</p>
              
              <div class="mt-4 pt-4 border-t border-[#f7f5f0] flex items-center justify-between">
                <span class="text-[0.7rem] font-medium text-[#bbb]">Criado por seConecta</span>
                <span class="text-[#079272] group-hover:translate-x-1 transition-transform">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </span>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-20 flex flex-col items-center gap-4">
             <div class="w-16 h-16 rounded-full bg-[#f7f5f0] flex items-center justify-center text-[#aaa]">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
             </div>
             <p class="text-[#aaa]">Nenhum guia disponível no momento.</p>
          </div>
        </div>

      </main>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>