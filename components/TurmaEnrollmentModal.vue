<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue && turma" class="modal-backdrop" @click.self="close">
        <section class="modal-card">
          <header class="modal-header">
            <div>
              <p class="eyebrow">
                {{ isApplication ? 'Aplicação para turma' : 'Entrar na turma' }}
              </p>
              <h2>{{ turma.title }}</h2>
              <p>
                {{ isApplication
                  ? 'Responda rapidamente para o mentor entender seu momento.'
                  : 'Confirme sua entrada e escolha como você quer participar.' }}
              </p>
            </div>

            <button class="icon-button" @click="close">✕</button>
          </header>

          <form class="modal-body" @submit.prevent="submit">
            <section class="panel">
              <label>
                <span>Como você quer participar?</span>
                <select v-model="commitmentLevel">
                  <option value="EXPLORING">Só quero explorar</option>
                  <option value="ACTIVE">Quero participar ativamente</option>
                  <option value="SERIOUS_PREPARATION">Quero me preparar com constância</option>
                </select>
              </label>

              <label v-if="isApplication">
                <span>Por que você quer entrar nessa turma?</span>
                <textarea
                  v-model="motivation"
                  rows="4"
                  placeholder="Conte rapidamente seu objetivo..."
                />
              </label>

              <label v-if="isApplication">
                <span>Qual é seu nível atual no tema?</span>
                <select v-model="currentLevel">
                  <option value="BEGINNER">Estou começando</option>
                  <option value="INTERMEDIATE">Já tenho alguma base</option>
                  <option value="ADVANCED">Já tenho experiência</option>
                </select>
              </label>

              <label v-if="isApplication">
                <span>Você consegue acompanhar os encontros?</span>
                <textarea
                  v-model="availability"
                  rows="3"
                  placeholder="Ex.: sim, tenho disponibilidade aos sábados..."
                />
              </label>

              <label>
                <span>Observação para o mentor</span>
                <textarea
                  v-model="studentNote"
                  rows="3"
                  placeholder="Opcional"
                />
              </label>
            </section>

            <p v-if="error" class="error-message">
              {{ error }}
            </p>

            <footer class="modal-footer">
              <button type="button" class="secondary-button" @click="close">
                Cancelar
              </button>

              <button type="submit" class="primary-button" :disabled="submitting">
                {{ submitting ? 'Enviando...' : submitLabel }}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

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

const emit = defineEmits(['update:modelValue', 'success'])

const { restoreSession, getAccessToken } = useAuth()

const commitmentLevel = ref('ACTIVE')
const motivation = ref('')
const currentLevel = ref('BEGINNER')
const availability = ref('')
const studentNote = ref('')
const submitting = ref(false)
const error = ref(null)

const isApplication = computed(() => {
  return props.turma?.enrollmentMode === 'APPLICATION'
})

const submitLabel = computed(() => {
  if (isApplication.value) return 'Enviar aplicação'
  return 'Confirmar entrada'
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    reset()
  }
)

function reset() {
  commitmentLevel.value = 'ACTIVE'
  motivation.value = ''
  currentLevel.value = 'BEGINNER'
  availability.value = ''
  studentNote.value = ''
  submitting.value = false
  error.value = null
}

function close() {
  emit('update:modelValue', false)
}

async function authFetch(path, options = {}) {
  await restoreSession()

  const token = getAccessToken()

  if (!token) {
    throw {
      status: 401,
      data: { detail: 'Not authenticated' }
    }
  }

  return await $fetch(path, {
    baseURL: props.apiBase,
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  })
}

async function submit() {
  if (!props.turma?.id) return

  error.value = null

  if (isApplication.value && !motivation.value.trim()) {
    error.value = 'Escreva pelo menos uma motivação curta para aplicar.'
    return
  }

  submitting.value = true

  try {
    const payload = {
      commitment_level: commitmentLevel.value,
      student_note: studentNote.value || null,
      application_answers: isApplication.value
        ? {
            motivation: motivation.value,
            current_level: currentLevel.value,
            availability: availability.value
          }
        : {}
    }

    const enrollment = await authFetch(`/turmas/${props.turma.id}/join`, {
      method: 'POST',
      body: payload
    })

    emit('success', enrollment)
  } catch (err) {
    error.value = err?.data?.detail || err?.response?._data?.detail || err?.message || 'Não foi possível concluir a inscrição.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(17, 24, 39, 0.5);
}

.modal-card {
  width: min(620px, 100%);
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
  padding: 22px;
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
  font-size: 1.7rem;
  line-height: 1;
  letter-spacing: -0.05em;
}

.modal-header p {
  margin: 0;
  color: #66736d;
  line-height: 1.5;
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

.modal-body {
  display: grid;
  gap: 14px;
  padding: 18px;
}

.panel {
  display: grid;
  gap: 14px;
  border: 1px solid #e8e4dc;
  border-radius: 22px;
  padding: 18px;
  background: #fff;
}

label {
  display: grid;
  gap: 7px;
}

label span {
  color: #66736d;
  font-size: 0.82rem;
  font-weight: 850;
}

select,
textarea {
  width: 100%;
  border: 1px solid #d8d3ca;
  border-radius: 14px;
  padding: 11px 12px;
  background: #fff;
  color: #111827;
  font: inherit;
  outline: none;
}

select:focus,
textarea:focus {
  border-color: #079272;
  box-shadow: 0 0 0 3px rgba(7, 146, 114, 0.1);
}

.error-message {
  margin: 0;
  border-radius: 14px;
  padding: 10px 12px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 0.9rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.primary-button,
.secondary-button {
  border: 0;
  border-radius: 999px;
  padding: 12px 16px;
  font-weight: 850;
  cursor: pointer;
}

.primary-button {
  background: #079272;
  color: #fff;
}

.primary-button:disabled {
  opacity: 0.6;
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

@media (max-width: 640px) {
  .modal-footer {
    flex-direction: column;
  }

  .primary-button,
  .secondary-button {
    width: 100%;
  }
}
</style>