<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import UserCalendarOpportunityPickerModal from '~/components/UserCalendarOpportunityPickerModal.vue'

const props = defineProps<{
  open: boolean
  event?: any | null
  initialDate?: string | null
  savedOpportunities?: any[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: [payload: any]
  deleted: [payload: any]
}>()

const { get, post, patch, del } = useAxios()

type RelationMode = 'personal' | 'opportunity'
type OpportunityEventMode = 'custom' | 'official'

const REMINDER_OPTIONS = [
  { label: '7 dias antes', value: 10080 },
  { label: '1 dia antes', value: 1440 },
  { label: '3 horas antes', value: 180 },
]

const TIMELINE_KIND_META: Record<string, { label: string; icon: string; tone: string }> = {
  registration_start: { label: 'Abre inscrições', icon: '🟢', tone: 'emerald' },
  registration_deadline: { label: 'Prazo final', icon: '⏰', tone: 'amber' },
  submission_deadline: { label: 'Envio', icon: '📦', tone: 'amber' },
  exam: { label: 'Prova', icon: '📝', tone: 'blue' },
  interview: { label: 'Entrevista', icon: '🎙️', tone: 'purple' },
  result: { label: 'Resultado', icon: '📣', tone: 'zinc' },
  phase: { label: 'Fase', icon: '🪜', tone: 'blue' },
  other: { label: 'Evento', icon: '📅', tone: 'zinc' },
}

const ACTIONABLE_KINDS = new Set([
  'registration_start',
  'registration_deadline',
  'submission_deadline',
  'exam',
  'interview',
  'result',
])

const saving = ref(false)
const deleting = ref(false)
const loadingOpportunity = ref(false)
const opportunityPickerOpen = ref(false)
const error = ref<string | null>(null)

const relationMode = ref<RelationMode>('personal')
const opportunityMode = ref<OpportunityEventMode>('custom')
const selectedOpportunityId = ref<number | null>(null)
const selectedOpportunity = ref<any | null>(null)
const selectedTimelineId = ref<string | null>(null)

const title = ref('')
const description = ref('')
const date = ref('')
const time = ref('18:00')
const allDay = ref(true)
const status = ref('ACTIVE')
const importance = ref('NORMAL')
const location = ref('')
const externalUrl = ref('')
const followSourceUpdates = ref(true)
const reminderOffsets = ref<number[]>([1440])

let requestSeq = 0

const isEditing = computed(() => !!props.event?.id)
const savedOpportunities = computed(() => props.savedOpportunities ?? [])

const modalTitle = computed(() => {
  if (isEditing.value) return 'Editar evento'
  if (relationMode.value === 'opportunity') return 'Adicionar data ligada à oportunidade'
  return 'Adicionar evento pessoal'
})

const sourceType = computed(() => {
  if (relationMode.value === 'personal') return 'CUSTOM'
  if (opportunityMode.value === 'official') return 'OPPORTUNITY_TIMELINE'
  return 'OPPORTUNITY_PREP_TASK'
})

function extractData(res: any) {
  return res?.data?.data ?? res?.data ?? res
}

function getErrorMessage(err: any, fallback: string) {
  return err?.response?.data?.detail || err?.data?.detail || err?.message || fallback
}

function pad(value: number) {
  return String(value).padStart(2, '0')
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

function toInputDate(raw: string | null | undefined) {
  const dt = parseDate(raw)
  if (!dt) return ''
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}

function toInputTime(raw: string | null | undefined) {
  const dt = parseDate(raw)
  if (!dt) return '18:00'
  return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

function buildStartsAt() {
  if (!date.value) return null
  const cleanDate = date.value.slice(0, 10)
  const cleanTime = allDay.value ? '23:59:59' : `${time.value || '18:00'}:00`
  return `${cleanDate}T${cleanTime}`
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
  const explicit = normalizeText(rawKind).replaceAll('-', '_').replaceAll(' ', '_')
  if (explicit in TIMELINE_KIND_META) return explicit

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

  return explicit || 'other'
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
      const dateValue = event.date ?? event.datetime ?? event.deadline ?? event.start_date ?? event.end_date ?? null
      const meta = TIMELINE_KIND_META[kind] ?? TIMELINE_KIND_META.other
      const id = getTimelineItemId({ ...event, kind, date: dateValue })

      return {
        ...event,
        id,
        kind,
        meta,
        date: dateValue,
        label: event.label ?? event.title ?? event.name ?? meta.label,
        details: event.details ?? event.description ?? null,
        show_on_calendar: event.show_on_calendar === true || event.show_on_calendar === 'true',
      }
    })
}

function isPast(raw: string | null | undefined) {
  const dt = parseDate(raw)
  if (!dt) return false
  return dt.getTime() < Date.now()
}

const timelineEvents = computed(() => normalizeTimeline(selectedOpportunity.value?.timeline))

const availableTimelineEvents = computed(() => {
  return timelineEvents.value
    .filter((event) => event.show_on_calendar === true)
    .filter((event) => event.date && parseDate(event.date))
    .filter((event) => !isPast(event.date))
    .filter((event) => ACTIONABLE_KINDS.has(event.kind) || event.show_on_calendar === true)
    .sort((a, b) => {
      const aTime = parseDate(a.date)?.getTime() ?? Number.POSITIVE_INFINITY
      const bTime = parseDate(b.date)?.getTime() ?? Number.POSITIVE_INFINITY
      return aTime - bTime
    })
})

const selectedOpportunityTitle = computed(() => {
  return selectedOpportunity.value?.title
    || savedOpportunities.value.find((item: any) => Number(item.id ?? item.opportunity_id) === selectedOpportunityId.value)?.title
    || 'oportunidade'
})

const selectedOpportunityIsSaved = computed(() => {
  const id = Number(selectedOpportunityId.value)
  if (!Number.isInteger(id) || id <= 0) return false

  return savedOpportunities.value.some((item: any) => Number(item.id ?? item.opportunity_id) === id)
})

const selectedOpportunityKind = computed(() => {
  return String(selectedOpportunity.value?.category || '').toUpperCase() === 'OLYMPIAD'
    ? 'olympiad'
    : 'opportunity'
})

const selectedOpportunityMeta = computed(() => {
  const category = String(selectedOpportunity.value?.category || '').toUpperCase()

  const map: Record<string, { label: string; icon: string }> = {
    OLYMPIAD: { label: 'Olimpíada', icon: '🏅' },
    COMPETITION: { label: 'Competição', icon: '🏆' },
    SUMMER_PROGRAM: { label: 'Programa', icon: '☀️' },
    SCHOLARSHIP: { label: 'Bolsa', icon: '🎓' },
    WORKSHOP: { label: 'Workshop', icon: '🛠️' },
    MUN: { label: 'MUN', icon: '🌐' },
    VOLUNTEERING: { label: 'Voluntariado', icon: '🤝' },
    EXTRACURRICULAR: { label: 'Extracurricular', icon: '⚡' },
    INITIATIVE: { label: 'Iniciativa', icon: '💡' },
  }

  return map[category] ?? { label: category || 'Oportunidade', icon: '✨' }
})

function resetForm() {
  error.value = null
  saving.value = false
  deleting.value = false
  relationMode.value = 'personal'
  opportunityMode.value = 'custom'
  selectedOpportunityId.value = null
  selectedOpportunity.value = null
  selectedTimelineId.value = null
  title.value = ''
  description.value = ''
  date.value = props.initialDate || toInputDate(new Date().toISOString())
  time.value = '18:00'
  allDay.value = true
  status.value = 'ACTIVE'
  importance.value = 'NORMAL'
  location.value = ''
  externalUrl.value = ''
  followSourceUpdates.value = true
  reminderOffsets.value = [1440]
  opportunityPickerOpen.value = false
}

async function loadOpportunity(id: number | null) {
  if (!id) {
    selectedOpportunity.value = null
    return
  }

  const seq = ++requestSeq
  loadingOpportunity.value = true
  error.value = null

  try {
    const res = await get(`/opportunity/${id}`)
    if (seq !== requestSeq) return
    selectedOpportunity.value = extractData(res)
  } catch (err: any) {
    if (seq !== requestSeq) return
    selectedOpportunity.value = selectedOpportunity.value
      || savedOpportunities.value.find((item: any) => Number(item.id ?? item.opportunity_id) === id)
      || null
    error.value = getErrorMessage(err, 'Não consegui carregar a oportunidade completa.')
  } finally {
    if (seq === requestSeq) loadingOpportunity.value = false
  }
}

function applyEventToForm(event: any) {
  resetForm()

  title.value = event.title ?? ''
  description.value = event.description ?? ''
  date.value = toInputDate(event.starts_at)
  time.value = toInputTime(event.starts_at)
  allDay.value = event.all_day !== false
  status.value = event.status ?? 'ACTIVE'
  importance.value = event.importance ?? 'NORMAL'
  location.value = event.location ?? ''
  externalUrl.value = event.external_url ?? ''
  followSourceUpdates.value = event.follow_source_updates !== false

  if (event.opportunity_id) {
    relationMode.value = 'opportunity'
    selectedOpportunityId.value = Number(event.opportunity_id)

    if (event.source_type === 'OPPORTUNITY_TIMELINE') {
      opportunityMode.value = 'official'
      selectedTimelineId.value = event.source_timeline_item_id ?? null
    } else {
      opportunityMode.value = 'custom'
    }

    loadOpportunity(Number(event.opportunity_id))
  }
}

function closeModal() {
  if (saving.value || deleting.value) return
  opportunityPickerOpen.value = false
  emit('update:open', false)
}

function openOpportunityPicker() {
  if (isEditing.value) return
  opportunityPickerOpen.value = true
}

function selectOpportunityFromPicker(item: any) {
  const id = Number(item?.id ?? item?.opportunity_id)
  if (!Number.isInteger(id) || id <= 0) return

  selectedOpportunityId.value = id
  selectedOpportunity.value = item
  selectedTimelineId.value = null
  error.value = null

  if (!location.value && item?.location) location.value = item.location
  if (!externalUrl.value && item?.official_site_url) externalUrl.value = item.official_site_url

  if (opportunityMode.value === 'custom' && !title.value.trim()) {
    title.value = `Preparar candidatura — ${item?.title || 'oportunidade'}`.slice(0, 200)
  }

  loadOpportunity(id)
}

function clearSelectedOpportunity() {
  if (isEditing.value) return

  selectedOpportunityId.value = null
  selectedOpportunity.value = null
  selectedTimelineId.value = null
  opportunityMode.value = 'custom'
}

function toggleReminder(value: number) {
  reminderOffsets.value = reminderOffsets.value.includes(value)
    ? reminderOffsets.value.filter((item) => item !== value)
    : [...reminderOffsets.value, value]
}

function selectTimelineEvent(event: any) {
  selectedTimelineId.value = event.id
  const meta = TIMELINE_KIND_META[event.kind] ?? TIMELINE_KIND_META.other

  title.value = `${meta.label} — ${selectedOpportunityTitle.value}`.slice(0, 200)
  description.value = event.details || event.label || ''
  date.value = toInputDate(event.date)
  time.value = '23:59'
  allDay.value = true
  importance.value = ['registration_deadline', 'submission_deadline'].includes(event.kind)
    ? 'CRITICAL'
    : 'NORMAL'

  location.value = selectedOpportunity.value?.location || ''
  externalUrl.value = selectedOpportunity.value?.official_site_url || ''
}

async function saveEvent() {
  const startsAt = buildStartsAt()

  if (!title.value.trim()) {
    error.value = 'Dê um título para o evento.'
    return
  }

  if (!startsAt) {
    error.value = 'Escolha uma data.'
    return
  }

  if (relationMode.value === 'opportunity' && !selectedOpportunityId.value) {
    error.value = 'Escolha a oportunidade relacionada.'
    return
  }

  if (relationMode.value === 'opportunity' && opportunityMode.value === 'official' && !selectedTimelineId.value) {
    error.value = 'Escolha uma data oficial da oportunidade.'
    return
  }

  saving.value = true
  error.value = null

  const payload: Record<string, any> = {
    title: title.value.trim().slice(0, 200),
    description: description.value.trim() || null,
    starts_at: startsAt,
    ends_at: null,
    all_day: allDay.value,
    timezone: 'America/Fortaleza',
    importance: importance.value,
    status: status.value,
    location: location.value.trim() || null,
    external_url: externalUrl.value.trim() || null,
    follow_source_updates: followSourceUpdates.value,
  }

  if (!isEditing.value) {
    payload.source_type = sourceType.value
    payload.opportunity_id = relationMode.value === 'opportunity' ? selectedOpportunityId.value : null
    payload.source_timeline_item_id = sourceType.value === 'OPPORTUNITY_TIMELINE' ? selectedTimelineId.value : null
    payload.reminder_offsets_minutes = reminderOffsets.value
    payload.reminder_channels = ['IN_APP']
  }

  try {
    const res = isEditing.value
      ? await patch(`/users/me/calendar/events/${props.event.id}`, payload)
      : await post('/users/me/calendar/events', payload)

    emit('saved', extractData(res))
  } catch (err: any) {
    error.value = getErrorMessage(err, 'Não foi possível salvar o evento.')
  } finally {
    saving.value = false
  }
}

async function deleteEvent() {
  if (!props.event?.id) return
  if (!window.confirm('Remover este evento do seu calendário?')) return

  deleting.value = true
  error.value = null

  try {
    await del(`/users/me/calendar/events/${props.event.id}`)
    emit('deleted', props.event)
  } catch (err: any) {
    error.value = getErrorMessage(err, 'Não foi possível remover o evento.')
  } finally {
    deleting.value = false
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open && !opportunityPickerOpen.value) closeModal()
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      opportunityPickerOpen.value = false
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeydown)
      }
      return
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeydown)
      window.addEventListener('keydown', handleKeydown)
    }

    if (props.event) {
      applyEventToForm(props.event)
    } else {
      resetForm()
    }
  },
  { immediate: true },
)

watch(selectedOpportunityId, (id, oldId) => {
  if (!props.open) return
  if (id === oldId) return

  selectedTimelineId.value = null

  if (!id) {
    selectedOpportunity.value = null
    return
  }

  if (selectedOpportunity.value && Number(selectedOpportunity.value.id ?? selectedOpportunity.value.opportunity_id) === Number(id)) {
    return
  }

  selectedOpportunity.value = null
  loadOpportunity(id)
})

watch(opportunityMode, (mode) => {
  if (mode === 'custom' && relationMode.value === 'opportunity' && !title.value.trim()) {
    title.value = `Preparar candidatura — ${selectedOpportunityTitle.value}`.slice(0, 200)
  }
})

onBeforeUnmount(() => {
  requestSeq++
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="calendar-modal-fade">
      <div v-if="open" class="calendar-modal-backdrop" @click.self="closeModal">
        <section class="calendar-modal" role="dialog" aria-modal="true">
          <header class="calendar-modal__header">
            <div>
              <span>{{ isEditing ? 'Calendário pessoal' : 'Novo evento' }}</span>
              <h2>{{ modalTitle }}</h2>
              <p>
                O evento pode ser pessoal, ligado a uma oportunidade ou ligado a uma data oficial dela.
              </p>
            </div>

            <button type="button" class="calendar-modal__close" @click="closeModal">
              ×
            </button>
          </header>

          <div class="calendar-modal__body">
            <div v-if="!isEditing" class="calendar-relation-tabs">
              <button
                type="button"
                :class="relationMode === 'personal' && 'is-active'"
                @click="relationMode = 'personal'"
              >
                📌 Pessoal
              </button>
              <button
                type="button"
                :class="relationMode === 'opportunity' && 'is-active'"
                @click="relationMode = 'opportunity'"
              >
                🎯 Ligado a oportunidade
              </button>
            </div>

            <div v-if="relationMode === 'opportunity'" class="calendar-linked-box">
              <div class="calendar-linked-header">
                <div>
                  <strong>O que essa data acompanha?</strong>
                  <p>Escolha se a data está ligada a uma oportunidade comum ou a uma olimpíada. Pode ser algo salvo no radar ou algo novo encontrado pela busca.</p>
                </div>

                <button
                  v-if="!isEditing"
                  type="button"
                  class="calendar-pick-opportunity"
                  @click="openOpportunityPicker"
                >
                  {{ selectedOpportunityId ? 'Trocar' : 'Escolher' }}
                </button>
              </div>

              <article v-if="selectedOpportunityId" class="calendar-selected-opportunity">
                <img
                  v-if="selectedOpportunity?.cover_url"
                  :src="selectedOpportunity.cover_url"
                  :alt="selectedOpportunityTitle"
                >
                <span v-else class="calendar-selected-opportunity__fallback">
                  {{ selectedOpportunityMeta.icon }}
                </span>

                <div>
                  <small>
                    {{ selectedOpportunityMeta.icon }} {{ selectedOpportunityMeta.label }}
                    · {{ selectedOpportunityIsSaved ? 'salva no radar' : 'não salva' }}
                  </small>
                  <strong>{{ selectedOpportunityTitle }}</strong>
                  <p v-if="selectedOpportunity?.excerpt">{{ selectedOpportunity.excerpt }}</p>
                </div>

                <button
                  v-if="!isEditing"
                  type="button"
                  class="calendar-selected-opportunity__clear"
                  @click="clearSelectedOpportunity"
                >
                  remover
                </button>
              </article>

              <div v-else class="calendar-opportunity-empty">
                <strong>Nenhum item vinculado ainda.</strong>
                <p>Abra o seletor para buscar em oportunidades e olimpíadas. Você não precisa ter salvo antes.</p>
                <button type="button" @click="openOpportunityPicker">
                  Buscar oportunidade ou olimpíada
                </button>
              </div>

              <div v-if="!isEditing" class="calendar-relation-tabs calendar-relation-tabs--small">
                <button
                  type="button"
                  :class="opportunityMode === 'custom' && 'is-active'"
                  @click="opportunityMode = 'custom'"
                >
                  Minha própria data
                </button>
                <button
                  type="button"
                  :class="opportunityMode === 'official' && 'is-active'"
                  :disabled="!selectedOpportunityId"
                  @click="opportunityMode = 'official'"
                >
                  Data oficial
                </button>
              </div>

              <div v-if="opportunityMode === 'official' && !isEditing" class="calendar-official-dates">
                <p v-if="loadingOpportunity" class="calendar-help-text">
                  Carregando datas oficiais...
                </p>

                <p v-else-if="selectedOpportunityId && availableTimelineEvents.length === 0" class="calendar-help-text calendar-help-text--warning">
                  Esta oportunidade não tem datas acionáveis marcadas com show_on_calendar. Crie uma data própria de preparação.
                </p>

                <button
                  v-for="event in availableTimelineEvents"
                  :key="event.id"
                  type="button"
                  :class="['calendar-official-date', `calendar-official-date--${event.meta.tone}`, selectedTimelineId === event.id && 'is-active']"
                  @click="selectTimelineEvent(event)"
                >
                  <span>{{ event.meta.icon }}</span>
                  <div>
                    <small>{{ event.meta.label }}</small>
                    <strong>{{ event.label }}</strong>
                    <em>{{ toInputDate(event.date) }}</em>
                  </div>
                </button>
              </div>
            </div>

            <div class="calendar-form-grid">
              <label class="calendar-field calendar-field--full">
                <span>Título</span>
                <input v-model="title" type="text" maxlength="200" placeholder="Ex.: Revisar application">
              </label>

              <label class="calendar-field">
                <span>Data</span>
                <input v-model="date" type="date">
              </label>

              <label v-if="!allDay" class="calendar-field">
                <span>Horário</span>
                <input v-model="time" type="time">
              </label>

              <label class="calendar-checkline">
                <input v-model="allDay" type="checkbox">
                <span>Dia inteiro / prazo até o fim do dia</span>
              </label>

              <label class="calendar-field">
                <span>Importância</span>
                <select v-model="importance">
                  <option value="LOW">Baixa</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Alta</option>
                  <option value="CRITICAL">Crítica</option>
                </select>
              </label>

              <label class="calendar-field">
                <span>Status</span>
                <select v-model="status">
                  <option value="ACTIVE">Ativo</option>
                  <option value="DONE">Concluído</option>
                  <option value="HIDDEN">Oculto</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </label>

              <label class="calendar-field calendar-field--full">
                <span>Observação</span>
                <textarea v-model="description" rows="3" placeholder="Ex.: Separar documentos, pedir feedback, submeter antes do prazo..." />
              </label>

              <label class="calendar-field">
                <span>Local</span>
                <input v-model="location" type="text" placeholder="Online, escola, endereço...">
              </label>

              <label class="calendar-field">
                <span>Link externo</span>
                <input v-model="externalUrl" type="url" placeholder="https://...">
              </label>

              <label v-if="relationMode === 'opportunity'" class="calendar-checkline calendar-field--full">
                <input v-model="followSourceUpdates" type="checkbox">
                <span>Manter conexão com atualizações da oportunidade</span>
              </label>
            </div>

            <div v-if="!isEditing" class="calendar-reminders">
              <span>Lembretes</span>
              <button
                v-for="option in REMINDER_OPTIONS"
                :key="option.value"
                type="button"
                :class="reminderOffsets.includes(option.value) && 'is-active'"
                @click="toggleReminder(option.value)"
              >
                {{ option.label }}
              </button>
            </div>

            <p v-if="error" class="calendar-modal-error">
              {{ error }}
            </p>
          </div>

          <footer class="calendar-modal__footer">
            <button
              v-if="isEditing"
              type="button"
              class="calendar-modal__danger"
              :disabled="deleting || saving"
              @click="deleteEvent"
            >
              {{ deleting ? 'Removendo...' : 'Remover' }}
            </button>

            <span />

            <button type="button" class="calendar-modal__ghost" :disabled="saving || deleting" @click="closeModal">
              Cancelar
            </button>
            <button type="button" class="calendar-modal__primary" :disabled="saving || deleting" @click="saveEvent">
              {{ saving ? 'Salvando...' : 'Salvar evento' }}
            </button>
          </footer>
        </section>
      </div>
    </Transition>

    <UserCalendarOpportunityPickerModal
      v-model:open="opportunityPickerOpen"
      :selected-id="selectedOpportunityId"
      :saved-opportunities="savedOpportunities"
      :initial-kind="selectedOpportunityKind"
      @select="selectOpportunityFromPicker"
    />
  </Teleport>
</template>

<style scoped>
.calendar-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3000;
  padding: 22px;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, .46);
  backdrop-filter: blur(10px);
}

.calendar-modal {
  width: min(900px, 100%);
  max-height: min(88vh, 880px);
  overflow: hidden;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  border-radius: 28px;
  background: #fff;
  box-shadow: 0 30px 90px rgba(15, 23, 42, .28);
}

.calendar-modal__header {
  padding: 22px 24px 18px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  border-bottom: 1px solid #e2e8f0;
  background:
    radial-gradient(circle at top left, rgba(7, 146, 114, .16), transparent 14rem),
    #fff;
}

.calendar-modal__header span {
  color: #079272;
  font-size: .7rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .1em;
}

.calendar-modal__header h2 {
  margin: 4px 0 6px;
  color: #0f172a;
  font-size: 1.6rem;
  line-height: 1;
  letter-spacing: -.045em;
}

.calendar-modal__header p {
  margin: 0;
  color: #64748b;
  font-size: .86rem;
  line-height: 1.45;
}

.calendar-modal__close {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 999px;
  background: #f1f5f9;
  color: #0f172a;
  font-size: 1.5rem;
  cursor: pointer;
}

.calendar-modal__body {
  overflow: auto;
  padding: 18px 24px;
  display: grid;
  gap: 16px;
}

.calendar-relation-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.calendar-relation-tabs button,
.calendar-reminders button {
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #fff;
  color: #475569;
  padding: 9px 12px;
  font-size: .78rem;
  font-weight: 900;
  cursor: pointer;
}

.calendar-relation-tabs button.is-active,
.calendar-reminders button.is-active {
  border-color: #079272;
  background: #ecfdf5;
  color: #047857;
}

.calendar-relation-tabs button:disabled {
  opacity: .55;
  cursor: default;
}

.calendar-relation-tabs--small button {
  padding: 7px 10px;
  font-size: .74rem;
}

.calendar-linked-box {
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  padding: 14px;
  display: grid;
  gap: 12px;
  background: #f8fafc;
}

.calendar-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.calendar-field {
  display: grid;
  gap: 6px;
}

.calendar-field--full {
  grid-column: 1 / -1;
}

.calendar-field span,
.calendar-linked-box label > span {
  color: #475569;
  font-size: .74rem;
  font-weight: 950;
}

.calendar-field input,
.calendar-field select,
.calendar-field textarea,
.calendar-linked-box select {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 15px;
  padding: 10px 11px;
  background: #fff;
  color: #0f172a;
  font: inherit;
  font-size: .84rem;
  outline: none;
}

.calendar-field textarea {
  resize: vertical;
}

.calendar-field input:focus,
.calendar-field select:focus,
.calendar-field textarea:focus,
.calendar-linked-box select:focus {
  border-color: #079272;
  box-shadow: 0 0 0 3px rgba(7, 146, 114, .12);
}

.calendar-checkline {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #475569;
  font-size: .8rem;
  font-weight: 850;
}

.calendar-checkline input {
  width: 16px;
  height: 16px;
  accent-color: #079272;
}

.calendar-official-dates {
  display: grid;
  gap: 8px;
}

.calendar-official-date {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 11px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  text-align: left;
  cursor: pointer;
  background: #fff;
}

.calendar-official-date--amber { background: #fffbeb; border-color: #fde68a; }
.calendar-official-date--blue { background: #eff6ff; border-color: #bfdbfe; }
.calendar-official-date--emerald { background: #ecfdf5; border-color: #bbf7d0; }
.calendar-official-date--purple { background: #f5f3ff; border-color: #ddd6fe; }
.calendar-official-date--zinc { background: #f8fafc; border-color: #e2e8f0; }

.calendar-official-date.is-active {
  box-shadow: inset 0 0 0 2px #079272;
}

.calendar-official-date small,
.calendar-official-date em {
  display: block;
  color: #64748b;
  font-size: .7rem;
  font-weight: 900;
  font-style: normal;
}

.calendar-official-date strong {
  display: block;
  color: #0f172a;
  font-size: .86rem;
  font-weight: 950;
}

.calendar-reminders {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.calendar-reminders > span {
  color: #64748b;
  font-size: .76rem;
  font-weight: 950;
}

.calendar-help-text {
  margin: 0;
  color: #64748b;
  font-size: .78rem;
  line-height: 1.45;
}

.calendar-help-text--warning {
  border: 1px dashed #f59e0b;
  border-radius: 15px;
  padding: 10px;
  background: #fffbeb;
  color: #92400e;
}

.calendar-modal-error {
  margin: 0;
  border: 1px solid #fecaca;
  border-radius: 15px;
  padding: 10px 12px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: .8rem;
  font-weight: 850;
}

.calendar-modal__footer {
  padding: 15px 24px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  gap: 9px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.calendar-modal__ghost,
.calendar-modal__primary,
.calendar-modal__danger {
  border: 0;
  border-radius: 999px;
  padding: 10px 14px;
  font-size: .8rem;
  font-weight: 950;
  cursor: pointer;
}

.calendar-modal__ghost {
  background: #fff;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.calendar-modal__primary {
  background: #079272;
  color: white;
}

.calendar-modal__danger {
  background: #fef2f2;
  color: #b91c1c;
}

.calendar-modal__ghost:disabled,
.calendar-modal__primary:disabled,
.calendar-modal__danger:disabled {
  opacity: .65;
  cursor: default;
}

.calendar-modal-fade-enter-active,
.calendar-modal-fade-leave-active {
  transition: opacity .18s ease;
}

.calendar-modal-fade-enter-from,
.calendar-modal-fade-leave-to {
  opacity: 0;
}


.calendar-linked-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
}

.calendar-linked-header strong {
  display: block;
  color: #0f172a;
  font-size: .94rem;
  font-weight: 950;
}

.calendar-linked-header p {
  margin: 4px 0 0;
  color: #475569;
  font-size: .8rem;
  line-height: 1.42;
  font-weight: 650;
}

.calendar-pick-opportunity,
.calendar-opportunity-empty button {
  border: none;
  border-radius: 999px;
  background: #0f172a;
  color: white;
  padding: 9px 12px;
  font-size: .78rem;
  font-weight: 950;
  cursor: pointer;
  white-space: nowrap;
}

.calendar-selected-opportunity {
  border: 1px solid #d1fae5;
  border-radius: 20px;
  padding: 11px;
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr) auto;
  gap: 11px;
  align-items: center;
  background: #ecfdf5;
}

.calendar-selected-opportunity img,
.calendar-selected-opportunity__fallback {
  width: 58px;
  height: 50px;
  border-radius: 16px;
  object-fit: cover;
  background: rgba(255, 255, 255, .8);
  border: 1px solid rgba(15, 23, 42, .06);
}

.calendar-selected-opportunity__fallback {
  display: grid;
  place-items: center;
  font-size: 1.35rem;
}

.calendar-selected-opportunity div {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.calendar-selected-opportunity small {
  color: #047857;
  font-size: .72rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .04em;
}

.calendar-selected-opportunity strong {
  color: #0f172a;
  font-size: .92rem;
  font-weight: 950;
  line-height: 1.25;
}

.calendar-selected-opportunity p {
  margin: 0;
  color: #475569;
  font-size: .76rem;
  line-height: 1.35;
  font-weight: 650;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.calendar-selected-opportunity__clear {
  border: none;
  border-radius: 999px;
  background: rgba(15, 23, 42, .08);
  color: #475569;
  padding: 7px 10px;
  font-size: .72rem;
  font-weight: 950;
  cursor: pointer;
}

.calendar-opportunity-empty {
  border: 1px dashed #cbd5e1;
  border-radius: 19px;
  padding: 13px;
  display: grid;
  justify-items: start;
  gap: 8px;
  background: #fff;
}

.calendar-opportunity-empty strong {
  color: #0f172a;
  font-size: .9rem;
  font-weight: 950;
}

.calendar-opportunity-empty p {
  margin: 0;
  color: #64748b;
  font-size: .8rem;
  line-height: 1.42;
  font-weight: 700;
}

@media (max-width: 720px) {
  .calendar-modal-backdrop {
    padding: 10px;
    align-items: end;
  }

  .calendar-modal {
    width: 100%;
    max-height: 92vh;
    border-radius: 24px 24px 0 0;
  }

  .calendar-modal__header,
  .calendar-modal__body,
  .calendar-modal__footer {
    padding-left: 16px;
    padding-right: 16px;
  }

  .calendar-form-grid {
    grid-template-columns: 1fr;
  }

  .calendar-linked-header,
  .calendar-selected-opportunity {
    grid-template-columns: 1fr;
  }

  .calendar-selected-opportunity img,
  .calendar-selected-opportunity__fallback {
    width: 54px;
    height: 54px;
  }

  .calendar-modal__footer {
    grid-template-columns: 1fr;
  }
}
</style>