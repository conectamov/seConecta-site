<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  opportunity: any | null
  accentColor?: string
}>()

const emit = defineEmits<{
  saved: [payload: any]
  calendarChanged: []
}>()

const route = useRoute()
const { get, post, patch, del } = useAxios() as any

const REQUEST_TIMEOUT_MS = 9000

const REMINDER_OPTIONS = [
  { label: '7 dias antes', value: 10080 },
  { label: '1 dia antes', value: 1440 },
  { label: '3 horas antes', value: 180 },
]

const ACTIONABLE_KINDS = new Set([
  'registration_deadline',
  'submission_deadline',
  'exam',
  'interview',
  'registration_start',
  'result',
])

const TIMELINE_KIND_META: Record<string, { label: string; tone: string; icon: string }> = {
  registration_start: { label: 'Abre inscrições', tone: 'emerald', icon: '🟢' },
  registration_deadline: { label: 'Prazo final', tone: 'amber', icon: '⏰' },
  submission_deadline: { label: 'Envio', tone: 'amber', icon: '📦' },
  exam: { label: 'Prova', tone: 'blue', icon: '📝' },
  interview: { label: 'Entrevista', tone: 'purple', icon: '🎙️' },
  result: { label: 'Resultado', tone: 'zinc', icon: '📣' },
  phase: { label: 'Fase', tone: 'blue', icon: '🪜' },
  program_start: { label: 'Início', tone: 'emerald', icon: '🚀' },
  program_end: { label: 'Fim', tone: 'zinc', icon: '🏁' },
  other: { label: 'Evento', tone: 'zinc', icon: '📅' },
}

const savedOpportunity = ref<any | null>(null)
const calendarEvents = ref<any[]>([])
const checking = ref(false)
const saving = ref(false)
const quickSaving = ref(false)
const loadingCalendar = ref(false)
const modalOpen = ref(false)
const error = ref<string | null>(null)
const feedback = ref<string | null>(null)
const requiresLogin = ref(false)

const notifyUpdates = ref(true)
const notifyDeadlineChanges = ref(true)
const notifyStatusChanges = ref(true)
const notifyNewDates = ref(true)
const selectedTimelineIds = ref<string[]>([])
const reminderOffsets = ref<number[]>([10080, 1440])

const customOpen = ref(false)
const customSaving = ref(false)
const customTitle = ref('')
const customDate = ref('')
const customTime = ref('18:00')
const customAllDay = ref(false)
const customDescription = ref('')
const customReminderOffsets = ref<number[]>([1440])

let requestSeq = 0

function withTimeout<T>(promise: Promise<T>, ms = REQUEST_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Tempo limite ao carregar dados do radar.')), ms)
    }),
  ])
}

function extractResponseData(res: any) {
  return res?.data?.data ?? res?.data ?? res
}

function getErrorStatus(err: any) {
  return err?.response?.status ?? err?.status ?? err?.data?.statusCode ?? null
}

function isUnauthorizedError(err: any) {
  const status = getErrorStatus(err)
  return status === 401 || status === 403
}

function getErrorMessage(err: any, fallback: string) {
  return err?.response?.data?.detail || err?.data?.detail || err?.message || fallback
}

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return ''

  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function normalizeTimelineKind(rawKind: unknown, event: any) {
  const explicitKind = normalizeText(rawKind).replaceAll('-', '_').replaceAll(' ', '_')
  if (explicitKind in TIMELINE_KIND_META) return explicitKind

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

function parseLocalDate(raw: string | null | undefined): Date | null {
  if (!raw) return null

  const value = String(raw).trim()
  const clean = value.slice(0, 10)

  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [year, month, day] = clean.split('-').map(Number)
    return new Date(year, month - 1, day, 23, 59, 59)
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function toInputDate(raw: string | null | undefined) {
  if (!raw) return ''

  const value = String(raw).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)

  const parsed = parseLocalDate(value)
  if (!parsed) return ''

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function fmtDate(raw: string | null | undefined) {
  const dt = parseLocalDate(raw)
  if (!dt) return null

  return dt.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function fmtShortDate(raw: string | null | undefined) {
  const dt = parseLocalDate(raw)
  if (!dt) return null

  return dt.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

function getTimelineItemId(event: any) {
  const explicitId = event?.id ?? event?.timeline_item_id
  if (explicitId) return String(explicitId).slice(0, 120)

  const raw = [
    event?.kind ?? 'other',
    event?.date ?? event?.datetime ?? event?.deadline ?? '',
    event?.label ?? event?.title ?? event?.details ?? '',
  ].join('|')

  const slug = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 92)

  return `timeline_${slug || 'item'}`
}

function getTimelineKindMeta(kind: string) {
  return TIMELINE_KIND_META[kind] ?? TIMELINE_KIND_META.other
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
      const id = getTimelineItemId({ ...event, kind, date })
      const kindMeta = getTimelineKindMeta(kind)

      return {
        ...event,
        id,
        kind,
        kindMeta,
        tone: kindMeta.tone,
        label: event.label ?? event.title ?? event.name ?? kindMeta.label,
        details: event.details ?? event.description ?? null,
        date,
        formattedDate: fmtDate(date),
        show_on_calendar: event.show_on_calendar === true || event.show_on_calendar === 'true',
      }
    })
}

function isPast(raw: string | null | undefined) {
  const dt = parseLocalDate(raw)
  if (!dt) return false
  return dt.getTime() < Date.now()
}

const opportunityId = computed(() => {
  const id = Number(props.opportunity?.id)
  return Number.isInteger(id) && id > 0 ? id : null
})

const accent = computed(() => props.accentColor || props.opportunity?.categoryMeta?.color || '#079272')
const timeline = computed(() => normalizeTimeline(props.opportunity?.timeline))

const actionableTimelineEvents = computed(() => {
  return timeline.value
    .filter((event) => event.show_on_calendar === true)
    .filter((event) => event.date && parseLocalDate(event.date))
    .filter((event) => !isPast(event.date))
    .filter((event) => ACTIONABLE_KINDS.has(event.kind) || event.show_on_calendar === true)
    .sort((a, b) => {
      const aTime = parseLocalDate(a.date)?.getTime() ?? Number.POSITIVE_INFINITY
      const bTime = parseLocalDate(b.date)?.getTime() ?? Number.POSITIVE_INFINITY
      return aTime - bTime
    })
})

const nextActionableDate = computed(() => actionableTimelineEvents.value[0] ?? null)
const actionableCount = computed(() => actionableTimelineEvents.value.length)
const hasActionableDates = computed(() => actionableTimelineEvents.value.length > 0)
const isSaved = computed(() => !!savedOpportunity.value)

const selectedActionableEvents = computed(() => {
  const selected = new Set(selectedTimelineIds.value)
  return actionableTimelineEvents.value.filter((event) => selected.has(event.id))
})

const existingTimelineIds = computed(() => {
  return new Set(
    calendarEvents.value
      .filter((event) => event?.source_type === 'OPPORTUNITY_TIMELINE')
      .map((event) => String(event.source_timeline_item_id || ''))
      .filter(Boolean),
  )
})

const existingCustomEvents = computed(() => {
  return calendarEvents.value.filter((event) => event?.source_type !== 'OPPORTUNITY_TIMELINE')
})

const warningTitle = computed(() => {
  if (isSaved.value) return 'No seu radar pessoal'
  if (actionableCount.value > 0) return 'Acompanhe esta oportunidade sem perder prazos'
  return 'Sem data acionável ainda'
})

const warningText = computed(() => {
  if (isSaved.value) {
    if (actionableCount.value > 0) {
      return `Você está acompanhando. ${actionableCount.value} data${actionableCount.value > 1 ? 's' : ''} oficial${actionableCount.value > 1 ? 'is' : ''} podem ser configuradas no calendário.`
    }

    return 'Você está acompanhando. Vamos avisar quando abrir, ganhar datas ou mudar.'
  }

  if (actionableCount.value > 0) {
    const dateLabel = fmtShortDate(nextActionableDate.value?.date)
    return `Salve no radar e escolha alertas/datas em um modal separado${dateLabel ? ` — próxima ação em ${dateLabel}` : ''}.`
  }

  return 'Salve no radar para receber alerta quando abrir, ganhar datas ou tiver alguma mudança importante.'
})

const saveButtonLabel = computed(() => {
  if (quickSaving.value) return 'Salvando...'
  if (checking.value) return 'Verificando...'
  if (requiresLogin.value) return 'Entrar'
  if (isSaved.value) return 'Configurar'
  return 'Configurar radar'
})

const modalTitle = computed(() => {
  if (isSaved.value) return 'Configurar radar da oportunidade'
  return 'Salvar e configurar radar'
})

function goToLogin() {
  navigateTo({
    path: '/login',
    query: { redirect: route.fullPath },
  })
}

function goToCalendar() {
  const id = opportunityId.value

  navigateTo({
    path: '/calendario',
    query: id ? { opportunity_id: String(id) } : undefined,
  })
}

function toggleNumber(list: number[], value: number) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value]
}

function toggleReminder(value: number) {
  reminderOffsets.value = toggleNumber(reminderOffsets.value, value)
}

function toggleCustomReminder(value: number) {
  customReminderOffsets.value = toggleNumber(customReminderOffsets.value, value)
}

function toggleTimelineSelection(id: string) {
  selectedTimelineIds.value = selectedTimelineIds.value.includes(id)
    ? selectedTimelineIds.value.filter((item) => item !== id)
    : [...selectedTimelineIds.value, id]
}

function buildStartsAtFromDate(date: string, time = '23:59', allDay = true) {
  const cleanDate = String(date || '').slice(0, 10)
  const cleanTime = allDay ? '23:59:59' : `${String(time || '18:00').slice(0, 5)}:00`
  return `${cleanDate}T${cleanTime}`
}

function getDefaultCustomTitle() {
  const title = props.opportunity?.title || 'oportunidade'
  return `Preparar candidatura — ${title}`.slice(0, 200)
}

function resetCustomForm() {
  customTitle.value = ''
  customDate.value = ''
  customTime.value = '18:00'
  customAllDay.value = false
  customDescription.value = ''
  customReminderOffsets.value = [1440]
}

function applySavedPreferences(saved: any) {
  if (!saved) return

  notifyUpdates.value = saved.notify_on_updates !== false
  notifyDeadlineChanges.value = saved.notify_on_deadline_changes !== false
  notifyStatusChanges.value = saved.notify_on_status_changes !== false
  notifyNewDates.value = saved.notify_on_new_dates !== false
}

function applyDefaultSelections() {
  const existing = existingTimelineIds.value
  selectedTimelineIds.value = actionableTimelineEvents.value
    .filter((event) => !existing.has(event.id))
    .map((event) => event.id)

  if (!customTitle.value) {
    customTitle.value = getDefaultCustomTitle()
  }
}

function getCalendarEventForTimelineId(id: string) {
  return calendarEvents.value.find((event) => String(event.source_timeline_item_id || '') === id) ?? null
}

async function fetchSavedStatus(id: number, seq: number) {
  try {
    const res = await withTimeout(get(`/users/me/saved-opportunities/${id}`), 7000)
    if (seq !== requestSeq) return

    savedOpportunity.value = extractResponseData(res)
    applySavedPreferences(savedOpportunity.value)
  } catch (err: any) {
    if (seq !== requestSeq) return

    const status = getErrorStatus(err)
    if (status === 404) {
      savedOpportunity.value = null
      return
    }

    if (isUnauthorizedError(err)) {
      requiresLogin.value = true
      return
    }

    console.warn('[OpportunityRadarConfig] Could not fetch saved status:', err)
  }
}

async function fetchCalendarEvents(id: number, seq: number) {
  loadingCalendar.value = true

  try {
    const res = await withTimeout(
      get('/users/me/calendar/events', {
        params: {
          opportunity_id: id,
          include_hidden: true,
          limit: 100,
        },
      }),
      7000,
    )

    if (seq !== requestSeq) return

    const payload = extractResponseData(res)
    calendarEvents.value = Array.isArray(payload?.data) ? payload.data : []
  } catch (err: any) {
    if (seq !== requestSeq) return

    if (isUnauthorizedError(err)) {
      requiresLogin.value = true
      return
    }

    console.warn('[OpportunityRadarConfig] Could not fetch calendar events:', err)
  } finally {
    if (seq === requestSeq) {
      loadingCalendar.value = false
    }
  }
}

async function refreshState() {
  const id = opportunityId.value
  const seq = ++requestSeq

  error.value = null
  feedback.value = null
  requiresLogin.value = false
  savedOpportunity.value = null
  calendarEvents.value = []
  selectedTimelineIds.value = []

  if (!id) return

  checking.value = true

  await Promise.allSettled([
    fetchSavedStatus(id, seq),
    fetchCalendarEvents(id, seq),
  ])

  if (seq === requestSeq) {
    checking.value = false
    applyDefaultSelections()
  }
}

async function upsertSavedOpportunity() {
  const id = opportunityId.value
  if (!id) throw new Error('Oportunidade inválida.')

  const payload = {
    status: 'SAVED',
    source: 'MANUAL',
    notify_deadline: selectedActionableEvents.value.length > 0 || existingTimelineIds.value.size > 0,
    auto_add_dates_to_calendar: false,
    notify_on_updates: notifyUpdates.value,
    notify_on_deadline_changes: notifyDeadlineChanges.value,
    notify_on_status_changes: notifyStatusChanges.value,
    notify_on_new_dates: notifyNewDates.value,
    reminder_offsets_minutes: reminderOffsets.value,
    reminder_channels: ['IN_APP'],
  }

  if (savedOpportunity.value) {
    const res = await patch(`/users/me/saved-opportunities/${id}`, payload)
    savedOpportunity.value = extractResponseData(res)
    return savedOpportunity.value
  }

  const res = await post('/users/me/saved-opportunities', {
    opportunity_id: id,
    ...payload,
  })

  const data = extractResponseData(res)
  savedOpportunity.value = data?.saved_opportunity ?? data
  return savedOpportunity.value
}

async function createTimelineCalendarEvent(event: any) {
  const id = opportunityId.value
  if (!id) return null
  if (existingTimelineIds.value.has(event.id)) return null

  const meta = getTimelineKindMeta(event.kind)
  const title = `${meta.label} — ${props.opportunity?.title || 'Oportunidade'}`.slice(0, 200)
  const startsAt = buildStartsAtFromDate(toInputDate(event.date), '23:59', true)

  const res = await post('/users/me/calendar/events', {
    title,
    description: event.details || event.label || null,
    starts_at: startsAt,
    ends_at: null,
    all_day: true,
    timezone: 'America/Fortaleza',
    source_type: 'OPPORTUNITY_TIMELINE',
    opportunity_id: id,
    source_timeline_item_id: event.id,
    importance: event.kind === 'registration_deadline' || event.kind === 'submission_deadline'
      ? 'CRITICAL'
      : 'NORMAL',
    reminder_offsets_minutes: reminderOffsets.value,
    reminder_channels: ['IN_APP'],
    location: props.opportunity?.location || null,
    external_url: props.opportunity?.official_site_url || null,
  })

  return extractResponseData(res)
}

async function saveQuickRadar() {
  if (requiresLogin.value) {
    goToLogin()
    return
  }

  if (!opportunityId.value || checking.value || quickSaving.value) return

  quickSaving.value = true
  error.value = null
  feedback.value = null

  try {
    await upsertSavedOpportunity()
    feedback.value = hasActionableDates.value
      ? 'Radar salvo. Abra a configuração para escolher datas e lembretes.'
      : 'Radar salvo. Vamos avisar quando abrir, ganhar datas ou mudar.'

    emit('saved', savedOpportunity.value)
  } catch (err: any) {
    if (isUnauthorizedError(err)) {
      requiresLogin.value = true
      goToLogin()
      return
    }

    error.value = getErrorMessage(err, 'Não foi possível salvar no radar agora.')
  } finally {
    quickSaving.value = false
  }
}

async function saveRadarConfiguration() {
  if (requiresLogin.value) {
    goToLogin()
    return
  }

  if (!opportunityId.value) return

  saving.value = true
  error.value = null
  feedback.value = null

  try {
    await upsertSavedOpportunity()

    const created: any[] = []
    for (const event of selectedActionableEvents.value) {
      const result = await createTimelineCalendarEvent(event)
      if (result) created.push(result)
    }

    await fetchCalendarEvents(opportunityId.value, requestSeq)
    applyDefaultSelections()

    if (created.length > 0) {
      feedback.value = `Radar salvo. ${created.length} data${created.length > 1 ? 's' : ''} adicionada${created.length > 1 ? 's' : ''} ao calendário.`
    } else if (!hasActionableDates.value) {
      feedback.value = 'Radar salvo. Vamos te avisar quando abrir, ganhar datas ou mudar.'
    } else {
      feedback.value = 'Configuração do radar atualizada.'
    }

    emit('saved', savedOpportunity.value)
    emit('calendarChanged')
  } catch (err: any) {
    if (isUnauthorizedError(err)) {
      requiresLogin.value = true
      goToLogin()
      return
    }

    error.value = getErrorMessage(err, 'Não foi possível salvar essa configuração agora.')
  } finally {
    saving.value = false
  }
}

async function createCustomCalendarEvent() {
  const id = opportunityId.value
  if (!id) return

  if (requiresLogin.value) {
    goToLogin()
    return
  }

  const title = customTitle.value.trim()
  const date = customDate.value.trim()

  if (!title || !date) {
    error.value = 'Preencha pelo menos o título e a data da sua anotação.'
    return
  }

  customSaving.value = true
  error.value = null
  feedback.value = null

  try {
    if (!savedOpportunity.value) {
      await upsertSavedOpportunity()
    }

    await post('/users/me/calendar/events', {
      title: title.slice(0, 200),
      description: customDescription.value.trim() || null,
      starts_at: buildStartsAtFromDate(date, customTime.value, customAllDay.value),
      ends_at: null,
      all_day: customAllDay.value,
      timezone: 'America/Fortaleza',
      source_type: 'OPPORTUNITY_PREP_TASK',
      opportunity_id: id,
      importance: 'NORMAL',
      reminder_offsets_minutes: customReminderOffsets.value,
      reminder_channels: ['IN_APP'],
      location: props.opportunity?.location || null,
      external_url: props.opportunity?.official_site_url || null,
    })

    await fetchCalendarEvents(id, requestSeq)
    resetCustomForm()
    customOpen.value = false
    feedback.value = 'Sua data personalizada foi adicionada ao calendário.'
    emit('calendarChanged')
  } catch (err: any) {
    if (isUnauthorizedError(err)) {
      requiresLogin.value = true
      goToLogin()
      return
    }

    error.value = getErrorMessage(err, 'Não foi possível adicionar essa data ao calendário.')
  } finally {
    customSaving.value = false
  }
}

async function deleteCalendarEvent(eventId: string | undefined) {
  if (!eventId) return

  error.value = null
  feedback.value = null

  try {
    await del(`/users/me/calendar/events/${eventId}`)

    if (opportunityId.value) {
      await fetchCalendarEvents(opportunityId.value, requestSeq)
      applyDefaultSelections()
    }

    feedback.value = 'Data removida do calendário.'
    emit('calendarChanged')
  } catch (err: any) {
    error.value = getErrorMessage(err, 'Não foi possível remover essa data.')
  }
}

function openConfigModal() {
  if (requiresLogin.value) {
    goToLogin()
    return
  }

  modalOpen.value = true
  error.value = null
  feedback.value = null

  if (!customTitle.value) {
    customTitle.value = getDefaultCustomTitle()
  }
}

function closeConfigModal() {
  modalOpen.value = false
  customOpen.value = false
}

function handleGlobalKeydown(event: KeyboardEvent) {
  if (!modalOpen.value) return
  if (event.key !== 'Escape') return

  event.preventDefault()
  closeConfigModal()
}

watch(
  () => `${opportunityId.value ?? ''}:${JSON.stringify(props.opportunity?.timeline ?? [])}`,
  () => refreshState(),
  { immediate: true },
)

watch(modalOpen, (value) => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = value ? 'hidden' : ''
  }
})

watch(customOpen, (value) => {
  if (value && !customTitle.value) customTitle.value = getDefaultCustomTitle()
})

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleGlobalKeydown)
  }
})

onBeforeUnmount(() => {
  requestSeq++

  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleGlobalKeydown)
  }

  if (typeof document !== 'undefined') document.body.style.overflow = ''
})
</script>

<template>
  <section class="radar-warning" :style="{ '--radar-accent': accent }">
    <div class="radar-warning__icon">
      {{ isSaved ? '✅' : '⚠️' }}
    </div>

    <div class="radar-warning__content">
      <strong>{{ warningTitle }}</strong>
      <p>{{ warningText }}</p>

      <p v-if="feedback" class="radar-warning__feedback">
        {{ feedback }}
      </p>

      <p v-if="error" class="radar-warning__error">
        {{ error }}
      </p>
    </div>

    <div class="radar-warning__actions">
      <button
        type="button"
        class="radar-warning__primary"
        :disabled="checking || !opportunityId"
        @click="openConfigModal"
      >
        <span v-if="checking" class="radar-warning__spinner" />
        <span v-else>⚙️</span>
        {{ saveButtonLabel }}
      </button>

      <button
        v-if="!isSaved"
        type="button"
        class="radar-warning__secondary"
        :disabled="quickSaving || checking || !opportunityId"
        @click="saveQuickRadar"
      >
        <span v-if="quickSaving" class="radar-warning__spinner radar-warning__spinner--dark" />
        <span v-else>＋</span>
        Salvar rápido
      </button>

      <button
        v-else
        type="button"
        class="radar-warning__secondary"
        @click="goToCalendar"
      >
        Calendário
      </button>
    </div>

    <Teleport to="body">
      <Transition name="radar-modal">
        <div
          v-if="modalOpen"
          class="radar-modal-backdrop"
          @click.self="closeConfigModal"
        >
          <article
            class="radar-modal"
            role="dialog"
            aria-modal="true"
            :style="{ '--radar-accent': accent }"
          >
            <header class="radar-modal__header">
              <div>
                <span class="radar-modal__eyebrow">Radar pessoal</span>
                <h3>{{ modalTitle }}</h3>
                <p>
                  Configure alertas, datas oficiais e tarefas próprias sem poluir a página da oportunidade.
                </p>
              </div>

              <button
                type="button"
                class="radar-modal__close"
                aria-label="Fechar"
                @click="closeConfigModal"
              >
                ×
              </button>
            </header>

            <main class="radar-modal__body">
              <section class="radar-modal-section radar-modal-section--alerts">
                <div class="radar-section-title">
                  <span>🔔</span>
                  <div>
                    <strong>Alertas da oportunidade</strong>
                    <p>Use isso principalmente quando a oportunidade estiver fechada ou sem data clara.</p>
                  </div>
                </div>

                <div class="radar-alert-grid">
                  <label class="radar-toggle">
                    <input v-model="notifyStatusChanges" type="checkbox">
                    <span>
                      <strong>Avisar quando abrir ou mudar status</strong>
                      <small>Útil para oportunidades fechadas, próximas edições ou inscrições em breve.</small>
                    </span>
                  </label>

                  <label class="radar-toggle">
                    <input v-model="notifyNewDates" type="checkbox">
                    <span>
                      <strong>Avisar se novas datas aparecerem</strong>
                      <small>Quando houver inscrição, prova, entrevista, resultado ou fase nova.</small>
                    </span>
                  </label>

                  <label class="radar-toggle">
                    <input v-model="notifyUpdates" type="checkbox">
                    <span>
                      <strong>Avisar se algo importante mudar</strong>
                      <small>Links, requisitos, custo, formato ou detalhes da seleção.</small>
                    </span>
                  </label>

                  <label class="radar-toggle">
                    <input v-model="notifyDeadlineChanges" type="checkbox">
                    <span>
                      <strong>Avisar se prazos mudarem</strong>
                      <small>Evita perder alteração de deadline depois de salvar.</small>
                    </span>
                  </label>
                </div>
              </section>

              <section v-if="hasActionableDates" class="radar-modal-section">
                <div class="radar-section-title">
                  <span>📅</span>
                  <div>
                    <strong>Datas oficiais para adicionar ao calendário</strong>
                    <p>Somente datas marcadas como acionáveis entram aqui. Você escolhe quais quer salvar.</p>
                  </div>
                </div>

                <div v-if="loadingCalendar" class="radar-loading-line">
                  Carregando datas já salvas...
                </div>

                <div class="radar-date-list">
                  <article
                    v-for="event in actionableTimelineEvents"
                    :key="event.id"
                    class="radar-date-card"
                    :class="[`radar-date-card--${event.tone}`, existingTimelineIds.has(event.id) && 'radar-date-card--saved']"
                  >
                    <label class="radar-date-card__main">
                      <input
                        type="checkbox"
                        :checked="selectedTimelineIds.includes(event.id) || existingTimelineIds.has(event.id)"
                        :disabled="existingTimelineIds.has(event.id)"
                        @change="toggleTimelineSelection(event.id)"
                      >

                      <span class="radar-date-card__dot">{{ event.kindMeta.icon }}</span>

                      <span class="radar-date-card__content">
                        <small>{{ event.kindMeta.label }}</small>
                        <strong>{{ event.label }}</strong>
                        <em v-if="event.formattedDate">{{ event.formattedDate }}</em>
                        <p v-if="event.details">{{ event.details }}</p>
                      </span>
                    </label>

                    <button
                      v-if="existingTimelineIds.has(event.id)"
                      type="button"
                      class="radar-date-card__remove"
                      @click="deleteCalendarEvent(getCalendarEventForTimelineId(event.id)?.id)"
                    >
                      remover
                    </button>

                    <span v-else-if="selectedTimelineIds.includes(event.id)" class="radar-date-card__status">
                      será adicionada
                    </span>
                  </article>
                </div>

                <div class="radar-reminders">
                  <span>Lembretes para datas oficiais</span>
                  <button
                    v-for="option in REMINDER_OPTIONS"
                    :key="option.value"
                    type="button"
                    :class="['radar-reminder-chip', reminderOffsets.includes(option.value) && 'radar-reminder-chip--active']"
                    @click="toggleReminder(option.value)"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </section>

              <section v-else class="radar-modal-section radar-empty-dates">
                <div class="radar-section-title">
                  <span>🟡</span>
                  <div>
                    <strong>Sem data oficial acionável</strong>
                    <p>
                      Não vou inventar um prazo falso. Salve no radar para ser avisado quando a oportunidade abrir,
                      ganhar datas ou mudar. Você também pode criar uma data pessoal abaixo.
                    </p>
                  </div>
                </div>
              </section>

              <section v-if="existingCustomEvents.length > 0" class="radar-modal-section">
                <div class="radar-section-title">
                  <span>🧩</span>
                  <div>
                    <strong>Suas datas personalizadas</strong>
                    <p>Tarefas ou lembretes seus ligados a esta oportunidade.</p>
                  </div>
                </div>

                <div class="radar-custom-list">
                  <article
                    v-for="event in existingCustomEvents"
                    :key="event.id"
                    class="radar-custom-event"
                  >
                    <div>
                      <span>{{ event.source_type === 'OPPORTUNITY_PREP_TASK' ? '🧩' : '📌' }}</span>
                      <strong>{{ event.title }}</strong>
                      <small>{{ fmtDate(event.starts_at) || event.starts_at }}</small>
                    </div>

                    <button type="button" @click="deleteCalendarEvent(event.id)">
                      remover
                    </button>
                  </article>
                </div>
              </section>

              <section class="radar-modal-section">
                <button
                  type="button"
                  class="radar-custom-toggle"
                  @click="customOpen = !customOpen"
                >
                  <span>{{ customOpen ? '−' : '＋' }}</span>
                  Adicionar minha própria data
                </button>

                <div v-if="customOpen" class="radar-custom-form">
                  <label>
                    <span>Título</span>
                    <input v-model="customTitle" type="text" placeholder="Ex.: Revisar application" maxlength="200">
                  </label>

                  <div class="radar-custom-form__row">
                    <label>
                      <span>Data</span>
                      <input v-model="customDate" type="date">
                    </label>

                    <label v-if="!customAllDay">
                      <span>Horário</span>
                      <input v-model="customTime" type="time">
                    </label>
                  </div>

                  <label class="radar-checkline">
                    <input v-model="customAllDay" type="checkbox">
                    <span>Dia inteiro / prazo até o fim do dia</span>
                  </label>

                  <label>
                    <span>Observação opcional</span>
                    <textarea
                      v-model="customDescription"
                      rows="2"
                      placeholder="Ex.: Separar documentos, escrever rascunho, pedir feedback..."
                    />
                  </label>

                  <div class="radar-reminders radar-reminders--custom">
                    <span>Lembretes</span>
                    <button
                      v-for="option in REMINDER_OPTIONS"
                      :key="option.value"
                      type="button"
                      :class="['radar-reminder-chip', customReminderOffsets.includes(option.value) && 'radar-reminder-chip--active']"
                      @click="toggleCustomReminder(option.value)"
                    >
                      {{ option.label }}
                    </button>
                  </div>

                  <button
                    type="button"
                    class="radar-custom-submit"
                    :disabled="customSaving"
                    @click="createCustomCalendarEvent"
                  >
                    <span v-if="customSaving" class="radar-warning__spinner" />
                    {{ customSaving ? 'Adicionando...' : 'Adicionar data personalizada' }}
                  </button>
                </div>
              </section>

              <p v-if="feedback" class="radar-modal-feedback">
                {{ feedback }}
              </p>

              <p v-if="error" class="radar-modal-error">
                {{ error }}
              </p>
            </main>

            <footer class="radar-modal__footer">
              <button type="button" class="radar-modal__ghost" @click="closeConfigModal">
                Fechar
              </button>

              <button type="button" class="radar-modal__calendar" @click="goToCalendar">
                Abrir calendário
              </button>

              <button
                type="button"
                class="radar-modal__save"
                :disabled="saving || !opportunityId"
                @click="saveRadarConfiguration"
              >
                <span v-if="saving" class="radar-warning__spinner" />
                {{ saving ? 'Salvando...' : 'Salvar configuração' }}
              </button>
            </footer>
          </article>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
.radar-warning {
  --radar-accent: #079272;
  border: 1px solid #fde68a;
  border-radius: 20px;
  padding: 13px 14px;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  background:
    radial-gradient(circle at top left, rgba(245, 158, 11, .18), transparent 13rem),
    linear-gradient(135deg, #fffbeb, #fff7ed);
  box-shadow: 0 14px 34px rgba(245, 158, 11, .1);
}

.radar-warning__icon {
  width: 40px;
  height: 40px;
  border-radius: 15px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, .75);
  border: 1px solid rgba(251, 191, 36, .35);
  font-size: 1.08rem;
}

.radar-warning__content {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.radar-warning__content strong {
  color: #78350f;
  font-size: .92rem;
  font-weight: 950;
  letter-spacing: -.015em;
}

.radar-warning__content p {
  margin: 0;
  color: #78350f;
  font-size: .86rem;
  font-weight: 780;
  line-height: 1.5;
}

.radar-warning__feedback {
  color: #047857 !important;
  font-weight: 850 !important;
}

.radar-warning__error {
  color: #b91c1c !important;
  font-weight: 850 !important;
}

.radar-warning__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.radar-warning__primary,
.radar-warning__secondary {
  min-height: 36px;
  border-radius: 999px;
  padding: 8px 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-size: .76rem;
  font-weight: 950;
  cursor: pointer;
  white-space: nowrap;
  transition: .18s ease;
}

.radar-warning__primary {
  border: none;
  background: #0f172a;
  color: white;
  box-shadow: 0 12px 24px rgba(15, 23, 42, .16);
}

.radar-warning__secondary {
  border: 1px solid rgba(146, 64, 14, .22);
  background: rgba(255, 255, 255, .62);
  color: #78350f;
}

.radar-warning__primary:hover:not(:disabled),
.radar-warning__secondary:hover:not(:disabled) {
  transform: translateY(-1px);
}

.radar-warning__primary:disabled,
.radar-warning__secondary:disabled {
  cursor: default;
  opacity: .65;
}

.radar-warning__spinner {
  width: 13px;
  height: 13px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, .35);
  border-top-color: white;
  animation: radar-warning-spin .7s linear infinite;
}

.radar-warning__spinner--dark {
  border-color: rgba(120, 53, 15, .28);
  border-top-color: #78350f;
}

@keyframes radar-warning-spin {
  to { transform: rotate(360deg); }
}

.radar-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1500;
  padding: 22px;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, .58);
  backdrop-filter: blur(12px);
}

.radar-modal {
  width: min(760px, 100%);
  max-height: min(88vh, 900px);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  border-radius: 30px;
  background: #fff;
  box-shadow: 0 32px 90px rgba(15, 23, 42, .28);
}

.radar-modal__header {
  padding: 22px 24px 18px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 38px;
  gap: 14px;
  align-items: start;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--radar-accent) 12%, transparent), transparent 17rem),
    linear-gradient(135deg, #fffbeb, #ffffff 64%);
  border-bottom: 1px solid #f1f5f9;
}

.radar-modal__eyebrow {
  color: color-mix(in srgb, var(--radar-accent) 78%, #0f172a);
  font-size: .68rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .1em;
}

.radar-modal__header h3 {
  margin: 4px 0 6px;
  color: #0f172a;
  font-size: clamp(1.35rem, 3vw, 1.85rem);
  line-height: 1;
  letter-spacing: -.055em;
}

.radar-modal__header p {
  max-width: 620px;
  margin: 0;
  color: #475569;
  font-size: .96rem;
  font-weight: 650;
  line-height: 1.55;
}

.radar-modal__close {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, .76);
  color: #0f172a;
  font-size: 1.25rem;
  font-weight: 900;
  cursor: pointer;
}

.radar-modal__body {
  min-height: 0;
  overflow: auto;
  padding: 18px 24px 20px;
  display: grid;
  gap: 14px;
}

.radar-modal-section {
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  padding: 14px;
  display: grid;
  gap: 12px;
  background: #fff;
}

.radar-modal-section--alerts {
  background: linear-gradient(135deg, #f8fafc, #fff);
}

.radar-section-title {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.radar-section-title > span {
  width: 38px;
  height: 38px;
  border-radius: 15px;
  display: grid;
  place-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.radar-section-title strong {
  display: block;
  color: #0f172a;
  font-size: .96rem;
  font-weight: 950;
}

.radar-section-title p,
.radar-empty-dates p {
  margin: 4px 0 0;
  color: #475569;
  font-size: .88rem;
  font-weight: 650;
  line-height: 1.52;
}

.radar-alert-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}

.radar-toggle,
.radar-checkline {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  cursor: pointer;
}

.radar-toggle {
  border: 1px solid rgba(226, 232, 240, .9);
  border-radius: 17px;
  padding: 10px 11px;
  background: rgba(255, 255, 255, .82);
}

.radar-toggle input,
.radar-checkline input,
.radar-date-card input {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  accent-color: var(--radar-accent);
  flex-shrink: 0;
}

.radar-toggle strong {
  display: block;
  color: #0f172a;
  font-size: .88rem;
  font-weight: 950;
  line-height: 1.28;
}

.radar-toggle small {
  display: block;
  margin-top: 4px;
  color: #475569;
  font-size: .82rem;
  font-weight: 620;
  line-height: 1.45;
}

.radar-loading-line {
  color: #475569;
  font-size: .86rem;
  font-weight: 850;
}

.radar-date-list {
  display: grid;
  gap: 9px;
}

.radar-date-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 19px;
  padding: 11px 12px;
  background: #fff;
}

.radar-date-card--amber { background: #fffbeb; border-color: #fde68a; }
.radar-date-card--blue { background: #eff6ff; border-color: #bfdbfe; }
.radar-date-card--emerald { background: #ecfdf5; border-color: #bbf7d0; }
.radar-date-card--purple { background: #f5f3ff; border-color: #ddd6fe; }
.radar-date-card--zinc { background: #f8fafc; border-color: #e2e8f0; }

.radar-date-card--saved {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--radar-accent) 28%, transparent);
}

.radar-date-card__main {
  min-width: 0;
  display: grid;
  grid-template-columns: 18px 38px minmax(0, 1fr);
  gap: 10px;
  align-items: flex-start;
  cursor: pointer;
}

.radar-date-card__dot {
  width: 38px;
  height: 38px;
  border-radius: 15px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, .82);
  border: 1px solid rgba(15, 23, 42, .05);
}

.radar-date-card__content {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.radar-date-card__content small {
  color: #475569;
  font-size: .76rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .065em;
}

.radar-date-card__content strong {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 950;
  line-height: 1.28;
}

.radar-date-card__content em {
  color: #047857;
  font-size: .9rem;
  font-style: normal;
  font-weight: 950;
}

.radar-date-card__content p {
  margin: 2px 0 0;
  color: #475569;
  font-size: .83rem;
  font-weight: 600;
  line-height: 1.45;
}

.radar-date-card__status,
.radar-date-card__remove {
  border-radius: 999px;
  padding: 7px 10px;
  font-size: .76rem;
  font-weight: 950;
  white-space: nowrap;
}

.radar-date-card__status {
  background: rgba(255, 255, 255, .82);
  color: #047857;
  border: 1px solid rgba(16, 185, 129, .18);
}

.radar-date-card__remove {
  border: none;
  background: rgba(15, 23, 42, .08);
  color: #475569;
  cursor: pointer;
}

.radar-date-card__remove:hover {
  background: rgba(239, 68, 68, .1);
  color: #b91c1c;
}

.radar-reminders {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
}

.radar-reminders > span {
  color: #475569;
  font-size: .83rem;
  font-weight: 950;
  margin-right: 2px;
}

.radar-reminder-chip {
  border: 1px solid #e2e8f0;
  background: white;
  color: #475569;
  border-radius: 999px;
  padding: 8px 11px;
  font-size: .8rem;
  font-weight: 900;
  cursor: pointer;
}

.radar-reminder-chip--active {
  background: color-mix(in srgb, var(--radar-accent) 12%, white);
  border-color: color-mix(in srgb, var(--radar-accent) 34%, #e2e8f0);
  color: color-mix(in srgb, var(--radar-accent) 76%, #0f172a);
}

.radar-empty-dates {
  background: #fffbeb;
  border-color: #fde68a;
}

.radar-custom-list {
  display: grid;
  gap: 8px;
}

.radar-custom-event {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 17px;
  padding: 10px 12px;
  background: #f8fafc;
}

.radar-custom-event div {
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: 8px;
  row-gap: 2px;
  align-items: center;
}

.radar-custom-event span { grid-row: 1 / span 2; }

.radar-custom-event strong {
  color: #0f172a;
  font-size: .92rem;
  font-weight: 950;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.radar-custom-event small {
  color: #475569;
  font-size: .82rem;
  font-weight: 820;
}

.radar-custom-event button {
  border: none;
  background: transparent;
  color: #475569;
  font-size: .8rem;
  font-weight: 950;
  cursor: pointer;
}

.radar-custom-toggle {
  width: fit-content;
  border: none;
  background: transparent;
  color: color-mix(in srgb, var(--radar-accent) 82%, #0f172a);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  font-size: .92rem;
  font-weight: 950;
  cursor: pointer;
}

.radar-custom-form {
  margin-top: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 13px;
  display: grid;
  gap: 11px;
  background: #fff;
}

.radar-custom-form label {
  display: grid;
  gap: 6px;
}

.radar-custom-form label > span,
.radar-checkline span {
  color: #334155;
  font-size: .82rem;
  font-weight: 950;
}

.radar-custom-form input,
.radar-custom-form textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  padding: 11px 12px;
  color: #0f172a;
  font: inherit;
  font-size: .9rem;
  font-weight: 650;
  outline: none;
  background: #f8fafc;
}

.radar-custom-form input:focus,
.radar-custom-form textarea:focus {
  border-color: color-mix(in srgb, var(--radar-accent) 45%, #e2e8f0);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--radar-accent) 12%, transparent);
  background: white;
}

.radar-custom-form textarea { resize: vertical; }

.radar-custom-form__row {
  display: grid;
  grid-template-columns: 1fr 150px;
  gap: 10px;
}

.radar-custom-submit,
.radar-modal__save,
.radar-modal__calendar,
.radar-modal__ghost {
  min-height: 42px;
  border-radius: 999px;
  padding: 10px 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: .86rem;
  font-weight: 950;
  cursor: pointer;
}

.radar-custom-submit,
.radar-modal__save {
  border: none;
  background: #0f172a;
  color: white;
}

.radar-modal__calendar {
  border: 1px solid color-mix(in srgb, var(--radar-accent) 35%, #e2e8f0);
  background: color-mix(in srgb, var(--radar-accent) 10%, white);
  color: color-mix(in srgb, var(--radar-accent) 78%, #0f172a);
}

.radar-modal__ghost {
  border: 1px solid #e2e8f0;
  background: white;
  color: #475569;
}

.radar-modal-feedback,
.radar-modal-error {
  margin: 0;
  border-radius: 16px;
  padding: 11px 13px;
  font-size: .88rem;
  font-weight: 850;
  line-height: 1.5;
}

.radar-modal-feedback {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #bbf7d0;
}

.radar-modal-error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.radar-modal__footer {
  padding: 15px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  flex-wrap: wrap;
  background: #f8fafc;
}

.radar-modal-enter-active,
.radar-modal-leave-active {
  transition: opacity .18s ease;
}

.radar-modal-enter-active .radar-modal,
.radar-modal-leave-active .radar-modal {
  transition: transform .18s ease, opacity .18s ease;
}

.radar-modal-enter-from,
.radar-modal-leave-to {
  opacity: 0;
}

.radar-modal-enter-from .radar-modal,
.radar-modal-leave-to .radar-modal {
  opacity: 0;
  transform: translateY(10px) scale(.98);
}

@media (max-width: 760px) {
  .radar-warning {
    grid-template-columns: 36px minmax(0, 1fr);
    align-items: flex-start;
    border-radius: 18px;
    padding: 12px;
  }

  .radar-warning__icon {
    width: 36px;
    height: 36px;
    border-radius: 14px;
  }

  .radar-warning__actions {
    grid-column: 1 / -1;
    width: 100%;
    justify-content: stretch;
  }

  .radar-warning__primary,
  .radar-warning__secondary {
    flex: 1 1 0;
  }

  .radar-modal-backdrop {
    padding: 10px;
    align-items: end;
  }

  .radar-modal {
    max-height: 92vh;
    border-radius: 24px 24px 0 0;
  }

  .radar-modal__header,
  .radar-modal__body,
  .radar-modal__footer {
    padding-left: 15px;
    padding-right: 15px;
  }

  .radar-alert-grid {
    grid-template-columns: 1fr;
  }

  .radar-date-card {
    grid-template-columns: 1fr;
  }

  .radar-date-card__main {
    grid-template-columns: 18px 34px minmax(0, 1fr);
  }

  .radar-date-card__dot {
    width: 34px;
    height: 34px;
    border-radius: 14px;
  }

  .radar-date-card__remove,
  .radar-date-card__status {
    justify-self: start;
  }

  .radar-custom-form__row {
    grid-template-columns: 1fr;
  }

  .radar-modal__footer {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>