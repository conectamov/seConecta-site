<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Dashboard — seConecta' })

const { get, patch, post, del } = useAxios()
const auth = useAuth()
const currentUser = auth.currentUser

const users = ref<any[]>([])
const totalUsers = ref(0)
const loading = ref(true)
const error = ref<string | null>(null)
const skip = ref(0)
const LIMIT = 20

const searchQuery = ref('')
const permsOverride = ref<Record<string, any>>({})
const patching = ref<Record<string, boolean>>({})
const deleting = ref<Record<string, boolean>>({})
const confirmDeleteId = ref<any>(null)

const pendingMentors = ref<any[]>([])
const mentorsLoading = ref(false)
const mentorsError = ref<string | null>(null)
const reviewingMentor = ref<Record<string, boolean>>({})

const pendingTurmas = ref<any[]>([])
const turmasLoading = ref(false)
const turmasError = ref<string | null>(null)
const reviewingTurma = ref<Record<string, boolean>>({})

const toast = ref<{ type: string; msg: string } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

const isStrictAdmin = computed(() => {
  return currentUser.value?.is_superuser === true
})

const managerCount = computed(() => {
  return users.value.filter((user) => getPerm(user.id, 'is_manager')).length
})

const superuserCount = computed(() => {
  return users.value.filter((user) => getPerm(user.id, 'is_superuser')).length
})

const pendingMentorsCount = computed(() => pendingMentors.value.length)
const pendingTurmasCount = computed(() => pendingTurmas.value.length)

function showToast(type: string, msg: string) {
  toast.value = { type, msg }

  if (toastTimer) clearTimeout(toastTimer)

  toastTimer = setTimeout(() => {
    toast.value = null
  }, 3500)
}

async function bootDashboard() {
  loading.value = true
  mentorsLoading.value = true
  turmasLoading.value = true
  error.value = null
  mentorsError.value = null
  turmasError.value = null

  if (typeof auth.restoreSession === 'function') {
    await auth.restoreSession()
  }

  if (!isStrictAdmin.value) {
    loading.value = false
    mentorsLoading.value = false
    turmasLoading.value = false
    error.value = 'Apenas administradores podem acessar esta página.'
    return
  }

  await Promise.all([
    fetchUsers(true),
    fetchPendingMentors(),
    fetchPendingTurmas()
  ])
}

async function fetchUsers(reset = true) {
  if (!isStrictAdmin.value) return

  if (reset) {
    skip.value = 0
    users.value = []
  }

  loading.value = true
  error.value = null

  try {
    const res = await get('/users/', {
      params: {
        skip: skip.value,
        limit: LIMIT
      }
    })

    const data = res.data.data ?? []

    totalUsers.value = res.data.count ?? 0

    if (reset) users.value = data
    else users.value.push(...data)
  } catch (e: any) {
    error.value = e?.response?.status === 403
      ? 'Sem permissão para acessar a lista de usuários.'
      : 'Erro ao carregar usuários.'
  } finally {
    loading.value = false
  }
}

async function fetchPendingMentors() {
  if (!isStrictAdmin.value) return

  mentorsLoading.value = true
  mentorsError.value = null

  try {
    const res = await get('/turmas/admin/mentors', {
      params: {
        status: 'PENDING',
        limit: 50,
        offset: 0
      }
    })

    pendingMentors.value = Array.isArray(res.data) ? res.data : []
  } catch (e: any) {
    mentorsError.value = e?.response?.status === 403
      ? 'Sem permissão para visualizar mentores pendentes.'
      : 'Erro ao carregar mentores pendentes.'
  } finally {
    mentorsLoading.value = false
  }
}

async function fetchPendingTurmas() {
  if (!isStrictAdmin.value) return

  turmasLoading.value = true
  turmasError.value = null

  try {
    const res = await get('/turmas/admin/turmas', {
      params: {
        status: 'PENDING_REVIEW',
        limit: 50,
        offset: 0
      }
    })

    pendingTurmas.value = Array.isArray(res.data) ? res.data : []
  } catch (e: any) {
    turmasError.value = e?.response?.status === 403
      ? 'Sem permissão para visualizar turmas pendentes.'
      : 'Erro ao carregar turmas pendentes.'
  } finally {
    turmasLoading.value = false
  }
}

async function loadMore() {
  skip.value += LIMIT
  await fetchUsers(false)
}

onMounted(() => {
  bootDashboard()
})

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return users.value

  const q = searchQuery.value.trim().toLowerCase()

  return users.value.filter((user) => {
    return (
      (user.full_name || '').toLowerCase().includes(q) ||
      (user.username || '').toLowerCase().includes(q) ||
      (user.email || '').toLowerCase().includes(q)
    )
  })
})

function getPerm(userId: any, field: string) {
  return permsOverride.value[userId]?.[field] ??
    users.value.find((user) => user.id === userId)?.[field] ??
    false
}

function initial(user: any) {
  return (user.full_name || user.username || user.email || '?')
    .charAt(0)
    .toUpperCase()
}

function mentorAccountName(mentor: any) {
  return mentor.user_full_name || mentor.user_username || 'Mentor seConecta'
}

function mentorProfileUrl(mentor: any) {
  return mentor.user_profile_url || (mentor.user_username ? `/profile/${mentor.user_username}` : null)
}

function mentorInitial(mentor: any) {
  return mentorAccountName(mentor).charAt(0).toUpperCase()
}

function formatList(value: any) {
  if (!Array.isArray(value) || value.length === 0) return 'Não informado'
  return value.join(', ')
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(value))
  } catch {
    return '—'
  }
}

function mentorTypeLabel(type: string) {
  return {
    PEER: 'Mentor estudante',
    AMBASSADOR: 'Embaixador',
    VERIFIED: 'Verificado'
  }[type] || type || 'Mentor'
}

function mentorLevelLabel(level: string) {
  return {
    BEGINNER_GUIDE: 'Guia de iniciantes',
    EXPERIENCED: 'Experiente',
    ADVANCED: 'Avançado',
    SPECIALIST: 'Especialista'
  }[level] || level || 'Não informado'
}

function turmaCategoryLabel(category: string) {
  return {
    OLYMPIAD: 'Olimpíada',
    OPPORTUNITY_APPLICATION: 'Aplicações',
    RESEARCH: 'Pesquisa',
    TECHNOLOGY: 'Tecnologia',
    PROJECTS: 'Projetos',
    SCHOLARSHIPS: 'Bolsas',
    CAREER: 'Carreira',
    EXPLORATION: 'Exploração',
    OTHER: 'Outra'
  }[category] || category || 'Turma'
}

function turmaLevelLabel(level: string) {
  return {
    BEGINNER: 'Iniciante',
    INTERMEDIATE: 'Intermediário',
    ADVANCED: 'Avançado',
    OPEN_TO_ALL: 'Aberta para todos'
  }[level] || level || 'Não informado'
}

function turmaFormatLabel(format: string) {
  return {
    ONLINE: 'Online',
    IN_PERSON: 'Presencial',
    HYBRID: 'Híbrida',
    ASYNC: 'Assíncrona'
  }[format] || format || 'Formato não informado'
}

function truncateText(value: string | null | undefined, limit = 220) {
  if (!value) return 'Sem descrição enviada.'
  if (value.length <= limit) return value
  return `${value.slice(0, limit).trim()}...`
}

async function togglePerm(user: any, field: string) {
  if (!isStrictAdmin.value) {
    showToast('error', 'Apenas administradores podem alterar permissões.')
    return
  }

  if (patching.value[user.id]) return

  if (user.id === currentUser.value?.id) {
    showToast('error', 'Você não pode alterar suas próprias permissões.')
    return
  }

  const current = getPerm(user.id, field)
  const newVal = !current

  if (!permsOverride.value[user.id]) {
    permsOverride.value[user.id] = {}
  }

  permsOverride.value[user.id][field] = newVal
  patching.value[user.id] = true

  try {
    await patch(`/users/${user.id}`, {
      [field]: newVal
    })

    showToast(
      'success',
      `${field === 'is_manager' ? 'Manager' : 'Superuser'} ${newVal ? 'ativado' : 'removido'} para @${user.username}.`
    )
  } catch (e: any) {
    permsOverride.value[user.id][field] = current

    const status = e?.response?.status

    showToast(
      'error',
      status === 403
        ? 'Sem permissão para alterar este usuário.'
        : 'Erro ao atualizar permissão.'
    )
  } finally {
    patching.value[user.id] = false
  }
}

async function reviewMentor(mentor: any, approved: boolean) {
  if (!isStrictAdmin.value) {
    showToast('error', 'Apenas administradores podem revisar mentores.')
    return
  }

  if (reviewingMentor.value[mentor.id]) return

  let rejectionReason: string | null = null

  if (!approved) {
    rejectionReason = window.prompt('Motivo da rejeição:')

    if (!rejectionReason?.trim()) {
      showToast('error', 'Informe um motivo para rejeitar o mentor.')
      return
    }
  }

  reviewingMentor.value[mentor.id] = true

  try {
    await post(`/turmas/admin/mentors/${mentor.id}/review`, {
      approved,
      rejection_reason: approved ? null : rejectionReason,
      internal_notes: null
    })

    pendingMentors.value = pendingMentors.value.filter((item) => item.id !== mentor.id)

    showToast(
      'success',
      approved
        ? 'Mentor aprovado com sucesso.'
        : 'Mentor rejeitado.'
    )
  } catch (e: any) {
    const status = e?.response?.status

    showToast(
      'error',
      status === 403
        ? 'Sem permissão para revisar este mentor.'
        : 'Erro ao revisar mentor.'
    )
  } finally {
    reviewingMentor.value[mentor.id] = false
  }
}

async function reviewTurma(turma: any, approved: boolean) {
  if (!isStrictAdmin.value) {
    showToast('error', 'Apenas administradores podem revisar turmas.')
    return
  }

  if (reviewingTurma.value[turma.id]) return

  let rejectionReason: string | null = null
  let reviewNotes: string | null = null

  if (approved) {
    reviewNotes = window.prompt('Observação interna opcional para aprovação:', '')
  } else {
    rejectionReason = window.prompt('Motivo da rejeição:')

    if (!rejectionReason?.trim()) {
      showToast('error', 'Informe um motivo para rejeitar a turma.')
      return
    }
  }

  reviewingTurma.value[turma.id] = true

  try {
    await post(`/turmas/admin/${turma.id}/review`, {
      approved,
      review_notes: approved ? reviewNotes : null,
      rejection_reason: approved ? null : rejectionReason
    })

    pendingTurmas.value = pendingTurmas.value.filter((item) => item.id !== turma.id)

    showToast(
      'success',
      approved
        ? 'Turma aprovada com sucesso.'
        : 'Turma rejeitada.'
    )
  } catch (e: any) {
    const status = e?.response?.status

    showToast(
      'error',
      status === 403
        ? 'Sem permissão para revisar esta turma.'
        : 'Erro ao revisar turma.'
    )
  } finally {
    reviewingTurma.value[turma.id] = false
  }
}

async function deleteUser(userId: any) {
  if (!isStrictAdmin.value) {
    showToast('error', 'Apenas administradores podem deletar usuários.')
    return
  }

  if (deleting.value[userId]) return

  confirmDeleteId.value = null
  deleting.value[userId] = true

  try {
    await del(`/users/${userId}`)

    users.value = users.value.filter((user) => user.id !== userId)
    totalUsers.value = Math.max(0, totalUsers.value - 1)

    showToast('success', 'Usuário removido com sucesso.')
  } catch (e: any) {
    const status = e?.response?.status

    showToast(
      'error',
      status === 403
        ? 'Sem permissão para deletar.'
        : 'Erro ao remover usuário.'
    )
  } finally {
    deleting.value[userId] = false
  }
}

const hasMore = computed(() => {
  return skip.value + LIMIT < totalUsers.value
})
</script>

<template>
  <div class="min-h-screen bg-[#f7f5f0]">
    <div class="max-w-[1100px] mx-auto px-6 md:px-8 py-10">
      <div
        v-if="!isStrictAdmin && !loading"
        class="bg-white border border-[#e8e4dc] rounded-2xl shadow-sm p-8 text-center"
      >
        <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
            <path d="M12 8v5" />
            <path d="M12 16h.01" />
          </svg>
        </div>

        <h1 class="text-2xl font-bold text-[#111] tracking-[-0.02em] mb-2">
          Acesso restrito
        </h1>

        <p class="text-sm text-[#777] max-w-md mx-auto">
          Esta página é exclusiva para administradores. Managers e usuários comuns não podem visualizar ou revisar pendências daqui.
        </p>
      </div>

      <template v-else>
        <!-- Page header -->
        <div class="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 class="text-2xl font-bold text-[#111] tracking-[-0.02em] mb-1">
              Dashboard Administrativo
            </h1>

            <p class="text-sm font-light text-[#888]">
              Controle usuários e revise pendências de mentores.
              <span class="text-[#bbb]">·</span>
              <span class="font-medium text-[#555]">{{ totalUsers }} usuários no total</span>
            </p>
          </div>

          <!-- Stats cards -->
          <div class="flex gap-3 flex-wrap">
            <div class="bg-white border border-[#e8e4dc] rounded-xl px-5 py-3 text-center">
              <div class="text-xl font-bold text-[#111]">{{ totalUsers }}</div>
              <div class="text-[0.65rem] uppercase tracking-[0.1em] text-[#bbb]">Total</div>
            </div>

            <div class="bg-white border border-[#e8e4dc] rounded-xl px-5 py-3 text-center">
              <div class="text-xl font-bold text-[#079272]">{{ managerCount }}</div>
              <div class="text-[0.65rem] uppercase tracking-[0.1em] text-[#bbb]">Managers</div>
            </div>

            <div class="bg-white border border-[#e8e4dc] rounded-xl px-5 py-3 text-center">
              <div class="text-xl font-bold text-[#2464E8]">{{ superuserCount }}</div>
              <div class="text-[0.65rem] uppercase tracking-[0.1em] text-[#bbb]">Admins</div>
            </div>

            <div class="bg-white border border-[#e8e4dc] rounded-xl px-5 py-3 text-center">
              <div class="text-xl font-bold text-[#ea580c]">{{ pendingMentorsCount }}</div>
              <div class="text-[0.65rem] uppercase tracking-[0.1em] text-[#bbb]">Mentores pendentes</div>
            </div>

            <div class="bg-white border border-[#e8e4dc] rounded-xl px-5 py-3 text-center">
              <div class="text-xl font-bold text-[#7c3aed]">{{ pendingTurmasCount }}</div>
              <div class="text-[0.65rem] uppercase tracking-[0.1em] text-[#bbb]">Turmas pendentes</div>
            </div>
          </div>
        </div>

        <!-- Pendências de mentores -->
        <section class="mb-8">
          <div class="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 class="text-lg font-bold text-[#111] tracking-[-0.02em]">
                Mentores pendentes
              </h2>

              <p class="text-sm text-[#888] mt-1">
                Perfis enviados para revisão antes de liberar criação de turmas.
              </p>
            </div>

            <button
              class="text-sm font-semibold px-4 py-2 bg-white border border-[#e8e4dc] text-[#666] rounded-xl hover:border-[#079272] hover:text-[#079272] transition-all"
              :disabled="mentorsLoading"
              @click="fetchPendingMentors"
            >
              Atualizar
            </button>
          </div>

          <div class="bg-white border border-[#e8e4dc] rounded-2xl overflow-hidden shadow-sm">
            <template v-if="mentorsLoading">
              <div
                v-for="i in 3"
                :key="i"
                class="p-5 border-b border-[#f7f5f0] animate-pulse"
              >
                <div class="flex gap-4">
                  <div class="w-10 h-10 rounded-full bg-[#f0ece5]" />
                  <div class="flex-1 space-y-2">
                    <div class="h-3 w-48 bg-[#f0ece5] rounded" />
                    <div class="h-2.5 w-full max-w-xl bg-[#f0ece5] rounded" />
                    <div class="h-2.5 w-72 bg-[#f0ece5] rounded" />
                  </div>
                </div>
              </div>
            </template>

            <div
              v-else-if="mentorsError"
              class="flex items-center gap-3 bg-red-50 text-red-700 px-5 py-4 text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>

              {{ mentorsError }}

              <button
                class="ml-auto text-sm font-semibold px-3 py-1 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                @click="fetchPendingMentors"
              >
                Tentar novamente
              </button>
            </div>

            <div
              v-else-if="pendingMentors.length === 0"
              class="py-10 px-5 text-center"
            >
              <div class="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#f7f5f0] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.8">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>

              <p class="text-sm font-medium text-[#555]">
                Nenhum mentor pendente agora.
              </p>

              <p class="text-xs text-[#999] mt-1">
                Novos perfis enviados para revisão aparecerão aqui.
              </p>
            </div>

            <div v-else>
              <article
                v-for="mentor in pendingMentors"
                :key="mentor.id"
                class="p-5 border-b border-[#f7f5f0] last:border-0 hover:bg-[#fafaf9] transition-colors"
              >
                <div class="flex items-start gap-4">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-[#079272] to-[#2464E8] flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {{ mentorInitial(mentor) }}
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-start justify-between gap-4">
                      <div>
                        <div class="flex items-center gap-2 flex-wrap">
                          <NuxtLink
                            v-if="mentorProfileUrl(mentor)"
                            :to="mentorProfileUrl(mentor)"
                            class="text-[0.95rem] font-bold text-[#111] hover:text-[#079272] hover:underline underline-offset-2"
                          >
                            {{ mentorAccountName(mentor) }}
                          </NuxtLink>

                          <h3 v-else class="text-[0.95rem] font-bold text-[#111]">
                            {{ mentorAccountName(mentor) }}
                          </h3>

                          <span class="text-[0.65rem] uppercase tracking-[0.08em] text-[#079272] bg-[#e8f5f2] border border-[#079272]/20 px-2 py-1 rounded-full">
                            {{ mentorTypeLabel(mentor.mentor_type) }}
                          </span>

                          <span class="text-[0.65rem] uppercase tracking-[0.08em] text-[#2464E8] bg-[#eff2ff] border border-[#2464E8]/20 px-2 py-1 rounded-full">
                            {{ mentorLevelLabel(mentor.mentor_level) }}
                          </span>
                        </div>

                        <p class="text-[0.78rem] text-[#079272] mt-2 font-semibold" v-if="mentor.headline">
                          {{ mentor.headline }}
                        </p>

                        <p class="text-[0.82rem] text-[#777] mt-1 leading-relaxed">
                          {{ mentor.bio || 'Sem descrição enviada.' }}
                        </p>
                      </div>

                      <div class="text-right shrink-0 hidden md:block">
                        <div class="text-[0.65rem] uppercase tracking-[0.1em] text-[#bbb]">
                          Enviado em
                        </div>

                        <div class="text-xs font-medium text-[#666] mt-1">
                          {{ formatDate(mentor.created_at) }}
                        </div>
                      </div>
                    </div>

                    <div class="grid md:grid-cols-3 gap-3 mt-4">
                      <div class="bg-[#f7f5f0] border border-[#eee8de] rounded-xl px-3 py-2">
                        <div class="text-[0.65rem] uppercase tracking-[0.09em] text-[#aaa] mb-1">
                          Áreas
                        </div>

                        <div class="text-[0.78rem] text-[#555] leading-snug">
                          {{ formatList(mentor.areas) }}
                        </div>
                      </div>

                      <div class="bg-[#f7f5f0] border border-[#eee8de] rounded-xl px-3 py-2">
                        <div class="text-[0.65rem] uppercase tracking-[0.09em] text-[#aaa] mb-1">
                          Tópicos
                        </div>

                        <div class="text-[0.78rem] text-[#555] leading-snug">
                          {{ formatList(mentor.topics) }}
                        </div>
                      </div>

                      <div class="bg-[#f7f5f0] border border-[#eee8de] rounded-xl px-3 py-2">
                        <div class="text-[0.65rem] uppercase tracking-[0.09em] text-[#aaa] mb-1">
                          Disponibilidade
                        </div>

                        <div class="text-[0.78rem] text-[#555] leading-snug">
                          {{ formatList(mentor.availability?.days) }}
                          <span v-if="mentor.availability?.periods?.length">
                            · {{ formatList(mentor.availability.periods) }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      v-if="mentor.proof_links?.length"
                      class="flex flex-wrap gap-2 mt-3"
                    >
                      <a
                        v-for="link in mentor.proof_links"
                        :key="link"
                        :href="link"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-[0.75rem] font-medium text-[#2464E8] bg-[#eff2ff] border border-[#2464E8]/20 rounded-full px-3 py-1 hover:bg-[#e4e9ff] transition-colors"
                      >
                        Ver referência
                      </a>
                    </div>

                    <div class="flex justify-end gap-2 mt-4">
                      <button
                        class="text-sm font-semibold px-4 py-2 border border-red-200 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                        :disabled="reviewingMentor[mentor.id]"
                        @click="reviewMentor(mentor, false)"
                      >
                        Rejeitar
                      </button>

                      <button
                        class="text-sm font-semibold px-4 py-2 border border-[#079272] bg-[#079272] text-white rounded-xl hover:bg-[#067a60] transition-colors disabled:opacity-50"
                        :disabled="reviewingMentor[mentor.id]"
                        @click="reviewMentor(mentor, true)"
                      >
                        Aprovar
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>


        <!-- Pendências de turmas -->
        <section class="mb-8">
          <div class="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 class="text-lg font-bold text-[#111] tracking-[-0.02em]">
                Turmas pendentes
              </h2>

              <p class="text-sm text-[#888] mt-1">
                Turmas criadas por mentores e enviadas para revisão antes de aparecerem publicamente.
              </p>
            </div>

            <button
              class="text-sm font-semibold px-4 py-2 bg-white border border-[#e8e4dc] text-[#666] rounded-xl hover:border-[#079272] hover:text-[#079272] transition-all"
              :disabled="turmasLoading"
              @click="fetchPendingTurmas"
            >
              Atualizar
            </button>
          </div>

          <div class="bg-white border border-[#e8e4dc] rounded-2xl overflow-hidden shadow-sm">
            <template v-if="turmasLoading">
              <div
                v-for="i in 3"
                :key="i"
                class="p-5 border-b border-[#f7f5f0] animate-pulse"
              >
                <div class="space-y-3">
                  <div class="h-3 w-64 bg-[#f0ece5] rounded" />
                  <div class="h-2.5 w-full max-w-2xl bg-[#f0ece5] rounded" />
                  <div class="h-2.5 w-96 bg-[#f0ece5] rounded" />
                </div>
              </div>
            </template>

            <div
              v-else-if="turmasError"
              class="flex items-center gap-3 bg-red-50 text-red-700 px-5 py-4 text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>

              {{ turmasError }}

              <button
                class="ml-auto text-sm font-semibold px-3 py-1 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                @click="fetchPendingTurmas"
              >
                Tentar novamente
              </button>
            </div>

            <div
              v-else-if="pendingTurmas.length === 0"
              class="py-10 px-5 text-center"
            >
              <div class="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#f7f5f0] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.8">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>

              <p class="text-sm font-medium text-[#555]">
                Nenhuma turma pendente agora.
              </p>

              <p class="text-xs text-[#999] mt-1">
                Turmas enviadas para revisão aparecerão aqui.
              </p>
            </div>

            <div v-else>
              <article
                v-for="turma in pendingTurmas"
                :key="turma.id"
                class="p-5 border-b border-[#f7f5f0] last:border-0 hover:bg-[#fafaf9] transition-colors"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <h3 class="text-[0.98rem] font-bold text-[#111]">
                        {{ turma.title || 'Turma sem título' }}
                      </h3>

                      <span class="text-[0.65rem] uppercase tracking-[0.08em] text-[#079272] bg-[#e8f5f2] border border-[#079272]/20 px-2 py-1 rounded-full">
                        {{ turmaCategoryLabel(turma.category) }}
                      </span>

                      <span class="text-[0.65rem] uppercase tracking-[0.08em] text-[#2464E8] bg-[#eff2ff] border border-[#2464E8]/20 px-2 py-1 rounded-full">
                        {{ turmaLevelLabel(turma.level) }}
                      </span>

                      <span class="text-[0.65rem] uppercase tracking-[0.08em] text-[#7c3aed] bg-[#f3e8ff] border border-[#7c3aed]/20 px-2 py-1 rounded-full">
                        {{ turmaFormatLabel(turma.format) }}
                      </span>
                    </div>

                    <p class="text-[0.82rem] text-[#777] mt-2 leading-relaxed">
                      {{ truncateText(turma.description || turma.short_description) }}
                    </p>

                    <div class="grid md:grid-cols-4 gap-3 mt-4">
                      <div class="bg-[#f7f5f0] border border-[#eee8de] rounded-xl px-3 py-2">
                        <div class="text-[0.65rem] uppercase tracking-[0.09em] text-[#aaa] mb-1">Tópico</div>
                        <div class="text-[0.78rem] text-[#555] leading-snug">{{ turma.topic || 'Não informado' }}</div>
                      </div>

                      <div class="bg-[#f7f5f0] border border-[#eee8de] rounded-xl px-3 py-2">
                        <div class="text-[0.65rem] uppercase tracking-[0.09em] text-[#aaa] mb-1">Vagas</div>
                        <div class="text-[0.78rem] text-[#555] leading-snug">{{ turma.class_size || '—' }}</div>
                      </div>

                      <div class="bg-[#f7f5f0] border border-[#eee8de] rounded-xl px-3 py-2">
                        <div class="text-[0.65rem] uppercase tracking-[0.09em] text-[#aaa] mb-1">Encontros</div>
                        <div class="text-[0.78rem] text-[#555] leading-snug">{{ turma.number_of_meetings || '—' }}</div>
                      </div>

                      <div class="bg-[#f7f5f0] border border-[#eee8de] rounded-xl px-3 py-2">
                        <div class="text-[0.65rem] uppercase tracking-[0.09em] text-[#aaa] mb-1">Enviada em</div>
                        <div class="text-[0.78rem] text-[#555] leading-snug">{{ formatDate(turma.updated_at || turma.created_at) }}</div>
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-col gap-2 shrink-0">
                    <button
                      class="text-sm font-semibold px-4 py-2 border border-red-200 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                      :disabled="reviewingTurma[turma.id]"
                      @click="reviewTurma(turma, false)"
                    >
                      Rejeitar
                    </button>

                    <button
                      class="text-sm font-semibold px-4 py-2 border border-[#079272] bg-[#079272] text-white rounded-xl hover:bg-[#067a60] transition-colors disabled:opacity-50"
                      :disabled="reviewingTurma[turma.id]"
                      @click="reviewTurma(turma, true)"
                    >
                      Aprovar
                    </button>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <!-- Busca -->
        <div class="relative mb-5">
          <svg
            class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nome, username ou e-mail..."
            class="w-full h-11 pl-11 pr-5 bg-white border border-[#e8e4dc] rounded-xl text-sm text-[#111] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all"
          />
        </div>

        <!-- Legenda -->
        <div class="flex items-center gap-6 mb-4 text-[0.72rem] text-[#888] flex-wrap">
          <span class="flex items-center gap-1.5">
            <span class="w-4 h-4 rounded bg-[#e8f5f2] border border-[#079272]/30 flex items-center justify-center">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#079272" stroke-width="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            Manager — permissões internas limitadas
          </span>

          <span class="flex items-center gap-1.5">
            <span class="w-4 h-4 rounded bg-[#eff2ff] border border-[#2464E8]/30 flex items-center justify-center">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#2464E8" stroke-width="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            Admin — acesso a esta página e revisão de mentores
          </span>
        </div>

        <!-- Erro -->
        <div
          v-if="error"
          class="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 mb-6 text-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>

          {{ error }}

          <button
            class="ml-auto text-sm font-semibold px-3 py-1 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
            @click="fetchUsers()"
          >
            Tentar novamente
          </button>
        </div>

        <!-- Tabela -->
        <div class="bg-white border border-[#e8e4dc] rounded-2xl overflow-hidden shadow-sm">
          <!-- Header da tabela -->
          <div class="grid grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-4 px-6 py-3 bg-[#f7f5f0] border-b border-[#e8e4dc] text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[#aaa]">
            <span>Usuário</span>
            <span class="hidden md:block">E-mail</span>
            <span class="text-center">Manager</span>
            <span class="text-center">Admin</span>
            <span></span>
          </div>

          <!-- Skeleton -->
          <template v-if="loading">
            <div
              v-for="i in 8"
              :key="i"
              class="grid grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-4 px-6 py-4 border-b border-[#f7f5f0] animate-pulse"
            >
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-[#f0ece5]" />
                <div class="space-y-1.5">
                  <div class="h-3 w-28 bg-[#f0ece5] rounded" />
                  <div class="h-2.5 w-20 bg-[#f0ece5] rounded" />
                </div>
              </div>

              <div class="h-3 w-36 bg-[#f0ece5] rounded hidden md:block" />
              <div class="w-12 h-7 bg-[#f0ece5] rounded-full mx-auto" />
              <div class="w-12 h-7 bg-[#f0ece5] rounded-full mx-auto" />
              <div class="w-8 h-8 bg-[#f0ece5] rounded-lg" />
            </div>
          </template>

          <!-- Vazio -->
          <div
            v-else-if="filteredUsers.length === 0 && !loading"
            class="flex flex-col items-center py-16 gap-3 text-center"
          >
            <div class="w-12 h-12 rounded-2xl bg-[#f7f5f0] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            <p class="text-sm text-[#888]">
              Nenhum usuário encontrado<span v-if="searchQuery"> para "{{ searchQuery }}"</span>.
            </p>
          </div>

          <!-- Linhas de usuários -->
          <template v-else>
            <div
              v-for="user in filteredUsers"
              :key="user.id"
              class="grid grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-4 px-6 py-4 border-b border-[#f7f5f0] last:border-0 hover:bg-[#fafaf9] transition-colors"
              :class="{ 'opacity-40': deleting[user.id] }"
            >
              <!-- Usuário -->
              <div class="flex items-center gap-3 min-w-0">
                <div
                  class="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  :class="user.id === currentUser?.id
                    ? 'bg-gradient-to-br from-[#079272] to-[#2464E8]'
                    : 'bg-gradient-to-br from-[#555] to-[#888]'"
                >
                  {{ initial(user) }}
                </div>

                <div class="min-w-0">
                  <div class="text-[0.85rem] font-semibold text-[#111] truncate flex items-center gap-1.5">
                    {{ user.full_name || user.username }}

                    <span
                      v-if="user.id === currentUser?.id"
                      class="text-[0.62rem] font-medium text-[#079272] shrink-0"
                    >
                      (você)
                    </span>
                  </div>

                  <div class="text-[0.72rem] text-[#aaa] truncate">
                    @{{ user.username }}
                  </div>
                </div>
              </div>

              <!-- Email -->
              <div class="hidden md:block text-[0.82rem] text-[#777] truncate">
                {{ user.email }}
              </div>

              <!-- Toggle Manager -->
              <div class="flex justify-center">
                <button
                  class="relative w-11 h-6 rounded-full transition-all duration-200 border-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1"
                  :class="[
                    getPerm(user.id, 'is_manager') ? 'bg-[#079272] focus:ring-[#079272]' : 'bg-[#e8e4dc] focus:ring-[#aaa]',
                    user.id === currentUser?.id ? 'opacity-40 cursor-not-allowed' : ''
                  ]"
                  :disabled="patching[user.id] || user.id === currentUser?.id"
                  :title="user.id === currentUser?.id ? 'Não pode alterar suas próprias permissões' : ''"
                  @click="togglePerm(user, 'is_manager')"
                >
                  <svg
                    v-if="patching[user.id]"
                    class="absolute inset-0 m-auto animate-spin text-white"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>

                  <span
                    v-else
                    class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
                    :class="getPerm(user.id, 'is_manager') ? 'translate-x-5' : 'translate-x-0'"
                  />
                </button>
              </div>

              <!-- Toggle Admin -->
              <div class="flex justify-center">
                <button
                  class="relative w-11 h-6 rounded-full transition-all duration-200 border-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1"
                  :class="[
                    getPerm(user.id, 'is_superuser') ? 'bg-[#2464E8] focus:ring-[#2464E8]' : 'bg-[#e8e4dc] focus:ring-[#aaa]',
                    user.id === currentUser?.id ? 'opacity-40 cursor-not-allowed' : ''
                  ]"
                  :disabled="patching[user.id] || user.id === currentUser?.id"
                  @click="togglePerm(user, 'is_superuser')"
                >
                  <svg
                    v-if="patching[user.id]"
                    class="absolute inset-0 m-auto animate-spin text-white"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>

                  <span
                    v-else
                    class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
                    :class="getPerm(user.id, 'is_superuser') ? 'translate-x-5' : 'translate-x-0'"
                  />
                </button>
              </div>

              <!-- Ações -->
              <div class="flex items-center justify-end">
                <template v-if="confirmDeleteId === user.id">
                  <div class="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                    <span class="text-[0.7rem] text-red-600 font-medium">Confirmar?</span>

                    <button
                      class="text-[0.7rem] font-semibold px-2 py-0.5 bg-red-500 text-white rounded cursor-pointer border-none hover:bg-red-600 transition-colors"
                      @click="deleteUser(user.id)"
                    >
                      Sim
                    </button>

                    <button
                      class="text-[0.7rem] text-red-400 hover:text-red-600 border-none bg-none cursor-pointer font-medium"
                      @click="confirmDeleteId = null"
                    >
                      Não
                    </button>
                  </div>
                </template>

                <template v-else>
                  <button
                    class="w-8 h-8 flex items-center justify-center rounded-lg text-[#ccc] hover:bg-red-50 hover:text-red-400 transition-all border-none bg-none cursor-pointer"
                    :class="{ 'opacity-40 cursor-not-allowed': user.id === currentUser?.id }"
                    :disabled="user.id === currentUser?.id || deleting[user.id]"
                    :title="user.id === currentUser?.id ? 'Não pode deletar sua própria conta aqui' : 'Remover usuário'"
                    @click="user.id !== currentUser?.id && (confirmDeleteId = user.id)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </template>
              </div>
            </div>
          </template>
        </div>

        <!-- Paginação -->
        <div v-if="hasMore && !loading" class="flex justify-center mt-6">
          <button
            class="text-sm font-semibold px-8 py-3 border border-[#e8e4dc] bg-white text-[#666] rounded-xl hover:border-[#0d0d0d] hover:text-[#111] transition-all"
            @click="loadMore"
          >
            Carregar mais ({{ totalUsers - users.length }} restantes)
          </button>
        </div>
      </template>
    </div>

    <Transition
      enter-from-class="opacity-0 translate-y-2"
      enter-active-class="transition-all duration-300"
      leave-to-class="opacity-0 translate-y-2"
      leave-active-class="transition-all duration-200"
    >
      <div
        v-if="toast"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium max-w-sm"
        :class="toast.type === 'success'
          ? 'bg-[#0d0d0d] text-white'
          : 'bg-red-600 text-white'"
      >
        <svg
          v-if="toast.type === 'success'"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>

        <svg
          v-else
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>

        {{ toast.msg }}
      </div>
    </Transition>
  </div>
</template>