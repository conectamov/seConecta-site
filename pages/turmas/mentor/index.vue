<script setup>
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Painel do mentor — seConecta' })

import MentorProfileModal from '~/components/MentorProfileModal.vue'

const config = useRuntimeConfig()
const { restoreSession, getAccessToken } = useAuth()

const apiBase = computed(() => config.public?.apiBase || config.public?.apiBaseUrl || '/api/v1')

const loading = ref(true)
const error = ref(null)
const mentorProfile = ref(null)
const turmas = ref([])
const toast = ref(null)
const mentorProfileModalOpen = ref(false)
let toastTimer = null

const approved = computed(() => mentorProfile.value?.status === 'APPROVED')
const pending = computed(() => mentorProfile.value?.status === 'PENDING')
const rejected = computed(() => mentorProfile.value?.status === 'REJECTED')

const stats = computed(() => {
  const total = turmas.value.length
  const open = turmas.value.filter((t) => t.status === 'ENROLLMENT_OPEN').length
  const ongoing = turmas.value.filter((t) => t.status === 'ONGOING').length
  const students = turmas.value.reduce((sum, t) => sum + Number(t.current_enrollment_count || 0), 0)
  return { total, open, ongoing, students }
})

onMounted(loadDashboard)

async function authFetch(path, options = {}) {
  await restoreSession()
  const token = getAccessToken()
  if (!token) throw { status: 401, data: { detail: 'Not authenticated' } }

  return await $fetch(path, {
    baseURL: apiBase.value,
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  })
}

async function loadDashboard() {
  loading.value = true
  error.value = null

  try {
    mentorProfile.value = await authFetch('/turmas/mentor/me')

    if (mentorProfile.value?.status === 'APPROVED') {
      const response = await authFetch('/turmas/my', { query: { limit: 100 } })
      turmas.value = Array.isArray(response) ? response : response?.data || []
    } else {
      turmas.value = []
    }
  } catch (err) {
    const status = err?.status || err?.response?.status
    error.value = status === 404
      ? 'Você ainda não criou um perfil de mentor.'
      : status === 401 || status === 403
        ? 'Você precisa estar logado para acessar o painel do mentor.'
        : 'Não foi possível carregar seu painel de mentor.'
  } finally {
    loading.value = false
  }
}

function statusLabel(status) {
  return {
    DRAFT: 'Rascunho',
    PENDING: 'Em revisão',
    APPROVED: 'Aprovado',
    REJECTED: 'Rejeitado',
    SUSPENDED: 'Suspenso',
    PUBLISHED: 'Publicada',
    PENDING_REVIEW: 'Em revisão',
    ENROLLMENT_OPEN: 'Inscrições abertas',
    FULL: 'Cheia',
    ONGOING: 'Em andamento',
    COMPLETED: 'Concluída',
    ARCHIVED: 'Arquivada',
    CANCELLED: 'Cancelada'
  }[status] || status || '—'
}

function statusTone(status) {
  return {
    DRAFT: 'gray',
    PENDING_REVIEW: 'orange',
    PENDING: 'orange',
    APPROVED: 'green',
    REJECTED: 'red',
    PUBLISHED: 'blue',
    ENROLLMENT_OPEN: 'green',
    FULL: 'orange',
    ONGOING: 'dark',
    COMPLETED: 'gray'
  }[status] || 'gray'
}

function formatDate(value) {
  if (!value) return 'A definir'
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function showToast(type, msg) {
  toast.value = { type, msg }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = null }, 3500)
}

function openProfileEditor() {
  mentorProfileModalOpen.value = true
}

async function handleMentorProfileSaved() {
  showToast('success', 'Perfil de mentor atualizado.')
  await loadDashboard()
}

async function handleMentorProfileDeleted() {
  showToast('success', 'Perfil de mentor excluído.')
  mentorProfile.value = null
  turmas.value = []
  await navigateTo('/turmas')
}

async function submitTurma(turma) {
  try {
    await authFetch(`/turmas/${turma.id}/submit`, { method: 'POST' })
    showToast('success', 'Turma enviada para revisão.')
    await loadDashboard()
  } catch (err) {
    showToast('error', err?.data?.detail || 'Não foi possível enviar a turma.')
  }
}

async function openEnrollment(turma) {
  try {
    await authFetch(`/turmas/${turma.id}/open-enrollment`, { method: 'POST' })
    showToast('success', 'Inscrições abertas.')
    await loadDashboard()
  } catch (err) {
    showToast('error', err?.data?.detail || 'Não foi possível abrir inscrições.')
  }
}
</script>

<template>
  <main class="min-h-screen bg-[#f7f5f0] text-[#111]">
    <div class="max-w-[1120px] mx-auto px-6 py-10">
      <div class="mb-7 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p class="text-[#079272] text-xs font-black uppercase tracking-[0.12em] mb-2">Painel do mentor</p>
          <h1 class="text-3xl font-black tracking-[-0.05em]">Controle suas turmas</h1>
          <p class="text-sm text-[#66736d] mt-2 max-w-xl">Gerencie seu perfil de mentor, veja quantas turmas você criou e acompanhe inscrições, status e próximos passos.</p>
        </div>

        <div class="flex gap-2 flex-wrap">
          <NuxtLink to="/turmas" class="px-4 py-2.5 rounded-full border border-[#d8d3ca] bg-white text-sm font-bold">Ver turmas</NuxtLink>
          <button v-if="mentorProfile" class="px-4 py-2.5 rounded-full border border-[#d8d3ca] bg-white text-sm font-bold" @click="openProfileEditor">Editar perfil</button>
          <NuxtLink v-if="approved" to="/turmas/mentor/criar" class="px-4 py-2.5 rounded-full bg-[#079272] text-white text-sm font-bold">Criar turma</NuxtLink>
        </div>
      </div>

      <div v-if="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-bold" :class="toast.type === 'success' ? 'bg-[#111] text-white' : 'bg-red-600 text-white'">
        {{ toast.msg }}
      </div>

      <MentorProfileModal
        v-model="mentorProfileModalOpen"
        :api-base="apiBase"
        @success="handleMentorProfileSaved"
        @deleted="handleMentorProfileDeleted"
      />

      <section v-if="loading" class="bg-white border border-[#e8e4dc] rounded-3xl p-8 animate-pulse">
        <div class="h-5 w-52 bg-[#f0ece5] rounded mb-4" />
        <div class="h-3 w-full max-w-xl bg-[#f0ece5] rounded" />
      </section>

      <section v-else-if="error" class="bg-white border border-[#e8e4dc] rounded-3xl p-8 text-center">
        <h2 class="text-xl font-black mb-2">Perfil de mentor necessário</h2>
        <p class="text-sm text-[#66736d] mb-5">{{ error }}</p>
        <button class="inline-flex px-5 py-3 rounded-full bg-[#079272] text-white text-sm font-bold" @click="openProfileEditor">Criar perfil de mentor</button>
      </section>

      <template v-else>
        <section class="grid lg:grid-cols-[1fr_330px] gap-5 mb-6">
          <article class="bg-white border border-[#e8e4dc] rounded-3xl p-6 shadow-sm">
            <div class="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <span class="inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-[0.08em]" :class="`tag-${statusTone(mentorProfile.status)}`">
                  {{ statusLabel(mentorProfile.status) }}
                </span>
                <h2 class="text-2xl font-black tracking-[-0.05em] mt-4">{{ mentorProfile.headline || 'Perfil de mentor' }}</h2>
                <p class="text-sm text-[#66736d] mt-2 leading-relaxed max-w-2xl">{{ mentorProfile.bio || 'Sem descrição.' }}</p>
              </div>

              <button class="px-4 py-2 rounded-full border border-[#d8d3ca] bg-white text-sm font-bold hover:border-[#079272] hover:text-[#079272] transition-all" @click="openProfileEditor">
                Editar perfil
              </button>
            </div>

            <div class="flex flex-wrap gap-2 mt-5">
              <span v-for="area in mentorProfile.areas || []" :key="area" class="px-3 py-1 rounded-full bg-[#e8f7f2] text-[#064e3b] text-xs font-bold">{{ area }}</span>
              <span v-for="topic in mentorProfile.topics || []" :key="topic" class="px-3 py-1 rounded-full bg-[#eff2ff] text-[#2464e8] text-xs font-bold">{{ topic }}</span>
            </div>
          </article>

          <aside class="bg-[#10231f] text-white rounded-3xl p-6 shadow-sm">
            <p class="text-xs uppercase tracking-[0.12em] text-white/60 font-black mb-3">Resumo</p>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-white/10 rounded-2xl p-4"><strong class="text-2xl">{{ stats.total }}</strong><span class="block text-xs text-white/60">turmas</span></div>
              <div class="bg-white/10 rounded-2xl p-4"><strong class="text-2xl">{{ stats.students }}</strong><span class="block text-xs text-white/60">inscritos</span></div>
              <div class="bg-white/10 rounded-2xl p-4"><strong class="text-2xl">{{ stats.open }}</strong><span class="block text-xs text-white/60">abertas</span></div>
              <div class="bg-white/10 rounded-2xl p-4"><strong class="text-2xl">{{ stats.ongoing }}</strong><span class="block text-xs text-white/60">em andamento</span></div>
            </div>
          </aside>
        </section>

        <section v-if="pending" class="bg-orange-50 border border-orange-200 text-orange-800 rounded-2xl p-5 mb-6">
          Seu perfil está em revisão. Quando for aprovado, você poderá criar turmas.
        </section>

        <section v-if="rejected" class="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 mb-6 flex items-center justify-between gap-3 flex-wrap">
          <span>Seu perfil foi rejeitado. Edite as informações e envie novamente para revisão.</span>
          <button class="px-4 py-2 rounded-full bg-red-600 text-white text-sm font-bold" @click="openProfileEditor">Editar perfil</button>
        </section>

        <section class="bg-white border border-[#e8e4dc] rounded-3xl overflow-hidden shadow-sm">
          <div class="px-6 py-4 border-b border-[#e8e4dc] flex justify-between items-center gap-3 flex-wrap">
            <div>
              <h2 class="font-black tracking-[-0.03em]">Minhas turmas</h2>
              <p class="text-xs text-[#888] mt-1">Veja rascunhos, turmas em revisão e turmas publicadas.</p>
            </div>
            <NuxtLink v-if="approved" to="/turmas/mentor/criar" class="px-4 py-2 rounded-full bg-[#079272] text-white text-sm font-bold">Nova turma</NuxtLink>
          </div>

          <div v-if="!approved" class="p-8 text-center text-sm text-[#66736d]">As turmas aparecem aqui depois que seu perfil for aprovado.</div>
          <div v-else-if="turmas.length === 0" class="p-10 text-center">
            <h3 class="font-black mb-2">Você ainda não criou turmas</h3>
            <p class="text-sm text-[#66736d] mb-5">Crie sua primeira turma e envie para revisão.</p>
            <NuxtLink to="/turmas/mentor/criar" class="inline-flex px-5 py-3 rounded-full bg-[#079272] text-white text-sm font-bold">Criar primeira turma</NuxtLink>
          </div>

          <div v-else class="divide-y divide-[#f0ece5]">
            <article v-for="turma in turmas" :key="turma.id" class="p-5 flex items-start justify-between gap-4 flex-wrap hover:bg-[#fafaf9]">
              <div class="min-w-0">
                <span class="inline-flex px-2.5 py-1 rounded-full text-[0.68rem] font-black uppercase tracking-[0.08em]" :class="`tag-${statusTone(turma.status)}`">{{ statusLabel(turma.status) }}</span>
                <h3 class="font-black text-lg tracking-[-0.03em] mt-2">{{ turma.title }}</h3>
                <p class="text-sm text-[#66736d] mt-1 max-w-2xl">{{ turma.short_description || turma.description }}</p>
                <div class="flex flex-wrap gap-3 text-xs text-[#888] mt-3">
                  <span>{{ turma.current_enrollment_count || 0 }}/{{ turma.class_size }} inscritos</span>
                  <span>{{ turma.number_of_meetings }} encontros</span>
                  <span>Início: {{ formatDate(turma.start_date) }}</span>
                </div>
              </div>

              <div class="flex gap-2">
                <button v-if="turma.status === 'DRAFT' || turma.status === 'REJECTED'" class="px-3 py-2 rounded-xl border border-[#d8d3ca] bg-white text-sm font-bold" @click="submitTurma(turma)">Enviar revisão</button>
                <button v-if="turma.status === 'PUBLISHED'" class="px-3 py-2 rounded-xl bg-[#079272] text-white text-sm font-bold" @click="openEnrollment(turma)">Abrir inscrições</button>
                <NuxtLink :to="`/turmas/mentor/${turma.id}`" class="px-3 py-2 rounded-xl border border-[#d8d3ca] bg-white text-sm font-bold">Gerenciar</NuxtLink>
                <NuxtLink :to="`/turmas/${turma.id}`" class="px-3 py-2 rounded-xl border border-[#d8d3ca] bg-white text-sm font-bold">Ver pública</NuxtLink>
              </div>
            </article>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<style scoped>
.tag-green { background: #e8f7f2; color: #067a60; }
.tag-orange { background: #fff7ed; color: #c2410c; }
.tag-red { background: #fff1f2; color: #be123c; }
.tag-blue { background: #eff6ff; color: #2563eb; }
.tag-gray { background: #f3f4f6; color: #4b5563; }
.tag-dark { background: #111827; color: white; }
</style>