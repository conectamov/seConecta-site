<script setup lang="ts">
const activeTab = ref('quem-somos')

const tabs = [
  {
    id: 'quem-somos', label: 'Quem somos', colorKey: 'green',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
    bigIcon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
    headline: 'Uma iniciativa nascida da vivência real',
  },
  {
    id: 'missao', label: 'Missão', colorKey: 'blue',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`,
    bigIcon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`,
    headline: 'Conectar potencial a oportunidade',
  },
  {
    id: 'valores', label: 'Valores', colorKey: 'teal',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`,
    bigIcon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`,
    headline: 'O que guia cada decisão',
  },
  {
    id: 'visao', label: 'Visão', colorKey: 'amber',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/></svg>`,
    bigIcon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/></svg>`,
    headline: 'Onde queremos chegar',
  },
]

const activeTabData = computed(() => tabs.find(t => t.id === activeTab.value)!)

const content: Record<string, string[]> = {
  'quem-somos': [
    'Somos uma iniciativa educacional construída a partir da vivência direta no ambiente escolar e do diálogo constante com estudantes e educadores.',
    'Nascemos do propósito de fortalecer o interesse pelos estudos, estimular a autonomia intelectual e ampliar horizontes para jovens que não encontram apoio suficiente em seus contextos.',
    'Atuamos para reduzir as distâncias entre estudantes e oportunidades, construindo redes de apoio que valorizam o conhecimento e o crescimento coletivo.',
  ],
  missao: [
    'Conectar estudantes a mentores, referências inspiradoras e oportunidades educacionais, acadêmicas e profissionais.',
    'Oferecer orientação que auxilie na tomada de decisões conscientes sobre estudos, carreira e desenvolvimento pessoal.',
    'Criar pontes entre o potencial acadêmico dos estudantes e caminhos reais de crescimento e realização.',
  ],
  valores: [
    'Colaboração como base para a construção de soluções educacionais mais eficazes, inclusivas e sustentáveis.',
    'Empatia no entendimento das diferentes realidades, desafios e contextos individuais de cada estudante.',
    'Compromisso com a educação como direito fundamental e motor de transformação social.',
    'Crença no poder do conhecimento e do acesso a oportunidades como ferramentas capazes de mudar trajetórias.',
  ],
  visao: [
    'Ser uma referência em apoio educacional colaborativo, reconhecida pela qualidade e impacto social.',
    'Contribuir para a formação de estudantes mais confiantes, informados e preparados para desafios futuros.',
    'Impactar positivamente a trajetória de milhares de jovens, promovendo mobilidade educacional e social.',
  ],
}
</script>

<template>
  <section class="relative overflow-hidden py-16 md:py-24 px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24" aria-label="Missão, valores e visão">
    <div class="absolute inset-0 bg-gradient-to-b from-white to-[#f8fafc]"></div>
    <div class="absolute w-[400px] h-[400px] rounded-full blur-[80px] pointer-events-none bg-[radial-gradient(circle,rgba(13,167,144,0.1),transparent_70%)] top-[-80px] right-0"></div>
    <div class="absolute w-[360px] h-[360px] rounded-full blur-[80px] pointer-events-none bg-[radial-gradient(circle,rgba(36,100,232,0.08),transparent_70%)] bottom-[-60px] left-[-40px]"></div>

    <div class="relative max-w-6xl mx-auto">
      <div class="text-center mb-12" data-aos="fade-up">
        <div class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#079272]/20 bg-[#079272]/10 text-[0.72rem] font-bold tracking-wider uppercase text-[#079272] mb-3.5">
          <span class="w-1.5 h-1.5 rounded-full bg-[#079272]" style="animation: blink 2s ease-in-out infinite;"></span>
          Sobre nós
        </div>
        <h2 class="text-[clamp(1.7rem,3vw,2.5rem)] font-extrabold text-[#0f172a] tracking-[-0.03em] mb-2.5">
          Quem é a <span class="bg-gradient-to-r from-[#079272] to-[#2464E8] bg-clip-text text-transparent">seConecta?</span>
        </h2>
        <p class="text-base text-[#64748b] max-w-[440px] mx-auto">Conheça nossa história, propósito e os valores que guiam cada decisão.</p>
      </div>

      <div class="bg-white border border-[#e2e8f0] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.07)] overflow-hidden" data-aos="fade-up">
        <!-- Tabs -->
        <div class="flex gap-1 flex-nowrap overflow-x-auto p-3.5 px-4 pt-4 scrollbar-none" role="tablist">
          <button
            v-for="tab in tabs" :key="tab.id"
            :id="`tab-${tab.id}`" role="tab"
            :aria-selected="activeTab === tab.id"
            :aria-controls="`panel-${tab.id}`"
            @click="activeTab = tab.id"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-[0.8rem] font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 relative border-none"
            :class="activeTab === tab.id
              ? 'text-[#079272] bg-[#079272]/10 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-[#079272] after:to-[#2464E8] after:rounded-t-sm'
              : 'text-[#64748b] bg-transparent hover:text-[#374151] hover:bg-black/5'"
          >
            <span class="opacity-70 flex items-center" :class="{ 'opacity-100': activeTab === tab.id }" v-html="tab.icon"></span>
            {{ tab.label }}
          </button>
        </div>

        <!-- URL bar decorativa -->
        <div class="hidden sm:flex items-center gap-2.5 mx-4 px-3.5 py-2 bg-[#f8fafc] border border-[#e2e8f0] border-t-0 rounded-b-lg mb-0.5" aria-hidden="true">
          <div class="flex gap-1">
            <span class="w-2 h-2 rounded-full bg-[#ff5f57]"></span>
            <span class="w-2 h-2 rounded-full bg-[#febc2e]"></span>
            <span class="w-2 h-2 rounded-full bg-[#28c840]"></span>
          </div>
          <div class="flex-1 flex items-center gap-1.5 font-mono text-[0.72rem] text-[#94a3b8] bg-white border border-[#e2e8f0] rounded-[6px] px-2.5 py-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            <span>seconecta.org/<span class="text-[#079272] font-semibold">{{ activeTab }}</span></span>
          </div>
        </div>

        <!-- Conteúdo -->
        <div class="p-7 min-h-[280px]">
          <Transition name="slide-fade" mode="out-in">
            <div :key="activeTab" :id="`panel-${activeTab}`" role="tabpanel" :aria-labelledby="`tab-${activeTab}`" class="flex gap-5 items-start sm:flex-row flex-col">
              <div
                class="flex-shrink-0 w-[60px] h-[60px] rounded-[16px] flex items-center justify-center"
                :class="{
                  'bg-[#079272]/10 text-[#079272]': activeTabData.colorKey === 'green',
                  'bg-[#2464E8]/10 text-[#2464E8]': activeTabData.colorKey === 'blue',
                  'bg-[#0DA790]/10 text-[#0DA790]': activeTabData.colorKey === 'teal',
                  'bg-[#F59E0B]/10 text-[#D97706]': activeTabData.colorKey === 'amber',
                }"
                v-html="activeTabData.bigIcon"
              ></div>
              <div class="flex-1">
                <h3 class="text-[1.05rem] font-bold text-[#0f172a] tracking-[-0.02em] mb-4">{{ activeTabData.headline }}</h3>
                <div class="flex flex-col gap-3">
                  <div
                    v-for="(item, i) in content[activeTab]" :key="i"
                    class="flex gap-3 items-start"
                    :style="`animation: itemIn 0.4s ease both; animation-delay: ${i * 0.08}s`"
                  >
                    <div class="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                      :class="{
                        'bg-[#079272]': activeTabData.colorKey === 'green',
                        'bg-[#2464E8]': activeTabData.colorKey === 'blue',
                        'bg-[#0DA790]': activeTabData.colorKey === 'teal',
                        'bg-[#F59E0B]': activeTabData.colorKey === 'amber',
                      }"></div>
                    <p class="text-[0.9rem] text-[#475569] leading-relaxed">{{ item }}</p>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Dots mobile -->
        <div class="flex sm:hidden justify-center gap-1.5 py-3.5" aria-hidden="true">
          <button
            v-for="tab in tabs" :key="tab.id"
            @click="activeTab = tab.id"
            class="h-1.5 rounded-full border-none cursor-pointer transition-all duration-200 p-0"
            :class="activeTab === tab.id ? 'bg-gradient-to-r from-[#079272] to-[#2464E8] w-[18px] rounded-[4px]' : 'w-1.5 bg-[#e2e8f0]'"
          ></button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@keyframes blink { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.65)} }
@keyframes itemIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
.slide-fade-enter-active { transition: all 0.22s ease; }
.slide-fade-leave-active { transition: all 0.15s ease; }
.slide-fade-enter-from { opacity:0; transform:translateY(10px); }
.slide-fade-leave-to { opacity:0; transform:translateY(-8px); }
.scrollbar-none::-webkit-scrollbar { display:none; }
.scrollbar-none { scrollbar-width:none; }
</style>
