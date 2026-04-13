<script setup lang="ts">
import { useClubs } from '@/composables/useClubs'
import { useAuth } from '@/composables/useAuth'

const route  = useRoute()
const router = useRouter()
const { currentUser, isAuthenticated } = useAuth()
const clubsApi = useClubs()

// ── State ──────────────────────────────────────────────────────────────────

const club       = ref<any>(null)
const loadingClub = ref(true)
const errorClub   = ref<string | null>(null)

const membership  = ref<any>(null)

// Tabs
type Tab = 'feed' | 'members' | 'assignments'
const activeTab = ref<Tab>('feed')

// Feed
const feedPosts      = ref<any[]>([])
const loadingFeed    = ref(false)
const feedPage       = ref(1)
const feedHasMore    = ref(false)
const FEED_LIMIT     = 15
const newPostContent = ref('')
const newPostTitle   = ref('')
const postingPost    = ref(false)
const showPostForm   = ref(false)

// Members
const members       = ref<any[]>([])
const loadingMembers = ref(false)

// Assignments
const assignments       = ref<any[]>([])
const loadingAssignments = ref(false)
const showAssignmentForm = ref(false)
const newAssignmentTitle = ref('')
const newAssignmentDesc  = ref('')
const newAssignmentDeadline = ref('')
const newAssignmentScore = ref<number | null>(null)
const creatingAssignment = ref(false)

// Submit modal
const submitModalAssignment = ref<any>(null)
const submitContent = ref('')
const submittingAssignment = ref(false)
const submissionResult = ref<any>(null)

// Grade modal
const gradeModal      = ref<any>(null)  // { submission, assignment }
const gradeScore      = ref('')
const gradeFeedback   = ref('')
const grading         = ref(false)

// Join / leave
const joining  = ref(false)
const leaving  = ref(false)

// Settings / code
const showSettingsPanel = ref(false)
const regeneratingCode  = ref(false)

// Auth gate (same pattern as _slug_.vue)
const showAuthModal   = ref(false)
const authGateMessage = ref('')

// ── Computed ──────────────────────────────────────────────────────────────

const isOwner  = computed(() => membership.value?.role === 'OWNER')
const isAdmin  = computed(() => ['OWNER', 'ADMIN'].includes(membership.value?.role))
const isTeacher = computed(() => ['OWNER', 'ADMIN', 'TEACHER'].includes(membership.value?.role))
const isMember = computed(() => membership.value?.status === 'ACTIVE')
const isPending = computed(() => membership.value?.status === 'PENDING')

const canPost        = computed(() => isMember.value)
const canManageMembers = computed(() => isAdmin.value)
const canCreateAssignment = computed(() => isTeacher.value && club.value?.features?.assignmentsEnabled)
const canGrade       = computed(() => isTeacher.value && club.value?.features?.gradingEnabled)

const memberCountDisplay = computed(() => {
  if (!club.value) return ''
  const max = club.value.maxMembers
  return max ? `${club.value.membersCount} / ${max}` : `${club.value.membersCount}`
})

const pendingMembers = computed(() => members.value.filter((m: any) => m.status === 'PENDING'))
const activeMembers  = computed(() => members.value.filter((m: any) => m.status === 'ACTIVE'))

useSeoMeta({
  title: computed(() => club.value ? `${club.value.name} — seConecta` : 'Clube — seConecta'),
})

// ── Bootstrap ─────────────────────────────────────────────────────────────

async function loadClub() {
  loadingClub.value = true
  errorClub.value   = null
  try {
    club.value = await clubsApi.fetchClubBySlug(route.params.slug as string)
    if (isAuthenticated.value) {
      membership.value = await clubsApi.fetchMyMembership(club.value.id)
    }
  } catch (e: any) {
    errorClub.value = e?.message?.includes('not found') ? 'Clube não encontrado.' : 'Erro ao carregar o clube.'
  } finally {
    loadingClub.value = false
  }
}

async function loadFeed(reset = true) {
  if (!club.value) return
  if (reset) { feedPage.value = 1; feedPosts.value = [] }
  loadingFeed.value = true
  try {
    const offset = (feedPage.value - 1) * FEED_LIMIT
    const data = await clubsApi.fetchFeed(club.value.id, FEED_LIMIT, offset)
    if (reset) feedPosts.value = data
    else feedPosts.value.push(...data)
    feedHasMore.value = data.length === FEED_LIMIT
  } catch {/* silent */} finally {
    loadingFeed.value = false
  }
}

async function loadMembers() {
  if (!club.value) return
  loadingMembers.value = true
  try {
    members.value = await clubsApi.fetchMembers(club.value.id, isAdmin.value)
  } catch {/* silent */} finally {
    loadingMembers.value = false
  }
}

async function loadAssignments() {
  if (!club.value) return
  loadingAssignments.value = true
  try {
    assignments.value = await clubsApi.fetchAssignments(club.value.id)
  } catch {/* silent */} finally {
    loadingAssignments.value = false
  }
}

// ── Tab switching ─────────────────────────────────────────────────────────

async function switchTab(tab: Tab) {
  activeTab.value = tab
  if (tab === 'feed' && feedPosts.value.length === 0) await loadFeed(true)
  if (tab === 'members' && members.value.length === 0) await loadMembers()
  if (tab === 'assignments') await loadAssignments()
}

// ── Auth gate ─────────────────────────────────────────────────────────────

function ensureAuth(msg = 'Faça login para continuar.') {
  if (isAuthenticated.value) return true
  authGateMessage.value = msg
  showAuthModal.value = true
  return false
}

function goToLogin() {
  showAuthModal.value = false
  router.push({ path: '/login', query: { redirect: route.fullPath } })
}

// ── Join / Leave ──────────────────────────────────────────────────────────

async function joinClub() {
  if (!ensureAuth('Faça login para entrar no clube.')) return
  joining.value = true
  try {
    const m = await clubsApi.requestJoin(club.value.id)
    membership.value = m
    if (m.status === 'ACTIVE') {
      club.value.membersCount++
      await loadFeed(true)
    }
  } catch (e: any) {
    alert(e?.message || 'Não foi possível entrar no clube.')
  } finally {
    joining.value = false
  }
}

async function leaveClub() {
  if (!confirm('Sair do clube? Você perderá acesso ao conteúdo privado.')) return
  leaving.value = true
  try {
    await clubsApi.removeMember(club.value.id, currentUser.value!.id)
    membership.value = null
    club.value.membersCount = Math.max(0, club.value.membersCount - 1)
    feedPosts.value = []
    members.value   = []
  } catch (e: any) {
    alert(e?.message || 'Não foi possível sair do clube.')
  } finally {
    leaving.value = false
  }
}

// ── Posts ─────────────────────────────────────────────────────────────────

async function submitPost() {
  if (!newPostContent.value.trim() || postingPost.value) return
  if (!ensureAuth('Faça login para publicar.')) return
  postingPost.value = true
  try {
    const post = await clubsApi.createPost(club.value.id, {
      content: newPostContent.value.trim(),
      title: newPostTitle.value.trim() || null,
    })
    feedPosts.value.unshift(post)
    newPostContent.value = ''
    newPostTitle.value   = ''
    showPostForm.value   = false

    club.value.lastActivityAt = new Date().toISOString()
  } catch (e: any) {
    alert(e?.message || 'Não foi possível publicar o post.')
  } finally {
    postingPost.value = false
  }
}

async function deletePost(postId: string) {
  try {
    await clubsApi.deletePost(postId)
    feedPosts.value = feedPosts.value.filter((p: any) => p.id !== postId)
  } catch (e: any) {
    alert(e?.message || 'Não foi possível excluir o post.')
  }
}

async function loadMoreFeed() {
  if (!feedHasMore.value || loadingFeed.value) return
  feedPage.value++
  await loadFeed(false)
}

// ── Member actions ────────────────────────────────────────────────────────

async function approveMember(userId: string) {
  try {
    const updated = await clubsApi.approveMember(club.value.id, userId)
    const idx = members.value.findIndex((m: any) => m.userId === userId)
    if (idx !== -1) members.value[idx] = updated
    club.value.membersCount++
  } catch (e: any) { alert(e?.message) }
}

async function rejectMember(userId: string) {
  try {
    await clubsApi.rejectMember(club.value.id, userId)
    members.value = members.value.filter((m: any) => m.userId !== userId)
  } catch (e: any) { alert(e?.message) }
}

async function removeMember(userId: string) {
  if (!confirm('Remover este membro do clube?')) return
  try {
    await clubsApi.removeMember(club.value.id, userId)
    members.value = members.value.filter((m: any) => m.userId !== userId)
    club.value.membersCount = Math.max(0, club.value.membersCount - 1)
  } catch (e: any) { alert(e?.message) }
}

async function changeRole(userId: string, role: string) {
  try {
    const updated = await clubsApi.changeRole(club.value.id, userId, role)
    const idx = members.value.findIndex((m: any) => m.userId === userId)
    if (idx !== -1) members.value[idx] = updated
  } catch (e: any) { alert(e?.message) }
}

// ── Assignments ───────────────────────────────────────────────────────────

async function createAssignment() {
  if (!newAssignmentTitle.value.trim() || creatingAssignment.value) return
  creatingAssignment.value = true
  try {
    const a = await clubsApi.createAssignment(club.value.id, {
      title:       newAssignmentTitle.value.trim(),
      description: newAssignmentDesc.value.trim() || null,
      deadline:    newAssignmentDeadline.value || null,
      maxScore:    newAssignmentScore.value    || null,
    })
    assignments.value.unshift(a)
    newAssignmentTitle.value    = ''
    newAssignmentDesc.value     = ''
    newAssignmentDeadline.value = ''
    newAssignmentScore.value    = null
    showAssignmentForm.value    = false
  } catch (e: any) {
    alert(e?.message || 'Não foi possível criar a tarefa.')
  } finally {
    creatingAssignment.value = false
  }
}

async function deleteAssignment(assignmentId: string) {
  if (!confirm('Excluir esta tarefa? As submissões também serão removidas.')) return
  try {
    await clubsApi.deleteAssignment(assignmentId)
    assignments.value = assignments.value.filter((a: any) => a.id !== assignmentId)
  } catch (e: any) { alert(e?.message) }
}

// Submit assignment modal
function openSubmitModal(assignment: any) {
  if (!ensureAuth('Faça login para enviar tarefas.')) return
  submitModalAssignment.value = assignment
  submitContent.value = ''
  submissionResult.value = null
}

async function handleSubmitAssignment() {
  if (submittingAssignment.value) return
  submittingAssignment.value = true
  try {
    const result = await clubsApi.submitAssignment(submitModalAssignment.value.id, {
      content: submitContent.value.trim() || null,
    })
    submissionResult.value = result
  } catch (e: any) {
    alert(e?.message || 'Não foi possível enviar a tarefa.')
  } finally {
    submittingAssignment.value = false
  }
}

// Grade modal
async function openGradeModal(assignment: any) {
  gradeModal.value = assignment
  gradeScore.value    = ''
  gradeFeedback.value = ''
  // Load submissions
  try {
    gradeModal.value = { ...assignment, submissions: await clubsApi.fetchSubmissions(assignment.id) }
  } catch {/* silent */}
}

async function handleGrade(submission: any) {
  if (grading.value || !gradeScore.value) return
  grading.value = true
  try {
    const updated = await clubsApi.gradeSubmission(submission.id, Number(gradeScore.value), gradeFeedback.value || undefined)
    // Update in list
    const idx = gradeModal.value.submissions.findIndex((s: any) => s.id === submission.id)
    if (idx !== -1) gradeModal.value.submissions[idx] = updated
    gradeScore.value    = ''
    gradeFeedback.value = ''
  } catch (e: any) {
    alert(e?.message || 'Não foi possível corrigir.')
  } finally {
    grading.value = false
  }
}

// ── Settings ──────────────────────────────────────────────────────────────

async function handleRegenerateCode() {
  if (!confirm('Gerar novo código? O código antigo deixará de funcionar.')) return
  regeneratingCode.value = true
  try {
    const updated = await clubsApi.regenerateCode(club.value.id)
    club.value.joinCode = updated.joinCode
  } catch (e: any) {
    alert(e?.message)
  } finally {
    regeneratingCode.value = false
  }
}

const copySuccess = ref(false)
function copyJoinCode() {
  navigator.clipboard.writeText(club.value?.joinCode ?? '')
  copySuccess.value = true
  setTimeout(() => { copySuccess.value = false }, 2000)
}

// ── Lifecycle ─────────────────────────────────────────────────────────────

watch(() => route.params.slug, loadClub)

onMounted(async () => {
  await loadClub()
  if (club.value) await loadFeed(true)
})

// Date helpers
function fmtDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtDeadline(d: string | null) {
  if (!d) return ''
  const dt = new Date(d)
  const expired = dt < new Date()
  const label = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  return { label, expired }
}

const MODE_LABEL: Record<string, string> = {
  FREE: 'Grupo Livre', CLASSROOM: 'Sala de Aula',
  MENTORSHIP: 'Mentoria', COURSE: 'Curso', COMMUNITY: 'Comunidade',
}
</script>

<template>
  <div class="min-h-screen bg-[#f7f5f0]">

    <!-- Loading -->
    <div v-if="loadingClub" class="animate-pulse">
      <div class="bg-[#0c1b32] pt-24 px-8 pb-0 min-h-[260px]">
        <div class="max-w-[960px] mx-auto space-y-4">
          <div class="h-4 w-24 bg-white/10 rounded"></div>
          <div class="h-8 w-1/2 bg-white/10 rounded-lg"></div>
          <div class="h-4 w-1/3 bg-white/10 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="errorClub" class="min-h-screen flex flex-col items-center justify-center gap-5 text-center px-8">
      <div class="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p class="text-[#555]">{{ errorClub }}</p>
      <div class="flex gap-3">
        <button class="text-sm font-semibold px-5 py-2 bg-[#0d0d0d] text-white rounded-lg hover:bg-[#079272] transition-colors border-none cursor-pointer" @click="loadClub">Tentar novamente</button>
        <button class="text-sm font-semibold px-5 py-2 bg-white border border-[#e8e4dc] text-[#555] rounded-lg cursor-pointer hover:border-[#0d0d0d] transition-colors" @click="router.push('/clubs')">Ver clubes</button>
      </div>
    </div>

    <template v-else-if="club">

      <!-- Club Header -->
      <header class="relative overflow-hidden bg-[#0c1b32] pt-20 px-8 pb-0">
        <!-- Cover image backdrop -->
        <div
          v-if="club.coverImage"
          class="absolute inset-0 bg-cover bg-center opacity-10"
          :style="{ backgroundImage: `url(${club.coverImage})` }"
        ></div>
        <div class="absolute inset-0 bg-gradient-to-b from-transparent to-[#0c1b32]"></div>

        <div class="relative z-10 max-w-[960px] mx-auto">
          <!-- Back -->
          <button
            class="inline-flex items-center gap-1.5 text-[0.75rem] text-white/30 border-none bg-transparent cursor-pointer hover:text-white/80 transition-colors mb-6"
            @click="router.push('/clubs')"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Todos os clubes
          </button>

          <div class="flex items-start gap-5 mb-6 flex-wrap">
            <!-- Icon / cover -->
            <div
              class="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-lg"
              :style="{ background: club.themeColor ? club.themeColor + '33' : 'rgba(255,255,255,0.08)' }"
            >
              {{ club.icon || '📚' }}
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-2">
                <span class="text-[0.68rem] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                  {{ MODE_LABEL[club.mode] ?? club.mode }}
                </span>
                <span v-if="club.level" class="text-[0.68rem] text-white/30 capitalize">{{ club.level }}</span>
                <span v-if="club.language" class="text-[0.68rem] text-white/30">{{ club.language }}</span>
              </div>

              <h1 class="text-[clamp(1.5rem,4vw,2.4rem)] font-extrabold text-white leading-tight tracking-[-0.02em] mb-2">
                {{ club.name }}
              </h1>

              <p v-if="club.shortDescription" class="text-sm font-light text-white/40 max-w-[480px] leading-relaxed">
                {{ club.shortDescription }}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 flex-shrink-0 mt-1">
              <!-- Settings (owner/admin) -->
              <button
                v-if="isAdmin"
                class="w-9 h-9 rounded-xl flex items-center justify-center text-white/50 border border-white/10 hover:bg-white/10 hover:text-white transition-colors cursor-pointer bg-transparent"
                @click="showSettingsPanel = !showSettingsPanel"
                title="Configurações"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>

              <!-- Join / Leave / Pending -->
              <button
                v-if="!isMember && !isPending"
                :disabled="joining"
                class="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#079272] text-white text-[0.85rem] font-semibold border-none cursor-pointer hover:bg-[#068060] transition-colors disabled:opacity-50"
                @click="joinClub"
              >
                <svg v-if="joining" class="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                {{ joining ? 'Entrando...' : (club.requireApproval ? 'Solicitar entrada' : 'Entrar no clube') }}
              </button>

              <div v-else-if="isPending" class="text-[0.82rem] font-semibold text-amber-300 border border-amber-500/30 rounded-xl px-3 py-2">
                ⏳ Aguardando aprovação
              </div>

              <button
                v-else-if="isMember && !isOwner"
                :disabled="leaving"
                class="text-[0.78rem] text-white/40 border border-white/10 rounded-xl px-3 py-2 hover:border-red-400 hover:text-red-300 transition-colors cursor-pointer bg-transparent"
                @click="leaveClub"
              >
                {{ leaving ? 'Saindo...' : 'Sair do clube' }}
              </button>
            </div>
          </div>

          <!-- Stats bar -->
          <div class="flex items-center gap-5 py-3 border-t border-white/10 text-[0.72rem] text-white/30 flex-wrap">
            <span class="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
              {{ memberCountDisplay }} membros
            </span>
            <span v-if="club.tags?.length" class="flex gap-1 flex-wrap">
              <span v-for="t in club.tags.slice(0,4)" :key="t" class="px-1.5 py-0.5 bg-white/8 rounded-full">#{{ t }}</span>
            </span>
            <span v-if="club.lastActivityAt" class="ml-auto">
              Última atividade {{ fmtDate(club.lastActivityAt) }}
            </span>
          </div>

          <!-- Settings panel inline (admin only) -->
          <Transition name="slide-down">
            <div v-if="showSettingsPanel && isAdmin" class="border-t border-white/10 pt-5 pb-6 flex flex-col gap-4">
              <h3 class="text-[0.8rem] font-bold text-white/50 tracking-[0.1em] uppercase">Configurações do clube</h3>
              <div class="flex items-center gap-3 flex-wrap">
                <div class="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2.5 border border-white/10">
                  <span class="text-[0.78rem] text-white/40">Código de convite:</span>
                  <code class="text-[0.95rem] font-bold text-white tracking-[0.2em]">{{ club.joinCode }}</code>
                  <button
                    class="text-[0.72rem] font-semibold text-[#079272] border-none bg-transparent cursor-pointer hover:text-white transition-colors"
                    @click="copyJoinCode"
                  >
                    {{ copySuccess ? '✓ Copiado' : 'Copiar' }}
                  </button>
                </div>
                <button
                  :disabled="regeneratingCode"
                  class="text-[0.78rem] font-semibold px-3 py-2 rounded-xl border border-white/10 text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer bg-transparent disabled:opacity-40"
                  @click="handleRegenerateCode"
                >
                  <svg v-if="regeneratingCode" class="animate-spin inline mr-1" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Regenerar código
                </button>
                <NuxtLink
                  :to="`/clubs/${club.slug}/settings`"
                  class="text-[0.78rem] font-semibold px-3 py-2 rounded-xl border border-white/10 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Editar clube →
                </NuxtLink>
              </div>
            </div>
          </Transition>

          <!-- Tab bar -->
          <div class="flex gap-1 -mb-px mt-4">
            <button
              v-for="tab in [
                { key: 'feed',        label: 'Feed' },
                { key: 'members',     label: `Membros${pendingMembers.length && isAdmin ? ` (${pendingMembers.length}!)` : ''}` },
                { key: 'assignments', label: 'Tarefas', show: club.features?.assignmentsEnabled },
              ].filter(t => t.show !== false)"
              :key="tab.key"
              class="px-5 py-2.5 text-[0.82rem] font-semibold transition-all border-none cursor-pointer rounded-t-xl"
              :class="activeTab === tab.key
                ? 'bg-[#f7f5f0] text-[#111]'
                : 'text-white/40 bg-transparent hover:text-white/70'"
              @click="switchTab(tab.key as Tab)"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>
      </header>

      <!-- Tab Content -->
      <div class="max-w-[960px] mx-auto px-4 md:px-8 py-8">

        <!-- ═══ FEED ═══════════════════════════════════════════════════════ -->
        <div v-show="activeTab === 'feed'" class="max-w-[680px] mx-auto flex flex-col gap-5">

          <!-- Pending notice -->
          <div v-if="isPending" class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Sua solicitação está pendente. Aguarde a aprovação de um administrador.
          </div>

          <!-- Create post button -->
          <div v-if="canPost && !showPostForm">
            <button
              class="w-full flex items-center gap-3 px-4 py-3 bg-white border border-[#e8e4dc] rounded-xl text-[0.88rem] text-[#aaa] hover:border-[#079272] hover:text-[#555] transition-all cursor-pointer text-left"
              @click="showPostForm = true"
            >
              <div class="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#079272] to-[#2464E8] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                <img v-if="currentUser?.profile_picture_url" :src="currentUser.profile_picture_url" class="w-full h-full object-cover" />
                <span v-else>{{ (currentUser?.full_name || currentUser?.username || '?')[0].toUpperCase() }}</span>
              </div>
              Compartilhe algo com o clube...
            </button>
          </div>

          <!-- Post form -->
          <Transition name="fade">
            <div v-if="showPostForm && canPost" class="bg-white border border-[#e8e4dc] rounded-2xl p-5 flex flex-col gap-3">
              <input
                v-model="newPostTitle"
                type="text"
                placeholder="Título (opcional)"
                class="h-10 px-4 bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[0.9rem] font-semibold text-[#111] outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all"
              />
              <textarea
                v-model="newPostContent"
                rows="4"
                placeholder="Escreva seu post..."
                class="px-4 py-3 bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[0.88rem] text-[#111] outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all resize-none"
                autofocus
              ></textarea>
              <div class="flex justify-end gap-2">
                <button class="text-[0.8rem] px-4 py-2 rounded-xl border border-[#e8e4dc] text-[#666] cursor-pointer hover:bg-[#f7f5f0] transition-colors bg-white" @click="showPostForm = false; newPostContent = ''; newPostTitle = ''">Cancelar</button>
                <button
                  :disabled="!newPostContent.trim() || postingPost"
                  class="flex items-center gap-2 text-[0.8rem] px-5 py-2 rounded-xl bg-[#079272] text-white font-semibold border-none cursor-pointer hover:bg-[#068060] transition-colors disabled:opacity-40"
                  @click="submitPost"
                >
                  <svg v-if="postingPost" class="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  {{ postingPost ? 'Publicando...' : 'Publicar' }}
                </button>
              </div>
            </div>
          </Transition>

          <!-- Loading skeletons -->
          <div v-if="loadingFeed && feedPosts.length === 0" class="flex flex-col gap-4">
            <div v-for="i in 3" :key="i" class="bg-white rounded-xl border border-[#e8e4dc] p-5 animate-pulse flex flex-col gap-3">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-[#f0ece5]"></div>
                <div class="h-3 w-28 bg-[#f0ece5] rounded"></div>
              </div>
              <div class="h-3.5 w-full bg-[#f0ece5] rounded"></div>
              <div class="h-3.5 w-4/5 bg-[#f0ece5] rounded"></div>
            </div>
          </div>

          <!-- Empty feed -->
          <div v-else-if="!loadingFeed && feedPosts.length === 0" class="py-16 text-center">
            <div class="w-14 h-14 rounded-full bg-[#f7f5f0] flex items-center justify-center mx-auto mb-4 text-[#aaa]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p class="text-[#888] font-semibold mb-1">Nenhum post ainda</p>
            <p class="text-sm text-[#aaa]">{{ canPost ? 'Seja o primeiro a publicar algo!' : 'Entre no clube para ver o conteúdo.' }}</p>
          </div>

          <!-- Posts -->
          <div v-else class="flex flex-col gap-4">
            <ClubsClubPostItem
              v-for="post in feedPosts"
              :key="post.id"
              :post="post"
              :can-manage="isAdmin"
              :current-user-id="currentUser?.id"
              @delete="deletePost"
            />

            <!-- Load more -->
            <div v-if="feedHasMore" class="flex justify-center">
              <button
                :disabled="loadingFeed"
                class="text-sm font-semibold px-6 py-2.5 border border-[#e8e4dc] text-[#666] rounded-xl hover:border-[#079272] hover:text-[#079272] transition-all cursor-pointer bg-transparent disabled:opacity-50"
                @click="loadMoreFeed"
              >
                {{ loadingFeed ? 'Carregando...' : 'Ver mais' }}
              </button>
            </div>
          </div>
        </div>

        <!-- ═══ MEMBERS ════════════════════════════════════════════════════ -->
        <div v-show="activeTab === 'members'" class="max-w-[680px] mx-auto">

          <!-- Loading -->
          <div v-if="loadingMembers" class="flex flex-col gap-3 animate-pulse">
            <div v-for="i in 5" :key="i" class="flex items-center gap-3 py-3 border-b border-[#f7f5f0]">
              <div class="w-9 h-9 rounded-full bg-[#f0ece5]"></div>
              <div class="flex-1 space-y-1.5">
                <div class="h-3 w-32 bg-[#f0ece5] rounded"></div>
                <div class="h-2.5 w-20 bg-[#f0ece5] rounded"></div>
              </div>
            </div>
          </div>

          <template v-else>
            <!-- Pending section (admin only) -->
            <div v-if="isAdmin && pendingMembers.length > 0" class="mb-8">
              <div class="flex items-center gap-2 mb-3">
                <h3 class="text-[0.82rem] font-bold tracking-[0.08em] uppercase text-amber-600">Aguardando aprovação</h3>
                <span class="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600">{{ pendingMembers.length }}</span>
              </div>
              <div class="bg-amber-50/50 border border-amber-100 rounded-xl px-4">
                <ClubsClubMemberItem
                  v-for="m in pendingMembers"
                  :key="m.id"
                  :member="m"
                  :can-manage="canManageMembers"
                  :current-user-id="currentUser?.id"
                  @approve="approveMember"
                  @reject="rejectMember"
                  @remove="removeMember"
                  @change-role="changeRole"
                />
              </div>
            </div>

            <!-- Active members -->
            <div>
              <h3 class="text-[0.82rem] font-bold tracking-[0.08em] uppercase text-[#aaa] mb-3">
                Membros ativos · {{ activeMembers.length }}
              </h3>
              <div class="bg-white border border-[#e8e4dc] rounded-xl px-4">
                <ClubsClubMemberItem
                  v-for="m in activeMembers"
                  :key="m.id"
                  :member="m"
                  :can-manage="canManageMembers"
                  :current-user-id="currentUser?.id"
                  @remove="removeMember"
                  @change-role="changeRole"
                />
              </div>
            </div>
          </template>
        </div>

        <!-- ═══ ASSIGNMENTS ════════════════════════════════════════════════ -->
        <div v-show="activeTab === 'assignments'" class="max-w-[680px] mx-auto flex flex-col gap-5">

          <!-- Create assignment (teacher+) -->
          <div v-if="canCreateAssignment && !showAssignmentForm">
            <button
              class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#079272] text-white text-[0.85rem] font-semibold border-none cursor-pointer hover:bg-[#068060] transition-colors"
              @click="showAssignmentForm = true"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nova tarefa
            </button>
          </div>

          <!-- Create assignment form -->
          <Transition name="fade">
            <div v-if="showAssignmentForm" class="bg-white border border-[#e8e4dc] rounded-2xl p-5 flex flex-col gap-4">
              <h3 class="text-[0.9rem] font-bold text-[#111]">Nova tarefa</h3>

              <input v-model="newAssignmentTitle" type="text" placeholder="Título da tarefa *" class="h-10 px-4 bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[0.9rem] text-[#111] outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all" />
              <textarea v-model="newAssignmentDesc" rows="3" placeholder="Descrição e instruções..." class="px-4 py-3 bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[0.88rem] text-[#111] outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all resize-none"></textarea>

              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1">
                  <label class="text-[0.75rem] font-semibold text-[#777]">Prazo</label>
                  <input v-model="newAssignmentDeadline" type="datetime-local" class="h-10 px-3 bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[0.85rem] text-[#111] outline-none focus:ring-2 focus:ring-[#079272] transition-all" />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-[0.75rem] font-semibold text-[#777]">Nota máxima</label>
                  <input v-model.number="newAssignmentScore" type="number" min="0" placeholder="Ex: 10" class="h-10 px-3 bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[0.85rem] text-[#111] outline-none focus:ring-2 focus:ring-[#079272] transition-all" />
                </div>
              </div>

              <div class="flex justify-end gap-2">
                <button class="text-[0.8rem] px-4 py-2 rounded-xl border border-[#e8e4dc] text-[#666] cursor-pointer hover:bg-[#f7f5f0] transition-colors bg-white" @click="showAssignmentForm = false">Cancelar</button>
                <button :disabled="!newAssignmentTitle.trim() || creatingAssignment" class="flex items-center gap-2 text-[0.8rem] px-5 py-2 rounded-xl bg-[#079272] text-white font-semibold border-none cursor-pointer hover:bg-[#068060] disabled:opacity-40 transition-colors" @click="createAssignment">
                  <svg v-if="creatingAssignment" class="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  {{ creatingAssignment ? 'Criando...' : 'Criar tarefa' }}
                </button>
              </div>
            </div>
          </Transition>

          <!-- Loading -->
          <div v-if="loadingAssignments" class="flex flex-col gap-3 animate-pulse">
            <div v-for="i in 3" :key="i" class="bg-white rounded-xl border border-[#e8e4dc] p-5 h-28"></div>
          </div>

          <!-- Empty -->
          <div v-else-if="assignments.length === 0" class="py-14 text-center">
            <p class="text-[#888] font-semibold">Nenhuma tarefa ainda</p>
            <p class="text-sm text-[#aaa] mt-1">{{ canCreateAssignment ? 'Crie a primeira tarefa do clube.' : 'O professor ainda não criou tarefas.' }}</p>
          </div>

          <!-- Assignment cards -->
          <div v-else class="flex flex-col gap-4">
            <div
              v-for="a in assignments"
              :key="a.id"
              class="bg-white border border-[#e8e4dc] rounded-2xl p-5 flex flex-col gap-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <h4 class="text-[0.95rem] font-bold text-[#111] mb-1">{{ a.title }}</h4>
                  <p v-if="a.description" class="text-[0.82rem] text-[#777] leading-relaxed">{{ a.description }}</p>
                </div>
                <button v-if="canCreateAssignment" class="w-7 h-7 rounded-lg flex items-center justify-center text-[#bbb] hover:bg-red-50 hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer" @click="deleteAssignment(a.id)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>

              <div class="flex items-center gap-4 text-[0.75rem] text-[#aaa] flex-wrap pt-2 border-t border-[#f7f5f0]">
                <span v-if="a.deadline">
                  <span :class="fmtDeadline(a.deadline)?.expired ? 'text-red-500 font-semibold' : 'text-[#079272]'">
                    {{ fmtDeadline(a.deadline)?.expired ? '⚠ Prazo encerrado' : '📅 Prazo:' }}
                    {{ fmtDeadline(a.deadline)?.label }}
                  </span>
                </span>
                <span v-if="a.maxScore">Nota máx: {{ a.maxScore }}</span>
                <span v-if="a.creator">Por {{ a.creator.fullName || a.creator.username }}</span>
              </div>

              <div class="flex gap-2 flex-wrap">
                <!-- Student: submit -->
                <button
                  v-if="isMember && !isTeacher"
                  class="text-[0.78rem] font-semibold px-4 py-2 rounded-xl bg-[#079272] text-white border-none cursor-pointer hover:bg-[#068060] transition-colors"
                  @click="openSubmitModal(a)"
                >
                  Enviar tarefa
                </button>

                <!-- Teacher: view submissions -->
                <button
                  v-if="canGrade"
                  class="text-[0.78rem] font-semibold px-4 py-2 rounded-xl border border-[#e8e4dc] text-[#555] bg-white cursor-pointer hover:border-[#079272] hover:text-[#079272] transition-colors"
                  @click="openGradeModal(a)"
                >
                  Ver submissões
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ Submit Assignment Modal ══════════════════════════════════════ -->
      <Transition name="modal-fade">
        <div v-if="submitModalAssignment" class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/45 backdrop-blur-sm" @click="submitModalAssignment = null; submissionResult = null"></div>
          <div class="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-[#e8e4dc] overflow-hidden">
            <div class="p-6">
              <h3 class="text-[1rem] font-bold text-[#111] mb-1">{{ submitModalAssignment.title }}</h3>
              <p v-if="submitModalAssignment.description" class="text-sm text-[#777] mb-4">{{ submitModalAssignment.description }}</p>

              <div v-if="!submissionResult">
                <textarea
                  v-model="submitContent"
                  rows="5"
                  placeholder="Escreva sua resposta aqui..."
                  class="w-full px-4 py-3 bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[0.88rem] text-[#111] outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all resize-none mb-4"
                ></textarea>
                <div class="flex justify-end gap-2">
                  <button class="text-[0.82rem] px-4 py-2 rounded-xl border border-[#e8e4dc] text-[#666] cursor-pointer bg-white" @click="submitModalAssignment = null">Cancelar</button>
                  <button :disabled="submittingAssignment" class="flex items-center gap-2 text-[0.82rem] px-5 py-2 rounded-xl bg-[#079272] text-white font-semibold border-none cursor-pointer disabled:opacity-40 hover:bg-[#068060]" @click="handleSubmitAssignment">
                    <svg v-if="submittingAssignment" class="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    {{ submittingAssignment ? 'Enviando...' : 'Enviar' }}
                  </button>
                </div>
              </div>

              <div v-else class="text-center py-4">
                <div class="w-12 h-12 rounded-full bg-[#f0faf7] flex items-center justify-center mx-auto mb-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#079272" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p class="font-bold text-[#111] mb-1">Tarefa enviada!</p>
                <p class="text-sm text-[#777]">Aguarde a correção do professor.</p>
                <button class="mt-4 text-[0.82rem] px-5 py-2 rounded-xl bg-[#0d0d0d] text-white font-semibold border-none cursor-pointer hover:bg-[#079272]" @click="submitModalAssignment = null; submissionResult = null">Fechar</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- ══ Grade Submissions Modal ════════════════════════════════════ -->
      <Transition name="modal-fade">
        <div v-if="gradeModal" class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/45 backdrop-blur-sm" @click="gradeModal = null"></div>
          <div class="relative z-10 w-full max-w-2xl max-h-[85vh] rounded-2xl bg-white shadow-2xl border border-[#e8e4dc] overflow-hidden flex flex-col">
            <div class="p-5 border-b border-[#e8e4dc] flex items-center justify-between">
              <h3 class="font-bold text-[#111]">Submissões — {{ gradeModal.title }}</h3>
              <button class="w-7 h-7 rounded-lg flex items-center justify-center text-[#aaa] hover:bg-[#f7f5f0] transition-colors cursor-pointer border-none bg-transparent" @click="gradeModal = null">✕</button>
            </div>

            <div class="overflow-y-auto flex-1 p-5 flex flex-col gap-4">
              <div v-if="!gradeModal.submissions?.length" class="py-10 text-center text-[#aaa] text-sm">Nenhuma submissão ainda.</div>

              <div v-for="sub in gradeModal.submissions" :key="sub.id" class="border border-[#e8e4dc] rounded-xl p-4 flex flex-col gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#079272] to-[#2464E8] flex items-center justify-center text-white text-xs font-bold">
                    <img v-if="sub.student?.profilePictureUrl" :src="sub.student.profilePictureUrl" class="w-full h-full object-cover" />
                    <span v-else>{{ (sub.student?.fullName || sub.student?.username || '?')[0].toUpperCase() }}</span>
                  </div>
                  <div>
                    <div class="text-[0.85rem] font-semibold text-[#111]">{{ sub.student?.fullName || sub.student?.username }}</div>
                    <div class="text-[0.7rem] text-[#aaa]">Enviado {{ fmtDate(sub.submittedAt) }}</div>
                  </div>
                  <div v-if="sub.score !== null" class="ml-auto text-[0.82rem] font-bold text-[#079272]">
                    {{ sub.score }}<span v-if="gradeModal.maxScore"> / {{ gradeModal.maxScore }}</span>
                  </div>
                </div>

                <p v-if="sub.content" class="text-[0.85rem] text-[#444] leading-relaxed bg-[#f7f5f0] rounded-lg px-3 py-2 whitespace-pre-wrap">{{ sub.content }}</p>
                <p v-if="sub.feedback" class="text-[0.8rem] text-[#079272] italic">Feedback: {{ sub.feedback }}</p>

                <!-- Grade form (if not graded yet or can re-grade) -->
                <div v-if="canGrade" class="flex items-center gap-2 flex-wrap pt-2 border-t border-[#f7f5f0]">
                  <input v-model="gradeScore" type="number" min="0" :max="gradeModal.maxScore || undefined" placeholder="Nota" class="w-20 h-9 px-3 bg-[#f7f5f0] border border-[#e8e4dc] rounded-lg text-[0.85rem] text-[#111] outline-none focus:ring-2 focus:ring-[#079272] transition-all" />
                  <input v-model="gradeFeedback" type="text" placeholder="Feedback (opcional)" class="flex-1 h-9 px-3 bg-[#f7f5f0] border border-[#e8e4dc] rounded-lg text-[0.85rem] text-[#111] outline-none focus:ring-2 focus:ring-[#079272] transition-all min-w-[120px]" />
                  <button :disabled="!gradeScore || grading" class="h-9 px-4 rounded-lg bg-[#079272] text-white text-[0.8rem] font-semibold border-none cursor-pointer disabled:opacity-40 hover:bg-[#068060]" @click="handleGrade(sub)">
                    {{ grading ? '...' : (sub.score !== null ? 'Reclassificar' : 'Classificar') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

    </template>

    <!-- Auth gate modal (same pattern as _slug_.vue) -->
    <Transition name="modal-fade">
      <div v-if="showAuthModal" class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/45 backdrop-blur-sm" @click="showAuthModal = false"></div>
        <div class="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#e8e4dc]">
          <div class="p-6 sm:p-7">
            <div class="w-11 h-11 rounded-2xl bg-[#f0faf7] flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#079272" stroke-width="2">
                <path d="M12 11c1.657 0 3-1.567 3-3.5S13.657 4 12 4 9 5.567 9 7.5 10.343 11 12 11z"/>
                <path d="M5 20v-1c0-2.761 3.134-5 7-5s7 2.239 7 5v1"/>
              </svg>
            </div>
            <h3 class="text-[1.1rem] font-bold text-[#111] mb-2">Entre para interagir</h3>
            <p class="text-sm text-[#666] leading-relaxed">{{ authGateMessage }}</p>
            <div class="mt-6 flex flex-col sm:flex-row gap-3">
              <button class="h-11 px-4 rounded-xl border border-[#e8e4dc] text-[#666] font-semibold bg-white hover:bg-[#fafaf9] transition-colors cursor-pointer" @click="showAuthModal = false">Agora não</button>
              <button class="h-11 px-4 rounded-xl bg-[#0d0d0d] text-white font-semibold hover:bg-[#079272] transition-colors cursor-pointer border-none" @click="goToLogin">Ir para login</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }

.slide-down-enter-active, .slide-down-leave-active { transition: opacity 0.2s, max-height 0.3s; overflow: hidden; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; max-height: 0; }
.slide-down-enter-to, .slide-down-leave-from { opacity: 1; max-height: 300px; }
</style>
