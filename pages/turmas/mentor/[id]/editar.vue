<template>
  <main class="edit-turma-page">
    <section class="topbar">
      <button class="back-button" @click="goBack">← Voltar</button>
      <h2>Editar turma</h2>
    </section>

    <section v-if="loading" class="shell loading-card">
      Carregando turma...
    </section>

    <section v-else-if="error" class="shell error-card">
      <h1>Não foi possível carregar os dados</h1>
      <p>{{ error }}</p>
      <button class="primary-button" @click="loadTurma">Tentar novamente</button>
    </section>

    <form v-else class="shell edit-form" @submit.prevent="submitUpdate">
      <div class="form-grid">
        <!-- Coluna principal -->
        <div class="main-col">
          <label>
            <span>Título *</span>
            <input v-model="form.title" type="text" required placeholder="Nome da turma" />
          </label>

          <label>
            <span>Slug *</span>
            <input v-model="form.slug" type="text" required placeholder="identificador-unico" />
            <small>Será usado na URL. Ex: turma-obi-2026</small>
          </label>

          <label>
            <span>Categoria *</span>
            <select v-model="form.category" required>
              <option value="" disabled>Selecione</option>
              <option value="OLYMPIAD">Olimpíada</option>
              <option value="OPPORTUNITY_APPLICATION">Aplicações</option>
              <option value="RESEARCH">Pesquisa</option>
              <option value="TECHNOLOGY">Tecnologia</option>
              <option value="PROJECTS">Projetos</option>
              <option value="EXPLORATION">Exploração</option>
              <option value="OTHER">Outro</option>
            </select>
          </label>

          <label>
            <span>Nível</span>
            <select v-model="form.level">
              <option value="" disabled>Selecione</option>
              <option value="BEGINNER">Iniciante</option>
              <option value="INTERMEDIATE">Intermediário</option>
              <option value="ADVANCED">Avançado</option>
              <option value="OPEN_TO_ALL">Aberta para todos</option>
            </select>
          </label>

          <label>
            <span>Formato</span>
            <select v-model="form.format">
              <option value="" disabled>Selecione</option>
              <option value="ONLINE">Online</option>
              <option value="IN_PERSON">Presencial</option>
              <option value="HYBRID">Híbrida</option>
              <option value="ASYNC">Assíncrona</option>
            </select>
          </label>

          <label>
            <span>Tópico</span>
            <input v-model="form.topic" type="text" placeholder="Ex: Preparação OBI, Introdução a Python" />
          </label>

          <label>
            <span>Descrição completa *</span>
            <textarea v-model="form.description" rows="6" required placeholder="Descreva a turma, metodologia, público-alvo..."></textarea>
          </label>

          <label>
            <span>Descrição curta (resumo)</span>
            <textarea v-model="form.short_description" rows="3" placeholder="Um resumo de até 200 caracteres"></textarea>
          </label>

          <!-- Perguntas de aplicação (modo APLICAÇÃO) -->
          <fieldset v-if="form.enrollment_mode === 'APPLICATION'">
            <legend>Perguntas de aplicação</legend>
            <p class="hint">Defina o que os candidatos devem responder.</p>
            <div v-for="(q, idx) in applicationQuestions" :key="idx" class="question-row">
              <div class="question-inputs">
                <input v-model="q.label" placeholder="Pergunta" />
                <select v-model="q.type">
                  <option value="textarea">Texto longo</option>
                  <option value="text">Texto curto</option>
                </select>
                <label class="required-check">
                  <input type="checkbox" v-model="q.required" /> Obrigatória
                </label>
              </div>
              <button type="button" class="remove-question" @click="removeQuestion(idx)">✕</button>
            </div>
            <button type="button" class="secondary-button" @click="addQuestion">+ Adicionar pergunta</button>
          </fieldset>
        </div>

        <!-- Coluna lateral -->
        <aside class="side-col">
          <div class="card">
            <h3>Configurações da turma</h3>

            <label>
              <span>Vagas (class_size) *</span>
              <input v-model.number="form.class_size" type="number" min="1" required />
            </label>

            <label>
              <span>Número de encontros</span>
              <input v-model.number="form.number_of_meetings" type="number" min="0" />
            </label>

            <label>
              <span>Duração média (minutos)</span>
              <input v-model.number="form.meeting_duration_minutes" type="number" min="0" />
            </label>

            <label>
              <span>Modo de inscrição *</span>
              <select v-model="form.enrollment_mode" required>
                <option value="OPEN">Aberta (entrada direta)</option>
                <option value="APPLICATION">Aplicação (com perguntas)</option>
              </select>
            </label>

            <label class="checkbox-field">
              <input v-model="form.is_featured" type="checkbox" />
              <span>Destacar turma na plataforma</span>
            </label>

            <div class="form-actions">
              <button type="button" class="secondary-button" @click="goBack">Cancelar</button>
              <button type="submit" class="primary-button" :disabled="submitting">
                {{ submitting ? 'Salvando...' : 'Salvar alterações' }}
              </button>
            </div>

            <p v-if="updateError" class="error-message">{{ updateError }}</p>
            <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
          </div>
        </aside>
      </div>
    </form>
  </main>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const config = useRuntimeConfig()
const { restoreSession, getAccessToken } = useAuth()

const turmaId = computed(() => Number(route.params.id))
const apiBase = computed(() => config.public?.apiBase || config.public?.apiBaseUrl || '/api/v1')

const loading = ref(true)
const error = ref(null)
const submitting = ref(false)
const updateError = ref(null)
const successMessage = ref(null)

const form = reactive({
  title: '',
  slug: '',
  category: '',
  level: '',
  format: '',
  topic: '',
  description: '',
  short_description: '',
  class_size: 20,
  number_of_meetings: 0,
  meeting_duration_minutes: null,
  enrollment_mode: 'OPEN',
  is_featured: false,
  application_questions: null, // será populado
})

// Helper array para manipular as perguntas
const applicationQuestions = ref([])

// Conversão entre array e o campo JSON
function syncQuestionsToForm() {
  if (form.enrollment_mode === 'APPLICATION') {
    form.application_questions = applicationQuestions.value.map(({ label, type, required }) => ({
      label,
      type,
      required,
    }))
  } else {
    form.application_questions = null
  }
}

function addQuestion() {
  applicationQuestions.value.push({ label: '', type: 'textarea', required: true })
}

function removeQuestion(idx) {
  applicationQuestions.value.splice(idx, 1)
}

// Watch para sincronizar sempre que o modo de inscrição mudar
watch(() => form.enrollment_mode, () => {
  if (form.enrollment_mode === 'APPLICATION' && applicationQuestions.value.length === 0) {
    addQuestion()
  }
  syncQuestionsToForm()
})

onMounted(loadTurma)

async function apiFetch(path, options = {}, requireAuth = true) {
  await restoreSession()
  const token = getAccessToken()

  if (requireAuth && !token) {
    throw new Error('Você precisa estar logado.')
  }

  return await $fetch(path, {
    baseURL: apiBase.value,
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })
}

async function loadTurma() {
  loading.value = true
  error.value = null
  try {
    const turma = await apiFetch(`/turmas/${turmaId.value}`)
    // Preenche o formulário com os dados da turma
    form.title = turma.title || ''
    form.slug = turma.slug || ''
    form.category = turma.category || ''
    form.level = turma.level || ''
    form.format = turma.format || ''
    form.topic = turma.topic || ''
    form.description = turma.description || ''
    form.short_description = turma.short_description || ''
    form.class_size = turma.class_size || 20
    form.number_of_meetings = turma.number_of_meetings || 0
    form.meeting_duration_minutes = turma.meeting_duration_minutes ?? null
    form.enrollment_mode = turma.enrollment_mode || 'OPEN'
    form.is_featured = turma.is_featured || false

    // Carrega perguntas de aplicação, se houver
    if (Array.isArray(turma.application_questions) && turma.application_questions.length) {
      applicationQuestions.value = turma.application_questions.map(q => ({
        label: q.label || '',
        type: q.type || 'textarea',
        required: q.required !== false,
      }))
    } else if (form.enrollment_mode === 'APPLICATION') {
      // Inicia com uma pergunta vazia
      addQuestion()
    }
  } catch (err) {
    error.value = err?.data?.detail || err?.message || 'Erro ao carregar turma.'
  } finally {
    loading.value = false
  }
}

async function submitUpdate() {
  submitting.value = true
  updateError.value = null
  successMessage.value = null

  syncQuestionsToForm()

  // Monta o payload apenas com campos alterados? Vamos enviar todos, mas você pode adaptar.
  const payload = {
    title: form.title.trim(),
    slug: form.slug.trim(),
    category: form.category,
    level: form.level || undefined,
    format: form.format || undefined,
    topic: form.topic.trim() || undefined,
    description: form.description.trim(),
    short_description: form.short_description.trim() || undefined,
    class_size: form.class_size,
    number_of_meetings: form.number_of_meetings,
    meeting_duration_minutes: form.meeting_duration_minutes,
    enrollment_mode: form.enrollment_mode,
    is_featured: form.is_featured,
    application_questions: form.enrollment_mode === 'APPLICATION' ? form.application_questions : null,
  }

  // Remove campos undefined/null para não enviar
  Object.keys(payload).forEach(key => {
    if (payload[key] === undefined || payload[key] === null) {
      if (key !== 'application_questions' && form.enrollment_mode !== 'APPLICATION') {
        delete payload[key]
      }
    }
  })

  try {
    await apiFetch(`/turmas/${turmaId.value}`, {
      method: 'PATCH',
      body: payload,
    }, true)

    successMessage.value = 'Turma atualizada com sucesso!'
    setTimeout(() => {
      navigateTo(`/turmas/mentor/${turmaId.value}`)
    }, 1500)
  } catch (err) {
    updateError.value = err?.data?.detail || err?.message || 'Erro ao salvar.'
  } finally {
    submitting.value = false
  }
}

function goBack() {
  navigateTo(`/turmas/mentor/${turmaId.value}`)
}
</script>

<style scoped>
.edit-turma-page {
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(180deg, #fbfaf7, #f7f4ee);
  color: #111827;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.topbar {
  max-width: 1120px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.topbar h2 { margin: 0; font-size: 1.5rem; }

.back-button {
  border: 1px solid #d8d3ca;
  border-radius: 999px;
  padding: 10px 14px;
  background: #fff;
  color: #374151;
  font-weight: 750;
  cursor: pointer;
}

.shell { max-width: 1120px; margin: 0 auto; }

.loading-card, .error-card {
  border: 1px solid #e8e4dc;
  border-radius: 24px;
  padding: 30px;
  background: #fff;
  text-align: center;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  align-items: start;
}

.main-col, .side-col { display: grid; gap: 18px; }

.card {
  border: 1px solid #e8e4dc;
  border-radius: 24px;
  padding: 20px;
  background: #fff;
  display: grid;
  gap: 16px;
}

label { display: grid; gap: 6px; }
label span { font-size: .78rem; font-weight: 850; color: #374151; }
label small { color: #66736d; font-size: .72rem; }

input, textarea, select {
  border: 1px solid #d8d3ca;
  border-radius: 14px;
  padding: 11px 12px;
  font: inherit;
  outline: none;
  background: #fff;
}
input:focus, textarea:focus, select:focus {
  border-color: #079272;
  box-shadow: 0 0 0 3px rgba(7,146,114,.1);
}

.checkbox-field { display: flex; align-items: center; gap: 8px; }
.checkbox-field input { width: 16px; height: 16px; }

fieldset { border: 1px solid #e8e4dc; border-radius: 16px; padding: 16px; }
legend { font-weight: 850; color: #374151; }
.hint { color: #66736d; margin: 0 0 12px; font-size: .82rem; }

.question-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.question-inputs {
  flex: 1;
  display: flex;
  gap: 8px;
  align-items: center;
}
.question-inputs input {
  flex: 2;
}
.question-inputs select {
  flex: 1;
}
.required-check {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: .75rem;
  white-space: nowrap;
}
.remove-question {
  background: none;
  border: none;
  color: #be123c;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.primary-button, .secondary-button {
  border: 0;
  border-radius: 999px;
  padding: 12px 20px;
  font-weight: 850;
  cursor: pointer;
}
.primary-button { background: #079272; color: #fff; }
.secondary-button { border: 1px solid #d8d3ca; background: #fff; color: #374151; }
.primary-button:disabled { opacity: .6; cursor: not-allowed; }

.error-message {
  color: #be123c;
  background: #fff1f2;
  border-radius: 12px;
  padding: 10px 12px;
  margin: 0;
}
.success-message {
  color: #079272;
  background: #e8f7f2;
  border-radius: 12px;
  padding: 10px 12px;
  margin: 0;
}

@media (max-width: 800px) {
  .form-grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .edit-turma-page { padding: 14px; }
}
</style>