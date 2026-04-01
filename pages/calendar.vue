<template>
  <div class="min-h-screen bg-[#ffffff] w-screen">
    <div class="max-w-[1180px] mx-auto px-4 md:px-8 py-10 mt-4">
      <!-- Header -->
      <div class="mb-8 flex items-center justify-center mt-4">
        <div class="flex flex-col gap-3 mb-1 text-center">
          <h1 class="text-[1.5rem] font-bold text-[#111] tracking-[-0.025em]">
            Calendário de Oportunidades
          </h1>
          <p class="text-[0.85rem] text-[#999]">
            Clique em qualquer dia marcado para ver os detalhes
          </p>
        </div>
      </div>

      <!-- Main grid -->
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        <!-- Calendar card -->
        <div class="bg-white border border-[#e8e4dc] rounded-2xl shadow-sm overflow-hidden">
          <div v-if="loading" class="flex items-center justify-center py-24 gap-3 text-[#aaa] text-sm">
            <svg class="animate-spin w-5 h-5 text-[#079272]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Carregando oportunidades...
          </div>

          <div v-else-if="error" class="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
            <div class="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
              <svg class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p class="text-[0.85rem] text-[#666]">{{ error }}</p>
            <button
              class="text-sm font-semibold px-5 py-2 bg-[#0d0d0d] text-white rounded-xl hover:bg-[#079272] transition-colors border-none cursor-pointer"
              @click="fetchPosts"
            >
              Tentar novamente
            </button>
          </div>

          <ClientOnly v-else>
            <VCalendar
              :attributes="attributes"
              expanded
              :first-day-of-week="1"
              locale="pt-BR"
              class="seconecta-calendar"
              @dayclick="handleDayClick"
            />
          </ClientOnly>

          <div class="border-t border-[#f0ece5] px-6 py-4">
            <p class="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[#bbb] mb-3">
              Legenda
            </p>
            <div class="flex flex-wrap gap-x-4 gap-y-2">
              <div
                v-for="item in CATEGORY_ORDER"
                :key="item.key"
                class="flex items-center gap-1.5"
              >
                <span
                  class="w-2 h-2 rounded-full flex-shrink-0"
                  :style="{ background: CATEGORY_MAP[item.key].color }"
                ></span>
                <span class="text-[0.7rem] text-[#888]">
                  {{ CATEGORY_MAP[item.key].label }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming sidebar -->
        <div class="bg-white border border-[#e8e4dc] rounded-2xl shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-[#f0ece5]">
            <h2 class="text-[0.88rem] font-bold text-[#111]">Próximos 30 dias</h2>
            <p class="text-[0.7rem] text-[#aaa] mt-0.5">Deadlines se aproximando</p>
          </div>

          <div v-if="loading" class="p-5 flex justify-center">
            <svg class="animate-spin w-5 h-5 text-[#079272]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>

          <div
            v-else-if="(upcomingPosts?.length ?? 0) === 0"
            class="px-5 py-10 text-center text-[0.8rem] text-[#bbb]"
          >
            Nenhum deadline nos próximos 30 dias
          </div>

          <div v-else class="divide-y divide-[#f7f5f0]">
            <button
              v-for="post in upcomingPosts"
              :key="post.id ?? post.slug"
              class="w-full px-5 py-3.5 flex items-start gap-3 hover:bg-[#fafaf9] transition-colors cursor-pointer text-left group border-none bg-transparent"
              @click="openPost(post)"
            >
              <div class="flex-shrink-0 w-11 text-center">
                <div class="text-[0.62rem] font-semibold uppercase text-[#bbb]">
                  {{ MONTHS_PT[new Date(post.deadline).getMonth()].slice(0, 3) }}
                </div>
                <div class="text-[1.15rem] font-bold text-[#111] leading-none">
                  {{ new Date(post.deadline).getDate() }}
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    class="text-[0.6rem] font-semibold px-2 py-0.5 rounded-full"
                    :style="{ background: colorFor(post) + '18', color: colorFor(post) }"
                  >
                    {{ labelFor(post) }}
                  </span>

                  <span class="text-[0.68rem]" :class="daysLeft(post.deadline).cls">
                    {{ daysLeft(post.deadline).text }}
                  </span>
                </div>

                <p class="text-[0.82rem] font-semibold text-[#111] group-hover:text-[#079272] transition-colors line-clamp-1 mb-1">
                  {{ post.title }}
                </p>

                <p v-if="post.excerpt" class="text-[0.7rem] text-[#888] line-clamp-2">
                  {{ post.excerpt }}
                </p>
              </div>

              <svg class="w-4 h-4 text-[#ddd] group-hover:text-[#079272] transition-colors flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div
            v-if="!loading && (posts?.length ?? 0) > 0"
            class="border-t border-[#f7f5f0] px-5 py-3 text-center"
          >
            <p class="text-[0.65rem] text-[#ccc]">
              {{ posts?.length ?? 0 }} oportunidade{{ (posts?.length ?? 0) !== 1 ? 's' : '' }} com deadline
            </p>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="mt-12">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-[1.2rem] font-bold text-[#111] tracking-[-0.02em]">
              Recomendado para você
            </h2>
            <p class="text-[0.75rem] text-[#aaa] mt-1">
              Personalizado para o seu perfil.
            </p>
          </div>

          <div class="flex gap-2">
            <button
              @click="scrollCarousel(-1)"
              class="w-8 h-8 rounded-full border border-[#e8e4dc] bg-white flex items-center justify-center hover:border-[#079272] hover:text-[#079272] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="carouselIndex === 0 || recommendedLoading"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <button
              @click="scrollCarousel(1)"
              class="w-8 h-8 rounded-full border border-[#e8e4dc] bg-white flex items-center justify-center hover:border-[#079272] hover:text-[#079272] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="recommendedLoading || carouselIndex >= Math.max(0, recommendedDisplayPosts.length - carouselItemsPerView)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="recommendedLoading" class="text-center py-8 text-[#aaa]">
          <svg class="animate-spin w-5 h-5 inline-block mr-2 text-[#079272]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Carregando recomendações...
        </div>

        <div v-else-if="!authReady" class="text-center py-8 text-[#aaa]">
          Carregando conta...
        </div>

        <div v-else-if="isAuthenticated && !isLinked" class="text-center py-8 text-[#aaa]">
          Conecte seu WhatsApp na
          <NuxtLink to="/profile" class="text-[#079272] font-semibold hover:underline">página de perfil</NuxtLink>
          para receber recomendações personalizadas.
        </div>

        <div v-else-if="recommendedDisplayPosts.length > 0" class="relative overflow-hidden">
          <div
            class="flex gap-4 transition-transform duration-300 ease-out"
            :style="{ transform: `translateX(-${carouselIndex * (carouselItemWidth + 16)}px)` }"
          >
            <div
              v-for="post in recommendedDisplayPosts"
              :key="post.id ?? post.slug"
              class="flex-shrink-0 w-full sm:w-[280px] md:w-[320px] bg-white border border-[#e8e4dc] rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
              @click="openPost(post)"
            >
              <div v-if="post.cover_url" class="h-40 overflow-hidden">
                <img
                  :src="post.cover_url"
                  :alt="post.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div class="p-4">
                <div class="flex items-center justify-between mb-2">
                  <span
                    v-if="post.similarity"
                    class="text-[0.6rem] font-semibold px-2 py-0.5 rounded-full bg-[#f0faf7] text-[#079272] border border-[#c5e8df]"
                  >
                    {{ Math.round(post.similarity * 100) }}% match
                  </span>

                  <div class="flex gap-1">
                    <span
                      v-for="tag in (post.tags || []).slice(0, 2)"
                      :key="tag"
                      class="text-[0.55rem] px-1.5 py-0.5 bg-[#f7f5f0] text-[#888] rounded-full"
                    >
                      #{{ tag }}
                    </span>
                  </div>
                </div>

                <h3 class="text-[0.9rem] font-bold text-[#111] line-clamp-2 mb-1">
                  {{ post.title }}
                </h3>

                <p v-if="post.excerpt" class="text-[0.7rem] text-[#666] line-clamp-3 mb-2">
                  {{ post.excerpt }}
                </p>

                <div class="flex items-center justify-between text-[0.65rem] text-[#aaa]">
                  <span>Clique para ler</span>
                  <svg class="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="isAuthenticated" class="text-center py-8 text-[#aaa]">
          Nenhuma recomendação disponível agora.
        </div>

        <div v-else class="text-center py-8 text-[#aaa]">
          Faça
          <NuxtLink to="/login" class="text-[#079272] font-semibold hover:underline">login</NuxtLink>
          para ver recomendações personalizadas.
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Transition name="modal-fade">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        @click.self="showModal = false"
      >
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showModal = false"></div>

        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
          <div class="px-6 pt-6 pb-4 flex items-start justify-between">
            <div>
              <p class="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#aaa] mb-0.5">
                Oportunidades
              </p>
              <h2 class="text-[1.05rem] font-bold text-[#111] capitalize">
                {{ selectedDayLabel }}
              </h2>
            </div>

            <button
              class="w-8 h-8 flex items-center justify-center rounded-xl border border-[#e8e4dc] text-[#aaa] hover:text-[#111] hover:border-[#0d0d0d] transition-all border-solid cursor-pointer bg-white flex-shrink-0"
              @click="showModal = false"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="h-px bg-[#f0ece5] mx-6"></div>

          <div class="px-6 py-4 max-h-[60vh] overflow-y-auto">
            <div v-if="selectedPosts.length === 0" class="flex flex-col items-center py-8 gap-2 text-center">
              <div class="w-10 h-10 rounded-xl bg-[#f7f5f0] flex items-center justify-center">
                <svg class="w-5 h-5 text-[#ccc]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <p class="text-[0.82rem] text-[#bbb]">
                Nenhuma oportunidade encontrada neste dia
              </p>
            </div>

            <div v-else class="flex flex-col gap-3">
              <button
                v-for="post in selectedPosts"
                :key="post.id ?? post.slug"
                class="w-full text-left p-4 rounded-xl border border-[#e8e4dc] hover:border-[#079272]/40 hover:bg-[#fafaf9] transition-all cursor-pointer group bg-white"
                @click="openPost(post)"
              >
                <div class="flex items-center gap-2 mb-2">
                  <span
                    class="text-[0.62rem] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    :style="{ background: colorFor(post) + '18', color: colorFor(post) }"
                  >
                    {{ labelFor(post) }}
                  </span>

                  <span v-if="post.modality" class="text-[0.65rem] text-[#999]">
                    <i :class="`fas ${MODALITY_ICON[post.modality] || ''}`" class="mr-1"></i>
                    {{ post.modality }}
                  </span>

                  <span v-if="post.country" class="text-[0.65rem] text-[#bbb] ml-auto">
                    {{ post.country }}
                  </span>
                </div>

                <p class="text-[0.88rem] font-semibold text-[#111] group-hover:text-[#079272] transition-colors leading-snug mb-2">
                  {{ post.title }}
                </p>

                <p v-if="post.excerpt" class="text-[0.75rem] text-[#888] line-clamp-2 mb-3">
                  {{ post.excerpt }}
                </p>

                <div class="flex items-center justify-between pt-2 border-t border-[#f5f3f0]">
                  <div v-if="post.author_name" class="flex items-center gap-1.5">
                    <img
                      v-if="post.author_profile_picture_url"
                      :src="post.author_profile_picture_url"
                      :alt="post.author_name"
                      class="w-5 h-5 rounded-full object-cover"
                    />
                    <div
                      v-else
                      class="w-5 h-5 rounded-full bg-gradient-to-br from-[#079272] to-[#2464E8] flex items-center justify-center text-white text-[0.5rem] font-bold flex-shrink-0"
                    >
                      {{ post.author_name.charAt(0).toUpperCase() }}
                    </div>
                    <span class="text-[0.68rem] text-[#aaa]">{{ post.author_name }}</span>
                  </div>

                  <div v-else></div>

                  <div class="flex items-center gap-1 text-[0.68rem]" :class="daysLeft(post.deadline).cls">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {{ daysLeft(post.deadline).text }}
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div class="px-6 pb-5 pt-3">
            <button
              class="w-full h-10 flex items-center justify-center text-[0.82rem] font-semibold bg-[#0d0d0d] text-white rounded-xl border-none cursor-pointer hover:bg-[#079272] transition-colors"
              @click="showModal = false"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useAxios } from '~/composables/useAxios'
import { useAuth } from '~/composables/useAuth'
import { useRouter } from 'nuxt/app'

useSeoMeta({ title: 'Calendário de Oportunidades — seConecta' })

const { get, post: apiPost } = useAxios()
const { currentUser, isAuthenticated } = useAuth()
const router = useRouter()

const posts = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const recommendedPosts = ref<any[]>([])
const recommendedLoading = ref(false)
const recommendedError = ref<string | null>(null)

const carouselIndex = ref(0)
const carouselItemsPerView = ref(3)
const carouselItemWidth = ref(320)

const selectedDay = ref<Date | null>(null)
const showModal = ref(false)

const mounted = ref(false)
const authReady = ref(false)

const isLinked = computed(() => currentUser.value?.linked ?? false)

const MODALITY_ICON: Record<string, string> = {
  online: 'fa-globe',
  presencial: 'fa-location-dot',
  híbrido: 'fa-arrows-spin',
}

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const CATEGORY_ORDER = [
  { key: 'olimpiadas' },
  { key: 'bolsas' },
  { key: 'estagios' },
  { key: 'acampamentos' },
  { key: 'eventos' },
  { key: 'pesquisa' },
  { key: 'workshops' },
  { key: 'oportunidades' },
  { key: 'outros' },
] as const

const CATEGORY_MAP: Record<string, { label: string; color: string; hints: string[] }> = {
  olimpiadas: {
    label: 'Olimpíadas',
    color: '#079272',
    hints: ['olimpiada', 'olimpíada', 'obmep', 'obf', 'obo', 'obq', 'competição', 'competicao', 'olympiad'],
  },
  bolsas: {
    label: 'Bolsas',
    color: '#2464E8',
    hints: ['bolsa', 'scholarship', 'grant', 'auxilio', 'auxílio', 'financiamento'],
  },
  estagios: {
    label: 'Estágios',
    color: '#8B5CF6',
    hints: ['estagio', 'estágio', 'internship', 'trainee'],
  },
  acampamentos: {
    label: 'Summer Cams',
    color: '#F59E0B',
    hints: ['camp', 'summer camp', 'acampamento', 'verao', 'verão', 'ferias', 'férias'],
  },
  eventos: {
    label: 'Eventos',
    color: '#EC4899',
    hints: ['evento', 'conference', 'conferencia', 'conferência', 'seminario', 'seminário', 'palestra', 'summit', 'meetup', 'feira'],
  },
  pesquisa: {
    label: 'Pesquisa',
    color: '#059669',
    hints: ['pesquisa', 'research', 'laboratorio', 'laboratório', 'iniciacao cientifica', 'iniciação científica', 'ic'],
  },
  workshops: {
    label: 'Workshops',
    color: '#0EA5E9',
    hints: ['workshop', 'oficina', 'curso', 'bootcamp', 'treinamento', 'training'],
  },
  oportunidades: {
    label: 'Oportunidades',
    color: '#111827',
    hints: ['oportunidade', 'opportunity', 'vaga', 'edital', 'open call'],
  },
  outros: {
    label: 'Outros',
    color: '#6B7280',
    hints: [],
  },
}

function safeArray<T>(value: any): T[] {
  return Array.isArray(value) ? value : []
}

function normalizeText(input: any) {
  return String(input ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function getPostSearchBlob(post: any) {
  return normalizeText([
    ...(safeArray<string>(post?.tags) || []),
    post?.post_type,
    post?.title,
    post?.excerpt,
  ].join(' '))
}

function classifyPost(post: any) {
  const blob = getPostSearchBlob(post)

  for (const key of CATEGORY_ORDER.map(c => c.key)) {
    const cat = CATEGORY_MAP[key]
    if (cat.hints.some(h => blob.includes(normalizeText(h)))) {
      return key
    }
  }

  return 'outros'
}

function colorFor(post: any) {
  return CATEGORY_MAP[classifyPost(post)]?.color ?? CATEGORY_MAP.outros.color
}

function labelFor(post: any) {
  return CATEGORY_MAP[classifyPost(post)]?.label ?? 'Outros'
}

function postHasTag(post: any, tagKey: string) {
  const tags = safeArray<string>(post?.tags).map(normalizeText)
  return tags.includes(tagKey)
}

async function fetchPosts() {
  loading.value = true
  error.value = null

  try {
    const res = await get('/posts/', { params: { limit: 300, approved: true } })
    const all = safeArray<any>(res.data?.data ?? res.data ?? [])
    posts.value = all.filter((p: any) => !!p?.deadline)
  } catch (err) {
    console.error('Error fetching posts:', err)
    error.value = 'Não foi possível carregar as oportunidades.'
    posts.value = []
  } finally {
    loading.value = false
  }
}

async function fetchRecommended() {
  if (!authReady.value || !isAuthenticated.value || !isLinked.value) {
    recommendedPosts.value = []
    recommendedError.value = null
    recommendedLoading.value = false
    return
  }

  recommendedLoading.value = true
  recommendedError.value = null

  try {
    let data: any[] = []

    try {
      const res = await apiPost('/posts/get-feed-posts', {})
      data = safeArray<any>(res.data?.data ?? res.data ?? [])
    } catch (err: any) {
      if (err?.response?.status === 405) {
        const res = await get('/posts/get-feed-posts')
        data = safeArray<any>(res.data?.data ?? res.data ?? [])
      } else {
        throw err
      }
    }

    recommendedPosts.value = data
    carouselIndex.value = 0
  } catch (err: any) {
    console.error('Error fetching recommendations:', err)
    recommendedPosts.value = []

    const status = err?.response?.status
    if (status === 401 || status === 429) {
      recommendedError.value = null
    } else {
      recommendedError.value = 'Não foi possível carregar recomendações.'
    }
  } finally {
    recommendedLoading.value = false
  }
}

const recommendedDisplayPosts = computed<any[]>(() => {
  return safeArray<any>(recommendedPosts.value)
})

const attributes = computed(() =>
  safeArray<any>(posts.value).map((post, i) => ({
    key: `post-${i}`,
    dates: new Date(post.deadline),
    dot: {
      color: colorFor(post),
      style: { backgroundColor: colorFor(post) },
    },
    popover: {
      label: `${labelFor(post)} · ${post.title}`,
    },
    customData: {
      ...post,
      category: classifyPost(post),
      categoryLabel: labelFor(post),
      categoryColor: colorFor(post),
    },
  }))
)

function handleDayClick(day: any) {
  selectedDay.value = day?.date ? new Date(day.date) : null
  showModal.value = !!selectedDay.value
}

const selectedPosts = computed(() => {
  if (!selectedDay.value) return []
  const key = toKey(selectedDay.value)
  return safeArray<any>(posts.value).filter(p => toKey(new Date(p.deadline)) === key)
})

const upcomingPosts = computed<any[]>(() => {
  const source = safeArray<any>(posts.value)
  const now = Date.now()
  const limit = now + 30 * 86_400_000

  return source
    .filter(p => {
      const t = new Date(p.deadline).getTime()
      return t >= now && t <= limit
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 10)
})

function toKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function daysLeft(iso: string): { text: string; cls: string } {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)

  if (diff < 0) return { text: 'Encerrado', cls: 'text-[#bbb]' }
  if (diff === 0) return { text: 'Hoje!', cls: 'text-red-500 font-bold' }
  if (diff === 1) return { text: 'Amanhã', cls: 'text-orange-500 font-semibold' }
  if (diff <= 7) return { text: `${diff} dias`, cls: 'text-orange-400 font-medium' }
  return { text: `${diff} dias`, cls: 'text-[#888]' }
}

function openPost(post: any) {
  showModal.value = false
  router.push(`/article/${post.slug || post.id}`)
}

const selectedDayLabel = computed(() =>
  selectedDay.value
    ? selectedDay.value.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      })
    : ''
)

function scrollCarousel(direction: number) {
  const maxIndex = Math.max(0, recommendedDisplayPosts.value.length - carouselItemsPerView.value)
  const newIndex = carouselIndex.value + direction

  if (newIndex >= 0 && newIndex <= maxIndex) {
    carouselIndex.value = newIndex
  }
}

function updateCarouselSettings() {
  if (!import.meta.client) return

  const width = window.innerWidth
  if (width < 640) {
    carouselItemsPerView.value = 1
    carouselItemWidth.value = width - 32
  } else if (width < 1024) {
    carouselItemsPerView.value = 2
    carouselItemWidth.value = 280
  } else {
    carouselItemsPerView.value = 3
    carouselItemWidth.value = 320
  }
}

watch(recommendedPosts, () => {
  const maxIndex = Math.max(0, recommendedDisplayPosts.value.length - carouselItemsPerView.value)
  if (carouselIndex.value > maxIndex) {
    carouselIndex.value = maxIndex
  }
})

onMounted(() => {
  mounted.value = true
  authReady.value = true

  fetchPosts()
  updateCarouselSettings()
  window.addEventListener('resize', updateCarouselSettings)
})

watch([isAuthenticated, isLinked, authReady], () => {
  if (!mounted.value || !authReady.value) return
  void fetchRecommended()
}, { immediate: true })

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('resize', updateCarouselSettings)
  }
})
</script>

<style scoped>
.seconecta-calendar {
  --vc-font-family: 'Outfit', sans-serif;
  --vc-rounded-full: 10px;
  border: none !important;
  width: 100% !important;
}

.seconecta-calendar .vc-header { padding: 16px 20px 8px; }
.seconecta-calendar .vc-title { font-weight: 700; font-size: 0.95rem; color: #111; }
.seconecta-calendar .vc-arrow { border-radius: 8px; color: #666; }
.seconecta-calendar .vc-arrow:hover { background: #f0ece5; color: #111; }
.seconecta-calendar .vc-weekday {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: #bbb;
  text-transform: uppercase;
}
.seconecta-calendar .vc-day-content {
  font-size: 0.82rem;
  font-weight: 500;
  color: #555;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  transition: background 0.15s, color 0.15s;
}
.seconecta-calendar .vc-day-content:hover {
  background: #f0faf7 !important;
  color: #079272 !important;
}
.seconecta-calendar .vc-day-content.is-today {
  background: #079272 !important;
  color: #fff !important;
  font-weight: 700;
}
.seconecta-calendar .vc-highlights .vc-highlight { border-radius: 9px; }
.seconecta-calendar .vc-day { padding: 4px 2px; }
.seconecta-calendar .vc-dots { gap: 2px; margin-top: 2px; }
.seconecta-calendar .vc-dot { width: 5px; height: 5px; border-radius: 50%; }
.seconecta-calendar .vc-nav-item.is-active {
  background: #079272 !important;
  color: #fff !important;
  border-radius: 8px;
}
.seconecta-calendar .vc-nav-item:hover {
  background: #f0faf7;
  color: #079272;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-active .relative,
.modal-fade-leave-active .relative {
  transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease;
}
.modal-fade-enter-from { opacity: 0; }
.modal-fade-enter-from .relative {
  transform: translateY(16px) scale(0.98);
  opacity: 0;
}
.modal-fade-leave-to { opacity: 0; }

.transition-transform {
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}
</style>