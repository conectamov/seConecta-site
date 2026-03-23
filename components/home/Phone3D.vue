<script setup lang="ts">
const currentScreen = ref(0)

const screens = [
  { label: 'Match estudantes', src: '/screens/chat1.png' },
  { label: 'Oportunidades', src: '/screens/chat2.png' },
  { label: 'Conexões', src: '/screens/chat3.png' },
]

let interval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  interval = setInterval(() => {
    currentScreen.value = (currentScreen.value + 1) % screens.length
  }, 3500)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

function setScreen(i: number) {
  currentScreen.value = i
  if (interval) clearInterval(interval)
  interval = setInterval(() => {
    currentScreen.value = (currentScreen.value + 1) % screens.length
  }, 3500)
}
</script>

<template>
  <div class="relative flex flex-col items-center" aria-label="Demonstração do Nexo seConecta">

    <!-- Glow atrás do phone -->
    <div
      class="absolute rounded-[60px] blur-3xl opacity-25 pointer-events-none transition-all duration-700"
      style="inset: -20px; background: linear-gradient(135deg, #079272, #2464E8);"
    />

    <!-- Corpo do smartphone -->
    <div
      class="relative z-10"
      style="animation: phoneFloat 4s ease-in-out infinite;"
    >
      <!-- Frame exterior (alumínio) -->
      <div style="
        width: 230px;
        background: linear-gradient(160deg, #d4d4d8 0%, #a1a1aa 30%, #e4e4e7 60%, #d4d4d8 100%);
        border-radius: 38px;
        padding: 3px;
        box-shadow:
          0 0 0 1px rgba(0,0,0,0.12),
          0 50px 100px rgba(0,0,0,0.4),
          0 25px 50px rgba(0,0,0,0.25),
          inset 0 1px 0 rgba(255,255,255,0.5);
      ">
        <!-- Frame interior preto -->
        <div style="background: #080808; border-radius: 36px; overflow: hidden; position: relative;">

          <!-- Dynamic Island -->
          <div style="
            position: absolute;
            top: 11px;
            left: 50%;
            transform: translateX(-50%);
            width: 78px;
            height: 24px;
            background: #080808;
            border-radius: 13px;
            z-index: 20;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
          ">
            <div style="width: 9px; height: 9px; border-radius: 50%; background: #1a1a1a; border: 1px solid #2a2a2a;"></div>
            <div style="width: 5px; height: 5px; border-radius: 50%; background: #111; border: 1px solid #222; animation: notchPulse 2.5s ease-in-out infinite;"></div>
          </div>

          <!-- Status bar -->
          <div style="
            height: 44px;
            background: linear-gradient(180deg, #080808 60%, transparent);
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            padding: 0 20px 4px;
            position: relative;
            z-index: 10;
          ">
            <span style="color: white; font-size: 10px; font-weight: 600; font-family: -apple-system, sans-serif;">9:41</span>
            <div style="display: flex; gap: 4px; align-items: center;">
              <!-- Signal bars -->
              <svg width="14" height="10" viewBox="0 0 14 10" fill="white">
                <rect x="0" y="6" width="2" height="4" rx="0.5"/>
                <rect x="3" y="4" width="2" height="6" rx="0.5"/>
                <rect x="6" y="2" width="2" height="8" rx="0.5"/>
                <rect x="9" y="0" width="2" height="10" rx="0.5"/>
              </svg>
              <!-- Battery -->
              <svg width="20" height="11" viewBox="0 0 20 11" fill="none">
                <rect x="0.5" y="0.5" width="17" height="10" rx="2" stroke="white" stroke-width="1"/>
                <rect x="18" y="3" width="2" height="5" rx="1" fill="white"/>
                <rect x="2" y="2" width="12" height="7" rx="1" fill="white"/>
              </svg>
            </div>
          </div>

          <!-- Tela do app — transição suave entre screenshots -->
          <div style="position: relative; overflow: hidden; width: 224px; height: 418px; background: #111;">
            <Transition name="screen">
              <img
                :key="currentScreen"
                :src="screens[currentScreen].src"
                :alt="screens[currentScreen].label"
                style="width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; position: absolute; inset: 0;"
                loading="eager"
              />
            </Transition>
          </div>

          <!-- Home indicator -->
          <div style="background: #080808; display: flex; justify-content: center; padding: 8px 0 10px;">
            <div style="width: 100px; height: 5px; background: rgba(255,255,255,0.35); border-radius: 3px;"></div>
          </div>
        </div>
      </div>

      <!-- Botões laterais esquerda (volume) -->
      <div style="position:absolute; left:-5px; top:90px; width:4px; height:28px; background:linear-gradient(180deg,#b0b0b5,#d0d0d5); border-radius:2px 0 0 2px;"></div>
      <div style="position:absolute; left:-5px; top:126px; width:4px; height:40px; background:linear-gradient(180deg,#b0b0b5,#d0d0d5); border-radius:2px 0 0 2px;"></div>
      <div style="position:absolute; left:-5px; top:174px; width:4px; height:40px; background:linear-gradient(180deg,#b0b0b5,#d0d0d5); border-radius:2px 0 0 2px;"></div>

      <!-- Botão power (direita) -->
      <div style="position:absolute; right:-5px; top:130px; width:4px; height:60px; background:linear-gradient(180deg,#b0b0b5,#d0d0d5); border-radius:0 2px 2px 0;"></div>
    </div>

    <!-- Indicadores -->
    <div class="flex gap-2 mt-6 z-10 relative">
      <button
        v-for="(s, i) in screens"
        :key="i"
        class="rounded-full border-none cursor-pointer transition-all duration-300"
        :style="{
          width: i === currentScreen ? '22px' : '7px',
          height: '7px',
          background: i === currentScreen ? '#079272' : '#cbd5e1',
        }"
        @click="setScreen(i)"
        :aria-label="`Ver tela: ${s.label}`"
      />
    </div>

    <p class="text-[0.72rem] text-[#64748b] mt-2 font-medium z-10 relative">
      {{ screens[currentScreen].label }}
    </p>
  </div>
</template>

<style scoped>
@keyframes phoneFloat {
  0%, 100% { transform: translateY(0px) rotate(-1deg); }
  50% { transform: translateY(-14px) rotate(1deg); }
}

@keyframes notchPulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

.screen-enter-active,
.screen-leave-active {
  transition: opacity 0.5s ease;
  position: absolute;
  inset: 0;
}
.screen-enter-from { opacity: 0; }
.screen-leave-to { opacity: 0; }
</style>
