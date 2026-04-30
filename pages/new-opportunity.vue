<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

useSeoMeta({ title: 'Nova oportunidade — seConecta' })

const { post } = useAxios()

const CATEGORIES = [
 // { value: 'COMPETITION', label: 'Competição' },
  { value: 'OLYMPIAD', label: 'Olimpíada' },
  { value: 'MUN', label: 'MUN' },
  { value: 'EXTRACURRICULAR', label: 'Extracurricular' },
  { value: 'INITIATIVE', label: 'Iniciativa' },
  { value: 'SCHOLARSHIP', label: 'Bolsa de estudos' },
  { value: 'VOLUNTEERING', label: 'Voluntariado' },
  { value: 'SUMMER_PROGRAM', label: 'Programa de verão' },
  { value: 'WORKSHOP', label: 'Workshop' },
  //{ value: 'POST', label: 'Post' },
]

const defaultCategoryData = {
  organizer: null,
  target_audience: null,
  requirements: [],
  benefits: [],
  application_process: [],
  cost_info: null,
  format: null,
  workload: null,
  source_notes: null,
  specifics: {
    type: null,
    prizes: [],
    stages: null,
    min_words: null,
    max_words: null,
    duration: null,
    deliverables: [],
    selection_criteria: [],
  },
  references: [],
}

const form = reactive({
  title: '',
  slug: '',
  category: 'OLYMPIAD',
  description: '',
  excerpt: '',
  cover_url: '',
  official_site_url: '',
  location: 'Online',
  is_free: false,
  keywords: '',
  tagsInput: '',
  timeline: [
    { label: 'Prazo final', date: '', details: '', show_on_calendar: true },
  ],
  categoryDataJson: JSON.stringify(defaultCategoryData, null, 2),
})

const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const parsedCategoryData = computed(() => {
  try {
    const parsed = JSON.parse(form.categoryDataJson || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return null
  }
})

const canSubmit = computed(() => {
  return Boolean(
    form.title.trim() &&
    form.category &&
    form.description.trim() &&
    parsedCategoryData.value !== null
  )
})

function parseTags(input: string) {
  return input
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
}

function cleanTimeline() {
  return form.timeline
    .filter(item => item.label?.trim() || item.date || item.details?.trim())
    .map(item => ({
      label: item.label?.trim() || item.details?.trim() || 'Evento',
      date: item.date || null,
      details: item.details?.trim() || null,
      show_on_calendar: item.show_on_calendar === true,
    }))
}

function addTimelineItem() {
  form.timeline.push({ label: '', date: '', details: '', show_on_calendar: false })
}

function removeTimelineItem(index: number) {
  form.timeline.splice(index, 1)
}

function prettifyCategoryData() {
  try {
    const parsed = JSON.parse(form.categoryDataJson || '{}')
    form.categoryDataJson = JSON.stringify(parsed, null, 2)
    error.value = null
  } catch {
    error.value = 'O JSON de informações extras está inválido.'
  }
}

async function submit() {
  error.value = null
  success.value = null

  if (!canSubmit.value) {
    error.value = 'Preencha título, categoria, descrição e corrija o JSON de informações extras.'
    return
  }

  loading.value = true

  try {
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || null,
      category: form.category,
      description: form.description.trim(),
      excerpt: form.excerpt.trim() || null,
      cover_url: form.cover_url.trim() || null,
      official_site_url: form.official_site_url.trim() || null,
      location: form.location.trim() || 'Online',
      is_free: form.is_free,
      timeline: cleanTimeline(),
      category_data: parsedCategoryData.value || {},
      keywords: form.keywords.trim() || null,
      tags: parseTags(form.tagsInput),
    }

    const res = await post('/opportunity/', payload)
    success.value = 'Oportunidade criada. Ela entra como não verificada até alguém da equipe revisar.'

    const slugOrId = res.data?.slug || res.data?.id
    if (slugOrId) {
      setTimeout(() => navigateTo('/oportunidades'), 600)
    }
  } catch (e: any) {
    error.value = e?.response?.data?.detail || e?.message || 'Erro ao criar oportunidade.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="new-opp-page">
    <main class="new-opp-shell">
      <button class="back-btn" @click="navigateTo('/oportunidades')">← Voltar</button>

      <header class="new-opp-header">
        <p class="eyebrow">seConecta</p>
        <h1>Nova oportunidade</h1>
        <p>Cadastre uma oportunidade com dados estruturados para o feed conseguir exibir cronograma, benefícios, requisitos e links de referência.</p>
      </header>

      <form class="form-card" @submit.prevent="submit">
        <section class="section-grid">
          <label class="field field--full">
            <span>Título *</span>
            <input v-model="form.title" placeholder="Ex: Olimpíada Brasileira de Informática 2026" />
          </label>

          <label class="field">
            <span>Slug opcional</span>
            <input v-model="form.slug" placeholder="obi-2026" />
          </label>

          <label class="field">
            <span>Categoria *</span>
            <select v-model="form.category">
              <option v-for="cat in CATEGORIES" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
            </select>
          </label>

          <label class="field field--full">
            <span>Resumo curto</span>
            <input v-model="form.excerpt" placeholder="Uma frase curta para aparecer no card" />
          </label>

          <label class="field field--full">
            <span>Descrição *</span>
            <textarea v-model="form.description" rows="7" placeholder="Explique a oportunidade de forma clara e útil para estudantes." />
          </label>

          <label class="field">
            <span>Imagem de capa</span>
            <input v-model="form.cover_url" placeholder="https://..." />
          </label>

          <label class="field">
            <span>Site oficial</span>
            <input v-model="form.official_site_url" placeholder="https://..." />
          </label>

          <label class="field">
            <span>Local</span>
            <input v-model="form.location" placeholder="Online, Brasil, Fortaleza..." />
          </label>

          <label class="field checkbox-field">
            <input v-model="form.is_free" type="checkbox" />
            <span>É gratuito?</span>
          </label>

          <label class="field field--full">
            <span>Keywords</span>
            <input v-model="form.keywords" placeholder="olimpíada informática programação ensino médio" />
          </label>

          <label class="field field--full">
            <span>Tags separadas por vírgula</span>
            <input v-model="form.tagsInput" placeholder="programação, lógica, ensino médio, gratuito" />
          </label>
        </section>

        <section class="form-section">
          <div class="section-title-row">
            <div>
              <h2>Cronograma</h2>
              <p>Marque no calendário apenas datas acionáveis: inscrições, prazos, provas ou resultados importantes.</p>
            </div>
            <button type="button" class="small-btn" @click="addTimelineItem">+ Data</button>
          </div>

          <div class="timeline-editor">
            <div v-for="(item, idx) in form.timeline" :key="idx" class="timeline-row">
              <input v-model="item.label" placeholder="Nome da etapa" />
              <input v-model="item.date" type="date" />
              <input v-model="item.details" placeholder="Detalhes" />

              <label class="calendar-check" title="Mostrar esta data no calendário e nos cards como prazo acionável">
                <input v-model="item.show_on_calendar" type="checkbox" />
                <span>Calendário</span>
              </label>

              <button type="button" @click="removeTimelineItem(idx)">×</button>
            </div>
          </div>
        </section>

        <section class="form-section">
          <div class="section-title-row">
            <div>
              <h2>Informações extras</h2>
              <p>Use JSON. O index renderiza organizer, benefits, requirements, specifics e references automaticamente.</p>
            </div>
            <button type="button" class="small-btn" @click="prettifyCategoryData">Formatar JSON</button>
          </div>

          <textarea v-model="form.categoryDataJson" class="json-area" rows="22" spellcheck="false" />
        </section>

        <p v-if="error" class="alert alert--error">{{ error }}</p>
        <p v-if="success" class="alert alert--success">{{ success }}</p>

        <div class="actions">
          <button type="button" class="ghost-btn" @click="navigateTo('/oportunidades')">Cancelar</button>
          <button type="submit" class="submit-btn" :disabled="loading || !canSubmit">
            {{ loading ? 'Criando…' : 'Criar oportunidade' }}
          </button>
        </div>
      </form>
    </main>
  </div>
</template>

<style scoped>
.new-opp-page { min-height: 100vh; background: #fafaf9; color: #1c1917; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 32px 18px 72px; }
.new-opp-shell { max-width: 980px; margin: 0 auto; }
.back-btn { border: none; background: transparent; color: #57534e; font-weight: 700; cursor: pointer; margin-bottom: 24px; }
.new-opp-header { margin-bottom: 24px; }
.eyebrow { color: #059669; font-size: 12px; text-transform: uppercase; letter-spacing: .12em; font-weight: 800; margin-bottom: 8px; }
.new-opp-header h1 { font-size: clamp(2rem, 4vw, 3rem); letter-spacing: -.04em; margin: 0 0 10px; }
.new-opp-header p { color: #78716c; line-height: 1.65; max-width: 680px; }
.form-card { background: white; border: 1px solid #e7e5e4; border-radius: 24px; padding: 24px; box-shadow: 0 16px 60px rgba(0,0,0,.06); }
.section-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.field { display: flex; flex-direction: column; gap: 7px; }
.field--full { grid-column: 1 / -1; }
.field span, .form-section h2 { font-weight: 800; color: #292524; font-size: 13px; }
input, select, textarea { width: 100%; border: 1px solid #d6d3d1; border-radius: 12px; padding: 11px 12px; font: inherit; background: #fff; color: #1c1917; outline: none; transition: border-color .15s, box-shadow .15s; }
textarea { resize: vertical; line-height: 1.55; }
input:focus, select:focus, textarea:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,.12); }
.checkbox-field { flex-direction: row; align-items: center; padding-top: 25px; }
.checkbox-field input { width: auto; }
.form-section { margin-top: 28px; padding-top: 24px; border-top: 1px solid #f0ece8; }
.section-title-row { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; margin-bottom: 14px; }
.section-title-row h2 { margin: 0 0 4px; font-size: 16px; }
.section-title-row p { margin: 0; color: #78716c; font-size: 13px; line-height: 1.45; }
.small-btn { border: 1px solid #d6d3d1; background: #fafaf9; border-radius: 10px; padding: 8px 11px; font-weight: 800; cursor: pointer; white-space: nowrap; }
.timeline-editor { display: flex; flex-direction: column; gap: 8px; }
.timeline-row { display: grid; grid-template-columns: 1fr 160px 1fr 125px 38px; gap: 8px; align-items: center; }
.timeline-row button { border: none; background: #fee2e2; color: #991b1b; height: 38px; border-radius: 10px; cursor: pointer; font-weight: 900; }
.calendar-check { height: 42px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; border: 1px solid #d6d3d1; background: #fafaf9; border-radius: 12px; padding: 0 10px; font-size: 12px; font-weight: 800; color: #57534e; cursor: pointer; user-select: none; }
.calendar-check input { width: auto; accent-color: #10b981; }
.calendar-check:has(input:checked) { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }

.json-area { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; background: #0f172a; color: #e2e8f0; border-color: #1e293b; }
.alert { padding: 12px 14px; border-radius: 12px; font-weight: 700; font-size: 13px; margin-top: 18px; }
.alert--error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
.alert--success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
.actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
.ghost-btn, .submit-btn { border: none; border-radius: 12px; padding: 12px 18px; font-weight: 900; cursor: pointer; }
.ghost-btn { background: #f5f5f4; color: #44403c; }
.submit-btn { background: #059669; color: white; }
.submit-btn:disabled { opacity: .55; cursor: not-allowed; }
@media (max-width: 720px) { .section-grid, .timeline-row { grid-template-columns: 1fr; } .field--full { grid-column: auto; } .checkbox-field { padding-top: 0; } .section-title-row, .actions { flex-direction: column; } }
</style>