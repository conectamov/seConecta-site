<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

type PickerKind = 'opportunity' | 'olympiad'
type PickerTab = 'saved' | 'search'

const props = defineProps<{
  open: boolean
  selectedId?: number | null
  savedOpportunities?: any[]
  initialKind?: PickerKind
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  select: [payload: any]
}>()

const { get } = useAxios() as any

const activeKind = ref<PickerKind>(props.initialKind ?? 'opportunity')
const activeTab = ref<PickerTab>('saved')
const search = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const searchResults = ref<any[]>([])
const searchInputRef = ref<HTMLInputElement | null>(null)

let searchTimer: ReturnType<typeof setTimeout> | null = null
let requestSeq = 0

const KIND_OPTIONS: Array<{ value: PickerKind; label: string; icon: string; hint: string }> = [
  {
    value: 'opportunity',
    label: 'Oportunidades',
    icon: '🎯',
    hint: 'Programas, bolsas, competições, workshops e iniciativas.',
  },
  {
    value: 'olympiad',
    label: 'Olimpíadas',
    icon: '🏅',
    hint: 'Competições acadêmicas com calendário próprio.',
  },
]

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  COMPETITION: { label: 'Competição', icon: '🏆' },
  OLYMPIAD: { label: 'Olimpíada', icon: '🏅' },
  MUN: { label: 'MUN', icon: '🌐' },
  SCHOLARSHIP: { label: 'Bolsa', icon: '🎓' },
  SUMMER_PROGRAM: { label: 'Programa', icon: '☀️' },
  WORKSHOP: { label: 'Workshop', icon: '🛠️' },
  VOLUNTEERING: { label: 'Voluntariado', icon: '🤝' },
  EXTRACURRICULAR: { label: 'Extracurricular', icon: '⚡' },
  INITIATIVE: { label: 'Iniciativa', icon: '💡' },
  POST: { label: 'Post', icon: '📌' },
}

function extractData(res: any) {
  return res?.data?.data ?? res?.data ?? res
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

function normalizeOpportunity(row: any) {
  const source = row?.opportunity ? row.opportunity : row
  if (!source) return null

  const id = Number(source.id ?? source.opportunity_id ?? row?.opportunity_id)
  if (!Number.isInteger(id) || id <= 0) return null

  return {
    ...source,
    id,
    title: source.title ?? 'Oportunidade sem título',
    slug: source.slug ?? null,
    category: source.category ?? null,
    excerpt: source.excerpt ?? source.description ?? '',
    cover_url: source.cover_url ?? null,
    location: source.location ?? null,
    is_free: source.is_free ?? null,
    next_deadline: source.next_deadline ?? null,
    saved: row?.saved ?? source.saved ?? null,
  }
}

function isOlympiad(item: any) {
  return String(item?.category || '').toUpperCase() === 'OLYMPIAD'
}

function matchesKind(item: any) {
  return activeKind.value === 'olympiad' ? isOlympiad(item) : !isOlympiad(item)
}

function matchesSearch(item: any) {
  const q = normalizeText(search.value)
  if (!q) return true

  const haystack = normalizeText([
    item?.title,
    item?.excerpt,
    item?.location,
    item?.category,
    item?.slug,
  ].filter(Boolean).join(' '))

  return haystack.includes(q)
}

function getCategoryMeta(item: any) {
  const key = String(item?.category || '').toUpperCase()
  return CATEGORY_LABELS[key] ?? { label: key || 'Oportunidade', icon: '✨' }
}

function getDeadlineLabel(raw: string | null | undefined) {
  if (!raw) return 'Sem prazo claro'

  const clean = String(raw).slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return 'Prazo informado'

  const [year, month, day] = clean.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const savedItems = computed(() => {
  const normalized = (props.savedOpportunities ?? [])
    .map(normalizeOpportunity)
    .filter(Boolean) as any[]

  const seen = new Set<number>()

  return normalized
    .filter((item) => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
    .filter(matchesKind)
    .filter(matchesSearch)
})

const savedIdSet = computed(() => {
  return new Set(
    (props.savedOpportunities ?? [])
      .map(normalizeOpportunity)
      .filter(Boolean)
      .map((item: any) => Number(item.id)),
  )
})

const normalizedSearchResults = computed(() => {
  const seen = new Set<number>()

  return searchResults.value
    .map(normalizeOpportunity)
    .filter(Boolean)
    .filter(matchesKind)
    .filter((item: any) => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    }) as any[]
})

const visibleItems = computed(() => {
  return activeTab.value === 'saved'
    ? savedItems.value
    : normalizedSearchResults.value
})

const emptyTitle = computed(() => {
  if (activeTab.value === 'saved') {
    return activeKind.value === 'olympiad'
      ? 'Nenhuma olimpíada salva ainda'
      : 'Nenhuma oportunidade salva ainda'
  }

  return search.value.trim()
    ? 'Nada encontrado nessa busca'
    : 'Busque pelo nome da oportunidade'
})

const emptyText = computed(() => {
  if (activeTab.value === 'saved') {
    return 'Você ainda pode usar a aba de busca para vincular uma data com algo que não está salvo no radar.'
  }

  return 'Pesquise pelo nome, organizador, área ou uma palavra-chave.'
})

async function runSearch() {
  const seq = ++requestSeq
  loading.value = true
  error.value = null

  const clean = search.value.trim()

  try {
    const params: Record<string, any> = {
      page: 1,
      limit: 40,
    }

    if (clean) params.search = clean

    if (activeKind.value === 'olympiad') {
      params.category = 'OLYMPIAD'
    }

    const res = await get('/opportunity/cards', { params })
    if (seq !== requestSeq) return

    const payload = extractData(res)
    searchResults.value = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : []
  } catch (err: any) {
    if (seq !== requestSeq) return
    error.value = getErrorMessage(err, 'Não foi possível buscar oportunidades agora.')
    searchResults.value = []
  } finally {
    if (seq === requestSeq) loading.value = false
  }
}

function scheduleSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (props.open && activeTab.value === 'search') runSearch()
  }, 280)
}

function closeModal() {
  emit('update:open', false)
}

function bindEscListener() {
  if (typeof window === 'undefined') return
  window.removeEventListener('keydown', handleKeydown)
  window.addEventListener('keydown', handleKeydown)
}

function unbindEscListener() {
  if (typeof window === 'undefined') return
  window.removeEventListener('keydown', handleKeydown)
}

function selectItem(item: any) {
  emit('select', item)
  closeModal()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) closeModal()
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      unbindEscListener()
      return
    }

    activeKind.value = props.initialKind ?? 'opportunity'
    activeTab.value = savedItems.value.length > 0 ? 'saved' : 'search'
    error.value = null

    await nextTick()

    if (activeTab.value === 'search') {
      searchInputRef.value?.focus()
      await runSearch()
    }

    bindEscListener()
  },
  { immediate: true },
)

watch(activeKind, () => {
  error.value = null
  searchResults.value = []

  if (activeTab.value === 'saved' && savedItems.value.length === 0) {
    activeTab.value = 'search'
  }

  if (props.open && activeTab.value === 'search') runSearch()
})

watch(activeTab, async (tab) => {
  if (!props.open) return

  if (tab === 'search') {
    await nextTick()
    searchInputRef.value?.focus()
    await runSearch()
  }
})

watch(search, () => {
  if (!props.open) return
  if (activeTab.value === 'search') scheduleSearch()
})

onBeforeUnmount(() => {
  requestSeq++
  if (searchTimer) clearTimeout(searchTimer)
  unbindEscListener()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="opp-picker-fade">
      <div v-if="open" class="opp-picker-backdrop" @click.self="closeModal">
        <section class="opp-picker" role="dialog" aria-modal="true">
          <header class="opp-picker__header">
            <div>
              <span>Vincular data</span>
              <h2>Escolha uma oportunidade ou olimpíada</h2>
              <p>
                A data fica conectada ao item escolhido. Você pode usar algo salvo no radar ou buscar algo novo.
              </p>
            </div>

            <button type="button" class="opp-picker__close" aria-label="Fechar" @click="closeModal">
              ×
            </button>
          </header>

          <div class="opp-picker__body">
            <aside class="opp-picker__rail">
              <button
                v-for="option in KIND_OPTIONS"
                :key="option.value"
                type="button"
                :class="['opp-picker-kind', activeKind === option.value && 'is-active']"
                @click="activeKind = option.value"
              >
                <span>{{ option.icon }}</span>
                <strong>{{ option.label }}</strong>
                <small>{{ option.hint }}</small>
              </button>
            </aside>

            <main class="opp-picker__main">
              <div class="opp-picker-tabs">
                <button
                  type="button"
                  :class="activeTab === 'saved' && 'is-active'"
                  @click="activeTab = 'saved'"
                >
                  Salvas
                  <span>{{ savedItems.length }}</span>
                </button>
                <button
                  type="button"
                  :class="activeTab === 'search' && 'is-active'"
                  @click="activeTab = 'search'"
                >
                  Buscar todas
                </button>
              </div>

              <label class="opp-picker-search">
                <span>Buscar</span>
                <input
                  ref="searchInputRef"
                  v-model="search"
                  type="search"
                  placeholder="Ex.: OBI, LALA, research, bolsa, Harvard..."
                >
              </label>

              <p v-if="error" class="opp-picker-error">
                {{ error }}
              </p>

              <div v-if="loading && activeTab === 'search'" class="opp-picker-loading">
                Buscando oportunidades...
              </div>

              <div v-else-if="visibleItems.length === 0" class="opp-picker-empty">
                <strong>{{ emptyTitle }}</strong>
                <p>{{ emptyText }}</p>
              </div>

              <div v-else class="opp-picker-list">
                <button
                  v-for="item in visibleItems"
                  :key="item.id"
                  type="button"
                  :class="['opp-picker-card', Number(selectedId) === Number(item.id) && 'is-selected']"
                  @click="selectItem(item)"
                >
                  <img
                    v-if="item.cover_url"
                    :src="item.cover_url"
                    :alt="item.title"
                    class="opp-picker-card__image"
                  >
                  <span v-else class="opp-picker-card__fallback">
                    {{ getCategoryMeta(item).icon }}
                  </span>

                  <span class="opp-picker-card__content">
                    <span class="opp-picker-card__meta">
                      <em>{{ getCategoryMeta(item).icon }} {{ getCategoryMeta(item).label }}</em>
                      <strong v-if="savedIdSet.has(Number(item.id))">Salva</strong>
                      <strong v-else class="opp-picker-card__unsaved">Não salva</strong>
                    </span>

                    <span class="opp-picker-card__title">{{ item.title }}</span>

                    <span v-if="item.excerpt" class="opp-picker-card__excerpt">
                      {{ item.excerpt }}
                    </span>

                    <span class="opp-picker-card__foot">
                      <small>{{ item.location || 'Local não informado' }}</small>
                      <small>{{ getDeadlineLabel(item.next_deadline) }}</small>
                    </span>
                  </span>

                  <span class="opp-picker-card__action">
                    Selecionar
                  </span>
                </button>
              </div>
            </main>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.opp-picker-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3600;
  padding: 22px;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, .58);
  backdrop-filter: blur(12px);
}

.opp-picker {
  width: min(980px, 100%);
  max-height: min(90vh, 900px);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  border-radius: 30px;
  background: #fff;
  box-shadow: 0 34px 110px rgba(15, 23, 42, .34);
}

.opp-picker__header {
  padding: 23px 25px 19px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40px;
  gap: 16px;
  border-bottom: 1px solid #e2e8f0;
  background:
    radial-gradient(circle at top left, rgba(7, 146, 114, .16), transparent 18rem),
    linear-gradient(135deg, #fff, #f8fafc);
}

.opp-picker__header span {
  color: #079272;
  font-size: .72rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .1em;
}

.opp-picker__header h2 {
  margin: 5px 0 7px;
  color: #0f172a;
  font-size: clamp(1.45rem, 3vw, 2rem);
  line-height: 1;
  letter-spacing: -.055em;
}

.opp-picker__header p {
  max-width: 680px;
  margin: 0;
  color: #475569;
  font-size: .95rem;
  line-height: 1.5;
  font-weight: 650;
}

.opp-picker__close {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 999px;
  background: #f1f5f9;
  color: #0f172a;
  font-size: 1.45rem;
  font-weight: 900;
  cursor: pointer;
}

.opp-picker__body {
  min-height: 0;
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
}

.opp-picker__rail {
  padding: 16px;
  display: grid;
  align-content: start;
  gap: 10px;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
}

.opp-picker-kind {
  border: 1px solid #e2e8f0;
  border-radius: 21px;
  padding: 13px;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 2px 10px;
  text-align: left;
  background: #fff;
  cursor: pointer;
  transition: .18s ease;
}

.opp-picker-kind:hover,
.opp-picker-kind.is-active {
  border-color: rgba(7, 146, 114, .34);
  background: #ecfdf5;
  transform: translateY(-1px);
}

.opp-picker-kind > span {
  grid-row: 1 / span 2;
  width: 34px;
  height: 34px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, .78);
  border: 1px solid rgba(15, 23, 42, .06);
}

.opp-picker-kind strong {
  color: #0f172a;
  font-size: .9rem;
  font-weight: 950;
}

.opp-picker-kind small {
  color: #64748b;
  font-size: .75rem;
  line-height: 1.32;
  font-weight: 750;
}

.opp-picker__main {
  min-height: 0;
  overflow: auto;
  padding: 17px 18px 20px;
  display: grid;
  align-content: start;
  gap: 13px;
}

.opp-picker-tabs {
  display: inline-flex;
  width: fit-content;
  padding: 4px;
  gap: 4px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #fff;
}

.opp-picker-tabs button {
  border: none;
  border-radius: 999px;
  padding: 8px 12px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #475569;
  background: transparent;
  font-size: .8rem;
  font-weight: 950;
  cursor: pointer;
}

.opp-picker-tabs button.is-active {
  background: #0f172a;
  color: white;
}

.opp-picker-tabs span {
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, .18);
  font-size: .72rem;
}

.opp-picker-search {
  display: grid;
  gap: 7px;
}

.opp-picker-search span {
  color: #475569;
  font-size: .76rem;
  font-weight: 950;
}

.opp-picker-search input {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 17px;
  padding: 12px 13px;
  color: #0f172a;
  background: #f8fafc;
  font: inherit;
  font-size: .9rem;
  outline: none;
}

.opp-picker-search input:focus {
  border-color: #079272;
  background: white;
  box-shadow: 0 0 0 3px rgba(7, 146, 114, .12);
}

.opp-picker-error,
.opp-picker-loading,
.opp-picker-empty {
  border-radius: 18px;
  padding: 13px 14px;
  font-size: .86rem;
  font-weight: 800;
}

.opp-picker-error {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.opp-picker-loading,
.opp-picker-empty {
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  color: #64748b;
}

.opp-picker-empty strong {
  display: block;
  color: #0f172a;
  font-size: .96rem;
  margin-bottom: 4px;
}

.opp-picker-empty p {
  margin: 0;
  line-height: 1.45;
}

.opp-picker-list {
  display: grid;
  gap: 9px;
}

.opp-picker-card {
  min-width: 0;
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 21px;
  padding: 10px;
  display: grid;
  grid-template-columns: 66px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: .18s ease;
}

.opp-picker-card:hover,
.opp-picker-card.is-selected {
  border-color: rgba(7, 146, 114, .42);
  background: #f0fdfa;
  transform: translateY(-1px);
}

.opp-picker-card__image,
.opp-picker-card__fallback {
  width: 66px;
  height: 54px;
  border-radius: 16px;
  object-fit: cover;
  background: #f1f5f9;
  border: 1px solid rgba(15, 23, 42, .06);
}

.opp-picker-card__fallback {
  display: grid;
  place-items: center;
  font-size: 1.35rem;
}

.opp-picker-card__content {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.opp-picker-card__meta,
.opp-picker-card__foot {
  display: flex;
  gap: 7px;
  align-items: center;
  flex-wrap: wrap;
}

.opp-picker-card__meta em,
.opp-picker-card__meta strong,
.opp-picker-card__foot small {
  font-style: normal;
  font-size: .7rem;
  font-weight: 950;
}

.opp-picker-card__meta em {
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: .05em;
}

.opp-picker-card__meta strong {
  border-radius: 999px;
  padding: 3px 7px;
  background: #ecfdf5;
  color: #047857;
}

.opp-picker-card__meta .opp-picker-card__unsaved {
  background: #f1f5f9;
  color: #64748b;
}

.opp-picker-card__title {
  color: #0f172a;
  font-size: .95rem;
  font-weight: 950;
  line-height: 1.24;
}

.opp-picker-card__excerpt {
  color: #475569;
  font-size: .78rem;
  line-height: 1.36;
  font-weight: 650;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.opp-picker-card__foot small {
  color: #64748b;
  font-weight: 800;
}

.opp-picker-card__action {
  border-radius: 999px;
  padding: 8px 11px;
  background: #0f172a;
  color: white;
  font-size: .76rem;
  font-weight: 950;
  white-space: nowrap;
}

.opp-picker-fade-enter-active,
.opp-picker-fade-leave-active {
  transition: opacity .18s ease;
}

.opp-picker-fade-enter-active .opp-picker,
.opp-picker-fade-leave-active .opp-picker {
  transition: transform .18s ease, opacity .18s ease;
}

.opp-picker-fade-enter-from,
.opp-picker-fade-leave-to {
  opacity: 0;
}

.opp-picker-fade-enter-from .opp-picker,
.opp-picker-fade-leave-to .opp-picker {
  transform: translateY(10px) scale(.985);
  opacity: 0;
}

@media (max-width: 760px) {
  .opp-picker-backdrop {
    padding: 10px;
    align-items: end;
  }

  .opp-picker {
    max-height: 94vh;
    border-radius: 24px 24px 0 0;
  }

  .opp-picker__header {
    padding: 18px 16px 15px;
  }

  .opp-picker__body {
    grid-template-columns: 1fr;
  }

  .opp-picker__rail {
    grid-template-columns: 1fr 1fr;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
    padding: 12px;
  }

  .opp-picker-kind {
    grid-template-columns: 1fr;
    gap: 6px;
    padding: 11px;
  }

  .opp-picker-kind > span {
    grid-row: auto;
  }

  .opp-picker__main {
    padding: 14px;
  }

  .opp-picker-card {
    grid-template-columns: 48px minmax(0, 1fr);
  }

  .opp-picker-card__image,
  .opp-picker-card__fallback {
    width: 48px;
    height: 48px;
    border-radius: 15px;
  }

  .opp-picker-card__action {
    grid-column: 1 / -1;
    justify-self: start;
  }
}
</style>