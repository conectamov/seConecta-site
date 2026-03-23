<script setup lang="ts">
useSeoMeta({
  title: 'Embaixadores — seConecta',
  description: 'Rede de estudantes movidos por fazer a diferença e inspirar outros estudantes.',
})

const problems = [
  { icon: 'fas fa-star', color: '#FF6B35', title: 'Falta de Reconhecimento', description: 'Não tem portfólio claro do seu impacto nem suporte para conduzir suas iniciativas.', impact: '78%' },
  { icon: 'fas fa-compass', color: '#079272', title: 'Sem Orientação', description: 'Apesar de vários estudantes terem ideias promissoras, a maioria não possui orientação e mentoria para conduzir suas iniciativas.', impact: '65%' },
  { icon: 'fas fa-medal', color: '#2464E8', title: 'Nenhuma Estrutura', description: 'Algumas ideias não evoluem por falta de infraestrutura. Oferecemos ferramentas de IA, como o Nexo chatbot, e suporte para criação de clubes em escolas.', impact: '82%' },
]

const identifications = [
  { icon: 'fas fa-lightbulb', color: '#FF6B35', title: 'Já tentou criar algo', description: 'Mas sentiu falta de direção clara, mentoria especializada e um caminho estruturado para transformar sua ideia em realidade.', percentage: '92%' },
  { icon: 'fas fa-handshake', color: '#079272', title: 'Se importa em ajudar', description: 'Tem genuíno interesse em apoiar outros estudantes e construir uma comunidade mais forte e colaborativa.', percentage: '87%' },
  { icon: 'fas fa-briefcase', color: '#2464E8', title: 'Quer construir portfólio', description: 'Deseja desenvolver projetos significativos que façam sentido para sua trajetória profissional e pessoal.', percentage: '78%' },
]

const actions = [
  { icon: 'fas fa-newspaper', color: '#FF6B35', title: 'Feed de Oportunidades', description: 'Fique por dentro das novidades! Oportunidades com redações escritas por nossos embaixadores diariamente.', cta: 'Explorar feed', link: '/feed' },
  { icon: 'fas fa-pen-fancy', color: '#079272', title: 'Nexo (ChatBot)', description: 'Teste o Nexo no seu WhatsApp: encontre estudantes com interesses em comum à você e receba notícias diretamente no seu WhatsApp!', cta: 'Testar no WhatsApp', link: 'https://wa.me/558599783928' },
  { icon: 'fas fa-calendar-alt', color: '#2464E8', title: 'Próximos Eventos', description: 'Participe de workshops, webinars e encontros promovidos pela comunidade seConecta.', cta: 'Ver eventos', link: '/eventos' },
]
</script>

<template>
  <main>
    <!-- heroEmbaixador -->
    <section class="relative min-h-[50vh] flex items-center justify-center px-4 md:px-8 lg:px-20 overflow-hidden" aria-labelledby="hero-heading">
      <div class="absolute inset-0 overflow-hidden -z-10">
        <div class="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-gradient-to-r from-[#079272]/20 to-[#2464E8]/20 blur-3xl" style="animation:float 15s ease-in-out infinite"></div>
        <div class="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-gradient-to-r from-[#2464E8]/20 to-[#079272]/20 blur-3xl" style="animation:float 18s ease-in-out infinite reverse"></div>
        <div class="absolute inset-0 opacity-5" style="background-image:linear-gradient(to right,#079272 1px,transparent 1px),linear-gradient(to bottom,#2464e8 1px,transparent 1px);background-size:60px 60px;"></div>
      </div>
      <div class="relative w-full max-w-6xl flex flex-col items-center">
        <div class="text-center max-w-4xl">
          <h1 id="hero-heading" class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight" style="animation:fadeInUp 0.8s ease-out 0.3s both">
            <span class="gradient-text inline-block mt-2"> Embaixadores </span>
            <span class="gradient-text inline-block ml-2 relative">
              seConecta
              <span class="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-[#079272] to-[#2464E8] rounded-full opacity-50"></span>
            </span>
          </h1>
          <p class="mt-4 text-lg sm:text-xl lg:text-2xl text-gray-700 leading-relaxed max-w-2xl mx-auto" style="animation:fadeInUp 0.8s ease-out 0.4s both">
            Rede de estudantes movidos por fazer a diferença e inspirar outros estudantes.
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-4 mt-8" style="animation:fadeInUp 0.8s ease-out 0.6s both">
          <a class="group px-8 py-4 rounded-lg text-white font-semibold bg-gradient-to-r from-[#079272] to-[#2464E8] cursor-not-allowed opacity-70 transition-all duration-200 flex items-center justify-center gap-3 focus:outline-none shadow-[0_4px_20px_rgba(7,146,114,0.3)] min-w-[200px] no-underline"
            aria-label="Candidate-se para ser embaixador">
            <span>Inscrições fechadas</span>
          </a>
          <NuxtLink to="/sobre" class="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-lg font-medium border-2 border-[#079272] text-[#079272] hover:bg-[#079272] hover:text-white transition-all duration-200 flex items-center justify-center no-underline"
            aria-label="Explorar mais sobre o Conecta">
            Saiba mais
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- problemEmbaixador -->
    <section class="relative min-h-screen flex flex-col items-center justify-center px-4 md:px-8 lg:px-20 overflow-hidden">
      <div class="w-full max-w-6xl mx-auto">
        <div class="text-center mb-16" style="animation:fadeInUp 0.8s ease-out 0.2s both">
          <h2 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Muitos estudantes querem
            <span class="block">
              <span class="gradient-text">ajudar, criar projetos</span> ou
            </span>
            <span class="gradient-text">organizar iniciativas.</span>
          </h2>
          <div class="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm mt-8" style="animation:fadeInUp 0.8s ease-out 0.4s both">
            <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <h3 class="text-xl sm:text-2xl font-semibold text-gray-800">Mas tudo acaba morrendo:</h3>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20" style="animation:fadeInUp 0.8s ease-out 0.6s both">
          <div v-for="(problem, index) in problems" :key="index" class="group relative"
            :style="{ animation: `fadeInUp 0.8s ease-out ${0.7 + index * 0.1}s both` }">
            <div class="relative p-8 rounded-2xl bg-white border border-gray-200 hover:border-[#079272]/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 h-full">
              <div class="absolute -top-4 -left-4 w-12 h-12 rounded-xl bg-gradient-to-r from-[#079272] to-[#2464E8] flex items-center justify-center shadow-lg">
                <span class="text-white font-bold text-lg">{{ index + 1 }}</span>
              </div>
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#079272]/10 to-[#2464E8]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <i :class="problem.icon" class="text-2xl" :style="`color: ${problem.color}`"></i>
              </div>
              <h3 class="text-2xl font-bold text-gray-900 mb-4">{{ problem.title }}</h3>
              <p class="text-gray-700 leading-relaxed mb-6">{{ problem.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- praVoceEmbaixador -->
    <section class="relative min-h-screen flex flex-col items-center justify-center px-4 md:px-8 lg:px-20 overflow-hidden">
      <div class="w-full max-w-6xl mx-auto text-center">
        <h2 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-12" style="animation:fadeInUp 0.8s ease-out 0.3s both">
          Esse papel faz sentido
          <span class="block">se você se <span class="gradient-text">identifica</span> com:</span>
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20" style="animation:fadeInUp 0.8s ease-out 0.4s both">
          <div v-for="(identification, index) in identifications" :key="index" class="group"
            :style="{ animation: `fadeInUp 0.8s ease-out ${0.5 + index * 0.1}s both` }">
            <div class="relative p-8 rounded-2xl bg-white border-2 border-gray-200 hover:border-[#079272] transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 h-full">
              <div class="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                <div class="absolute -top-8 -right-8 w-16 h-16 rotate-45 bg-gradient-to-r from-[#079272] to-[#2464E8] opacity-10"></div>
              </div>
              <div class="absolute -top-4 -left-4 w-12 h-12 rounded-xl bg-gradient-to-r from-[#079272] to-[#2464E8] flex items-center justify-center shadow-lg">
                <span class="text-white font-bold">{{ index + 1 }}</span>
              </div>
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#079272]/10 to-[#2464E8]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto">
                <i :class="identification.icon" class="text-2xl" :style="`color: ${identification.color}`"></i>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-4">{{ identification.title }}</h3>
              <p class="text-gray-700 leading-relaxed">{{ identification.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- closedSubscriptionsCTA -->
    <section class="relative min-h-[60vh] flex items-center justify-center px-4 md:px-8 lg:px-20 overflow-hidden" aria-labelledby="closed-heading">
      <div class="absolute inset-0 overflow-hidden -z-10">
        <div class="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-gradient-to-r from-[#079272]/20 to-[#2464E8]/20 blur-3xl" style="animation:float 15s ease-in-out infinite"></div>
        <div class="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-gradient-to-r from-[#2464E8]/20 to-[#079272]/20 blur-3xl" style="animation:float 18s ease-in-out infinite reverse"></div>
        <div class="absolute inset-0 opacity-5" style="background-image:linear-gradient(to right,#079272 1px,transparent 1px),linear-gradient(to bottom,#2464e8 1px,transparent 1px);background-size:60px 60px;"></div>
      </div>

      <div class="relative w-full max-w-5xl mx-auto">
        <div class="text-center mb-12" style="animation:fadeInUp 0.8s ease-out 0.2s both">
          <div class="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm mb-6">
            <div class="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
            <span class="text-sm font-medium text-gray-700 uppercase tracking-wider">Inscrições encerradas</span>
          </div>
          <h2 id="closed-heading" class="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            O programa de embaixadores
            <span class="block gradient-text">está em pausa</span>
          </h2>
          <p class="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
            Estamos preparando a próxima turma com ainda mais recursos e oportunidades. Enquanto isso, você pode explorar o que nossa comunidade já construiu.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12" style="animation:fadeInUp 0.8s ease-out 0.4s both">
          <div v-for="(action, index) in actions" :key="index" class="group"
            :style="{ animation: `fadeInUp 0.8s ease-out ${0.5 + index * 0.1}s both` }">
            <div class="relative p-8 rounded-2xl bg-white border-2 border-gray-200 hover:border-[#079272] transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 h-full flex flex-col">
              <div class="absolute -top-4 -left-4 w-12 h-12 rounded-xl bg-gradient-to-r from-[#079272] to-[#2464E8] flex items-center justify-center shadow-lg">
                <span class="text-white font-bold">{{ index + 1 }}</span>
              </div>
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#079272]/10 to-[#2464E8]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto">
                <i :class="action.icon" class="text-2xl" :style="{ color: action.color }"></i>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-3">{{ action.title }}</h3>
              <p class="text-gray-600 mb-6 flex-grow">{{ action.description }}</p>
              <a :href="action.link" class="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg border-2 border-[#079272] text-[#079272] hover:bg-[#079272] hover:text-white transition-all duration-200 font-medium text-sm no-underline group" :aria-label="action.cta">
                <span>{{ action.cta }}</span>
                <i class="fas fa-arrow-right text-xs transition-transform duration-200 group-hover:translate-x-1"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
@keyframes fadeInUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
@keyframes float { 0%,100%{transform:translateY(0px) translateX(0px)} 33%{transform:translateY(-20px) translateX(20px)} 66%{transform:translateY(20px) translateX(-20px)} }
@keyframes gradientShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
.gradient-text {
  background: linear-gradient(135deg,#079272 0%,#0bb592 25%,#2464e8 75%,#4d84ff 100%);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: gradientShift 4s ease infinite;
}
</style>
