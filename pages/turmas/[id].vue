<template>
  <main class="classroom-page">
    <!-- Topbar -->
    <section class="topbar">
      <button class="btn-ghost" @click="navigateTo('/turmas')">
        <i class="ti ti-arrow-left" aria-hidden="true"></i> Turmas
      </button>
      <div class="topbar-actions">
        <button class="btn-ghost" @click="navigateTo('/turmas/minhas')">Minhas turmas</button>
        <button
          v-if="turma && isCurrentOwner"
          class="btn-edit"
          @click="navigateTo(`/turmas/mentor/${turma.id}/editar`)">
          Editar turma
        </button>
      </div>
    </section>

    <section v-if="loading" class="shell loading-card">Carregando turma...</section>
    <section v-else-if="error" class="shell error-card">
      <h1>Não foi possível carregar esta turma</h1>
      <p>{{ error }}</p>
      <button class="btn-primary" @click="loadPage">Tentar novamente</button>
    </section>

    <template v-else-if="turma">
      <!-- Hero -->
      <section class="hero shell">
        <div v-if="turma.cover_url" class="hero-banner">
          <img :src="turma.cover_url" alt="Capa da turma" />
        </div>

        <div class="hero-inner">
          <div class="hero-copy">
            <div class="mentor-row">
              <div class="avatar">
                <img v-if="mentorAccount.avatarUrl" :src="mentorAccount.avatarUrl" alt="" />
                <span v-else>{{ mentorAccount.initials }}</span>
              </div>
              <NuxtLink v-if="mentorAccount.profileUrl" :to="mentorAccount.profileUrl" class="mentor-name mentor-link">
                {{ mentorAccount.name }}
              </NuxtLink>
              <span v-else class="mentor-name">{{ mentorAccount.name }}</span>
            </div>

            <p class="eyebrow">{{ categoryLabel(turma.category) }}</p>
            <h1 class="hero-title">{{ turma.title }}</h1>
            <p class="hero-desc">{{ turma.description || turma.short_description || 'Sem descrição disponível.' }}</p>

            <div class="meta-pills">
              <span class="pill"><i class="ti ti-chart-bar" aria-hidden="true"></i>{{ levelLabel(turma.level) }}</span>
              <span class="pill"><i class="ti ti-video" aria-hidden="true"></i>{{ formatLabel(turma.format) }}</span>
              <span class="pill"><i class="ti ti-calendar-event" aria-hidden="true"></i>{{ turma.number_of_meetings || 0 }} encontros</span>
              <span class="pill"><i class="ti ti-users" aria-hidden="true"></i>{{ availableSeats }} vagas livres</span>
            </div>
          </div>

          <aside class="action-col">
            <div class="status-row">
              <span :class="['status-pill', `status-pill--${String(turma.status).toLowerCase()}`]">
                {{ statusLabel(turma.status) }}
              </span>
              <span v-if="myEnrollment" class="enrollment-pill">
                {{ enrollmentStatusLabel(myEnrollment.status) }}
              </span>
            </div>

            <div class="col-divider"></div>

            <div class="capacity-block">
              <div class="capacity-label">Vagas ocupadas</div>
              <div class="capacity-num">
                {{ turma.current_enrollment_count || 0 }}<span>/{{ turma.class_size || 0 }}</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" :style="{ width: `${fillPercentage}%` }" />
              </div>
              <div class="seats-note">{{ availableSeats }} vagas disponíveis</div>
            </div>

            <div class="col-divider"></div>

            <div v-if="isCurrentOwner" class="owner-actions">
              <p class="small-note">Você é mentor/criador desta turma. Por isso, não pode se inscrever nela como estudante.</p>
              <button class="btn-primary full" @click="navigateTo(`/turmas/mentor/${turma.id}/editar`)">Editar turma</button>
              <button class="btn-secondary full" @click="navigateTo(`/turmas/mentor/${turma.id}`)">Gerenciar turma</button>
            </div>

            <button v-else-if="canRequestEnrollment" class="btn-primary full" @click="showEnrollmentForm = true">
              {{ turma.enrollment_mode === 'APPLICATION' ? 'Aplicar para a turma' : 'Entrar na turma' }}
            </button>
            <button v-else-if="myEnrollment && canLeave" class="btn-leave full" :disabled="submittingEnrollment" @click="leaveTurma">
              Sair da turma
            </button>
            <p v-else class="small-note">{{ enrollmentHint }}</p>
          </aside>
        </div>
      </section>

      <!-- Enrollment Panel -->
      <section v-if="showEnrollmentForm && canRequestEnrollment" class="shell enroll-panel">
        <div>
          <p class="eyebrow">Inscrição</p>
          <h2>{{ turma.enrollment_mode === 'APPLICATION' ? 'Conte por que quer entrar' : 'Confirmar entrada' }}</h2>
          <p>{{ turma.enrollment_mode === 'APPLICATION' ? 'Essa turma usa aplicação...' : 'Essa turma está aberta...' }}</p>
        </div>
        <form @submit.prevent="submitEnrollment">
          <label>
            <span>Nível de compromisso</span>
            <select v-model="enrollmentForm.commitment_level">
              <option value="EXPLORING">Explorando — quero conhecer e acompanhar</option>
              <option value="ACTIVE">Ativo — quero participar com frequência</option>
              <option value="SERIOUS_PREPARATION">Preparação séria — quero me dedicar bastante</option>
            </select>
          </label>
          <template v-if="turma.enrollment_mode === 'APPLICATION'">
            <label v-for="question in normalizedApplicationQuestions" :key="question.key">
              <span>{{ question.label }}<small v-if="question.required">obrigatória</small></span>
              <textarea v-if="question.type === 'textarea' || question.type === 'text'" v-model="applicationAnswers[question.key]" rows="3" :placeholder="question.placeholder || 'Escreva sua resposta...'" />
              <input v-else v-model="applicationAnswers[question.key]" type="text" :placeholder="question.placeholder || 'Sua resposta'" />
            </label>
          </template>
          <label>
            <span>Observação opcional</span>
            <textarea v-model="enrollmentForm.student_note" rows="3" placeholder="Algo que o mentor deveria saber?" />
          </label>
          <p v-if="enrollmentError" class="error-message">{{ enrollmentError }}</p>
          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="showEnrollmentForm = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="submittingEnrollment">
              {{ submittingEnrollment ? 'Enviando...' : turma.enrollment_mode === 'APPLICATION' ? 'Enviar aplicação' : 'Confirmar entrada' }}
            </button>
          </div>
        </form>
      </section>

      <!-- Main Content -->
      <section class="shell content-area">
        <div class="tab-bar">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeView === 'updates' }"
            @click="activeView = 'updates'">
            Avisos e materiais
          </button>
          <button
            type="button"
            class="tab-btn"
            :class="{ active: activeView === 'agenda' }"
            @click="activeView = 'agenda'">
            Agenda
          </button>
        </div>

        <!-- Avisos & Materiais -->
        <template v-if="activeView === 'updates'">
          <div class="section-inner">
            <div class="section-head">
              <div>
                <p class="section-label">Mural</p>
                <h2 class="section-title">Avisos</h2>
              </div>
              <button v-if="canManageClass" class="btn-new" @click="openAnnouncementModal()">
                <i class="ti ti-plus" aria-hidden="true"></i> Novo aviso
              </button>
            </div>

            <p v-if="announcements.length === 0" class="feed-empty">Nenhum aviso ainda.</p>
            <article v-for="announcement in announcements" :key="announcement.id" class="post-card">
              <div class="post-top">
                <div class="avatar avatar--sm">
                  <img v-if="mentorAccount.avatarUrl" :src="mentorAccount.avatarUrl" alt="" />
                  <span v-else>{{ mentorAccount.initials }}</span>
                </div>
                <NuxtLink v-if="mentorAccount.profileUrl" :to="mentorAccount.profileUrl" class="post-author-link">{{ mentorAccount.name }}</NuxtLink>
                <span v-else class="post-author">{{ mentorAccount.name }}</span>
                <span v-if="announcement.pinned" class="pin-badge">
                  <i class="ti ti-pin" aria-hidden="true"></i> Fixado
                </span>
                <span class="post-time">{{ announcement.created_at ? dateTimeLabel(announcement.created_at) : 'Agora' }}</span>
              </div>
              <div class="post-headline">
                <strong class="post-title-text">{{ announcement.title || 'Aviso' }}</strong>
                <span class="type-chip">{{ announcementTypeLabel(announcement.announcement_type) }}</span>
              </div>
              <p class="post-content">{{ announcement.content }}</p>
              <div v-if="canManageClass" class="post-actions">
                <button type="button" class="btn-secondary btn--sm" @click="openAnnouncementModal(announcement)">Editar</button>
                <button type="button" class="btn-danger btn--sm" :disabled="submittingAnnouncementAction" @click="deleteAnnouncement(announcement.id)">Excluir</button>
              </div>
            </article>
          </div>

          <div class="resources-section">
            <div class="section-head">
              <div>
                <p class="section-label">Recursos</p>
                <h2 class="section-title">Materiais</h2>
              </div>
            </div>
            <p v-if="resources.length === 0" class="feed-empty">Nenhum recurso ainda.</p>
            <a v-for="resource in resources" :key="resource.id" :href="resource.url" target="_blank" rel="noopener noreferrer" class="resource-item">
              <i class="ti ti-file" aria-hidden="true"></i>{{ resource.title }}
            </a>
          </div>
        </template>

        <!-- Agenda -->
        <template v-else>
          <div class="section-inner">
            <div class="section-head">
              <div>
                <p class="section-label">Encontros</p>
                <h2 class="section-title">Agenda da turma</h2>
              </div>
              <button v-if="canManageClass" class="btn-new" @click="openMeetingModal()">
                <i class="ti ti-plus" aria-hidden="true"></i> Novo encontro
              </button>
            </div>

            <p v-if="meetings.length === 0" class="feed-empty">Nenhum encontro publicado ainda.</p>
            <article v-for="meeting in meetings" :key="meeting.id" class="meeting-row">
              <div class="meeting-date-box">
                <strong class="meeting-day">{{ dayOfMonth(meeting.starts_at) }}</strong>
                <span class="meeting-month">{{ monthLabel(meeting.starts_at) }}</span>
              </div>
              <div class="meeting-body">
                <div class="meeting-head-row">
                  <h3 class="meeting-name">{{ meeting.title || `Encontro ${meeting.order_index || ''}` }}</h3>
                  <span class="meeting-chip">{{ meetingStatusLabel(meeting.status) }}</span>
                </div>
                <p class="meeting-desc">{{ meeting.description || 'Sem descrição.' }}</p>
                <small class="meeting-time">
                  <i class="ti ti-clock" aria-hidden="true"></i> {{ meetingTimeInfo(meeting) }}
                </small>
                <a v-if="meeting.meeting_link" :href="meeting.meeting_link" target="_blank" rel="noopener noreferrer" class="meeting-link-btn">
                  <i class="ti ti-video" aria-hidden="true"></i> Entrar na reunião
                </a>
                <div v-if="canManageClass" class="post-actions">
                  <button type="button" class="btn-secondary btn--sm" @click="openMeetingModal(meeting)">Editar</button>
                  <button v-if="meeting.status !== 'CANCELLED' && meeting.status !== 'COMPLETED'" type="button" class="btn-danger btn--sm" @click="cancelMeeting(meeting.id)" :disabled="submittingMeetingAction">Cancelar</button>
                  <button v-if="meeting.status === 'SCHEDULED'" type="button" class="btn-secondary btn--sm" @click="completeMeeting(meeting.id)" :disabled="submittingMeetingAction">Concluir</button>
                </div>
              </div>
            </article>
          </div>
        </template>
      </section>

      <!-- Announcement Modal -->
      <div v-if="showAnnouncementModal" class="modal-overlay" @click.self="closeAnnouncementModal()">
        <div class="modal">
          <div class="modal-header">
            <h2>{{ editingAnnouncement ? 'Editar aviso' : 'Novo aviso' }}</h2>
            <button class="close-button" @click="closeAnnouncementModal()">&times;</button>
          </div>
          <form @submit.prevent="submitAnnouncement">
            <label><span>Título</span><input v-model="announcementForm.title" type="text" required /></label>
            <label><span>Conteúdo</span><textarea v-model="announcementForm.content" rows="4" required></textarea></label>
            <div class="two-columns">
              <label>
                <span>Tipo</span>
                <select v-model="announcementForm.announcement_type">
                  <option v-for="t in ['GENERAL','SCHEDULE','TASK','RESOURCE','REMINDER']" :value="t">
                    {{ t === 'SCHEDULE' ? 'Agenda' : t === 'RESOURCE' ? 'Recurso' : t === 'TASK' ? 'Tarefa' : t === 'REMINDER' ? 'Lembrete' : 'Geral' }}
                  </option>
                </select>
              </label>
              <label class="checkbox-field"><span><input v-model="announcementForm.pinned" type="checkbox" /> Fixar aviso</span></label>
            </div>
            <label class="checkbox-field"><span><input v-model="announcementForm.send_notification" type="checkbox" /> Enviar notificação</span></label>
            <p v-if="announcementError" class="error-message">{{ announcementError }}</p>
            <div class="form-actions">
              <button type="button" class="btn-secondary" @click="closeAnnouncementModal()">Cancelar</button>
              <button type="submit" class="btn-primary" :disabled="submittingAnnouncement">
                {{ submittingAnnouncement ? 'Salvando...' : (editingAnnouncement ? 'Atualizar' : 'Publicar') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Meeting Modal -->
      <div v-if="showMeetingModal" class="modal-overlay" @click.self="closeMeetingModal()">
        <div class="modal">
          <div class="modal-header">
            <h2>{{ editingMeeting ? 'Editar encontro' : 'Novo encontro' }}</h2>
            <button class="close-button" @click="closeMeetingModal()">&times;</button>
          </div>
          <form @submit.prevent="submitMeeting">
            <label><span>Título</span><input v-model="meetingForm.title" type="text" required /></label>
            <label><span>Descrição</span><textarea v-model="meetingForm.description" rows="3"></textarea></label>
            <div class="two-columns">
              <label><span>Início</span><input v-model="meetingForm.starts_at" type="datetime-local" required /></label>
              <label><span>Fim</span><input v-model="meetingForm.ends_at" type="datetime-local" /></label>
            </div>
            <div class="two-columns">
              <label><span>Ordem</span><input v-model="meetingForm.order_index" type="number" min="0" placeholder="0" /></label>
              <label><span>Link do encontro</span><input v-model="meetingForm.meeting_link" type="url" placeholder="https://..." /></label>
            </div>
            <label><span>Materiais (JSON)</span><textarea v-model="meetingForm.materials_text" rows="3" placeholder='[{"title":"Lista 1","url":"https://..."}]'></textarea></label>
            <div class="two-columns">
              <label><span>Tarefa</span><input v-model="meetingForm.task_title" type="text" /></label>
              <label><span>Prazo</span><input v-model="meetingForm.task_due_at" type="datetime-local" /></label>
            </div>
            <label><span>Descrição da tarefa</span><textarea v-model="meetingForm.task_description" rows="3"></textarea></label>
            <p v-if="meetingError" class="error-message">{{ meetingError }}</p>
            <div class="form-actions">
              <button type="button" class="btn-secondary" @click="closeMeetingModal()">Cancelar</button>
              <button type="submit" class="btn-primary" :disabled="submittingMeeting">
                {{ submittingMeeting ? 'Salvando...' : (editingMeeting ? 'Atualizar' : 'Criar encontro') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </template>
  </main>
</template>


<script setup>
// ==================== IMPORTS & SETUP ====================
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const config = useRuntimeConfig()
const { restoreSession, getAccessToken, currentUser } = useAuth()

const turmaId = computed(() => Number(route.params.id))
const apiBase = computed(() => config.public?.apiBase || config.public?.apiBaseUrl || '/api/v1')

// ==================== REACTIVE STATE ====================
const loading = ref(true)
const error = ref(null)
const turma = ref(null)
const mentorProfile = ref(null)
const meetings = ref([])
const resources = ref([])
const announcements = ref([])
const enrollments = ref([])
const showEnrollmentForm = ref(route.query.enroll === '1')
const submittingEnrollment = ref(false)
const enrollmentError = ref(null)
const activeView = ref('updates')

const applicationAnswers = reactive({})

const enrollmentForm = reactive({
  commitment_level: 'ACTIVE',
  student_note: '',
})

// Announcement form
const announcementForm = reactive({
  title: '',
  content: '',
  announcement_type: 'GENERAL',
  pinned: false,
  send_notification: true,
})
const submittingAnnouncement = ref(false)
const submittingAnnouncementAction = ref(false)
const announcementError = ref(null)
const showAnnouncementModal = ref(false)
const editingAnnouncement = ref(null)

// Meeting form
const meetingForm = reactive({
  title: '',
  description: '',
  starts_at: '',
  ends_at: '',
  order_index: '',
  meeting_link: '',
  materials_text: '',
  task_title: '',
  task_description: '',
  task_due_at: '',
})
const submittingMeeting = ref(false)
const submittingMeetingAction = ref(false)
const meetingError = ref(null)
const showMeetingModal = ref(false)
const editingMeeting = ref(null)

// ==================== COMPUTED ====================
const myEnrollment = computed(() => {
  return enrollments.value.find((item) => item.turma_id === turmaId.value) || null
})

const mentorAccount = computed(() => {
  const profile = mentorProfile.value || turma.value?.mentor_account || null
  const name = profile?.user_full_name || profile?.user_username || 'Mentor seConecta'
  return {
    name,
    initials: initialsFrom(name),
    username: profile?.user_username || null,
    profileUrl: profile?.user_profile_url || (profile?.user_username ? `/profile/${profile.user_username}` : null),
    avatarUrl: profile?.user_profile_picture_url || null,
  }
})

const isCurrentOwner = computed(() => {
  const myId = currentUser.value?.id
  if (!myId || !turma.value) return false
  return [
    turma.value.created_by_id,
    turma.value.mentor_account?.user_id,
    mentorProfile.value?.user_id,
  ]
    .filter(Boolean)
    .some((id) => String(id) === String(myId))
})

const isAdminUser = computed(() => {
  const user = currentUser.value || {}
  return Boolean(
    user.is_superuser ||
    user.is_admin ||
    user.role === 'admin' ||
    user.role === 'superuser' ||
    (Array.isArray(user.tags) && user.tags.includes('admin'))
  )
})

const canManageClass = computed(() => isCurrentOwner.value || isAdminUser.value)
const canAccessPrivateArea = computed(() => canManageClass.value || isInsideClass.value)

const normalizedApplicationQuestions = computed(() => {
  const questions = Array.isArray(turma.value?.application_questions) ? turma.value.application_questions : []
  if (questions.length) {
    return questions.map((question, index) => ({
      key: question.key || `q_${index + 1}`,
      label: question.label || question.question || `Pergunta ${index + 1}`,
      type: question.type || 'textarea',
      required: question.required !== false,
      placeholder: question.placeholder || '',
    }))
  }
  if (turma.value?.enrollment_mode !== 'APPLICATION') return []
  return [
    { key: 'motivation', label: 'Por que você quer participar?', type: 'textarea', required: true, placeholder: 'Explique seu momento, interesse e o que espera da turma.' },
    { key: 'goal', label: 'Qual seu objetivo principal?', type: 'textarea', required: true, placeholder: 'Ex.: começar na OBI, organizar uma aplicação, entender pesquisa...' },
    { key: 'experience', label: 'Experiência anterior no tema', type: 'textarea', required: false, placeholder: 'Não tem problema se for nenhuma. Isso ajuda o mentor a entender seu ponto de partida.' },
  ]
})

const isInsideClass = computed(() => {
  return myEnrollment.value && ['ACCEPTED', 'ENROLLED', 'ACTIVE', 'COMPLETED'].includes(myEnrollment.value.status)
})

const canLeave = computed(() => {
  return myEnrollment.value && ['ACCEPTED', 'ENROLLED', 'ACTIVE'].includes(myEnrollment.value.status)
})

const availableSeats = computed(() => {
  if (!turma.value) return 0
  return Math.max(0, Number(turma.value.class_size || 0) - Number(turma.value.current_enrollment_count || 0))
})

const fillPercentage = computed(() => {
  if (!turma.value?.class_size) return 0
  return Math.min(100, Math.round((Number(turma.value.current_enrollment_count || 0) / Number(turma.value.class_size || 1)) * 100))
})

const canRequestEnrollment = computed(() => {
  if (!turma.value) return false
  if (isCurrentOwner.value || isAdminUser.value) return false
  if (myEnrollment.value && !['LEFT', 'REJECTED', 'REMOVED'].includes(myEnrollment.value.status)) return false
  return turma.value.status === 'ENROLLMENT_OPEN' && availableSeats.value > 0
})

const enrollmentHint = computed(() => {
  if (isCurrentOwner.value) return 'Você é o mentor desta turma. Use os botões de edição e gerenciamento.'
  if (myEnrollment.value) return enrollmentDescription.value
  if (turma.value?.status === 'PUBLISHED') return 'Essa turma foi aprovada, mas as inscrições ainda não abriram.'
  if (turma.value?.status === 'FULL') return 'Essa turma está cheia.'
  if (turma.value?.status === 'ONGOING') return 'Essa turma já está em andamento.'
  return 'Inscrições indisponíveis no momento.'
})

const enrollmentDescription = computed(() => {
  if (!myEnrollment.value) return 'Quando você entrar ou aplicar para uma turma, seu status aparecerá aqui.'
  const labels = {
    SAVED: 'Você salvou essa turma para ver depois.',
    APPLIED: 'Sua aplicação foi enviada e está aguardando análise.',
    WAITLISTED: 'Você está na lista de espera.',
    ACCEPTED: 'Sua aplicação foi aceita. Confirme a participação quando solicitado.',
    ENROLLED: 'Você está inscrito na turma.',
    ACTIVE: 'Você está ativo na turma.',
    COMPLETED: 'Você concluiu essa turma.',
    REJECTED: 'Sua aplicação não foi aceita desta vez.',
    LEFT: 'Você saiu dessa turma.',
    REMOVED: 'Sua inscrição foi removida.',
  }
  return labels[myEnrollment.value.status] || myEnrollment.value.status
})

// ==================== LIFECYCLE ====================
onMounted(loadPage)

// ==================== API FETCH HELPER ====================
async function apiFetch(path, options = {}, config = {}) {
  await restoreSession()
  const token = getAccessToken()
  if (config.requireAuth && !token) {
    throw new Error('Você precisa estar logado para continuar.')
  }
  return await $fetch(path, {
    baseURL: apiBase.value,
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}

// ==================== DATA LOADERS ====================
async function loadPage() {
  loading.value = true
  error.value = null
  try {
    turma.value = await apiFetch(`/turmas/${turmaId.value}`, {}, { requireAuth: true })
    await Promise.all([
      loadMyEnrollments(),
      loadMeetings(),
      loadMentorProfile(),
    ])
    if (canAccessPrivateArea.value) {
      await Promise.all([loadResources(), loadAnnouncements()])
    }
  } catch (err) {
    error.value = err?.data?.detail || err?.message || 'Erro inesperado.'
  } finally {
    loading.value = false
  }
}

async function loadMyEnrollments() {
  try {
    const response = await apiFetch('/turmas/my/enrollments', { query: { limit: 100 } }, { requireAuth: true })
    enrollments.value = Array.isArray(response) ? response : []
  } catch {
    enrollments.value = []
  }
}

async function loadMeetings() {
  try {
    const token = getAccessToken()
    if (token) {
      try {
        const data = await apiFetch(
          `/turmas/${turmaId.value}/meetings`,
          { query: { include_cancelled: true } },
          { requireAuth: true }
        )
        meetings.value = data
        return
      } catch {
        // fallback to public
      }
    }
    const data = await apiFetch(
      `/turmas/${turmaId.value}/meetings/public`,
      { query: { include_cancelled: false } }
    )
    meetings.value = data
  } catch {
    meetings.value = []
  }
}

async function loadMentorProfile() {
  if (turma.value?.mentor_account) {
    mentorProfile.value = turma.value.mentor_account
    return
  }
  if (!turma.value?.mentor_profile_id) return
  try {
    mentorProfile.value = await apiFetch(`/turmas/mentor/${turma.value.mentor_profile_id}`, {}, { requireAuth: true })
  } catch {
    mentorProfile.value = null
  }
}

async function loadResources() {
  try {
    resources.value = await apiFetch(`/turmas/${turmaId.value}/resources`, {}, { requireAuth: true })
  } catch {
    resources.value = []
  }
}

async function loadAnnouncements() {
  try {
    announcements.value = await apiFetch(`/turmas/${turmaId.value}/announcements`, {}, { requireAuth: true })
  } catch {
    announcements.value = []
  }
}

// ==================== ENROLLMENT ====================
async function submitEnrollment() {
  if (isCurrentOwner.value || isAdminUser.value) {
    enrollmentError.value = 'Mentores e administradores não podem se inscrever na própria turma.'
    return
  }
  submittingEnrollment.value = true
  enrollmentError.value = null
  try {
    const application_answers = {}
    if (turma.value.enrollment_mode === 'APPLICATION') {
      for (const question of normalizedApplicationQuestions.value) {
        const answer = String(applicationAnswers[question.key] || '').trim()
        if (question.required && !answer) {
          enrollmentError.value = `Responda: ${question.label}`
          submittingEnrollment.value = false
          return
        }
        application_answers[question.key] = answer
      }
    }
    const body = {
      commitment_level: enrollmentForm.commitment_level,
      student_note: enrollmentForm.student_note || null,
      application_answers,
    }
    await apiFetch(`/turmas/${turmaId.value}/join`, { method: 'POST', body }, { requireAuth: true })
    showEnrollmentForm.value = false
    await loadPage()
  } catch (err) {
    enrollmentError.value = err?.data?.detail || err?.message || 'Não foi possível enviar sua inscrição.'
  } finally {
    submittingEnrollment.value = false
  }
}

async function leaveTurma() {
  if (!window.confirm('Tem certeza que quer sair dessa turma?')) return
  submittingEnrollment.value = true
  try {
    await apiFetch(`/turmas/${turmaId.value}/leave`, { method: 'POST' }, { requireAuth: true })
    await loadPage()
  } catch (err) {
    enrollmentError.value = err?.data?.detail || err?.message || 'Não foi possível sair da turma.'
  } finally {
    submittingEnrollment.value = false
  }
}

// ==================== ANNOUNCEMENTS ====================
function openAnnouncementModal(announcement = null) {
  if (announcement) {
    announcementForm.title = announcement.title || ''
    announcementForm.content = announcement.content || ''
    announcementForm.announcement_type = announcement.announcement_type || 'GENERAL'
    announcementForm.pinned = announcement.pinned || false
    announcementForm.send_notification = false
    editingAnnouncement.value = announcement
  } else {
    resetAnnouncementForm()
    editingAnnouncement.value = null
  }
  showAnnouncementModal.value = true
}

function closeAnnouncementModal() {
  showAnnouncementModal.value = false
  editingAnnouncement.value = null
}

async function submitAnnouncement() {
  submittingAnnouncement.value = true
  announcementError.value = null
  try {
    if (!announcementForm.title.trim()) {
      announcementError.value = 'Informe o título do aviso.'
      submittingAnnouncement.value = false
      return
    }
    if (!announcementForm.content.trim()) {
      announcementError.value = 'Informe o conteúdo do aviso.'
      submittingAnnouncement.value = false
      return
    }
    const body = {
      title: announcementForm.title.trim(),
      content: announcementForm.content.trim(),
      announcement_type: announcementForm.announcement_type,
      pinned: Boolean(announcementForm.pinned),
      send_notification: Boolean(announcementForm.send_notification),
    }
    if (editingAnnouncement.value) {
      await apiFetch(
        `/turmas/announcements/${editingAnnouncement.value.id}`,
        { method: 'PATCH', body },
        { requireAuth: true }
      )
    } else {
      await apiFetch(
        `/turmas/${turmaId.value}/announcements`,
        { method: 'POST', body },
        { requireAuth: true }
      )
    }
    closeAnnouncementModal()
    await loadAnnouncements()
  } catch (err) {
    announcementError.value = err?.data?.detail || err?.message || 'Erro ao salvar aviso.'
  } finally {
    submittingAnnouncement.value = false
  }
}

async function deleteAnnouncement(announcementId) {
  if (!window.confirm('Tem certeza que deseja excluir este aviso?')) return
  submittingAnnouncementAction.value = true
  try {
    await apiFetch(`/turmas/announcements/${announcementId}`, { method: 'DELETE' }, { requireAuth: true })
    await loadAnnouncements()
  } catch (err) {
    announcementError.value = err?.data?.detail || err?.message || 'Não foi possível excluir o aviso.'
  } finally {
    submittingAnnouncementAction.value = false
  }
}

function resetAnnouncementForm() {
  announcementForm.title = ''
  announcementForm.content = ''
  announcementForm.announcement_type = 'GENERAL'
  announcementForm.pinned = false
  announcementForm.send_notification = true
}

// ==================== MEETINGS ====================
function openMeetingModal(meeting = null) {
  if (meeting) {
    meetingForm.title = meeting.title || ''
    meetingForm.description = meeting.description || ''
    meetingForm.starts_at = meeting.starts_at ? toLocalDatetime(meeting.starts_at) : ''
    meetingForm.ends_at = meeting.ends_at ? toLocalDatetime(meeting.ends_at) : ''
    meetingForm.order_index = meeting.order_index ?? ''
    meetingForm.meeting_link = meeting.meeting_link || ''
    meetingForm.materials_text = meeting.materials ? JSON.stringify(meeting.materials) : ''
    meetingForm.task_title = meeting.task_title || ''
    meetingForm.task_description = meeting.task_description || ''
    meetingForm.task_due_at = meeting.task_due_at ? toLocalDatetime(meeting.task_due_at) : ''
    editingMeeting.value = meeting
  } else {
    resetMeetingForm()
    editingMeeting.value = null
  }
  showMeetingModal.value = true
}

function closeMeetingModal() {
  showMeetingModal.value = false
  editingMeeting.value = null
}

async function submitMeeting() {
  submittingMeeting.value = true
  meetingError.value = null
  try {
    if (!meetingForm.title.trim()) {
      meetingError.value = 'Informe o título do encontro.'
      submittingMeeting.value = false
      return
    }
    if (!meetingForm.starts_at) {
      meetingError.value = 'Informe a data de início.'
      submittingMeeting.value = false
      return
    }
    const payload = {
      title: meetingForm.title.trim(),
      description: meetingForm.description.trim() || null,
      starts_at: toIsoFromLocal(meetingForm.starts_at),
      ends_at: meetingForm.ends_at ? toIsoFromLocal(meetingForm.ends_at) : null,
      order_index: meetingForm.order_index === '' ? null : Number(meetingForm.order_index),
      meeting_link: meetingForm.meeting_link.trim() || null,
      task_title: meetingForm.task_title.trim() || null,
      task_description: meetingForm.task_description.trim() || null,
      task_due_at: meetingForm.task_due_at ? toIsoFromLocal(meetingForm.task_due_at) : null,
      materials: parseMaterials(meetingForm.materials_text),
    }
    if (editingMeeting.value) {
      await apiFetch(
        `/turmas/meetings/${editingMeeting.value.id}`,
        { method: 'PATCH', body: payload },
        { requireAuth: true }
      )
    } else {
      await apiFetch(
        `/turmas/${turmaId.value}/meetings`,
        { method: 'POST', body: payload },
        { requireAuth: true }
      )
    }
    closeMeetingModal()
    await loadMeetings()
  } catch (err) {
    meetingError.value = err?.data?.detail || err?.message || 'Erro ao salvar encontro.'
  } finally {
    submittingMeeting.value = false
  }
}

async function completeMeeting(meetingId) {
  if (!window.confirm('Marcar este encontro como concluído?')) return
  submittingMeetingAction.value = true
  try {
    await apiFetch(`/turmas/meetings/${meetingId}/complete`, { method: 'POST' }, { requireAuth: true })
    await loadMeetings()
  } catch (err) {
    meetingError.value = err?.data?.detail || err?.message || 'Não foi possível concluir o encontro.'
  } finally {
    submittingMeetingAction.value = false
  }
}

async function cancelMeeting(meetingId) {
  const reason = window.prompt('Motivo do cancelamento (opcional):')
  submittingMeetingAction.value = true
  try {
    await apiFetch(
      `/turmas/meetings/${meetingId}/cancel`,
      { method: 'POST', body: { reason: reason || null } },
      { requireAuth: true }
    )
    await loadMeetings()
  } catch (err) {
    meetingError.value = err?.data?.detail || err?.message || 'Não foi possível cancelar o encontro.'
  } finally {
    submittingMeetingAction.value = false
  }
}

function resetMeetingForm() {
  meetingForm.title = ''
  meetingForm.description = ''
  meetingForm.starts_at = ''
  meetingForm.ends_at = ''
  meetingForm.order_index = ''
  meetingForm.meeting_link = ''
  meetingForm.materials_text = ''
  meetingForm.task_title = ''
  meetingForm.task_description = ''
  meetingForm.task_due_at = ''
}

// ==================== UTILITY ====================
function toLocalDatetime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function meetingTimeInfo(meeting) {
  const start = meeting.starts_at ? new Date(meeting.starts_at) : null
  const end = meeting.ends_at ? new Date(meeting.ends_at) : null
  if (!start) return 'Horário a definir'
  const fmt = (d) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (!end) return fmt(start)
  const diffMs = end - start
  if (diffMs < 0) return fmt(start) + ' - ' + fmt(end)
  const minutes = Math.round(diffMs / 60000)
  return `${fmt(start)} - ${fmt(end)} (${minutes} min)`
}

function parseMaterials(text) {
  const value = String(text || '').trim()
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function toIsoFromLocal(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

// ==================== LABELS ====================
function categoryLabel(value) {
  const map = { OLYMPIAD: 'Olimpíada', OPPORTUNITY_APPLICATION: 'Aplicações', RESEARCH: 'Pesquisa', TECHNOLOGY: 'Tecnologia', PROJECTS: 'Projetos', EXPLORATION: 'Exploração', OTHER: 'Turma' }
  return map[value] || value || 'Turma'
}
function levelLabel(value) {
  const map = { BEGINNER: 'Iniciante', INTERMEDIATE: 'Intermediário', ADVANCED: 'Avançado', OPEN_TO_ALL: 'Aberta para todos' }
  return map[value] || value || 'Não informado'
}
function formatLabel(value) {
  const map = { ONLINE: 'Online', IN_PERSON: 'Presencial', HYBRID: 'Híbrida', ASYNC: 'Assíncrona' }
  return map[value] || value || 'Formato não informado'
}
function statusLabel(value) {
  const map = {
    PUBLISHED: 'Publicada', ENROLLMENT_OPEN: 'Inscrições abertas', FULL: 'Cheia', ONGOING: 'Em andamento',
    COMPLETED: 'Concluída', DRAFT: 'Rascunho', PENDING_REVIEW: 'Em revisão', REJECTED: 'Rejeitada',
    CANCELLED: 'Cancelada', ARCHIVED: 'Arquivada',
  }
  return map[value] || value
}
function meetingStatusLabel(value) {
  const map = { SCHEDULED: 'Agendado', COMPLETED: 'Concluído', CANCELLED: 'Cancelado' }
  return map[value] || value || 'Agendado'
}
function announcementTypeLabel(value) {
  const map = { GENERAL: 'Geral', SCHEDULE: 'Agenda', TASK: 'Tarefa', RESOURCE: 'Recurso', REMINDER: 'Lembrete' }
  return map[value] || value || 'Geral'
}
function enrollmentStatusLabel(value) {
  const map = {
    SAVED: 'Salva', APPLIED: 'Aplicação enviada', WAITLISTED: 'Lista de espera', ACCEPTED: 'Aceito',
    ENROLLED: 'Inscrito', ACTIVE: 'Ativo', COMPLETED: 'Concluída', REJECTED: 'Rejeitada',
    LEFT: 'Saiu', REMOVED: 'Removida',
  }
  return map[value] || value
}
function initialsFrom(text) {
  if (!text) return 'SC'
  return text.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase()
}
function dateTimeLabel(value) {
  if (!value) return 'Horário a definir'
  return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
function dayOfMonth(value) {
  if (!value) return '--'
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit' })
}
function monthLabel(value) {
  if (!value) return '---'
  return new Date(value).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
}
</script>


<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');
@import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

/* ==================== BASE ==================== */
.classroom-page {
  min-height: 100vh;
  padding: 20px 20px 48px;
  background: #f5f2ec;
  color: #1a1a18;
  font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
}

.shell {
  max-width: 1040px;
  margin-left: auto;
  margin-right: auto;
}

/* ==================== TOPBAR ==================== */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.topbar-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.7);
  border: 0.5px solid #d5d0c6;
  border-radius: 999px;
  padding: 8px 16px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #444;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-ghost:hover { background: #fff; }

.btn-edit {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.7);
  border: 0.5px solid #0a7a60;
  color: #0a7a60;
  border-radius: 999px;
  padding: 8px 16px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-edit:hover { background: #e0f5ed; }

/* ==================== HERO ==================== */
.hero {
  background: #fff;
  border-radius: 28px;
  border: 0.5px solid #e4dfd6;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
}

.hero-banner {
  height: 220px;
  overflow: hidden;
}
.hero-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hero-inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
}

.hero-copy {
  padding: 28px 28px 28px 32px;
  border-right: 0.5px solid #ece8e0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ==================== MENTOR ROW ==================== */
.mentor-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0f5ed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #0a7a60;
  overflow: hidden;
  flex-shrink: 0;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar--sm {
  width: 26px;
  height: 26px;
  font-size: 10px;
}

.mentor-name {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a18;
}
.mentor-link {
  text-decoration: none;
  color: #1a1a18;
}
.mentor-link:hover { color: #0a7a60; text-decoration: underline; text-underline-offset: 3px; }

/* ==================== HERO COPY ==================== */
.eyebrow {
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #0a7a60;
}

.hero-title {
  font-family: 'Syne', sans-serif;
  font-size: 2rem;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.03em;
  color: #0e1210;
  margin: 0 0 12px;
}

.hero-desc {
  font-size: 14px;
  color: #5a5a54;
  line-height: 1.65;
  margin: 0 0 24px;
}

.meta-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #f5f2ec;
  border: 0.5px solid #e4dfd6;
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #5a5a54;
}
.pill i { font-size: 14px; color: #8a8a80; }

/* ==================== ACTION COLUMN ==================== */
.action-col {
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.col-divider {
  height: 0.5px;
  background: #ece8e0;
}

.status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 11.5px;
  font-weight: 500;
}

/* Status color variants */
.status-pill--enrollment_open { background: #e0f5ed; color: #0a7a60; border: 0.5px solid #a0dfc8; }
.status-pill--ongoing        { background: #fff7e0; color: #8a5a00; border: 0.5px solid #f0d080; }
.status-pill--full           { background: #fce8e8; color: #9b1c1c; border: 0.5px solid #fca5a5; }
.status-pill--completed      { background: #f0f0f0; color: #555;    border: 0.5px solid #ddd; }
.status-pill--draft          { background: #f0f0f0; color: #777;    border: 0.5px solid #e0e0e0; }
.status-pill--published      { background: #e8eeff; color: #1e40af; border: 0.5px solid #bfcbf8; }
.status-pill--cancelled      { background: #fce8e8; color: #9b1c1c; border: 0.5px solid #fca5a5; }
.status-pill--archived       { background: #f0f0f0; color: #777;    border: 0.5px solid #e0e0e0; }

.enrollment-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 11.5px;
  font-weight: 500;
  background: #e0f5ed;
  color: #0a7a60;
  border: 0.5px solid #a0dfc8;
}

.capacity-label {
  font-size: 11px;
  font-weight: 500;
  color: #aaa;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.capacity-num {
  font-family: 'Syne', sans-serif;
  font-size: 2.4rem;
  font-weight: 800;
  color: #0e1210;
  line-height: 1;
  letter-spacing: -0.04em;
}
.capacity-num span {
  font-size: 1.2rem;
  color: #bbb;
  font-weight: 500;
}

.progress-track {
  height: 5px;
  background: #ece8e0;
  border-radius: 999px;
  overflow: hidden;
  margin-top: 8px;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0a7a60, #14b88a);
  border-radius: 999px;
  transition: width 0.4s ease;
}

.seats-note {
  font-size: 12px;
  color: #aaa;
  margin-top: 4px;
}

.owner-actions { display: grid; gap: 8px; }

/* ==================== BUTTONS ==================== */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #0a7a60;
  color: #fff;
  border: none;
  border-radius: 14px;
  padding: 13px 20px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-primary:hover:not(:disabled) { background: #0d9272; }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #fff;
  color: #374151;
  border: 0.5px solid #d5d0c6;
  border-radius: 14px;
  padding: 12px 20px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-secondary:hover:not(:disabled) { background: #f5f2ec; }
.btn-secondary:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #fff1f2;
  color: #be123c;
  border: 0.5px solid #fecdd3;
  border-radius: 14px;
  padding: 12px 20px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-danger:hover:not(:disabled) { background: #ffe4e6; }
.btn-danger:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-leave {
  width: 100%;
  padding: 13px;
  background: #fff1f2;
  color: #be123c;
  border: 0.5px solid #fecdd3;
  border-radius: 14px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-leave:hover:not(:disabled) { background: #ffe4e6; }
.btn-leave:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-new {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #0a7a60;
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 8px 16px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}
.btn-new:hover { background: #0d9272; }

.btn--sm {
  padding: 6px 14px;
  font-size: 12px;
  border-radius: 999px;
}

.full { width: 100%; }

/* ==================== ENROLL PANEL ==================== */
.enroll-panel {
  background: #fff;
  border: 0.5px solid #e4dfd6;
  border-radius: 24px;
  padding: 28px 32px;
  margin-bottom: 16px;
  display: grid;
  gap: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
.enroll-panel h2 {
  font-family: 'Syne', sans-serif;
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0 0 6px;
  color: #0e1210;
}
.enroll-panel > div > p { font-size: 14px; color: #5a5a54; margin: 0; }

/* ==================== CONTENT AREA ==================== */
.content-area {
  background: #fff;
  border-radius: 28px;
  border: 0.5px solid #e4dfd6;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
}

/* ==================== TABS ==================== */
.tab-bar {
  display: flex;
  border-bottom: 0.5px solid #ece8e0;
  padding: 0 24px;
}

.tab-btn {
  padding: 16px 20px 15px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13.5px;
  font-weight: 500;
  color: #8a8a80;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  cursor: pointer;
  margin-bottom: -0.5px;
  transition: color 0.15s, border-color 0.15s;
}
.tab-btn.active {
  color: #0a7a60;
  border-bottom-color: #0a7a60;
  font-weight: 600;
}
.tab-btn:hover:not(.active) { color: #444; }

/* ==================== SECTIONS ==================== */
.section-inner { padding: 24px; }

.resources-section {
  padding: 24px;
  border-top: 0.5px solid #ece8e0;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #bbb;
  margin: 0 0 2px;
}

.section-title {
  font-family: 'Syne', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  color: #0e1210;
  margin: 0;
}

.feed-empty {
  font-size: 14px;
  color: #aaa;
  padding: 32px 0;
  text-align: center;
}

/* ==================== POSTS ==================== */
.post-card {
  border: 0.5px solid #ece8e0;
  border-radius: 18px;
  padding: 16px 18px;
  margin-bottom: 10px;
  background: #fcfbf9;
}

.post-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.post-author { font-size: 13px; font-weight: 500; color: #1a1a18; }
.post-author-link { font-size: 13px; font-weight: 500; color: #1a1a18; text-decoration: none; }
.post-author-link:hover { color: #0a7a60; text-decoration: underline; text-underline-offset: 3px; }

.post-time {
  margin-left: auto;
  font-size: 11.5px;
  color: #ccc;
  white-space: nowrap;
}

.pin-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: #fef9e7;
  border: 0.5px solid #f5e09a;
  color: #a07010;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
}
.pin-badge i { font-size: 11px; }

.post-headline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.post-title-text {
  font-weight: 600;
  font-size: 14px;
  color: #1a1a18;
}

.type-chip {
  font-size: 11px;
  font-weight: 500;
  background: #f5f2ec;
  color: #8a8a80;
  border-radius: 999px;
  padding: 3px 10px;
  border: 0.5px solid #e4dfd6;
  flex-shrink: 0;
}

.post-content {
  font-size: 13.5px;
  color: #5a5a54;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

.post-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

/* ==================== RESOURCES ==================== */
.resource-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 0.5px solid #ece8e0;
  border-radius: 14px;
  background: #fcfbf9;
  margin-bottom: 8px;
  color: #1e5bc6;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s;
}
.resource-item i { font-size: 16px; color: #8a8a80; }
.resource-item:hover { background: #f5f2ec; }

/* ==================== MEETINGS ==================== */
.meeting-row {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  border-top: 0.5px solid #ece8e0;
  align-items: flex-start;
}
.meeting-row:first-of-type { border-top: none; padding-top: 0; }

.meeting-date-box {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #e0f5ed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.meeting-day {
  font-family: 'Syne', sans-serif;
  font-size: 1.3rem;
  font-weight: 800;
  color: #0a7a60;
  line-height: 1;
}
.meeting-month {
  font-size: 10px;
  font-weight: 600;
  color: #3ab890;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.meeting-body { flex: 1; min-width: 0; }

.meeting-head-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 4px;
}

.meeting-name {
  font-family: 'Syne', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: #0e1210;
  margin: 0;
}

.meeting-desc {
  font-size: 13px;
  color: #8a8a80;
  margin: 2px 0 6px;
}

.meeting-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #aaa;
}
.meeting-time i { font-size: 13px; }

.meeting-chip {
  font-size: 11px;
  font-weight: 500;
  background: #e0f5ed;
  color: #0a7a60;
  border-radius: 999px;
  padding: 3px 10px;
  flex-shrink: 0;
  border: 0.5px solid #a0dfc8;
}

.meeting-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
  padding: 5px 14px;
  background: #0a7a60;
  color: #fff;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s;
}
.meeting-link-btn:hover { background: #0d9272; }
.meeting-link-btn i { font-size: 13px; }

/* ==================== FORMS & MODALS ==================== */
.loading-card, .error-card {
  background: #fff;
  border: 0.5px solid #e4dfd6;
  border-radius: 24px;
  padding: 40px;
  text-align: center;
  color: #5a5a54;
}
.error-card h1 { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 700; margin: 0 0 8px; color: #0e1210; }

.two-columns { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }

label { display: grid; gap: 6px; }
label span { font-size: 0.78rem; font-weight: 600; color: #374151; }
label small { margin-left: 6px; color: #0a7a60; font-size: 0.68rem; font-weight: 600; }

input, textarea, select {
  border: 0.5px solid #d5d0c6;
  border-radius: 12px;
  padding: 11px 12px;
  font: inherit;
  font-size: 14px;
  outline: none;
  background: #fff;
  color: #1a1a18;
  transition: border-color 0.15s, box-shadow 0.15s;
}
input:focus, textarea:focus, select:focus {
  border-color: #0a7a60;
  box-shadow: 0 0 0 3px rgba(10, 122, 96, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.error-message {
  margin: 0;
  color: #be123c;
  background: #fff1f2;
  border: 0.5px solid #fecdd3;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13.5px;
}

.small-note {
  font-size: 13px;
  color: #8a8a80;
  line-height: 1.5;
  margin: 0;
}

.checkbox-field { display: flex; align-items: center; }
.checkbox-field span { display: inline-flex; align-items: center; gap: 8px; font-weight: 500; color: #374151; font-size: 14px; }
.checkbox-field input { width: 16px; height: 16px; }

/* ==================== MODALS ==================== */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: #fff;
  border-radius: 24px;
  padding: 28px;
  max-width: 640px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
  display: grid;
  gap: 16px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h2 {
  margin: 0;
  font-family: 'Syne', sans-serif;
  font-size: 1.4rem;
  font-weight: 700;
  color: #0e1210;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: #aaa;
  padding: 0;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: color 0.15s, background 0.15s;
}
.close-button:hover { color: #1a1a18; background: #f5f2ec; }

/* ==================== RESPONSIVE ==================== */
@media (max-width: 900px) {
  .hero-inner { grid-template-columns: 1fr; }
  .hero-copy { border-right: none; border-bottom: 0.5px solid #ece8e0; }
  .two-columns { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .classroom-page { padding: 12px 12px 40px; }
  .hero { border-radius: 20px; }
  .hero-copy { padding: 20px; }
  .hero-title { font-size: 1.6rem; }
  .action-col { padding: 20px; }
  .content-area { border-radius: 20px; }
  .topbar { flex-direction: column; align-items: flex-start; gap: 10px; }
  .topbar-actions { width: 100%; }
  .form-actions { flex-direction: column; }
  .modal { padding: 20px; border-radius: 20px; }
}
</style>