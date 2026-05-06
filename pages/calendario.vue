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

      <!-- Filter Bar -->
      <div class="mb-6 bg-white border border-[#e8e4dc] rounded-2xl p-4 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="text-[0.7rem] font-semibold text-[#888] uppercase tracking-wide">
            Filtrar por categoria:
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="item in CATEGORY_ORDER"
              :key="item.key"
              @click="toggleCategory(item.key)"
              class="px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5"
              :class="activeCategories[item.key] ? 'bg-white text-[#111] border border-[#e8e4dc] shadow-sm' : 'bg-[#f7f5f0] text-[#aaa] border border-transparent opacity-60'"
            >
              <span
                class="w-2 h-2 rounded-full"
                :style="{ background: CATEGORY_MAP[item.key].color, opacity: activeCategories[item.key] ? 1 : 0.4 }"
              ></span>
              {{ CATEGORY_MAP[item.key].label }}
            </button>
          </div>

          <button
            v-if="hasInactiveCategories"
            @click="resetCategories"
            class="text-[0.7rem] font-semibold text-[#079272] hover:text-[#055f48] transition-colors"
          >
            Resetar filtros
          </button>
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
              @click="fetchAllData"
            >
              Tentar novamente
            </button>
          </div>

          <ClientOnly v-else>
            <VCalendar
              :attributes="calendarAttributes"
              :initial-page="currentCalendarPage"
              expanded
              :first-day-of-week="1"
              locale="pt-BR"
              class="seconecta-calendar"
              @dayclick="handleDayClick"
              @did-move="handleCalendarMove"
            />
          </ClientOnly>

          <div
            v-if="calendarLoadingMore && !loading"
            class="border-t border-[#f0ece5] px-6 py-2 text-[0.7rem] text-[#aaa] flex items-center gap-2"
          >
            <svg class="animate-spin w-3.5 h-3.5 text-[#079272]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Carregando datas deste mês...
          </div>

          <div class="border-t border-[#f0ece5] px-6 py-4">
            <p class="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[#bbb] mb-3">
              Legenda (clique para filtrar)
            </p>

            <div class="flex flex-wrap gap-x-4 gap-y-2">
              <div
                v-for="item in CATEGORY_ORDER"
                :key="item.key"
                class="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                @click="toggleCategory(item.key)"
              >
                <span
                  class="w-2 h-2 rounded-full flex-shrink-0"
                  :style="{ background: CATEGORY_MAP[item.key].color, opacity: activeCategories[item.key] ? 1 : 0.3 }"
                ></span>
                <span class="text-[0.7rem]" :class="activeCategories[item.key] ? 'text-[#666]' : 'text-[#bbb] line-through'">
                  {{ CATEGORY_MAP[item.key].label }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming sidebar -->
        <div class="bg-white border border-[#e8e4dc] rounded-2xl shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-[#f0ece5] flex items-center justify-between">
            <div>
              <h2 class="text-[0.88rem] font-bold text-[#111]">Próximas datas</h2>
              <p class="text-[0.7rem] text-[#aaa] mt-0.5">Eventos carregados no calendário</p>
            </div>

            <div class="flex gap-1.5" v-if="allUpcomingEvents.length > SIDEBAR_PAGE_SIZE">
              <button
                @click="sidebarPage--"
                :disabled="sidebarPage === 0"
                class="w-7 h-7 rounded-lg border border-[#e8e4dc] bg-white flex items-center justify-center hover:border-[#079272] hover:text-[#079272] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <button
                @click="sidebarPage++"
                :disabled="sidebarPage >= sidebarMaxPage"
                class="w-7 h-7 rounded-lg border border-[#e8e4dc] bg-white flex items-center justify-center hover:border-[#079272] hover:text-[#079272] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>

          <div v-if="loading" class="p-5 flex justify-center">
            <svg class="animate-spin w-5 h-5 text-[#079272]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>

          <div
            v-else-if="allUpcomingEvents.length === 0"
            class="px-5 py-10 text-center text-[0.8rem] text-[#bbb]"
          >
            Nenhuma data importante carregada ainda
          </div>

          <div v-else class="divide-y divide-[#f7f5f0]">
            <button
              v-for="event in sidebarDisplayEvents"
              :key="event.id"
              class="w-full px-5 py-3.5 flex items-start gap-3 hover:bg-[#fafaf9] transition-colors cursor-pointer text-left group border-none bg-transparent"
              @click="openEvent(event)"
            >
              <div class="flex-shrink-0 w-11 text-center">
                <div class="text-[0.62rem] font-semibold uppercase text-[#bbb]">
                  {{ monthAbbr(event.deadline) }}
                </div>
                <div class="text-[1.15rem] font-bold text-[#111] leading-none">
                  {{ dayNumber(event.deadline) }}
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    class="text-[0.6rem] font-semibold px-2 py-0.5 rounded-full"
                    :style="{ background: event.categoryColor + '18', color: event.categoryColor }"
                  >
                    {{ event.categoryLabel }}
                  </span>

                  <span v-if="event.eventLabel" class="text-[0.6rem] text-[#079272] font-medium line-clamp-1">
                    {{ event.eventLabel }}
                  </span>

                  <span class="text-[0.68rem]" :class="daysLeft(event.deadline).cls">
                    {{ daysLeft(event.deadline).text }}
                  </span>
                </div>

                <p class="text-[0.82rem] font-semibold text-[#111] group-hover:text-[#079272] transition-colors line-clamp-1 mb-1">
                  {{ event.title }}
                </p>

                <p v-if="event.excerpt" class="text-[0.7rem] text-[#888] line-clamp-2">
                  {{ event.excerpt }}
                </p>
              </div>

              <svg class="w-4 h-4 text-[#ddd] group-hover:text-[#079272] transition-colors flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div
            v-if="!loading && allUpcomingEvents.length > 0"
            class="border-t border-[#f7f5f0] px-5 py-3 text-center"
          >
            <p class="text-[0.65rem] text-[#ccc]">
              {{ allUpcomingEvents.length }} evento{{ allUpcomingEvents.length !== 1 ? 's' : '' }} importante{{ allUpcomingEvents.length !== 1 ? 's' : '' }} carregado{{ allUpcomingEvents.length !== 1 ? 's' : '' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Day Modal -->
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
            <div v-if="selectedEvents.length === 0" class="flex flex-col items-center py-8 gap-2 text-center">
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
                v-for="event in selectedEvents"
                :key="event.id"
                class="w-full text-left p-4 rounded-xl border border-[#e8e4dc] hover:border-[#079272]/40 hover:bg-[#fafaf9] transition-all cursor-pointer group bg-white"
                @click="openEvent(event)"
              >
                <div class="flex items-center gap-2 mb-2">
                  <span
                    class="text-[0.62rem] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    :style="{ background: event.categoryColor + '18', color: event.categoryColor }"
                  >
                    {{ event.categoryLabel }}
                  </span>

                  <span v-if="event.eventLabel" class="text-[0.6rem] text-[#079272] font-medium">
                    {{ event.eventLabel }}
                  </span>

                  <span v-if="event.modality" class="text-[0.65rem] text-[#999]">
                    <i :class="`fas ${MODALITY_ICON[event.modality] || ''}`" class="mr-1"></i>
                    {{ event.modality }}
                  </span>

                  <span v-if="event.country" class="text-[0.65rem] text-[#bbb] ml-auto">
                    {{ event.country }}
                  </span>
                </div>

                <p class="text-[0.88rem] font-semibold text-[#111] group-hover:text-[#079272] transition-colors leading-snug mb-2">
                  {{ event.title }}
                </p>

                <p v-if="event.excerpt" class="text-[0.75rem] text-[#888] line-clamp-2 mb-3">
                  {{ event.excerpt }}
                </p>

                <div class="flex items-center justify-between pt-2 border-t border-[#f5f3f0]">
                  <div v-if="event.author_name" class="flex items-center gap-1.5">
                    <div
                      class="w-5 h-5 rounded-full bg-gradient-to-br from-[#079272] to-[#2464E8] flex items-center justify-center text-white text-[0.5rem] font-bold flex-shrink-0"
                    >
                      {{ event.author_name.charAt(0).toUpperCase() }}
                    </div>
                    <span class="text-[0.68rem] text-[#aaa]">{{ event.author_name }}</span>
                  </div>

                  <div v-else></div>

                  <div class="flex items-center gap-1 text-[0.68rem]" :class="daysLeft(event.deadline).cls">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {{ daysLeft(event.deadline).text }}
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
import { computed, onMounted, ref, watch } from 'vue'
import { useAxios } from '~/composables/useAxios'
import { useRouter } from 'nuxt/app'

useSeoMeta({ title: 'Calendário de Oportunidades — seConecta' })

const { get } = useAxios()
const router = useRouter()

const today = new Date()
const currentCalendarPage = {
  month: today.getMonth() + 1,
  year: today.getFullYear(),
}

const opportunities = ref<any[]>([])
const loadedWindowKeys = ref<string[]>([])
const loadingWindowKeys = ref<string[]>([])
const loadedWindows = ref<Array<{ key: string; start: Date; end: Date }>>([])

const loading = ref(true)
const calendarLoadingMore = ref(false)
const error = ref<string | null>(null)

const activeCategories = ref<Record<string, boolean>>({})
const selectedDay = ref<Date | null>(null)
const showModal = ref(false)

const SIDEBAR_PAGE_SIZE = 3
const sidebarPage = ref(0)

const OPPORTUNITY_PAGE_SIZE = 50
const MAX_PAGES_PER_WINDOW = 5

const MODALITY_ICON: Record<string, string> = {
  online: 'fa-globe',
  presencial: 'fa-location-dot',
  híbrido: 'fa-arrows-spin',
  hibrido: 'fa-arrows-spin',
}

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const CATEGORY_ORDER = [
  { key: 'COMPETITION' },
  { key: 'OLYMPIAD' },
  { key: 'MUN' },
  { key: 'SCHOLARSHIP' },
  { key: 'SUMMER_PROGRAM' },
  { key: 'WORKSHOP' },
  { key: 'VOLUNTEERING' },
  { key: 'EXTRACURRICULAR' },
  { key: 'INITIATIVE' },
  { key: 'OTHER' },
] as const

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  COMPETITION: {
    label: 'Competições',
    color: '#F59E0B',
  },
  OLYMPIAD: {
    label: 'Olimpíadas',
    color: '#10B981',
  },
  MUN: {
    label: 'MUN',
    color: '#6366F1',
  },
  SCHOLARSHIP: {
    label: 'Bolsas',
    color: '#8B5CF6',
  },
  SUMMER_PROGRAM: {
    label: 'Programas de verão',
    color: '#0EA5E9',
  },
  WORKSHOP: {
    label: 'Workshops',
    color: '#EC4899',
  },
  VOLUNTEERING: {
    label: 'Voluntariado',
    color: '#14B8A6',
  },
  EXTRACURRICULAR: {
    label: 'Extracurricular',
    color: '#F97316',
  },
  INITIATIVE: {
    label: 'Iniciativas',
    color: '#84CC16',
  },
  OTHER: {
    label: 'Outros',
    color: '#6B7280',
  },
}

CATEGORY_ORDER.forEach(cat => {
  activeCategories.value[cat.key] = true
})

const hasInactiveCategories = computed(() => {
  return Object.values(activeCategories.value).some(v => v === false)
})

function toggleCategory(key: string) {
  activeCategories.value[key] = !activeCategories.value[key]
  sidebarPage.value = 0
}

function resetCategories() {
  CATEGORY_ORDER.forEach(cat => {
    activeCategories.value[cat.key] = true
  })
  sidebarPage.value = 0
}

function safeArray<T>(value: any): T[] {
  if (Array.isArray(value)) return value

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return []
}

function normalizeJsonObject(value: any) {
  if (!value) return {}
  if (typeof value === 'object' && !Array.isArray(value)) return value

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

function parseLocalDate(raw: string | null | undefined): Date | null {
  if (!raw) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split('-').map(Number)
    return new Date(year, month - 1, day, 23, 59, 59)
  }

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatApiDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getMonthWindow(year: number, month: number) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const end = new Date(year, month, 0, 23, 59, 59, 999)

  return { start, end }
}

function getWindowKey(start: Date, end: Date) {
  return `${formatApiDate(start)}:${formatApiDate(end)}`
}

function isDateInsideWindow(date: Date, start: Date, end: Date) {
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime()
}

function isDateInsideLoadedWindow(date: Date) {
  return loadedWindows.value.some(window => isDateInsideWindow(date, window.start, window.end))
}

function shouldShowTimelineEventOnCalendar(event: any) {
  if (!event || typeof event !== 'object') return false

  return event.show_on_calendar === true || event.show_on_calendar === 'true'
}

function normalizeTimeline(value: any) {
  const timeline = safeArray<any>(value)

  return timeline
    .filter(event => event && typeof event === 'object')
    .map(event => ({
      ...event,
      label: event.label ?? event.details ?? event.title ?? event.name ?? 'Evento',
      details: event.details ?? event.description ?? null,
      show_on_calendar: shouldShowTimelineEventOnCalendar(event),
    }))
}

function getTimelineLabel(event: any) {
  return (
    event?.details ??
    event?.description ??
    event?.label ??
    event?.title ??
    event?.name ??
    event?.event ??
    'Evento'
  )
}

function getCategoryKey(opportunity: any) {
  const category = String(opportunity?.category ?? '').trim()
  return CATEGORY_MAP[category] ? category : 'OTHER'
}

function getOpportunityExcerpt(opportunity: any) {
  return (
    opportunity?.excerpt ??
    opportunity?.description?.slice?.(0, 130) ??
    ''
  )
}

function getOpportunityAuthor(opportunity: any) {
  const categoryData = normalizeJsonObject(opportunity?.category_data)

  return (
    categoryData?.organizer ??
    opportunity?.organizer ??
    null
  )
}

function getOpportunityModality(opportunity: any) {
  const categoryData = normalizeJsonObject(opportunity?.category_data)

  return (
    opportunity?.modality ??
    categoryData?.format ??
    null
  )
}

function opportunityHasCalendarEventInWindow(opportunity: any, start: Date, end: Date) {
  const timeline = normalizeTimeline(opportunity?.timeline)

  return timeline.some(event => {
    const date = parseLocalDate(event?.date)
    return event.show_on_calendar === true && !!date && isDateInsideWindow(date, start, end)
  })
}

function normalizeOpportunityToEvents(opportunity: any): any[] {
  const timeline = normalizeTimeline(opportunity?.timeline)
  const category = getCategoryKey(opportunity)
  const categoryMeta = CATEGORY_MAP[category] ?? CATEGORY_MAP.OTHER

  return timeline
    .filter(event => event.show_on_calendar === true)
    .map(event => {
      const date = parseLocalDate(event?.date)

      if (!date) return null
      if (!isDateInsideLoadedWindow(date)) return null

      return {
        id: `opportunity-${opportunity.id}-${formatApiDate(date)}-${getTimelineLabel(event)}`,
        originalId: opportunity.id,
        title: opportunity.title,
        slug: opportunity.slug,
        excerpt: getOpportunityExcerpt(opportunity),
        deadline: event.date,
        deadlineDate: date,
        category,
        categoryLabel: categoryMeta.label,
        categoryColor: categoryMeta.color,
        type: 'opportunity',
        eventType: 'timeline',
        eventLabel: getTimelineLabel(event),
        author_name: getOpportunityAuthor(opportunity),
        modality: getOpportunityModality(opportunity),
        country: opportunity?.country ?? null,
        location: opportunity?.location ?? 'Online',
        cover_url: opportunity?.cover_url ?? null,
        is_free: !!opportunity?.is_free,
        raw: opportunity,
        timelineEvent: event,
      }
    })
    .filter(Boolean)
}

const allEvents = computed<any[]>(() => {
  return opportunities.value
    .flatMap(opportunity => normalizeOpportunityToEvents(opportunity))
    .filter(event => activeCategories.value[event.category] === true)
})

const calendarAttributes = computed(() => {
  return allEvents.value.map((event, idx) => ({
    key: `${event.id}-${idx}`,
    dates: event.deadlineDate,
    dot: {
      color: event.categoryColor,
      style: { backgroundColor: event.categoryColor },
    },
    popover: {
      label: `${event.categoryLabel} · ${event.eventLabel} · ${event.title}`,
    },
    customData: event,
  }))
})

const allUpcomingEvents = computed<any[]>(() => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  return allEvents.value
    .filter(event => {
      const date = parseLocalDate(event.deadline)
      if (!date) return false
      return date >= now
    })
    .sort((a, b) => {
      const aTime = parseLocalDate(a.deadline)?.getTime() ?? 0
      const bTime = parseLocalDate(b.deadline)?.getTime() ?? 0
      return aTime - bTime
    })
})

const sidebarMaxPage = computed(() =>
  Math.max(0, Math.ceil(allUpcomingEvents.value.length / SIDEBAR_PAGE_SIZE) - 1)
)

const sidebarDisplayEvents = computed(() => {
  const start = sidebarPage.value * SIDEBAR_PAGE_SIZE
  return allUpcomingEvents.value.slice(start, start + SIDEBAR_PAGE_SIZE)
})

watch(allUpcomingEvents, () => {
  if (sidebarPage.value > sidebarMaxPage.value) {
    sidebarPage.value = sidebarMaxPage.value
  }
})

const selectedEvents = computed(() => {
  if (!selectedDay.value) return []

  const key = toKey(selectedDay.value)

  return allEvents.value
    .filter(event => {
      const date = parseLocalDate(event.deadline)
      return date && toKey(date) === key
    })
    .sort((a, b) => {
      const aTime = parseLocalDate(a.deadline)?.getTime() ?? 0
      const bTime = parseLocalDate(b.deadline)?.getTime() ?? 0
      return aTime - bTime
    })
})

function toKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function monthAbbr(raw: string) {
  const date = parseLocalDate(raw)
  if (!date) return ''
  return MONTHS_PT[date.getMonth()].slice(0, 3)
}

function dayNumber(raw: string) {
  const date = parseLocalDate(raw)
  if (!date) return ''
  return date.getDate()
}

function daysLeft(raw: string): { text: string; cls: string } {
  const date = parseLocalDate(raw)

  if (!date) return { text: 'Sem data', cls: 'text-[#bbb]' }

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const target = new Date(date)
  target.setHours(23, 59, 59, 999)

  const diff = Math.ceil((target.getTime() - now.getTime()) / 86_400_000)

  if (diff < 0) return { text: 'Encerrado', cls: 'text-[#bbb]' }
  if (diff === 0) return { text: 'Hoje!', cls: 'text-red-500 font-bold' }
  if (diff === 1) return { text: 'Amanhã', cls: 'text-orange-500 font-semibold' }
  if (diff <= 7) return { text: `${diff} dias`, cls: 'text-orange-400 font-medium' }

  return { text: `${diff} dias`, cls: 'text-[#888]' }
}

function handleDayClick(day: any) {
  selectedDay.value = day?.date ? new Date(day.date) : null
  showModal.value = !!selectedDay.value
}

async function handleCalendarMove(pages: any[]) {
  const visiblePages = Array.isArray(pages) ? pages : [pages]

  await Promise.all(
    visiblePages
      .filter(page => page?.month && page?.year)
      .map(page => ensureMonthLoaded(page.year, page.month))
  )
}

function openEvent(event: any) {
  showModal.value = false

  if (event.slug) {
    router.push({
      path: '/oportunidades',
      query: {
        category: event.category,
        open: event.slug,
      },
    })
    return
  }

  router.push({
    path: '/oportunidades',
    query: {
      category: event.category,
    },
  })
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

function mergeOpportunities(items: any[]) {
  const byId = new Map<string, any>()

  for (const opportunity of opportunities.value) {
    const key = String(opportunity?.id ?? opportunity?.slug)
    if (key) byId.set(key, opportunity)
  }

  for (const opportunity of items) {
    const key = String(opportunity?.id ?? opportunity?.slug)
    if (key) byId.set(key, opportunity)
  }

  opportunities.value = Array.from(byId.values())
}

async function ensureMonthLoaded(year: number, month: number) {
  const { start, end } = getMonthWindow(year, month)
  const key = getWindowKey(start, end)

  if (loadedWindowKeys.value.includes(key)) return
  if (loadingWindowKeys.value.includes(key)) return

  loadingWindowKeys.value = [...loadingWindowKeys.value, key]
  calendarLoadingMore.value = true

  try {
    await fetchOpportunityWindow(start, end)

    loadedWindowKeys.value = [...loadedWindowKeys.value, key]
    loadedWindows.value = [
      ...loadedWindows.value.filter(window => window.key !== key),
      {
        key,
        start: new Date(start),
        end: new Date(end),
      },
    ]
  } finally {
    loadingWindowKeys.value = loadingWindowKeys.value.filter(existing => existing !== key)
    calendarLoadingMore.value = loadingWindowKeys.value.length > 0
  }
}

async function fetchOpportunityWindow(start: Date, end: Date) {
  const all: any[] = []
  let page = 1
  let expectedCount: number | null = null

  while (page <= MAX_PAGES_PER_WINDOW) {
    const res = await get('/opportunity/', {
      params: {
        page,
        limit: OPPORTUNITY_PAGE_SIZE,
        human_verified: true,
        show_on_calendar: true,
        start_date: formatApiDate(start),
        end_date: formatApiDate(end),
      },
    })

    const data = safeArray<any>(res.data?.data ?? res.data ?? [])
    expectedCount = Number(res.data?.count ?? data.length)

    const relevant = data.filter((opportunity: any) => {
      return opportunity?.human_verified !== false && opportunityHasCalendarEventInWindow(opportunity, start, end)
    })

    all.push(...relevant)

    if (data.length === 0) break
    if (expectedCount && page * OPPORTUNITY_PAGE_SIZE >= expectedCount) break
    if (data.length < OPPORTUNITY_PAGE_SIZE) break

    page++
  }

  mergeOpportunities(all)
}

async function fetchAllData() {
  loading.value = true
  error.value = null

  opportunities.value = []
  loadedWindowKeys.value = []
  loadingWindowKeys.value = []
  loadedWindows.value = []
  sidebarPage.value = 0

  try {
    await ensureMonthLoaded(today.getFullYear(), today.getMonth() + 1)
  } catch (err: any) {
    console.error('Error fetching opportunities:', err)
    error.value = 'Não foi possível carregar as oportunidades.'
  } finally {
    loading.value = false
    calendarLoadingMore.value = false
  }
}

onMounted(() => {
  fetchAllData()
})
</script>

<style scoped>
.seconecta-calendar {
  --vc-font-family: 'Outfit', sans-serif;
  --vc-rounded-full: 10px;
  border: none !important;
  width: 100% !important;
}

.seconecta-calendar :deep(.vc-header) {
  padding: 16px 20px 8px;
}

.seconecta-calendar :deep(.vc-title) {
  font-weight: 700;
  font-size: 0.95rem;
  color: #111;
}

.seconecta-calendar :deep(.vc-arrow) {
  border-radius: 8px;
  color: #666;
}

.seconecta-calendar :deep(.vc-arrow:hover) {
  background: #f0ece5;
  color: #111;
}

.seconecta-calendar :deep(.vc-weekday) {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: #bbb;
  text-transform: uppercase;
}

.seconecta-calendar :deep(.vc-day-content) {
  font-size: 0.82rem;
  font-weight: 500;
  color: #555;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  transition: background 0.15s, color 0.15s;
}

.seconecta-calendar :deep(.vc-day-content:hover) {
  background: #f0faf7 !important;
  color: #079272 !important;
}

.seconecta-calendar :deep(.vc-day-content.is-today) {
  background: #079272 !important;
  color: #fff !important;
  font-weight: 700;
}

.seconecta-calendar :deep(.vc-highlights .vc-highlight) {
  border-radius: 9px;
}

.seconecta-calendar :deep(.vc-day) {
  padding: 4px 2px;
}

.seconecta-calendar :deep(.vc-dots) {
  gap: 2px;
  margin-top: 2px;
}

.seconecta-calendar :deep(.vc-dot) {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.seconecta-calendar :deep(.vc-nav-item.is-active) {
  background: #079272 !important;
  color: #fff !important;
  border-radius: 8px;
}

.seconecta-calendar :deep(.vc-nav-item:hover) {
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

.modal-fade-enter-from {
  opacity: 0;
}

.modal-fade-enter-from .relative {
  transform: translateY(16px) scale(0.98);
  opacity: 0;
}

.modal-fade-leave-to {
  opacity: 0;
}

.transition-transform {
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}
</style>