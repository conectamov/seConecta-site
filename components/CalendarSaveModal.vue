<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

type SaveItem = {
  id?: string | number

  event_id?: string | number
  eventId?: string | number
  calendar_event_id?: string | number
  calendarEventId?: string | number

  opportunity_id?: string | number
  opportunityId?: string | number
  opportunityID?: string | number
  oportunidade_id?: string | number
  oportunidadeId?: string | number

  data?: string
  horario?: string
  titulo?: string
  fonte?: string
  importancia?: string
  categoria?: string
  oportunidade?: string
  local?: string
  descricao?: string
  link_seconecta?: string
  link_oficial?: string
  icon?: string
  tone?: string
}

type ExportFormat = 'PDF' | 'XLSX' | 'CSV' | 'GOOGLE_SHEETS'

type ExportScope =
  | 'SELECTED_EVENTS'
  | 'SELECTED_OPPORTUNITIES'
  | 'DATE_RANGE'
  | 'CURRENT_MONTH'
  | 'ALL_VISIBLE'

const props = withDefaults(defineProps<{
  open: boolean
  eventsCount?: number
  monthLabel?: string
  scopeLabel?: string
  items?: SaveItem[]

  apiBase?: string
  title?: string
  scope?: ExportScope
  eventIds?: Array<string | number>
  opportunityIds?: Array<string | number>
  startsAt?: string | null
  endsAt?: string | null
  includeDone?: boolean
  includeHidden?: boolean
  includeCancelled?: boolean
  includeDescription?: boolean
  includeSourceSnapshot?: boolean
  includeOpportunityLinks?: boolean
}>(), {
  apiBase: '/api/v1',
  scope: 'SELECTED_EVENTS',
  includeDone: false,
  includeHidden: false,
  includeCancelled: false,
  includeDescription: true,
  includeSourceSnapshot: true,
  includeOpportunityLinks: true,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  exported: [payload: { format: ExportFormat; url?: string }]
}>()

const { restoreSession, getAccessToken } = useAuth()

const exporting = ref<ExportFormat | null>(null)
const exportError = ref<string | null>(null)
const sheetUrl = ref<string | null>(null)

const visibleItems = computed(() => Array.isArray(props.items) ? props.items : [])

function normalizeBaseUrl(base: string) {
  return String(base || '/api/v1').replace(/\/$/, '')
}

function toCleanStringId(value: unknown) {
  if (value === null || value === undefined) return null

  const text = String(value).trim()

  return text ? text : null
}

function toCleanNumberId(value: unknown) {
  if (value === null || value === undefined || value === '') return null

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}

function isUuidLike(value: unknown) {
  const text = toCleanStringId(value)

  if (!text) return false

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
}

function extractOpportunityIdFromSyntheticId(value: unknown) {
  const text = toCleanStringId(value)

  if (!text) return null

  const directNumber = toCleanNumberId(text)

  if (directNumber !== null) return directNumber

  const patterns = [
    /^seconecta-(\d+)(?:-|$)/i,
    /^opportunity-(\d+)(?:-|$)/i,
    /^oportunidade-(\d+)(?:-|$)/i,
    /^opp-(\d+)(?:-|$)/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)

    if (match?.[1]) {
      const parsed = Number(match[1])

      if (Number.isFinite(parsed)) return parsed
    }
  }

  return null
}

function itemEventId(item: SaveItem) {
  return (
    item.event_id ??
    item.eventId ??
    item.calendar_event_id ??
    item.calendarEventId ??
    null
  )
}

function itemOpportunityId(item: SaveItem) {
  return (
    item.opportunity_id ??
    item.opportunityId ??
    item.opportunityID ??
    item.oportunidade_id ??
    item.oportunidadeId ??
    extractOpportunityIdFromSyntheticId(item.id)
  )
}

const explicitEventIds = computed(() => {
  if (!Array.isArray(props.eventIds)) return []

  return props.eventIds
    .map(toCleanStringId)
    .filter((id): id is string => Boolean(id) && isUuidLike(id))
})

const explicitOpportunityIds = computed(() => {
  if (!Array.isArray(props.opportunityIds)) return []

  return props.opportunityIds
    .map(toCleanNumberId)
    .filter((id): id is number => id !== null)
})

const fallbackEventIds = computed(() => {
  return visibleItems.value
    .map(itemEventId)
    .map(toCleanStringId)
    .filter((id): id is string => Boolean(id) && isUuidLike(id))
})

const fallbackOpportunityIds = computed(() => {
  return visibleItems.value
    .map(itemOpportunityId)
    .map(toCleanNumberId)
    .filter((id): id is number => id !== null)
})

const selectedLooksLikeOpportunities = computed(() => {
  if (props.scope === 'SELECTED_OPPORTUNITIES') return true
  if (explicitOpportunityIds.value.length > 0) return true
  if (fallbackOpportunityIds.value.length > 0) return true

  return false
})

const effectiveScope = computed<ExportScope>(() => {
  if (props.scope === 'SELECTED_EVENTS' && selectedLooksLikeOpportunities.value) {
    return 'SELECTED_OPPORTUNITIES'
  }

  return props.scope
})

const resolvedEventIds = computed(() => {
  if (effectiveScope.value !== 'SELECTED_EVENTS') return []

  if (explicitEventIds.value.length > 0) {
    return explicitEventIds.value
  }

  return fallbackEventIds.value
})

const resolvedOpportunityIds = computed(() => {
  if (effectiveScope.value !== 'SELECTED_OPPORTUNITIES') return []

  if (explicitOpportunityIds.value.length > 0) {
    return explicitOpportunityIds.value
  }

  return fallbackOpportunityIds.value
})

const count = computed(() => {
  if (visibleItems.value.length > 0) return visibleItems.value.length

  if (resolvedEventIds.value.length > 0) return resolvedEventIds.value.length
  if (resolvedOpportunityIds.value.length > 0) return resolvedOpportunityIds.value.length

  return Number(props.eventsCount || 0)
})

const countLabel = computed(() => {
  return `${count.value} item${count.value === 1 ? '' : 's'} selecionado${count.value === 1 ? '' : 's'}`
})

const canExport = computed(() => {
  if (
    effectiveScope.value === 'DATE_RANGE' ||
    effectiveScope.value === 'CURRENT_MONTH' ||
    effectiveScope.value === 'ALL_VISIBLE'
  ) {
    return true
  }

  return resolvedEventIds.value.length > 0 || resolvedOpportunityIds.value.length > 0
})

const missingIdsMessage = computed(() => {
  if (count.value > 0) {
    return [
      'O modal recebeu itens selecionados, mas nenhum ID válido para exportação.',
      '',
      'Para oportunidades, envie opportunity_id ou :opportunity-ids.',
      'Para eventos, envie event_id UUID ou :event-ids com UUIDs reais.',
      '',
      'Importante: id como "seconecta-..." deve ser usado só como key visual, não como event_id.',
    ].join('\n')
  }

  return 'Selecione ao menos um evento ou oportunidade antes de exportar.'
})

const emptyMessage = computed(() => {
  if (count.value > 0) {
    return 'A contagem chegou, mas a lista detalhada não. Verifique se a página do calendário está enviando os itens selecionados para o modal.'
  }

  return 'Nenhuma data entra nesse recorte. Volte ao calendário e ajuste os filtros.'
})

function formatGroupDate(raw: string) {
  if (!raw || raw === 'Sem data') return 'Sem data'

  const clean = String(raw).slice(0, 10)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return raw

  const [year, month, day] = clean.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const groupedByDate = computed(() => {
  const groups = new Map<string, SaveItem[]>()

  for (const item of visibleItems.value) {
    const key = item.data || 'Sem data'

    if (!groups.has(key)) groups.set(key, [])

    groups.get(key)?.push(item)
  }

  return [...groups.entries()]
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    .map(([date, items]) => ({
      date,
      label: formatGroupDate(date),
      items,
    }))
})

const categorySummary = computed(() => {
  const counts = new Map<string, number>()

  for (const item of visibleItems.value) {
    const key = item.categoria || item.fonte || 'Outro'
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
    .slice(0, 6)
    .map(([label, total]) => ({ label, total }))
})

function buildExportPayload(format: ExportFormat) {
  return {
    format,
    scope: effectiveScope.value,
    event_ids: resolvedEventIds.value,
    opportunity_ids: resolvedOpportunityIds.value,
    starts_at: props.startsAt || null,
    ends_at: props.endsAt || null,
    include_done: props.includeDone,
    include_hidden: props.includeHidden,
    include_cancelled: props.includeCancelled,
    include_description: props.includeDescription,
    include_source_snapshot: props.includeSourceSnapshot,
    include_opportunity_links: props.includeOpportunityLinks,
    title: props.title || `Calendário seConecta${props.monthLabel ? ` — ${props.monthLabel}` : ''}`,
    timezone: 'America/Fortaleza',
  }
}

function endpointFor(format: ExportFormat) {
  return {
    PDF: '/calendar/export/pdf',
    XLSX: '/calendar/export/xlsx',
    CSV: '/calendar/export/csv',
    GOOGLE_SHEETS: '/calendar/export/google-sheets',
  }[format]
}

function filenameFor(format: ExportFormat) {
  const cleanMonth = (props.monthLabel || 'calendario')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const extension = {
    PDF: 'pdf',
    XLSX: 'xlsx',
    CSV: 'csv',
    GOOGLE_SHEETS: 'xlsx',
  }[format]

  return `seconecta-${cleanMonth || 'calendario'}.${extension}`
}

function formatApiError(errorBody: any) {
  const detail = errorBody?.detail ?? errorBody?.message ?? errorBody

  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail)) {
    return detail
      .map((errorItem) => {
        if (typeof errorItem === 'string') return errorItem

        const loc = Array.isArray(errorItem?.loc)
          ? errorItem.loc.join('.')
          : ''

        const msg =
          errorItem?.msg ||
          errorItem?.message ||
          errorItem?.detail ||
          JSON.stringify(errorItem)

        return loc ? `${loc}: ${msg}` : msg
      })
      .join('\n')
  }

  if (detail && typeof detail === 'object') {
    if (Array.isArray(detail.errors)) {
      return formatApiError(detail.errors)
    }

    return detail.message || detail.msg || JSON.stringify(detail, null, 2)
  }

  return 'Não foi possível concluir a exportação.'
}

async function readErrorMessage(response: Response) {
  let message = 'Não foi possível concluir a exportação.'

  const contentType = response.headers.get('content-type') || ''

  try {
    if (contentType.includes('application/json')) {
      const data = await response.json()
      message = formatApiError(data)
    } else {
      const text = await response.text()
      message = text || message
    }
  } catch {
    message = 'Não foi possível ler a resposta de erro do servidor.'
  }

  return message
}

async function authedRequest(path: string, options: RequestInit = {}) {
  await restoreSession()

  const token = getAccessToken()
  const url = `${normalizeBaseUrl(props.apiBase)}${path}`
  const headers = new Headers(options.headers || {})

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const message = await readErrorMessage(response)
    throw new Error(message)
  }

  return response
}

async function downloadExport(format: 'PDF' | 'XLSX' | 'CSV') {
  exportError.value = null
  sheetUrl.value = null

  if (!canExport.value) {
    exportError.value = missingIdsMessage.value
    return
  }

  exporting.value = format

  try {
    const payload = buildExportPayload(format)

    console.log('EXPORT PAYLOAD', payload)

    const response = await authedRequest(endpointFor(format), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filenameFor(format)
    document.body.appendChild(link)
    link.click()
    link.remove()

    window.setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 1000)

    emit('exported', { format })
  } catch (error: any) {
    exportError.value = error?.message || 'Não foi possível baixar o arquivo.'
  } finally {
    exporting.value = null
  }
}

async function saveToGoogleSheets() {
  exportError.value = null
  sheetUrl.value = null

  if (!canExport.value) {
    exportError.value = missingIdsMessage.value
    return
  }

  exporting.value = 'GOOGLE_SHEETS'

  try {
    const payload = buildExportPayload('GOOGLE_SHEETS')

    console.log('EXPORT PAYLOAD', payload)

    const response = await authedRequest(endpointFor('GOOGLE_SHEETS'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    sheetUrl.value =
      data?.spreadsheet_url ||
      data?.external_url ||
      data?.url ||
      data?.webViewLink ||
      null

    emit('exported', { format: 'GOOGLE_SHEETS', url: sheetUrl.value || undefined })

    if (sheetUrl.value) {
      window.open(sheetUrl.value, '_blank', 'noopener,noreferrer')
    }
  } catch (error: any) {
    exportError.value = error?.message || 'Não foi possível salvar no Google Sheets.'
  } finally {
    exporting.value = null
  }
}

function close() {
  emit('update:open', false)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) close()
}

watch(
  () => props.open,
  (value) => {
    exportError.value = null
    sheetUrl.value = null

    if (typeof document !== 'undefined') {
      document.body.style.overflow = value ? 'hidden' : ''
    }

    if (typeof window === 'undefined') return

    if (value) window.addEventListener('keydown', handleKeydown)
    else window.removeEventListener('keydown', handleKeydown)
  },
)

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') document.body.style.overflow = ''
  if (typeof window !== 'undefined') window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="calendar-save-modal">
      <div
        v-if="open"
        class="calendar-save-backdrop"
        @click.self="close"
      >
        <article
          class="calendar-save-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Salvar calendário"
        >
          <header class="calendar-save-modal__header">
            <div>
              <span>Salvar calendário</span>
              <h2>Recorte que será baixado</h2>
              <p>
                Confira exatamente quais datas entram no arquivo antes de baixar PDF
                ou enviar para uma planilha.
              </p>
            </div>

            <button
              type="button"
              aria-label="Fechar"
              class="calendar-save-modal__close"
              @click="close"
            >
              ×
            </button>
          </header>

          <section class="calendar-save-summary">
            <div>
              <small>Período</small>
              <strong>{{ monthLabel || 'Mês atual' }}</strong>
            </div>

            <div>
              <small>Filtro aplicado</small>
              <strong>{{ scopeLabel || 'Calendário atual' }}</strong>
            </div>

            <div>
              <small>Conteúdo</small>
              <strong>{{ countLabel }}</strong>
            </div>
          </section>

          <section
            v-if="categorySummary.length > 0"
            class="calendar-save-categories"
            aria-label="Resumo do recorte"
          >
            <span
              v-for="category in categorySummary"
              :key="category.label"
            >
              {{ category.label }} <em>{{ category.total }}</em>
            </span>
          </section>

          <main class="calendar-save-preview">
            <div class="calendar-save-preview__head">
              <div>
                <strong>Conteúdos selecionados</strong>
                <p>Essa é a lista que será usada no PDF/Sheets.</p>
              </div>

              <span>{{ countLabel }}</span>
            </div>

            <div v-if="visibleItems.length === 0" class="calendar-save-empty">
              {{ emptyMessage }}
            </div>

            <div v-else class="calendar-save-list">
              <section
                v-for="group in groupedByDate"
                :key="group.date"
                class="calendar-save-day"
              >
                <h3>{{ group.label }}</h3>

                <article
                  v-for="item in group.items"
                  :key="item.event_id || item.eventId || item.opportunity_id || item.opportunityId || item.id || `${item.data}-${item.titulo}`"
                  :class="['calendar-save-item', item.tone && `calendar-save-item--${item.tone}`]"
                >
                  <div class="calendar-save-item__icon">
                    {{ item.icon || '📅' }}
                  </div>

                  <div class="calendar-save-item__body">
                    <strong>{{ item.titulo || 'Evento sem título' }}</strong>

                    <p>
                      <span>{{ item.horario || 'Dia inteiro' }}</span>
                      <span v-if="item.fonte">{{ item.fonte }}</span>
                      <span v-if="item.categoria">{{ item.categoria }}</span>
                    </p>

                    <small v-if="item.oportunidade && item.oportunidade !== item.titulo">
                      {{ item.oportunidade }}
                    </small>

                    <em v-if="item.local">{{ item.local }}</em>
                  </div>
                </article>
              </section>
            </div>
          </main>

          <section v-if="exportError || sheetUrl" class="calendar-save-alerts">
            <p v-if="exportError" class="calendar-save-alert calendar-save-alert--error">
              {{ exportError }}
            </p>

            <a
              v-if="sheetUrl"
              :href="sheetUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="calendar-save-alert calendar-save-alert--success"
            >
              Planilha criada. Abrir Google Sheets →
            </a>
          </section>

          <section class="calendar-save-options">
            <button
              type="button"
              class="calendar-save-option calendar-save-option--pdf"
              :disabled="Boolean(exporting) || !canExport"
              @click="downloadExport('PDF')"
            >
              <span class="calendar-save-option__icon">📄</span>

              <span>
                <strong>Baixar PDF</strong>
                <small>Gera uma versão limpa do recorte para imprimir, enviar ou salvar.</small>
              </span>

              <em>{{ exporting === 'PDF' ? 'Gerando...' : 'PDF' }}</em>
            </button>

            <button
              type="button"
              class="calendar-save-option calendar-save-option--xlsx"
              :disabled="Boolean(exporting) || !canExport"
              @click="downloadExport('XLSX')"
            >
              <span class="calendar-save-option__icon">📊</span>

              <span>
                <strong>Baixar planilha</strong>
                <small>Exporta datas, títulos, origem, categoria e links para Excel.</small>
              </span>

              <em>{{ exporting === 'XLSX' ? 'Gerando...' : 'XLSX' }}</em>
            </button>

            <button
              type="button"
              class="calendar-save-option calendar-save-option--sheets"
              :disabled="Boolean(exporting) || !canExport"
              @click="saveToGoogleSheets"
            >
              <span class="calendar-save-option__icon">🟢</span>

              <span>
                <strong>Salvar no Google Sheets</strong>
                <small>Cria uma planilha online com o recorte selecionado.</small>
              </span>

              <em>{{ exporting === 'GOOGLE_SHEETS' ? 'Salvando...' : 'Sheets' }}</em>
            </button>
          </section>

          <footer class="calendar-save-modal__footer">
            <button type="button" class="calendar-save-secondary" @click="close">
              Fechar
            </button>
          </footer>
        </article>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.calendar-save-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1700;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.58);
  backdrop-filter: blur(12px);
}

.calendar-save-modal {
  width: min(920px, 100%);
  max-height: min(90vh, 920px);
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr) auto auto auto;
  overflow: hidden;
  border-radius: 30px;
  background: #fff;
  box-shadow: 0 32px 100px rgba(15, 23, 42, 0.3);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.calendar-save-modal__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 38px;
  gap: 16px;
  align-items: start;
  padding: 24px 26px 18px;
  border-bottom: 1px solid #e2e8f0;
  background:
    radial-gradient(circle at top left, rgba(7, 146, 114, 0.16), transparent 18rem),
    linear-gradient(135deg, #ecfdf5, #ffffff 68%);
}

.calendar-save-modal__header span {
  color: #079272;
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.calendar-save-modal__header h2 {
  margin: 5px 0 7px;
  color: #0f172a;
  font-size: clamp(1.55rem, 4vw, 2.25rem);
  line-height: 1;
  letter-spacing: -0.055em;
}

.calendar-save-modal__header p {
  max-width: 680px;
  margin: 0;
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.55;
  font-weight: 500;
}

.calendar-save-modal__close {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: #0f172a;
  font-size: 1.22rem;
  font-weight: 800;
  cursor: pointer;
}

.calendar-save-summary {
  display: grid;
  grid-template-columns: 1fr 1.6fr 1fr;
  gap: 10px;
  padding: 15px 26px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.calendar-save-summary div {
  min-width: 0;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 11px 12px;
  background: white;
}

.calendar-save-summary small {
  display: block;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 850;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.calendar-save-summary strong {
  display: block;
  margin-top: 4px;
  overflow: hidden;
  color: #0f172a;
  font-size: 0.86rem;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar-save-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 26px;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
}

.calendar-save-categories span {
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 7px 10px;
  background: #f8fafc;
  color: #334155;
  font-size: 0.76rem;
  font-weight: 800;
}

.calendar-save-categories em {
  margin-left: 4px;
  color: #079272;
  font-style: normal;
  font-weight: 850;
}

.calendar-save-preview {
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 12px;
  overflow: hidden;
  padding: 16px 26px 18px;
  background: #fff;
}

.calendar-save-preview__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.calendar-save-preview__head strong {
  display: block;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 850;
}

.calendar-save-preview__head p {
  margin: 3px 0 0;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 500;
  line-height: 1.4;
}

.calendar-save-preview__head > span {
  border-radius: 999px;
  padding: 7px 10px;
  background: #ecfdf5;
  color: #047857;
  font-size: 0.76rem;
  font-weight: 850;
  white-space: nowrap;
}

.calendar-save-empty {
  border: 1px dashed #cbd5e1;
  border-radius: 20px;
  padding: 18px;
  background: #f8fafc;
  color: #64748b;
  font-size: 0.88rem;
  font-weight: 650;
  text-align: center;
}

.calendar-save-list {
  min-height: 0;
  max-height: 310px;
  overflow: auto;
  display: grid;
  gap: 12px;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.calendar-save-day {
  display: grid;
  gap: 8px;
}

.calendar-save-day h3 {
  position: sticky;
  top: 0;
  z-index: 1;
  width: fit-content;
  margin: 0;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.95);
  color: #475569;
  font-size: 0.75rem;
  font-weight: 850;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  backdrop-filter: blur(8px);
}

.calendar-save-item {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 11px;
  align-items: start;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 12px;
  background: #f8fafc;
}

.calendar-save-item--critical { background: #fef2f2; border-color: #fecaca; }
.calendar-save-item--high { background: #fffbeb; border-color: #fde68a; }
.calendar-save-item--normal { background: #eff6ff; border-color: #bfdbfe; }
.calendar-save-item--low { background: #ecfdf5; border-color: #bbf7d0; }
.calendar-save-item--olympiad { background: #ecfdf5; border-color: #bbf7d0; }
.calendar-save-item--competition { background: #fff7ed; border-color: #fed7aa; }
.calendar-save-item--summer { background: #eff6ff; border-color: #bfdbfe; }
.calendar-save-item--scholarship { background: #f5f3ff; border-color: #ddd6fe; }
.calendar-save-item--workshop { background: #fdf2f8; border-color: #fbcfe8; }
.calendar-save-item--volunteering { background: #f0fdfa; border-color: #99f6e4; }
.calendar-save-item--initiative { background: #f7fee7; border-color: #d9f99d; }
.calendar-save-item--extracurricular { background: #fff7ed; border-color: #fed7aa; }
.calendar-save-item--mun { background: #eff6ff; border-color: #bfdbfe; }

.calendar-save-item__icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(15, 23, 42, 0.05);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.82);
  font-size: 1.12rem;
}

.calendar-save-item__body {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.calendar-save-item__body strong {
  color: #0f172a;
  font-size: 0.92rem;
  font-weight: 850;
  line-height: 1.25;
}

.calendar-save-item__body p {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin: 0;
}

.calendar-save-item__body p span {
  border-radius: 999px;
  padding: 3px 7px;
  background: rgba(255, 255, 255, 0.72);
  color: #475569;
  font-size: 0.7rem;
  font-weight: 750;
}

.calendar-save-item__body small {
  color: #334155;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.35;
}

.calendar-save-item__body em {
  color: #64748b;
  font-size: 0.72rem;
  font-style: normal;
  font-weight: 600;
  line-height: 1.35;
}

.calendar-save-alerts {
  display: grid;
  gap: 8px;
  padding: 0 26px 12px;
  background: #fff;
}

.calendar-save-alert {
  margin: 0;
  border-radius: 16px;
  padding: 10px 12px;
  font-size: 0.84rem;
  font-weight: 750;
  text-decoration: none;
}

.calendar-save-alert--error {
  max-height: 160px;
  overflow: auto;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
  white-space: pre-wrap;
}

.calendar-save-alert--success {
  border: 1px solid #bbf7d0;
  background: #ecfdf5;
  color: #047857;
}

.calendar-save-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 16px 26px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.calendar-save-option {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  padding: 14px;
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  gap: 13px;
  align-items: center;
  text-align: left;
  cursor: pointer;
  transition: 0.18s ease;
}

.calendar-save-option:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.calendar-save-option:disabled {
  cursor: not-allowed;
  opacity: 0.56;
}

.calendar-save-option--pdf {
  background: linear-gradient(135deg, #eff6ff, #ffffff);
  border-color: #bfdbfe;
}

.calendar-save-option--xlsx {
  background: linear-gradient(135deg, #f7fee7, #ffffff);
  border-color: #d9f99d;
}

.calendar-save-option--sheets {
  background: linear-gradient(135deg, #ecfdf5, #ffffff);
  border-color: #bbf7d0;
}

.calendar-save-option__icon {
  width: 46px;
  height: 46px;
  border: 1px solid rgba(15, 23, 42, 0.05);
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.78);
  font-size: 1.35rem;
}

.calendar-save-option strong {
  display: block;
  color: #0f172a;
  font-size: 0.94rem;
  font-weight: 850;
}

.calendar-save-option small {
  display: block;
  margin-top: 3px;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 500;
  line-height: 1.38;
}

.calendar-save-option em {
  grid-column: 2;
  width: fit-content;
  border-radius: 999px;
  padding: 6px 9px;
  background: rgba(15, 23, 42, 0.08);
  color: #475569;
  font-size: 0.68rem;
  font-style: normal;
  font-weight: 850;
  white-space: nowrap;
}

.calendar-save-modal__footer {
  display: flex;
  justify-content: flex-end;
  padding: 13px 26px;
  border-top: 1px solid #e2e8f0;
  background: white;
}

.calendar-save-secondary {
  border: none;
  border-radius: 999px;
  padding: 10px 15px;
  background: #0f172a;
  color: white;
  font-size: 0.82rem;
  font-weight: 850;
  cursor: pointer;
}

.calendar-save-modal-enter-active,
.calendar-save-modal-leave-active {
  transition: opacity 0.18s ease;
}

.calendar-save-modal-enter-active .calendar-save-modal,
.calendar-save-modal-leave-active .calendar-save-modal {
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.calendar-save-modal-enter-from,
.calendar-save-modal-leave-to {
  opacity: 0;
}

.calendar-save-modal-enter-from .calendar-save-modal,
.calendar-save-modal-leave-to .calendar-save-modal {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

@media (max-width: 900px) {
  .calendar-save-options {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .calendar-save-backdrop {
    align-items: end;
    padding: 10px;
  }

  .calendar-save-modal {
    max-height: 94vh;
    border-radius: 24px 24px 0 0;
    grid-template-rows: auto auto auto minmax(0, 1fr) auto auto auto;
  }

  .calendar-save-modal__header,
  .calendar-save-summary,
  .calendar-save-categories,
  .calendar-save-preview,
  .calendar-save-options,
  .calendar-save-modal__footer,
  .calendar-save-alerts {
    padding-left: 14px;
    padding-right: 14px;
  }

  .calendar-save-summary {
    grid-template-columns: 1fr;
  }

  .calendar-save-preview__head {
    align-items: flex-start;
    flex-direction: column;
  }

  .calendar-save-list {
    max-height: 330px;
  }
}
</style>