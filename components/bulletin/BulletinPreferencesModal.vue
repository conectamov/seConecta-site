<!-- components/bulletin/BulletinPreferencesModal.vue -->

<script setup lang="ts">
const emit = defineEmits<{
  close: []
  saved: []
}>()

const {
  preferences,
  loadPreferences,
  savePreferences,
} = useOpportunityBulletin()

const form = reactive({
  enabled: true,
  frequency: 'weekly',
  categories: [] as string[],
  include_olympiads: true,
  include_scholarships: true,
  include_volunteering: true,
  include_events: true,
})

const categoryOptions = [
  { value: 'OLYMPIAD', label: 'Olimpíadas' },
  { value: 'SCHOLARSHIP', label: 'Bolsas' },
  { value: 'VOLUNTEERING', label: 'Voluntariado' },
  { value: 'SUMMER_PROGRAM', label: 'Summer Programs' },
  { value: 'WORKSHOP', label: 'Workshops' },
  { value: 'INITIATIVE', label: 'Iniciativas' },
  { value: 'MUN', label: 'MUNs' },
]

onMounted(async () => {
  try {
    await loadPreferences()

    if (preferences.value) {
      Object.assign(form, preferences.value)
    }
  } catch {
    // first-time user: keep defaults
  }
})

function toggleCategory(value: string) {
  if (form.categories.includes(value)) {
    form.categories = form.categories.filter(v => v !== value)
  } else {
    form.categories.push(value)
  }
}

async function submit() {
  await savePreferences(form as any)
  emit('saved')
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
    <div class="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-950">
            Preferências do boletim
          </h2>

          <p class="mt-1 text-sm text-slate-500">
            Escolha o tipo de oportunidade que você quer receber.
          </p>
        </div>

        <button
          class="rounded-full p-2 text-slate-500 hover:bg-slate-100"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="mt-6 space-y-6">
        <div>
          <label class="text-sm font-semibold text-slate-700">
            Frequência
          </label>

          <div class="mt-2 grid grid-cols-3 gap-2">
            <button
              v-for="option in ['daily', 'weekly', 'monthly']"
              :key="option"
              class="rounded-xl border px-3 py-2 text-sm"
              :class="form.frequency === option
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
              @click="form.frequency = option"
            >
              {{
                option === 'daily'
                  ? 'Diário'
                  : option === 'weekly'
                    ? 'Semanal'
                    : 'Mensal'
              }}
            </button>
          </div>
        </div>

        <div>
          <label class="text-sm font-semibold text-slate-700">
            Categorias
          </label>

          <div class="mt-2 flex flex-wrap gap-2">
            <button
              v-for="category in categoryOptions"
              :key="category.value"
              class="rounded-full border px-3 py-1.5 text-sm"
              :class="form.categories.includes(category.value)
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
              @click="toggleCategory(category.value)"
            >
              {{ category.label }}
            </button>
          </div>
        </div>

        <div class="space-y-3 rounded-2xl bg-slate-50 p-4">
          <label class="flex items-center justify-between gap-4 text-sm text-slate-700">
            Incluir olimpíadas
            <input v-model="form.include_olympiads" type="checkbox">
          </label>

          <label class="flex items-center justify-between gap-4 text-sm text-slate-700">
            Incluir bolsas
            <input v-model="form.include_scholarships" type="checkbox">
          </label>

          <label class="flex items-center justify-between gap-4 text-sm text-slate-700">
            Incluir voluntariado
            <input v-model="form.include_volunteering" type="checkbox">
          </label>

          <label class="flex items-center justify-between gap-4 text-sm text-slate-700">
            Incluir eventos e workshops
            <input v-model="form.include_events" type="checkbox">
          </label>
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <button
          class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          @click="emit('close')"
        >
          Cancelar
        </button>

        <button
          class="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          @click="submit"
        >
          Salvar preferências
        </button>
      </div>
    </div>
  </div>
</template>