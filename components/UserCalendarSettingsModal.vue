<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: [payload: any]
}>()

const { get, patch } = useAxios()

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

const autoAddSavedOpportunityDates = ref(true)
const notifyUpdates = ref(true)
const notifyDeadlineChanges = ref(true)
const notifyNewDates = ref(true)
const defaultDateKinds = ref<string[]>([
  'registration_deadline',
  'submission_deadline',
  'exam',
  'interview',
])
const defaultReminderOffsets = ref<number[]>([10080, 1440])
const defaultChannels = ref<string[]>(['IN_APP'])

const DATE_KIND_OPTIONS = [
  { value: 'registration_start', label: 'Abertura de inscrições', icon: '🟢' },
  { value: 'registration_deadline', label: 'Prazo de inscrição', icon: '⏰' },
  { value: 'submission_deadline', label: 'Prazo de envio', icon: '📦' },
  { value: 'exam', label: 'Prova', icon: '📝' },
  { value: 'interview', label: 'Entrevista', icon: '🎙️' },
  { value: 'result', label: 'Resultado', icon: '📣' },
]

const REMINDER_OPTIONS = [
  { label: '7 dias antes', value: 10080 },
  { label: '1 dia antes', value: 1440 },
  { label: '3 horas antes', value: 180 },
]

const isDirty = computed(() => true)

function extractData(res: any) {
  return res?.data?.data ?? res?.data ?? res
}

function getErrorMessage(err: any, fallback: string) {
  return err?.response?.data?.detail || err?.data?.detail || err?.message || fallback
}

function toggleString(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value]
}

function toggleNumber(list: number[], value: number) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value]
}

function toggleDateKind(value: string) {
  defaultDateKinds.value = toggleString(defaultDateKinds.value, value)
}

function toggleReminder(value: number) {
  defaultReminderOffsets.value = toggleNumber(defaultReminderOffsets.value, value)
}

function closeModal() {
  if (saving.value) return
  emit('update:open', false)
}

async function fetchSettings() {
  loading.value = true
  error.value = null

  try {
    const res = await get('/users/me/calendar/settings')
    const settings = extractData(res)

    autoAddSavedOpportunityDates.value = settings?.auto_add_saved_opportunity_dates !== false
    notifyUpdates.value = settings?.notify_on_saved_opportunity_updates !== false
    notifyDeadlineChanges.value = settings?.notify_on_deadline_changes !== false
    notifyNewDates.value = settings?.notify_on_new_dates !== false

    defaultDateKinds.value = Array.isArray(settings?.default_date_kinds)
      ? settings.default_date_kinds
      : ['registration_deadline', 'submission_deadline', 'exam', 'interview']

    defaultReminderOffsets.value = Array.isArray(settings?.default_reminder_offsets_minutes)
      ? settings.default_reminder_offsets_minutes
      : [10080, 1440]

    defaultChannels.value = Array.isArray(settings?.default_channels)
      ? settings.default_channels
      : ['IN_APP']
  } catch (err: any) {
    error.value = getErrorMessage(err, 'Não foi possível carregar suas configurações.')
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  saving.value = true
  error.value = null

  try {
    const payload = {
      auto_add_saved_opportunity_dates: autoAddSavedOpportunityDates.value,
      default_date_kinds: defaultDateKinds.value,
      default_reminder_offsets_minutes: defaultReminderOffsets.value,
      default_channels: defaultChannels.value,
      notify_on_saved_opportunity_updates: notifyUpdates.value,
      notify_on_deadline_changes: notifyDeadlineChanges.value,
      notify_on_new_dates: notifyNewDates.value,
    }

    const res = await patch('/users/me/calendar/settings', payload)
    emit('saved', extractData(res))
  } catch (err: any) {
    error.value = getErrorMessage(err, 'Não foi possível salvar suas configurações.')
  } finally {
    saving.value = false
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) fetchSettings()
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="calendar-settings-fade">
      <div v-if="open" class="settings-backdrop" @click.self="closeModal">
        <section class="settings-modal" role="dialog" aria-modal="true">
          <header class="settings-modal__header">
            <div>
              <span>Preferências pessoais</span>
              <h2>Configurar alertas</h2>
              <p>
                Defina como o radar e o calendário devem tratar datas oficiais e mudanças em oportunidades salvas.
              </p>
            </div>

            <button type="button" class="settings-modal__close" @click="closeModal">
              ×
            </button>
          </header>

          <div class="settings-modal__body">
            <div v-if="loading" class="settings-loading">
              Carregando configurações...
            </div>

            <template v-else>
              <section class="settings-section">
                <div class="settings-section__title">
                  <span>🎯</span>
                  <div>
                    <strong>Quando salvar oportunidades</strong>
                    <p>Controla o comportamento padrão do radar.</p>
                  </div>
                </div>

                <label class="settings-toggle">
                  <input v-model="autoAddSavedOpportunityDates" type="checkbox">
                  <span>
                    <strong>Adicionar datas oficiais automaticamente quando fizer sentido</strong>
                    <small>Mesmo ligado, só deve usar datas marcadas como show_on_calendar.</small>
                  </span>
                </label>
              </section>

              <section class="settings-section">
                <div class="settings-section__title">
                  <span>📅</span>
                  <div>
                    <strong>Tipos de datas oficiais</strong>
                    <p>Escolha quais tipos são bons candidatos para entrar no calendário.</p>
                  </div>
                </div>

                <div class="settings-chip-grid">
                  <button
                    v-for="option in DATE_KIND_OPTIONS"
                    :key="option.value"
                    type="button"
                    :class="defaultDateKinds.includes(option.value) && 'is-active'"
                    @click="toggleDateKind(option.value)"
                  >
                    <span>{{ option.icon }}</span>
                    {{ option.label }}
                  </button>
                </div>
              </section>

              <section class="settings-section">
                <div class="settings-section__title">
                  <span>🔔</span>
                  <div>
                    <strong>Lembretes padrão</strong>
                    <p>Usados quando uma data oficial for adicionada ao calendário.</p>
                  </div>
                </div>

                <div class="settings-chip-grid settings-chip-grid--compact">
                  <button
                    v-for="option in REMINDER_OPTIONS"
                    :key="option.value"
                    type="button"
                    :class="defaultReminderOffsets.includes(option.value) && 'is-active'"
                    @click="toggleReminder(option.value)"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </section>

              <section class="settings-section">
                <div class="settings-section__title">
                  <span>📡</span>
                  <div>
                    <strong>Alertas sem data definida</strong>
                    <p>Essenciais para oportunidades fechadas, sem prazo ou com próxima edição indefinida.</p>
                  </div>
                </div>

                <label class="settings-toggle">
                  <input v-model="notifyUpdates" type="checkbox">
                  <span>
                    <strong>Me avisar se algo importante mudar</strong>
                    <small>Requisitos, links oficiais, processo seletivo ou descrição.</small>
                  </span>
                </label>

                <label class="settings-toggle">
                  <input v-model="notifyDeadlineChanges" type="checkbox">
                  <span>
                    <strong>Me avisar se um prazo mudar</strong>
                    <small>Bom para oportunidades com datas incertas ou atualizadas depois.</small>
                  </span>
                </label>

                <label class="settings-toggle">
                  <input v-model="notifyNewDates" type="checkbox">
                  <span>
                    <strong>Me avisar quando novas datas aparecerem</strong>
                    <small>Resolve o caso de oportunidades salvas sem calendário ainda.</small>
                  </span>
                </label>
              </section>
            </template>

            <p v-if="error" class="settings-error">
              {{ error }}
            </p>
          </div>

          <footer class="settings-modal__footer">
            <button type="button" class="settings-ghost" :disabled="saving" @click="closeModal">
              Cancelar
            </button>
            <button type="button" class="settings-primary" :disabled="saving || !isDirty" @click="saveSettings">
              {{ saving ? 'Salvando...' : 'Salvar configurações' }}
            </button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.settings-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3000;
  padding: 22px;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, .46);
  backdrop-filter: blur(10px);
}

.settings-modal {
  width: min(700px, 100%);
  max-height: min(88vh, 860px);
  overflow: hidden;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  border-radius: 28px;
  background: #fff;
  box-shadow: 0 30px 90px rgba(15, 23, 42, .28);
}

.settings-modal__header {
  padding: 22px 24px 18px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  border-bottom: 1px solid #e2e8f0;
  background:
    radial-gradient(circle at top left, rgba(7, 146, 114, .16), transparent 14rem),
    #fff;
}

.settings-modal__header span {
  color: #079272;
  font-size: .7rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .1em;
}

.settings-modal__header h2 {
  margin: 4px 0 6px;
  color: #0f172a;
  font-size: 1.6rem;
  line-height: 1;
  letter-spacing: -.045em;
}

.settings-modal__header p {
  margin: 0;
  color: #64748b;
  font-size: .86rem;
  line-height: 1.45;
}

.settings-modal__close {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 999px;
  background: #f1f5f9;
  color: #0f172a;
  font-size: 1.5rem;
  cursor: pointer;
}

.settings-modal__body {
  overflow: auto;
  padding: 18px 24px;
  display: grid;
  gap: 14px;
}

.settings-loading {
  min-height: 240px;
  display: grid;
  place-items: center;
  color: #64748b;
  font-size: .86rem;
  font-weight: 850;
}

.settings-section {
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  padding: 14px;
  display: grid;
  gap: 11px;
  background: #fff;
}

.settings-section__title {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.settings-section__title > span {
  width: 36px;
  height: 36px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: #ecfdf5;
}

.settings-section__title strong {
  display: block;
  color: #0f172a;
  font-size: .94rem;
  font-weight: 950;
}

.settings-section__title p {
  margin: 2px 0 0;
  color: #64748b;
  font-size: .78rem;
  line-height: 1.4;
}

.settings-toggle {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 17px;
  padding: 11px;
  background: #f8fafc;
  cursor: pointer;
}

.settings-toggle input {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  accent-color: #079272;
}

.settings-toggle strong {
  display: block;
  color: #0f172a;
  font-size: .82rem;
  font-weight: 950;
}

.settings-toggle small {
  display: block;
  margin-top: 2px;
  color: #64748b;
  font-size: .72rem;
  line-height: 1.35;
}

.settings-chip-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.settings-chip-grid--compact {
  display: flex;
  flex-wrap: wrap;
}

.settings-chip-grid button {
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #fff;
  color: #475569;
  padding: 9px 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: .76rem;
  font-weight: 900;
  cursor: pointer;
}

.settings-chip-grid button.is-active {
  border-color: #079272;
  background: #ecfdf5;
  color: #047857;
}

.settings-error {
  margin: 0;
  border: 1px solid #fecaca;
  border-radius: 15px;
  padding: 10px 12px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: .8rem;
  font-weight: 850;
}

.settings-modal__footer {
  padding: 15px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.settings-ghost,
.settings-primary {
  border: 0;
  border-radius: 999px;
  padding: 10px 14px;
  font-size: .8rem;
  font-weight: 950;
  cursor: pointer;
}

.settings-ghost {
  background: #fff;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.settings-primary {
  background: #079272;
  color: white;
}

.settings-ghost:disabled,
.settings-primary:disabled {
  opacity: .65;
  cursor: default;
}

.calendar-settings-fade-enter-active,
.calendar-settings-fade-leave-active {
  transition: opacity .18s ease;
}

.calendar-settings-fade-enter-from,
.calendar-settings-fade-leave-to {
  opacity: 0;
}

@media (max-width: 720px) {
  .settings-backdrop {
    padding: 10px;
    align-items: end;
  }

  .settings-modal {
    width: 100%;
    max-height: 92vh;
    border-radius: 24px 24px 0 0;
  }

  .settings-modal__header,
  .settings-modal__body,
  .settings-modal__footer {
    padding-left: 16px;
    padding-right: 16px;
  }

  .settings-chip-grid {
    grid-template-columns: 1fr;
  }

  .settings-modal__footer {
    flex-direction: column;
  }
}
</style>