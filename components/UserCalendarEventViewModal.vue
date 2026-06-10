<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  event: any | null
  opportunity?: any | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  edit: [event: any]
  delete: [event: any]
  view: [event: any]
}>()

const { get } = useAxios()

const loadingOpportunity = ref(false)
const loadingRelated = ref(false)
const fetchedOpportunity = ref<any | null>(null)
const relatedEvents = ref<any[]>([])
const localError = ref<string | null>(null)

let requestSeq = 0

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
})

const currentOpportunity = computed(() => fetchedOpportunity.value ?? props.opportunity ?? null)

const isReadonlyPublic = computed(() => {
  return props.event?.readonly === true || props.event?.source_type === 'SECONNECTA_PUBLIC'
})

const opportunityTitle = computed(() => {
  return currentOpportunity.value?.title || props.event?.source_snapshot?.opportunity_title || 'Oportunidade vinculada'
})

const opportunitySlug = computed(() => {
  return currentOpportunity.value?.slug || props.event?.opportunity_slug || props.event?.source_snapshot?.opportunity_slug || null
})

const visibleRelatedEvents = computed(() => {
  const currentId = String(props.event?.id || '')

  return [...relatedEvents.value]
    .filter((event) => event?.status !== 'HIDDEN')
    .sort((a, b) => {
      const aTime = parseDate(a.starts_at)?.getTime() ?? 0
      const bTime = parseDate(b.starts_at)?.getTime() ?? 0
      return aTime - bTime
    })
    .map((event) => ({
      ...event,
      isCurrent: String(event?.id || '') === currentId,
    }))
})

function closeModal() {
  isOpen.value = false
}

function extractData(res: any) {
  return res?.data?.data ?? res?.data ?? res
}

function getErrorMessage(err: any, fallback: string) {
  return err?.response?.data?.detail || err?.data?.detail || err?.message || fallback
}

function parseDate(raw: string | null | undefined): Date | null {
  if (!raw) return null

  const value = String(raw).trim()
  if (!value) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function fmtDate(raw: string | null | undefined) {
  const dt = parseDate(raw)
  if (!dt) return 'Sem data'

  return dt.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function fmtShortDate(raw: string | null | undefined) {
  const dt = parseDate(raw)
  if (!dt) return 'Sem data'

  return dt.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

function fmtTime(raw: string | null | undefined) {
  if (props.event?.all_day) return 'Dia inteiro'

  const dt = parseDate(raw)
  if (!dt) return ''

  return dt.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
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

function getEventTone(event: any) {
  if (event?.status === 'DONE') return 'done'

  const importance = String(event?.importance || 'NORMAL').toUpperCase()

  if (importance === 'CRITICAL') return 'critical'
  if (importance === 'HIGH') return 'high'
  if (importance === 'LOW') return 'low'

  return 'normal'
}

function getEventIcon(event: any) {
  if (event?.source_type === 'SECONNECTA_PUBLIC') return event?.source_snapshot?.category_icon || '✨'
  if (event?.source_type === 'OPPORTUNITY_TIMELINE') return '⏰'
  if (event?.source_type === 'OPPORTUNITY_PREP_TASK') return '🧩'
  if (event?.opportunity_id) return '🎯'
  return '📌'
}

function getEventSourceLabel(event: any) {
  if (event?.source_type === 'SECONNECTA_PUBLIC') return `Calendário seConecta · ${event?.source_snapshot?.category_label || 'Oportunidade'}`
  if (event?.source_type === 'OPPORTUNITY_TIMELINE') return 'Oportunidade salva'
  if (event?.source_type === 'OPPORTUNITY_PREP_TASK') return 'Tarefa de preparação'
  if (event?.opportunity_id) return 'Evento ligado a oportunidade'
  return 'Evento pessoal'
}

function getStatusLabel(status: string | null | undefined) {
  if (status === 'DONE') return 'Concluído'
  if (status === 'HIDDEN') return 'Oculto'
  if (status === 'CANCELLED') return 'Cancelado'
  return 'Ativo'
}

function opportunityPath() {
  const slug = opportunitySlug.value
  if (slug) return `/oportunidade/${encodeURIComponent(slug)}`

  const id = Number(props.event?.opportunity_id)
  if (Number.isInteger(id) && id > 0) return `/oportunidade/${id}`

  return null
}

function openOpportunityPage() {
  const path = opportunityPath()
  if (!path) return
  navigateTo(path)
}

function openOfficialSite() {
  const url = currentOpportunity.value?.official_site_url || props.event?.external_url
  if (!url || typeof window === 'undefined') return
  window.open(url, '_blank', 'noopener,noreferrer')
}

function editEvent() {
  if (!props.event || isReadonlyPublic.value) return
  emit('edit', props.event)
}

function deleteEvent() {
  if (!props.event || isReadonlyPublic.value) return
  emit('delete', props.event)
}

async function fetchOpportunity(seq: number, opportunityId: number) {
  if (props.opportunity?.id) {
    fetchedOpportunity.value = null
    return
  }

  loadingOpportunity.value = true

  try {
    const res = await get(`/opportunity/${opportunityId}`)
    if (seq !== requestSeq) return
    fetchedOpportunity.value = extractData(res)
  } catch (err: any) {
    if (seq !== requestSeq) return
    console.warn('[UserCalendarEventViewModal] Could not fetch opportunity:', err)
  } finally {
    if (seq === requestSeq) loadingOpportunity.value = false
  }
}

async function fetchRelatedEvents(seq: number, opportunityId: number) {
  loadingRelated.value = true

  try {
    const res = await get('/users/me/calendar/events', {
      params: {
        opportunity_id: opportunityId,
        include_hidden: true,
        limit: 100,
      },
    })

    if (seq !== requestSeq) return

    const payload = extractData(res)
    relatedEvents.value = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []
  } catch (err: any) {
    if (seq !== requestSeq) return
    localError.value = getErrorMessage(err, 'Não foi possível carregar outras datas desta oportunidade.')
  } finally {
    if (seq === requestSeq) loadingRelated.value = false
  }
}

async function refreshModalData() {
  const seq = ++requestSeq
  const opportunityId = Number(props.event?.opportunity_id)

  fetchedOpportunity.value = null
  relatedEvents.value = []
  localError.value = null

  if (!props.open || !props.event || !Number.isInteger(opportunityId) || opportunityId <= 0) return

  await Promise.allSettled([
    fetchOpportunity(seq, opportunityId),
    fetchRelatedEvents(seq, opportunityId),
  ])
}

watch(
  () => `${props.open ? '1' : '0'}:${props.event?.id ?? ''}:${props.event?.opportunity_id ?? ''}`,
  () => refreshModalData(),
  { immediate: true },
)

watch(
  () => props.open,
  (value) => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = value ? 'hidden' : ''
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="calendar-view-modal">
      <div
        v-if="isOpen && event"
        class="cvm-backdrop"
        @click.self="closeModal"
      >
        <article
          class="cvm-modal"
          role="dialog"
          aria-modal="true"
          :aria-label="event.title"
        >
          <button
            type="button"
            class="cvm-close"
            aria-label="Fechar"
            @click="closeModal"
          >
            ×
          </button>

          <header :class="['cvm-hero', `cvm-hero--${getEventTone(event)}`]">
            <div class="cvm-hero__icon">
              {{ getEventIcon(event) }}
            </div>

            <div class="cvm-hero__copy">
              <span>{{ getEventSourceLabel(event) }}</span>
              <h2>{{ event.title }}</h2>
              <p>{{ fmtDate(event.starts_at) }} · {{ fmtTime(event.starts_at) }}</p>
            </div>
          </header>

          <section class="cvm-body">
            <div class="cvm-info-grid">
              <div class="cvm-info-card">
                <small>Data</small>
                <strong>{{ fmtDate(event.starts_at) }}</strong>
              </div>

              <div class="cvm-info-card">
                <small>Horário</small>
                <strong>{{ fmtTime(event.starts_at) }}</strong>
              </div>

              <div class="cvm-info-card">
                <small>Status</small>
                <strong>{{ getStatusLabel(event.status) }}</strong>
              </div>

              <div v-if="event.opportunity_id" class="cvm-info-card">
                <small>Oportunidade</small>
                <strong>{{ opportunityTitle || 'Oportunidade vinculada' }}</strong>
              </div>
            </div>

            <section v-if="event.description" class="cvm-section">
              <small>Observação</small>
              <p>{{ event.description }}</p>
            </section>

            <section v-if="event.location" class="cvm-section">
              <small>Local</small>
              <p>{{ event.location }}</p>
            </section>

            <section v-if="event.opportunity_id" class="cvm-opportunity-box">
              <div>
                <span class="cvm-mini-eyebrow">Oportunidade conectada</span>
                <strong>{{ opportunityTitle || 'Oportunidade vinculada' }}</strong>
                <p v-if="currentOpportunity?.excerpt">{{ currentOpportunity.excerpt }}</p>
                <p v-else-if="loadingOpportunity">Carregando detalhes da oportunidade...</p>
                <p v-else>
                  Veja a página da oportunidade para contexto completo, requisitos, links e timeline original.
                </p>
              </div>

              <div class="cvm-opportunity-actions">
                <button type="button" class="cvm-dark-button" @click="openOpportunityPage">
                  Abrir oportunidade
                </button>

                <button
                  v-if="currentOpportunity?.official_site_url || event.external_url"
                  type="button"
                  class="cvm-light-button"
                  @click="openOfficialSite"
                >
                  Site oficial ↗
                </button>
              </div>
            </section>

            <section
              v-if="event.source_type === 'SECONNECTA_PUBLIC'"
              class="cvm-note cvm-note--official"
            >
              <strong>Data pública do seConecta</strong>
              <p>
                Essa data vem do calendário geral da plataforma. Para acompanhar pessoalmente, salve a oportunidade ou crie uma data no seu calendário.
              </p>
            </section>

            <section
              v-else-if="event.source_type === 'OPPORTUNITY_TIMELINE'"
              class="cvm-note cvm-note--official"
            >
              <strong>Data de oportunidade salva</strong>
              <p>
                Essa data veio da timeline da oportunidade. Você pode editar sua cópia pessoal sem alterar a oportunidade original.
              </p>
            </section>

            <section
              v-else-if="event.opportunity_id"
              class="cvm-note"
            >
              <strong>Data personalizada ligada à oportunidade</strong>
              <p>
                Essa é uma data sua: preparação, tarefa ou lembrete pessoal relacionado à oportunidade.
              </p>
            </section>

            <section v-if="event.opportunity_id" class="cvm-activity">
              <div class="cvm-section-head">
                <div>
                  <span class="cvm-mini-eyebrow">Atividade da oportunidade</span>
                  <strong>{{ isReadonlyPublic ? 'Suas datas salvas desta oportunidade' : 'Outras datas no seu calendário' }}</strong>
                </div>
                <small v-if="loadingRelated">Carregando...</small>
              </div>

              <p v-if="localError" class="cvm-inline-error">
                {{ localError }}
              </p>

              <div v-if="!loadingRelated && visibleRelatedEvents.length === 0" class="cvm-empty-activity">
                Você ainda não tem outras datas salvas para esta oportunidade.
              </div>

              <div v-else class="cvm-activity-list">
                <button
                  v-for="related in visibleRelatedEvents"
                  :key="related.id"
                  type="button"
                  :class="[
                    'cvm-related-event',
                    `cvm-related-event--${getEventTone(related)}`,
                    related.isCurrent && 'is-current',
                  ]"
                  @click="related.isCurrent ? null : emit('view', related)"
                >
                  <span>{{ getEventIcon(related) }}</span>
                  <span>
                    <strong>{{ related.title }}</strong>
                    <small>{{ fmtShortDate(related.starts_at) }} · {{ fmtEventTime(related) }}</small>
                  </span>
                  <em>{{ related.isCurrent ? 'Atual' : 'Ver' }}</em>
                </button>
              </div>
            </section>
          </section>

          <footer class="cvm-actions">
            <button type="button" class="cvm-secondary" @click="closeModal">
              Fechar
            </button>

            <button v-if="isReadonlyPublic && opportunityPath()" type="button" class="cvm-primary" @click="openOpportunityPage">
              Abrir oportunidade
            </button>

            <button v-if="!isReadonlyPublic" type="button" class="cvm-danger" @click="deleteEvent">
              Remover
            </button>

            <button v-if="!isReadonlyPublic" type="button" class="cvm-primary" @click="editEvent">
              Editar evento
            </button>
          </footer>
        </article>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.cvm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10020;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(15, 23, 42, .52);
  backdrop-filter: blur(8px);
}

.cvm-modal {
  width: min(720px, 100%);
  max-height: min(88vh, 820px);
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  border-radius: 28px;
  background: white;
  box-shadow: 0 34px 120px rgba(15, 23, 42, .34);
}

.cvm-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, .82);
  color: #0f172a;
  font-size: 1.2rem;
  font-weight: 900;
  cursor: pointer;
}

.cvm-hero {
  padding: 26px 54px 22px 24px;
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  gap: 15px;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
}

.cvm-hero--low { background: linear-gradient(135deg, #ecfdf5, #fff); }
.cvm-hero--normal { background: linear-gradient(135deg, #eff6ff, #fff); }
.cvm-hero--high { background: linear-gradient(135deg, #fffbeb, #fff); }
.cvm-hero--critical { background: linear-gradient(135deg, #fef2f2, #fff); }
.cvm-hero--done { background: linear-gradient(135deg, #f1f5f9, #fff); }

.cvm-hero__icon {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  border-radius: 20px;
  background: rgba(255, 255, 255, .82);
  border: 1px solid rgba(15, 23, 42, .06);
  font-size: 1.45rem;
}

.cvm-hero__copy {
  min-width: 0;
}

.cvm-hero__copy span,
.cvm-mini-eyebrow,
.cvm-section small,
.cvm-info-card small {
  color: #64748b;
  font-size: .67rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.cvm-hero__copy h2 {
  margin: 4px 0 5px;
  color: #0f172a;
  font-size: clamp(1.35rem, 3vw, 2rem);
  line-height: 1.02;
  letter-spacing: -.045em;
}

.cvm-hero__copy p {
  margin: 0;
  color: #475569;
  font-size: .85rem;
  font-weight: 850;
}

.cvm-body {
  overflow: auto;
  padding: 18px;
  display: grid;
  gap: 14px;
}

.cvm-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.cvm-info-card,
.cvm-section,
.cvm-opportunity-box,
.cvm-note,
.cvm-activity {
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: #f8fafc;
}

.cvm-info-card {
  min-width: 0;
  padding: 11px 12px;
  display: grid;
  gap: 4px;
}

.cvm-info-card strong {
  min-width: 0;
  color: #0f172a;
  font-size: .86rem;
  font-weight: 950;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cvm-section,
.cvm-note,
.cvm-activity {
  padding: 13px;
}

.cvm-section p,
.cvm-note p,
.cvm-opportunity-box p {
  margin: 5px 0 0;
  color: #475569;
  font-size: .84rem;
  line-height: 1.45;
}

.cvm-section p,
.cvm-note strong,
.cvm-opportunity-box strong,
.cvm-section-head strong {
  color: #0f172a;
  font-weight: 950;
}

.cvm-opportunity-box {
  padding: 14px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  background: linear-gradient(135deg, #f0fdfa, #fff);
  border-color: #bbf7d0;
}

.cvm-opportunity-box strong {
  display: block;
  margin-top: 4px;
  font-size: 1rem;
}

.cvm-opportunity-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: stretch;
}

.cvm-dark-button,
.cvm-light-button,
.cvm-primary,
.cvm-secondary,
.cvm-danger {
  border-radius: 999px;
  padding: 9px 13px;
  font-size: .78rem;
  font-weight: 950;
  cursor: pointer;
  border: 1px solid transparent;
  white-space: nowrap;
}

.cvm-dark-button,
.cvm-primary {
  background: #079272;
  color: white;
  border-color: #079272;
}

.cvm-light-button,
.cvm-secondary {
  background: white;
  color: #475569;
  border-color: #e2e8f0;
}

.cvm-danger {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}

.cvm-note {
  background: #f8fafc;
}

.cvm-note--official {
  background: #fffbeb;
  border-color: #fde68a;
}

.cvm-section-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 10px;
}

.cvm-section-head strong {
  display: block;
  margin-top: 3px;
}

.cvm-section-head small {
  color: #64748b;
  font-size: .72rem;
  font-weight: 850;
}

.cvm-inline-error {
  margin: 0 0 10px;
  color: #b91c1c;
  font-size: .78rem;
  font-weight: 850;
}

.cvm-empty-activity {
  border: 1px dashed #cbd5e1;
  border-radius: 14px;
  padding: 11px;
  color: #64748b;
  font-size: .8rem;
  font-weight: 800;
}

.cvm-activity-list {
  display: grid;
  gap: 8px;
}

.cvm-related-event {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 10px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 9px;
  align-items: center;
  text-align: left;
  cursor: pointer;
}

.cvm-related-event--low { background: #ecfdf5; border-color: #bbf7d0; }
.cvm-related-event--normal { background: #eff6ff; border-color: #bfdbfe; }
.cvm-related-event--high { background: #fffbeb; border-color: #fde68a; }
.cvm-related-event--critical { background: #fef2f2; border-color: #fecaca; }
.cvm-related-event--done { background: #f1f5f9; border-color: #e2e8f0; opacity: .76; }

.cvm-related-event.is-current {
  cursor: default;
  box-shadow: inset 0 0 0 1px rgba(7, 146, 114, .28);
}

.cvm-related-event strong {
  display: block;
  color: #0f172a;
  font-size: .82rem;
  font-weight: 950;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cvm-related-event small,
.cvm-related-event em {
  color: #64748b;
  font-size: .72rem;
  font-style: normal;
  font-weight: 850;
}

.cvm-related-event em {
  border-radius: 999px;
  padding: 5px 8px;
  background: rgba(255, 255, 255, .7);
}

.cvm-actions {
  padding: 14px 18px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  background: #fff;
}

.calendar-view-modal-enter-active,
.calendar-view-modal-leave-active {
  transition: opacity .18s ease;
}

.calendar-view-modal-enter-active .cvm-modal,
.calendar-view-modal-leave-active .cvm-modal {
  transition: transform .18s ease, opacity .18s ease;
}

.calendar-view-modal-enter-from,
.calendar-view-modal-leave-to {
  opacity: 0;
}

.calendar-view-modal-enter-from .cvm-modal,
.calendar-view-modal-leave-to .cvm-modal {
  opacity: 0;
  transform: translateY(12px) scale(.98);
}

@media (max-width: 680px) {
  .cvm-backdrop {
    padding: 10px;
    align-items: end;
  }

  .cvm-modal {
    width: 100%;
    max-height: 92vh;
    border-radius: 24px 24px 0 0;
  }

  .cvm-hero {
    grid-template-columns: 44px minmax(0, 1fr);
    padding: 22px 48px 18px 16px;
  }

  .cvm-hero__icon {
    width: 44px;
    height: 44px;
    border-radius: 16px;
  }

  .cvm-info-grid,
  .cvm-opportunity-box {
    grid-template-columns: 1fr;
  }

  .cvm-opportunity-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .cvm-actions {
    flex-wrap: wrap;
  }

  .cvm-actions button {
    flex: 1 1 auto;
  }
}
</style>