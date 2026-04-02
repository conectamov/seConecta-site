<script setup>
import { watch, computed } from 'vue'

const props = defineProps({ olimpiad: { type: Object, default: null } })
const emit = defineEmits(['close'])

watch(() => props.olimpiad, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
})

const STATUS_STYLES = {
  'Inscrições abertas': { pill: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  'Em andamento': { pill: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  'Em breve': { pill: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  'Encerrada': { pill: 'bg-zinc-100 text-zinc-500', dot: 'bg-zinc-400' },
}

const DIFF_STYLES = {
  'Fácil': { class: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'w-1/4 bg-emerald-500' },
  'Intermediário': { class: 'bg-amber-50 text-amber-700 border-amber-200', bar: 'w-2/4 bg-amber-500' },
  'Difícil': { class: 'bg-orange-50 text-orange-700 border-orange-200', bar: 'w-3/4 bg-orange-500' },
  'Expert': { class: 'bg-red-50 text-red-700 border-red-200', bar: 'w-full bg-red-500' },
}

const statusStyle = computed(() => STATUS_STYLES[props.olimpiad?.status] ?? STATUS_STYLES['Encerrada'])
const diffStyle = computed(() => DIFF_STYLES[props.olimpiad?.difficulty_level] ?? DIFF_STYLES['Intermediário'])

const fmtDate = (d) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'

const fmtCount = (n) => {
  if (!n) return null
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k'
  return n.toString()
}

const stars = computed(() => {
  if (!props.olimpiad?.rating) return []
  return Array.from({ length: 5 }, (_, i) => ({
    full: i < Math.floor(props.olimpiad.rating),
    half: i === Math.floor(props.olimpiad.rating) && props.olimpiad.rating % 1 >= 0.5,
    empty: i >= Math.ceil(props.olimpiad.rating),
  }))
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="olimpiad"
        class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
        @click.self="emit('close')"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="'modal-title-' + olimpiad.name"
      >
        <!-- Main Panel -->
        <div 
          class="relative bg-white w-full sm:max-w-2xl max-h-[92vh] rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl"
          :class="{
            'animate-slide-up sm:animate-scale-in': true
          }"
        >
          <!-- Banner -->
          <div class="relative h-52 bg-gradient-to-br from-zinc-200 to-zinc-300 shrink-0">
            <img
              :src="olimpiad.banner_url"
              :alt="olimpiad.name"
              class="w-full h-full object-cover"
              @error="$event.target.style.display = 'none'"
            />
            <div class="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

            <!-- Close button -->
            <button
              @click="emit('close')"
              class="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white bg-black/35 backdrop-blur-sm hover:bg-black/55 transition-colors"
              aria-label="Fechar"
            >
              <svg class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <!-- Banner info -->
            <div class="absolute bottom-0 left-0 right-0 p-5">
              <div class="flex flex-wrap gap-1.5 mb-2.5">
                <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusStyle.pill]">
                  <span :class="['w-[6px] h-[6px] rounded-full', statusStyle.dot]" />
                  {{ olimpiad.status }}
                </span>
                <span v-if="olimpiad.highlighted" class="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-400/90 text-amber-900">
                  Em Destaque
                </span>
                <span v-if="olimpiad.international" class="px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/80 text-white">
                  Internacional
                </span>
              </div>

              <h2 :id="'modal-title-' + olimpiad.name" class="text-xl font-bold text-white leading-snug tracking-tight">
                {{ olimpiad.name }}
              </h2>
              <p v-if="olimpiad.organizer" class="text-xs text-white/60 mt-1 font-medium">
                {{ olimpiad.organizer }}
              </p>
            </div>
          </div>

          <!-- Scrollable Content -->
          <div class="overflow-y-auto flex-1 flex flex-col gap-5 p-5">
            <!-- Tags -->
            <div class="flex flex-wrap gap-1.5">
              <span v-if="olimpiad.area" class="inline-flex items-center text-[11px] font-semibold uppercase tracking-wide px-2.5 py-0.75 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                {{ olimpiad.area }}
              </span>
              <span v-for="cat in olimpiad.categories" :key="cat" class="inline-flex items-center text-[11px] font-semibold uppercase tracking-wide px-2.5 py-0.75 rounded-full border bg-zinc-50 text-zinc-500 border-zinc-200">
                {{ cat }}
              </span>
              <span v-if="olimpiad.language" class="inline-flex items-center text-[11px] font-semibold uppercase tracking-wide px-2.5 py-0.75 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                {{ olimpiad.language }}
              </span>
            </div>

            <!-- Metrics Grid -->
            <div class="grid grid-cols-2 gap-2.5">
              <!-- Rating -->
              <div v-if="olimpiad.rating" class="rounded-xl p-3 border flex flex-col gap-1 bg-amber-50 border-amber-100">
                <p class="text-[10px] font-semibold uppercase tracking-wide text-amber-600/70">Avaliação</p>
                <div class="flex items-baseline gap-2">
                  <span class="text-2xl font-bold text-amber-600 tabular-nums">
                    {{ olimpiad.rating.toFixed(1) }}
                  </span>
                  <div class="flex items-center gap-0.5 pb-0.5">
                    <template v-for="(star, i) in stars" :key="i">
                      <svg class="w-3 h-3" :class="star.empty ? 'text-amber-200' : 'text-amber-500'" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    </template>
                  </div>
                </div>
              </div>

              <!-- Participants -->
              <div v-if="olimpiad.participants_count" class="rounded-xl p-3 border flex flex-col gap-1 bg-blue-50 border-blue-200">
                <p class="text-[10px] font-semibold uppercase tracking-wide text-blue-600/70">Participantes</p>
                <span class="text-2xl font-bold text-blue-600 tabular-nums">
                  {{ fmtCount(olimpiad.participants_count) }}
                </span>
              </div>

              <!-- Duration -->
              <div v-if="olimpiad.estimated_duration" class="rounded-xl p-3 border flex flex-col gap-1 bg-zinc-50 border-zinc-200">
                <p class="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Duração</p>
                <span class="text-sm font-semibold text-zinc-800">{{ olimpiad.estimated_duration }}</span>
              </div>

              <!-- Difficulty -->
              <div v-if="olimpiad.difficulty_level" class="rounded-xl p-3 border flex flex-col gap-1 bg-zinc-50 border-zinc-200">
                <p class="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 mb-2">Dificuldade</p>
                <span :class="['inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full border w-fit', diffStyle.class]">
                  {{ olimpiad.difficulty_level }}
                </span>
                <div class="mt-2.5 h-1 bg-zinc-200 rounded-full overflow-hidden">
                  <div :class="['h-full rounded-full', diffStyle.bar]" />
                </div>
              </div>
            </div>

            <!-- Description -->
            <p class="text-[13px] text-zinc-500 leading-relaxed">{{ olimpiad.description }}</p>

            <!-- Date and Info Grid -->
            <div class="grid grid-cols-2 gap-2">
              <div class="bg-zinc-50 border border-zinc-100 rounded-xl p-2.5">
                <p class="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 mb-0.5">Início</p>
                <p class="text-[13px] font-semibold text-zinc-900 leading-tight">{{ fmtDate(olimpiad.start_date) }}</p>
              </div>
              <div class="bg-zinc-50 border border-zinc-100 rounded-xl p-2.5">
                <p class="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 mb-0.5">Término</p>
                <p class="text-[13px] font-semibold text-zinc-900 leading-tight">{{ fmtDate(olimpiad.end_date) }}</p>
              </div>
              <div class="bg-zinc-50 border border-zinc-100 rounded-xl p-2.5">
                <p class="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 mb-0.5">Local</p>
                <p class="text-[13px] font-semibold text-zinc-900 leading-tight">{{ olimpiad.location }}</p>
              </div>
              <div class="bg-zinc-50 border border-zinc-100 rounded-xl p-2.5">
                <p class="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 mb-0.5">Inscrição</p>
                <p class="text-[13px] font-semibold text-zinc-900 leading-tight">{{ olimpiad.taxes }}</p>
              </div>
              <div v-if="olimpiad.target_audience" class="col-span-2 bg-zinc-50 border border-zinc-100 rounded-xl p-2.5">
                <p class="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 mb-0.5">Público-alvo</p>
                <p class="text-[13px] font-semibold text-zinc-900 leading-tight">{{ olimpiad.target_audience }}</p>
              </div>
              <div v-if="olimpiad.next_edition_date" class="col-span-2 rounded-xl p-2.5 border bg-emerald-50 border-emerald-200">
                <p class="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Próxima edição</p>
                <p class="text-[13px] font-semibold text-zinc-900 leading-tight">{{ fmtDate(olimpiad.next_edition_date) }}</p>
              </div>
            </div>

            <!-- Feature Pills -->
            <div class="flex flex-wrap gap-2">
              <span v-if="olimpiad.certificate" class="inline-flex text-xs font-medium px-3 py-1.25 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">Certificado</span>
              <span v-if="olimpiad.team_allowed" class="inline-flex text-xs font-medium px-3 py-1.25 rounded-full border border-blue-200 bg-blue-50 text-blue-700">Em equipe</span>
              <span v-if="olimpiad.mentorship_available" class="inline-flex text-xs font-medium px-3 py-1.25 rounded-full border border-violet-200 bg-violet-50 text-violet-700">Mentoria</span>
              <span v-if="olimpiad.international" class="inline-flex text-xs font-medium px-3 py-1.25 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700">Internacional</span>
            </div>

            <!-- Modalities -->
            <div v-if="olimpiad.modalities?.length">
              <p class="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 mb-2">Modalidades</p>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="mod in olimpiad.modalities" :key="mod" class="px-3 py-1.5 rounded-full border border-zinc-200 text-xs text-zinc-600 font-medium bg-white">
                  {{ mod }}
                </span>
              </div>
            </div>

            <!-- Application Process -->
            <div v-if="olimpiad.application_process" class="flex gap-3 p-3.5 rounded-xl border border-blue-200 bg-blue-50">
              <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-blue-100">
                <svg class="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <p class="text-[10px] font-semibold uppercase tracking-wide text-blue-700 mb-1">Como se inscrever</p>
                <p class="text-xs leading-relaxed text-zinc-600">{{ olimpiad.application_process }}</p>
              </div>
            </div>

            <!-- Prizes -->
            <div v-if="olimpiad.prizes" class="flex gap-3 p-3.5 rounded-xl border border-amber-200 bg-amber-50">
              <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-amber-100">
                <svg class="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                </svg>
              </div>
              <div>
                <p class="text-[10px] font-semibold uppercase tracking-wide text-amber-700 mb-1">Prêmios</p>
                <p class="text-xs leading-relaxed text-amber-800/80">{{ olimpiad.prizes }}</p>
              </div>
            </div>

            <!-- Requirements -->
            <div v-if="olimpiad.requirements" class="flex gap-3 p-3.5 rounded-xl border border-blue-200 bg-blue-50">
              <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-blue-100">
                <svg class="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <div>
                <p class="text-[10px] font-semibold uppercase tracking-wide text-blue-700 mb-1">Requisitos</p>
                <p class="text-xs leading-relaxed text-blue-800/80">{{ olimpiad.requirements }}</p>
              </div>
            </div>

            <!-- Resources -->
            <div v-if="olimpiad.resources?.length || olimpiad.past_exams_url">
              <p class="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 mb-2">Recursos</p>
              <div class="flex flex-col gap-2">
                <a v-for="res in (olimpiad.resources ?? [])" :key="res.url" :href="res.url" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors">
                  <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                  {{ res.label }}
                </a>
                <a v-if="olimpiad.past_exams_url" :href="olimpiad.past_exams_url" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors">
                  <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  Provas de edições anteriores
                </a>
              </div>
            </div>

            <!-- CTA Button -->
            <a :href="olimpiad.website" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 active:scale-99 transition-all shadow-lg shadow-emerald-600/25">
              Acessar site oficial
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
/* Modal Transitions - Only CSS animations remain */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.22s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-panel {
  transition: transform 0.32s cubic-bezier(0.34, 1.35, 0.64, 1), opacity 0.22s ease;
}

.modal-leave-active .modal-panel {
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.modal-enter-from .modal-panel {
  transform: translateY(36px) scale(0.97);
  opacity: 0;
}

.modal-leave-to .modal-panel {
  transform: translateY(16px) scale(0.98);
  opacity: 0;
}

/* Fallback for older browsers */
@keyframes slideUp {
  from {
    transform: translateY(36px) scale(0.97);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.97);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slideUp 0.32s cubic-bezier(0.34, 1.35, 0.64, 1);
}

.animate-scale-in {
  animation: scaleIn 0.32s cubic-bezier(0.34, 1.35, 0.64, 1);
}

@media (min-width: 640px) {
  .animate-slide-up {
    animation: scaleIn 0.32s cubic-bezier(0.34, 1.35, 0.64, 1);
  }
}
</style>