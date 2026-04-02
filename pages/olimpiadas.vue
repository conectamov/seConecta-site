<script setup>
import { ref, computed } from 'vue'

const olimpiads = ref([
  {
    name: 'Olimpíada Brasileira de Informática',
    description: 'A maior competição de programação para estudantes do ensino fundamental e médio do Brasil. Estimula o raciocínio lógico e o interesse pela ciência da computação com provas em múltiplas fases.',
    area: 'Tecnologia',
    organizer: 'UNICAMP',
    start_date: '2025-06-01',
    end_date: '2025-08-31',
    location: 'Brasil',
    website: 'https://www.obi.org.br/',
    modalities: ['Presencial', 'Online'],
    categories: ['Iniciante', 'Intermediário', 'Avançado'],
    status: 'Inscrições abertas',
    taxes: 'Gratuito',
    prizes: 'Medalhas de ouro, prata e bronze. Bolsas de estudo em universidades parceiras e convite para o IOI.',
    target_audience: 'Estudantes do Ensino Fundamental e Médio',
    requirements: 'Matrícula em escola pública ou privada. Sem pré-requisito de programação para fase iniciante.',
    banner_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80',
    tags: ['tecnologia', 'programação', 'nacional'],
    difficulty_level: 'Intermediário',
    estimated_duration: '3 meses',
    participants_count: 130000,
    rating: 4.8,
    popularity_score: 97,
    application_process: 'Inscrição direta pelo site da OBI. O professor pode inscrever até 10 alunos por escola. Após inscrição, aguardar confirmação por e-mail.',
    resources: [
      { label: 'Apostila de Algoritmos OBI', url: 'https://www.obi.org.br/recursos/' },
      { label: 'Plataforma de treino Neps Academy', url: 'https://neps.academy/' },
    ],
    past_exams_url: 'https://www.obi.org.br/provas-anteriores/',
    certificate: true,
    language: 'Português',
    international: false,
    mentorship_available: false,
    team_allowed: false,
    next_edition_date: '2026-06-01',
    highlighted: true,
    deadline_countdown: 18,
  },
  {
    name: 'Olimpíada Internacional de Matemática',
    description: 'A mais prestigiosa competição de matemática do mundo para estudantes do ensino médio, reunindo os maiores talentos de mais de 100 países em provas de altíssimo nível.',
    area: 'Matemática',
    organizer: 'IMO Foundation',
    start_date: '2025-07-10',
    end_date: '2025-07-22',
    location: 'Internacional',
    website: 'https://www.imo-official.org/',
    modalities: ['Presencial'],
    categories: ['Avançado', 'Expert'],
    status: 'Em breve',
    taxes: 'Gratuito',
    prizes: 'Medalhas com reconhecimento internacional e acesso direto a universidades de elite como MIT, Cambridge e ETH Zurich.',
    target_audience: 'Representantes nacionais selecionados pela OBMEP (até 20 anos)',
    requirements: 'Seleção via OBMEP. Apenas os 6 melhores colocados nacionais representam o Brasil.',
    banner_url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&q=80',
    tags: ['matemática', 'internacional'],
    difficulty_level: 'Expert',
    estimated_duration: '2 semanas intensivas',
    participants_count: 600,
    rating: 5.0,
    popularity_score: 99,
    application_process: 'Não há inscrição direta. Participação via seleção da OBMEP. O Brasil envia delegação de 6 estudantes.',
    resources: [
      { label: 'Problemas IMO com soluções', url: 'https://artofproblemsolving.com/wiki/index.php/IMO_Problems_and_Solutions' },
    ],
    past_exams_url: 'https://www.imo-official.org/problems.aspx',
    certificate: true,
    language: 'Inglês',
    international: true,
    mentorship_available: false,
    team_allowed: false,
    next_edition_date: '2026-07-01',
    highlighted: true,
    deadline_countdown: null,
  },
  {
    name: 'Olimpíada Brasileira de Astronomia',
    description: 'Competição nacional que desperta o interesse dos jovens pela astronomia, astrofísica e ciências do espaço. Inclui observação astronômica e resolução de problemas teóricos.',
    area: 'Ciências',
    organizer: 'Sociedade Astronômica Brasileira',
    start_date: '2025-09-01',
    end_date: '2025-10-15',
    location: 'Brasil',
    website: 'https://www.oba.org.br/',
    modalities: ['Presencial'],
    categories: ['Iniciante', 'Intermediário'],
    status: 'Em breve',
    taxes: 'Gratuito',
    prizes: 'Medalhas, certificados e visitas a observatórios nacionais. Melhores colocados participam da Olimpíada Iberoamericana.',
    target_audience: 'Estudantes do 3º ano do Fundamental ao 3º ano do Médio',
    requirements: 'Inscrição realizada pelo professor responsável da escola.',
    banner_url: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=600&q=80',
    tags: ['ciências', 'internacional'],
    difficulty_level: 'Intermediário',
    estimated_duration: '6 semanas',
    participants_count: 480000,
    rating: 4.5,
    popularity_score: 85,
    application_process: 'Inscrição pelo professor via sistema INEP. Escola é o ponto de aplicação da prova.',
    resources: [
      { label: 'Guia do Estudante OBA', url: 'https://www.oba.org.br/guia' },
    ],
    past_exams_url: 'https://www.oba.org.br/provas-anteriores',
    certificate: true,
    language: 'Português',
    international: false,
    mentorship_available: false,
    team_allowed: false,
    next_edition_date: '2026-09-01',
    highlighted: false,
    deadline_countdown: null,
  },
  {
    name: 'Olimpíada Nacional de Química',
    description: 'Competição voltada para despertar o interesse pela Química em estudantes brasileiros, com problemas teóricos e experimentais que simulam a pesquisa científica real.',
    area: 'Química',
    organizer: 'Sociedade Brasileira de Química',
    start_date: '2025-06-01',
    end_date: '2025-07-20',
    location: 'Brasil',
    website: 'https://www.sbq.org.br/',
    modalities: ['Presencial', 'Online'],
    categories: ['Iniciante', 'Avançado'],
    status: 'Inscrições abertas',
    taxes: 'Gratuito',
    prizes: 'Medalhas, troféus e bolsas de iniciação científica em laboratórios universitários.',
    target_audience: 'Estudantes do Ensino Médio',
    requirements: 'Nenhum pré-requisito além de estar matriculado no Ensino Médio.',
    banner_url: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=600&q=80',
    tags: ['ciências', 'nacional'],
    difficulty_level: 'Intermediário',
    estimated_duration: '2 meses',
    participants_count: 65000,
    rating: 4.3,
    popularity_score: 72,
    application_process: 'Inscrição individual pelo site da SBQ. Confirmação por e-mail em até 5 dias úteis.',
    resources: [],
    past_exams_url: 'https://www.sbq.org.br/olimpiada/provas',
    certificate: true,
    language: 'Português',
    international: false,
    mentorship_available: false,
    team_allowed: false,
    next_edition_date: '2026-06-01',
    highlighted: false,
    deadline_countdown: 12,
  },
  {
    name: 'Olimpíada de Língua Portuguesa',
    description: 'Desafia estudantes a produzirem textos criativos e reflexivos, valorizando a riqueza e diversidade da língua portuguesa em diferentes gêneros textuais.',
    area: 'Linguagens',
    organizer: 'Ministério da Educação',
    start_date: '2025-10-01',
    end_date: '2025-11-30',
    location: 'Brasil',
    website: 'https://www.escrevendo.cenpec.org.br/',
    modalities: ['Presencial'],
    categories: ['Iniciante', 'Intermediário', 'Avançado'],
    status: 'Em breve',
    taxes: 'Gratuito',
    prizes: 'Publicação dos melhores textos em coletânea nacional, viagens culturais e certificados de excelência.',
    target_audience: 'Estudantes do 5º ano do Fundamental ao 3º ano do Médio (escolas públicas)',
    requirements: 'Participação obrigatória via escola pública. Inscrição feita pela coordenação pedagógica.',
    banner_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&q=80',
    tags: ['linguagens', 'nacional'],
    difficulty_level: 'Fácil',
    estimated_duration: '2 meses',
    participants_count: 9200000,
    rating: 4.1,
    popularity_score: 90,
    application_process: 'Escola pública se cadastra no portal do MEC. Coordenador inscreve turmas participantes.',
    resources: [
      { label: 'Guia de gêneros textuais', url: 'https://www.escrevendo.cenpec.org.br/recursos' },
    ],
    past_exams_url: null,
    certificate: true,
    language: 'Português',
    international: false,
    mentorship_available: false,
    team_allowed: false,
    next_edition_date: '2027-10-01',
    highlighted: false,
    deadline_countdown: null,
  },
  {
    name: 'Olimpíada Brasileira de Física',
    description: 'Competição que incentiva o estudo da Física, estimulando o raciocínio lógico e a criatividade na resolução de problemas experimentais e teóricos de nível universitário.',
    area: 'Física',
    organizer: 'Sociedade Brasileira de Física',
    start_date: '2025-05-15',
    end_date: '2025-06-30',
    location: 'Brasil',
    website: 'https://www.sbfisica.org.br/',
    modalities: ['Presencial', 'Online'],
    categories: ['Intermediário', 'Avançado'],
    status: 'Encerrada',
    taxes: 'Gratuito',
    prizes: 'Medalhas, troféus e participação no IPhO (Olimpíada Internacional de Física).',
    target_audience: 'Estudantes do Ensino Médio (máx. 20 anos)',
    requirements: 'Inscrição pela escola. Alunos devem ter no máximo 20 anos.',
    banner_url: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&q=80',
    tags: ['ciências', 'internacional'],
    difficulty_level: 'Difícil',
    estimated_duration: '6 semanas',
    participants_count: 120000,
    rating: 4.6,
    popularity_score: 82,
    application_process: 'Inscrição pelo site da SBF. Professores inscrevem turmas inteiras.',
    resources: [
      { label: 'Material de estudo OBF', url: 'https://www.sbfisica.org.br/obf/recursos' },
    ],
    past_exams_url: 'https://www.sbfisica.org.br/obf/provas',
    certificate: true,
    language: 'Português',
    international: false,
    mentorship_available: true,
    team_allowed: false,
    next_edition_date: '2026-05-15',
    highlighted: false,
    deadline_countdown: null,
  },
  {
    name: 'Olimpíada Brasileira de Matemática das Escolas Públicas',
    description: 'Maior olimpíada de matemática do Brasil, com mais de 18 milhões de participantes. Identifica e valoriza talentos em matemática em escolas públicas de todo o país.',
    area: 'Matemática',
    organizer: 'IMPA / MEC',
    start_date: '2025-07-01',
    end_date: '2025-09-30',
    location: 'Brasil',
    website: 'https://www.obmep.org.br/',
    modalities: ['Presencial'],
    categories: ['Nível 1', 'Nível 2', 'Nível 3'],
    status: 'Inscrições abertas',
    taxes: 'Gratuito',
    prizes: 'Medalhas, bolsas de iniciação científica pelo CNPq e acesso ao programa PROFMAT.',
    target_audience: 'Estudantes de escolas públicas do 6º ano do Fundamental ao 3º ano do Médio',
    requirements: 'Estar matriculado em escola pública municipal, estadual ou federal.',
    banner_url: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&q=80',
    tags: ['matemática', 'nacional'],
    difficulty_level: 'Intermediário',
    estimated_duration: '3 meses',
    participants_count: 18500000,
    rating: 4.7,
    popularity_score: 98,
    application_process: 'Inscrição realizada pela própria escola no portal OBMEP. Participação automática para alunos da escola inscrita.',
    resources: [
      { label: 'Portal de preparação OBMEP', url: 'https://portaldaobmep.impa.br/' },
      { label: 'Video aulas gratuitas', url: 'https://www.obmep.org.br/programas.htm' },
    ],
    past_exams_url: 'https://www.obmep.org.br/provas.htm',
    certificate: true,
    language: 'Português',
    international: false,
    mentorship_available: true,
    team_allowed: false,
    next_edition_date: '2026-07-01',
    highlighted: true,
    deadline_countdown: 5,
  },
  {
    name: 'International Olympiad in Informatics',
    description: 'A olimpíada internacional de ciência da computação para estudantes do ensino médio. Os participantes resolvem algoritmos complexos e estruturas de dados de nível avançado.',
    area: 'Tecnologia',
    organizer: 'IOI Foundation',
    start_date: '2025-08-10',
    end_date: '2025-08-17',
    location: 'Internacional',
    website: 'https://ioinformatics.org/',
    modalities: ['Presencial'],
    categories: ['Expert'],
    status: 'Em breve',
    taxes: 'Gratuito',
    prizes: 'Medalhas de ouro, prata e bronze. Reconhecimento internacional e acesso a estágios em Big Techs.',
    target_audience: 'Representantes nacionais selecionados pela OBI (até 20 anos)',
    requirements: 'Classificação via OBI. O Brasil envia delegação de 4 estudantes.',
    banner_url: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&q=80',
    tags: ['tecnologia', 'programação', 'internacional'],
    difficulty_level: 'Expert',
    estimated_duration: '1 semana',
    participants_count: 320,
    rating: 5.0,
    popularity_score: 96,
    application_process: 'Seleção automática via OBI. Não há inscrição direta para a IOI.',
    resources: [
      { label: 'Competitive Programming 3 (livro)', url: 'https://cpbook.net/' },
      { label: 'USACO Guide (algoritmos)', url: 'https://usaco.guide/' },
    ],
    past_exams_url: 'https://ioinformatics.org/page/tasks/16',
    certificate: true,
    language: 'Inglês',
    international: true,
    mentorship_available: false,
    team_allowed: false,
    next_edition_date: '2026-08-01',
    highlighted: true,
    deadline_countdown: null,
  },
  {
    name: 'Olimpíada Brasileira de Robótica',
    description: 'Desafia equipes de estudantes a projetar, construir e programar robôs para resolver missões de complexidade crescente. Estimula STEM, trabalho em equipe e criatividade.',
    area: 'Tecnologia',
    organizer: 'MEC / CEFET',
    start_date: '2025-09-15',
    end_date: '2025-11-20',
    location: 'Brasil',
    website: 'https://www.obr.org.br/',
    modalities: ['Presencial'],
    categories: ['Iniciante', 'Intermediário', 'Avançado'],
    status: 'Inscrições abertas',
    taxes: 'Gratuito',
    prizes: 'Troféus, medalhas e vaga para representar o Brasil na World Robot Olympiad.',
    target_audience: 'Estudantes do Ensino Fundamental e Médio',
    requirements: 'Inscrição em equipe de 2 a 4 alunos + professor orientador.',
    banner_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80',
    tags: ['tecnologia', 'internacional'],
    difficulty_level: 'Intermediário',
    estimated_duration: '4 meses',
    participants_count: 35000,
    rating: 4.6,
    popularity_score: 78,
    application_process: 'Escola se cadastra no portal OBR. Professor orienta equipe de 2-4 alunos. Inscrição gratuita.',
    resources: [
      { label: 'Kit de iniciação em robótica', url: 'https://www.obr.org.br/recursos' },
    ],
    past_exams_url: null,
    certificate: true,
    language: 'Português',
    international: false,
    mentorship_available: true,
    team_allowed: true,
    next_edition_date: '2026-09-15',
    highlighted: false,
    deadline_countdown: 22,
  },
  {
    name: 'Olimpíada Brasileira de Biologia',
    description: 'Avalia e estimula o conhecimento em biologia celular, genética, ecologia e evolução. Os melhores representam o Brasil na Olimpíada Internacional de Biologia.',
    area: 'Ciências',
    organizer: 'Universidade Federal de Viçosa',
    start_date: '2025-08-01',
    end_date: '2025-09-15',
    location: 'Brasil',
    website: 'https://www.obb.org.br/',
    modalities: ['Presencial', 'Online'],
    categories: ['Iniciante', 'Avançado'],
    status: 'Em andamento',
    taxes: 'Gratuito',
    prizes: 'Medalhas, certificados e participação na Olimpíada Internacional de Biologia (IBO).',
    target_audience: 'Estudantes do Ensino Médio (até 21 anos)',
    requirements: 'Inscrição individual via portal da OBB. Sem pré-requisitos além de ser estudante do EM.',
    banner_url: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600&q=80',
    tags: ['ciências', 'internacional'],
    difficulty_level: 'Difícil',
    estimated_duration: '6 semanas',
    participants_count: 42000,
    rating: 4.4,
    popularity_score: 68,
    application_process: 'Inscrição individual no portal OBB com documentação escolar. Prova aplicada em polo universitário parceiro.',
    resources: [],
    past_exams_url: 'https://www.obb.org.br/provas',
    certificate: true,
    language: 'Português',
    international: false,
    mentorship_available: false,
    team_allowed: false,
    next_edition_date: '2026-08-01',
    highlighted: false,
    deadline_countdown: null,
  },
])

//  UI STAT
const selectedOlimpiad = ref(null)
const search = ref('')
const activeStatus = ref('')

const todayLabel = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long', day: '2-digit', month: 'long',
})

const statusOptions = computed(() => [...new Set(olimpiads.value.map(o => o.status))])

const filtered = computed(() =>
  olimpiads.value.filter(o => {
    const q = search.value.trim().toLowerCase()
    const matchSearch = !q || o.name.toLowerCase().includes(q) || o.area.toLowerCase().includes(q) || o.tags.some(t => t.includes(q))
    const matchStatus = !activeStatus.value || o.status === activeStatus.value
    return matchSearch && matchStatus
  })
)

const highlighted = computed(() => filtered.value.filter(o => o.highlighted))

const TAG_META = {
  'tecnologia': { label: 'Tecnologia', icon: '💻', order: 1 },
  'programação': { label: 'Programação', icon: '👨‍💻', order: 2 },
  'matemática': { label: 'Matemática', icon: '🔢', order: 3 },
  'ciências': { label: 'Ciências', icon: '🔬', order: 4 },
  'linguagens': { label: 'Linguagens', icon: '📝', order: 5 },
  'nacional': { label: 'Nacional', icon: '🇧🇷', order: 6 },
  'internacional': { label: 'Internacional', icon: '🌍', order: 7 },
}

const tagSections = computed(() => {
  const map = new Map()
  filtered.value.forEach(o => {
    o.tags.forEach(tag => {
      if (!map.has(tag)) map.set(tag, [])
      map.get(tag).push(o)
    })
  })
  return [...map.entries()]
    .map(([tag, items]) => ({
      tag,
      items,
      icon: TAG_META[tag]?.icon ?? '🏆',
      label: TAG_META[tag]?.label ?? tag.charAt(0).toUpperCase() + tag.slice(1),
      order: TAG_META[tag]?.order ?? 99,
    }))
    .sort((a, b) => a.order - b.order)
})

const featuredOlimpiad = computed(() =>
  olimpiads.value
    .filter(o => o.highlighted)
    .sort((a, b) => (b.popularity_score ?? 0) - (a.popularity_score ?? 0))[0] ?? null
)

const activeFilterCount = computed(() => (search.value ? 1 : 0) + (activeStatus.value ? 1 : 0))

function clearFilters() {
  search.value = ''
  activeStatus.value = ''
}

// Carrossel: refs por tag
const rowEls = {}
function setRowRef(el, tag) { if (el) rowEls[tag] = el }
function scrollRow(tag, dir) { rowEls[tag]?.scrollBy({ left: dir * 700, behavior: 'smooth' }) }

const statusColor = {
  'Inscrições abertas': 'bg-emerald-500/20 text-emerald-700 ring-1 ring-emerald-500/30',
  'Em andamento': 'bg-blue-500/20 text-blue-700 ring-1 ring-blue-500/30',
  'Em breve': 'bg-amber-500/20 text-amber-700 ring-1 ring-amber-500/30',
  'Encerrada': 'bg-zinc-500/20 text-zinc-600 ring-1 ring-zinc-500/30',
}

const onDarkPill = (s) => statusColor[s]?.replace('text-', 'text-')?.replace('700', '300')?.replace('600', '400') ?? statusColor['Encerrada']?.replace('text-zinc-600', 'text-zinc-400')

function fmtCount(n) {
  if (!n) return ''
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return Math.round(n / 1_000) + 'k'
  return String(n)
}
</script>

<template>
  <div class="font-sans antialiased">
    <!-- Hero Section -->
    <section class="relative overflow-hidden flex items-center min-h-[400px] ">

      <div class="relative z-10 max-w-4xl mx-auto px-6 md:px-10 py-16 md:py-20">
        <!-- Title -->
        <h1 class="font-extrabold leading-[1.06] tracking-tight mb-4 text-center" style="font-size: clamp(1.9rem, 5.5vw, 3.2rem);">
          <span class="block ">Descubra as melhores</span>
          <span class="block gradient-text bg-clip-text text-transparent">oportunidades</span>
        </h1>

        <p class="text-[15px] leading-relaxed max-w-[420px] text-gray-600  mb-8 text-center">
          Olimpíadas científicas para estudantes do ensino fundamental e médio.
          Aprenda, compita e conquiste seu futuro.
        </p>

        <!-- Search input -->
        <div class="relative max-w-lg">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-800 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="black" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"/>
          </svg>
          <input
            v-model="search"
            type="search"
            placeholder="Buscar por nome, área ou tag..."
            class="w-full pl-11 pr-10 py-3.5 rounded-xl text-[13.5px] text-gray-800  bg-white/10 border border-black/15 focus:outline-none focus:bg-white/15 focus:border-emerald-600/40 transition-all"
          />
          <button
            v-if="search"
            @click="search = ''"
            class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-400 flex items-center justify-center transition-colors"
            aria-label="Limpar busca"
          >
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </section>

    <div class="">
    <!-- Filter Bar -->
    <div class="sticky top-0 z-30 bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)] max-w-[900px] mx-auto px-4 md:px-8 pt-10 pb-4">
      <div class="max-w-screen-2xl mx-auto px-6 md:px-10">
        <div class="flex items-center gap-3 py-2.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <span class="shrink-0 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">Filtrar</span>
          <div class="w-px h-3.5 bg-zinc-200 shrink-0"></div>

          <div class="flex items-center gap-1.5">
            <button
              @click="activeStatus = ''"
              :class="[
                'px-3 py-1.25 rounded-lg text-xs font-medium border transition-all',
                !activeStatus 
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm' 
                  : 'bg-white text-zinc-500 border-zinc-200 hover:text-zinc-700 hover:border-zinc-300'
              ]"
            >Todos</button>
            <button
              v-for="opt in statusOptions" :key="opt"
              @click="activeStatus = opt === activeStatus ? '' : opt"
              :class="[
                'px-3 py-1.25 rounded-lg text-xs font-medium border transition-all whitespace-nowrap',
                activeStatus === opt 
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm' 
                  : 'bg-white text-zinc-500 border-zinc-200 hover:text-zinc-700 hover:border-zinc-300'
              ]"
            >{{ opt }}</button>
          </div>

          <div class="flex items-center gap-3 ml-auto shrink-0">
            <span class="text-[11px] text-zinc-400 font-medium tabular-nums whitespace-nowrap">
              {{ filtered.length }} resultado{{ filtered.length !== 1 ? 's' : '' }}
            </span>
            <button
              v-if="activeFilterCount > 0"
              @click="clearFilters"
              class="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors whitespace-nowrap"
            >Limpar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="bg-white max-w-[900px] mx-auto px-4 md:px-8 pt-10 pb-4">
      <!-- Empty State -->
      <div v-if="!filtered.length" class="flex flex-col items-center justify-center py-28 px-6 text-center">
        <div class="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"/>
          </svg>
        </div>
        <p class="text-[15px] font-semibold text-zinc-700 mb-1.5">Nenhuma olimpíada encontrada</p>
        <p class="text-[13px] text-zinc-400 mb-6 max-w-xs leading-relaxed">Tente outros termos ou remova os filtros aplicados.</p>
        <button @click="clearFilters" class="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[13px] font-semibold rounded-xl transition-colors">Limpar filtros</button>
      </div>

      <!-- Featured Banner -->
      <div v-if="featuredOlimpiad && !search && !activeStatus" class="px-6 md:px-10 mb-12">
        <div @click="selectedOlimpiad = featuredOlimpiad" class="relative h-[260px] md:h-[320px] rounded-2xl overflow-hidden cursor-pointer group shadow-md hover:shadow-2xl transition-shadow">
          <img :src="featuredOlimpiad.banner_url" :alt="featuredOlimpiad.name" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          
          <!-- Gradients -->
          <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
          <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
          <div class="absolute inset-0" style="background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.25) 100%)"></div>

          <!-- Content -->
          <div class="absolute inset-0 flex flex-col justify-end p-7 md:p-10">
            <!-- Badges -->
            <div class="flex flex-wrap gap-2 mb-3">
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-400/90 text-amber-900">Em Destaque</span>
              <span :class="['inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-sm', onDarkPill(featuredOlimpiad.status)]">
                {{ featuredOlimpiad.status }}
              </span>
              <span v-if="featuredOlimpiad.international" class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-violet-500/25 text-violet-200 ring-1 ring-violet-500/30 backdrop-blur-sm">
                Internacional
              </span>
            </div>

            <!-- Title & Description -->
            <h2 class="text-white text-[clamp(1.2rem,3vw,1.75rem)] font-bold leading-tight tracking-tight max-w-lg mb-1.5">{{ featuredOlimpiad.name }}</h2>
            <p class="text-[13px] text-white/60 max-w-sm mb-5 line-clamp-2 hidden sm:block leading-relaxed">{{ featuredOlimpiad.description }}</p>

            <!-- Meta & CTA -->
            <div class="flex items-center gap-5 flex-wrap">
              <span v-if="featuredOlimpiad.participants_count" class="flex items-center gap-1.5 text-[12px] text-white/55 font-medium">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {{ fmtCount(featuredOlimpiad.participants_count) }} inscritos
              </span>
              <span v-if="featuredOlimpiad.rating" class="flex items-center gap-1 text-[12px] text-amber-400 font-semibold">
                <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                {{ featuredOlimpiad.rating.toFixed(1) }}
              </span>

              <button class="inline-flex items-center gap-1.5 px-4 py-1.75 rounded-full bg-white text-zinc-900 text-xs font-bold hover:bg-zinc-100 transition-all hover:gap-2">
                Ver detalhes
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Highlighted Section -->
      <div v-if="highlighted.length > 0" class="mb-10">
        <div class="flex items-center gap-2.5 px-6 md:px-10 mb-4">
          <div class="w-0.5 h-[18px] rounded-full bg-gradient-to-b from-emerald-600 to-blue-600"></div>
          <h2 class="text-[15px] font-bold text-zinc-900 tracking-tight">Em Destaque</h2>
          <span class="text-[11px] font-semibold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full tabular-nums">{{ highlighted.length }}</span>
        </div>

        <div class="relative group/row">
          <button @click="scrollRow('highlighted', -1)" class="absolute left-3 top-[calc(50%-18px)] z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white border border-zinc-200 shadow-md text-zinc-500 opacity-0 group-hover/row:opacity-100 hover:shadow-lg hover:text-zinc-900 hover:border-zinc-300 transition-all scale-90 group-hover/row:scale-100 active:scale-95" aria-label="Rolar para esquerda">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          <div :ref="el => setRowRef(el, 'highlighted')" class="flex gap-5 overflow-x-auto px-6 md:px-10 pb-3 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <OlimpiadasOlimpiadCard v-for="o in highlighted" :key="o.name" :olimpiad="o" @open="selectedOlimpiad = $event" />
            <div class="w-2 shrink-0"></div>
          </div>

          <button @click="scrollRow('highlighted', 1)" class="absolute right-3 top-[calc(50%-18px)] z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white border border-zinc-200 shadow-md text-zinc-500 opacity-0 group-hover/row:opacity-100 hover:shadow-lg hover:text-zinc-900 hover:border-zinc-300 transition-all scale-90 group-hover/row:scale-100 active:scale-95" aria-label="Rolar para direita">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Tag Sections -->
      <div v-for="section in tagSections" :key="section.tag" class="mb-10">
        <div class="flex items-center gap-2.5 px-6 md:px-10 mb-4">
          <div class="w-0.5 h-[18px] rounded-full bg-gradient-to-b from-emerald-600 to-blue-600"></div>
          <h2 class="text-[15px] font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <span class="text-[15px] leading-none">{{ section.icon }}</span>
            {{ section.label }}
          </h2>
          <span class="text-[11px] font-semibold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full tabular-nums">{{ section.items.length }}</span>
        </div>

        <div class="relative group/row">
          <button @click="scrollRow(section.tag, -1)" class="absolute left-3 top-[calc(50%-18px)] z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white border border-zinc-200 shadow-md text-zinc-500 opacity-0 group-hover/row:opacity-100 hover:shadow-lg hover:text-zinc-900 hover:border-zinc-300 transition-all scale-90 group-hover/row:scale-100 active:scale-95" :aria-label="`Rolar ${section.label} para esquerda`">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          <div :ref="el => setRowRef(el, section.tag)" class="flex gap-5 overflow-x-auto px-6 md:px-10 pb-3 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <OlimpiadasOlimpiadCard v-for="o in section.items" :key="o.name" :olimpiad="o" @open="selectedOlimpiad = $event" />
            <div class="w-2 shrink-0"></div>
          </div>

          <button @click="scrollRow(section.tag, 1)" class="absolute right-3 top-[calc(50%-18px)] z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white border border-zinc-200 shadow-md text-zinc-500 opacity-0 group-hover/row:opacity-100 hover:shadow-lg hover:text-zinc-900 hover:border-zinc-300 transition-all scale-90 group-hover/row:scale-100 active:scale-95" :aria-label="`Rolar ${section.label} para direita`">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    </div>

    <!-- Modal -->
    <OlimpiadasOlimpiadModal :olimpiad="selectedOlimpiad" @close="selectedOlimpiad = null" />
  </div>
</template>