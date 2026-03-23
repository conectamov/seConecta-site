<script setup lang="ts">
const features1 = [
  'Feed com oportunidades selecionadas e curadas',
  'Histórias reais de estudantes inspiradores',
  'Notificações no WhatsApp para oportunidades relevantes',
]
const features2 = [
  'Sistema de match inteligente baseado em interesses',
  'Recomendações de pessoas com perfis alinhados',
  'Conexões genuínas para trocas significativas',
]
const preview1 = [75, 55, 90]
const matches = [
  { init: 'A', color: '#2464E8' },
  { init: 'B', color: '#079272' },
  { init: 'C', color: '#F59E0B' },
]
const stats = [
  { value: '+44', label: 'Estudantes ativos' },
  { value: '12', label: 'Estados alcançados' },
]
</script>

<template>
  <section class="relative overflow-hidden py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24" aria-label="Como o Conecta te ajuda">
    <div class="absolute inset-0 bg-gradient-to-b from-[#f8fafc] to-white"></div>
    <div class="absolute w-[380px] h-[380px] rounded-full blur-[80px] pointer-events-none bg-[radial-gradient(circle,rgba(7,146,114,0.08),transparent_70%)] top-[-60px] left-[-60px]"></div>
    <div class="absolute w-[420px] h-[420px] rounded-full blur-[80px] pointer-events-none bg-[radial-gradient(circle,rgba(36,100,232,0.07),transparent_70%)] bottom-[-80px] right-[-60px]"></div>

    <div class="relative max-w-7xl mx-auto">
      <div class="text-center mb-14" data-aos="fade-up">
        <div class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#079272]/20 bg-[#079272]/10 text-[0.72rem] font-bold tracking-wider uppercase text-[#079272] mb-3.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          Funcionalidades
        </div>
        <h2 class="text-[clamp(1.7rem,3vw,2.5rem)] font-extrabold text-[#0f172a] tracking-[-0.03em] mb-2.5">
          Como o <span class="bg-gradient-to-r from-[#079272] to-[#2464E8] bg-clip-text text-transparent">Conecta</span> te ajuda
        </h2>
        <p class="text-base text-[#64748b]">Duas formas principais de transformar sua jornada educacional</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-13">

        <!-- Card 01 — Oportunidades -->
        <div data-aos="fade-up" class="bg-white border border-[#e2e8f0] rounded-2xl p-8 flex flex-col gap-5 shadow-[0_4px_24px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.09)] hover:-translate-y-1 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-gradient-to-r before:from-[#079272] before:to-[#2464E8] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300">
          <div class="flex items-center justify-between">
            <div class="text-[2.5rem] font-black text-[#f1f5f9] tracking-[-0.04em] leading-none">01</div>
            <div class="w-13 h-13 rounded-[14px] flex items-center justify-center bg-[#079272]/10 text-[#079272]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
            </div>
          </div>
          <h3 class="text-xl font-extrabold text-[#0f172a] leading-tight tracking-[-0.02em]">
            <span class="bg-gradient-to-r from-[#079272] to-[#0DA790] bg-clip-text text-transparent">Oportunidades</span><br>que você não pode perder
          </h3>
          <p class="text-[0.88rem] text-[#64748b] leading-relaxed">Já se sentiu perdido por não encontrar boas oportunidades? Sabemos como é difícil descobrir iniciativas e programas confiáveis em meio a tanta informação.</p>
          <ul class="flex flex-col gap-2.5 list-none p-0 m-0">
            <li v-for="f in features1" :key="f" class="flex items-start gap-2.5 text-[0.85rem] text-[#374151] leading-relaxed">
              <span class="w-[18px] h-[18px] rounded-[5px] flex-shrink-0 mt-0.5 flex items-center justify-center bg-[#079272]">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              {{ f }}
            </li>
          </ul>
          <div class="p-3.5 rounded-[14px] flex flex-col gap-2 bg-[#079272]/5 border border-[#079272]/10">
            <div v-for="(p, i) in preview1" :key="i" class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full flex-shrink-0 bg-[#079272]"></div>
              <div class="h-1.5 rounded-full bg-[#079272]/20" :style="`width:${p}%`"></div>
            </div>
          </div>
          <NuxtLink to="/feed" class="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[0.88rem] font-bold no-underline self-start bg-gradient-to-r from-[#079272] to-[#0DA790] text-white shadow-[0_4px_16px_rgba(7,146,114,0.25)] hover:shadow-[0_6px_24px_rgba(7,146,114,0.4)] hover:-translate-y-0.5 transition-all" aria-label="Explorar feed de oportunidades">
            Explorar Feed
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </NuxtLink>
        </div>

        <!-- Card 02 — Conexões -->
        <div data-aos="fade-up" data-aos-delay="100" class="bg-white border border-[#e2e8f0] rounded-2xl p-8 flex flex-col gap-5 shadow-[0_4px_24px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.09)] hover:-translate-y-1 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-gradient-to-r before:from-[#079272] before:to-[#2464E8] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300">
          <div class="flex items-center justify-between">
            <div class="text-[2.5rem] font-black text-[#f1f5f9] tracking-[-0.04em] leading-none">02</div>
            <div class="w-13 h-13 rounded-[14px] flex items-center justify-center bg-[#2464E8]/10 text-[#2464E8]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </div>
          </div>
          <h3 class="text-xl font-extrabold text-[#0f172a] leading-tight tracking-[-0.02em]">
            <span class="bg-gradient-to-r from-[#2464E8] to-[#1a52c8] bg-clip-text text-transparent">Conexões</span><br>que realmente fazem a diferença
          </h3>
          <p class="text-[0.88rem] text-[#64748b] leading-relaxed">Já sentiu que não conhecia pessoas com interesses parecidos com os seus? Muitos estudantes têm objetivos semelhantes, mas nunca se encontram.</p>
          <ul class="flex flex-col gap-2.5 list-none p-0 m-0">
            <li v-for="f in features2" :key="f" class="flex items-start gap-2.5 text-[0.85rem] text-[#374151] leading-relaxed">
              <span class="w-[18px] h-[18px] rounded-[5px] flex-shrink-0 mt-0.5 flex items-center justify-center bg-[#2464E8]">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              {{ f }}
            </li>
          </ul>
          <div class="p-3.5 rounded-[14px] flex flex-col gap-2 bg-[#2464E8]/5 border border-[#2464E8]/10">
            <div class="flex items-center gap-2">
              <div v-for="m in matches" :key="m.color" class="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[0.65rem] font-bold text-white -ml-1.5 first:ml-0" :style="`background:${m.color}`">{{ m.init }}</div>
              <div class="flex items-center gap-1 text-[0.72rem] font-semibold text-[#2464E8] ml-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2464E8" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                Match encontrado
              </div>
            </div>
          </div>
          <a href="https://wa.me/558599783928" target="_blank" rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[0.88rem] font-bold no-underline self-start bg-transparent text-[#2464E8] border-2 border-[#2464E8]/30 hover:bg-[#2464E8]/10 hover:border-[#2464E8] transition-all"
            aria-label="Conectar com outros estudantes">
            Conectar Agora
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
      </div>

      <!-- Stats -->
      <div class="w-full flex flex-wrap items-stretch justify-center gap-8 mt-8" data-aos="fade-up">
        <div v-for="stat in stats" :key="stat.label" class="flex-1 min-w-[150px] max-w-[200px] flex flex-col items-center gap-1 p-5 rounded-2xl bg-white border border-[#e2e8f0] shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)]">
          <span class="text-[1.6rem] font-black tracking-[-0.03em] bg-gradient-to-r from-[#079272] to-[#2464E8] bg-clip-text text-transparent">{{ stat.value }}</span>
          <span class="text-[0.75rem] text-[#94a3b8] font-medium text-center">{{ stat.label }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
