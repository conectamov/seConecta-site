<script setup>
import { computed } from 'vue'

const props = defineProps({ olimpiad: { type: Object, required: true } })
const emit = defineEmits(['open'])

const STATUS_DOT = {
  'Inscrições abertas': 'bg-emerald-500',
  'Em andamento': 'bg-blue-500',
  'Em breve': 'bg-amber-500',
  'Encerrada': 'bg-zinc-300',
}

const statusDot = computed(() => STATUS_DOT[props.olimpiad.status] ?? STATUS_DOT['Encerrada'])

const fmtDate = (d) =>
  new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

const fmtCount = (n) => {
  if (!n) return null
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return Math.round(n / 1_000) + 'k'
  return String(n)
}

const countdown = computed(() => {
  const d = props.olimpiad.deadline_countdown
  if (!d || d <= 0 || props.olimpiad.status !== 'Inscrições abertas') return null
  return { label: d === 1 ? '1 dia' : `${d} dias`, urgent: d <= 7 }
})
</script>

<template>
  <article
    @click="emit('open', olimpiad)"
    @keydown.enter="emit('open', olimpiad)"
    @keydown.space.prevent="emit('open', olimpiad)"
    class="card group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-zinc-100 cursor-pointer select-none w-[272px] shrink-0 shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 transition-all duration-200"
    role="button"
    tabindex="0"
    :aria-label="`Ver detalhes: ${olimpiad.name}`"
  >
    <!-- Image Section -->
    <div class="relative h-40 bg-gradient-to-br from-zinc-100 to-zinc-200 overflow-hidden shrink-0">
      <img
        :src="olimpiad.banner_url"
        :alt="olimpiad.name"
        class="img-zoom w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        @error="$event.target.style.display = 'none'"
        loading="lazy"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

      <!-- Status Badge -->
      <div class="absolute top-3 left-3">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1.25 rounded-full text-[11px] font-medium text-zinc-700 leading-none bg-white/95 backdrop-blur-sm shadow-sm">
          <span :class="['w-[7px] h-[7px] rounded-full shrink-0', statusDot]" />
          {{ olimpiad.status }}
        </span>
      </div>

      <!-- Urgency / Highlight Badge -->
      <div class="absolute top-3 right-3">
        <span
          v-if="countdown"
          :class="[
            'inline-flex items-center px-2.5 py-1.25 rounded-full text-[11px] font-semibold leading-none shadow-sm',
            countdown.urgent ? 'bg-red-500 text-white' : 'bg-amber-400 text-amber-950'
          ]"
        >{{ countdown.label }}</span>
        <span
          v-else-if="olimpiad.highlighted"
          class="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm leading-none bg-white/95 backdrop-blur-sm shadow-sm"
        >⭐</span>
      </div>
    </div>

    <!-- Card Body -->
    <div class="flex flex-col flex-1 px-4 pt-3.5 pb-4 gap-2.5">
      <!-- Meta info -->
      <div class="flex items-center gap-1.5 min-h-4 flex-wrap">
        <span class="text-[11px] font-semibold tracking-wide text-emerald-700 uppercase">
          {{ olimpiad.area }}
        </span>
        <template v-if="olimpiad.difficulty_level">
          <span class="text-zinc-200 leading-none">·</span>
          <span class="text-[11px] text-zinc-400 font-medium">{{ olimpiad.difficulty_level }}</span>
        </template>
        <template v-if="olimpiad.international">
          <span class="text-zinc-200 leading-none">·</span>
          <span class="text-[11px] font-medium text-violet-500">Global</span>
        </template>
      </div>

      <!-- Title -->
      <h2 class="text-[13.5px] font-semibold text-zinc-900 leading-tight line-clamp-2 group-hover:text-emerald-700 transition-colors duration-200">
        {{ olimpiad.name }}
      </h2>

      <!-- Social proof -->
      <div v-if="olimpiad.rating || olimpiad.participants_count" class="flex items-center gap-2 text-[11px] text-zinc-400">
        <span v-if="olimpiad.rating" class="flex items-center gap-1 font-semibold text-amber-500">
          <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          {{ olimpiad.rating.toFixed(1) }}
        </span>
        <span v-if="olimpiad.rating && olimpiad.participants_count" class="text-zinc-200">·</span>
        <span v-if="olimpiad.participants_count" class="tabular-nums">
          {{ fmtCount(olimpiad.participants_count) }} inscritos
        </span>
      </div>

      <!-- Feature chips -->
      <div class="flex items-center gap-1.5 flex-wrap mt-auto pt-1">
        <span v-if="olimpiad.taxes === 'Gratuito'" class="inline-flex items-center text-[11px] font-medium px-2 py-0.75 rounded-md border bg-emerald-50 text-emerald-800 border-emerald-200">Gratuito</span>
        <span v-if="olimpiad.certificate" class="inline-flex items-center text-[11px] font-medium px-2 py-0.75 rounded-md border bg-zinc-50 text-zinc-600 border-zinc-200">Certificado</span>
        <span v-if="olimpiad.team_allowed" class="inline-flex items-center text-[11px] font-medium px-2 py-0.75 rounded-md border bg-blue-50 text-blue-800 border-blue-200">Em equipe</span>
        <span v-if="olimpiad.mentorship_available" class="inline-flex items-center text-[11px] font-medium px-2 py-0.75 rounded-md border bg-violet-50 text-violet-800 border-violet-200">Mentoria</span>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between pt-3 border-t border-zinc-100">
        <div class="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium">
          <svg class="w-3 h-3 text-zinc-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span class="tabular-nums">{{ fmtDate(olimpiad.start_date) }} – {{ fmtDate(olimpiad.end_date) }}</span>
        </div>

        <span class="cta-arrow inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 group-hover:gap-1.5 transition-all duration-200">
          Saiba mais
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped>
/* Only animations and complex transitions remain */
.card {
  transition: transform 280ms cubic-bezier(0.34, 1.2, 0.64, 1), box-shadow 280ms ease, border-color 180ms ease;
}

.card:hover {
  transform: translateY(-4px);
}

.card:active {
  transform: translateY(-1px) scale(0.99);
  transition-duration: 100ms;
}

/* Image zoom is handled by group-hover in Tailwind */
/* CTA gap animation handled by group-hover in Tailwind */

/* Backdrop blur for badges (requires custom backdrop-filter) */
.bg-white\/95 {
  background-color: rgba(255, 255, 255, 0.95);
}

.backdrop-blur-sm {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
</style>