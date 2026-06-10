<!-- pages/boletim.vue -->

<script setup lang="ts">
import { useOpportunityBulletin } from '~/composables/useOpportunityBulletin'
definePageMeta({
  middleware: ['auth'],
})

const {
  bulletin,
  preferences,
  loading,
  error,
  loadPreferences,
  loadPreview,
  generateBulletin,
  saveOpportunity,
  dismissOpportunity,
  markOpened,
} = useOpportunityBulletin()

const showPreferences = ref(false)

onMounted(async () => {
  try {
    await loadPreferences()

    if (!preferences.value) {
      showPreferences.value = true
      return
    }

    await loadPreview()
  } catch {
    showPreferences.value = true
  }
})

async function handleGenerate() {
  await generateBulletin()
}

async function openOpportunity(item: any) {
  await markOpened(item.id)
  await navigateTo(`/oportunidades/${item.slug}`)
}
</script>

<template>
  <main class="min-h-screen bg-slate-50 px-4 py-8">
    <section class="mx-auto max-w-6xl space-y-8">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-sm font-medium text-blue-600">
            Seu boletim
          </p>

          <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Oportunidades escolhidas para você
          </h1>

          <p class="mt-3 max-w-2xl text-slate-600">
            Um resumo personalizado com oportunidades, olimpíadas e iniciativas
            que combinam com seus interesses.
          </p>
        </div>

        <div class="flex gap-3">
          <button
            class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100"
            @click="showPreferences = true"
          >
            Preferências
          </button>

          <button
            class="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            :disabled="loading"
            @click="handleGenerate"
          >
            {{ loading ? 'Gerando...' : 'Gerar novo boletim' }}
          </button>
        </div>
      </div>

      <div
        v-if="error"
        class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      >
        {{ error }}
      </div>

      <div
        v-if="loading && !bulletin"
        class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500"
      >
        Carregando seu boletim...
      </div>

      <div
        v-else-if="bulletin?.opportunities?.length"
        class="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <article
          v-for="item in bulletin.opportunities"
          :key="item.id"
          class="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <button
            class="block w-full text-left"
            @click="openOpportunity(item)"
          >
            <div
              v-if="item.cover_url"
              class="h-36 bg-slate-100"
            >
              <img
                :src="item.cover_url"
                :alt="item.title"
                class="h-full w-full object-cover"
              >
            </div>

            <div class="space-y-3 p-5">
              <div class="flex items-center justify-between gap-3">
                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {{ item.category || 'Oportunidade' }}
                </span>

                <span
                  v-if="item.next_deadline"
                  class="text-xs text-slate-500"
                >
                  {{ new Date(item.next_deadline).toLocaleDateString('pt-BR') }}
                </span>
              </div>

              <h2 class="line-clamp-2 text-lg font-semibold text-slate-950">
                {{ item.title }}
              </h2>

              <p
                v-if="item.excerpt"
                class="line-clamp-3 text-sm text-slate-600"
              >
                {{ item.excerpt }}
              </p>

              <p
                v-if="item.reason"
                class="rounded-xl bg-blue-50 p-3 text-sm text-blue-800"
              >
                {{ item.reason }}
              </p>
            </div>
          </button>

          <div class="flex items-center justify-between border-t border-slate-100 p-4">
            <button
              class="text-sm font-medium text-blue-600 hover:text-blue-700"
              @click="saveOpportunity(item.id)"
            >
              {{ item.saved_at ? 'Salvo' : 'Salvar' }}
            </button>

            <button
              class="text-sm font-medium text-slate-500 hover:text-slate-800"
              @click="dismissOpportunity(item.id)"
            >
              Remover
            </button>
          </div>
        </article>
      </div>

      <div
        v-else
        class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"
      >
        <h2 class="text-lg font-semibold text-slate-900">
          Ainda não há boletim por aqui.
        </h2>

        <p class="mt-2 text-sm text-slate-500">
          Gere um boletim personalizado com base nos seus interesses.
        </p>

        <button
          class="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          @click="handleGenerate"
        >
          Gerar meu boletim
        </button>
      </div>
    </section>

    <BulletinPreferencesModal
      v-if="showPreferences"
      @close="showPreferences = false"
      @saved="async () => {
        showPreferences = false
        await loadPreview()
      }"
    />
  </main>
</template>