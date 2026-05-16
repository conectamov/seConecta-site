<script setup lang="ts">
const SNOOZE_KEY = 'seconecta_preferences_onboarding_snoozed_until'

const { currentUser, authReady } = useAuth()

const mounted = ref(false)
const snoozedUntil = ref<number | null>(null)

const hasPreferencesSet = computed(() => {
  return currentUser.value?.preferences_set === true
})

const shouldShowReminder = computed(() => {
  if (!mounted.value) return false
  if (!authReady.value) return false
  if (!currentUser.value) return false
  if (hasPreferencesSet.value) return false
  return true
})

const snoozeText = computed(() => {
  if (!snoozedUntil.value) return 'Complete quando quiser.'

  const diff = snoozedUntil.value - Date.now()

  if (diff <= 0) return 'Complete quando quiser.'

  const hours = Math.ceil(diff / (60 * 60 * 1000))

  if (hours < 24) return `Lembro de novo em ~${hours}h.`

  const days = Math.ceil(hours / 24)
  return `Lembro de novo em ~${days} dias.`
})

function readSnooze() {
  if (!import.meta.client) return

  const raw = localStorage.getItem(SNOOZE_KEY)
  const parsed = raw ? Number(raw) : 0

  snoozedUntil.value = Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function openPreferences() {
  if (!import.meta.client) return

  window.dispatchEvent(
    new CustomEvent('open-user-preferences-onboarding', {
      detail: { source: 'sidebar-reminder' },
    }),
  )
}

function handleSnoozed(event: Event) {
  const customEvent = event as CustomEvent<{ snoozedUntil?: number }>
  snoozedUntil.value = customEvent.detail?.snoozedUntil || null
}

function handleCleared() {
  snoozedUntil.value = null
}

onMounted(() => {
  mounted.value = true
  readSnooze()

  window.addEventListener('user-preferences-onboarding-snoozed', handleSnoozed)
  window.addEventListener('user-preferences-onboarding-cleared', handleCleared)
  window.addEventListener('user-preferences-onboarding-completed', handleCleared)
})

onBeforeUnmount(() => {
  if (!import.meta.client) return

  window.removeEventListener('user-preferences-onboarding-snoozed', handleSnoozed)
  window.removeEventListener('user-preferences-onboarding-cleared', handleCleared)
  window.removeEventListener('user-preferences-onboarding-completed', handleCleared)
})
</script>

<template>
  <section v-if="shouldShowReminder" class="preferences-reminder">
    <div class="reminder-icon">✦</div>

    <div class="reminder-copy">
      <p>Radar incompleto</p>
      <strong>Personalize suas recomendações</strong>
      <span>{{ snoozeText }}</span>
    </div>

    <button type="button" class="reminder-button" @click="openPreferences">
      Configurar
    </button>
  </section>
</template>

<style scoped>
.preferences-reminder {
  border: 1px solid #d9f4e8;
  background: linear-gradient(135deg, #ecfdf5, #ffffff);
  border-radius: 18px;
  padding: 13px;
  display: grid;
  gap: 10px;
}

.reminder-icon {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  background: #079272;
  color: white;
  display: grid;
  place-items: center;
  font-weight: 950;
}

.reminder-copy {
  min-width: 0;
}

.reminder-copy p {
  margin: 0 0 6px;
  color: #079272;
  font-size: .66rem;
  font-weight: 950;
  letter-spacing: .09em;
  text-transform: uppercase;
}

.reminder-copy strong {
  display: block;
  color: #111827;
  font-size: .82rem;
  line-height: 1.2;
  letter-spacing: -.015em;
}

.reminder-copy span {
  display: block;
  margin-top: 5px;
  color: #78716c;
  font-size: .72rem;
  line-height: 1.35;
}

.reminder-button {
  width: 100%;
  border: none;
  border-radius: 12px;
  padding: 9px 10px;
  background: #0f172a;
  color: white;
  font-size: .78rem;
  font-weight: 950;
  cursor: pointer;
}
</style>