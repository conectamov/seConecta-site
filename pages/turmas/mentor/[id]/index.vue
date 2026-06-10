<template>
  <main class="manage-page">
    <section class="topbar shell">
      <button class="ghost-button" @click="navigateTo('/turmas/mentor')">← Painel do mentor</button>
      <NuxtLink v-if="turma" :to="`/turmas/${turma.id}`" class="ghost-button">Ver página pública</NuxtLink>
    </section>

    <section v-if="loading" class="shell state-card">Carregando turma...</section>

    <section v-else-if="error" class="shell state-card error-card">
      <h1>Não foi possível carregar a turma</h1>
      <p>{{ error }}</p>
      <button class="primary-button" @click="loadPage">Tentar novamente</button>
    </section>

    <template v-else-if="turma">
      <section class="hero shell">
        <div>
          <p class="eyebrow">Gerenciar turma</p>
          <h1>{{ turma.title }}</h1>
          <p>{{ turma.short_description || turma.description || 'Sem descrição.' }}</p>

          <div class="meta-row">
            <span>{{ statusLabel(turma.status) }}</span>
            <span>{{ turma.current_enrollment_count || 0 }}/{{ turma.class_size || 0 }} inscritos</span>
            <span>{{ turma.number_of_meetings || 0 }} encontros</span>
          </div>
        </div>

        <aside class="action-card">
          <button v-if="turma.status === 'DRAFT' || turma.status === 'REJECTED'" class="primary-button full" @click="submitTurma">Enviar para revisão</button>
          <button v-if="turma.status === 'PUBLISHED'" class="primary-button full" @click="openEnrollment">Abrir inscrições</button>
          <button v-if="['PUBLISHED', 'ENROLLMENT_OPEN', 'FULL'].includes(turma.status)" class="dark-button full" @click="startTurma">Marcar em andamento</button>
          <button v-if="turma.status === 'ONGOING'" class="dark-button full" @click="completeTurma">Concluir turma</button>
          <button v-if="!['COMPLETED', 'CANCELLED', 'ARCHIVED'].includes(turma.status)" class="danger-button full" @click="cancelTurma">Cancelar turma</button>
        </aside>
      </section>

      <section class="shell layout">
        <div class="main-column">
          <section class="card">
            <div class="section-head">
              <div>
                <p class="eyebrow">Inscrições</p>
                <h2>{{ enrollments.length }} estudantes</h2>
              </div>
              <select v-model="enrollmentStatusFilter" @change="loadEnrollments">
                <option value="">Todos</option>
                <option value="APPLIED">Aplicações</option>
                <option value="WAITLISTED">Lista de espera</option>
                <option value="ACCEPTED">Aceitos</option>
                <option value="ENROLLED">Inscritos</option>
                <option value="ACTIVE">Ativos</option>
                <option value="REJECTED">Rejeitados</option>
              </select>
            </div>

            <div v-if="enrollments.length === 0" class="empty-inline">Nenhuma inscrição neste filtro.</div>

            <article v-for="enrollment in enrollments" :key="enrollment.id" class="enrollment-item">
              <div class="avatar">{{ String(enrollment.user_id).slice(0, 2).toUpperCase() }}</div>
              <div class="enrollment-body">
                <div class="enrollment-top">
                  <strong>Aluno {{ String(enrollment.user_id).slice(0, 8) }}</strong>
                  <span class="status-pill">{{ enrollmentStatusLabel(enrollment.status) }}</span>
                </div>

                <p v-if="enrollment.student_note">{{ enrollment.student_note }}</p>

                <div v-if="enrollment.application_answers && Object.keys(enrollment.application_answers).length" class="answers-box">
                  <div v-for="(value, key) in enrollment.application_answers" :key="key">
                    <span>{{ key }}</span>
                    <p>{{ value || '—' }}</p>
                  </div>
                </div>

                <div class="actions-row">
                  <button v-if="['APPLIED', 'WAITLISTED'].includes(enrollment.status)" class="primary-button small" @click="acceptEnrollment(enrollment)">Aceitar</button>
                  <button v-if="['APPLIED', 'ACCEPTED'].includes(enrollment.status)" class="secondary-button small" @click="waitlistEnrollment(enrollment)">Lista de espera</button>
                  <button v-if="['APPLIED', 'WAITLISTED', 'ACCEPTED'].includes(enrollment.status)" class="danger-button small" @click="rejectEnrollment(enrollment)">Rejeitar</button>
                  <button v-if="['ACCEPTED', 'ENROLLED'].includes(enrollment.status)" class="dark-button small" @click="activateEnrollment(enrollment)">Ativar</button>
                  <button v-if="!['REMOVED', 'LEFT', 'COMPLETED'].includes(enrollment.status)" class="ghost-button small" @click="removeEnrollment(enrollment)">Remover</button>
                </div>
              </div>
            </article>
          </section>
        </div>

        <aside class="side-column">
          <!-- Card de imagem de capa -->
          <section class="card">
            <div class="section-head">
              <div>
                <p class="eyebrow">Imagem de capa</p>
                <h2>Capa da turma</h2>
              </div>
            </div>

            <div class="cover-upload-area">
              <div class="cover-preview-wrapper">
                <img
                  v-if="coverPreviewSrc"
                  :src="coverPreviewSrc"
                  alt="Capa da turma"
                  class="cover-preview-img"
                />
                <div v-else class="cover-placeholder">
                  <span>Sem imagem de capa</span>
                </div>
              </div>

              <div class="upload-controls">
                <label class="upload-button">
                  <input
                    ref="coverFileInput"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    :disabled="uploadingCover"
                    @change="handleCoverFileChange"
                    hidden
                  />
                  <span class="primary-button small">
                    {{ uploadingCover ? 'Enviando…' : 'Escolher imagem' }}
                  </span>
                </label>

                <button
                  v-if="turma.cover_url || localCoverPreviewUrl"
                  type="button"
                  class="danger-button small"
                  :disabled="uploadingCover"
                  @click="clearCoverImage"
                >
                  Remover
                </button>
              </div>

              <p v-if="coverError" class="error-message small">{{ coverError }}</p>
              <p v-if="coverUploadStatus" class="upload-status">{{ coverUploadStatus }}</p>
            </div>
          </section>

          <!-- Encontros -->
          <section class="card">
            <p class="eyebrow">Encontros</p>
            <h2>{{ meetings.length }}</h2>
            <p>Encontros criados para essa turma.</p>
            <article v-for="meeting in meetings" :key="meeting.id" class="mini-item">
              <strong>{{ meeting.title || 'Encontro' }}</strong>
              <span>{{ dateTimeLabel(meeting.starts_at) }}</span>
            </article>
          </section>

          <!-- Materiais e avisos -->
          <section class="card">
            <p class="eyebrow">Materiais e avisos</p>
            <h2>{{ resources.length + announcements.length }}</h2>
            <p>Use os endpoints de recursos e avisos para completar essa área depois.</p>
          </section>
        </aside>
      </section>
    </template>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const config = useRuntimeConfig()
const { restoreSession, getAccessToken } = useAuth()
const apiBase = computed(() => config.public?.apiBase || config.public?.apiBaseUrl || '/api/v1')
const turmaId = computed(() => Number(route.params.id))

const { uploadImage, validateImageFile } = useImageUpload()

// Estados principais
const loading = ref(true)
const error = ref(null)          // erro global (bloqueia a página)
const turma = ref(null)
const enrollments = ref([])
const meetings = ref([])
const resources = ref([])
const announcements = ref([])
const enrollmentStatusFilter = ref('')

// Estados da imagem de capa
const uploadingCover = ref(false)
const coverError = ref(null)     // erro específico do upload
const coverUploadStatus = ref(null)
const localCoverPreviewUrl = ref(null)
const coverFileInput = ref(null)

const coverPreviewSrc = computed(() => {
  return localCoverPreviewUrl.value || turma.value?.cover_url || null
})

function revokeLocalCoverPreview() {
  if (localCoverPreviewUrl.value) {
    URL.revokeObjectURL(localCoverPreviewUrl.value)
    localCoverPreviewUrl.value = null
  }
}

onBeforeUnmount(() => {
  revokeLocalCoverPreview()
})

onMounted(loadPage)

async function authFetch(path, options = {}) {
  await restoreSession()
  const token = getAccessToken()
  if (!token) throw new Error('Você precisa estar logado.')
  return await $fetch(path, {
    baseURL: apiBase.value,
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` }
  })
}

async function loadPage() {
  loading.value = true
  error.value = null
  try {
    turma.value = await authFetch(`/turmas/${turmaId.value}`)
    await Promise.all([loadEnrollments(), loadMeetings(), loadResources(), loadAnnouncements()])
  } catch (err) {
    error.value = err?.data?.detail || err?.message || 'Erro inesperado.'
  } finally {
    loading.value = false
  }
}

async function loadEnrollments() {
  const query = { limit: 200 }
  if (enrollmentStatusFilter.value) query.status = enrollmentStatusFilter.value
  enrollments.value = await authFetch(`/turmas/${turmaId.value}/enrollments`, { query })
}
async function loadMeetings() { try { meetings.value = await authFetch(`/turmas/${turmaId.value}/meetings`) } catch { meetings.value = [] } }
async function loadResources() { try { resources.value = await authFetch(`/turmas/${turmaId.value}/resources`) } catch { resources.value = [] } }
async function loadAnnouncements() { try { announcements.value = await authFetch(`/turmas/${turmaId.value}/announcements`) } catch { announcements.value = [] } }

// ---------- Ações da turma ----------
async function submitTurma() { await action(`/turmas/${turmaId.value}/submit`, 'Turma enviada para revisão.') }
async function openEnrollment() { await action(`/turmas/${turmaId.value}/open-enrollment`, 'Inscrições abertas.') }
async function startTurma() { await action(`/turmas/${turmaId.value}/start`, 'Turma iniciada.') }
async function completeTurma() { await action(`/turmas/${turmaId.value}/complete`, 'Turma concluída.') }
async function cancelTurma() { const reason = window.prompt('Motivo do cancelamento:') || null; await action(`/turmas/${turmaId.value}/cancel`, 'Turma cancelada.', { reason }) }

async function acceptEnrollment(enrollment) { await action(`/turmas/enrollments/${enrollment.id}/accept`, 'Aluno aceito.') }
async function waitlistEnrollment(enrollment) { await action(`/turmas/enrollments/${enrollment.id}/waitlist`, 'Aluno colocado na lista de espera.') }
async function activateEnrollment(enrollment) { await action(`/turmas/enrollments/${enrollment.id}/activate`, 'Aluno ativado.') }
async function rejectEnrollment(enrollment) { const rejection_reason = window.prompt('Motivo da rejeição:') || null; if (!rejection_reason) return; await action(`/turmas/enrollments/${enrollment.id}/reject`, 'Aluno rejeitado.', { rejection_reason }) }
async function removeEnrollment(enrollment) { const reason = window.prompt('Motivo da remoção:') || null; await action(`/turmas/enrollments/${enrollment.id}/remove`, 'Aluno removido.', { reason }) }

async function action(path, successMessage, body = null) {
  try {
    await authFetch(path, { method: 'POST', ...(body ? { body } : {}) })
    alert(successMessage)
    await loadPage()
  } catch (err) {
    alert(err?.data?.detail || err?.message || 'Ação não concluída.')
  }
}

// ---------- Upload de capa ----------
async function handleCoverFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  coverError.value = null
  coverUploadStatus.value = null

  try {
    validateImageFile(file)

    revokeLocalCoverPreview()
    localCoverPreviewUrl.value = URL.createObjectURL(file)

    uploadingCover.value = true
    coverUploadStatus.value = 'Enviando imagem…'

    const uploadedUrl = await uploadImage(file)

    // Tenta atualizar a turma via PATCH – se o endpoint não existir, trata o erro aqui
    try {
      await authFetch(`/turmas/${turmaId.value}`, {
        method: 'PATCH',
        body: { cover_url: uploadedUrl }
      })
      turma.value.cover_url = uploadedUrl
      coverUploadStatus.value = 'Imagem atualizada com sucesso!'
    } catch (patchError) {
      // Se o backend não aceitar PATCH, apenas mostramos a URL carregada
      console.warn('Backend não aceitou PATCH para atualizar capa:', patchError)
      coverError.value = 'A imagem foi enviada, mas não foi possível salvá-la na turma (405). Comunique o desenvolvedor.'
      // Ainda mantemos a prévia, mas não persiste
      turma.value.cover_url = uploadedUrl // temporário para visualização
    }

    revokeLocalCoverPreview()
  } catch (e) {
    revokeLocalCoverPreview()
    coverError.value = e?.message || 'Erro ao enviar imagem.'
    coverUploadStatus.value = null
  } finally {
    uploadingCover.value = false
    if (coverFileInput.value) {
      coverFileInput.value.value = ''
    }
  }
}

async function clearCoverImage() {
  revokeLocalCoverPreview()
  coverError.value = null
  try {
    await authFetch(`/turmas/${turmaId.value}`, {
      method: 'PATCH',
      body: { cover_url: null }
    })
    turma.value.cover_url = null
    coverUploadStatus.value = 'Imagem removida.'
  } catch (e) {
    coverError.value = 'Não foi possível remover a imagem (405).'
  }
}

// ---------- Labels ----------
function statusLabel(value) { return { DRAFT: 'Rascunho', PENDING_REVIEW: 'Em revisão', PUBLISHED: 'Publicada', ENROLLMENT_OPEN: 'Inscrições abertas', FULL: 'Cheia', ONGOING: 'Em andamento', COMPLETED: 'Concluída', CANCELLED: 'Cancelada', ARCHIVED: 'Arquivada', REJECTED: 'Rejeitada' }[value] || value }
function enrollmentStatusLabel(value) { return { SAVED: 'Salva', APPLIED: 'Aplicação', WAITLISTED: 'Lista de espera', ACCEPTED: 'Aceito', ENROLLED: 'Inscrito', ACTIVE: 'Ativo', COMPLETED: 'Concluído', REJECTED: 'Rejeitado', LEFT: 'Saiu', REMOVED: 'Removido' }[value] || value }
function dateTimeLabel(value) { if (!value) return 'A definir'; return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) }
</script>

<style scoped>
/* ========== Estilos Globais ========== */
.manage-page { min-height: 100vh; padding: 24px; background: linear-gradient(180deg,#fbfaf7,#f7f4ee); color: #111827; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.shell, .topbar { max-width: 1120px; margin: 0 auto; }
.topbar { display: flex; justify-content: space-between; margin-bottom: 14px; }
.hero { display: grid; grid-template-columns: minmax(0,1fr) 280px; gap: 18px; border: 1px solid #e8e4dc; border-radius: 28px; padding: 24px; background: #fff; box-shadow: 0 18px 44px rgba(15,23,42,.07); }
.eyebrow { margin: 0; color: #079272; font-size: .72rem; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; }
h1 { margin: 8px 0; font-size: clamp(2rem,4vw,3.2rem); line-height: 1; letter-spacing: -.06em; }
h2 { margin: 4px 0 8px; letter-spacing: -.04em; }
p { color: #66736d; line-height: 1.6; }
.layout { display: grid; grid-template-columns: minmax(0,1fr) 310px; gap: 18px; margin-top: 18px; }
.main-column, .side-column { display: grid; gap: 18px; }
.card, .action-card, .state-card { border: 1px solid #e8e4dc; border-radius: 24px; background: #fff; padding: 20px; box-shadow: 0 10px 28px rgba(15,23,42,.05); }
.meta-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.meta-row span, .status-pill { border-radius: 999px; padding: 6px 10px; background: #e8f7f2; color: #064e3b; font-size: .75rem; font-weight: 800; }

/* ========== Botões ========== */
.primary-button, .dark-button, .danger-button, .secondary-button, .ghost-button { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 11px 15px; font-weight: 850; cursor: pointer; text-decoration: none; }
.primary-button { border: 0; background: #079272; color: #fff; }
.dark-button { border: 0; background: #111827; color: #fff; }
.danger-button { border: 1px solid #fecdd3; background: #fff1f2; color: #be123c; }
.secondary-button, .ghost-button { border: 1px solid #d8d3ca; background: #fff; color: #374151; }
.small { padding: 8px 11px; font-size: .82rem; }
.full { width: 100%; margin-bottom: 8px; }

/* ========== Seções ========== */
.section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
select { border: 1px solid #d8d3ca; border-radius: 12px; padding: 9px 11px; background: #fff; }
.enrollment-item { display: flex; gap: 12px; padding: 14px 0; border-top: 1px solid #f0ece5; }
.avatar { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 14px; background: #e8f7f2; color: #064e3b; font-weight: 900; flex: 0 0 auto; }
.enrollment-body { flex: 1; min-width: 0; }
.enrollment-top { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.answers-box { display: grid; gap: 8px; margin-top: 10px; padding: 12px; border-radius: 16px; background: #fbfaf7; border: 1px solid #eee9e0; }
.answers-box span { color: #8a938f; font-size: .7rem; font-weight: 850; text-transform: uppercase; }
.answers-box p { margin: 2px 0 0; }
.actions-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.mini-item { display: grid; gap: 3px; padding: 12px 0; border-top: 1px solid #f0ece5; }
.mini-item span, .empty-inline { color: #8a938f; font-size: .86rem; }

/* ========== Upload de capa ========== */
.cover-upload-area { display: flex; flex-direction: column; gap: 12px; }
.cover-preview-wrapper { border-radius: 16px; overflow: hidden; background: #f5f3f0; border: 1px solid #e8e4dc; aspect-ratio: 16 / 9; display: flex; align-items: center; justify-content: center; }
.cover-preview-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cover-placeholder { color: #8a938f; font-size: 0.9rem; font-weight: 700; }
.upload-controls { display: flex; gap: 8px; align-items: center; }
.upload-button { cursor: pointer; }
.upload-status { margin: 0; font-size: 0.82rem; color: #047857; font-weight: 700; }
.error-message.small { color: #be123c; background: #fff1f2; border-radius: 8px; padding: 8px 12px; font-size: .82rem; }

/* ========== Responsivo ========== */
@media (max-width: 900px) { .hero, .layout { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .manage-page { padding: 14px; } .topbar { flex-direction: column; } }
</style>