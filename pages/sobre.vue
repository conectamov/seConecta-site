<script setup lang="ts">
useSeoMeta({
  title: 'Sobre — seConecta',
  description: 'O seConecta é um ecossistema ed-tech que conecta estudantes a oportunidades.',
})

const pillars = [
  {
    number: '01',
    title: 'Crescimento Em Rede',
    description: 'Criar a maior rede social de impacto do Brasil, conectando estudantes, mentores e oportunidades em uma plataforma simples com foco em crescimento coletivo.',
  },
  {
    number: '02',
    title: 'Somos Tech',
    description: 'Acreditamos que a tecnologia é a principal ferramenta para quebrar ciclos de desigualdade social.',
  },
  {
    number: '03',
    title: 'Inspirar Por Referência',
    description: 'Inspirar estudantes através de pessoas movidas por propósito e dispostas a transformar suas comunidades com ações concretas.',
  },
]

// Intersection observer directive for animations
const vAnimate = {
  mounted(el: HTMLElement) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { el.classList.add('animated'); observer.unobserve(el) }
      })
    }, { threshold: 0.1 })
    observer.observe(el)
  },
}
</script>

<template>
  <main>
    <!-- Hero About -->
    <section class="relative min-h-[55vh] flex items-center justify-start overflow-hidden px-4 sm:px-6 lg:px-8" aria-labelledby="hero-heading">
      <div class="relative w-full max-w-7xl mx-auto">
        <div class="flex flex-col gap-12 lg:gap-20 items-center">
          <div class="w-full text-center">
            <h1 id="hero-heading" class="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight" data-aos="fade-up">
              Sobre
              <span class="bg-gradient-to-r from-[#079272] via-[#0DA790] to-[#2464E8] bg-clip-text text-transparent animate-gradient bg-300">nós</span>
            </h1>
          </div>
          <p class="text-lg sm:text-xl lg:text-2xl text-gray-700 leading-relaxed lg:leading-relaxed w-full text-center" data-aos="fade-up" data-aos-delay="100">
            O <span class="font-semibold text-[#079272]">seConecta</span> é um ecossistema ed-tech que conecta estudantes a oportunidades e mobiliza uma rede de líderes estudantis que geram impacto.
          </p>
        </div>
      </div>
    </section>

    <!-- ourChallengesAbout -->
    <section class="relative min-h-screen overflow-hidden bg-gradient-to-b from-gray-50 to-white py-16 px-4 sm:px-6 lg:py-24 lg:px-8" aria-label="Nossa plataforma para estudantes e líderes">
      <div class="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-[#079272]/5 to-[#2464E8]/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-[#2464E8]/5 to-[#079272]/5 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl pointer-events-none"></div>

      <div class="relative max-w-7xl mx-auto">

        <!-- TÍTULO PRINCIPAL -->
        <div v-animate class="text-center mb-16 lg:mb-20">
          <h2 class="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Conectando
            <span class="bg-gradient-to-r from-[#079272] to-[#2464E8] bg-clip-text text-transparent">estudantes</span>
            a
            <span class="bg-gradient-to-r from-[#2464E8] to-[#079272] bg-clip-text text-transparent">oportunidades</span>
          </h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Usamos tecnologia para criar uma rede de mídia escalável que torna oportunidades acessíveis a milhões de jovens brasileiros.
          </p>
        </div>

        <!-- SEÇÃO 1: 2 CARDS -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-20 lg:mb-32">
          <div v-animate="'fade-left'" class="group">
            <div class="h-full bg-white rounded-2xl p-8 lg:p-10 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden">
              <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#079272]/5 to-transparent rounded-full -translate-y-16 translate-x-16 pointer-events-none"></div>
              <div class="relative">
                <div class="flex items-center gap-4 mb-8">
                  <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-[#079272]/10 to-[#079272]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg class="w-7 h-7 text-[#079272]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
                  </div>
                  <div>
                    <h3 class="text-2xl lg:text-3xl font-bold text-gray-900">Feed & Mídia</h3>
                    <div class="h-1 w-20 bg-gradient-to-r from-[#079272] to-[#079272]/50 rounded-full mt-2"></div>
                  </div>
                </div>
                <p class="text-gray-700 text-lg leading-relaxed">Queremos inspirar o maior número de estudantes de qualquer origem. Por isso estamos criando uma rede social que divulga ativamente oportunidades e eventos através de um feed personalizado e redes sociais feito por nossos embaixadores.</p>
              </div>
            </div>
          </div>

          <div v-animate="'fade-right'" class="group">
            <div class="h-full bg-white rounded-2xl p-8 lg:p-10 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden">
              <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#2464E8]/5 to-transparent rounded-full -translate-y-16 translate-x-16 pointer-events-none"></div>
              <div class="relative">
                <div class="flex items-center gap-4 mb-8">
                  <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2464E8]/10 to-[#2464E8]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg class="w-7 h-7 text-[#2464E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                  </div>
                  <div>
                    <h3 class="text-2xl lg:text-3xl font-bold text-gray-900">Nexo</h3>
                    <div class="h-1 w-20 bg-gradient-to-r from-[#2464E8] to-[#2464E8]/50 rounded-full mt-2"></div>
                  </div>
                </div>
                <p class="text-gray-700 text-lg leading-relaxed mb-6"><strong>Chatbot inteligente</strong> que envia oportunidades personalizadas diretamente no seu WhatsApp. Além disso, o Nexo conecta você a outros estudantes com perfis semelhantes, criando uma rede de apoio e colaboração.</p>
                <div class="flex items-center text-[#2464E8] font-medium">
                  <span>Conheça o Nexo</span>
                  <svg class="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SEÇÃO 2: Infraestrutura -->
        <div v-animate class="text-center mb-16 lg:mb-20">
          <h2 class="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            <span class="bg-gradient-to-r from-[#079272] to-[#2464E8] bg-clip-text text-transparent">Infraestrutura</span>
            para jovens
            <span class="bg-gradient-to-r from-[#2464E8] to-[#079272] bg-clip-text text-transparent">líderes</span>
          </h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">Fornecemos ferramentas e visibilidade para quem quer causar impacto. A tecnologia é nosso alicerce.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-20 lg:mb-32">
          <div v-animate="'fade-left'" class="group">
            <div class="h-full bg-white rounded-2xl p-8 lg:p-10 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden">
              <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#079272]/5 to-transparent rounded-full -translate-y-16 translate-x-16 pointer-events-none"></div>
              <div class="relative">
                <div class="flex items-center gap-4 mb-8">
                  <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-[#079272]/10 to-[#079272]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg class="w-7 h-7 text-[#079272]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                  </div>
                  <div>
                    <h3 class="text-2xl lg:text-3xl font-bold text-gray-900">Programa de Embaixadores</h3>
                    <div class="h-1 w-20 bg-gradient-to-r from-[#079272] to-[#079272]/50 rounded-full mt-2"></div>
                  </div>
                </div>
                <p class="text-gray-700 text-lg leading-relaxed">Nossos embaixadores são a voz da transformação. Eles criam conteúdo, pesquisam oportunidades e ganham visibilidade em nossas mídias sociais. Buscamos criar portifólio para apoiar iniciativas de nossos embaixadores!</p>
                <div class="mt-8">
                  <NuxtLink to="/embaixadores" class="inline-flex items-center text-[#079272] font-semibold group-hover:underline no-underline">
                    Seja embaixador
                    <svg class="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>

          <div v-animate="'fade-right'" class="group">
            <div class="h-full bg-white rounded-2xl p-8 lg:p-10 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden">
              <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#2464E8]/5 to-transparent rounded-full -translate-y-16 translate-x-16 pointer-events-none"></div>
              <div class="relative">
                <div class="flex items-center gap-4 mb-8">
                  <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2464E8]/10 to-[#2464E8]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg class="w-7 h-7 text-[#2464E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                  </div>
                  <div>
                    <h3 class="text-2xl lg:text-3xl font-bold text-gray-900">
                      Plataforma de Clubes
                      <span class="ml-2 text-sm font-medium text-[#2464E8] align-middle bg-[#2464E8]/10 px-3 py-1 rounded-full">em breve</span>
                    </h3>
                    <div class="h-1 w-20 bg-gradient-to-r from-[#2464E8] to-[#2464E8]/50 rounded-full mt-2"></div>
                  </div>
                </div>
                <p class="text-gray-700 text-lg leading-relaxed">Estamos desenvolvendo um sistema que permite a qualquer estudante criar e administrar clubes em sua escola de forma simples e eficaz. Tecnologia a serviço da liderança jovem: gestão de membros, divulgação de eventos e muito mais.</p>
                <div class="mt-8">
                  <span class="inline-flex items-center text-gray-500 font-medium cursor-not-allowed">Em breve!</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- PILARES -->
        <div v-animate class="mb-20 lg:mb-32">
          <div class="text-center mb-12 lg:mb-16">
            <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Nossos <span class="bg-gradient-to-r from-[#079272] to-[#2464E8] bg-clip-text text-transparent">pilares</span> fundamentais
            </h2>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto">Os princípios que guiam nossa missão de transformar vidas através da conexão e oportunidade.</p>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div v-for="(pillar, index) in pillars" :key="index" v-animate class="group" :style="{ animationDelay: `${0.4 + index * 0.1}s` }">
              <div class="h-full bg-white rounded-2xl p-8 border border-gray-200 hover:border-[#079272]/20 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden">
                <div class="absolute top-6 right-6">
                  <div class="text-6xl font-bold text-gray-100 group-hover:text-gray-200 transition-colors duration-300">{{ pillar.number }}</div>
                </div>
                <div class="relative">
                  <h3 class="text-xl font-semibold text-gray-900 mb-4 mt-16 group-hover:text-[#079272] transition-colors duration-300">{{ pillar.title }}</h3>
                  <p class="text-gray-600 leading-relaxed">{{ pillar.description }}</p>
                </div>
                <div class="h-1 w-0 group-hover:w-full bg-gradient-to-r from-[#079272] to-[#2464E8] rounded-full mt-6 transition-all duration-500"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA FINAL -->
        <div v-animate="'zoom-in-up'" class="max-w-2xl mx-auto">
          <div class="relative group">
            <div class="absolute inset-0 bg-gradient-to-r from-[#079272] to-[#2464E8] rounded-2xl blur-xl opacity-70 group-hover:opacity-90 transition-opacity duration-300 animate-gradient"></div>
            <a class="relative w-full px-8 py-6 rounded-2xl text-white font-semibold text-lg bg-gradient-to-r from-[#079272] to-[#2464E8] hover:from-[#0aab8a] hover:to-[#2a76ff] transition-all duration-300 flex items-center justify-center gap-3 focus:outline-none transform hover:-translate-y-1 shadow-xl hover:shadow-2xl no-underline"
              href="https://wa.me/558599783928?text=Olá!%20Quero%20participar%20do%20beta%20do%20Conecta" target="_blank" rel="noopener noreferrer">
              <span class="relative z-10">Teste o Nexo no WhatsApp!</span>
              <svg class="w-5 h-5 relative z-10 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </a>
          </div>
          <p class="text-center text-gray-500 mt-6">Conecte-se a jovens e organizações que querem transformar realidades</p>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
@keyframes gradient-shift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
.animate-gradient { background-size:200% 200%; animation:gradient-shift 3s ease infinite; }
.animate-gradient { background-size:300% 300%; }
.bg-300 { background-size:300% 300%; }
@keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeLeft { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
@keyframes fadeRight { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
@keyframes zoomInUp { from{opacity:0;transform:scale(0.95) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
[v-animate] { opacity: 0; }
[v-animate].animated { animation: fadeUp 0.6s ease forwards; }
</style>
