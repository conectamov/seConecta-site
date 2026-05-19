<script setup lang="ts">
const SNOOZE_KEY = 'seconecta_preferences_onboarding_snoozed_until'

const emit = defineEmits<{
  'visible-change': [visible: boolean]
}>()

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
  if (!snoozedUntil.value) return 'Configurar'

  const diff = snoozedUntil.value - Date.now()

  if (diff <= 0) return 'Configurar'

  const hours = Math.ceil(diff / (60 * 60 * 1000))

  if (hours < 24) return `~${hours}h`

  const days = Math.ceil(hours / 24)
  return `~${days}d`
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

watch(
  shouldShowReminder,
  (visible) => {
    emit('visible-change', visible)
  },
  { immediate: true },
)

onMounted(() => {
  mounted.value = true
  readSnooze()

  window.addEventListener('user-preferences-onboarding-snoozed', handleSnoozed)
  window.addEventListener('user-preferences-onboarding-cleared', handleCleared)
  window.addEventListener('user-preferences-onboarding-completed', handleCleared)
})

onBeforeUnmount(() => {
  if (!import.meta.client) return

  emit('visible-change', false)

  window.removeEventListener('user-preferences-onboarding-snoozed', handleSnoozed)
  window.removeEventListener('user-preferences-onboarding-cleared', handleCleared)
  window.removeEventListener('user-preferences-onboarding-completed', handleCleared)
})
</script>

<template>
  <button
    v-if="shouldShowReminder"
    type="button"
    class="preferences-warning"
    @click="openPreferences"
  >
    <span class="warning-icon">!</span>

    <span class="warning-copy">
      <strong>Perfil incompleto</strong>
      <small>Personalize recomendações</small>
    </span>

  </button>
</template>

<style scoped>
.preferences-warning {
  width: 100%;
  border: 1px solid #fde68a;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  color: #78350f;
  border-radius: 14px;
  padding: 9px 10px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 9px;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(245, 158, 11, .12);
  transition:
    transform .15s ease,
    border-color .15s ease,
    box-shadow .15s ease;
}

.preferences-warning:hover {
  transform: translateY(-1px);
  border-color: #f59e0b;
  box-shadow: 0 12px 26px rgba(245, 158, 11, .18);
}

.warning-icon {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: #f59e0b;
  color: white;
  display: grid;
  place-items: center;
  font-size: .78rem;
  font-weight: 950;
  flex-shrink: 0;
}

.warning-copy {
  min-width: 0;
  display: grid;
  gap: 1px;
}

.warning-copy strong {
  color: #78350f;
  font-size: .74rem;
  font-weight: 950;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.warning-copy small {
  color: #92400e;
  font-size: .66rem;
  font-weight: 750;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.warning-action {
  border-radius: 999px;
  background: rgba(255, 255, 255, .72);
  color: #92400e;
  padding: 5px 7px;
  font-size: .63rem;
  font-weight: 950;
  white-space: nowrap;
}
</style>