
<script setup lang="ts">
useSeoMeta({ title: 'Calendário de Oportunidades — seConecta' })
definePageMeta({ middleware: 'auth' })

const COLOR_MAP: Record<string, string> = {
  bolsa:     '#2464E8',
  concurso:  '#F59E0B',
  olimpiada: '#079272',
  estagio:   '#8B5CF6',
  evento:    '#EC4899',
  workshop:  '#059669',
  default:   '#079272',
}

const TYPE_LABELS: Record<string, string> = {
  bolsa:     'Bolsa',
  concurso:  'Concurso',
  olimpiada: 'Olimpíada',
  estagio:   'Estágio',
  evento:    'Evento',
  workshop:  'Workshop',
}

const MODALITY_ICON: Record<string, string> = {
  online:     'fa-globe',
  presencial: 'fa-location-dot',
  híbrido:    'fa-arrows-spin',
}

const MONTHS_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

// ─── Estado ─────────────────────────────────────────────────────
const { get }  = useAxios()
const router   = useRouter()

const posts    = ref<any[]>([])
const loading  = ref(true)
const error    = ref<string | null>(null)
const today    = new Date()

const selectedDay = ref<Date | null>(null)
const showModal   = ref(false)

// ─── Buscar posts com deadline ──────────────────────────────────
async function fetchPosts() {
  loading.value = true
  error.value   = null
 
  try {
    const res  = await get('/posts/', { params: { limit: 300, approved: true } })
    const all  = (res.data.data ?? res.data ?? []) as any[]
    posts.value = all.filter((p: any) => !!p.deadline)
  } catch {
    error.value = 'Não foi possível carregar as oportunidades.'
  } finally {
    loading.value = false
  }
}
onMounted(fetchPosts)

// ─── VCalendar: atributos (dots por deadline) ───────────────────
const attributes = computed(() =>
  posts.value.map((post, i) => ({
    key: `post-${i}`,
    dates: new Date(post.deadline),
    dot: {
      color: 'green', // v-calendar built-in color token
      style: { backgroundColor: colorFor(post.post_type) },
    },
    popover: { label: post.title },
    customData: post,
  }))
)

// ─── Clique no dia ──────────────────────────────────────────────
function handleDayClick(day: any) {
  selectedDay.value = day.date
  showModal.value   = true
}

// ─── Posts do dia selecionado ───────────────────────────────────
const selectedPosts = computed<any[]>(() => {
  if (!selectedDay.value) return []
  const key = toKey(selectedDay.value)
  return posts.value.filter(p => toKey(new Date(p.deadline)) === key)
})

// ─── Próximos 30 dias (sidebar) ─────────────────────────────────
const upcomingPosts = computed<any[]>(() => {
  const now   = Date.now()
  const limit = now + 30 * 86_400_000
  return posts.value
    .filter(p => {
      const t = new Date(p.deadline).getTime()
      return t >= now && t <= limit
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 10)
})

// ─── Helpers ────────────────────────────────────────────────────
function toKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function colorFor(type?: string) {
  return COLOR_MAP[type?.toLowerCase() ?? ''] ?? COLOR_MAP.default
}

function labelFor(type?: string) {
  return TYPE_LABELS[type?.toLowerCase() ?? ''] ?? type ?? '—'
}

function fmtDeadline(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function daysLeft(iso: string): { text: string; cls: string } {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (diff < 0)  return { text: 'Encerrado',   cls: 'text-[#bbb]' }
  if (diff === 0) return { text: 'Hoje!',        cls: 'text-red-500 font-bold' }
  if (diff === 1) return { text: 'Amanhã',       cls: 'text-orange-500 font-semibold' }
  if (diff <= 7)  return { text: `${diff} dias`, cls: 'text-orange-400 font-medium' }
  return              { text: `${diff} dias`,    cls: 'text-[#888]' }
}

function openPost(post: any) {
  showModal.value = false
  router.push(`/article/${post.slug || post.id}`)
}

const selectedDayLabel = computed(() =>
  selectedDay.value
    ? selectedDay.value.toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long',
      })
    : ''
)
</script>

<template>

 
  <div class="min-h-screen bg-[#ffffff] w-screen">
    <div class="max-w-[1180px] mx-auto px-4 md:px-8 py-10 mt-4">

       <div class="mb-8 flex items-center justify-center mt-4">
          
          <div class="flex flex-col gap-3 mb-1">
            <h1 class="text-[1.5rem] font-bold text-[#111] tracking-[-0.025em]">
              Calendário de Oportunidades
            </h1>
            <p class="text-[0.85rem] text-[#999]">
              Clique em qualquer dia marcado para ver os detalhes
            </p>
          </div>
          
      </div>


      <div class="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        <div class="bg-white border border-[#e8e4dc] rounded-2xl shadow-sm overflow-hidden">

          <div v-if="loading" class="flex items-center justify-center py-24 gap-3 text-[#aaa] text-sm">
            <svg class="animate-spin w-5 h-5 text-[#079272]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Carregando oportunidades...
          </div>

          <!-- Error sstate -->
          <div v-else-if="error" class="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
            <div class="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
              <svg class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p class="text-[0.85rem] text-[#666]">{{ error }}</p>
            <button class="text-sm font-semibold px-5 py-2 bg-[#0d0d0d] text-white rounded-xl hover:bg-[#079272] transition-colors border-none cursor-pointer"
              @click="fetchPosts">Tentar novamente</button>
          </div>

          <!-- VCalendar -->
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

          <!-- Legenda de tipos -->
          <div class="border-t border-[#f0ece5] px-6 py-4">
            <p class="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[#bbb] mb-3">Legenda</p>
            <div class="flex flex-wrap gap-x-4 gap-y-2">
              <div v-for="(color, type) in COLOR_MAP" :key="type" v-show="type !== 'default'"
                class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full flex-shrink-0" :style="{ background: color }"></span>
                <span class="text-[0.7rem] text-[#888]">{{ labelFor(type) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Sidebar: Próximos 30 dias ──────────────────────── -->
        <div class="bg-white border border-[#e8e4dc] rounded-2xl shadow-sm overflow-hidden">

          <div class="px-5 py-4 border-b border-[#f0ece5]">
            <h2 class="text-[0.88rem] font-bold text-[#111]">Próximos 30 dias</h2>
            <p class="text-[0.7rem] text-[#aaa] mt-0.5">Deadlines se aproximando</p>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="p-5 flex justify-center">
            <svg class="animate-spin w-5 h-5 text-[#079272]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          </div>

          <!-- Vazio -->
          <div v-else-if="upcomingPosts.length === 0"
            class="px-5 py-10 text-center text-[0.8rem] text-[#bbb]">
            Nenhum deadline nos próximos 30 dias
          </div>

          <!-- Lista -->
          <div v-else class="divide-y divide-[#f7f5f0]">
            <button
              v-for="post in upcomingPosts"
              :key="post.id ?? post.slug"
              class="w-full px-5 py-3.5 flex items-start gap-3 hover:bg-[#fafaf9] transition-colors cursor-pointer text-left group border-none bg-transparent"
              @click="openPost(post)"
            >
              <!-- Data pill -->
              <div class="flex-shrink-0 w-11 text-center">
                <div class="text-[0.62rem] font-semibold uppercase text-[#bbb]">
                  {{ MONTHS_PT[new Date(post.deadline).getMonth()].slice(0, 3) }}
                </div>
                <div class="text-[1.15rem] font-bold text-[#111] leading-none">
                  {{ new Date(post.deadline).getDate() }}
                </div>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="text-[0.82rem] font-semibold text-[#111] group-hover:text-[#079272] transition-colors line-clamp-1 mb-1">
                  {{ post.title }}
                </p>
                <div class="flex items-center gap-2 flex-wrap">
                  <!-- Tipo -->
                  <span v-if="post.post_type"
                    class="text-[0.6rem] font-semibold px-2 py-0.5 rounded-full"
                    :style="{ background: colorFor(post.post_type) + '18', color: colorFor(post.post_type) }">
                    {{ labelFor(post.post_type) }}
                  </span>
                  <!-- Dias restantes -->
                  <span class="text-[0.68rem]" :class="daysLeft(post.deadline).cls">
                    {{ daysLeft(post.deadline).text }}
                  </span>
                </div>
              </div>

              <!-- Seta -->
              <svg class="w-4 h-4 text-[#ddd] group-hover:text-[#079272] transition-colors flex-shrink-0 mt-0.5"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          <!-- Footer stats -->
          <div v-if="!loading && posts.length > 0"
            class="border-t border-[#f7f5f0] px-5 py-3 text-center">
            <p class="text-[0.65rem] text-[#ccc]">
              {{ posts.length }} oportunidade{{ posts.length !== 1 ? 's' : '' }} com deadline
            </p>
          </div>
        </div>

      </div>
    </div>

    <!-- ─────────────────────────────────────────────────────────
         Modal — eventos do dia selecionado
    ──────────────────────────────────────────────────────────── -->
    <Transition name="modal-fade">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        @click.self="showModal = false"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showModal = false"></div>

        <!-- Card -->
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden">

          <!-- Header -->
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
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Divider -->
          <div class="h-px bg-[#f0ece5] mx-6"></div>

          <!-- Content -->
          <div class="px-6 py-4 max-h-[60vh] overflow-y-auto">

            <!-- Vazio -->
            <div v-if="selectedPosts.length === 0"
              class="flex flex-col items-center py-8 gap-2 text-center">
              <div class="w-10 h-10 rounded-xl bg-[#f7f5f0] flex items-center justify-center">
                <svg class="w-5 h-5 text-[#ccc]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <p class="text-[0.82rem] text-[#bbb]">Nenhuma oportunidade neste dia</p>
            </div>

            <!-- Lista de posts -->
            <div v-else class="flex flex-col gap-3">
              <button
                v-for="post in selectedPosts"
                :key="post.id ?? post.slug"
                class="w-full text-left p-4 rounded-xl border border-[#e8e4dc] hover:border-[#079272]/40 hover:bg-[#fafaf9] transition-all cursor-pointer group bg-white"
                @click="openPost(post)"
              >
                <!-- Tipo + Modalidade -->
                <div class="flex items-center gap-2 mb-2">
                  <span
                    class="text-[0.62rem] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    :style="{ background: colorFor(post.post_type) + '18', color: colorFor(post.post_type) }"
                  >
                    {{ labelFor(post.post_type) }}
                  </span>
                  <span v-if="post.modality" class="text-[0.65rem] text-[#999]">
                    <i :class="`fas ${MODALITY_ICON[post.modality]}`" class="mr-1"></i>
                    {{ post.modality }}
                  </span>
                  <span v-if="post.country" class="text-[0.65rem] text-[#bbb] ml-auto">
                    {{ post.country }}
                  </span>
                </div>

                <!-- Título -->
                <p class="text-[0.88rem] font-semibold text-[#111] group-hover:text-[#079272] transition-colors leading-snug mb-2">
                  {{ post.title }}
                </p>

                <!-- Excerpt -->
                <p v-if="post.excerpt" class="text-[0.75rem] text-[#888] line-clamp-2 mb-3">
                  {{ post.excerpt }}
                </p>

                <!-- Footer: autor + deadline -->
                <div class="flex items-center justify-between pt-2 border-t border-[#f5f3f0]">

                  <!-- Autor -->
                  <div v-if="post.author_name" class="flex items-center gap-1.5">
                    <img
                      v-if="post.author_profile_picture_url"
                      :src="post.author_profile_picture_url"
                      :alt="post.author_name"
                      class="w-5 h-5 rounded-full object-cover"
                    />
                    <div v-else
                      class="w-5 h-5 rounded-full bg-gradient-to-br from-[#079272] to-[#2464E8] flex items-center justify-center text-white text-[0.5rem] font-bold flex-shrink-0">
                      {{ post.author_name.charAt(0).toUpperCase() }}
                    </div>
                    <span class="text-[0.68rem] text-[#aaa]">{{ post.author_name }}</span>
                  </div>
                  <div v-else></div>

                  <!-- Deadline -->
                  <div class="flex items-center gap-1 text-[0.68rem]" :class="daysLeft(post.deadline).cls">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {{ daysLeft(post.deadline).text }}
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- Footer do modal -->
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

<style>
/* ── VCalendar overrides — tema seConecta ────────────────────── */
.seconecta-calendar {
  --vc-font-family: 'Outfit', sans-serif;
  --vc-rounded-full: 10px;
  border: none !important;
  width: 100% !important;
}
.seconecta-calendar .vc-header { padding: 16px 20px 8px; }
.seconecta-calendar .vc-title   { font-weight: 700; font-size: 0.95rem; color: #111; }
.seconecta-calendar .vc-arrow   { border-radius: 8px; color: #666; }
.seconecta-calendar .vc-arrow:hover { background: #f0ece5; color: #111; }
.seconecta-calendar .vc-weekday { font-size: 0.65rem; font-weight: 600; letter-spacing: 0.1em; color: #bbb; text-transform: uppercase; }
.seconecta-calendar .vc-day-content {
  font-size: 0.82rem; font-weight: 500; color: #555;
  width: 34px; height: 34px; border-radius: 9px;
  transition: background 0.15s, color 0.15s;
}
.seconecta-calendar .vc-day-content:hover { background: #f0faf7 !important; color: #079272 !important; }
.seconecta-calendar .vc-day-content.is-today {
  background: #079272 !important; color: #fff !important; font-weight: 700;
}
.seconecta-calendar .vc-highlights .vc-highlight { border-radius: 9px; }
.seconecta-calendar .vc-day { padding: 4px 2px; }
.seconecta-calendar .vc-dots { gap: 2px; margin-top: 2px; }
.seconecta-calendar .vc-dot { width: 5px; height: 5px; border-radius: 50%; }
.seconecta-calendar .vc-nav-item.is-active { background: #079272 !important; color: #fff !important; border-radius: 8px; }
.seconecta-calendar .vc-nav-item:hover { background: #f0faf7; color: #079272; }
</style>

<style scoped>
/* ── Modal animation ─────────────────────────────────────────── */
.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-active .relative,
.modal-fade-leave-active .relative { transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease; }
.modal-fade-enter-from { opacity: 0; }
.modal-fade-enter-from .relative { transform: translateY(16px) scale(0.98); opacity: 0; }
.modal-fade-leave-to { opacity: 0; }
</style>