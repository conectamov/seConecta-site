<script setup lang="ts">
const props = defineProps<{ club: any; index: number }>()
const emit = defineEmits<{ open: [club: any] }>()

const MODE_META: Record<string, { label: string; icon: string; color: string }> = {
  FREE:        { label: 'Grupo Livre',   icon: 'fa-users',         color: '#079272' },
  CLASSROOM:   { label: 'Sala de Aula',  icon: 'fa-chalkboard',    color: '#2464E8' },
  MENTORSHIP:  { label: 'Mentoria',      icon: 'fa-user-graduate', color: '#8B5CF6' },
  COURSE:      { label: 'Curso',         icon: 'fa-book-open',     color: '#F59E0B' },
  COMMUNITY:   { label: 'Comunidade',    icon: 'fa-globe',         color: '#EC4899' },
}

const meta = computed(() => MODE_META[props.club.mode] ?? MODE_META.FREE)

const spotsLeft = computed(() => {
  if (!props.club.maxMembers) return null
  return Math.max(0, props.club.maxMembers - props.club.membersCount)
})

const isFull = computed(() => spotsLeft.value !== null && spotsLeft.value === 0)

const activeFlags = computed(() => {
  const f = props.club.features ?? {}
  const labels: string[] = []
  if (f.assignmentsEnabled) labels.push('Tarefas')
  if (f.gradingEnabled) labels.push('Notas')
  if (f.certificatesEnabled) labels.push('Certificado')
  if (f.gamificationEnabled) labels.push('Gamificação')
  return labels
})
</script>

<template>
  <article
    class="bg-white rounded-2xl border border-[#e8e4dc] cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] hover:border-[rgba(7,146,114,0.25)] group overflow-hidden flex flex-col"
    :style="{ animation: `cardIn 0.5s ease ${index * 0.07}s both` }"
    @click="emit('open', club)"
  >
    <!-- Cover -->
    <div
      class="relative h-32 overflow-hidden flex-shrink-0"
      :style="{ background: club.coverImage ? 'transparent' : (club.themeColor ? club.themeColor + '18' : '#f7f5f0') }"
    >
      <img
        v-if="club.coverImage"
        :src="club.coverImage"
        :alt="club.name"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <!-- Icon overlay -->
      <div class="absolute inset-0 flex items-center justify-center">
        <div
          v-if="!club.coverImage"
          class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
          :style="{ background: meta.color + '18', color: meta.color }"
        >
          {{ club.icon || '📚' }}
        </div>
      </div>
      <!-- Mode badge -->
      <div class="absolute top-3 left-3">
        <span
          class="text-[0.62rem] font-bold px-2 py-0.5 rounded-full"
          :style="{ background: meta.color + '22', color: meta.color }"
        >
          {{ meta.label }}
        </span>
      </div>
      <!-- Visibility badge -->
      <div v-if="club.visibility !== 'PUBLIC'" class="absolute top-3 right-3">
        <span class="text-[0.62rem] font-semibold px-2 py-0.5 rounded-full bg-black/30 text-white">
          {{ club.visibility === 'PRIVATE' ? 'Privado' : 'Não listado' }}
        </span>
      </div>
    </div>

    <!-- Body -->
    <div class="p-5 flex flex-col gap-3 flex-1">
      <h3 class="text-[1.05rem] font-bold text-[#111] leading-snug tracking-[-0.02em] group-hover:text-[#079272] transition-colors line-clamp-1">
        {{ club.name }}
      </h3>

      <p v-if="club.shortDescription" class="text-[0.8rem] font-light text-[#777] line-clamp-2 leading-relaxed">
        {{ club.shortDescription }}
      </p>

      <!-- Feature flags -->
      <div v-if="activeFlags.length" class="flex flex-wrap gap-1">
        <span
          v-for="flag in activeFlags"
          :key="flag"
          class="text-[0.6rem] font-semibold px-1.5 py-0.5 bg-[#f7f5f0] border border-[#e8e4dc] text-[#888] rounded-full"
        >
          {{ flag }}
        </span>
      </div>

      <!-- Tags -->
      <div v-if="club.tags?.length" class="flex flex-wrap gap-1">
        <span
          v-for="tag in club.tags.slice(0, 3)"
          :key="tag"
          class="text-[0.62rem] font-semibold px-2 py-0.5 bg-[#f7f5f0] border border-[#e8e4dc] text-[#888] rounded-full"
        >
          #{{ tag }}
        </span>
        <span v-if="club.tags.length > 3" class="text-[0.62rem] text-[#bbb]">+{{ club.tags.length - 3 }}</span>
      </div>

      <!-- Footer -->
      <div class="mt-auto pt-3 border-t border-[#f5f3f0] flex items-center justify-between">
        <div class="flex items-center gap-3 text-[0.72rem] text-[#aaa]">
          <span class="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {{ club.membersCount }}
            <span v-if="club.maxMembers" class="text-[#ddd]">/ {{ club.maxMembers }}</span>
          </span>

          <span v-if="club.level" class="capitalize">{{ club.level }}</span>
          <span v-if="club.language">{{ club.language }}</span>
        </div>

        <div class="flex items-center gap-2">
          <span
            v-if="isFull"
            class="text-[0.65rem] font-semibold text-red-500"
          >
            Lotado
          </span>
          <span
            v-else-if="spotsLeft !== null && spotsLeft <= 5"
            class="text-[0.65rem] font-semibold text-amber-500"
          >
            {{ spotsLeft }} vaga{{ spotsLeft !== 1 ? 's' : '' }}
          </span>

          <span v-if="club.requireApproval" class="text-[0.65rem] text-[#bbb] flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Aprovação
          </span>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
@keyframes cardIn {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
