  <script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import UserCalendarEventModal from '~/components/UserCalendarEventModal.vue'
  import UserCalendarEventViewModal from '~/components/UserCalendarEventViewModal.vue'
  import UserCalendarSettingsModal from '~/components/UserCalendarSettingsModal.vue'
  import CalendarSaveModal from '~/components/CalendarSaveModal.vue'
  import CalendarActivitySelectorModal from '~/components/CalendarActivitySelectorModal.vue'

  useSeoMeta({ title: 'Minha rotina — seConecta' })

  type CalendarFilter = 'all' | 'personal' | 'seconecta'
  type CalendarView = 'month' | 'list'
  type PublicCategoryFilter = 'ALL' | string

  type RoutineTaskStatus = 'pending' | 'in_progress' | 'done'

  const { get, del, patch } = useAxios()

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
  const activeActivityIds = ref<string[]>([])
  const activitySearch = ref('')
  const exportFeedback = ref<string | null>(null)
  const activeView = ref<CalendarView>('month')
  const selectedDay = ref<Date | null>(new Date(today))

  const viewModalOpen = ref(false)
  const eventModalOpen = ref(false)
  const settingsModalOpen = ref(false)
  const saveModalOpen = ref(false)
  const savePreviewSnapshot = ref<any[]>([])
  const activitySelectorOpen = ref(false)
  const viewedEvent = ref<any | null>(null)
  const editingEvent = ref<any | null>(null)
  const modalInitialDate = ref<string | null>(null)

  let requestSeq = 0

  const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const FILTERS: Array<{ value: CalendarFilter; label: string; icon: string }> = [
    { value: 'all', label: 'Tudo', icon: '🗓️' },
    { value: 'personal', label: 'Minha rotina', icon: '✅' },
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
    const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return label.charAt(0).toUpperCase() + label.slice(1)
  }

  function fmtDay(date: Date | null) {
    if (!date) return ''
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  function fmtFullDay(date: Date | null) {
    if (!date) return ''
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  }

  function fmtEventTime(event: any) {
    if (event?.all_day) return 'Dia inteiro'
    const dt = parseDate(event?.starts_at)
    if (!dt) return ''
    return dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
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
        if (row?.opportunity) return { ...row.opportunity, saved: row.saved ?? null }
        return row
      })
      .filter((item: any) => item?.id || item?.opportunity_id)
  }

  function normalizeText(value: unknown) {
    if (value === null || value === undefined) return ''
    return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  }

  function normalizeTimelineKind(rawKind: unknown, event: any) {
    const explicitKind = normalizeText(rawKind).replaceAll('-', '_').replaceAll(' ', '_')
    if (TIMELINE_KIND_LABELS[explicitKind]) return explicitKind
    const text = normalizeText([event?.label, event?.details, event?.description, event?.title, event?.name].filter(Boolean).join(' '))
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
      } catch { timeline = [] }
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
    const raw = [opportunityId, event?.kind ?? 'other', event?.date ?? '', event?.label ?? event?.title ?? event?.details ?? ''].join('|')
    const slug = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 96)
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

  function getActivityKey(event: any) {
    const id = Number(event?.opportunity_id)
    if (!Number.isInteger(id) || id <= 0) return null
    return `opportunity:${id}`
  }

  function getActivityTitle(event: any) {
    return String(event?.opportunity?.title || getOpportunityForEvent(event)?.title || event?.source_snapshot?.opportunity_title || event?.title || 'Atividade vinculada')
  }

  function getActivityCategory(event: any) {
    return String(event?.opportunity_category || event?.opportunity?.category || getOpportunityForEvent(event)?.category || 'POST').toUpperCase()
  }

  function getActivityIcon(event: any) {
    if (event?.source_type === 'SECONNECTA_PUBLIC') return event?.source_snapshot?.category_icon || categoryMeta(event?.opportunity_category).icon
    const category = getActivityCategory(event)
    if (PUBLIC_CATEGORY_META[category]) return PUBLIC_CATEGORY_META[category].icon
    if (event?.source_type === 'OPPORTUNITY_PREP_TASK') return '🧩'
    if (event?.source_type === 'OPPORTUNITY_TIMELINE') return '⏰'
    return '🎯'
  }

  function toggleActivityFilter(key: string) {
    activeActivityIds.value = activeActivityIds.value.includes(key)
      ? activeActivityIds.value.filter((item) => item !== key)
      : [...activeActivityIds.value, key]
  }

  function clearActivityFilter() {
    activeActivityIds.value = []
    activitySearch.value = ''
  }

  function csvEscape(value: unknown) {
    if (value === null || value === undefined) return ''
    const text = String(value).replace(/\r?\n/g, ' ').trim()
    if (/[",;]/.test(text)) return `"${text.replace(/"/g, '""')}"`
    return text
  }

  function getEventDateLabel(event: any) {
    const dt = parseDate(event?.starts_at)
    return dt ? toDateInput(dt) : ''
  }

  function getEventTimeLabel(event: any) {
    if (event?.all_day) return 'Dia inteiro'
    return fmtEventTime(event)
  }

  function getOpportunitySlug(event: any) {
    return event?.opportunity_slug || event?.opportunity?.slug || event?.source_snapshot?.opportunity_slug || getOpportunityForEvent(event)?.slug || ''
  }

  function getInternalOpportunityUrl(event: any) {
    const slug = getOpportunitySlug(event)
    if (!slug || typeof window === 'undefined') return ''
    return `${window.location.origin}/oportunidade/${slug}`
  }

  function getExportRows() {
    return filteredEvents.value.map((event) => ({
      data: getEventDateLabel(event),
      horario: getEventTimeLabel(event),
      titulo: event?.title || '',
      fonte: getEventSourceLabel(event),
      importancia: event?.importance || '',
      categoria: event?.source_snapshot?.category_label || categoryMeta(getActivityCategory(event)).label,
      oportunidade: getActivityTitle(event),
      local: event?.location || getOpportunityForEvent(event)?.location || '',
      descricao: event?.description || '',
      link_seconecta: getInternalOpportunityUrl(event),
      link_oficial: event?.external_url || event?.opportunity?.official_site_url || getOpportunityForEvent(event)?.official_site_url || '',
    }))
  }

  function downloadTextFile(filename: string, content: string, type: string) {
    if (typeof window === 'undefined') return
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  function exportVisibleEventsCsv() {
    const rows = getExportRows()
    if (!rows.length) {
      exportFeedback.value = 'Não há eventos visíveis para exportar.'
      return
    }
    const headers = ['Data', 'Horário', 'Título', 'Fonte', 'Importância', 'Categoria', 'Oportunidade/atividade', 'Local', 'Descrição', 'Link seConecta', 'Link oficial']
    const body = rows.map((row) => [row.data, row.horario, row.titulo, row.fonte, row.importancia, row.categoria, row.oportunidade, row.local, row.descricao, row.link_seconecta, row.link_oficial].map(csvEscape).join(','))
    const filename = `seconecta-calendario-${toDateInput(currentMonth.value)}.csv`
    downloadTextFile(filename, `\uFEFF${headers.map(csvEscape).join(',')}\n${body.join('\n')}`, 'text/csv;charset=utf-8;')
    exportFeedback.value = 'Planilha CSV baixada. Você pode abrir/importar no Google Sheets.'
  }

  async function copyVisibleEventsForSheets() {
    const rows = getExportRows()
    if (!rows.length) {
      exportFeedback.value = 'Não há eventos visíveis para copiar.'
      return
    }
    const headers = ['Data', 'Horário', 'Título', 'Fonte', 'Categoria', 'Oportunidade/atividade', 'Local', 'Link seConecta', 'Link oficial']
    const table = [headers.join('\t'), ...rows.map((row) => [row.data, row.horario, row.titulo, row.fonte, row.categoria, row.oportunidade, row.local, row.link_seconecta, row.link_oficial].map((value) => String(value ?? '').replace(/\r?\n/g, ' ').trim()).join('\t'))].join('\n')
    try {
      await navigator.clipboard.writeText(table)
      exportFeedback.value = 'Copiado. Cole direto em uma planilha do Google Sheets.'
    } catch {
      exportFeedback.value = 'Não consegui copiar automaticamente. Use o CSV.'
    }
  }

  function printCalendarPdf() {
    if (typeof window === 'undefined') return
    window.print()
  }

  const monthLabel = computed(() => fmtMonth(currentMonth.value))
  const savedOpportunities = computed(() => savedOpportunityRows.value)
  const isPublicCalendar = computed(() => activeFilter.value === 'seconecta')

  const baseFilteredEvents = computed(() => {
    if (isPublicCalendar.value) {
      return [...publicEvents.value]
        .filter((event) => event?.status !== 'HIDDEN')
        .filter((event) => {
          if (activePublicCategory.value === 'ALL') return true
          return String(event?.opportunity_category || 'POST').toUpperCase() === activePublicCategory.value
        })
        .sort((a, b) => (parseDate(a.starts_at)?.getTime() ?? 0) - (parseDate(b.starts_at)?.getTime() ?? 0))
    }
    return [...events.value]
      .filter((event) => event?.status !== 'HIDDEN')
      .filter((event) => {
        if (activeFilter.value === 'all') return true
        if (activeFilter.value === 'personal') return event.source_type !== 'OPPORTUNITY_TIMELINE'
        return true
      })
      .sort((a, b) => (parseDate(a.starts_at)?.getTime() ?? 0) - (parseDate(b.starts_at)?.getTime() ?? 0))
  })

  const allActivityOptions = computed(() => {
    const map = new Map<string, { key: string; title: string; icon: string; category: string; count: number }>()
    for (const event of baseFilteredEvents.value) {
      const key = getActivityKey(event)
      if (!key) continue
      const current = map.get(key)
      if (current) { current.count += 1; continue }
      map.set(key, { key, title: getActivityTitle(event), icon: getActivityIcon(event), category: getActivityCategory(event), count: 1 })
    }
    return [...map.values()].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
  })

  const activityOptions = computed(() => {
    const query = normalizeText(activitySearch.value)
    if (!query) return allActivityOptions.value
    return allActivityOptions.value.filter((item) => normalizeText(`${item.title} ${item.category}`).includes(query))
  })

  const filteredEvents = computed(() => {
    const selected = new Set(activeActivityIds.value)
    const query = normalizeText(activitySearch.value)
    return baseFilteredEvents.value.filter((event) => {
      const key = getActivityKey(event)
      const selectedMatch = activeActivityIds.value.length === 0 || (key ? selected.has(key) : false)
      if (!selectedMatch) return false
      if (!query) return true
      const searchable = normalizeText([event?.title, event?.description, getActivityTitle(event), getActivityCategory(event), getEventSourceLabel(event)].filter(Boolean).join(' '))
      return searchable.includes(query)
    })
  })

  const publicCategoryFilters = computed(() => {
    const counts = new Map<string, number>()
    for (const event of publicEvents.value) {
      const category = String(event?.opportunity_category || 'POST').toUpperCase()
      counts.set(category, (counts.get(category) || 0) + 1)
    }
    return Object.entries(PUBLIC_CATEGORY_META)
      .map(([category, meta]) => ({ category, ...meta, count: counts.get(category) || 0 }))
      .filter((item) => item.count > 0)
  })

  const activePublicCategoryLabel = computed(() => {
    if (activePublicCategory.value === 'ALL') return 'Todos os tipos'
    return publicCategoryFilters.value.find((item) => item.category === activePublicCategory.value)?.label ?? 'Tipo selecionado'
  })

  const activeActivityLabel = computed(() => {
    if (activeActivityIds.value.length === 0) return 'Todas as atividades'
    if (activeActivityIds.value.length === 1) {
      const selected = allActivityOptions.value.find((item) => item.key === activeActivityIds.value[0])
      return selected?.title ?? '1 atividade selecionada'
    }
    return `${activeActivityIds.value.length} atividades selecionadas`
  })

  const saveScopeLabel = computed(() => {
    if (isPublicCalendar.value) return `Calendário seConecta · ${activePublicCategoryLabel.value} · ${activeActivityLabel.value}`
    return `${activeFilter.value === 'personal' ? 'Minha rotina' : 'Tudo'} · ${activeActivityLabel.value}`
  })

  function buildSavePreviewItem(event: any) {
    return {
      id: String(event?.id || `${event?.starts_at || ''}-${event?.title || ''}`),
      data: getEventDateLabel(event),
      horario: getEventTimeLabel(event),
      titulo: event?.title || '',
      fonte: getEventSourceLabel(event),
      importancia: event?.importance || '',
      categoria: event?.source_snapshot?.category_label || categoryMeta(getActivityCategory(event)).label,
      oportunidade: getActivityTitle(event),
      local: event?.location || getOpportunityForEvent(event)?.location || '',
      descricao: event?.description || '',
      link_seconecta: getInternalOpportunityUrl(event),
      link_oficial: event?.external_url || event?.opportunity?.official_site_url || getOpportunityForEvent(event)?.official_site_url || '',
      icon: getEventIcon(event),
      tone: getEventTone(event),
    }
  }

  function openSaveModal() {
    savePreviewSnapshot.value = filteredEvents.value.map(buildSavePreviewItem)
    saveModalOpen.value = true
  }

  const dailyRoutineTasks = computed(() => {
    return selectedDayEvents.value.map((event) => {
      const title = event?.title || 'Tarefa'
      // Tarefa concluída apenas se task_completed for true; caso contrário, usa status (fallback)
      const isDone = event?.task_completed !== undefined 
        ? event.task_completed === true 
        : event?.status === 'DONE'

      const status: RoutineTaskStatus = isDone
        ? 'done'
        : event?.importance === 'HIGH' || event?.importance === 'CRITICAL'
          ? 'in_progress'
          : 'pending'

      return { id: String(event?.id), title, subtitle: getEventSourceLabel(event), time: fmtEventTime(event), tone: getEventTone(event), status, event }
    })
  })

  const selectedDayProgress = computed(() => {
    if (dailyRoutineTasks.value.length === 0) return 0
    const done = dailyRoutineTasks.value.filter((task) => task.status === 'done').length
    return Math.round((done / dailyRoutineTasks.value.length) * 100)
  })

  const selectedDayPendingCount = computed(() => {
    return dailyRoutineTasks.value.filter((task) => task.status !== 'done').length
  })

  const calendarDays = computed(() => {
    const { start, paddedStart, paddedEnd } = getMonthRange(currentMonth.value)
    const days: Array<{ date: Date; key: string; inMonth: boolean; isToday: boolean; events: any[]; completedCount: number }> = []
    const cursor = new Date(paddedStart)
    while (cursor <= paddedEnd) {
      const day = new Date(cursor)
      const dayEvents = filteredEvents.value.filter((event) => {
        const eventDate = parseDate(event.starts_at)
        return eventDate ? sameDay(eventDate, day) : false
      })
      days.push({ date: day, key: toDateInput(day), inMonth: day.getMonth() === start.getMonth(), isToday: sameDay(day, today), events: dayEvents, completedCount: dayEvents.filter((event) => event?.status === 'DONE').length })
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
    return filteredEvents.value.filter((event) => {
      const date = parseDate(event.starts_at)
      return date ? date >= today : false
    }).slice(0, 5)
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
      const res = await get('/users/me/calendar/events', { params: { start: paddedStart.toISOString(), end: paddedEnd.toISOString(), include_hidden: true, limit: 500 } })
      if (seq !== requestSeq) return
      const payload = extractData(res)
      events.value = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []
    } catch (err: any) {
      if (seq !== requestSeq) return
      error.value = getErrorMessage(err, 'Não foi possível carregar sua rotina.')
    } finally {
      if (seq === requestSeq) loading.value = false
    }
  }

  async function fetchSavedOpportunities() {
    try {
      const res = await get('/users/me/saved-opportunities', { params: { limit: 200 } })
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
        const res = await get('/opportunity/cards', { params: { page, limit } })
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
    if (!confirm('Remover este item da sua rotina?')) return
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
    await Promise.allSettled([fetchCalendarEvents(), fetchSavedOpportunities()])
  }

  function handleViewEdit(event: any) { openEditModal(event) }
  async function handleViewDelete(event: any) { await deleteEvent(event) }
  function handleSettingsSaved() { settingsModalOpen.value = false }

  // CORRECTED: toggles task_completed if it exists; otherwise initializes to true (marking as done)
  // Replace the current toggleTaskDone function with this:
  async function toggleTaskDone(task: any) {
    if (!task?.event?.id) return
    const ev = task.event

    const isPublic = ev.source_type === 'SECONNECTA_PUBLIC'
    if (isPublic) return // Public events are read-only; nothing to persist

    const newCompleted = Object.prototype.hasOwnProperty.call(ev, 'task_completed')
      ? !ev.task_completed
      : true

    // Optimistic update — keep the UI snappy
    events.value = events.value.map((e: any) =>
      e.id === ev.id ? { ...e, task_completed: newCompleted } : e
    )

    try {
      await patch(`/users/me/calendar/events/${ev.id}`, { task_completed: newCompleted })
    } catch (err: any) {
      // Rollback on failure
      events.value = events.value.map((e: any) =>
        e.id === ev.id ? { ...e, task_completed: !newCompleted } : e
      )
      error.value = getErrorMessage(err, 'Não foi possível atualizar o status da tarefa.')
    }
  }

  watch(
    () => events.value.map(e => ({ id: e.id, tc: e.task_completed })),
    (val) => console.log('events mutated:', val),
    { deep: false }
  )

  watch(activeFilter, (value) => {
    if (value !== 'seconecta') activePublicCategory.value = 'ALL'
  })

  watch([activeFilter, activePublicCategory], () => { clearActivityFilter() })

  watch(allActivityOptions, (items) => {
    if (activeActivityIds.value.length === 0) return
    const available = new Set(items.map((item) => item.key))
    activeActivityIds.value = activeActivityIds.value.filter((key) => available.has(key))
  })

  watch(publicCategoryFilters, (items) => {
    if (activePublicCategory.value === 'ALL') return
    const stillExists = items.some((item) => item.category === activePublicCategory.value)
    if (!stillExists) activePublicCategory.value = 'ALL'
  })

  watch(currentMonth, () => {
    clearActivityFilter()
    fetchCalendarEvents()
    fetchPublicCalendarEvents()
  })

  onMounted(async () => {
    await Promise.allSettled([fetchCalendarEvents(), fetchSavedOpportunities(), fetchPublicCalendarEvents()])
  })
  </script>

  <template>
    <main class="mc-page">
      <section class="mc-shell">

        <!-- ── HEADER ── -->
        <header class="mc-hero">
          <div class="mc-hero__copy">
            <span class="mc-eyebrow">Minha rotina</span>
            <h1>Calendário de atividades</h1>
            <p>Adicione, edite e personalize atividades que você quer acompanhar.</p>
          </div>
          <div class="mc-hero__actions">
            <button type="button" class="mc-btn mc-btn--ghost" @click="settingsModalOpen = true">
              ⚙️ Alertas
            </button>
            <button type="button" class="mc-btn mc-btn--primary" @click="openCreateModal()">
              ＋ Nova atividade
            </button>
          </div>
        </header>

        <!-- ── DAILY SUMMARY ── -->
        <section class="mc-routine-summary">
          <div class="mc-summary-card mc-summary-card--main">
            <div class="mc-summary-card__head">
              <div class="mc-summary-card__head-text">
                <strong>{{ selectedDay ? fmtFullDay(selectedDay) : 'Hoje' }}</strong>
                <span>{{ selectedDayEvents.length }} item{{ selectedDayEvents.length === 1 ? '' : 's' }} na sua rotina</span>
              </div>
              <button type="button" class="mc-summary-add" @click="openCreateModal(selectedDay || today)">
                + Adicionar
              </button>
            </div>

            <div class="mc-summary-progress">
              <div class="mc-summary-progress__bar">
                <span :style="{ width: `${selectedDayProgress}%` }"></span>
              </div>
              <p>{{ selectedDayPendingCount }} pendente{{ selectedDayPendingCount === 1 ? '' : 's' }} · {{ selectedDayProgress }}% concluído</p>
            </div>

            <div v-if="dailyRoutineTasks.length === 0" class="mc-summary-empty">
              Sem itens neste dia. Você pode adicionar uma atividade e voltar para cá depois.
            </div>

            <div v-else class="mc-routine-list">
              <button
                v-for="task in dailyRoutineTasks"
                :key="task.id + task.status"
                type="button"
                :class="['mc-routine-task', `mc-routine-task--${task.tone}`, `mc-routine-task--${task.status}`]"
                @click="openViewModal(task.event)"
              >
                <span class="mc-routine-task__check" @click.stop="toggleTaskDone(task)">
                  <span v-if="task.status === 'done'">✓</span>
                </span>
                <span class="mc-routine-task__body">
                  <strong>{{ task.title }}</strong>
                  <small>{{ task.time || task.subtitle }}</small>
                </span>
                <span class="mc-routine-task__status">
                  {{ task.status === 'done' ? 'Feito' : task.status === 'in_progress' ? 'Em andamento' : 'Pendente' }}
                </span>
              </button>
            </div>
          </div>
        </section>

        <!-- ── EXPORT FEEDBACK ── -->
        <p v-if="exportFeedback" class="mc-export-feedback" role="status">
          {{ exportFeedback }}
        </p>

        <!-- ── MONTH NAV + VIEW TOGGLE ── -->
        <section class="mc-topbar">
          <div class="mc-month-nav" aria-label="Navegação por mês">
            <button type="button" aria-label="Mês anterior" @click="previousMonth">‹</button>
            <strong>{{ monthLabel }}</strong>
            <button type="button" aria-label="Próximo mês" @click="nextMonth">›</button>
            <button type="button" class="mc-today" @click="goToday">Hoje</button>
          </div>

          <div class="mc-view-toggle" aria-label="Modo de visualização">
            <button type="button" :class="activeView === 'month' ? 'is-active' : ''" @click="activeView = 'month'">Mês</button>
            <button type="button" :class="activeView === 'list' ? 'is-active' : ''" @click="activeView = 'list'">Lista</button>
          </div>
        </section>

        <!-- ── SOURCE FILTERS ── -->
        <section class="mc-filter-row" aria-label="Filtros do calendário">
          <button
            v-for="filter in FILTERS"
            :key="filter.value"
            type="button"
            :class="['mc-filter', activeFilter === filter.value ? 'is-active' : '']"
            @click="activeFilter = filter.value"
          >
            <span aria-hidden="true">{{ filter.icon }}</span>
            {{ filter.label }}
          </button>
        </section>

        <p v-if="error" class="mc-error" role="alert">{{ error }}</p>

        <!-- ── MAIN LAYOUT: CALENDAR + SIDEBAR ── -->
        <section class="mc-layout">

          <!-- CALENDAR CARD -->
          <div class="mc-calendar-card">

            <!-- Card header -->
            <div class="mc-card-head">
              <div class="mc-card-head__info">
                <strong v-if="isPublicCalendar">Calendário seConecta · {{ stats.total }} data{{ stats.total === 1 ? '' : 's' }}</strong>
                <strong v-else>{{ stats.total }} item{{ stats.total === 1 ? '' : 's' }}</strong>
                <span v-if="isPublicCalendar">{{ activePublicCategoryLabel }} · {{ activeActivityLabel }}.</span>
                <span v-else>{{ activeFilter === 'personal' ? 'Sua rotina pessoal' : 'Tudo o que está visível' }} · {{ activeActivityLabel }}.</span>
              </div>
              <div class="mc-export-actions">
                <button type="button" class="mc-save-calendar-btn" @click="openSaveModal">
                  💾 Salvar
                </button>
              </div>
            </div>

            <!-- Public category filters -->
            <div v-if="isPublicCalendar && publicCategoryFilters.length > 0" class="mc-public-filter" aria-label="Filtrar calendário seConecta por tipo">
              <span class="mc-public-filter__label">Tipo</span>
              <button type="button" :class="['mc-public-filter__chip', activePublicCategory === 'ALL' ? 'is-active' : '']" @click="activePublicCategory = 'ALL'">
                ✨ Todos <em>{{ publicEvents.length }}</em>
              </button>
              <button
                v-for="item in publicCategoryFilters"
                :key="item.category"
                type="button"
                :class="['mc-public-filter__chip', `mc-public-filter__chip--${item.tone}`, activePublicCategory === item.category ? 'is-active' : '']"
                @click="activePublicCategory = item.category"
              >
                {{ item.icon }} {{ item.label }} <em>{{ item.count }}</em>
              </button>
            </div>

            <!-- Activity search / filter -->
            <div v-if="allActivityOptions.length > 0" class="mc-activity-filter" aria-label="Filtrar por atividade específica">
              <div class="mc-activity-filter__top">
                <span class="mc-public-filter__label">Atividade</span>
                <div class="mc-activity-search-box">
                  <input
                    v-model="activitySearch"
                    type="search"
                    placeholder="Buscar atividade ou oportunidade..."
                    aria-label="Buscar atividade no calendário"
                  >
                  <button
                    type="button"
                    class="mc-activity-picker-button"
                    aria-label="Selecionar oportunidades ou olimpíadas específicas"
                    @click="activitySelectorOpen = true"
                  >
                    🎯
                    <em v-if="activeActivityIds.length > 0">{{ activeActivityIds.length }}</em>
                  </button>
                </div>
                <button v-if="activeActivityIds.length > 0 || activitySearch" type="button" class="mc-activity-clear" @click="clearActivityFilter">
                  Limpar
                </button>
              </div>
              <p v-if="activeActivityIds.length > 0" class="mc-activity-summary">
                {{ activeActivityLabel }}.
              </p>
            </div>

            <!-- Loading -->
            <div v-if="loading || (isPublicCalendar && publicLoading)" class="mc-loading">
              {{ isPublicCalendar ? 'Carregando rotina seConecta...' : 'Carregando sua rotina...' }}
            </div>

            <!-- Month view -->
            <template v-else-if="activeView === 'month'">
              <div class="mc-weekdays" role="row">
                <span v-for="day in WEEKDAYS" :key="day" role="columnheader">{{ day }}</span>
              </div>
              <div class="mc-month-grid" role="grid">
                <article
                  v-for="day in calendarDays"
                  :key="day.key"
                  :class="['mc-day', !day.inMonth && 'mc-day--muted', day.isToday && 'mc-day--today', selectedDay && sameDay(day.date, selectedDay) && 'mc-day--selected']"
                  @click="selectedDay = day.date"
                >
                  <div class="mc-day__top">
                    <span>{{ day.date.getDate() }}</span>
                    <button type="button" aria-label="Adicionar atividade neste dia" @click.stop="openCreateModal(day.date)">+</button>
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
                      <span aria-hidden="true">{{ getEventIcon(event) }}</span>
                      <strong>{{ event.title }}</strong>
                    </button>
                    <small v-if="day.events.length > 2">+{{ day.events.length - 2 }} outro{{ day.events.length - 2 === 1 ? '' : 's' }}</small>
                  </div>
                </article>
              </div>
            </template>

            <!-- List view -->
            <template v-else>
              <div v-if="filteredEvents.length === 0" class="mc-empty">
                <strong>{{ isPublicCalendar ? 'Nenhuma data pública neste mês.' : 'Nenhum item neste mês.' }}</strong>
                <p>{{ isPublicCalendar ? 'As datas públicas aparecem quando oportunidades verificadas têm itens de timeline marcados para calendário.' : 'Crie uma atividade ou salve uma data de uma oportunidade.' }}</p>
                <button v-if="!isPublicCalendar" type="button" class="mc-btn mc-btn--primary" @click="openCreateModal()">Criar atividade</button>
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
                    <em v-if="event.opportunity_id">{{ getOpportunityForEvent(event)?.title || 'Oportunidade vinculada' }}</em>
                  </span>
                  <span class="mc-list-event__arrow">Ver</span>
                </button>
              </div>
            </template>
          </div>

          <!-- SIDEBAR -->
          <aside class="mc-sidebar">
            <section class="mc-side-card">
              <div class="mc-side-card__head">
                <span aria-hidden="true">⚡</span>
                <div>
                  <strong>Ações rápidas</strong>
                  <small>Atalhos da sua rotina</small>
                </div>
              </div>
              <div class="mc-side-actions">
                <button type="button" class="mc-side-action" @click="openSaveModal">💾 Salvar seleção</button>
                <button type="button" class="mc-side-action" @click="printCalendarPdf">🖨️ Imprimir / PDF</button>
                <button type="button" class="mc-side-action mc-side-action--primary" @click="openCreateModal(selectedDay || today)">＋ Adicionar hoje</button>
              </div>
            </section>

            <section class="mc-side-card">
              <div class="mc-side-card__head">
                <span aria-hidden="true">⏭️</span>
                <div>
                  <strong>Próximos</strong>
                  <small>Filtro atual</small>
                </div>
              </div>
              <div v-if="upcomingEvents.length === 0" class="mc-side-empty">Nada próximo por aqui.</div>
              <button
                v-for="event in upcomingEvents"
                :key="event.id"
                type="button"
                class="mc-upcoming"
                @click="openViewModal(event)"
              >
                <span :class="['mc-upcoming__icon', `mc-upcoming__icon--${getEventTone(event)}`]" aria-hidden="true">{{ getEventIcon(event) }}</span>
                <span>
                  <strong>{{ event.title }}</strong>
                  <small>{{ fmtDay(parseDate(event.starts_at)) }} · {{ getEventSourceLabel(event) }}</small>
                </span>
              </button>
            </section>
          </aside>

        </section>
      </section>

      <!-- MODALS -->
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
      <UserCalendarSettingsModal v-model:open="settingsModalOpen" @saved="handleSettingsSaved" />
      <CalendarSaveModal
        v-model:open="saveModalOpen"
        :events-count="savePreviewSnapshot.length"
        :month-label="monthLabel"
        :scope-label="saveScopeLabel"
        :items="savePreviewSnapshot"
      />
      <CalendarActivitySelectorModal
        v-model:open="activitySelectorOpen"
        v-model:selected-ids="activeActivityIds"
        :activities="allActivityOptions"
      />
    </main>
  </template>

  <style scoped>
  /* ── RESET ── */
  .mc-page,
  .mc-page * {
    box-sizing: border-box;
  }

  /* ── PAGE BACKGROUND ── */
  .mc-page {
    min-height: 100vh;
    overflow-x: hidden;
    padding: 28px clamp(14px, 3vw, 40px) 56px;
    background:
      radial-gradient(ellipse 60% 40% at top left, rgba(7, 146, 114, .09), transparent),
      linear-gradient(180deg, #f4f8f6 0%, #ffffff 40%);
  }

  .mc-shell {
    width: min(1200px, 100%);
    max-width: 100%;
    min-width: 0;
    margin: 0 auto;
  }

  /* ── HERO ── */
  .mc-hero {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 20px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .mc-eyebrow {
    display: inline-flex;
    margin-bottom: 6px;
    color: #079272;
    font-size: .68rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .12em;
  }

  .mc-hero h1 {
    margin: 0;
    color: #0f172a;
    font-size: clamp(2rem, 4vw, 3.4rem);
    line-height: .96;
    letter-spacing: -.06em;
    font-weight: 900;
  }

  .mc-hero p {
    max-width: 540px;
    margin: 10px 0 0;
    color: #64748b;
    font-size: .92rem;
    line-height: 1.6;
  }

  .mc-hero__actions {
    display: flex;
    align-items: center;
    gap: 9px;
    flex-shrink: 0;
  }

  /* ── BUTTONS (shared) ── */
  .mc-btn {
    border-radius: 999px;
    padding: 10px 18px;
    font-size: .82rem;
    font-weight: 800;
    cursor: pointer;
    transition: transform .16s ease, box-shadow .16s ease;
    white-space: nowrap;
    border: 1px solid transparent;
  }

  .mc-btn:hover { transform: translateY(-1px); }
  .mc-btn:active { transform: translateY(0); }

  .mc-btn--primary {
    background: #079272;
    color: white;
    border-color: #079272;
    box-shadow: 0 6px 20px rgba(7, 146, 114, .22);
  }

  .mc-btn--primary:hover {
    background: #058060;
    box-shadow: 0 10px 28px rgba(7, 146, 114, .28);
  }

  .mc-btn--ghost {
    background: white;
    color: #475569;
    border-color: #e2e8f0;
  }

  .mc-btn--ghost:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
  }

  /* ── EXPORT FEEDBACK ── */
  .mc-export-feedback {
    border: 1px solid #bbf7d0;
    border-radius: 12px;
    padding: 10px 14px;
    background: #f0fdf4;
    color: #166534;
    font-size: .82rem;
    font-weight: 700;
    margin: 0 0 14px;
  }

  /* ── ROUTINE SUMMARY ── */
  .mc-routine-summary {
    margin-bottom: 20px;
  }

  .mc-summary-card {
    border: 1px solid #e2e8f0;
    border-radius: 24px;
    background: white;
    box-shadow: 0 4px 24px rgba(15, 23, 42, .06);
  }

  .mc-summary-card--main {
    padding: 20px;
  }

  .mc-summary-card__head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 14px;
  }

  /* FIX: removed text-transform: capitalize that was mangling date strings */
  .mc-summary-card__head-text strong {
    display: block;
    color: #0f172a;
    font-size: 1rem;
    font-weight: 800;
  }

  .mc-summary-card__head-text span {
    display: block;
    margin-top: 3px;
    color: #64748b;
    font-size: .78rem;
    font-weight: 700;
  }

  .mc-summary-add {
    flex-shrink: 0;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    padding: 8px 14px;
    background: white;
    color: #475569;
    font-size: .78rem;
    font-weight: 800;
    cursor: pointer;
    transition: .16s ease;
    white-space: nowrap;
  }

  .mc-summary-add:hover {
    border-color: #079272;
    color: #079272;
    transform: translateY(-1px);
  }

  .mc-summary-progress {
    display: grid;
    gap: 7px;
    margin-bottom: 16px;
  }

  .mc-summary-progress__bar {
    width: 100%;
    height: 6px;
    border-radius: 999px;
    background: #e2e8f0;
    overflow: hidden;
  }

  .mc-summary-progress__bar span {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #079272, #065f46);
    transition: width .4s ease;
  }

  .mc-summary-progress p {
    margin: 0;
    color: #64748b;
    font-size: .74rem;
    font-weight: 700;
  }

  .mc-summary-empty {
    border: 1px dashed #cbd5e1;
    border-radius: 16px;
    padding: 14px 16px;
    color: #94a3b8;
    font-size: .8rem;
    font-weight: 700;
    text-align: center;
  }

  .mc-routine-list {
    display: grid;
    gap: 8px;
  }

  .mc-routine-task {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 11px 14px;
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    text-align: left;
    background: #f8fafc;
    cursor: pointer;
    transition: background .14s ease, border-color .14s ease;
  }

  .mc-routine-task:hover { border-color: #cbd5e1; background: white; }

  .mc-routine-task__check {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 2px solid #cbd5e1;
    background: white;
    color: white;
    font-size: .78rem;
    font-weight: 800;
    cursor: pointer;
    transition: .16s ease;
  }

  .mc-routine-task--done .mc-routine-task__check {
    background: #079272;
    border-color: #079272;
  }

  .mc-routine-task__body {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .mc-routine-task__body strong {
    display: block;
    color: #0f172a;
    font-size: .84rem;
    font-weight: 800;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mc-routine-task--done .mc-routine-task__body strong {
    text-decoration: line-through;
    color: #94a3b8;
  }

  .mc-routine-task__body small {
    display: block;
    color: #94a3b8;
    font-size: .72rem;
    font-weight: 700;
  }

  .mc-routine-task__status {
    flex-shrink: 0;
    border-radius: 999px;
    padding: 4px 10px;
    background: #f1f5f9;
    color: #64748b;
    font-size: .68rem;
    font-weight: 800;
    white-space: nowrap;
  }

  .mc-routine-task--in_progress .mc-routine-task__status {
    background: #fffbeb;
    color: #92400e;
  }

  .mc-routine-task--done .mc-routine-task__status {
    background: #f0fdf4;
    color: #166534;
  }

  /* ── TOP BAR ── */
  .mc-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  .mc-month-nav {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .mc-month-nav button {
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    padding: 7px 12px;
    background: white;
    color: #475569;
    font-size: .8rem;
    font-weight: 800;
    cursor: pointer;
    transition: .16s ease;
  }

  .mc-month-nav button:not(.mc-today) {
    width: 34px;
    height: 34px;
    padding: 0;
    display: grid;
    place-items: center;
    font-size: 1.1rem;
  }

  .mc-month-nav button:hover { border-color: #cbd5e1; transform: translateY(-1px); }

  .mc-month-nav strong {
    min-width: 160px;
    color: #0f172a;
    font-size: 1rem;
    font-weight: 800;
    text-align: center;
  }

  .mc-view-toggle {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 3px;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    background: white;
  }

  .mc-view-toggle button {
    border: none;
    border-radius: 999px;
    padding: 7px 14px;
    background: transparent;
    color: #64748b;
    font-size: .78rem;
    font-weight: 800;
    cursor: pointer;
    transition: .16s ease;
  }

  .mc-view-toggle button.is-active {
    background: #0f172a;
    color: white;
  }

  /* ── SOURCE FILTER PILLS ── */
  .mc-filter-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }

  /* FIX: emoji inside filter buttons was getting a colored background due to 
    the icon <span> inheriting the button's active background. Scoped it. */
  .mc-filter {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    padding: 8px 14px;
    background: white;
    color: #475569;
    font-size: .8rem;
    font-weight: 800;
    cursor: pointer;
    transition: .16s ease;
  }

  .mc-filter:hover { border-color: #cbd5e1; transform: translateY(-1px); }

  .mc-filter.is-active {
    background: #0f172a;
    border-color: #0f172a;
    color: white;
  }

  /* FIX: emoji spans inside active filter had inherited background showing as 
    a colored rectangle. Explicitly neutral them. */
  .mc-filter span {
    display: inline-flex;
    align-items: center;
    background: none !important;
    line-height: 1;
  }

  /* ── ERROR ── */
  .mc-error {
    border: 1px solid #fecaca;
    border-radius: 14px;
    padding: 11px 14px;
    background: #fef2f2;
    color: #b91c1c;
    font-size: .82rem;
    font-weight: 700;
    margin: 0 0 16px;
  }

  /* ── MAIN LAYOUT ── */
  /* FIX: was missing grid-template-columns — sidebar never appeared on desktop */
  .mc-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 270px;
    gap: 20px;
    align-items: start;
  }

  /* ── CALENDAR CARD ── */
  /* FIX: mc-calendar-card and mc-side-card were missing border/bg/radius */
  .mc-calendar-card {
    border: 1px solid #e2e8f0;
    border-radius: 24px;
    background: white;
    box-shadow: 0 4px 24px rgba(15, 23, 42, .06);
    overflow: hidden;
    min-width: 0;
  }

  /* ── CARD HEADER ── */
  /* FIX: mc-card-head was not styled as a flex row; text + button were collapsing */
  .mc-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 18px;
    border-bottom: 1px solid #f1f5f9;
  }

  .mc-card-head__info {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .mc-card-head__info strong {
    color: #0f172a;
    font-size: .92rem;
    font-weight: 800;
  }

  .mc-card-head__info span {
    color: #94a3b8;
    font-size: .76rem;
    font-weight: 700;
  }

  .mc-export-actions {
    flex-shrink: 0;
  }

  .mc-save-calendar-btn {
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    padding: 7px 13px;
    background: white;
    color: #475569;
    font-size: .76rem;
    font-weight: 800;
    cursor: pointer;
    transition: .16s ease;
    white-space: nowrap;
  }

  .mc-save-calendar-btn:hover {
    border-color: #079272;
    color: #079272;
    transform: translateY(-1px);
  }

  /* ── PUBLIC CATEGORY FILTER ── */
  .mc-public-filter {
    padding: 10px 16px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
    background: #fafbfc;
  }

  .mc-public-filter__label {
    color: #94a3b8;
    font-size: .68rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .08em;
    white-space: nowrap;
  }

  .mc-public-filter__chip {
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    padding: 5px 11px;
    background: white;
    color: #475569;
    font-size: .72rem;
    font-weight: 800;
    cursor: pointer;
    transition: .14s ease;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .mc-public-filter__chip:hover { transform: translateY(-1px); border-color: #cbd5e1; }

  .mc-public-filter__chip.is-active {
    border-color: #0f172a;
    background: #0f172a;
    color: white;
  }

  .mc-public-filter__chip em {
    font-style: normal;
    font-weight: 800;
    color: #94a3b8;
  }

  .mc-public-filter__chip.is-active em { color: rgba(255,255,255,.6); }

  /* ── ACTIVITY FILTER ── */
  .mc-activity-filter {
    padding: 10px 16px 12px;
    border-bottom: 1px solid #f1f5f9;
    background: #fafbfc;
  }

  /* FIX: was 3-col grid (auto 1fr auto) but label being "auto" on mobile made it too cramped.
    Now flex row so it wraps gracefully. */
  .mc-activity-filter__top {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .mc-activity-search-box {
    flex: 1 1 180px;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .mc-activity-search-box input {
    flex: 1;
    min-width: 0;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    padding: 8px 13px;
    background: white;
    color: #0f172a;
    font: inherit;
    font-size: .78rem;
    font-weight: 700;
    outline: none;
    transition: border-color .14s ease, box-shadow .14s ease;
  }

  .mc-activity-search-box input:focus {
    border-color: #079272;
    box-shadow: 0 0 0 3px rgba(7, 146, 114, .1);
  }

  .mc-activity-picker-button {
    position: relative;
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border: 1px solid #dbeafe;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: #eff6ff;
    cursor: pointer;
    transition: .14s ease;
    font-size: .9rem;
  }

  .mc-activity-picker-button:hover { border-color: #93c5fd; transform: translateY(-1px); }

  .mc-activity-picker-button em {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 16px;
    height: 16px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    background: #0f172a;
    color: white;
    font-size: .6rem;
    font-style: normal;
    font-weight: 800;
    padding: 0 3px;
  }

  .mc-activity-clear {
    flex-shrink: 0;
    border: none;
    border-radius: 999px;
    padding: 7px 11px;
    background: #f1f5f9;
    color: #64748b;
    font-size: .72rem;
    font-weight: 800;
    cursor: pointer;
    transition: .14s ease;
  }

  .mc-activity-clear:hover { background: #e2e8f0; }

  .mc-activity-summary {
    margin: 6px 0 0;
    color: #94a3b8;
    font-size: .72rem;
    font-weight: 700;
  }

  /* ── LOADING / EMPTY ── */
  .mc-loading,
  .mc-empty {
    min-height: 320px;
    display: grid;
    place-items: center;
    text-align: center;
    color: #94a3b8;
    padding: 32px;
    gap: 6px;
  }

  .mc-empty strong {
    display: block;
    color: #0f172a;
    font-size: .96rem;
    font-weight: 800;
  }

  .mc-empty p { margin: 6px 0 14px; font-size: .84rem; }

  /* ── WEEKDAY HEADER ── */
  .mc-weekdays {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  .mc-weekdays span {
    padding: 10px 0;
    color: #94a3b8;
    font-size: .66rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .08em;
    text-align: center;
  }

  /* ── MONTH GRID ── */
  .mc-month-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }

  .mc-day {
    min-height: 110px;
    border-right: 1px solid #f1f5f9;
    border-bottom: 1px solid #f1f5f9;
    padding: 8px;
    background: white;
    cursor: pointer;
    transition: background .12s ease;
  }

  .mc-day:nth-child(7n) { border-right: none; }
  .mc-day:hover { background: #f8fafc; }

  .mc-day--muted { background: #fbfcfd; }
  .mc-day--muted .mc-day__top > span { color: #cbd5e1; }

  .mc-day--today .mc-day__top > span {
    background: #079272;
    color: white;
  }

  .mc-day--selected { background: #f0fdfa !important; }

  .mc-day__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }

  .mc-day__top > span {
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: #334155;
    font-size: .76rem;
    font-weight: 800;
  }

  .mc-day__top button {
    width: 20px;
    height: 20px;
    border: 1px solid #e2e8f0;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: white;
    color: #94a3b8;
    font-size: .8rem;
    font-weight: 800;
    cursor: pointer;
    opacity: 0;
    transition: opacity .12s ease;
  }

  .mc-day:hover .mc-day__top button { opacity: 1; }

  .mc-day__events {
    display: grid;
    gap: 4px;
  }

  /* ── EVENT CHIPS (month view) ── */
  .mc-event-chip {
    width: 100%;
    min-width: 0;
    border: none;
    border-left: 3px solid transparent;
    border-radius: 8px;
    padding: 4px 7px;
    display: grid;
    grid-template-columns: 16px minmax(0, 1fr);
    gap: 5px;
    align-items: center;
    text-align: left;
    cursor: pointer;
    transition: opacity .12s ease;
  }

  .mc-event-chip:hover { opacity: .85; }

  .mc-event-chip span {
    font-size: .75rem;
    line-height: 1;
  }

  .mc-event-chip strong {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #1e293b;
    font-size: .68rem;
    font-weight: 800;
  }

  .mc-day__events small {
    color: #94a3b8;
    font-size: .64rem;
    font-weight: 700;
    padding-left: 4px;
  }

  /* ── LIST VIEW ── */
  .mc-list {
    display: grid;
    gap: 8px;
    padding: 14px;
  }

  .mc-list-event {
    width: 100%;
    border: 1px solid #f1f5f9;
    border-radius: 18px;
    padding: 12px 14px;
    display: grid;
    grid-template-columns: 80px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    text-align: left;
    cursor: pointer;
    background: #fafbfc;
    transition: background .12s ease, border-color .12s ease;
  }

  .mc-list-event:hover { background: white; border-color: #e2e8f0; }

  .mc-list-event__date strong {
    display: block;
    color: #0f172a;
    font-size: .84rem;
    font-weight: 800;
  }

  .mc-list-event__date small,
  .mc-list-event__body small,
  .mc-list-event__body em {
    display: block;
    color: #94a3b8;
    font-size: .72rem;
    font-style: normal;
    font-weight: 700;
  }

  .mc-list-event__body {
    min-width: 0;
    display: grid;
    gap: 1px;
  }

  .mc-list-event__body strong {
    display: block;
    color: #0f172a;
    font-size: .84rem;
    font-weight: 800;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mc-list-event__body em {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mc-list-event__arrow {
    border-radius: 999px;
    padding: 5px 10px;
    background: #f1f5f9;
    color: #64748b;
    font-size: .68rem;
    font-weight: 800;
    white-space: nowrap;
  }

  /* ── SIDEBAR ── */
  .mc-sidebar {
    min-width: 0;
    display: grid;
    gap: 14px;
  }

  /* FIX: mc-side-card was missing border/bg/radius — appeared as raw unstyled divs */
  .mc-side-card {
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    background: white;
    box-shadow: 0 2px 12px rgba(15, 23, 42, .04);
    padding: 16px;
    display: grid;
    gap: 10px;
  }

  .mc-side-card__head {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }

  .mc-side-card__head > span {
    font-size: 1.1rem;
    line-height: 1.4;
  }

  .mc-side-card__head strong {
    display: block;
    color: #0f172a;
    font-size: .88rem;
    font-weight: 800;
  }

  .mc-side-card__head small {
    display: block;
    margin-top: 2px;
    color: #94a3b8;
    font-size: .72rem;
    font-weight: 700;
  }

  .mc-side-actions {
    display: grid;
    gap: 7px;
  }

  .mc-side-action {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 10px 12px;
    background: #f8fafc;
    color: #475569;
    font-size: .78rem;
    font-weight: 800;
    text-align: left;
    cursor: pointer;
    transition: .14s ease;
  }

  .mc-side-action:hover { background: white; border-color: #cbd5e1; transform: translateY(-1px); }

  .mc-side-action--primary {
    background: #079272;
    border-color: #079272;
    color: white;
  }

  .mc-side-action--primary:hover {
    background: #058060;
    border-color: #058060;
  }

  .mc-side-empty {
    border: 1px dashed #e2e8f0;
    border-radius: 14px;
    padding: 12px;
    color: #94a3b8;
    font-size: .76rem;
    font-weight: 700;
    text-align: center;
  }

  .mc-upcoming {
    width: 100%;
    border: 1px solid #f1f5f9;
    border-radius: 14px;
    padding: 10px;
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    text-align: left;
    cursor: pointer;
    background: #fafbfc;
    transition: .14s ease;
  }

  .mc-upcoming:hover { background: white; border-color: #e2e8f0; }

  .mc-upcoming strong {
    min-width: 0;
    display: block;
    color: #0f172a;
    font-size: .8rem;
    font-weight: 800;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mc-upcoming small {
    display: block;
    color: #94a3b8;
    font-size: .7rem;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mc-upcoming__icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    font-size: .9rem;
    border: 1px solid #e2e8f0;
  }

  /* ── TONE COLORS (shared across chip, list, upcoming, task) ── */
  .mc-event-chip--low,
  .mc-list-event--low,
  .mc-upcoming__icon--low,
  .mc-routine-task--low { background: #f0fdf4; border-color: #bbf7d0; }

  .mc-event-chip--normal,
  .mc-list-event--normal,
  .mc-upcoming__icon--normal,
  .mc-routine-task--normal { background: #eff6ff; border-color: #bfdbfe; }

  .mc-event-chip--high,
  .mc-list-event--high,
  .mc-upcoming__icon--high { background: #fffbeb; border-color: #fde68a; }

  .mc-event-chip--critical,
  .mc-list-event--critical,
  .mc-upcoming__icon--critical { background: #fef2f2; border-color: #fecaca; }

  .mc-event-chip--done,
  .mc-list-event--done,
  .mc-upcoming__icon--done { background: #f8fafc; border-color: #e2e8f0; opacity: .7; }

  .mc-event-chip--competition,
  .mc-list-event--competition,
  .mc-upcoming__icon--competition { background: #fffbeb; border-color: #fde68a; }

  .mc-event-chip--olympiad,
  .mc-list-event--olympiad,
  .mc-upcoming__icon--olympiad { background: #ecfdf5; border-color: #bbf7d0; }

  .mc-event-chip--mun,
  .mc-list-event--mun,
  .mc-upcoming__icon--mun { background: #eef2ff; border-color: #c7d2fe; }

  .mc-event-chip--scholarship,
  .mc-list-event--scholarship,
  .mc-upcoming__icon--scholarship { background: #f5f3ff; border-color: #ddd6fe; }

  .mc-event-chip--summer,
  .mc-list-event--summer,
  .mc-upcoming__icon--summer { background: #f0f9ff; border-color: #bae6fd; }

  .mc-event-chip--workshop,
  .mc-list-event--workshop,
  .mc-upcoming__icon--workshop { background: #fdf2f8; border-color: #fbcfe8; }

  .mc-event-chip--volunteering,
  .mc-list-event--volunteering,
  .mc-upcoming__icon--volunteering { background: #f0fdfa; border-color: #99f6e4; }

  .mc-event-chip--extracurricular,
  .mc-list-event--extracurricular,
  .mc-upcoming__icon--extracurricular { background: #fff7ed; border-color: #fed7aa; }

  .mc-event-chip--initiative,
  .mc-list-event--initiative,
  .mc-upcoming__icon--initiative { background: #f7fee7; border-color: #d9f99d; }

  .mc-event-chip--post,
  .mc-list-event--post,
  .mc-upcoming__icon--post { background: #f8fafc; border-color: #e2e8f0; }

  /* ── RESPONSIVE ── */
  @media (max-width: 1040px) {
    .mc-layout {
      grid-template-columns: 1fr;
    }
    .mc-sidebar {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .mc-hero { flex-direction: column; align-items: flex-start; }
    .mc-hero__actions { width: 100%; flex-direction: column; }
    .mc-btn { width: 100%; min-height: 44px; justify-content: center; display: flex; }

    .mc-topbar { flex-direction: column; align-items: stretch; gap: 10px; }
    .mc-month-nav { justify-content: center; }
    .mc-view-toggle { display: flex; }
    .mc-view-toggle button { flex: 1; text-align: center; }

    .mc-filter-row,
    .mc-public-filter {
      overflow-x: auto;
      flex-wrap: nowrap;
      scrollbar-width: none;
    }
    .mc-filter-row::-webkit-scrollbar,
    .mc-public-filter::-webkit-scrollbar { display: none; }
    .mc-filter, .mc-public-filter__chip { flex-shrink: 0; white-space: nowrap; }

    .mc-layout { gap: 14px; }
    .mc-sidebar { grid-template-columns: 1fr; }

    .mc-weekdays span { font-size: .58rem; padding: 8px 0; }

    .mc-day {
      min-height: clamp(52px, 13vw, 72px);
      padding: 5px 4px;
      border-radius: 0;
    }

    .mc-day__top > span { width: 22px; height: 22px; font-size: .68rem; }
    .mc-day__top button { opacity: 1; width: 18px; height: 18px; }

    .mc-day__events {
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
    }

    /* Compact dots on mobile */
    .mc-event-chip {
      width: 8px;
      height: 8px;
      min-width: 8px;
      border: none;
      border-radius: 50%;
      padding: 0;
      display: inline-block;
    }
    .mc-event-chip span,
    .mc-event-chip strong { display: none; }

    .mc-list-event { grid-template-columns: 1fr; }
    .mc-list-event__arrow { width: fit-content; }

    .mc-routine-task { grid-template-columns: 28px minmax(0, 1fr); }
    .mc-routine-task__status { grid-column: 2; width: fit-content; }

    .mc-card-head { flex-direction: column; align-items: flex-start; gap: 10px; }
    .mc-export-actions { width: 100%; }
    .mc-save-calendar-btn { width: 100%; text-align: center; }
  }

  @media (max-width: 420px) {
    .mc-page { padding-left: 8px; padding-right: 8px; }
    .mc-hero h1 { font-size: 1.8rem; }
  }

  /* ── PRINT ── */
  @media print {
    .mc-page { background: white; padding: 0; }
    .mc-hero__actions,
    .mc-topbar,
    .mc-filter-row,
    .mc-public-filter,
    .mc-activity-filter,
    .mc-export-actions,
    .mc-sidebar,
    .mc-day__top button,
    .mc-routine-summary { display: none !important; }
    .mc-shell { width: 100%; }
    .mc-layout { grid-template-columns: 1fr; }
    .mc-calendar-card { box-shadow: none; }
    .mc-day { min-height: 90px; }
  }
  </style>