<template>
  <main class="my-classes-page">
    <section class="header shell">
      <div>
        <p class="eyebrow">Minha jornada</p>
        <h1>Minhas turmas</h1>
        <p>Acompanhe turmas em que você entrou, aplicou ou concluiu.</p>
      </div>
      <NuxtLink to="/turmas" class="secondary-button">Explorar turmas</NuxtLink>
    </section>

    <section v-if="loading" class="shell state-card">Carregando suas turmas...</section>

    <section v-else-if="error" class="shell state-card error-card">
      <h2>Não foi possível carregar suas turmas</h2>
      <p>{{ error }}</p>
      <button class="primary-button" @click="loadPage">Tentar novamente</button>
    </section>

    <section v-else class="shell layout">
      <aside class="summary-card">
        <p class="eyebrow">Resumo</p>
        <h2>{{ enrollments.length }} registros</h2>
        <div class="summary-list">
          <div><strong>{{ activeCount }}</strong><span>ativas</span></div>
          <div><strong>{{ pendingCount }}</strong><span>pendentes</span></div>
          <div><strong>{{ completedCount }}</strong><span>concluídas</span></div>
        </div>
      </aside>

      <div class="classes-list">
        <div v-if="items.length === 0" class="empty-state">
          <h2>Você ainda não está em nenhuma turma</h2>
          <p>Explore turmas abertas e entre ou aplique para começar.</p>
          <NuxtLink to="/turmas" class="primary-button">Ver turmas disponíveis</NuxtLink>
        </div>

        <article v-for="item in items" :key="item.enrollment.id" class="class-card">
          <div class="class-card__bar" :style="{ background: gradientFor(item.turma?.category) }" />

          <div class="class-card__body">
            <div class="top-row">
              <div>
                <span class="status-pill">{{ enrollmentStatusLabel(item.enrollment.status) }}</span>
                <h2>{{ item.turma?.title || `Turma #${item.enrollment.turma_id}` }}</h2>
              </div>
              <span class="date-text">{{ formatDate(item.enrollment.created_at) }}</span>
            </div>

            <p>{{ item.turma?.short_description || item.turma?.description || 'Sem descrição disponível.' }}</p>

            <div v-if="mentorName(item.turma)" class="mentor-row-mini">
              <span>Mentor</span>
              <NuxtLink
                v-if="mentorProfileUrl(item.turma)"
                :to="mentorProfileUrl(item.turma)"
              >
                {{ mentorName(item.turma) }}
              </NuxtLink>
              <strong v-else>{{ mentorName(item.turma) }}</strong>
            </div>

            <div class="meta-row">
              <span>{{ categoryLabel(item.turma?.category) }}</span>
              <span>{{ item.turma?.number_of_meetings || 0 }} encontros</span>
              <span>{{ item.enrollment.attendance_count || 0 }} presenças</span>
            </div>

            <div class="actions-row">
              <NuxtLink :to="`/turmas/${item.enrollment.turma_id}`" class="primary-button small">
                Ver turma
              </NuxtLink>
              <button
                v-if="canLeave(item.enrollment.status)"
                class="danger-button small"
                :disabled="leaving[item.enrollment.turma_id]"
                @click="leaveTurma(item.enrollment.turma_id)"
              >
                Sair
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

const config = useRuntimeConfig()
const { restoreSession, getAccessToken } = useAuth()
const apiBase = computed(() => config.public?.apiBase || config.public?.apiBaseUrl || '/api/v1')

const loading = ref(true)
const error = ref(null)
const enrollments = ref([])
const turmasById = ref({})
const leaving = ref({})

const items = computed(() => {
  return enrollments.value.map((enrollment) => ({
    enrollment,
    turma: turmasById.value[enrollment.turma_id] || null
  }))
})

const activeCount = computed(() => enrollments.value.filter((item) => ['ACCEPTED', 'ENROLLED', 'ACTIVE'].includes(item.status)).length)
const pendingCount = computed(() => enrollments.value.filter((item) => ['APPLIED', 'WAITLISTED', 'SAVED'].includes(item.status)).length)
const completedCount = computed(() => enrollments.value.filter((item) => item.status === 'COMPLETED').length)

onMounted(loadPage)

async function apiFetch(path, options = {}) {
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
    enrollments.value = await apiFetch('/turmas/my/enrollments', { query: { limit: 100 } })
    await loadTurmas()
  } catch (err) {
    error.value = err?.data?.detail || err?.message || 'Erro inesperado.'
  } finally {
    loading.value = false
  }
}

async function loadTurmas() {
  const ids = [...new Set(enrollments.value.map((item) => item.turma_id))]
  await Promise.all(ids.map(async (id) => {
    if (turmasById.value[id]) return
    try {
      turmasById.value[id] = await apiFetch(`/turmas/${id}`)
    } catch {
      turmasById.value[id] = null
    }
  }))
}

async function leaveTurma(turmaId) {
  if (!window.confirm('Tem certeza que quer sair dessa turma?')) return
  leaving.value[turmaId] = true
  try {
    await apiFetch(`/turmas/${turmaId}/leave`, { method: 'POST' })
    await loadPage()
  } catch (err) {
    alert(err?.data?.detail || err?.message || 'Não foi possível sair da turma.')
  } finally {
    leaving.value[turmaId] = false
  }
}

function mentorName(turma) {
  const mentor = turma?.mentor_account
  return mentor?.user_full_name || mentor?.user_username || null
}
function mentorProfileUrl(turma) {
  const mentor = turma?.mentor_account
  return mentor?.user_profile_url || (mentor?.user_username ? `/profile/${mentor.user_username}` : null)
}
function canLeave(status) { return ['ACCEPTED', 'ENROLLED', 'ACTIVE'].includes(status) }
function enrollmentStatusLabel(value) { return { SAVED: 'Salva', APPLIED: 'Aplicação enviada', WAITLISTED: 'Lista de espera', ACCEPTED: 'Aceito', ENROLLED: 'Inscrito', ACTIVE: 'Ativo', COMPLETED: 'Concluída', REJECTED: 'Rejeitada', LEFT: 'Saiu', REMOVED: 'Removida' }[value] || value }
function categoryLabel(value) { return { OLYMPIAD: 'Olimpíada', OPPORTUNITY_APPLICATION: 'Aplicações', RESEARCH: 'Pesquisa', TECHNOLOGY: 'Tecnologia', PROJECTS: 'Projetos', EXPLORATION: 'Exploração' }[value] || 'Turma' }
function formatDate(value) { if (!value) return '—'; return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) }
function gradientFor(value) { return { OLYMPIAD: 'linear-gradient(180deg,#064e3b,#059669)', OPPORTUNITY_APPLICATION: 'linear-gradient(180deg,#4c1d95,#7c3aed)', RESEARCH: 'linear-gradient(180deg,#164e63,#0891b2)', TECHNOLOGY: 'linear-gradient(180deg,#1e3a8a,#2563eb)', PROJECTS: 'linear-gradient(180deg,#7c2d12,#ea580c)', EXPLORATION: 'linear-gradient(180deg,#134e4a,#0d9488)' }[value] || 'linear-gradient(180deg,#374151,#6b7280)' }
</script>

<style scoped>
.my-classes-page { min-height: 100vh; padding: 26px; background: linear-gradient(180deg,#fbfaf7,#f7f4ee); color: #111827; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.shell { max-width: 1080px; margin: 0 auto; }
.header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; border: 1px solid #e8e4dc; border-radius: 28px; padding: 24px; background: #fff; box-shadow: 0 14px 34px rgba(15,23,42,.06); }
.eyebrow { margin: 0; color: #079272; font-size: .72rem; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; }
h1 { margin: 8px 0; font-size: clamp(2rem,4vw,3.2rem); line-height: 1; letter-spacing: -.065em; } h2 { margin: 0; letter-spacing: -.04em; } p { color: #66736d; line-height: 1.6; }
.layout { display: grid; grid-template-columns: 280px minmax(0,1fr); gap: 18px; margin-top: 18px; }
.summary-card, .class-card, .state-card, .empty-state { border: 1px solid #e8e4dc; border-radius: 24px; background: #fff; box-shadow: 0 10px 28px rgba(15,23,42,.05); }
.summary-card { padding: 20px; height: fit-content; } .summary-list { display: grid; gap: 10px; margin-top: 16px; } .summary-list div { display: flex; justify-content: space-between; border: 1px solid #eee9e0; border-radius: 16px; padding: 12px; background: #fbfaf7; } .summary-list span { color: #66736d; }
.classes-list { display: grid; gap: 12px; } .class-card { display: grid; grid-template-columns: 8px minmax(0,1fr); overflow: hidden; } .class-card__body { padding: 18px; }
.top-row { display: flex; justify-content: space-between; gap: 12px; } .status-pill { display: inline-block; border-radius: 999px; padding: 5px 9px; background: #e8f7f2; color: #064e3b; font-size: .68rem; font-weight: 850; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px; } .date-text { color: #8a938f; font-size: .8rem; white-space: nowrap; }
.mentor-row-mini { display: flex; align-items: center; gap: 7px; margin-top: 10px; color: #66736d; font-size: .82rem; } .mentor-row-mini span { color: #8a938f; font-weight: 760; } .mentor-row-mini a, .mentor-row-mini strong { color: #079272; font-weight: 850; text-decoration: none; } .mentor-row-mini a:hover { text-decoration: underline; text-underline-offset: 3px; }
.meta-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; } .meta-row span { border-radius: 999px; padding: 6px 9px; background: #f3f1ec; color: #374151; font-size: .76rem; font-weight: 750; }
.actions-row { display: flex; gap: 8px; margin-top: 14px; } .primary-button, .secondary-button, .danger-button { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 11px 15px; font-weight: 850; text-decoration: none; cursor: pointer; } .primary-button { border: 0; background: #079272; color: #fff; } .secondary-button { border: 1px solid #d8d3ca; background: #fff; color: #374151; } .danger-button { border: 1px solid #fecdd3; background: #fff1f2; color: #be123c; } .small { padding: 9px 13px; font-size: .86rem; }
.empty-state, .state-card { padding: 32px; text-align: center; } .error-card { border-color: #fecdd3; }
@media (max-width: 820px) { .layout, .header { grid-template-columns: 1fr; flex-direction: column; } .my-classes-page { padding: 14px; } }
</style>