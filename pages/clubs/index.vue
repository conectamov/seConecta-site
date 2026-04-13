<script setup lang="ts">
import { useClubs } from '@/composables/useClubs'
import { useAuth } from '@/composables/useAuth'

useSeoMeta({ title: 'Clubes — seConecta' })

const router = useRouter()
const { isAuthenticated } = useAuth()
const clubs = useClubs()

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let t: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }
}

// ── State ────────────────────────────────────────────────────────────────────

type ViewTab = 'explore' | 'mine'
const activeView = ref<ViewTab>('explore')

const publicClubs  = ref<any[]>([])
const myClubs      = ref<any[]>([])
const loading      = ref(true)
const loadingMore  = ref(false)
const error        = ref<string | null>(null)

const searchQuery  = ref('')
const filterMode   = ref('')
const filterLevel  = ref('')
const page         = ref(1)
const hasMore      = ref(false)
const LIMIT        = 12

// Join by code modal
const showJoinModal  = ref(false)
const joinCode       = ref('')
const joiningCode    = ref(false)
const joinCodeError  = ref<string | null>(null)
const joinCodeSuccess = ref<string | null>(null)

const MODES = [
  { value: '', label: 'Todos os modos' },
  { value: 'FREE',       label: 'Grupo Livre' },
  { value: 'CLASSROOM',  label: 'Sala de Aula' },
  { value: 'MENTORSHIP', label: 'Mentoria' },
  { value: 'COURSE',     label: 'Curso' },
  { value: 'COMMUNITY',  label: 'Comunidade' },
]

const LEVELS = ['', 'iniciante', 'intermediário', 'avançado']

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchExplore(reset = true) {
  if (reset) {
    page.value = 1
    loading.value = true
    publicClubs.value = []
  } else {
    loadingMore.value = true
  }
  error.value = null

  try {
    const filter: Record<string, any> = {}
    if (filterMode.value)  filter.mode = filterMode.value
    if (filterLevel.value) filter.level = filterLevel.value
    if (searchQuery.value.trim()) filter.nameContains = searchQuery.value.trim()

    const offset = (page.value - 1) * LIMIT
    const hasFilter = Object.keys(filter).length > 0

    const result = hasFilter
      ? await clubs.searchClubs(filter, LIMIT, offset)
      : await clubs.fetchPublicClubs(LIMIT, offset)

    if (reset) {
      publicClubs.value = result
    } else {
      publicClubs.value.push(...result)
    }

    hasMore.value = result.length === LIMIT
  } catch {
    error.value = 'Não foi possível carregar os clubes.'
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function fetchMine() {
  if (!isAuthenticated.value) return
  loading.value = true
  error.value = null
  try {
    myClubs.value = await clubs.fetchMyClubs()
  } catch {
    error.value = 'Não foi possível carregar seus clubes.'
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (!hasMore.value || loadingMore.value) return
  page.value++
  await fetchExplore(false)
}

function switchTab(tab: ViewTab) {
  activeView.value = tab
  error.value = null
  if (tab === 'explore') {
    fetchExplore(true)
  } else {
    fetchMine()
  }
}

// ── Join by code ──────────────────────────────────────────────────────────────

async function handleJoinByCode() {
  if (!joinCode.value.trim() || joiningCode.value) return
  joiningCode.value = true
  joinCodeError.value = null
  joinCodeSuccess.value = null

  try {
    const member = await clubs.joinByCode(joinCode.value.trim().toUpperCase())
    const status = member?.status
    if (status === 'ACTIVE') {
      joinCodeSuccess.value = 'Você entrou no clube com sucesso!'
    } else if (status === 'PENDING') {
      joinCodeSuccess.value = 'Solicitação enviada! Aguardando aprovação.'
    }
    joinCode.value = ''
    if (activeView.value === 'mine') fetchMine()
    setTimeout(() => { showJoinModal.value = false; joinCodeSuccess.value = null }, 2200)
  } catch (e: any) {
    joinCodeError.value = e?.message || 'Código inválido ou expirado.'
  } finally {
    joiningCode.value = false
  }
}

// ── Watchers ──────────────────────────────────────────────────────────────────

watch(searchQuery, debounce(() => fetchExplore(true), 400))
watch([filterMode, filterLevel], () => fetchExplore(true))

onMounted(() => {
  fetchExplore(true)
})

const displayedClubs = computed(() =>
  activeView.value === 'explore' ? publicClubs.value : myClubs.value
)

const pageTitle = computed(() => {
  if (activeView.value === 'mine') return 'Meus Clubes'
  if (filterMode.value) return MODES.find(m => m.value === filterMode.value)?.label ?? 'Clubes'
  if (searchQuery.value) return `"${searchQuery.value}"`
  return 'Explorar Clubes'
})
</script>

<template>
  <div class="min-h-screen bg-[#f7f5f0]">

    <!-- Hero -->
    <section class="relative overflow-hidden bg-[#0c1b32] pt-20 pb-12 px-8">
      <div class="absolute rounded-full blur-[80px] opacity-10 pointer-events-none w-[400px] h-[400px] top-[-10%] right-[0%] bg-[#079272]"></div>
      <div class="absolute rounded-full blur-[60px] opacity-8 pointer-events-none w-[250px] h-[250px] bottom-[-20%] left-[20%] bg-[#2464E8]"></div>

      <div class="relative z-10 max-w-[960px] mx-auto">
        <div class="flex items-center gap-2 text-[0.7rem] font-medium tracking-[0.14em] uppercase mb-5 text-white/40">
          <span class="w-[6px] h-[6px] rounded-full bg-[#079272] relative before:content-[''] before:absolute before:inset-0 before:rounded-full before:bg-[#079272] before:animate-ping"></span>
          Ambiente de aprendizado colaborativo
        </div>

        <div class="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 class="text-[clamp(2rem,5vw,3.2rem)] font-extrabold text-white leading-[1.1] tracking-[-0.03em] mb-3">
              Clubes de Estudo
            </h1>
            <p class="text-base font-light text-white/40 max-w-[480px] leading-relaxed">
              Grupos colaborativos para aprender, ensinar e crescer juntos.
            </p>
          </div>

          <div class="flex gap-3 flex-wrap">
            <!-- Join by code -->
            <button
              class="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 text-white/70 text-[0.85rem] font-semibold bg-transparent hover:bg-white/10 transition-colors cursor-pointer"
              @click="showJoinModal = true"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Entrar com código
            </button>

            <NuxtLink
              v-if="isAuthenticated"
              to="/clubs/create"
              class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#079272] text-white text-[0.85rem] font-semibold hover:bg-[#068060] transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Criar clube
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Toolbar -->
    <div class="bg-white border-b border-[#e8e4dc] sticky top-0 z-30">
      <div class="max-w-[960px] mx-auto px-4 md:px-8 py-3 flex items-center gap-3 flex-wrap">
        <!-- Tabs -->
        <div class="flex items-center gap-1 bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl p-1">
          <button
            v-for="tab in [{ key: 'explore', label: 'Explorar' }, { key: 'mine', label: 'Meus clubes' }]"
            :key="tab.key"
            class="px-4 py-1.5 rounded-lg text-[0.8rem] font-semibold transition-all border-none cursor-pointer"
            :class="activeView === tab.key ? 'bg-white text-[#111] shadow-sm' : 'bg-transparent text-[#aaa] hover:text-[#555]'"
            @click="switchTab(tab.key as ViewTab)"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Search -->
        <div class="flex-1 relative min-w-[180px]">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa] pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar clubes..."
            class="w-full h-9 pl-9 pr-4 bg-white border border-[#e8e4dc] rounded-xl text-[0.85rem] text-[#111] placeholder:text-[#bbb] outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all"
          />
        </div>

        <!-- Filters (explore only) -->
        <template v-if="activeView === 'explore'">
          <select
            v-model="filterMode"
            class="h-9 px-3 bg-white border border-[#e8e4dc] rounded-xl text-[0.8rem] text-[#555] outline-none focus:ring-2 focus:ring-[#079272] cursor-pointer"
          >
            <option v-for="m in MODES" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>

          <select
            v-model="filterLevel"
            class="h-9 px-3 bg-white border border-[#e8e4dc] rounded-xl text-[0.8rem] text-[#555] outline-none focus:ring-2 focus:ring-[#079272] cursor-pointer"
          >
            <option value="">Todos os níveis</option>
            <option v-for="l in LEVELS.slice(1)" :key="l" :value="l" class="capitalize">{{ l }}</option>
          </select>
        </template>
      </div>
    </div>

    <!-- Main content -->
    <main class="max-w-[960px] mx-auto px-4 md:px-8 py-8">

      <!-- Login nudge (mine tab) -->
      <div
        v-if="activeView === 'mine' && !isAuthenticated"
        class="bg-white border border-[#e8e4dc] rounded-2xl p-8 text-center"
      >
        <div class="w-14 h-14 rounded-2xl bg-[#f0faf7] flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#079272" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <h3 class="text-[1rem] font-bold text-[#111] mb-2">Faça login para ver seus clubes</h3>
        <p class="text-sm text-[#888] mb-5">Entre para acessar os clubes que você participa e criou.</p>
        <button
          class="px-6 py-2.5 bg-[#0d0d0d] text-white text-sm font-semibold rounded-xl hover:bg-[#079272] transition-colors border-none cursor-pointer"
          @click="router.push('/login')"
        >
          Fazer login
        </button>
      </div>

      <template v-else>
        <!-- Section title -->
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-[#111] tracking-[-0.02em]">{{ pageTitle }}</h2>
          <span v-if="!loading" class="text-[0.78rem] text-[#aaa]">
            {{ displayedClubs.length }} clube{{ displayedClubs.length !== 1 ? 's' : '' }}
          </span>
        </div>

        <!-- Loading skeletons -->
        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="i in 6" :key="i" class="bg-white rounded-2xl border border-[#e8e4dc] overflow-hidden animate-pulse">
            <div class="h-32 bg-[#f0ece5]"></div>
            <div class="p-5 space-y-3">
              <div class="h-4 w-3/4 bg-[#f0ece5] rounded"></div>
              <div class="h-3.5 w-full bg-[#f0ece5] rounded"></div>
              <div class="h-3.5 w-2/3 bg-[#f0ece5] rounded"></div>
            </div>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="flex flex-col items-center gap-4 py-20 text-center">
          <div class="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p class="text-[#555]">{{ error }}</p>
          <button
            class="text-sm font-semibold px-5 py-2 bg-[#0d0d0d] text-white rounded-lg hover:bg-[#079272] transition-colors border-none cursor-pointer"
            @click="activeView === 'explore' ? fetchExplore(true) : fetchMine()"
          >
            Tentar novamente
          </button>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="displayedClubs.length === 0"
          class="flex flex-col items-center gap-4 py-20 text-center"
        >
          <div class="w-16 h-16 rounded-full bg-[#f7f5f0] flex items-center justify-center text-[#aaa]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <p class="font-semibold text-[#555] mb-1">
              {{ activeView === 'mine' ? 'Você ainda não participa de nenhum clube' : 'Nenhum clube encontrado' }}
            </p>
            <p class="text-sm text-[#aaa]">
              {{ activeView === 'mine' ? 'Entre em um clube com código ou explore os disponíveis.' : 'Tente ajustar os filtros ou criar um novo clube.' }}
            </p>
          </div>
          <div class="flex gap-3">
            <button
              class="text-sm font-semibold px-4 py-2 border border-[#e8e4dc] text-[#666] rounded-xl hover:border-[#079272] hover:text-[#079272] transition-all bg-transparent cursor-pointer"
              @click="showJoinModal = true"
            >
              Entrar com código
            </button>
            <NuxtLink
              v-if="isAuthenticated"
              to="/clubs/create"
              class="text-sm font-semibold px-4 py-2 bg-[#079272] text-white rounded-xl hover:bg-[#068060] transition-colors"
            >
              Criar clube
            </NuxtLink>
          </div>
        </div>

        <!-- Grid of cards -->
        <template v-else>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ClubsClubCard
              v-for="(club, idx) in displayedClubs"
              :key="club.id"
              :club="club"
              :index="idx"
              @open="router.push(`/clubs/${club.slug}`)"
            />
          </div>

          <!-- Load more -->
          <div v-if="hasMore && activeView === 'explore'" class="flex justify-center mt-8">
            <button
              :disabled="loadingMore"
              class="flex items-center gap-2 text-sm font-semibold px-8 py-3 border border-[#e8e4dc] text-[#666] rounded-xl hover:border-[#0d0d0d] hover:text-[#111] transition-all bg-transparent cursor-pointer disabled:opacity-50"
              @click="loadMore"
            >
              <svg v-if="loadingMore" class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              {{ loadingMore ? 'Carregando...' : 'Carregar mais' }}
            </button>
          </div>
        </template>
      </template>
    </main>

    <!-- Join by code modal -->
    <Transition name="modal-fade">
      <div v-if="showJoinModal" class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/45 backdrop-blur-sm" @click="showJoinModal = false"></div>

        <div class="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#e8e4dc]">
          <div class="p-6 sm:p-7">
            <div class="w-11 h-11 rounded-2xl bg-[#f0faf7] flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#079272" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            </div>

            <h3 class="text-[1.1rem] font-bold text-[#111] mb-1">Entrar com código</h3>
            <p class="text-sm text-[#666] mb-5">Cole o código de convite de 8 caracteres.</p>

            <input
              v-model="joinCode"
              type="text"
              placeholder="Ex: XKCD7821"
              maxlength="8"
              class="w-full h-12 px-4 bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[1.1rem] font-bold tracking-[0.2em] text-center uppercase text-[#111] outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all"
              @keyup.enter="handleJoinByCode"
            />

            <p v-if="joinCodeError" class="mt-2 text-sm text-red-500">{{ joinCodeError }}</p>
            <p v-if="joinCodeSuccess" class="mt-2 text-sm text-[#079272] font-semibold">{{ joinCodeSuccess }}</p>

            <div class="mt-5 flex gap-3">
              <button
                class="flex-1 h-11 px-4 rounded-xl border border-[#e8e4dc] text-[#666] font-semibold bg-white hover:bg-[#fafaf9] transition-colors cursor-pointer"
                @click="showJoinModal = false; joinCode = ''; joinCodeError = null"
              >
                Cancelar
              </button>
              <button
                :disabled="!joinCode.trim() || joiningCode"
                class="flex-1 h-11 px-4 rounded-xl bg-[#079272] text-white font-semibold hover:bg-[#068060] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-none flex items-center justify-center gap-2"
                @click="handleJoinByCode"
              >
                <svg v-if="joiningCode" class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                {{ joiningCode ? 'Entrando...' : 'Entrar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
