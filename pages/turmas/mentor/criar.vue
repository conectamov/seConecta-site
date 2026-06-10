<script setup>
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Criar turma — seConecta' })

const config = useRuntimeConfig()
const { restoreSession, getAccessToken } = useAuth()
const apiBase = computed(() => config.public?.apiBase || config.public?.apiBaseUrl || '/api/v1')

const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const mentorProfile = ref(null)
const createdTurma = ref(null)

const selectedSubjects = ref([])

const subjectOptions = [
  { key: 'Matemática', hint: 'OBMEP, olimpíadas, raciocínio' },
  { key: 'Programação', hint: 'OBI, algoritmos, Python, C++' },
  { key: 'Ciências', hint: 'física, química, biologia, pesquisa' },
  { key: 'Pesquisa', hint: 'método, escrita, iniciação científica' },
  { key: 'Aplicações', hint: 'bolsas, summer programs, essays' },
  { key: 'Projetos', hint: 'clubes, impacto social, liderança' },
  { key: 'Carreira', hint: 'faculdade, áreas, caminhos' },
  { key: 'Inglês', hint: 'entrevistas, essays, leitura' }
]

const form = reactive({
  title: '',
  topic: '',
  short_description: '',
  description: '',
  category: 'EXPLORATION',
  level: 'OPEN_TO_ALL',
  format: 'ONLINE',
  class_size: 20,
  enrollment_mode: 'OPEN',
  number_of_meetings: 4,
  meeting_duration_minutes: 60,
  start_date: '',
  end_date: '',
  enrollment_opens_at: '',
  enrollment_closes_at: '',
  prerequisites: '',
  target_audience: '',
  not_for: '',
  meeting_platform: 'Google Meet',
  meeting_link: '',
  tagsInput: '',
  applicationQuestionsInput: '',
  related_opportunity_id: '',
  related_olympiad_id: ''
})

const canCreate = computed(() => mentorProfile.value?.status === 'APPROVED')

const inferredTags = computed(() => {
  const base = [
    ...selectedSubjects.value,
    ...splitComma(form.tagsInput)
  ]

  return [...new Set(base.map((tag) => tag.trim()).filter(Boolean))]
})

const categoryHint = computed(() => {
  return {
    OLYMPIAD: 'Turmas focadas em preparação para olimpíadas ou competições acadêmicas.',
    OPPORTUNITY_APPLICATION: 'Turmas para aplicar para bolsas, programas, intercâmbios e oportunidades.',
    RESEARCH: 'Turmas para iniciar ou organizar projetos de pesquisa.',
    TECHNOLOGY: 'Turmas de programação, IA, dados, robótica ou tecnologia.',
    PROJECTS: 'Turmas para criar iniciativas, clubes, eventos e projetos sociais.',
    SCHOLARSHIPS: 'Turmas focadas em bolsas e processos seletivos.',
    EXPLORATION: 'Turmas para estudantes que ainda estão descobrindo caminhos.',
    OTHER: 'Use quando nenhuma categoria encaixar bem.'
  }[form.category]
})

onMounted(loadMentor)

async function authFetch(path, options = {}) {
  await restoreSession()

  const token = getAccessToken()

  if (!token) {
    throw { status: 401, data: { detail: 'Not authenticated' } }
  }

  return await $fetch(path, {
    baseURL: apiBase.value,
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  })
}

async function loadMentor() {
  loading.value = true
  error.value = null

  try {
    mentorProfile.value = await authFetch('/turmas/mentor/me')
  } catch (err) {
    error.value = 'Você precisa criar e aprovar um perfil de mentor antes de criar turmas.'
  } finally {
    loading.value = false
  }
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toDateTime(value) {
  if (!value) return null
  return new Date(value).toISOString()
}

function splitComma(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function toggleSubject(subject) {
  if (selectedSubjects.value.includes(subject)) {
    selectedSubjects.value = selectedSubjects.value.filter((item) => item !== subject)
    return
  }

  selectedSubjects.value.push(subject)
}

function buildApplicationQuestions() {
  if (form.enrollment_mode !== 'APPLICATION') return []

  return String(form.applicationQuestionsInput || '')
    .split('\n')
    .map((question) => question.trim())
    .filter(Boolean)
    .map((question, index) => ({
      key: `q_${index + 1}`,
      label: question,
      type: 'text',
      required: true
    }))
}

function buildPayload() {
  const slugBase = slugify(form.title)

  return {
    title: form.title.trim(),
    slug: `${slugBase}-${Date.now().toString(36)}`,
    topic: form.topic.trim(),
    short_description: form.short_description.trim() || null,
    description: form.description.trim(),
    category: form.category,
    level: form.level,
    format: form.format,
    tags: inferredTags.value,
    class_size: Number(form.class_size || 20),
    enrollment_mode: form.enrollment_mode,
    number_of_meetings: Number(form.number_of_meetings || 1),
    meeting_duration_minutes: Number(form.meeting_duration_minutes || 60),
    start_date: toDateTime(form.start_date),
    end_date: toDateTime(form.end_date),
    enrollment_opens_at: toDateTime(form.enrollment_opens_at),
    enrollment_closes_at: toDateTime(form.enrollment_closes_at),
    prerequisites: form.prerequisites.trim() || null,
    target_audience: form.target_audience.trim() || null,
    not_for: form.not_for.trim() || null,
    meeting_platform: form.meeting_platform.trim() || null,
    meeting_link: form.meeting_link.trim() || null,
    application_questions: buildApplicationQuestions(),
    related_opportunity_id: form.related_opportunity_id ? Number(form.related_opportunity_id) : null,
    related_olympiad_id: form.related_olympiad_id ? Number(form.related_olympiad_id) : null,
    is_featured: false,
    is_free: true
  }
}

function validateForm() {
  if (!form.title.trim()) return 'O título da turma é obrigatório.'
  if (!form.topic.trim()) return 'O tópico da turma é obrigatório.'
  if (!selectedSubjects.value.length) return 'Escolha pelo menos uma matéria ou assunto.'
  if (!form.description.trim()) return 'A descrição completa é obrigatória.'
  if (Number(form.class_size || 0) < 1) return 'A turma precisa ter pelo menos uma vaga.'

  if (form.enrollment_mode === 'APPLICATION' && !form.applicationQuestionsInput.trim()) {
    return 'Adicione pelo menos uma pergunta para a aplicação.'
  }

  return null
}

async function createTurma(submit = false) {
  const validationError = validateForm()

  if (validationError) {
    error.value = validationError
    return
  }

  saving.value = true
  error.value = null

  try {
    const turma = await authFetch('/turmas/', {
      method: 'POST',
      body: buildPayload()
    })

    createdTurma.value = turma

    if (submit) {
      await authFetch(`/turmas/${turma.id}/submit`, {
        method: 'POST'
      })
    }

    await navigateTo('/turmas/mentor')
  } catch (err) {
    error.value = err?.data?.detail || err?.message || 'Não foi possível criar a turma.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main class="create-page">
    <div class="shell">
      <header class="page-header">
        <div>
          <p class="eyebrow">Nova turma</p>
          <h1>Criar turma guiada</h1>
          <p>
            Defina o tema, os assuntos, o público e o formato. Depois envie para revisão.
          </p>
        </div>

        <NuxtLink to="/turmas/mentor" class="ghost-link">
          Voltar ao painel
        </NuxtLink>
      </header>

      <section v-if="loading" class="state-card loading-card">
        <div class="skeleton-line skeleton-title" />
        <div class="skeleton-line" />
        <div class="skeleton-line skeleton-short" />
      </section>

      <section v-else-if="!canCreate" class="state-card blocked-card">
        <h2>Perfil ainda não aprovado</h2>
        <p>Você só pode criar turmas depois que seu perfil de mentor for aprovado.</p>
        <NuxtLink to="/turmas" class="primary-link">
          Ver perfil de mentor
        </NuxtLink>
      </section>

      <form v-else class="form-stack" @submit.prevent="createTurma(false)">
        <section class="form-card">
          <div class="card-head">
            <span class="step-number">1</span>
            <div>
              <h2>Identidade da turma</h2>
              <p>O estudante precisa entender em poucos segundos qual caminho essa turma abre.</p>
            </div>
          </div>

          <div class="grid two">
            <label>
              <span>Título</span>
              <input v-model="form.title" placeholder="Ex.: Primeiros passos na OBI" />
            </label>

            <label>
              <span>Tópico específico</span>
              <input v-model="form.topic" placeholder="Ex.: Programação competitiva" />
            </label>
          </div>

          <label>
            <span>Descrição curta</span>
            <input v-model="form.short_description" placeholder="Resumo que aparece no card da turma" />
          </label>

          <label>
            <span>Descrição completa</span>
            <textarea
              v-model="form.description"
              rows="5"
              placeholder="Explique objetivo, formato, ritmo e o que o estudante vai conseguir fazer depois."
            />
          </label>
        </section>

        <section class="form-card form-card--accent">
          <div class="card-head">
            <span class="step-number">2</span>
            <div>
              <h2>Matérias e assuntos</h2>
              <p>
                Isso vira tags da turma no backend e ajuda em filtros/recomendações.
              </p>
            </div>
          </div>

          <div class="subject-grid">
            <button
              v-for="subject in subjectOptions"
              :key="subject.key"
              type="button"
              class="subject-card"
              :class="{ 'subject-card--active': selectedSubjects.includes(subject.key) }"
              @click="toggleSubject(subject.key)"
            >
              <strong>{{ subject.key }}</strong>
              <span>{{ subject.hint }}</span>
            </button>
          </div>

          <label>
            <span>Tags extras</span>
            <input
              v-model="form.tagsInput"
              placeholder="OBI, iniciante, algoritmos, escola pública..."
            />
          </label>

          <div v-if="inferredTags.length" class="tag-preview">
            <span>Tags que serão salvas:</span>
            <div>
              <strong v-for="tag in inferredTags" :key="tag">{{ tag }}</strong>
            </div>
          </div>
        </section>

        <section class="form-card">
          <div class="card-head">
            <span class="step-number">3</span>
            <div>
              <h2>Formato e público</h2>
              <p>Categoria é o tipo de turma; nível e entrada definem quem consegue participar.</p>
            </div>
          </div>

          <div class="grid three">
            <label>
              <span>Categoria</span>
              <select v-model="form.category">
                <option value="OLYMPIAD">Olimpíada</option>
                <option value="OPPORTUNITY_APPLICATION">Aplicações</option>
                <option value="RESEARCH">Pesquisa</option>
                <option value="TECHNOLOGY">Tecnologia</option>
                <option value="PROJECTS">Projetos</option>
                <option value="SCHOLARSHIPS">Bolsas</option>
                <option value="EXPLORATION">Exploração</option>
                <option value="OTHER">Outra</option>
              </select>
              <small>{{ categoryHint }}</small>
            </label>

            <label>
              <span>Nível</span>
              <select v-model="form.level">
                <option value="BEGINNER">Iniciante</option>
                <option value="INTERMEDIATE">Intermediário</option>
                <option value="ADVANCED">Avançado</option>
                <option value="OPEN_TO_ALL">Aberta para todos</option>
              </select>
            </label>

            <label>
              <span>Formato</span>
              <select v-model="form.format">
                <option value="ONLINE">Online</option>
                <option value="IN_PERSON">Presencial</option>
                <option value="HYBRID">Híbrido</option>
              </select>
            </label>
          </div>

          <div class="grid two">
            <label>
              <span>Vagas</span>
              <input v-model.number="form.class_size" type="number" min="1" max="300" />
            </label>

            <label>
              <span>Entrada</span>
              <select v-model="form.enrollment_mode">
                <option value="OPEN">Entrada aberta</option>
                <option value="APPLICATION">Com aplicação</option>
              </select>
            </label>
          </div>

          <label>
            <span>Público-alvo</span>
            <textarea v-model="form.target_audience" rows="3" placeholder="Para quem essa turma é ideal?" />
          </label>

          <label>
            <span>Pré-requisitos</span>
            <textarea v-model="form.prerequisites" rows="3" placeholder="O que o estudante precisa saber ou ter antes?" />
          </label>

          <label>
            <span>Quem não deveria entrar nessa turma?</span>
            <textarea v-model="form.not_for" rows="2" placeholder="Ajuda a evitar desalinhamento." />
          </label>
        </section>

        <section class="form-card">
          <div class="card-head">
            <span class="step-number">4</span>
            <div>
              <h2>Encontros e datas</h2>
              <p>Você pode ajustar links e datas depois, mas quanto mais claro agora, melhor a revisão.</p>
            </div>
          </div>

          <div class="grid four">
            <label>
              <span>Nº encontros</span>
              <input v-model.number="form.number_of_meetings" type="number" min="1" max="50" />
            </label>

            <label>
              <span>Duração/encontro</span>
              <input v-model.number="form.meeting_duration_minutes" type="number" min="15" max="300" />
            </label>

            <label>
              <span>Início</span>
              <input v-model="form.start_date" type="datetime-local" />
            </label>

            <label>
              <span>Fim</span>
              <input v-model="form.end_date" type="datetime-local" />
            </label>
          </div>

          <div class="grid two">
            <label>
              <span>Abertura inscrições</span>
              <input v-model="form.enrollment_opens_at" type="datetime-local" />
            </label>

            <label>
              <span>Fechamento inscrições</span>
              <input v-model="form.enrollment_closes_at" type="datetime-local" />
            </label>
          </div>

          <div class="grid two">
            <label>
              <span>Plataforma</span>
              <input v-model="form.meeting_platform" placeholder="Google Meet, Zoom, Discord..." />
            </label>

            <label>
              <span>Link da reunião</span>
              <input v-model="form.meeting_link" placeholder="Pode deixar vazio por enquanto" />
            </label>
          </div>
        </section>

        <section class="form-card">
          <div class="card-head">
            <span class="step-number">5</span>
            <div>
              <h2>Aplicação e conexões</h2>
              <p>Use aplicação quando você quer selecionar ou entender melhor os estudantes.</p>
            </div>
          </div>

          <label v-if="form.enrollment_mode === 'APPLICATION'">
            <span>Perguntas da aplicação</span>
            <textarea
              v-model="form.applicationQuestionsInput"
              rows="4"
              placeholder="Uma pergunta por linha. Ex.: Por que você quer entrar nessa turma?"
            />
          </label>

          <div class="grid two">
            <label>
              <span>ID da oportunidade relacionada</span>
              <input v-model="form.related_opportunity_id" type="number" placeholder="Opcional" />
            </label>

            <label>
              <span>ID da olimpíada relacionada</span>
              <input v-model="form.related_olympiad_id" type="number" placeholder="Opcional" />
            </label>
          </div>
        </section>

        <p v-if="error" class="error-message">{{ error }}</p>

        <footer class="action-footer">
          <button
            type="button"
            class="secondary-button"
            :disabled="saving"
            @click="createTurma(false)"
          >
            Salvar rascunho
          </button>

          <button
            type="button"
            class="primary-button"
            :disabled="saving"
            @click="createTurma(true)"
          >
            {{ saving ? 'Salvando...' : 'Salvar e enviar revisão' }}
          </button>
        </footer>
      </form>
    </div>
  </main>
</template>

<style scoped>
.create-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(7, 146, 114, 0.08), transparent 28%),
    linear-gradient(180deg, #fbfaf7 0%, #f7f4ee 100%);
  color: #111827;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.shell {
  max-width: 980px;
  margin: 0 auto;
  padding: 40px 24px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 28px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #079272;
  font-size: 0.74rem;
  font-weight: 850;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.page-header h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 0.98;
  letter-spacing: -0.06em;
}

.page-header p {
  max-width: 620px;
  margin: 10px 0 0;
  color: #66736d;
  font-size: 0.96rem;
  line-height: 1.6;
}

.ghost-link,
.primary-link,
.primary-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 850;
  text-decoration: none;
  transition: 0.18s ease;
}

.ghost-link,
.secondary-button {
  border: 1px solid #d8d3ca;
  background: #fff;
  color: #111827;
}

.ghost-link {
  padding: 10px 16px;
  white-space: nowrap;
}

.primary-link,
.primary-button {
  border: 1px solid #079272;
  background: #079272;
  color: #fff;
}

.primary-link {
  padding: 12px 18px;
}

.primary-button,
.secondary-button {
  padding: 12px 18px;
  cursor: pointer;
}

.primary-button:disabled,
.secondary-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.form-stack {
  display: grid;
  gap: 18px;
}

.form-card,
.state-card {
  border: 1px solid #e8e4dc;
  border-radius: 24px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
}

.form-card--accent {
  border-color: rgba(7, 146, 114, 0.24);
  background:
    radial-gradient(circle at top right, rgba(7, 146, 114, 0.07), transparent 34%),
    #fff;
}

.card-head {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
}

.step-number {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 11px;
  background: #079272;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 900;
}

.form-card h2,
.state-card h2 {
  margin: 0;
  font-size: 1.12rem;
  line-height: 1.2;
  letter-spacing: -0.035em;
}

.form-card p,
.state-card p {
  margin: 5px 0 0;
  color: #66736d;
  font-size: 0.88rem;
  line-height: 1.5;
}

.grid {
  display: grid;
  gap: 14px;
}

.grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.grid.four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

label {
  display: grid;
  gap: 7px;
  margin-bottom: 14px;
}

label span {
  color: #374151;
  font-size: 0.78rem;
  font-weight: 850;
}

label small {
  color: #8a938f;
  font-size: 0.76rem;
  line-height: 1.35;
}

input,
textarea,
select {
  width: 100%;
  border: 1px solid #d8d3ca;
  border-radius: 14px;
  padding: 11px 12px;
  background: white;
  color: #111827;
  font: inherit;
  outline: none;
}

textarea {
  resize: vertical;
}

input:focus,
textarea:focus,
select:focus {
  border-color: #079272;
  box-shadow: 0 0 0 3px rgba(7, 146, 114, 0.1);
}

.subject-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.subject-card {
  border: 1px solid #e8e4dc;
  border-radius: 18px;
  padding: 12px;
  background: #fbfaf7;
  text-align: left;
  cursor: pointer;
  transition: 0.18s ease;
}

.subject-card:hover {
  border-color: rgba(7, 146, 114, 0.45);
  transform: translateY(-1px);
}

.subject-card strong {
  display: block;
  color: #111827;
  font-size: 0.9rem;
  font-weight: 850;
}

.subject-card span {
  display: block;
  margin-top: 4px;
  color: #66736d;
  font-size: 0.76rem;
  line-height: 1.35;
}

.subject-card--active {
  border-color: #079272;
  background: #e8f7f2;
}

.subject-card--active strong {
  color: #064e3b;
}

.tag-preview {
  margin-top: 2px;
  border: 1px solid #d9eee7;
  border-radius: 18px;
  padding: 12px;
  background: #f2fbf7;
}

.tag-preview > span {
  display: block;
  margin-bottom: 8px;
  color: #067a60;
  font-size: 0.74rem;
  font-weight: 850;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.tag-preview div {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.tag-preview strong {
  border-radius: 999px;
  padding: 6px 9px;
  background: #fff;
  color: #064e3b;
  font-size: 0.76rem;
  font-weight: 800;
}

.error-message {
  margin: 0;
  border: 1px solid #fecdd3;
  border-radius: 18px;
  padding: 13px 15px;
  background: #fff1f2;
  color: #be123c;
  font-size: 0.88rem;
  font-weight: 700;
}

.action-footer {
  position: sticky;
  bottom: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border: 1px solid #e8e4dc;
  border-radius: 22px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(10px);
}

.blocked-card {
  text-align: center;
}

.loading-card {
  display: grid;
  gap: 10px;
}

.skeleton-line {
  height: 12px;
  width: 100%;
  max-width: 600px;
  border-radius: 999px;
  background: #f0ece5;
}

.skeleton-title {
  height: 20px;
  max-width: 240px;
}

.skeleton-short {
  max-width: 420px;
}

@media (max-width: 860px) {
  .grid.two,
  .grid.three,
  .grid.four,
  .subject-grid {
    grid-template-columns: 1fr;
  }

  .page-header,
  .action-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .ghost-link,
  .primary-button,
  .secondary-button {
    width: 100%;
  }
}
</style>