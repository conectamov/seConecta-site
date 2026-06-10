<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-backdrop" @click.self="close">
        <section class="modal-card">
          <header class="modal-header">
            <div>
              <p class="eyebrow">Perfil de mentor</p>
              <h2>{{ approvedView ? 'Seu perfil de mentor' : 'Conte como você quer guiar estudantes.' }}</h2>
              <p>
                {{ approvedView
                  ? 'Você já está aprovado para criar e gerenciar turmas no seConecta.'
                  : 'Esse perfil será revisado antes de liberar a criação de turmas públicas.' }}
              </p>
            </div>

            <button class="icon-button" type="button" @click="close">✕</button>
          </header>

          <section v-if="approvedView" class="modal-body">
            <article class="approved-card">
              <div class="approved-top">
                <div class="approved-avatar">{{ profileInitial }}</div>
                <div>
                  <span class="status-pill">Mentor aprovado</span>
                  <h3>{{ currentProfile?.headline || 'Perfil de mentor' }}</h3>
                  <p>{{ currentProfile?.bio || 'Sem descrição.' }}</p>
                </div>
              </div>

              <div class="profile-grid">
                <div>
                  <span>Tipo</span>
                  <strong>{{ mentorTypeLabel(currentProfile?.mentor_type) }}</strong>
                </div>
                <div>
                  <span>Experiência</span>
                  <strong>{{ mentorLevelLabel(currentProfile?.mentor_level) }}</strong>
                </div>
                <div>
                  <span>Limite de turmas</span>
                  <strong>{{ currentProfile?.max_active_turmas || 2 }}</strong>
                </div>
              </div>

              <div class="chip-section">
                <span class="field-title">Áreas</span>
                <div class="chips">
                  <span v-for="area in currentProfile?.areas || []" :key="area">{{ area }}</span>
                  <small v-if="!currentProfile?.areas?.length">Não informado</small>
                </div>
              </div>

              <div class="chip-section">
                <span class="field-title">Tópicos</span>
                <div class="chips">
                  <span v-for="topic in currentProfile?.topics || []" :key="topic">{{ topic }}</span>
                  <small v-if="!currentProfile?.topics?.length">Não informado</small>
                </div>
              </div>

              <div class="approved-actions">
                <button class="secondary-button" type="button" @click="editingApprovedProfile = true">
                  Editar perfil
                </button>
                <button class="secondary-button" type="button" @click="goToDashboard">
                  Painel do mentor
                </button>
                <button class="primary-button" type="button" @click="goToCreateTurma">
                  Criar turma
                </button>
                <button class="danger-button" type="button" @click="deleteConfirmOpen = true">
                  Excluir perfil
                </button>
              </div>

              <div v-if="deleteConfirmOpen" class="delete-box">
                <strong>Excluir perfil de mentor?</strong>
                <p>
                  Isso remove seu perfil de mentor. Você só poderá excluir se ainda não tiver criado turmas.
                  Para confirmar, digite <b>excluir</b> abaixo.
                </p>
                <input v-model="deleteConfirmText" type="text" placeholder="Digite: excluir" />
                <div class="delete-actions">
                  <button class="secondary-button" type="button" :disabled="deleting" @click="cancelDelete">
                    Cancelar
                  </button>
                  <button class="danger-button danger-button--filled" type="button" :disabled="deleting || deleteConfirmText.trim().toLowerCase() !== 'excluir'" @click="deleteProfile">
                    {{ deleting ? 'Excluindo...' : 'Confirmar exclusão' }}
                  </button>
                </div>
              </div>
            </article>
          </section>

          <form v-else class="modal-body" @submit.prevent="saveAndSubmit">
            <section v-if="currentStatus" class="status-box" :class="`status-box--${String(currentStatus).toLowerCase()}`">
              <strong>Status atual: {{ statusLabel }}</strong>
              <span v-if="currentStatus === 'PENDING'">Seu perfil está em revisão. Você ainda pode editar e reenviar se precisar.</span>
              <span v-if="currentStatus === 'REJECTED'">Seu perfil foi rejeitado. Revise as informações e envie novamente.</span>
            </section>

            <section class="step-card step-card--highlight">
              <div class="step-card__head">
                <span class="step-number">1</span>
                <div>
                  <h3>Qual turma você quer criar?</h3>
                  <p>Comece pelo tipo de ajuda que você consegue oferecer.</p>
                </div>
              </div>

              <div class="path-grid">
                <button
                  v-for="path in mentorPaths"
                  :key="path.key"
                  type="button"
                  class="path-card"
                  :class="{ 'path-card--active': selectedPath === path.key }"
                  @click="selectPath(path)"
                >
                  <strong>{{ path.title }}</strong>
                  <span>{{ path.description }}</span>
                </button>
              </div>

              <label>
                <span>Título do seu perfil</span>
                <input v-model="form.headline" type="text" maxlength="160" placeholder="Ex.: Ajudo iniciantes a começarem na OBI" />
              </label>

              <label>
                <span>O que você quer ajudar estudantes a fazer?</span>
                <textarea v-model="form.bio" rows="4" maxlength="3000" placeholder="Explique sua experiência, o público que você quer ajudar e que tipo de turma pretende guiar." />
              </label>
            </section>

            <section class="step-card">
              <div class="step-card__head">
                <span class="step-number">2</span>
                <div>
                  <h3>Seu perfil como mentor</h3>
                  <p>Isso ajuda o seConecta a entender onde sua turma se encaixa.</p>
                </div>
              </div>

              <div class="form-grid">
                <label>
                  <span>Tipo de mentor</span>
                  <select v-model="form.mentor_type">
                    <option value="PEER">Sou estudante e quero ajudar outros estudantes</option>
                    <option value="AMBASSADOR">Sou embaixador seConecta</option>
                    <option value="VERIFIED">Sou professor, universitário ou mentor verificado</option>
                  </select>
                </label>

                <label>
                  <span>Experiência</span>
                  <select v-model="form.mentor_level">
                    <option value="BEGINNER_GUIDE">Consigo guiar iniciantes</option>
                    <option value="EXPERIENCED">Já tenho boa experiência no tema</option>
                    <option value="ADVANCED">Tenho experiência avançada</option>
                    <option value="SPECIALIST">Sou especialista nesse assunto</option>
                  </select>
                </label>
              </div>

              <div>
                <span class="field-title">Áreas que você pode orientar</span>
                <div class="chip-grid">
                  <button v-for="area in areaOptions" :key="area" type="button" class="choice-chip" :class="{ 'choice-chip--active': selectedAreas.includes(area) }" @click="toggleFromList(selectedAreas, area)">
                    {{ area }}
                  </button>
                </div>
              </div>

              <label>
                <span>Tópicos específicos</span>
                <input v-model="topicsInput" type="text" placeholder="Ex.: OBI, OBMEP, Python, pesquisa, essays..." />
              </label>
            </section>

            <section class="step-card">
              <div class="step-card__head">
                <span class="step-number">3</span>
                <div>
                  <h3>Disponibilidade</h3>
                  <p>Não precisa ser exato agora. É só para entender seu ritmo.</p>
                </div>
              </div>

              <span class="field-title">Dias possíveis</span>
              <div class="day-grid">
                <button v-for="day in days" :key="day.value" type="button" class="day-chip" :class="{ 'day-chip--active': selectedDays.includes(day.value) }" @click="toggleFromList(selectedDays, day.value)">
                  {{ day.label }}
                </button>
              </div>

              <span class="field-title field-title--spaced">Períodos preferidos</span>
              <div class="chip-grid">
                <button v-for="period in periodOptions" :key="period.value" type="button" class="choice-chip" :class="{ 'choice-chip--active': selectedPeriods.includes(period.value) }" @click="toggleFromList(selectedPeriods, period.value)">
                  {{ period.label }}
                </button>
              </div>

              <label>
                <span>Quantas turmas você conseguiria acompanhar por vez?</span>
                <select v-model.number="form.max_active_turmas">
                  <option :value="1">1 turma</option>
                  <option :value="2">Até 2 turmas</option>
                  <option :value="3">Até 3 turmas</option>
                  <option :value="5">Até 5 turmas</option>
                </select>
              </label>
            </section>

            <section class="step-card">
              <div class="step-card__head">
                <span class="step-number">4</span>
                <div>
                  <h3>Referências e segurança</h3>
                  <p>Links são opcionais, mas ajudam na revisão do perfil.</p>
                </div>
              </div>

              <label>
                <span>Links de referência, certificados ou perfis</span>
                <textarea v-model="proofLinksInput" rows="3" placeholder="Um link por linha. Pode ser certificado, LinkedIn, GitHub, post, página de projeto..." />
              </label>

              <div class="rules-box">
                <label class="check-row">
                  <input v-model="form.accepts_code_of_conduct" type="checkbox" />
                  <span>Aceito o código de conduta do seConecta.</span>
                </label>

                <label class="check-row">
                  <input v-model="form.accepts_safety_rules" type="checkbox" />
                  <span>Aceito as regras de segurança para mentoria em grupo.</span>
                </label>
              </div>
            </section>

            <p v-if="error" class="error-message">{{ error }}</p>

            <section v-if="currentProfile?.id" class="delete-box delete-box--compact">
              <strong>Zona de risco</strong>
              <p>
                Você pode excluir seu perfil de mentor se ainda não tiver criado turmas.
              </p>
              <button v-if="!deleteConfirmOpen" class="danger-button" type="button" @click="deleteConfirmOpen = true">
                Excluir perfil de mentor
              </button>
              <div v-else class="delete-confirm-inline">
                <input v-model="deleteConfirmText" type="text" placeholder="Digite: excluir" />
                <button class="secondary-button" type="button" :disabled="deleting" @click="cancelDelete">
                  Cancelar
                </button>
                <button class="danger-button danger-button--filled" type="button" :disabled="deleting || deleteConfirmText.trim().toLowerCase() !== 'excluir'" @click="deleteProfile">
                  {{ deleting ? 'Excluindo...' : 'Excluir' }}
                </button>
              </div>
            </section>

            <footer class="modal-footer">
              <button v-if="editingApprovedProfile" type="button" class="secondary-button" :disabled="submitting" @click="editingApprovedProfile = false">
                Cancelar edição
              </button>
              <button v-if="currentStatus !== 'APPROVED'" type="button" class="secondary-button" :disabled="submitting" @click="saveDraft">
                Salvar rascunho
              </button>
              <button type="submit" class="primary-button" :disabled="submitting || !canSubmit">
                {{ submitting ? 'Enviando...' : currentStatus === 'APPROVED' ? 'Salvar alterações' : 'Enviar para revisão' }}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useAuth } from '~/composables/useAuth'

const props = defineProps({ modelValue: { type: Boolean, default: false }, apiBase: { type: String, default: '/api/v1' } })
const emit = defineEmits(['update:modelValue', 'success', 'deleted'])
const { getAccessToken, restoreSession } = useAuth()

const submitting = ref(false)
const error = ref(null)
const currentProfile = ref(null)
const currentStatus = ref(null)
const editingApprovedProfile = ref(false)
const deleteConfirmOpen = ref(false)
const deleteConfirmText = ref('')
const deleting = ref(false)

const selectedPath = ref('OLYMPIAD')
const selectedAreas = ref(['Olimpíadas'])
const selectedDays = ref([])
const selectedPeriods = ref([])
const topicsInput = ref('')
const proofLinksInput = ref('')

const form = reactive({ mentor_type: 'PEER', mentor_level: 'BEGINNER_GUIDE', headline: '', bio: '', max_active_turmas: 2, accepts_code_of_conduct: false, accepts_safety_rules: false })

const mentorPaths = [
  { key: 'OLYMPIAD', title: 'Olimpíadas', description: 'Ajudar estudantes a começar ou se preparar para olimpíadas.', areas: ['Olimpíadas'], topics: 'OBI, OBMEP' },
  { key: 'APPLICATION', title: 'Aplicações', description: 'Guiar candidaturas para bolsas, programas e oportunidades.', areas: ['Bolsas e programas', 'Aplicações'], topics: 'bolsas, essays, documentos' },
  { key: 'RESEARCH', title: 'Pesquisa', description: 'Ajudar estudantes a entender pesquisa e projetos acadêmicos.', areas: ['Pesquisa'], topics: 'pesquisa científica, iniciação, escrita' },
  { key: 'PROJECTS', title: 'Projetos', description: 'Ajudar estudantes a criar clubes, iniciativas e projetos.', areas: ['Projetos', 'Liderança'], topics: 'projetos sociais, clubes, liderança' },
  { key: 'EXPLORATION', title: 'Exploração', description: 'Ajudar estudantes que ainda não sabem por onde começar.', areas: ['Exploração de oportunidades'], topics: 'oportunidades, jornada, primeiros passos' }
]

const areaOptions = ['Olimpíadas', 'Tecnologia', 'Pesquisa', 'Bolsas e programas', 'Aplicações', 'Projetos', 'Liderança', 'Exploração de oportunidades', 'Comunicação', 'Carreira']
const days = [
  { value: 'MONDAY', label: 'Seg' }, { value: 'TUESDAY', label: 'Ter' }, { value: 'WEDNESDAY', label: 'Qua' },
  { value: 'THURSDAY', label: 'Qui' }, { value: 'FRIDAY', label: 'Sex' }, { value: 'SATURDAY', label: 'Sáb' }, { value: 'SUNDAY', label: 'Dom' }
]
const periodOptions = [{ value: 'MORNING', label: 'Manhã' }, { value: 'AFTERNOON', label: 'Tarde' }, { value: 'NIGHT', label: 'Noite' }, { value: 'WEEKENDS', label: 'Fins de semana' }]

const approvedView = computed(() => currentStatus.value === 'APPROVED' && !editingApprovedProfile.value)
const profileInitial = computed(() => (currentProfile.value?.headline || 'M').charAt(0).toUpperCase())
const canSubmit = computed(() => Boolean(form.headline.trim() && form.bio.trim() && selectedAreas.value.length && form.accepts_code_of_conduct && form.accepts_safety_rules))
const statusLabel = computed(() => ({ DRAFT: 'rascunho', PENDING: 'em revisão', APPROVED: 'aprovado', REJECTED: 'rejeitado', SUSPENDED: 'suspenso' }[currentStatus.value] || currentStatus.value))

watch(() => props.modelValue, async (open) => { if (open) await loadProfile() })

async function authFetch(path, options = {}) {
  await restoreSession()
  const token = getAccessToken()
  if (!token) throw { status: 401, data: { detail: 'Not authenticated' } }
  return await $fetch(path, { baseURL: props.apiBase, ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` } })
}

function selectPath(path) {
  selectedPath.value = path.key
  for (const area of path.areas) if (!selectedAreas.value.includes(area)) selectedAreas.value.push(area)
  if (!topicsInput.value.trim()) topicsInput.value = path.topics
  if (!form.headline.trim()) form.headline = `Quero guiar uma turma de ${path.title.toLowerCase()}`
}

async function loadProfile() {
  error.value = null
  editingApprovedProfile.value = false
  deleteConfirmOpen.value = false
  deleteConfirmText.value = ''
  try {
    const profile = await authFetch('/turmas/mentor/me')
    hydrateProfile(profile)
  } catch (err) {
    reset()
    const status = err?.response?.status || err?.status || err?.statusCode
    if (status === 401 || status === 403) error.value = 'Você precisa estar logado para criar um perfil de mentor.'
  }
}

function hydrateProfile(profile) {
  currentProfile.value = profile
  currentStatus.value = profile.status
  form.mentor_type = profile.mentor_type || 'PEER'
  form.mentor_level = profile.mentor_level || 'BEGINNER_GUIDE'
  form.headline = profile.headline || ''
  form.bio = profile.bio || ''
  form.max_active_turmas = profile.max_active_turmas || 2
  form.accepts_code_of_conduct = Boolean(profile.accepts_code_of_conduct)
  form.accepts_safety_rules = Boolean(profile.accepts_safety_rules)
  selectedAreas.value = Array.isArray(profile.areas) ? profile.areas : ['Olimpíadas']
  topicsInput.value = Array.isArray(profile.topics) ? profile.topics.join(', ') : ''
  proofLinksInput.value = Array.isArray(profile.proof_links) ? profile.proof_links.join('\n') : ''
  selectedDays.value = Array.isArray(profile.availability?.days) ? profile.availability.days : []
  selectedPeriods.value = Array.isArray(profile.availability?.periods) ? profile.availability.periods : []
}

function reset() {
  currentProfile.value = null
  currentStatus.value = null
  deleteConfirmOpen.value = false
  deleteConfirmText.value = ''
  selectedPath.value = 'OLYMPIAD'
  selectedAreas.value = ['Olimpíadas']
  selectedDays.value = []
  selectedPeriods.value = []
  topicsInput.value = ''
  proofLinksInput.value = ''
  form.mentor_type = 'PEER'; form.mentor_level = 'BEGINNER_GUIDE'; form.headline = ''; form.bio = ''; form.max_active_turmas = 2; form.accepts_code_of_conduct = false; form.accepts_safety_rules = false
}

function toggleFromList(listRef, value) { const index = listRef.indexOf(value); index >= 0 ? listRef.splice(index, 1) : listRef.push(value) }
function splitComma(value) { return String(value || '').split(',').map((item) => item.trim()).filter(Boolean) }
function splitLines(value) { return String(value || '').split('\n').map((item) => item.trim()).filter(Boolean) }

function buildPayload() {
  return {
    mentor_type: form.mentor_type,
    mentor_level: form.mentor_level,
    headline: form.headline.trim(),
    bio: form.bio.trim(),
    areas: selectedAreas.value,
    topics: splitComma(topicsInput.value),
    achievements: [],
    proof_links: splitLines(proofLinksInput.value),
    availability: { days: selectedDays.value, periods: selectedPeriods.value, timezone: 'America/Fortaleza' },
    max_active_turmas: Number(form.max_active_turmas || 2),
    accepts_code_of_conduct: Boolean(form.accepts_code_of_conduct),
    accepts_safety_rules: Boolean(form.accepts_safety_rules)
  }
}

async function saveProfile() {
  const payload = buildPayload()
  if (currentProfile.value?.id) return await authFetch('/turmas/mentor/me', { method: 'PATCH', body: payload })
  try { return await authFetch('/turmas/mentor/me', { method: 'POST', body: payload }) }
  catch (err) { if (err?.status === 409 || err?.statusCode === 409) return await authFetch('/turmas/mentor/me', { method: 'PATCH', body: payload }); throw err }
}

async function saveDraft() {
  error.value = null; submitting.value = true
  try { const saved = await saveProfile(); hydrateProfile(saved); editingApprovedProfile.value = false; emit('success', saved) }
  catch (err) { error.value = getErrorMessage(err, 'Não foi possível salvar o perfil agora.') }
  finally { submitting.value = false }
}

async function saveAndSubmit() {
  if (!canSubmit.value) { error.value = 'Preencha o título, a descrição, escolha ao menos uma área e aceite as regras.'; return }
  error.value = null; submitting.value = true
  try {
    const saved = await saveProfile(); hydrateProfile(saved)
    if (saved.status === 'APPROVED') { editingApprovedProfile.value = false; emit('success', saved); return }
    const submitted = await authFetch('/turmas/mentor/me/submit', { method: 'POST' })
    hydrateProfile(submitted); emit('success', submitted); close()
  } catch (err) { error.value = getErrorMessage(err, 'Não foi possível enviar o perfil para revisão.') }
  finally { submitting.value = false }
}

function cancelDelete() {
  deleteConfirmOpen.value = false
  deleteConfirmText.value = ''
}

async function deleteProfile() {
  if (deleteConfirmText.value.trim().toLowerCase() !== 'excluir') {
    error.value = 'Digite "excluir" para confirmar.'
    return
  }

  error.value = null
  deleting.value = true

  try {
    await authFetch('/turmas/mentor/me', { method: 'DELETE' })
    reset()
    emit('deleted')
    close()
  } catch (err) {
    error.value = getErrorMessage(err, 'Não foi possível excluir o perfil de mentor.')
  } finally {
    deleting.value = false
  }
}

function mentorTypeLabel(type) { return { PEER: 'Mentor estudante', AMBASSADOR: 'Embaixador seConecta', VERIFIED: 'Mentor verificado' }[type] || 'Mentor' }
function mentorLevelLabel(level) { return { BEGINNER_GUIDE: 'Guia de iniciantes', EXPERIENCED: 'Experiente', ADVANCED: 'Avançado', SPECIALIST: 'Especialista' }[level] || 'Não informado' }
function getErrorMessage(err, fallback) { const status = err?.response?.status || err?.status || err?.statusCode; const detail = err?.data?.detail || err?.response?._data?.detail; if (status === 401 || status === 403) return 'Você precisa estar logado para continuar.'; return typeof detail === 'string' ? detail : err?.message || fallback }
function goToDashboard() { close(); navigateTo('/turmas/mentor') }
function goToCreateTurma() { close(); navigateTo('/turmas/mentor/criar') }
function close() { emit('update:modelValue', false) }
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; z-index: 1200; display: grid; place-items: center; padding: 24px; background: rgba(17, 24, 39, 0.48); backdrop-filter: blur(4px); }
.modal-card { width: min(760px, 100%); max-height: min(88vh, 920px); overflow: hidden; border: 1px solid #e8e4dc; border-radius: 28px; background: #fbfaf7; box-shadow: 0 24px 80px rgba(15, 23, 42, 0.22); color: #111827; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.modal-header { display: flex; justify-content: space-between; gap: 18px; padding: 22px 24px 16px; border-bottom: 1px solid #e8e4dc; background: #fff; }
.eyebrow { margin: 0; color: #079272; font-size: 0.72rem; font-weight: 850; letter-spacing: 0.08em; text-transform: uppercase; }
.modal-header h2 { margin: 6px 0 6px; font-size: 1.55rem; line-height: 1.08; letter-spacing: -0.05em; }
.modal-header p { margin: 0; color: #66736d; font-size: 0.92rem; line-height: 1.5; }
.icon-button { display: grid; width: 36px; height: 36px; place-items: center; flex: 0 0 auto; border: 1px solid #d8d3ca; border-radius: 999px; background: #fff; cursor: pointer; }
.modal-body { display: grid; gap: 14px; max-height: calc(88vh - 116px); overflow-y: auto; padding: 16px; }
.approved-card, .step-card { border: 1px solid #e8e4dc; border-radius: 22px; padding: 16px; background: #fff; }
.approved-card { background: radial-gradient(circle at top right, rgba(7, 146, 114, 0.1), transparent 38%), #fff; }
.approved-top { display: flex; align-items: flex-start; gap: 14px; }
.approved-avatar { display: grid; width: 52px; height: 52px; place-items: center; border-radius: 18px; background: #079272; color: #fff; font-weight: 950; font-size: 1.1rem; }
.status-pill { display: inline-flex; border-radius: 999px; padding: 5px 10px; background: #e8f7f2; color: #079272; font-size: .72rem; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; }
.approved-card h3 { margin: 9px 0 5px; font-size: 1.25rem; letter-spacing: -.04em; }
.approved-card p { margin: 0; color: #66736d; line-height: 1.55; }
.profile-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 16px; }
.profile-grid div { border: 1px solid #eee8de; border-radius: 16px; padding: 11px; background: #fbfaf7; }
.profile-grid span, .field-title { display: block; color: #8a938f; font-size: .72rem; font-weight: 850; letter-spacing: .06em; text-transform: uppercase; }
.profile-grid strong { display: block; margin-top: 4px; font-size: .9rem; }
.chip-section { margin-top: 14px; }
.chips { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 8px; }
.chips span { border-radius: 999px; padding: 6px 10px; background: #e8f7f2; color: #064e3b; font-size: .78rem; font-weight: 800; }
.chips small { color: #8a938f; }
.approved-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; margin-top: 18px; }
.step-card--highlight { border-color: rgba(7, 146, 114, 0.24); background: radial-gradient(circle at top right, rgba(7, 146, 114, 0.08), transparent 34%), #fff; }
.step-card__head { display: flex; gap: 12px; margin-bottom: 14px; }
.step-number { display: grid; width: 30px; height: 30px; place-items: center; flex: 0 0 auto; border-radius: 10px; background: #079272; color: #fff; font-size: 0.85rem; font-weight: 900; }
.step-card h3 { margin: 0; font-size: 1rem; letter-spacing: -0.03em; }
.step-card p { margin: 4px 0 0; color: #66736d; font-size: 0.86rem; line-height: 1.45; }
.path-grid, .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.path-grid { margin-bottom: 14px; }
.path-card { border: 1px solid #e8e4dc; border-radius: 18px; padding: 13px; background: #fbfaf7; text-align: left; cursor: pointer; }
.path-card strong { display: block; margin-bottom: 4px; font-size: 0.94rem; }
.path-card span { display: block; color: #66736d; font-size: 0.83rem; line-height: 1.4; }
.path-card--active { border-color: #079272; background: #e8f7f2; }
label { display: grid; gap: 7px; margin-top: 12px; }
label > span { color: #374151; font-size: 0.78rem; font-weight: 850; }
input, textarea, select { width: 100%; border: 1px solid #d8d3ca; border-radius: 14px; padding: 11px 12px; background: #fff; color: #111827; font: inherit; outline: none; }
textarea { resize: vertical; }
input:focus, textarea:focus, select:focus { border-color: #079272; box-shadow: 0 0 0 3px rgba(7, 146, 114, 0.1); }
.chip-grid, .day-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 9px; }
.field-title--spaced { margin-top: 14px; }
.choice-chip, .day-chip { border: 1px solid #d8d3ca; border-radius: 999px; padding: 9px 12px; background: #fff; color: #111827; font-weight: 800; cursor: pointer; }
.choice-chip--active, .day-chip--active { border-color: #079272; background: #079272; color: #fff; }
.rules-box { display: grid; gap: 8px; margin-top: 12px; padding: 12px; border: 1px solid #e8e4dc; border-radius: 16px; background: #fbfaf7; }
.check-row { display: flex; align-items: flex-start; gap: 9px; margin: 0; }
.check-row input { width: auto; margin-top: 2px; accent-color: #079272; }
.check-row span { color: #374151; font-size: 0.86rem; line-height: 1.4; }
.status-box, .error-message { margin: 0; border-radius: 16px; padding: 12px 14px; font-size: 0.88rem; }
.status-box { display: grid; gap: 3px; background: #eef8f5; color: #065f46; }
.status-box--pending { background: #fff7ed; color: #9a3412; }
.status-box--rejected { background: #fff1f2; color: #be123c; }
.error-message { background: #fff1f2; color: #be123c; }
.modal-footer { position: sticky; bottom: -16px; display: flex; justify-content: flex-end; gap: 10px; margin: 0 -16px -16px; padding: 14px 16px; border-top: 1px solid #e8e4dc; background: rgba(255, 255, 255, 0.94); backdrop-filter: blur(8px); }
.primary-button, .secondary-button { border: 0; border-radius: 999px; padding: 12px 17px; font-weight: 900; cursor: pointer; }
.primary-button { background: #079272; color: #fff; }
.secondary-button { border: 1px solid #d8d3ca; background: #fff; color: #111827; }
.primary-button:disabled, .secondary-button:disabled { cursor: not-allowed; opacity: 0.6; }
.danger-button { border: 1px solid #fecdd3; border-radius: 999px; padding: 12px 17px; background: #fff1f2; color: #be123c; font-weight: 900; cursor: pointer; }
.danger-button:disabled { cursor: not-allowed; opacity: .55; }
.danger-button--filled { background: #e11d48; color: #fff; border-color: #e11d48; }
.delete-box { margin-top: 16px; border: 1px solid #fecdd3; border-radius: 18px; padding: 14px; background: #fff1f2; }
.delete-box--compact { background: #fff; }
.delete-box strong { display: block; color: #9f1239; font-size: .92rem; }
.delete-box p { margin: 5px 0 12px; color: #be123c; font-size: .84rem; line-height: 1.45; }
.delete-actions, .delete-confirm-inline { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
.delete-confirm-inline input { flex: 1; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: 0.18s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
@media (max-width: 720px) { .modal-backdrop { padding: 12px; } .modal-card { max-height: 94vh; border-radius: 22px; } .modal-header { padding: 18px; } .modal-body { max-height: calc(94vh - 110px); } .path-grid, .form-grid, .profile-grid { grid-template-columns: 1fr; } .modal-footer, .approved-actions { flex-direction: column; } .primary-button, .secondary-button { width: 100%; } }
</style>