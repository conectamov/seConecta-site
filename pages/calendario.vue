<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import UserCalendarEventModal from '~/components/UserCalendarEventModal.vue'
import UserCalendarEventViewModal from '~/components/UserCalendarEventViewModal.vue'
import UserCalendarSettingsModal from '~/components/UserCalendarSettingsModal.vue'

useSeoMeta({ title: 'Meu calendário — seConecta' })

type CalendarFilter = 'all' | 'personal' | 'seconecta'
type CalendarView = 'month' | 'list'
type PublicCategoryFilter = 'ALL' | string

const { get, del } = useAxios()

const now = new Date()
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

const currentMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const events = ref<any[]>([])
const publicEvents = ref<any[]>([])
const savedOpportunityRows = ref<any[]>([])
const loading = ref(false)
const publicLoading = ref(false)
const error = ref<string | null>(null)

const activeFilter = ref<CalendarFilter>('all')
const activePublicCategory = ref<PublicCategoryFilter>('ALL')
const activeView = ref<CalendarView>('month')
const selectedDay = ref<Date | null>(new Date(today))

const viewModalOpen = ref(false)
const eventModalOpen = ref(false)
const settingsModalOpen = ref(false)
const viewedEvent = ref<any | null>(null)
const editingEvent = ref<any | null>(null)
const modalInitialDate = ref<string | null>(null)

let requestSeq = 0

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const FILTERS: Array<{ value: CalendarFilter; label: string; icon: string }> = [
  { value: 'all', label: 'Tudo', icon: '🗓️' },
  { value: 'personal', label: 'Pessoal', icon: '📌' },
  { value: 'seconecta', label: 'seConecta', icon: '✨' },
]

const PUBLIC_CATEGORY_META: Record<string, { label: string; icon: string; tone: string }> = {
  COMPETITION: { label: 'Competição', icon: '🏆', tone: 'competition' },
  OLYMPIAD: { label: 'Olimpíada', icon: '🏅', tone: 'olympiad' },
  MUN: { label: 'MUN', icon: '🌐', tone: 'mun' },
  SCHOLARSHIP: { label: 'Bolsa', icon: '🎓', tone: 'scholarship' },
  SUMMER_PROGRAM: { label: 'Programa de verão', icon: '☀️', tone: 'summer' },
  WORKSHOP: { label: 'Workshop', icon: '🛠️', tone: 'workshop' },
  VOLUNTEERING: { label: 'Voluntariado', icon: '🤝', tone: 'volunteering' },
  EXTRACURRICULAR: { label: 'Extracurricular', icon: '⚡', tone: 'extracurricular' },
  INITIATIVE: { label: 'Iniciativa', icon: '💡', tone: 'initiative' },
  POST: { label: 'Outro', icon: '📌', tone: 'post' },
}

const TIMELINE_KIND_LABELS: Record<string, string> = {
  registration_start: 'Abertura',
  registration_deadline: 'Prazo final',
  submission_deadline: 'Envio',
  exam: 'Prova',
  interview: 'Entrevista',
  result: 'Resultado',
  phase: 'Fase',
  program_start: 'Início',
  program_end: 'Fim',
  other: 'Data',
}

function extractData(res: any) {
  return res?.data?.data ?? res?.data ?? res
}

function getErrorMessage(err: any, fallback: string) {
  return err?.response?.data?.detail || err?.data?.detail || err?.message || fallback
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function toDateInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseDate(raw: string | null | undefined): Date | null {
  if (!raw) return null

  const text = String(raw).trim()
  if (!text) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function sameDay(a: Date, b: Date | null) {
  if (!b) return false

  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

function fmtMonth(date: Date) {
  const label = date.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  return label.charAt(0).toUpperCase() + label.slice(1)
}

function fmtDay(date: Date | null) {
  if (!date) return ''

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

function fmtFullDay(date: Date | null) {
  if (!date) return ''

  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
}

function fmtEventTime(event: any) {
  if (event?.all_day) return 'Dia inteiro'

  const dt = parseDate(event?.starts_at)
  if (!dt) return ''

  return dt.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getMonthRange(base: Date) {
  const start = new Date(base.getFullYear(), base.getMonth(), 1)
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0)

  const paddedStart = new Date(start)
  paddedStart.setDate(paddedStart.getDate() - start.getDay())
  paddedStart.setHours(0, 0, 0, 0)

  const paddedEnd = new Date(end)
  paddedEnd.setDate(paddedEnd.getDate() + (6 - end.getDay()))
  paddedEnd.setHours(23, 59, 59, 999)

  return { start, end, paddedStart, paddedEnd }
}

function normalizeSavedOpportunities(payload: any) {
  const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []

  return list
    .map((row: any) => {
      if (row?.opportunity) {
        return {
          ...row.opportunity,
          saved: row.saved ?? null,
        }
      }

      return row
    })
    .filter((item: any) => item?.id || item?.opportunity_id)
}

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return ''

  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

function normalizeTimelineKind(rawKind: unknown, event: any) {
  const explicitKind = normalizeText(rawKind).replaceAll('-', '_').replaceAll(' ', '_')
  if (TIMELINE_KIND_LABELS[explicitKind]) return explicitKind

  const text = normalizeText([
    event?.label,
    event?.details,
    event?.description,
    event?.title,
    event?.name,
  ].filter(Boolean).join(' '))

  if (text.includes('inscri') && (text.includes('abre') || text.includes('inicio') || text.includes('come'))) return 'registration_start'
  if (text.includes('inscri') || text.includes('registration') || text.includes('application') || text.includes('candidatura')) return 'registration_deadline'
  if (text.includes('envio') || text.includes('submiss') || text.includes('submission')) return 'submission_deadline'
  if (text.includes('prova') || text.includes('exame') || text.includes('test')) return 'exam'
  if (text.includes('entrevista') || text.includes('interview')) return 'interview'
  if (text.includes('resultado')) return 'result'
  if (text.includes('fase') || text.includes('phase')) return 'phase'
  if (text.includes('inicio') || text.includes('start')) return 'program_start'
  if (text.includes('fim') || text.includes('end')) return 'program_end'

  return explicitKind || 'other'
}

function normalizeTimeline(value: any) {
  let timeline: any[] = []

  if (Array.isArray(value)) {
    timeline = value
  } else if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      timeline = Array.isArray(parsed) ? parsed : []
    } catch {
      timeline = []
    }
  }

  return timeline
    .filter((event) => event && typeof event === 'object')
    .map((event) => {
      const kind = normalizeTimelineKind(event.kind, event)
      const date = event.date ?? event.datetime ?? event.deadline ?? event.start_date ?? event.end_date ?? null

      return {
        ...event,
        kind,
        date,
        label: event.label ?? event.title ?? event.name ?? TIMELINE_KIND_LABELS[kind] ?? 'Data',
        details: event.details ?? event.description ?? null,
        show_on_calendar: event.show_on_calendar === true || event.show_on_calendar === 'true',
      }
    })
}

function timelineId(event: any, opportunityId: number) {
  const explicit = event?.id ?? event?.timeline_item_id
  if (explicit) return String(explicit).slice(0, 120)

  const raw = [
    opportunityId,
    event?.kind ?? 'other',
    event?.date ?? '',
    event?.label ?? event?.title ?? event?.details ?? '',
  ].join('|')

  const slug = raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 96)

  return slug || `opportunity_${opportunityId}`
}

function categoryMeta(category: string | null | undefined) {
  return PUBLIC_CATEGORY_META[String(category || '').toUpperCase()] ?? PUBLIC_CATEGORY_META.POST
}

function buildPublicCalendarEvents(opportunities: any[]) {
  const { paddedStart, paddedEnd } = getMonthRange(currentMonth.value)
  const startMs = paddedStart.getTime()
  const endMs = paddedEnd.getTime()

  return opportunities.flatMap((opportunity) => {
    const id = Number(opportunity?.id)
    if (!Number.isInteger(id) || id <= 0) return []

    const category = String(opportunity?.category || 'POST').toUpperCase()
    const meta = categoryMeta(category)
    const timeline = normalizeTimeline(opportunity?.timeline)

    return timeline
      .filter((event) => event.show_on_calendar === true)
      .map((event) => {
        const date = parseDate(event.date)
        return { event, date }
      })
      .filter(({ date }) => date && date.getTime() >= startMs && date.getTime() <= endMs)
      .map(({ event, date }) => {
        const kindLabel = TIMELINE_KIND_LABELS[event.kind] ?? 'Data'
        const title = `${kindLabel} — ${opportunity.title || 'Oportunidade'}`

        return {
          id: `seconecta-${id}-${timelineId(event, id)}`,
          title,
          description: event.details || event.label || opportunity.excerpt || null,
          starts_at: toDateInput(date as Date),
          ends_at: null,
          all_day: true,
          status: 'ACTIVE',
          importance: 'NORMAL',
          source_type: 'SECONNECTA_PUBLIC',
          opportunity_id: id,
          opportunity_slug: opportunity.slug ?? null,
          opportunity_category: category,
          public_tone: meta.tone,
          readonly: true,
          location: opportunity.location || null,
          external_url: opportunity.official_site_url || null,
          source_snapshot: {
            opportunity_title: opportunity.title || 'Oportunidade',
            opportunity_slug: opportunity.slug || null,
            category,
            category_label: meta.label,
            category_icon: meta.icon,
            timeline_kind: event.kind,
            timeline_label: event.label,
          },
          opportunity,
        }
      })
  })
}

function getEventTone(event: any) {
  if (event?.status === 'DONE') return 'done'
  if (event?.source_type === 'SECONNECTA_PUBLIC') return event?.public_tone || categoryMeta(event?.opportunity_category).tone

  const importance = String(event?.importance || 'NORMAL').toUpperCase()

  if (importance === 'CRITICAL') return 'critical'
  if (importance === 'HIGH') return 'high'
  if (importance === 'LOW') return 'low'

  return 'normal'
}

function getEventIcon(event: any) {
  if (event?.source_type === 'SECONNECTA_PUBLIC') return event?.source_snapshot?.category_icon || categoryMeta(event?.opportunity_category).icon
  if (event?.source_type === 'OPPORTUNITY_TIMELINE') return '⏰'
  if (event?.source_type === 'OPPORTUNITY_PREP_TASK') return '🧩'
  if (event?.opportunity_id) return '🎯'
  return '📌'
}

function getEventSourceLabel(event: any) {
  if (event?.source_type === 'SECONNECTA_PUBLIC') return event?.source_snapshot?.category_label || categoryMeta(event?.opportunity_category).label
  if (event?.source_type === 'OPPORTUNITY_TIMELINE') return 'Oportunidade salva'
  if (event?.source_type === 'OPPORTUNITY_PREP_TASK') return 'Preparação'
  if (event?.opportunity_id) return 'Oportunidade'
  return 'Pessoal'
}

function getOpportunityForEvent(event: any) {
  if (event?.opportunity) return event.opportunity

  const id = Number(event?.opportunity_id)
  if (!Number.isInteger(id) || id <= 0) return null

  return savedOpportunityRows.value.find((item) => Number(item?.id ?? item?.opportunity_id) === id) ?? null
}

const monthLabel = computed(() => fmtMonth(currentMonth.value))

const savedOpportunities = computed(() => savedOpportunityRows.value)

const isPublicCalendar = computed(() => activeFilter.value === 'seconecta')

const filteredEvents = computed(() => {
  if (isPublicCalendar.value) {
    return [...publicEvents.value]
      .filter((event) => event?.status !== 'HIDDEN')
      .filter((event) => {
        if (activePublicCategory.value === 'ALL') return true
        return String(event?.opportunity_category || 'POST').toUpperCase() === activePublicCategory.value
      })
      .sort((a, b) => {
        const aTime = parseDate(a.starts_at)?.getTime() ?? 0
        const bTime = parseDate(b.starts_at)?.getTime() ?? 0
        return aTime - bTime
      })
  }

  return [...events.value]
    .filter((event) => event?.status !== 'HIDDEN')
    .filter((event) => {
      if (activeFilter.value === 'all') return true
      if (activeFilter.value === 'personal') return event.source_type !== 'OPPORTUNITY_TIMELINE'
      return true
    })
    .sort((a, b) => {
      const aTime = parseDate(a.starts_at)?.getTime() ?? 0
      const bTime = parseDate(b.starts_at)?.getTime() ?? 0
      return aTime - bTime
    })
})

const publicCategoryFilters = computed(() => {
  const counts = new Map<string, number>()

  for (const event of publicEvents.value) {
    const category = String(event?.opportunity_category || 'POST').toUpperCase()
    counts.set(category, (counts.get(category) || 0) + 1)
  }

  return Object.entries(PUBLIC_CATEGORY_META)
    .map(([category, meta]) => ({
      category,
      ...meta,
      count: counts.get(category) || 0,
    }))
    .filter((item) => item.count > 0)
})

const activePublicCategoryLabel = computed(() => {
  if (activePublicCategory.value === 'ALL') return 'Todos os tipos'

  return publicCategoryFilters.value.find((item) => item.category === activePublicCategory.value)?.label ?? 'Tipo selecionado'
})

const calendarDays = computed(() => {
  const { start, paddedStart, paddedEnd } = getMonthRange(currentMonth.value)
  const days: Array<{
    date: Date
    key: string
    inMonth: boolean
    isToday: boolean
    events: any[]
  }> = []
  const cursor = new Date(paddedStart)

  while (cursor <= paddedEnd) {
    const day = new Date(cursor)
    const dayEvents = filteredEvents.value.filter((event) => {
      const eventDate = parseDate(event.starts_at)
      return eventDate ? sameDay(eventDate, day) : false
    })

    days.push({
      date: day,
      key: toDateInput(day),
      inMonth: day.getMonth() === start.getMonth(),
      isToday: sameDay(day, today),
      events: dayEvents,
    })

    cursor.setDate(cursor.getDate() + 1)
  }

  return days
})

const selectedDayEvents = computed(() => {
  if (!selectedDay.value) return []

  return filteredEvents.value.filter((event) => {
    const date = parseDate(event.starts_at)
    return date ? sameDay(date, selectedDay.value) : false
  })
})

const upcomingEvents = computed(() => {
  return filteredEvents.value
    .filter((event) => {
      const date = parseDate(event.starts_at)
      return date ? date >= today : false
    })
    .slice(0, 5)
})

const stats = computed(() => {
  const visible = filteredEvents.value

  return {
    total: visible.length,
    saved: events.value.filter((event) => event?.status !== 'HIDDEN').length,
    custom: visible.filter((event) => event.source_type !== 'OPPORTUNITY_TIMELINE').length,
    publicCount: publicEvents.value.length,
  }
})

async function fetchCalendarEvents() {
  const seq = ++requestSeq
  const { paddedStart, paddedEnd } = getMonthRange(currentMonth.value)

  loading.value = true
  error.value = null

  try {
    const res = await get('/users/me/calendar/events', {
      params: {
        start: paddedStart.toISOString(),
        end: paddedEnd.toISOString(),
        include_hidden: true,
        limit: 500,
      },
    })

    if (seq !== requestSeq) return

    const payload = extractData(res)
    events.value = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []
  } catch (err: any) {
    if (seq !== requestSeq) return
    error.value = getErrorMessage(err, 'Não foi possível carregar seu calendário.')
  } finally {
    if (seq === requestSeq) loading.value = false
  }
}

async function fetchSavedOpportunities() {
  try {
    const res = await get('/users/me/saved-opportunities', {
      params: { limit: 200 },
    })

    savedOpportunityRows.value = normalizeSavedOpportunities(extractData(res))
  } catch (err) {
    console.warn('[MeCalendar] Could not fetch saved opportunities:', err)
    savedOpportunityRows.value = []
  }
}

async function fetchPublicCalendarEvents() {
  publicLoading.value = true

  try {
    const allCards: any[] = []
    const limit = 100
    const maxPages = 6

    for (let page = 1; page <= maxPages; page += 1) {
      const res = await get('/opportunity/cards', {
        params: {
          page,
          limit,
        },
      })

      const payload = extractData(res)
      const rows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []
      allCards.push(...rows)

      const count = Number(payload?.count ?? rows.length)
      if (!rows.length || allCards.length >= count) break
    }

    publicEvents.value = buildPublicCalendarEvents(allCards)
  } catch (err) {
    console.warn('[MeCalendar] Could not fetch seConecta public calendar:', err)
    publicEvents.value = []
  } finally {
    publicLoading.value = false
  }
}

function previousMonth() {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1)
}

function nextMonth() {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1)
}

function goToday() {
  currentMonth.value = new Date(today.getFullYear(), today.getMonth(), 1)
  selectedDay.value = new Date(today)
}

function openCreateModal(date?: Date | null) {
  editingEvent.value = null
  modalInitialDate.value = date ? toDateInput(date) : toDateInput(selectedDay.value ?? today)
  eventModalOpen.value = true
}

function openViewModal(event: any) {
  viewedEvent.value = event
  viewModalOpen.value = true
}

function openEditModal(event: any) {
  viewModalOpen.value = false
  viewedEvent.value = null
  editingEvent.value = event
  modalInitialDate.value = null
  eventModalOpen.value = true
}

async function deleteEvent(event: any) {
  if (!event?.id) return
  if (!confirm('Remover este evento do seu calendário?')) return

  try {
    await del(`/users/me/calendar/events/${event.id}`)
    viewModalOpen.value = false
    viewedEvent.value = null
    await fetchCalendarEvents()
  } catch (err: any) {
    error.value = getErrorMessage(err, 'Não foi possível remover o evento.')
  }
}

async function handleModalSaved() {
  eventModalOpen.value = false
  editingEvent.value = null

  await Promise.allSettled([
    fetchCalendarEvents(),
    fetchSavedOpportunities(),
  ])
}

function handleViewEdit(event: any) {
  openEditModal(event)
}

async function handleViewDelete(event: any) {
  await deleteEvent(event)
}

function handleSettingsSaved() {
  settingsModalOpen.value = false
}

watch(activeFilter, (value) => {
  if (value !== 'seconecta') {
    activePublicCategory.value = 'ALL'
  }
})

watch(publicCategoryFilters, (items) => {
  if (activePublicCategory.value === 'ALL') return

  const stillExists = items.some((item) => item.category === activePublicCategory.value)
  if (!stillExists) activePublicCategory.value = 'ALL'
})

watch(currentMonth, () => {
  fetchCalendarEvents()
  fetchPublicCalendarEvents()
})

onMounted(async () => {
  await Promise.allSettled([
    fetchCalendarEvents(),
    fetchSavedOpportunities(),
    fetchPublicCalendarEvents(),
  ])
})
</script>

<template>
  <main class="mc-page">
    <section class="mc-shell">
      <header class="mc-hero">
        <div class="mc-hero__copy">
          <span class="mc-eyebrow">Área pessoal</span>
          <h1>Meu calendário</h1>
          <p>
            Seus prazos, tarefas e eventos salvos. Aqui só entra o que você decidiu acompanhar.
          </p>
        </div>

        <div class="mc-hero__actions">
          <button type="button" class="mc-btn mc-btn--ghost" @click="settingsModalOpen = true">
            ⚙️ Alertas
          </button>
          <button type="button" class="mc-btn mc-btn--primary" @click="openCreateModal()">
            ＋ Novo evento
          </button>
        </div>
      </header>

      <section class="mc-topbar">
        <div class="mc-month-nav" aria-label="Navegação por mês">
          <button type="button" aria-label="Mês anterior" @click="previousMonth">‹</button>
          <strong>{{ monthLabel }}</strong>
          <button type="button" aria-label="Próximo mês" @click="nextMonth">›</button>
          <button type="button" class="mc-today" @click="goToday">Hoje</button>
        </div>

        <div class="mc-view-toggle" aria-label="Modo de visualização">
          <button
            type="button"
            :class="activeView === 'month' && 'is-active'"
            @click="activeView = 'month'"
          >
            Mês
          </button>
          <button
            type="button"
            :class="activeView === 'list' && 'is-active'"
            @click="activeView = 'list'"
          >
            Lista
          </button>
        </div>
      </section>

      <section class="mc-filter-row" aria-label="Filtros do calendário">
        <button
          v-for="filter in FILTERS"
          :key="filter.value"
          type="button"
          :class="['mc-filter', activeFilter === filter.value && 'is-active']"
          @click="activeFilter = filter.value"
        >
          <span>{{ filter.icon }}</span>
          {{ filter.label }}
        </button>
      </section>

      <p v-if="error" class="mc-error">
        {{ error }}
      </p>

      <section class="mc-layout">
        <div class="mc-calendar-card">
          <div class="mc-card-head">
            <div>
              <strong v-if="isPublicCalendar">Calendário seConecta · {{ stats.total }} data{{ stats.total === 1 ? '' : 's' }}</strong>
              <strong v-else>{{ stats.total }} evento{{ stats.total === 1 ? '' : 's' }}</strong>
              <span v-if="isPublicCalendar">{{ activePublicCategoryLabel }} · datas públicas de oportunidades.</span>
              <span v-else>{{ activeFilter === 'personal' ? 'Somente eventos pessoais e tarefas próprias.' : 'Somente eventos que você salvou ou criou.' }}</span>
            </div>
          </div>

          <div v-if="isPublicCalendar && publicCategoryFilters.length > 0" class="mc-public-filter" aria-label="Filtrar calendário seConecta por tipo">
            <span class="mc-public-filter__label">Tipo</span>

            <button
              type="button"
              :class="['mc-public-filter__chip', activePublicCategory === 'ALL' && 'is-active']"
              @click="activePublicCategory = 'ALL'"
            >
              ✨ Todos <em>{{ publicEvents.length }}</em>
            </button>

            <button
              v-for="item in publicCategoryFilters"
              :key="item.category"
              type="button"
              :class="[
                'mc-public-filter__chip',
                `mc-public-filter__chip--${item.tone}`,
                activePublicCategory === item.category && 'is-active',
              ]"
              @click="activePublicCategory = item.category"
            >
              {{ item.icon }} {{ item.label }} <em>{{ item.count }}</em>
            </button>
          </div>

          <div v-if="loading || (isPublicCalendar && publicLoading)" class="mc-loading">
            {{ isPublicCalendar ? 'Carregando calendário seConecta...' : 'Carregando calendário...' }}
          </div>

          <template v-else-if="activeView === 'month'">
            <div class="mc-weekdays">
              <span v-for="day in WEEKDAYS" :key="day">{{ day }}</span>
            </div>

            <div class="mc-month-grid">
              <article
                v-for="day in calendarDays"
                :key="day.key"
                :class="[
                  'mc-day',
                  !day.inMonth && 'mc-day--muted',
                  day.isToday && 'mc-day--today',
                  selectedDay && sameDay(day.date, selectedDay) && 'mc-day--selected',
                ]"
                @click="selectedDay = day.date"
              >
                <div class="mc-day__top">
                  <span>{{ day.date.getDate() }}</span>
                  <button
                    type="button"
                    aria-label="Adicionar evento neste dia"
                    @click.stop="openCreateModal(day.date)"
                  >
                    +
                  </button>
                </div>

                <div class="mc-day__events">
                  <button
                    v-for="event in day.events.slice(0, 2)"
                    :key="event.id"
                    type="button"
                    :title="event.title"
                    :aria-label="event.title"
                    :class="['mc-event-chip', `mc-event-chip--${getEventTone(event)}`]"
                    @click.stop="openViewModal(event)"
                  >
                    <span>{{ getEventIcon(event) }}</span>
                    <strong>{{ event.title }}</strong>
                  </button>

                  <small v-if="day.events.length > 2">
                    +{{ day.events.length - 2 }} outro{{ day.events.length - 2 === 1 ? '' : 's' }}
                  </small>
                </div>
              </article>
            </div>
          </template>

          <template v-else>
            <div v-if="filteredEvents.length === 0" class="mc-empty">
              <strong>{{ isPublicCalendar ? 'Nenhuma data pública neste mês.' : 'Nenhum evento neste mês.' }}</strong>
              <p>{{ isPublicCalendar ? 'As datas públicas aparecem quando oportunidades verificadas têm itens de timeline marcados para calendário.' : 'Crie uma data pessoal ou salve uma data de uma oportunidade.' }}</p>
              <button v-if="!isPublicCalendar" type="button" class="mc-btn mc-btn--primary" @click="openCreateModal()">
                Criar evento
              </button>
            </div>

            <div v-else class="mc-list">
              <button
                v-for="event in filteredEvents"
                :key="event.id"
                type="button"
                :class="['mc-list-event', `mc-list-event--${getEventTone(event)}`]"
                @click="openViewModal(event)"
              >
                <span class="mc-list-event__date">
                  <strong>{{ fmtDay(parseDate(event.starts_at)) }}</strong>
                  <small>{{ fmtEventTime(event) }}</small>
                </span>

                <span class="mc-list-event__body">
                  <small>{{ getEventSourceLabel(event) }}</small>
                  <strong>{{ event.title }}</strong>
                  <em v-if="event.opportunity_id">
                    {{ getOpportunityForEvent(event)?.title || 'Oportunidade vinculada' }}
                  </em>
                </span>

                <span class="mc-list-event__arrow">Ver</span>
              </button>
            </div>
          </template>
        </div>

        <aside class="mc-sidebar">
          <section class="mc-side-card mc-side-card--selected">
            <div class="mc-side-card__head">
              <span>📍</span>
              <div>
                <strong>{{ selectedDay ? fmtFullDay(selectedDay) : 'Hoje' }}</strong>
                <small>{{ selectedDayEvents.length }} evento{{ selectedDayEvents.length === 1 ? '' : 's' }}</small>
              </div>
            </div>

            <div v-if="selectedDayEvents.length === 0" class="mc-side-empty">
              <span>Sem eventos neste dia.</span>
              <button type="button" @click="openCreateModal(selectedDay || today)">
                Adicionar
              </button>
            </div>

            <button
              v-for="event in selectedDayEvents"
              :key="event.id"
              type="button"
              :class="['mc-side-event', `mc-side-event--${getEventTone(event)}`]"
              @click="openViewModal(event)"
            >
              <span>{{ getEventIcon(event) }}</span>
              <strong>{{ event.title }}</strong>
              <small>{{ fmtEventTime(event) }}</small>
            </button>
          </section>

          <section class="mc-side-card">
            <div class="mc-side-card__head">
              <span>⏭️</span>
              <div>
                <strong>Próximos</strong>
                <small>Filtro atual</small>
              </div>
            </div>

            <div v-if="upcomingEvents.length === 0" class="mc-side-empty">
              Nada próximo por aqui.
            </div>

            <button
              v-for="event in upcomingEvents"
              :key="event.id"
              type="button"
              class="mc-upcoming"
              @click="openViewModal(event)"
            >
              <span :class="['mc-upcoming__icon', `mc-upcoming__icon--${getEventTone(event)}`]">
                {{ getEventIcon(event) }}
              </span>
              <span>
                <strong>{{ event.title }}</strong>
                <small>{{ fmtDay(parseDate(event.starts_at)) }} · {{ getEventSourceLabel(event) }}</small>
              </span>
            </button>
          </section>
        </aside>
      </section>
    </section>

    <UserCalendarEventViewModal
      v-model:open="viewModalOpen"
      :event="viewedEvent"
      :opportunity="viewedEvent ? getOpportunityForEvent(viewedEvent) : null"
      @edit="handleViewEdit"
      @delete="handleViewDelete"
      @view="openViewModal"
    />

    <UserCalendarEventModal
      v-model:open="eventModalOpen"
      :event="editingEvent"
      :initial-date="modalInitialDate"
      :saved-opportunities="savedOpportunities"
      @saved="handleModalSaved"
      @deleted="handleModalSaved"
    />

    <UserCalendarSettingsModal
      v-model:open="settingsModalOpen"
      @saved="handleSettingsSaved"
    />
  </main>
</template>

<style scoped>
.mc-page,
.mc-page * {
  box-sizing: border-box;
}

.mc-page {
  min-height: 100vh;
  overflow-x: hidden;
  padding: 22px clamp(14px, 3vw, 34px) 48px;
  background:
    radial-gradient(circle at top left, rgba(7, 146, 114, .11), transparent 24rem),
    linear-gradient(180deg, #f8fafc, #ffffff 46%);
}

.mc-shell {
  width: min(1180px, 100%);
  max-width: 100%;
  min-width: 0;
  margin: 0 auto;
}

.mc-layout,
.mc-calendar-card,
.mc-weekdays,
.mc-month-grid {
  min-width: 0;
  max-width: 100%;
}

.mc-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: end;
  margin-bottom: 18px;
}

.mc-eyebrow {
  display: inline-flex;
  margin-bottom: 6px;
  color: #079272;
  font-size: .67rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .1em;
}

.mc-hero h1 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(2.1rem, 4.5vw, 3.6rem);
  line-height: .95;
  letter-spacing: -.07em;
}

.mc-hero p {
  max-width: 640px;
  margin: 10px 0 0;
  color: #64748b;
  font-size: .94rem;
  line-height: 1.55;
}

.mc-hero__actions,
.mc-topbar,
.mc-month-nav,
.mc-view-toggle,
.mc-filter-row {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}

.mc-hero__actions {
  justify-content: flex-end;
}

.mc-btn,
.mc-month-nav button,
.mc-view-toggle button,
.mc-filter {
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 9px 13px;
  font-size: .8rem;
  font-weight: 900;
  cursor: pointer;
  transition: .18s ease;
}

.mc-btn:hover,
.mc-month-nav button:hover,
.mc-view-toggle button:hover,
.mc-filter:hover {
  transform: translateY(-1px);
}

.mc-btn--primary {
  border-color: #079272;
  background: #079272;
  color: white;
  box-shadow: 0 14px 32px rgba(7, 146, 114, .18);
}

.mc-btn--ghost,
.mc-month-nav button,
.mc-view-toggle button,
.mc-filter {
  background: rgba(255, 255, 255, .9);
  color: #475569;
}

.mc-topbar {
  justify-content: space-between;
  margin-bottom: 12px;
}

.mc-month-nav strong {
  min-width: 170px;
  color: #0f172a;
  font-size: 1.02rem;
  font-weight: 950;
  text-align: center;
}

.mc-month-nav button:not(.mc-today) {
  width: 36px;
  height: 36px;
  padding: 0;
  display: grid;
  place-items: center;
  font-size: 1.28rem;
}

.mc-view-toggle {
  padding: 4px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: white;
}

.mc-view-toggle button {
  border: none;
  padding: 7px 12px;
  box-shadow: none;
}

.mc-view-toggle button.is-active,
.mc-filter.is-active {
  background: #0f172a;
  border-color: #0f172a;
  color: white;
}

.mc-filter-row {
  margin-bottom: 16px;
}

.mc-filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.mc-error {
  border: 1px solid #fecaca;
  border-radius: 18px;
  padding: 11px 13px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: .84rem;
  font-weight: 850;
  margin: 0 0 14px;
}

.mc-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 312px;
  gap: 16px;
  align-items: start;
}

.mc-calendar-card,
.mc-side-card {
  border: 1px solid #e2e8f0;
  border-radius: 26px;
  background: rgba(255, 255, 255, .95);
  box-shadow: 0 22px 70px rgba(15, 23, 42, .07);
}

.mc-calendar-card {
  overflow: hidden;
}

.mc-card-head {
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #fff, #f8fafc);
}

.mc-card-head strong {
  display: block;
  color: #0f172a;
  font-size: .95rem;
  font-weight: 950;
}

.mc-card-head span {
  display: block;
  margin-top: 2px;
  color: #64748b;
  font-size: .76rem;
  font-weight: 800;
}

.mc-loading,
.mc-empty {
  min-height: 360px;
  display: grid;
  place-items: center;
  text-align: center;
  color: #64748b;
  padding: 30px;
}

.mc-empty strong {
  display: block;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 950;
}

.mc-empty p {
  margin: 8px 0 16px;
}

.mc-weekdays,
.mc-month-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.mc-weekdays {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.mc-weekdays span {
  padding: 10px 11px;
  color: #64748b;
  font-size: .68rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.mc-day {
  min-height: 118px;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  padding: 9px;
  background: white;
  cursor: pointer;
  transition: .16s ease;
}

.mc-day:nth-child(7n) {
  border-right: none;
}

.mc-day:hover,
.mc-day--selected {
  background: #f0fdfa;
}

.mc-day--muted {
  background: #f8fafc;
}

.mc-day--muted .mc-day__top > span {
  color: #94a3b8;
}

.mc-day--today .mc-day__top > span {
  background: #079272;
  color: white;
}

.mc-day__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 7px;
}

.mc-day__top > span {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  color: #0f172a;
  font-size: .78rem;
  font-weight: 950;
}

.mc-day__top button {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #f1f5f9;
  color: #64748b;
  font-weight: 950;
  cursor: pointer;
}

.mc-day__events {
  display: grid;
  gap: 5px;
}

.mc-event-chip {
  min-width: 0;
  width: 100%;
  border: 1px solid transparent;
  border-left-width: 3px;
  border-radius: 12px;
  padding: 7px 8px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 6px;
  align-items: center;
  text-align: left;
  cursor: pointer;
}

.mc-event-chip span {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  font-size: .8rem;
}

.mc-event-chip strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #0f172a;
  font-size: .7rem;
  font-weight: 950;
  line-height: 1.12;
}

.mc-event-chip--low,
.mc-list-event--low,
.mc-side-event--low,
.mc-upcoming__icon--low {
  background: #ecfdf5;
  border-color: #bbf7d0;
}

.mc-event-chip--normal,
.mc-list-event--normal,
.mc-side-event--normal,
.mc-upcoming__icon--normal {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.mc-event-chip--high,
.mc-list-event--high,
.mc-side-event--high,
.mc-upcoming__icon--high {
  background: #fffbeb;
  border-color: #fde68a;
}

.mc-event-chip--critical,
.mc-list-event--critical,
.mc-side-event--critical,
.mc-upcoming__icon--critical {
  background: #fef2f2;
  border-color: #fecaca;
}

.mc-event-chip--done,
.mc-list-event--done,
.mc-side-event--done,
.mc-upcoming__icon--done {
  background: #f1f5f9;
  border-color: #e2e8f0;
  opacity: .76;
}

.mc-day__events small {
  color: #64748b;
  font-size: .66rem;
  font-weight: 850;
}

.mc-list {
  display: grid;
  gap: 9px;
  padding: 14px;
}

.mc-list-event {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 12px;
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  text-align: left;
  cursor: pointer;
}

.mc-list-event__date strong,
.mc-list-event__body strong {
  display: block;
  color: #0f172a;
  font-weight: 950;
}

.mc-list-event__date small,
.mc-list-event__body small,
.mc-list-event__body em {
  color: #64748b;
  font-size: .74rem;
  font-style: normal;
  font-weight: 800;
}

.mc-list-event__body strong,
.mc-list-event__body em {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mc-list-event__arrow {
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(15, 23, 42, .08);
  color: #475569;
  font-size: .7rem;
  font-weight: 950;
}

.mc-sidebar {
  min-width: 0;
  display: grid;
  gap: 14px;
}

.mc-side-card {
  min-width: 0;
  overflow: hidden;
  padding: 14px;
  display: grid;
  gap: 10px;
}

.mc-side-card__head {
  display: flex;
  gap: 9px;
  align-items: flex-start;
}

.mc-side-card__head strong {
  display: block;
  color: #0f172a;
  font-size: .93rem;
  font-weight: 950;
  text-transform: capitalize;
}

.mc-side-card__head small {
  display: block;
  margin-top: 2px;
  color: #64748b;
  font-size: .72rem;
  font-weight: 800;
}

.mc-side-empty {
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  padding: 11px;
  display: grid;
  gap: 8px;
  color: #64748b;
  font-size: .76rem;
  font-weight: 800;
}

.mc-side-empty button {
  width: fit-content;
  border: none;
  border-radius: 999px;
  background: #0f172a;
  color: white;
  padding: 7px 10px;
  font-size: .72rem;
  font-weight: 900;
  cursor: pointer;
}

.mc-side-event,
.mc-upcoming {
  min-width: 0;
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 17px;
  padding: 10px;
  display: grid;
  text-align: left;
  cursor: pointer;
}

.mc-side-event {
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}

.mc-side-event strong,
.mc-upcoming strong {
  min-width: 0;
  max-width: 100%;
  display: block;
  color: #0f172a;
  font-size: .8rem;
  font-weight: 950;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mc-side-event small,
.mc-upcoming small {
  min-width: 0;
  max-width: 100%;
  display: block;
  color: #64748b;
  font-size: .7rem;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mc-upcoming {
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 9px;
  align-items: center;
  background: #f8fafc;
}

.mc-upcoming > span:not(.mc-upcoming__icon),
.mc-side-event > strong {
  min-width: 0;
}

.mc-upcoming > span:not(.mc-upcoming__icon) {
  display: grid;
  gap: 2px;
}

.mc-upcoming__icon {
  width: 34px;
  height: 34px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  border: 1px solid #e2e8f0;
}


.mc-public-filter {
  border-bottom: 1px solid #e2e8f0;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
  background: #ffffff;
}

.mc-public-filter__label {
  color: #64748b;
  font-size: .7rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .06em;
  margin-right: 2px;
}

.mc-public-filter__chip {
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 6px 9px;
  color: #334155;
  background: #f8fafc;
  font-size: .7rem;
  font-weight: 920;
  white-space: nowrap;
  cursor: pointer;
  transition: .16s ease;
}

.mc-public-filter__chip:hover {
  transform: translateY(-1px);
}

.mc-public-filter__chip.is-active {
  border-color: #0f172a;
  box-shadow: inset 0 0 0 1.5px #0f172a;
  color: #0f172a;
}

.mc-public-filter__chip em {
  margin-left: 3px;
  color: #64748b;
  font-style: normal;
  font-weight: 950;
}

.mc-public-filter__chip.is-active em {
  color: #0f172a;
}

.mc-event-chip--competition,
.mc-list-event--competition,
.mc-side-event--competition,
.mc-upcoming__icon--competition,
.mc-public-filter__chip--competition {
  background: #fffbeb;
  border-color: #fde68a;
}

.mc-event-chip--olympiad,
.mc-list-event--olympiad,
.mc-side-event--olympiad,
.mc-upcoming__icon--olympiad,
.mc-public-filter__chip--olympiad {
  background: #ecfdf5;
  border-color: #bbf7d0;
}

.mc-event-chip--mun,
.mc-list-event--mun,
.mc-side-event--mun,
.mc-upcoming__icon--mun,
.mc-public-filter__chip--mun {
  background: #eef2ff;
  border-color: #c7d2fe;
}

.mc-event-chip--scholarship,
.mc-list-event--scholarship,
.mc-side-event--scholarship,
.mc-upcoming__icon--scholarship,
.mc-public-filter__chip--scholarship {
  background: #f5f3ff;
  border-color: #ddd6fe;
}

.mc-event-chip--summer,
.mc-list-event--summer,
.mc-side-event--summer,
.mc-upcoming__icon--summer,
.mc-public-filter__chip--summer {
  background: #f0f9ff;
  border-color: #bae6fd;
}

.mc-event-chip--workshop,
.mc-list-event--workshop,
.mc-side-event--workshop,
.mc-upcoming__icon--workshop,
.mc-public-filter__chip--workshop {
  background: #fdf2f8;
  border-color: #fbcfe8;
}

.mc-event-chip--volunteering,
.mc-list-event--volunteering,
.mc-side-event--volunteering,
.mc-upcoming__icon--volunteering,
.mc-public-filter__chip--volunteering {
  background: #f0fdfa;
  border-color: #99f6e4;
}

.mc-event-chip--extracurricular,
.mc-list-event--extracurricular,
.mc-side-event--extracurricular,
.mc-upcoming__icon--extracurricular,
.mc-public-filter__chip--extracurricular {
  background: #fff7ed;
  border-color: #fed7aa;
}

.mc-event-chip--initiative,
.mc-list-event--initiative,
.mc-side-event--initiative,
.mc-upcoming__icon--initiative,
.mc-public-filter__chip--initiative {
  background: #f7fee7;
  border-color: #d9f99d;
}

.mc-event-chip--post,
.mc-list-event--post,
.mc-side-event--post,
.mc-upcoming__icon--post,
.mc-public-filter__chip--post {
  background: #f8fafc;
  border-color: #e2e8f0;
}

@media (max-width: 1040px) {
  .mc-hero,
  .mc-layout {
    grid-template-columns: 1fr;
  }

  .mc-hero__actions {
    justify-content: flex-start;
  }

  .mc-sidebar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .mc-page {
    padding: 14px 10px 42px;
  }

  .mc-shell {
    width: 100%;
  }

  .mc-hero {
    gap: 14px;
    margin-bottom: 14px;
  }

  .mc-hero h1 {
    font-size: 2rem;
    letter-spacing: -.055em;
  }

  .mc-hero p {
    font-size: .9rem;
    line-height: 1.5;
  }

  .mc-hero__actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr;
  }

  .mc-btn {
    width: 100%;
    min-height: 42px;
  }

  .mc-topbar {
    align-items: stretch;
    gap: 10px;
  }

  .mc-month-nav,
  .mc-view-toggle {
    width: 100%;
    justify-content: center;
  }

  .mc-month-nav {
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr) 38px auto;
  }

  .mc-month-nav strong {
    min-width: 0;
    font-size: .96rem;
  }

  .mc-view-toggle button {
    flex: 1 1 0;
  }

  .mc-filter-row,
  .mc-public-filter {
    overflow-x: auto;
    flex-wrap: nowrap;
    scrollbar-width: none;
  }

  .mc-public-filter::-webkit-scrollbar {
    display: none;
  }

  .mc-public-filter__chip {
    flex: 0 0 auto;
  }

  .mc-filter-row {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 4px;
    scrollbar-width: none;
  }

  .mc-filter-row::-webkit-scrollbar {
    display: none;
  }

  .mc-filter {
    white-space: nowrap;
    flex: 0 0 auto;
  }

  .mc-layout {
    gap: 12px;
  }

  .mc-calendar-card,
  .mc-side-card {
    border-radius: 22px;
  }

  .mc-card-head {
    padding: 12px 14px;
  }

  .mc-weekdays {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }

  .mc-weekdays span {
    padding: 8px 0;
    text-align: center;
    font-size: .58rem;
    letter-spacing: .04em;
  }

  .mc-month-grid {
    width: 100%;
    max-width: 100%;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 0;
    padding: 0;
    background: white;
    overflow: hidden;
  }

  .mc-day {
    min-width: 0;
    min-height: clamp(50px, 12.5vw, 68px);
    border: 0;
    border-right: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
    border-radius: 0;
    padding: 5px 4px;
  }

  .mc-day:nth-child(7n) {
    border-right: none;
  }

  .mc-day--muted {
    display: block;
    background: #f8fafc;
    opacity: .62;
  }

  .mc-day--selected {
    box-shadow: inset 0 0 0 2px rgba(7, 146, 114, .26);
  }

  .mc-day__top {
    margin-bottom: 4px;
  }

  .mc-day__top > span {
    width: 23px;
    height: 23px;
    font-size: .7rem;
  }

  .mc-day__top button {
    width: 18px;
    height: 18px;
    font-size: .76rem;
  }

  .mc-day__events {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    align-items: center;
    min-height: 10px;
  }

  .mc-event-chip {
    width: 9px;
    height: 9px;
    min-width: 9px;
    border: none;
    border-radius: 999px;
    padding: 0;
    display: inline-block;
    overflow: hidden;
  }

  .mc-event-chip span,
  .mc-event-chip strong {
    display: none;
  }

  .mc-day__events small {
    font-size: .58rem;
    line-height: 1;
  }

  .mc-list-event {
    grid-template-columns: 1fr;
  }

  .mc-list-event__arrow {
    width: fit-content;
  }

  .mc-sidebar {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 430px) {
  .mc-page {
    padding-left: 6px;
    padding-right: 6px;
  }

  .mc-card-head {
    padding: 10px 12px;
  }

  .mc-card-head span {
    font-size: .7rem;
  }

  .mc-weekdays span {
    font-size: .52rem;
  }

  .mc-day {
    min-height: 48px;
    padding: 4px 3px;
  }

  .mc-day__top > span {
    width: 20px;
    height: 20px;
    font-size: .64rem;
  }

  .mc-day__top button {
    width: 17px;
    height: 17px;
  }
}

</style>