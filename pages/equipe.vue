<script setup lang="ts">
useSeoMeta({
  title: 'Equipe — seConecta',
  description: 'Conheça o time do seConecta — voluntários que acreditam no poder da ação.',
})

const stats = [
  { value: '3',  label: 'Diretores',    icon: '◈', color: '#2464E8' },
  { value: '6',  label: 'Embaixadores', icon: '◎', color: '#079272' },
  { value: '50', label: 'Beta Testers', icon: '⚡', color: '#F59E0B' },
]

const teamAdmin = [
  {
    id: 1, name: 'Otávio Pinheiro', role: 'Diretor Geral',
    description: 'Eu sou Otávio! Gosto de programação, escrita e comunicação. Comecei minha jornada de estudos no sétimo ano e descobri olimpíadas científicas através de um vídeo no YouTube. Desde então, oportunidades transformadoras têm mudado minha vida. Agora carrego a missão de usar minhas paixões para transformar a forma com que estudantes podem impactar outros estudantes usando tecnologia!',
    skills: ['Liderança', 'Produto', 'Estratégia'], colorA: '#2464E8', colorB: '#2a76ff',
  },
  {
    id: 2, name: 'Gabriel Masterson', role: 'Diretor de Tecnologia',
    description: 'Cofundador do SeConecta. Responsável pela stack tecnológica da plataforma SeConecta. Desenvolve o backend em FastAPI e o frontend em Vue 3.',
    skills: ['FastAPI', 'Vue 3', 'PostgreSQL'], colorA: '#079272', colorB: '#0DA790',
  },
  {
    id: 3, name: 'Jhenifer', role: 'Diretora de Mídia e Embaixadores',
    description: 'À frente de toda a comunicação visual e do programa de embaixadores. Conecta a identidade do SeConecta com estudantes em todo o Brasil através de design e conteúdo.',
    skills: ['Design', 'Mídias Sociais', 'Branding'], colorA: '#F59E0B', colorB: '#D97706',
  },
]

const teamEmb = [
  {
    id: 1, name: 'Marcos Vinicius', role: 'Embaixador',
    description: 'Iniciei na computação aos 13 anos, desenvolvendo jogos ao mesmo tempo que aprendia a ligar um computador. Aos 16 anos criei um game educativo reconhecido como a Melhor Solução Ambiental do Rio de Janeiro na maior competição da NASA, a Space Apps Challenge. No mesmo ano fui convidado pelo IMPA para palestrar no Festival Nacional da Matemática sobre "O Poder dos Jogos". Retornei ao projeto social que me formou, dessa vez não como aluno, mas como desenvolvedor, criando games que podem inspirar jovens, assim como uma vez fui inspirado.',
    skills: [], colorA: '#F59E0B', colorB: '#D97706',
  },
  {
    id: 2, name: 'Malu Azevedo', role: 'Embaixadora',
    description: 'Meu nome é Malu e estou no segundo ano do ensino médio, cursando o técnico integrado em eletrotécnica. Sou apaixonada por matemática, física e programação, desde programação competitiva até ciência de dados e inteligência artificial. Tenho um carinho especial por eletrônica e sistemas embarcados. Também tenho uma curiosidade enorme por linguística. Além da ciência e da tecnologia, também amo me expressar através da arte: toco violino, gosto de desenhar e pintar, ler, fazer crochê entre outros. Como embaixadora do seConecta, espero compartilhar um pouco dessa curiosidade e entusiasmo.',
    skills: [], colorA: '#F59E0B', colorB: '#D97706',
  },
  {
    id: 3, name: 'Isabela Fonseca', role: 'Embaixadora',
    description: 'Sou estudante de programação, matemática e inglês, movida pela curiosidade e pela vontade de aprender. Sempre busco desafios que me façam crescer, tanto na área acadêmica quanto pessoal. Também sou apaixonada por esportes, todos os tipos, menos futebol. Natural de Divinópolis, Minas Gerais, acredito que dedicação e esforço constroem resultados melhores que talento. Como embaixadora, quero representar esses valores e inspirar outros jovens a acreditarem no próprio potencial.',
    skills: [], colorA: '#F59E0B', colorB: '#D97706',
  },
  {
    id: 4, name: 'Luís Miguel', role: 'Embaixador',
    description: 'Nasci em Salvador, Bahia, onde entrei no Colégio Militar de Salvador e comecei minha jornada olímpica, e graças ao meu desempenho consegui uma bolsa no colégio Farias Brito em Fortaleza. Sou entusiasta de matemática e física e gostaria de ajudar a disseminar o conhecimento para outros jovens.',
    skills: [], colorA: '#F59E0B', colorB: '#D97706',
  },
  {
    id: 5, name: 'Pedro Henrique', role: 'Embaixador',
    description: 'Olá! Eu me chamo Pedro Henrique! Gosto de matemática, física, computação, ler, tocar piano e ajudar pessoas. Comecei a fazer olimpíadas desde os 10 anos e, desde então, obtive medalhas em diversas olimpíadas. Também tenho orgulho de fazer parte da Behring Academy desde 2025.',
    skills: [], colorA: '#F59E0B', colorB: '#D97706',
  },
]

const teamTech = [
  {
    id: 1, name: 'Gabriel Masterson', role: 'Dev Full-stack',
    description: 'Backend em FastAPI e frontend em Vue 3 com Tailwind CSS. Focado em interfaces rápidas e acessíveis.',
    skills: ['Python', 'Vue 3', 'Tailwind CSS'], colorA: '#079272', colorB: '#0DA790',
  },
  {
    id: 2, name: 'Otávio Pinheiro', role: 'Dev Backend',
    description: 'Backend em FastAPI de Bot de WhatsApp com algoritmos de recomendação.',
    skills: ['Python', 'FastAPI'], colorA: '#079272', colorB: '#0DA790',
  },
]

</script>

<template>
  <div class="min-h-screen">

    <!-- Hero -->
    <section class="relative overflow-hidden px-6 sm:px-10 md:px-16 lg:px-24 pt-20 pb-12">
      <div class="relative z-10 max-w-5xl mx-auto">

        <div class="flex items-center gap-2.5 mb-6" data-aos="fade-up">
          <span class="relative w-2 h-2 flex-shrink-0">
            <span class="absolute inset-0 rounded-full bg-[#079272] animate-ping opacity-60"></span>
            <span class="relative w-2 h-2 rounded-full bg-[#079272] block"></span>
          </span>
          <span class="text-[0.68rem] font-semibold tracking-[0.22em] uppercase text-black">
            SeConecta · Nossa equipe
          </span>
        </div>

        <h1 class="text-[clamp(2.4rem,5.5vw,4.2rem)] font-extrabold text-black leading-[1.05] tracking-[-0.04em] mb-5"
          data-aos="fade-up" data-aos-delay="80">
          Conheça quem faz a<br>
          <em class="not-italic bg-gradient-to-r from-[#079272] to-[#2464E8] bg-clip-text text-transparent">
            diferença!
          </em>
        </h1>

        <p class="text-[0.97rem] font-light text-black max-w-[530px] leading-relaxed mb-10"
          data-aos="fade-up" data-aos-delay="150">
          Nascemos do sonho de usar tecnologia para causar impacto na vida de estudantes. Nossa equipe é formada por voluntários que acreditam no poder da ação.
        </p>

        <div class="flex flex-wrap gap-6 items-center" data-aos="fade-up" data-aos-delay="220">
          <div v-for="stat in stats" :key="stat.label" class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
              :style="{ background: stat.color + '1a', border: `1px solid ${stat.color}35`, color: stat.color }">
              {{ stat.icon }}
            </div>
            <div>
              <div class="text-[1.1rem] font-bold text-black leading-none">{{ stat.value }}</div>
              <div class="text-[0.62rem] text-black mt-0.5 uppercase tracking-wider font-medium">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="absolute bottom-0 left-0 right-0 h-px"
        style="background: linear-gradient(90deg, transparent 0%, #079272 40%, #2464E8 60%, transparent 100%)">
      </div>
    </section>

    <!-- Diretoria -->
    <section class="px-6 sm:px-10 md:px-16 lg:px-24 py-12 bg-[#fafaf9]">
      <div class="max-w-5xl mx-auto">
        <div class="flex items-center gap-3 mb-8" data-aos="fade-up">
          <div class="w-7 h-7 rounded-lg bg-[#2464E8]/10 border border-[#2464E8]/20 flex items-center justify-center">
            <svg class="w-3.5 h-3.5 text-[#2464E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div>
            <h2 class="text-[1rem] font-bold text-[#111] tracking-[-0.02em]">Diretoria</h2>
            <p class="text-[0.7rem] text-[#aaa]">Quem lidera e define a missão</p>
          </div>
          <div class="hidden md:block ml-auto h-px w-32 bg-gradient-to-r from-[#2464E8]/25 to-transparent"></div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <TeamMember
            v-for="(member, i) in teamAdmin"
            :key="member.id"
            :member="member"
            :data-aos-delay="`${i * 80}`"
          />
        </div>
      </div>
    </section>

    <!-- Embaixadores -->
    <section class="px-6 sm:px-10 md:px-16 lg:px-24 py-12 bg-[#fafaf9]">
      <div class="max-w-5xl mx-auto">
        <div class="flex items-center gap-3 mb-8" data-aos="fade-up">
          <div class="w-7 h-7 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center">
            <svg class="w-3.5 h-3.5 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
            </svg>
          </div>
          <div>
            <h2 class="text-[1rem] font-bold text-[#111] tracking-[-0.02em]">Embaixadores</h2>
            <p class="text-[0.7rem] text-[#aaa]">Vozes da transformação no Brasil</p>
          </div>
          <div class="hidden md:block ml-auto h-px w-32 bg-gradient-to-r from-[#F59E0B]/25 to-transparent"></div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <TeamMember
            v-for="(member, i) in teamEmb"
            :key="member.id"
            :member="member"
            :data-aos-delay="`${i * 80}`"
          />
        </div>
      </div>
    </section>

    <!-- Tecnologia -->
    <section class="px-6 sm:px-10 md:px-16 lg:px-24 py-12 bg-[#fafaf9]">
      <div class="max-w-5xl mx-auto">
        <div class="flex items-center gap-3 mb-8" data-aos="fade-up">
          <div class="w-7 h-7 rounded-lg bg-[#079272]/10 border border-[#079272]/20 flex items-center justify-center">
            <svg class="w-3.5 h-3.5 text-[#079272]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
            </svg>
          </div>
          <div>
            <h2 class="text-[1rem] font-bold text-[#111] tracking-[-0.02em]">Tecnologia</h2>
            <p class="text-[0.7rem] text-[#aaa]">Quem constrói e mantém a plataforma</p>
          </div>
          <div class="hidden md:block ml-auto h-px w-32 bg-gradient-to-r from-[#079272]/25 to-transparent"></div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TeamMember
            v-for="(member, i) in teamTech"
            :key="member.id"
            :member="member"
            :data-aos-delay="`${i * 80}`"
          />
        </div>
      </div>
    </section>


  </div>
</template>
