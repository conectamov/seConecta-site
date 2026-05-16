<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  opportunity: any | null
  isAdmin?: boolean
}>()

const emit = defineEmits<{
  close: []
  edit: [item: any]
  loaded: [item: any]
}>()

const { get } = useAxios()

const CATEGORY_META: Record<string, {
  label: string
  icon: string
  color: string
}> = {
  COMPETITION: { label: 'Competição', icon: '🏆', color: '#f59e0b' },
  OLYMPIAD: { label: 'Olimpíada', icon: '🏅', color: '#10b981' },
  MUN: { label: 'MUN', icon: '🌐', color: '#6366f1' },
  SCHOLARSHIP: { label: 'Bolsa de estudos', icon: '🎓', color: '#8b5cf6' },
  SUMMER_PROGRAM: { label: 'Programa de verão', icon: '☀️', color: '#0ea5e9' },
  WORKSHOP: { label: 'Workshop', icon: '🛠️', color: '#ec4899' },
  VOLUNTEERING: { label: 'Voluntariado', icon: '🤝', color: '#14b8a6' },
  EXTRACURRICULAR: { label: 'Extracurricular', icon: '⚡', color: '#f97316' },
  INITIATIVE: { label: 'Iniciativa', icon: '💡', color: '#84cc16' },
  POST: { label: 'Post', icon: '📌', color: '#6b7280' },
}

const PRIORITY_LABEL: Record<number, { label: string; color: string }> = {
  5: { label: 'Melhores oportunidades', color: '#f59e0b' },
  4: { label: 'Em destaque', color: '#10b981' },
  3: { label: 'Destaque', color: '#6366f1' },
  2: { label: 'Recomendado', color: '#0ea5e9' },
  1: { label: 'Relevante', color: '#a78bfa' },
  0: { label: '', color: '' },
}

const CATEGORY_DATA_LABELS: Record<string, string> = {
  organizer: 'Organizador',
  target_audience: 'Público-alvo',
  requirements: 'Requisitos',
  benefits: 'Benefícios',
  application_process: 'Como participar',
  cost_info: 'Custo',
  format: 'Formato',
  workload: 'Carga/Duração',
  source_notes: 'Observações',
  type: 'Tipo',
  prizes: 'Prêmios',
  stages: 'Etapas',
  min_words: 'Mín. palavras',
  max_words: 'Máx. palavras',
  duration: 'Duração',
  deliverables: 'Entregáveis',
  selection_criteria: 'Critérios de seleção',
}

const CATEGORY_DATA_ORDER = [
  'organizer',
  'target_audience',
  'cost_info',
  'format',
  'workload',
  'requirements',
  'benefits',
  'application_process',
  'source_notes',
]

const SPECIFICS_ORDER = [
  'prizes',
  'stages',
  'min_words',
  'max_words',
  'duration',
  'deliverables',
  'selection_criteria',
]

const localOpportunity = ref<any | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const REQUEST_TIMEOUT_MS = 12000

let requestSeq = 0

function withTimeout<T>(promise: Promise<T>, ms = REQUEST_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Tempo limite ao carregar detalhes.'))
      }, ms)
    }),
  ])
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

function normalizeTags(value: any) {
  if (Array.isArray(value)) return value.filter(Boolean)

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.filter(Boolean)
    } catch {}

    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
  }

  return []
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
    .map((event) => ({
      ...event,
      label: event.label ?? event.details ?? event.title ?? event.name ?? 'Evento',
      details: event.details ?? event.description ?? null,
      date: event.date ?? event.datetime ?? event.deadline ?? null,
    }))
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

function formatDeadline(raw: string | null | undefined) {
  const dt = parseLocalDate(raw)
  if (!dt) {
    return {
      label: 'Sem prazo acionável',
      urgent: false,
      overdue: false,
      daysLeft: null as number | null,
    }
  }

  const now = new Date()
  const diff = Math.ceil((dt.getTime() - now.getTime()) / 86_400_000)

  if (diff < 0) {
    return {
      label: 'Encerrado',
      urgent: false,
      overdue: true,
      daysLeft: diff,
    }
  }

  if (diff === 0) {
    return {
      label: 'Último dia!',
      urgent: true,
      overdue: false,
      daysLeft: 0,
    }
  }

  if (diff <= 3) {
    return {
      label: `${diff}d restante${diff > 1 ? 's' : ''}`,
      urgent: true,
      overdue: false,
      daysLeft: diff,
    }
  }

  if (diff <= 14) {
    return {
      label: `${diff} dias`,
      urgent: false,
      overdue: false,
      daysLeft: diff,
    }
  }

  return {
    label: fmtShortDate(raw) ?? 'Sem prazo',
    urgent: false,
    overdue: false,
    daysLeft: diff,
  }
}

function getFirstTimelineDeadline(timeline: any[]) {
  const now = new Date()

  return [...timeline]
    .map((event) => ({
      ...event,
      _date: parseLocalDate(event?.date),
    }))
    .filter((event) => event._date && event._date >= now)
    .sort((a, b) => a._date.getTime() - b._date.getTime())[0] ?? null
}

function getDeadlinePrefix(event: any) {
  const text = [
    event?.label,
    event?.details,
    event?.description,
    event?.title,
    event?.name,
  ].filter(Boolean).join(' ').toLowerCase()

  if (text.includes('prova') || text.includes('exame')) return 'Prova em'
  if (text.includes('resultado')) return 'Resultado em'
  if (text.includes('envio') || text.includes('submiss')) return 'Envio até'
  if (text.includes('candidatura') || text.includes('application') || text.includes('apply')) return 'Candidatura até'
  if (text.includes('inscri')) return 'Inscrições até'

  return 'Prazo em'
}

function formatActionDeadline(event: any, raw: string | null | undefined) {
  if (!raw) return ''

  const deadline = formatDeadline(raw)
  const prefix = getDeadlinePrefix(event)

  if (deadline.urgent || (deadline.daysLeft !== null && deadline.daysLeft <= 14)) {
    return `${prefix} · ${deadline.label}`
  }

  return `${prefix} ${fmtShortDate(raw) ?? deadline.label}`
}

function toTextValue(value: any): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  if (typeof value === 'number') return String(value)

  if (Array.isArray(value)) {
    const clean = value
      .map((item) => toTextValue(item))
      .filter(Boolean)

    return clean.length ? clean.join(' · ') : null
  }

  if (typeof value === 'object') return null

  const text = String(value).trim()
  return text || null
}

function makeInfoCard(key: string, value: any) {
  const label = toTextValue(value)
  if (!label) return null

  return {
    title: CATEGORY_DATA_LABELS[key] ?? key.replaceAll('_', ' '),
    label,
  }
}

function getInfoIcon(title: string) {
  const map: Record<string, string> = {
    Organizador: '🏛️',
    'Público-alvo': '🎯',
    Custo: '💸',
    Formato: '🧭',
    'Carga/Duração': '⏱️',
    Requisitos: '📋',
    Benefícios: '✨',
    'Como participar': '✅',
    Observações: '📝',
    Prêmios: '🏅',
    Etapas: '🪜',
    'Mín. palavras': '✍️',
    'Máx. palavras': '✍️',
    Duração: '⏱️',
    Entregáveis: '📦',
    'Critérios de seleção': '🔎',
  }

  return map[title] ?? '•'
}

function getInfoVariant(title: string) {
  if (['Como participar', 'Requisitos', 'Critérios de seleção', 'Entregáveis'].includes(title)) {
    return 'blue'
  }

  if (['Prêmios', 'Benefícios'].includes(title)) {
    return 'amber'
  }

  if (['Custo', 'Formato', 'Carga/Duração', 'Duração', 'Etapas', 'Máx. palavras', 'Mín. palavras'].includes(title)) {
    return 'emerald'
  }

  return 'zinc'
}

function getCardLines(card: any) {
  const value = card?.label

  if (!value) return []

  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String)
  }

  const text = String(value).trim()

  if (!text) return []

  if (text.includes(' · ')) {
    return text
      .split(' · ')
      .map((part) => part.trim())
      .filter(Boolean)
  }

  return [text]
}

function extractResponseData(res: any) {
  return res?.data?.data ?? res?.data
}

function normalizeOpportunity(raw: any) {
  if (!raw) return null

  const category = raw.category ?? ''
  const fallbackMeta = {
    label: 'Oportunidade',
    icon: '✨',
    color: '#10b981',
  }

  const categoryMeta = CATEGORY_META[category] ?? raw.categoryMeta ?? fallbackMeta
  const timeline = normalizeTimeline(raw.timeline)
  const categoryData = normalizeJsonObject(raw.category_data)
  const nextTimelineEvent = getFirstTimelineDeadline(timeline)
  const displayDeadlineRaw = nextTimelineEvent?.date ?? raw.next_deadline ?? null
  const deadline = formatDeadline(displayDeadlineRaw)
  const priority = typeof raw.priority === 'number'
    ? Math.min(5, Math.max(0, raw.priority))
    : 0

  return {
    ...raw,
    id: raw.id,
    slug: raw.slug ?? null,
    title: raw.title ?? 'Carregando oportunidade...',
    excerpt: raw.excerpt ?? raw.description?.slice?.(0, 160) ?? '',
    description: raw.description ?? '',
    content: raw.content ?? '',
    category,
    categoryMeta,
    cover_url: raw.cover_url ?? null,
    official_site_url: raw.official_site_url ?? null,
    location: raw.location ?? 'Online',
    is_free: !!raw.is_free,
    next_deadline: displayDeadlineRaw,
    next_timeline_event: nextTimelineEvent,
    deadline,
    deadlineActionLabel: formatActionDeadline(nextTimelineEvent, displayDeadlineRaw),
    timeline,
    tags: normalizeTags(raw.tags),
    category_data: categoryData,
    human_verified: !!raw.human_verified,
    approved: !!raw.approved,
    priority,
    priorityMeta: PRIORITY_LABEL[priority] ?? PRIORITY_LABEL[0],
  }
}

async function fetchFullOpportunity(base: any) {
  if (!base) return

  const currentRequest = ++requestSeq
  const slug = String(base.slug || '').trim()
  const id = Number(base.id)

  if (!slug && (!Number.isInteger(id) || id <= 0)) {
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    let raw: any | null = null
    let firstError: any | null = null

    if (slug) {
      try {
        const res = await withTimeout(
          get(`/opportunity/slug/${encodeURIComponent(slug)}`),
        )
        raw = extractResponseData(res)
      } catch (err) {
        firstError = err
      }
    }

    if (!raw && Number.isInteger(id) && id > 0) {
      try {
        const res = await withTimeout(get(`/opportunity/${id}`))
        raw = extractResponseData(res)
      } catch (err) {
        firstError = err
      }
    }

    if (currentRequest !== requestSeq) return

    if (!raw) throw firstError || new Error('Oportunidade não encontrada.')

    const merged = {
      ...base,
      ...raw,
    }

    localOpportunity.value = merged
    emit('loaded', merged)
  } catch (err: any) {
    if (currentRequest !== requestSeq) return

    console.warn('[OpportunityDetailsModal] Could not load full opportunity:', err)

    error.value =
      err?.response?.data?.detail ||
      err?.message ||
      'Não consegui carregar os detalhes completos dessa oportunidade.'
  } finally {
    if (currentRequest === requestSeq) {
      loading.value = false
    }
  }
}

const item = computed(() => {
  return normalizeOpportunity(localOpportunity.value ?? props.opportunity)
})

const description = computed(() => {
  const current = item.value
  if (!current) return ''

  return (
    current.description ||
    current.content ||
    current.excerpt ||
    current.category_data?.description ||
    current.category_data?.summary ||
    ''
  )
})

const infoCards = computed(() => {
  const current = item.value
  if (!current) return []

  const data = current.category_data ?? {}
  const cards: Array<{ title: string; label: string }> = []

  for (const key of CATEGORY_DATA_ORDER) {
    const card = makeInfoCard(key, data[key])
    if (card) cards.push(card)
  }

  const specifics = normalizeJsonObject(data.specifics)

  for (const key of SPECIFICS_ORDER) {
    const card = makeInfoCard(key, specifics[key])
    if (card) cards.push(card)
  }

  return cards.filter((card) => card.title !== 'Tipo')
})

const referenceLinks = computed(() => {
  const current = item.value
  if (!current) return []

  const refs = normalizeJsonObject(current.category_data).references
  return Array.isArray(refs) ? refs.filter((ref) => ref?.url) : []
})

const displayTimeline = computed(() => {
  const current = item.value
  if (!current) return []

  return [...current.timeline]
    .map((event) => ({
      ...event,
      formattedDate: fmtDate(event.date),
    }))
    .filter((event) => event.label || event.details || event.formattedDate)
})

function getReferenceTitle(ref: any, index: number) {
  return ref?.title || ref?.label || ref?.name || `Recurso ${index + 1}`
}

function retryLoadDetails() {
  if (!props.opportunity) return
  fetchFullOpportunity(props.opportunity)
}

function closeModal() {
  requestSeq++
  loading.value = false
  error.value = null
  localOpportunity.value = null
  emit('close')
}

watch(
  () => props.opportunity
    ? `${props.opportunity.id ?? ''}:${props.opportunity.slug ?? ''}`
    : '',
  async () => {
    requestSeq++

    const base = props.opportunity

    localOpportunity.value = base
    loading.value = false
    error.value = null

    if (!base) return

    await fetchFullOpportunity(base)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  requestSeq++
  loading.value = false
})
</script>

<template>
  <Teleport to="body">
    <Transition name="opportunity-modal">
      <div
        v-if="item"
        class="opportunity-modal-backdrop"
        @click.self="closeModal"
      >
        <article
          class="opportunity-modal"
          role="dialog"
          aria-modal="true"
          :aria-label="item.title"
        >
          <header class="opportunity-modal__cover">
            <img
              v-if="item.cover_url"
              :src="item.cover_url"
              :alt="item.title"
              class="opportunity-modal__cover-img"
            >

            <div
              v-else
              class="opportunity-modal__cover-fallback"
              :style="{ background: `linear-gradient(135deg, ${item.categoryMeta.color}33, ${item.categoryMeta.color}11)` }"
            >
              <span>{{ item.categoryMeta.icon }}</span>
            </div>

            <div class="opportunity-modal__cover-overlay" />

            <button
              type="button"
              class="opportunity-modal__close"
              aria-label="Fechar"
              @click="closeModal"
            >
              ×
            </button>

            <button
              v-if="isAdmin && item.id"
              type="button"
              class="opportunity-modal__edit"
              @click="emit('edit', item)"
            >
              Editar
            </button>
          </header>

          <main class="opportunity-modal__body">
            <div class="opportunity-modal__badges">
              <span
                class="opportunity-badge"
                :style="{
                  background: item.categoryMeta.color + '18',
                  color: item.categoryMeta.color,
                  borderColor: item.categoryMeta.color + '35',
                }"
              >
                {{ item.categoryMeta.icon }} {{ item.categoryMeta.label }}
              </span>

              <span v-if="item.human_verified" class="opportunity-badge opportunity-badge--verified">
                ✓ Verificado
              </span>

              <span v-else-if="isAdmin" class="opportunity-badge opportunity-badge--pending">
                Pendente
              </span>

              <span v-if="item.is_free" class="opportunity-badge opportunity-badge--free">
                Gratuito
              </span>

              <span
                v-if="item.priority >= 2"
                class="opportunity-badge"
                :style="{
                  background: item.priorityMeta.color + '18',
                  color: item.priorityMeta.color,
                  borderColor: item.priorityMeta.color + '35',
                }"
              >
                ★ {{ item.priorityMeta.label }}
              </span>
            </div>

            <h2 class="opportunity-modal__title">
              {{ item.title }}
            </h2>

            <div class="opportunity-modal__quick">
              <div
                v-if="item.next_deadline"
                class="opportunity-quick-card"
                :class="{
                  'opportunity-quick-card--urgent': item.deadline.urgent,
                  'opportunity-quick-card--overdue': item.deadline.overdue,
                }"
              >
                <span>⏰</span>
                <strong>{{ item.deadlineActionLabel }}</strong>
              </div>

              <div v-else class="opportunity-quick-card opportunity-quick-card--muted">
                <span>📅</span>
                <strong>Sem prazo acionável</strong>
              </div>

              <div class="opportunity-quick-card">
                <span>📍</span>
                <strong>{{ item.location }}</strong>
              </div>
            </div>

            <div v-if="loading" class="opportunity-loading">
              <span class="opportunity-loading__spinner" />
              Carregando detalhes completos...
            </div>

            <div v-if="error" class="opportunity-error">
              <span>{{ error }}</span>
              <button type="button" @click="retryLoadDetails">Tentar de novo</button>
            </div>

            <section class="opportunity-section">
              <h3>Sobre a oportunidade</h3>

              <p v-if="description" class="opportunity-description">
                {{ description }}
              </p>

              <p v-else class="opportunity-empty">
                Ainda não temos uma descrição completa para esta oportunidade.
              </p>
            </section>

            <section v-if="infoCards.length > 0" class="opportunity-section">
              <h3>Informações importantes</h3>

              <div class="opportunity-info-grid">
                <div
                  v-for="card in infoCards"
                  :key="card.title"
                  class="opportunity-info-card"
                  :class="`opportunity-info-card--${getInfoVariant(card.title)}`"
                >
                  <div class="opportunity-info-card__icon">
                    {{ getInfoIcon(card.title) }}
                  </div>

                  <div>
                    <strong>{{ card.title }}</strong>

                    <ul>
                      <li
                        v-for="line in getCardLines(card)"
                        :key="line"
                      >
                        {{ line }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section v-if="displayTimeline.length > 0" class="opportunity-section">
              <h3>Linha do tempo</h3>

              <div class="opportunity-timeline">
                <div
                  v-for="event in displayTimeline"
                  :key="`${event.label}-${event.date}`"
                  class="opportunity-timeline__item"
                >
                  <div class="opportunity-timeline__dot" />

                  <div>
                    <strong>{{ event.label }}</strong>
                    <span v-if="event.formattedDate">{{ event.formattedDate }}</span>
                    <p v-if="event.details">{{ event.details }}</p>
                  </div>
                </div>
              </div>
            </section>

            <section v-if="item.tags.length > 0" class="opportunity-section">
              <h3>Tags</h3>

              <div class="opportunity-tags">
                <span
                  v-for="tag in item.tags"
                  :key="tag"
                  class="opportunity-tag"
                >
                  {{ tag }}
                </span>
              </div>
            </section>

            <section v-if="referenceLinks.length > 0" class="opportunity-section">
              <h3>Recursos</h3>

              <div class="opportunity-links">
                <a
                  v-for="(ref, index) in referenceLinks"
                  :key="ref.url"
                  :href="ref.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="opportunity-link"
                >
                  <span>🔗</span>
                  {{ getReferenceTitle(ref, index) }}
                </a>
              </div>
            </section>

            <footer class="opportunity-modal__actions">
              <a
                v-if="item.official_site_url"
                :href="item.official_site_url"
                target="_blank"
                rel="noopener noreferrer"
                class="opportunity-primary-action"
              >
                Acessar site oficial →
              </a>

              <button
                type="button"
                class="opportunity-secondary-action"
                @click="closeModal"
              >
                Fechar
              </button>
            </footer>
          </main>
        </article>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.opportunity-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  padding: 24px;
  background: rgba(15, 23, 42, .55);
  backdrop-filter: blur(9px);
  display: grid;
  place-items: center;
}

.opportunity-modal {
  width: min(760px, 100%);
  max-height: min(90vh, 920px);
  overflow: auto;
  border-radius: 28px;
  background: #fff;
  box-shadow: 0 30px 100px rgba(15, 23, 42, .36);
}

.opportunity-modal__cover {
  height: 210px;
  position: relative;
  overflow: hidden;
  background: #0f172a;
}

.opportunity-modal__cover-img,
.opportunity-modal__cover-fallback {
  width: 100%;
  height: 100%;
}

.opportunity-modal__cover-img {
  object-fit: cover;
}

.opportunity-modal__cover-fallback {
  display: grid;
  place-items: center;
}

.opportunity-modal__cover-fallback span {
  font-size: 3rem;
}

.opportunity-modal__cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(15, 23, 42, .12), rgba(15, 23, 42, .46));
}

.opportunity-modal__close,
.opportunity-modal__edit {
  position: absolute;
  top: 16px;
  border: none;
  cursor: pointer;
  font-weight: 950;
}

.opportunity-modal__close {
  right: 16px;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  background: rgba(15, 23, 42, .72);
  color: white;
  font-size: 1.2rem;
}

.opportunity-modal__edit {
  left: 16px;
  border-radius: 999px;
  padding: 9px 13px;
  background: rgba(15, 23, 42, .78);
  color: white;
  font-size: .78rem;
}

.opportunity-modal__body {
  padding: 24px;
  display: grid;
  gap: 22px;
}

.opportunity-modal__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.opportunity-badge {
  border: 1px solid;
  border-radius: 999px;
  padding: 6px 9px;
  font-size: .72rem;
  font-weight: 900;
}

.opportunity-badge--verified {
  background: #ecfdf5;
  color: #047857;
  border-color: #bbf7d0;
}

.opportunity-badge--pending {
  background: #fff7ed;
  color: #c2410c;
  border-color: #fed7aa;
}

.opportunity-badge--free {
  background: #eff6ff;
  color: #2563eb;
  border-color: #bfdbfe;
}

.opportunity-modal__title {
  margin: 0;
  color: #1c1917;
  font-size: clamp(1.45rem, 3vw, 2.15rem);
  line-height: 1.05;
  letter-spacing: -.045em;
}

.opportunity-modal__quick {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.opportunity-quick-card {
  border: 1px solid #e7e5e4;
  border-radius: 18px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 9px;
  background: #fafaf9;
  color: #44403c;
}

.opportunity-quick-card strong {
  font-size: .82rem;
  line-height: 1.25;
}

.opportunity-quick-card--urgent {
  background: #fef3c7;
  border-color: #fbbf24;
  color: #92400e;
}

.opportunity-quick-card--overdue {
  background: #fee2e2;
  border-color: #fecaca;
  color: #991b1b;
}

.opportunity-quick-card--muted {
  color: #78716c;
}

.opportunity-loading {
  border: 1px solid #dbeafe;
  background: #eff6ff;
  color: #1d4ed8;
  border-radius: 16px;
  padding: 11px 13px;
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: .82rem;
  font-weight: 850;
}

.opportunity-loading__spinner {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 2px solid rgba(37, 99, 235, .2);
  border-top-color: #2563eb;
  animation: spin .7s linear infinite;
}

.opportunity-error {
  margin: 0;
  border-radius: 16px;
  background: #fef2f2;
  color: #b91c1c;
  padding: 12px 14px;
  font-size: .84rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.opportunity-error button {
  border: none;
  border-radius: 999px;
  background: #b91c1c;
  color: white;
  padding: 7px 10px;
  font-size: .74rem;
  font-weight: 950;
  cursor: pointer;
  white-space: nowrap;
}

.opportunity-section {
  display: grid;
  gap: 12px;
}

.opportunity-section h3 {
  margin: 0;
  color: #78716c;
  font-size: .73rem;
  font-weight: 950;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.opportunity-description {
  margin: 0;
  color: #44403c;
  font-size: .95rem;
  line-height: 1.72;
  white-space: pre-line;
}

.opportunity-empty {
  margin: 0;
  color: #9ca3af;
  font-size: .9rem;
  line-height: 1.6;
  font-style: italic;
}

.opportunity-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.opportunity-info-card {
  border: 1px solid #e7e5e4;
  border-radius: 20px;
  padding: 13px;
  display: flex;
  gap: 11px;
  background: #fff;
}

.opportunity-info-card--blue {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.opportunity-info-card--amber {
  background: #fffbeb;
  border-color: #fde68a;
}

.opportunity-info-card--emerald {
  background: #ecfdf5;
  border-color: #bbf7d0;
}

.opportunity-info-card--zinc {
  background: #fafaf9;
  border-color: #e7e5e4;
}

.opportunity-info-card__icon {
  width: 34px;
  height: 34px;
  border-radius: 14px;
  background: rgba(255, 255, 255, .75);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.opportunity-info-card strong {
  display: block;
  color: #1c1917;
  font-size: .82rem;
  margin-bottom: 6px;
}

.opportunity-info-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 4px;
}

.opportunity-info-card li {
  color: #57534e;
  font-size: .78rem;
  line-height: 1.42;
}

.opportunity-timeline {
  border-left: 2px solid #e7e5e4;
  margin-left: 8px;
  display: grid;
  gap: 14px;
}

.opportunity-timeline__item {
  position: relative;
  padding-left: 18px;
}

.opportunity-timeline__dot {
  position: absolute;
  left: -7px;
  top: 3px;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: #079272;
  border: 2px solid white;
}

.opportunity-timeline__item strong {
  display: block;
  color: #1c1917;
  font-size: .84rem;
}

.opportunity-timeline__item span {
  display: block;
  margin-top: 2px;
  color: #079272;
  font-size: .76rem;
  font-weight: 850;
}

.opportunity-timeline__item p {
  margin: 5px 0 0;
  color: #78716c;
  font-size: .78rem;
  line-height: 1.45;
}

.opportunity-tags,
.opportunity-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.opportunity-tag {
  border-radius: 999px;
  background: #f5f5f4;
  color: #57534e;
  padding: 7px 10px;
  font-size: .75rem;
  font-weight: 850;
}

.opportunity-link {
  border: 1px solid #e7e5e4;
  border-radius: 999px;
  padding: 8px 11px;
  color: #0f766e;
  text-decoration: none;
  font-size: .8rem;
  font-weight: 900;
  background: white;
}

.opportunity-modal__actions {
  border-top: 1px solid #f0ece8;
  padding-top: 18px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.opportunity-primary-action,
.opportunity-secondary-action {
  border: none;
  border-radius: 14px;
  padding: 12px 15px;
  font-size: .86rem;
  font-weight: 950;
  cursor: pointer;
  text-decoration: none;
}

.opportunity-primary-action {
  background: #079272;
  color: white;
}

.opportunity-secondary-action {
  background: #f5f5f4;
  color: #57534e;
}

.opportunity-modal-enter-active,
.opportunity-modal-leave-active {
  transition: opacity .16s ease;
}

.opportunity-modal-enter-active .opportunity-modal,
.opportunity-modal-leave-active .opportunity-modal {
  transition: transform .16s ease, opacity .16s ease;
}

.opportunity-modal-enter-from,
.opportunity-modal-leave-to {
  opacity: 0;
}

.opportunity-modal-enter-from .opportunity-modal,
.opportunity-modal-leave-to .opportunity-modal {
  transform: translateY(10px) scale(.985);
  opacity: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 720px) {
  .opportunity-modal-backdrop {
    padding: 10px;
    align-items: end;
  }

  .opportunity-modal {
    max-height: 92vh;
    border-radius: 26px 26px 0 0;
  }

  .opportunity-modal__cover {
    height: 170px;
  }

  .opportunity-modal__body {
    padding: 18px;
  }

  .opportunity-modal__quick,
  .opportunity-info-grid {
    grid-template-columns: 1fr;
  }

  .opportunity-modal__actions {
    flex-direction: column-reverse;
  }

  .opportunity-primary-action,
  .opportunity-secondary-action {
    width: 100%;
    text-align: center;
  }
}
</style>
