<script setup lang="ts">
const props = defineProps<{ tester: any }>()
const flipped = ref(false)

function handleClick() {
  if (!import.meta.client) return
  if (window.matchMedia('(hover: none)').matches || window.innerWidth < 1024) {
    flipped.value = !flipped.value
  }
}

function getInitials(name: string) {
  return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
}
</script>

<template>
  <div
    class="bt-scene"
    :class="{ 'is-flipped': flipped }"
    role="button"
    :aria-label="`Ver mais sobre ${tester.name}`"
    tabindex="0"
    data-aos="fade-up"
    @click="handleClick"
  >
    <div class="bt-inner">

      <!-- Frente -->
      <div class="bt-face bt-front">
        <div class="h-1 w-full flex-shrink-0 bg-gradient-to-r from-[#2464E8] to-[#079272]"></div>
        <div class="absolute top-0 left-0 w-24 h-24 rounded-full opacity-[0.06] pointer-events-none"
          style="background: radial-gradient(circle, #2464E8, transparent); transform: translate(-25%, -25%)">
        </div>

        <div class="flex flex-col items-center flex-1 px-5 pt-5 pb-4 relative">
          <div class="relative mb-3 flex-shrink-0">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2464E8]/10 to-[#079272]/10 border border-[#2464E8]/15 flex items-center justify-center">
              <svg class="w-5 h-5 text-[#2464E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#079272] border-2 border-white flex items-center justify-center">
              <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            </span>
          </div>

          <h4 class="text-[0.88rem] font-bold text-[#111] text-center tracking-[-0.02em] mb-1">{{ tester.name }}</h4>

          <div class="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#2464E8]/8 border border-[#2464E8]/20 text-[#2464E8] rounded-full text-[0.62rem] font-semibold mb-3">
            <span class="w-1 h-1 rounded-full bg-[#2464E8] animate-pulse"></span>
            {{ tester.role }}
          </div>

          <p v-if="tester.feedback" class="text-[0.73rem] font-light text-[#777] text-center leading-relaxed italic line-clamp-3">
            "{{ tester.feedback }}"
          </p>
          <p v-else class="text-[0.68rem] text-[#bbb] text-center italic">Beta tester verificado</p>

          <p class="mt-auto pt-3 text-[0.6rem] text-[#ccc] flex items-center gap-1 select-none">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 10l5 5 5-5"/></svg>
            Clique para conhecer
          </p>
        </div>
      </div>

      <!-- Verso -->
      <div class="bt-face bt-back">
        <div class="h-1 w-full flex-shrink-0 bg-gradient-to-r from-[#2464E8] to-[#079272]"></div>
        <div class="absolute bottom-0 right-0 w-28 h-28 rounded-full opacity-[0.12] pointer-events-none"
          style="background: radial-gradient(circle, #079272, transparent); transform: translate(25%, 25%)">
        </div>

        <div class="flex flex-col flex-1 px-5 pt-4 pb-4 relative z-10">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-7 h-7 rounded-xl bg-gradient-to-br from-[#2464E8] to-[#079272] flex items-center justify-center text-white text-[0.6rem] font-bold flex-shrink-0">
              {{ getInitials(tester.name) }}
            </div>
            <div>
              <p class="text-[0.78rem] font-bold text-white leading-none">{{ tester.name }}</p>
              <p class="text-[0.6rem] text-[#079272] mt-0.5">{{ tester.role }}</p>
            </div>
          </div>

          <p v-if="tester.bio" class="text-[0.75rem] font-light text-white/60 leading-relaxed flex-1">{{ tester.bio }}</p>
          <p v-else-if="tester.feedback" class="text-[0.75rem] font-light text-white/60 leading-relaxed flex-1 italic">"{{ tester.feedback }}"</p>
          <p v-else class="text-[0.75rem] text-white/35 italic flex-1">Contribuiu para tornar a plataforma melhor.</p>

          <div class="mt-3 flex items-center gap-2">
            <span class="text-[0.6rem] font-semibold px-2 py-0.5 rounded-full bg-[#079272]/20 border border-[#079272]/30 text-[#079272]">✓ Verificado</span>
          </div>

          <p class="mt-2 text-[0.6rem] text-white/20 flex items-center gap-1 select-none">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 15l5-5 5 5"/></svg>
            Clique para voltar
          </p>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.bt-scene {
  perspective: 1200px;
  height: 240px;
  cursor: pointer;
  outline: none;
}

.bt-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
}

@media (hover: hover) and (min-width: 1024px) {
  .bt-scene:hover .bt-inner { transform: rotateY(180deg); }
}

.bt-scene.is-flipped .bt-inner { transform: rotateY(180deg); }

.bt-face {
  position: absolute;
  inset: 0;
  border-radius: 1rem;
  border: 1px solid #e8e4dc;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: white;
}

.bt-back {
  transform: rotateY(180deg);
  background: #0c1b32 !important;
  border-color: rgba(255,255,255,0.07);
}
</style>
