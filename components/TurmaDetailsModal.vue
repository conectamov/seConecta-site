<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue && turma" class="modal-backdrop" @click.self="close">
        <section class="modal-card">
          <header class="modal-header">
            <div>
              <p class="eyebrow">{{ turma.categoryLabel }}</p>
              <h2>{{ turma.title }}</h2>
              <p>{{ turma.shortDescription }}</p>
            </div>

            <button class="icon-button" @click="close">✕</button>
          </header>

          <div class="modal-grid">
            <main class="modal-main">
              <section class="panel">
                <h3>Sobre a turma</h3>
                <p>{{ turma.description }}</p>

                <div class="tag-list">
                  <span v-for="tag in turma.tags" :key="tag">
                    {{ tag }}
                  </span>
                </div>
              </section>

              <section class="panel">
                <div class="panel-head">
                  <h3>Encontros</h3>
                  <span v-if="meetingsLoading">Carregando...</span>
                </div>

                <div v-if="meetings.length" class="meeting-list">
                  <article
                    v-for="meeting in meetings"
                    :key="meeting.id"
                    class="meeting-item"
                  >
                    <div class="meeting-date">
                      <strong>{{ formatDay(meeting.starts_at) }}</strong>
                      <span>{{ formatMonth(meeting.starts_at) }}</span>
                    </div>

                    <div>
                      <strong>{{ meeting.title }}</strong>
                      <p>{{ meeting.description || 'Descrição ainda não informada.' }}</p>
                      <small>{{ formatDateTime(meeting.starts_at) }}</small>
                    </div>
                  </article>
                </div>

                <p v-else class="muted">
                  Os encontros ainda não foram publicados.
                </p>
              </section>
            </main>

            <aside class="modal-side">
              <section class="panel">
                <h3>Informações rápidas</h3>

                <div class="info-list">
                  <div>
                    <span>Status</span>
                    <strong>{{ getStatusLabel(turma.status) }}</strong>
                  </div>

                  <div>
                    <span>Nível</span>
                    <strong>{{ turma.levelLabel }}</strong>
                  </div>

                  <div>
                    <span>Vagas</span>
                    <strong>{{ availableSeats(turma) }} livres</strong>
                  </div>

                  <div>
                    <span>Encontros</span>
                    <strong>{{ turma.meetingsCount }}</strong>
                  </div>

                  <div>
                    <span>Duração</span>
                    <strong>{{ turma.duration }}</strong>
                  </div>

                  <div>
                    <span>Começo</span>
                    <strong>{{ turma.startLabel }}</strong>
                  </div>
                </div>
              </section>

              <section class="panel mentor-panel">
                <div class="mentor-avatar">
                  {{ turma.mentor.initials }}
                </div>

                <div>
                  <span>Mentor</span>
                  <NuxtLink
                    v-if="turma.mentor.profileUrl"
                    :to="turma.mentor.profileUrl"
                    class="mentor-profile-link"
                    @click="close"
                  >
                    {{ turma.mentor.name }}
                  </NuxtLink>
                  <strong v-else>{{ turma.mentor.name }}</strong>
                  <p>{{ turma.mentor.headline || getMentorTypeLabel(turma.mentor.type) }}</p>
                </div>
              </section>

              <button
                class="primary-button"
                :disabled="!canEnroll(turma)"
                @click="$emit('enroll', turma)"
              >
                {{ getEnrollLabel(turma) }}
              </button>

              <button class="secondary-button" @click="close">
                Voltar
              </button>
            </aside>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { watch, ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  turma: {
    type: Object,
    default: null
  },
  apiBase: {
    type: String,
    default: '/api/v1'
  }
})

const emit = defineEmits(['update:modelValue', 'enroll'])

const meetings = ref([])
const meetingsLoading = ref(false)

watch(
  () => [props.modelValue, props.turma?.id],
  async ([open]) => {
    if (!open || !props.turma?.id) return
    await fetchMeetings()
  },
  { immediate: true }
)

async function fetchMeetings() {
  meetingsLoading.value = true

  try {
    const response = await $fetch(`/turmas/${props.turma.id}/meetings/public`, {
      baseURL: props.apiBase,
      credentials: 'include'
    })

    meetings.value = Array.isArray(response) ? response : response?.data || []
  } catch {
    meetings.value = []
  } finally {
    meetingsLoading.value = false
  }
}

function close() {
  emit('update:modelValue', false)
}

function availableSeats(turma) {
  return Math.max(0, Number(turma.classSize || 0) - Number(turma.seatsTaken || 0))
}

function canEnroll(turma) {
  return turma.status === 'ENROLLMENT_OPEN' && availableSeats(turma) > 0
}

function getEnrollLabel(turma) {
  if (turma.status === 'FULL') return 'Turma cheia'
  if (turma.status === 'ONGOING') return 'Em andamento'
  if (turma.status === 'PUBLISHED') return 'Em breve'
  if (turma.enrollmentMode === 'APPLICATION') return 'Aplicar para turma'

  return 'Entrar na turma'
}

function getStatusLabel(status) {
  return {
    PUBLISHED: 'Publicada',
    ENROLLMENT_OPEN: 'Inscrições abertas',
    FULL: 'Cheia',
    ONGOING: 'Em andamento',
    COMPLETED: 'Concluída'
  }[status] || status
}

function getMentorTypeLabel(type) {
  return {
    PEER: 'Mentor estudante',
    AMBASSADOR: 'Embaixador seConecta',
    VERIFIED: 'Mentor verificado'
  }[type] || 'Mentor'
}

function formatDay(value) {
  if (!value) return '--'
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit' })
}

function formatMonth(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('pt-BR', { month: 'short' })
}

function formatDateTime(value) {
  if (!value) return 'Data a definir'

  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(17, 24, 39, 0.5);
}

.modal-card {
  width: min(980px, 100%);
  max-height: 92vh;
  overflow: auto;
  border-radius: 28px;
  background: #fbfaf7;
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.28);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 24px;
  border-bottom: 1px solid #e8e4dc;
  background: #fff;
}

.eyebrow {
  margin: 0;
  color: #079272;
  font-size: 0.74rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.modal-header h2 {
  margin: 6px 0;
  font-size: 2rem;
  line-height: 1;
  letter-spacing: -0.05em;
}

.modal-header p {
  max-width: 680px;
  margin: 0;
  color: #66736d;
  line-height: 1.55;
}

.icon-button {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  flex: 0 0 auto;
  border: 1px solid #d8d3ca;
  border-radius: 999px;
  background: #fff;
  cursor: pointer;
}

.modal-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 16px;
  padding: 18px;
}

.modal-main,
.modal-side {
  display: grid;
  gap: 14px;
  align-content: start;
}

.panel {
  border: 1px solid #e8e4dc;
  border-radius: 22px;
  padding: 18px;
  background: #fff;
}

.panel h3 {
  margin: 0 0 10px;
  font-size: 1.05rem;
}

.panel p {
  margin: 0;
  color: #66736d;
  line-height: 1.6;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.panel-head span,
.muted {
  color: #8a938f;
  font-size: 0.88rem;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 14px;
}

.tag-list span {
  border-radius: 999px;
  padding: 6px 10px;
  background: #e8f7f2;
  color: #064e3b;
  font-size: 0.78rem;
  font-weight: 750;
}

.meeting-list {
  display: grid;
  gap: 10px;
}

.meeting-item {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 12px;
  border: 1px solid #eee9e0;
  border-radius: 18px;
  padding: 12px;
  background: #fbfaf7;
}

.meeting-date {
  display: grid;
  place-items: center;
  align-content: center;
  border-radius: 14px;
  background: #e8f7f2;
  color: #079272;
}

.meeting-date strong {
  line-height: 1;
}

.meeting-date span {
  font-size: 0.68rem;
  font-weight: 850;
  text-transform: uppercase;
}

.meeting-item strong {
  display: block;
  font-size: 0.94rem;
}

.meeting-item p {
  margin: 4px 0;
  font-size: 0.86rem;
}

.meeting-item small {
  color: #8a938f;
}

.info-list {
  display: grid;
  gap: 10px;
}

.info-list div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #f0ece4;
  padding-bottom: 8px;
}

.info-list span {
  color: #8a938f;
  font-size: 0.82rem;
}

.info-list strong {
  text-align: right;
  font-size: 0.86rem;
}

.mentor-panel {
  display: flex;
  gap: 12px;
  align-items: center;
}

.mentor-avatar {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 14px;
  background: #e8f7f2;
  color: #079272;
  font-weight: 850;
}

.mentor-panel span {
  color: #8a938f;
  font-size: 0.76rem;
  font-weight: 850;
  text-transform: uppercase;
}

.mentor-panel strong {
  display: block;
}

.mentor-panel p {
  font-size: 0.84rem;
}

.primary-button,
.secondary-button {
  border: 0;
  border-radius: 999px;
  padding: 12px 14px;
  font-weight: 850;
  cursor: pointer;
}

.primary-button {
  background: #079272;
  color: #fff;
}

.primary-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.secondary-button {
  border: 1px solid #d8d3ca;
  background: #fff;
  color: #111827;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: 0.18s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@media (max-width: 800px) {
  .modal-grid {
    grid-template-columns: 1fr;
  }

  .modal-header {
    padding: 18px;
  }

  .modal-header h2 {
    font-size: 1.55rem;
  }
}
</style>