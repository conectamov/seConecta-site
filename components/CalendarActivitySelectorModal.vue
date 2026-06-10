<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

type ActivityOption = {
  key: string
  title: string
  icon?: string
  category?: string
  count?: number
}

const props = defineProps<{
  open: boolean
  activities: ActivityOption[]
  selectedIds: string[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:selectedIds': [value: string[]]
}>()

const localSelected = ref<string[]>([])
const query = ref('')
const activeCategory = ref('ALL')

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return ''

  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const categories = computed(() => {
  const map = new Map<string, number>()

  for (const activity of props.activities || []) {
    const category = String(activity.category || 'OTHER').toUpperCase()
    map.set(category, (map.get(category) || 0) + 1)
  }

  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
    .map(([category, count]) => ({ category, count }))
})

const filteredActivities = computed(() => {
  const q = normalizeText(query.value)

  return [...(props.activities || [])]
    .filter((activity) => {
      if (activeCategory.value !== 'ALL') {
        if (String(activity.category || 'OTHER').toUpperCase() !== activeCategory.value) return false
      }

      if (!q) return true
      return normalizeText(`${activity.title} ${activity.category}`).includes(q)
    })
    .sort((a, b) => String(a.title).localeCompare(String(b.title), 'pt-BR'))
})

const selectedCount = computed(() => localSelected.value.length)

function close() {
  emit('update:open', false)
}

function apply() {
  emit('update:selectedIds', [...localSelected.value])
  close()
}

function clear() {
  localSelected.value = []
}

function toggle(key: string) {
  localSelected.value = localSelected.value.includes(key)
    ? localSelected.value.filter((item) => item !== key)
    : [...localSelected.value, key]
}

function selectVisible() {
  const keys = filteredActivities.value.map((activity) => activity.key)
  const merged = new Set([...localSelected.value, ...keys])
  localSelected.value = [...merged]
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) close()
}

watch(
  () => props.open,
  (value) => {
    if (value) {
      localSelected.value = [...(props.selectedIds || [])]
      query.value = ''
      activeCategory.value = 'ALL'
    }

    if (typeof document !== 'undefined') document.body.style.overflow = value ? 'hidden' : ''
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
    <Transition name="activity-selector-modal">
      <div
        v-if="open"
        class="activity-selector-backdrop"
        @click.self="close"
      >
        <article
          class="activity-selector-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Selecionar atividades"
        >
          <header class="activity-selector-modal__header">
            <div>
              <span>Filtro específico</span>
              <h2>Selecionar oportunidades e olimpíadas</h2>
              <p>
                Escolha quais atividades entram no calendário. A busca da página continua funcionando por texto.
              </p>
            </div>

            <button
              type="button"
              aria-label="Fechar"
              class="activity-selector-modal__close"
              @click="close"
            >
              ×
            </button>
          </header>

          <section class="activity-selector-controls">
            <input
              v-model="query"
              type="search"
              placeholder="Buscar pelo nome da oportunidade ou olimpíada..."
            >

            <div class="activity-selector-categories">
              <button
                type="button"
                :class="activeCategory === 'ALL' && 'is-active'"
                @click="activeCategory = 'ALL'"
              >
                Todos <em>{{ activities.length }}</em>
              </button>

              <button
                v-for="category in categories"
                :key="category.category"
                type="button"
                :class="activeCategory === category.category && 'is-active'"
                @click="activeCategory = category.category"
              >
                {{ category.category }} <em>{{ category.count }}</em>
              </button>
            </div>
          </section>

          <main class="activity-selector-list">
            <div v-if="filteredActivities.length === 0" class="activity-selector-empty">
              Nenhuma atividade encontrada neste filtro.
            </div>

            <button
              v-for="activity in filteredActivities"
              :key="activity.key"
              type="button"
              :class="['activity-selector-item', localSelected.includes(activity.key) && 'is-selected']"
              @click="toggle(activity.key)"
            >
              <span class="activity-selector-item__icon">{{ activity.icon || '🎯' }}</span>

              <span class="activity-selector-item__body">
                <strong>{{ activity.title }}</strong>
                <small>{{ activity.category || 'Atividade' }} · {{ activity.count || 0 }} data{{ Number(activity.count || 0) === 1 ? '' : 's' }}</small>
              </span>

              <span class="activity-selector-item__check">
                {{ localSelected.includes(activity.key) ? '✓' : '' }}
              </span>
            </button>
          </main>

          <footer class="activity-selector-footer">
            <div>
              <strong>{{ selectedCount }}</strong>
              <span>selecionada{{ selectedCount === 1 ? '' : 's' }}</span>
            </div>

            <button type="button" class="activity-selector-footer__ghost" @click="clear">
              Limpar
            </button>

            <button type="button" class="activity-selector-footer__ghost" @click="selectVisible">
              Selecionar visíveis
            </button>

            <button type="button" class="activity-selector-footer__primary" @click="apply">
              Aplicar filtro
            </button>
          </footer>
        </article>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.activity-selector-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1700;
  padding: 18px;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, .58);
  backdrop-filter: blur(12px);
}

.activity-selector-modal {
  width: min(820px, 100%);
  max-height: min(88vh, 900px);
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  overflow: hidden;
  border-radius: 30px;
  background: #fff;
  box-shadow: 0 32px 100px rgba(15, 23, 42, .3);
}

.activity-selector-modal__header {
  padding: 24px 24px 18px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 38px;
  gap: 16px;
  align-items: start;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, .16), transparent 17rem),
    linear-gradient(135deg, #eff6ff, #ffffff 66%);
  border-bottom: 1px solid #e2e8f0;
}

.activity-selector-modal__header span {
  color: #2563eb;
  font-size: .72rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .1em;
}

.activity-selector-modal__header h2 {
  margin: 5px 0 7px;
  color: #0f172a;
  font-size: clamp(1.35rem, 4vw, 1.95rem);
  line-height: 1;
  letter-spacing: -.055em;
}

.activity-selector-modal__header p {
  max-width: 620px;
  margin: 0;
  color: #475569;
  font-size: .9rem;
  line-height: 1.5;
  font-weight: 650;
}

.activity-selector-modal__close {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, .82);
  color: #0f172a;
  font-size: 1.22rem;
  font-weight: 950;
  cursor: pointer;
}

.activity-selector-controls {
  padding: 14px 24px;
  display: grid;
  gap: 10px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.activity-selector-controls input {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 10px 13px;
  background: white;
  color: #0f172a;
  font: inherit;
  font-size: .86rem;
  font-weight: 760;
  outline: none;
}

.activity-selector-controls input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, .1);
}

.activity-selector-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.activity-selector-categories button {
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 7px 10px;
  background: white;
  color: #475569;
  font-size: .72rem;
  font-weight: 920;
  cursor: pointer;
}

.activity-selector-categories button.is-active {
  background: #0f172a;
  border-color: #0f172a;
  color: white;
}

.activity-selector-categories em {
  margin-left: 3px;
  font-style: normal;
  opacity: .75;
}

.activity-selector-list {
  min-height: 0;
  overflow: auto;
  padding: 16px 24px;
  display: grid;
  gap: 9px;
}

.activity-selector-empty {
  border: 1px dashed #cbd5e1;
  border-radius: 18px;
  padding: 18px;
  color: #64748b;
  font-size: .86rem;
  font-weight: 800;
  text-align: center;
}

.activity-selector-item {
  width: 100%;
  min-width: 0;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 11px 12px;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) 28px;
  gap: 11px;
  align-items: center;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: .16s ease;
}

.activity-selector-item:hover {
  transform: translateY(-1px);
  border-color: #bfdbfe;
  background: #f8fafc;
}

.activity-selector-item.is-selected {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: inset 0 0 0 1px #2563eb;
}

.activity-selector-item__icon {
  width: 40px;
  height: 40px;
  border-radius: 15px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, .8);
  border: 1px solid rgba(15, 23, 42, .05);
}

.activity-selector-item__body {
  min-width: 0;
}

.activity-selector-item__body strong {
  display: block;
  color: #0f172a;
  font-size: .88rem;
  font-weight: 950;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-selector-item__body small {
  display: block;
  margin-top: 3px;
  color: #64748b;
  font-size: .74rem;
  font-weight: 820;
}

.activity-selector-item__check {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: white;
  border: 1px solid #cbd5e1;
  color: #2563eb;
  font-size: .78rem;
  font-weight: 950;
}

.activity-selector-footer {
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.activity-selector-footer div {
  margin-right: auto;
  color: #475569;
  font-size: .78rem;
  font-weight: 850;
}

.activity-selector-footer div strong {
  color: #0f172a;
  font-weight: 950;
}

.activity-selector-footer button {
  border-radius: 999px;
  padding: 10px 13px;
  font-size: .78rem;
  font-weight: 950;
  cursor: pointer;
}

.activity-selector-footer__ghost {
  border: 1px solid #e2e8f0;
  background: white;
  color: #475569;
}

.activity-selector-footer__primary {
  border: none;
  background: #0f172a;
  color: white;
}

.activity-selector-modal-enter-active,
.activity-selector-modal-leave-active {
  transition: opacity .18s ease;
}

.activity-selector-modal-enter-active .activity-selector-modal,
.activity-selector-modal-leave-active .activity-selector-modal {
  transition: transform .18s ease, opacity .18s ease;
}

.activity-selector-modal-enter-from,
.activity-selector-modal-leave-to {
  opacity: 0;
}

.activity-selector-modal-enter-from .activity-selector-modal,
.activity-selector-modal-leave-to .activity-selector-modal {
  opacity: 0;
  transform: translateY(10px) scale(.98);
}

@media (max-width: 720px) {
  .activity-selector-backdrop {
    padding: 10px;
    align-items: end;
  }

  .activity-selector-modal {
    max-height: 92vh;
    border-radius: 24px 24px 0 0;
  }

  .activity-selector-modal__header,
  .activity-selector-controls,
  .activity-selector-list,
  .activity-selector-footer {
    padding-left: 14px;
    padding-right: 14px;
  }

  .activity-selector-categories {
    overflow-x: auto;
    flex-wrap: nowrap;
    scrollbar-width: none;
  }

  .activity-selector-categories::-webkit-scrollbar {
    display: none;
  }

  .activity-selector-categories button {
    flex: 0 0 auto;
  }

  .activity-selector-footer {
    display: grid;
    grid-template-columns: 1fr;
  }

  .activity-selector-footer div {
    margin-right: 0;
  }
}
</style>