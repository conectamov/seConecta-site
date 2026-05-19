<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Editar oportunidade — seConecta' })

const route = useRoute()
const router = useRouter()
const { get, patch, post, del } = useAxios()
const { uploadImage, validateImageFile } = useImageUpload()
const { currentUser } = useAuth()

const CATEGORIES = [
  { value: 'COMPETITION', label: 'Competição' },
  { value: 'OLYMPIAD', label: 'Olimpíada' },
  { value: 'MUN', label: 'MUN' },
  { value: 'EXTRACURRICULAR', label: 'Extracurricular' },
  { value: 'INITIATIVE', label: 'Iniciativa' },
  { value: 'SCHOLARSHIP', label: 'Bolsa de estudos' },
  { value: 'VOLUNTEERING', label: 'Voluntariado' },
  { value: 'SUMMER_PROGRAM', label: 'Programa de verão' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'POST', label: 'Post' },
]

const TIMELINE_KIND_OPTIONS = [
  { value: '', label: 'Tipo não definido' },
  { value: 'registration_start', label: 'Início das inscrições' },
  { value: 'registration_deadline', label: 'Prazo de inscrição' },
  { value: 'exam', label: 'Prova' },
  { value: 'phase', label: 'Fase' },
  { value: 'result', label: 'Resultado' },
  { value: 'submission_deadline', label: 'Prazo de envio' },
  { value: 'other', label: 'Outro evento' },
]

const STATUS_OPTIONS = ['OPEN', 'SOON', 'ONGOING', 'CLOSED']

const PRIORITY_OPTIONS = [
  { value: 0, label: '0 — Normal' },
  { value: 1, label: '1 — Relevante' },
  { value: 2, label: '2 — Recomendado' },
  { value: 3, label: '3 — Destaque' },
  { value: 4, label: '4 — Alta prioridade' },
  { value: 5, label: '5 — Editorial Pick' },
]

const TARGET_SUBJECT_OPTIONS = [
  { value: 'MATHEMATICS', label: 'Matemática' },
  { value: 'PROGRAMMING', label: 'Programação' },
  { value: 'AI_DATA', label: 'IA e Dados' },
  { value: 'PHYSICS', label: 'Física' },
  { value: 'CHEMISTRY', label: 'Química' },
  { value: 'BIOLOGY', label: 'Biologia' },
  { value: 'RESEARCH', label: 'Pesquisa' },
  { value: 'HUMANITIES', label: 'Humanidades' },
  { value: 'LEADERSHIP_IMPACT', label: 'Liderança e impacto' },
  { value: 'LANGUAGES_WRITING', label: 'Línguas e escrita' },
  { value: 'ENTREPRENEURSHIP', label: 'Empreendedorismo' },
]

const TARGET_GOAL_OPTIONS = [
  { value: 'DISCOVER_OPPORTUNITIES', label: 'Descobrir oportunidades' },
  { value: 'OLYMPIAD_TRAINING', label: 'Treinar olimpíadas' },
  { value: 'SKILL_BUILDING', label: 'Desenvolver habilidades' },
  { value: 'COLLEGE_PREP', label: 'Preparação universitária' },
  { value: 'RESEARCH', label: 'Pesquisa' },
  { value: 'SOCIAL_IMPACT', label: 'Impacto social' },
  { value: 'CAREER_EXPLORATION', label: 'Explorar carreira' },
  { value: 'MENTORSHIP', label: 'Mentoria/networking' },
]

const TARGET_EDUCATION_LEVEL_OPTIONS = [
  { value: 'FUNDAMENTAL_2', label: 'Fundamental II' },
  { value: 'ENSINO_MEDIO_1', label: '1º ano EM' },
  { value: 'ENSINO_MEDIO_2', label: '2º ano EM' },
  { value: 'ENSINO_MEDIO_3', label: '3º ano EM' },
  { value: 'GAP_YEAR', label: 'Gap year' },
  { value: 'UNDERGRAD', label: 'Graduação' },
]

const EXPERIENCE_LEVEL_OPTIONS = [
  { value: 'EXPLORING', label: 'Explorando' },
  { value: 'BEGINNER', label: 'Iniciante' },
  { value: 'INTERMEDIATE', label: 'Intermediário' },
  { value: 'ADVANCED', label: 'Avançado' },
  { value: 'COMPETITIVE', label: 'Competitivo' },
]

const COMPETITIVENESS_OPTIONS = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'ELITE', label: 'Elite' },
]

const PREPARATION_HORIZON_OPTIONS = [
  { value: 'NONE', label: 'Sem preparo prévio' },
  { value: 'DAYS', label: 'Dias' },
  { value: 'WEEKS', label: 'Semanas' },
  { value: 'MONTHS', label: 'Meses' },
  { value: 'YEAR_PLUS', label: '1 ano ou mais' },
]

const RECURRENCE_TYPE_OPTIONS = [
  { value: 'ONE_TIME', label: 'Evento único' },
  { value: 'ANNUAL', label: 'Anual' },
  { value: 'SEMESTER', label: 'Semestral' },
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'ROLLING', label: 'Contínua/rolling' },
  { value: 'UNKNOWN', label: 'Não sei' },
]

const categoryDataTemplate = {
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

const fullJsonSchemaTemplate = {
  title: '',
  slug: null,
  category: 'INITIATIVE',
  status: null,
  description: '',
  excerpt: null,
  cover_url: null,
  official_site_url: null,
  location: 'Online',
  is_free: false,
  human_verified: false,
  approved: null,
  priority: 0,
  next_deadline: null,
  target_subjects: [],
  target_goals: [],
  target_education_levels: [],
  recommended_experience_levels: [],
  competitiveness_level: [],
  preparation_horizon: [],
  recurrence_type: [],
  recommendation_notes: null,
  timeline: [
    {
      kind: null,
      label: '',
      date: null,
      details: null,
      show_on_calendar: false,
    },
  ],
  category_data: categoryDataTemplate,
  keywords: null,
  tags: [],
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function getRouteIdValue() {
  const param = route.params.id
  const raw = Array.isArray(param) ? param[0] : param

  if (raw && raw !== 'undefined' && raw !== 'null') return raw

  const queryId = route.query.id
  if (typeof queryId === 'string' && queryId !== 'undefined' && queryId !== 'null') {
    return queryId
  }

  const match = route.fullPath.match(/\/oportunidades\/edit\/(\d+)/)
  return match?.[1] ?? null
}

const opportunityId = computed<number | null>(() => {
  const raw = getRouteIdValue()
  const parsed = Number(raw)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
})

const isSuperuser = computed(() => !!currentUser.value?.is_superuser)
const isManager = computed(() => !!currentUser.value?.is_manager)
const canUseAdminActions = computed(() => isSuperuser.value || isManager.value)

const loading = ref(true)
const saving = ref(false)
const uploadingCover = ref(false)
const enhancing = ref(false)
const deleting = ref(false)
const showDeleteModal = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const activeTab = ref<'write' | 'json' | 'preview'>('write')
const activeGuide = ref<number | null>(0)
const loadedOpportunity = ref<any | null>(null)
const tagInput = ref('')
const coverUploadStatus = ref<string | null>(null)
const localCoverPreviewUrl = ref<string | null>(null)
const coverFileInput = ref<HTMLInputElement | null>(null)

const fullJsonMode = ref(false)
const fullJsonText = ref('')

const errors = ref<Record<string, string>>({})

const form = reactive({
  title: '',
  slug: '',
  category: 'INITIATIVE',
  description: '',
  excerpt: '',
  cover_url: '',
  official_site_url: '',
  location: 'Online',
  is_free: false,
  human_verified: false,
  priority: 0,
  keywords: '',
  tags: [] as string[],
  target_subjects: [] as string[],
  target_goals: [] as string[],
  target_education_levels: [] as string[],
  recommended_experience_levels: [] as string[],
  competitiveness_level: [] as string[],
  preparation_horizon: [] as string[],
  recurrence_type: [] as string[],
  recommendation_notes: '',
  timeline: [] as Array<{ kind: string; label: string; date: string; details: string; show_on_calendar: boolean }>,
  categoryDataJson: JSON.stringify(categoryDataTemplate, null, 2),
})

const coverPreviewUrl = computed(() => {
  return localCoverPreviewUrl.value || form.cover_url || ''
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

const parsedCategoryData = computed(() => {
  try {
    const parsed = JSON.parse(form.categoryDataJson || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
})

const parsedFullJson = computed<Record<string, any> | null>(() => {
  try {
    const parsed = JSON.parse(fullJsonText.value || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
})

const fullJsonRequiredOk = computed(() => {
  const parsed = parsedFullJson.value
  if (!parsed) return false

  const categoryIsValid = CATEGORIES.some(cat => cat.value === parsed.category)
  const categoryDataIsValid =
    parsed.category_data &&
    typeof parsed.category_data === 'object' &&
    !Array.isArray(parsed.category_data)

  return Boolean(
    String(parsed.title || '').trim() &&
    String(parsed.description || '').trim() &&
    categoryIsValid &&
    categoryDataIsValid,
  )
})

const wordCount = computed(() => form.description.trim().split(/\s+/).filter(Boolean).length)
const hasValidId = computed(() => opportunityId.value !== null)

const canSave = computed(() => {
  if (saving.value || uploadingCover.value) return false

  if (fullJsonMode.value) {
    return Boolean(
      hasValidId.value &&
      parsedFullJson.value !== null &&
      fullJsonRequiredOk.value,
    )
  }

  return Boolean(
    hasValidId.value &&
    form.title.trim() &&
    form.description.trim() &&
    parsedCategoryData.value !== null,
  )
})

const previewFacts = computed(() => {
  const data = parsedCategoryData.value || {}
  const specifics = data.specifics || {}

  const facts = [
    { label: 'Organizador', value: data.organizer },
    { label: 'Público-alvo', value: data.target_audience },
    { label: 'Custo', value: data.cost_info },
    { label: 'Formato', value: data.format },
    { label: 'Prêmios', value: Array.isArray(specifics.prizes) ? specifics.prizes.join(' · ') : null },
    { label: 'Etapas', value: specifics.stages },
  ]

  return facts.filter(f => f.value !== null && f.value !== undefined && String(f.value).trim())
})

const recommendationPreviewFacts = computed(() => {
  const facts = [
    { label: 'Áreas', value: getRecommendationListLabels(TARGET_SUBJECT_OPTIONS, form.target_subjects).join(' · ') },
    { label: 'Objetivos', value: getRecommendationListLabels(TARGET_GOAL_OPTIONS, form.target_goals).join(' · ') },
    { label: 'Nível escolar', value: getRecommendationListLabels(TARGET_EDUCATION_LEVEL_OPTIONS, form.target_education_levels).join(' · ') },
    { label: 'Experiência', value: getRecommendationListLabels(EXPERIENCE_LEVEL_OPTIONS, form.recommended_experience_levels).join(' · ') },
    { label: 'Competitividade', value: getRecommendationListLabels(COMPETITIVENESS_OPTIONS, form.competitiveness_level).join(' · ') },
    { label: 'Preparo', value: getRecommendationListLabels(PREPARATION_HORIZON_OPTIONS, form.preparation_horizon).join(' · ') },
    { label: 'Recorrência', value: getRecommendationListLabels(RECURRENCE_TYPE_OPTIONS, form.recurrence_type).join(' · ') },
    { label: 'Nota', value: form.recommendation_notes },
  ]

  return facts.filter(f => f.value !== null && f.value !== undefined && String(f.value).trim())
})

function normalizeDate(raw: any) {
  if (!raw) return ''
  return String(raw).slice(0, 10)
}

function normalizeTimeline(value: any) {
  if (!Array.isArray(value)) return []

  return value.map(item => ({
    kind: typeof item?.kind === 'string' ? item.kind : '',
    label: item?.label || item?.details || item?.title || item?.name || 'Evento',
    date: normalizeDate(item?.date),
    details: item?.details || item?.description || '',
    show_on_calendar: item?.show_on_calendar === true || item?.show_on_calendar === 'true',
  }))
}

function normalizeTags(value: any) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String)
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String)
    } catch {}

    return value.split(',').map(tag => tag.trim()).filter(Boolean)
  }

  return []
}

function normalizeStringList(value: any): string[] {
  if (Array.isArray(value)) {
    return value
      .map(item => String(item).trim())
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return normalizeStringList(parsed)
    } catch {}

    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  }

  return []
}

function toggleListValue(list: string[], value: string) {
  const idx = list.indexOf(value)

  if (idx >= 0) {
    list.splice(idx, 1)
    return
  }

  list.push(value)
}

function getOptionLabel(options: Array<{ value: string; label: string }>, value: string) {
  return options.find(option => option.value === value)?.label || value
}

function getRecommendationListLabels(options: Array<{ value: string; label: string }>, values: string[]) {
  return normalizeStringList(values).map(value => getOptionLabel(options, value))
}

function addTag() {
  const tag = tagInput.value.trim().replace(/^#/, '')
  if (tag && !form.tags.includes(tag)) form.tags.push(tag)
  tagInput.value = ''
}

function removeTag(tag: string) {
  form.tags = form.tags.filter(t => t !== tag)
}

function syncCoverUrlToFullJson(url: string | null) {
  try {
    const parsed = JSON.parse(fullJsonText.value || '{}')

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return

    parsed.cover_url = url || null
    fullJsonText.value = JSON.stringify(parsed, null, 2)
  } catch {
    // Se o JSON completo estiver inválido, não sincroniza para não apagar o trabalho manual.
  }
}

async function handleCoverFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  error.value = null
  success.value = null
  coverUploadStatus.value = null
  delete errors.value.cover_url
  delete errors.value.full_json

  try {
    validateImageFile(file)

    revokeLocalCoverPreview()
    localCoverPreviewUrl.value = URL.createObjectURL(file)

    uploadingCover.value = true
    coverUploadStatus.value = 'Enviando imagem para o Cloudinary…'

    const uploadedUrl = await uploadImage(file)

    form.cover_url = uploadedUrl
    syncCoverUrlToFullJson(uploadedUrl)

    revokeLocalCoverPreview()
    coverUploadStatus.value = 'Imagem enviada. A capa foi atualizada com uma URL do Cloudinary.'
  } catch (e: any) {
    revokeLocalCoverPreview()
    errors.value.cover_url = e?.message || 'Erro ao enviar imagem.'
    error.value = errors.value.cover_url
    coverUploadStatus.value = null
  } finally {
    uploadingCover.value = false

    if (input) input.value = ''
  }
}

function clearCoverImage() {
  revokeLocalCoverPreview()
  form.cover_url = ''
  coverUploadStatus.value = null
  delete errors.value.cover_url
  syncCoverUrlToFullJson(null)

  if (coverFileInput.value) {
    coverFileInput.value.value = ''
  }
}

function onTagKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addTag()
  }

  if (e.key === 'Backspace' && !tagInput.value && form.tags.length) {
    form.tags.pop()
  }
}

function cleanTimeline() {
  return form.timeline
    .filter(item => item.label?.trim() || item.date || item.details?.trim())
    .map(item => ({
      kind: item.kind?.trim() || null,
      label: item.label?.trim() || item.details?.trim() || 'Evento',
      date: item.date || null,
      details: item.details?.trim() || null,
      show_on_calendar: item.show_on_calendar === true,
    }))
}

function cleanFullTimeline(value: any) {
  if (!Array.isArray(value)) return []

  return value
    .filter(item => item && typeof item === 'object')
    .filter(item => item.label || item.date || item.details)
    .map(item => ({
      kind: typeof item.kind === 'string' && item.kind.trim() ? item.kind.trim() : null,
      label: String(item.label || item.details || 'Evento').trim(),
      date: item.date || null,
      details: item.details ? String(item.details).trim() : null,
      show_on_calendar: item.show_on_calendar === true,
    }))
}

function addTimelineItem() {
  form.timeline.push({ kind: '', label: '', date: '', details: '', show_on_calendar: false })
}

function removeTimelineItem(index: number) {
  form.timeline.splice(index, 1)
}

function formatJson() {
  if (!parsedCategoryData.value) {
    error.value = 'O JSON de informações extras está inválido.'
    return
  }

  form.categoryDataJson = JSON.stringify(parsedCategoryData.value, null, 2)
  error.value = null
}

function formatFullJson() {
  if (!parsedFullJson.value) {
    error.value = 'O JSON completo está inválido.'
    errors.value.full_json = 'O JSON completo está inválido.'
    return
  }

  fullJsonText.value = JSON.stringify(parsedFullJson.value, null, 2)
  error.value = null
  delete errors.value.full_json
}

function resetJsonTemplate() {
  form.categoryDataJson = JSON.stringify(categoryDataTemplate, null, 2)
}

function resetFullJsonFromLoaded() {
  if (loadedOpportunity.value) {
    fullJsonText.value = JSON.stringify(buildFullJsonFromOpportunity(loadedOpportunity.value), null, 2)
    return
  }

  fullJsonText.value = JSON.stringify(cloneJson(fullJsonSchemaTemplate), null, 2)
}

function mergeJsonTemplate() {
  const current = parsedCategoryData.value || {}
  form.categoryDataJson = JSON.stringify({
    ...categoryDataTemplate,
    ...current,
    specifics: {
      ...categoryDataTemplate.specifics,
      ...(current.specifics || {}),
    },
    references: Array.isArray(current.references) ? current.references : [],
  }, null, 2)
}

function mergeFullJsonSchema() {
  const current = parsedFullJson.value || {}

  fullJsonText.value = JSON.stringify({
    ...cloneJson(fullJsonSchemaTemplate),
    ...current,
    category_data: {
      ...cloneJson(categoryDataTemplate),
      ...(current.category_data || {}),
      specifics: {
        ...cloneJson(categoryDataTemplate.specifics),
        ...(current.category_data?.specifics || {}),
      },
      references: Array.isArray(current.category_data?.references)
        ? current.category_data.references
        : [],
    },
    timeline: Array.isArray(current.timeline)
      ? current.timeline
      : cloneJson(fullJsonSchemaTemplate.timeline),
    tags: normalizeTags(current.tags),
    target_subjects: normalizeStringList(current.target_subjects),
    target_goals: normalizeStringList(current.target_goals),
    target_education_levels: normalizeStringList(current.target_education_levels),
    recommended_experience_levels: normalizeStringList(current.recommended_experience_levels),
    competitiveness_level: normalizeStringList(current.competitiveness_level),
    preparation_horizon: normalizeStringList(current.preparation_horizon),
    recurrence_type: normalizeStringList(current.recurrence_type),
    recommendation_notes: current.recommendation_notes || null,
  }, null, 2)
}

function buildVisualPayload() {
  const payload: Record<string, any> = {
    title: form.title.trim(),
    category: form.category,
    description: form.description.trim(),
    excerpt: form.excerpt.trim() || null,
    cover_url: form.cover_url.trim() || null,
    official_site_url: form.official_site_url.trim() || null,
    location: form.location.trim() || 'Online',
    is_free: !!form.is_free,
    human_verified: !!form.human_verified,
    priority: Math.min(5, Math.max(0, Number(form.priority || 0))),
    timeline: cleanTimeline(),
    category_data: parsedCategoryData.value || {},
    keywords: form.keywords.trim() || null,
    tags: form.tags,
    target_subjects: form.target_subjects,
    target_goals: form.target_goals,
    target_education_levels: form.target_education_levels,
    recommended_experience_levels: form.recommended_experience_levels,
    competitiveness_level: form.competitiveness_level,
    preparation_horizon: form.preparation_horizon,
    recurrence_type: form.recurrence_type,
    recommendation_notes: form.recommendation_notes.trim() || null,
  }

  if (form.slug.trim()) payload.slug = form.slug.trim()

  return payload
}

function buildFullJsonFromOpportunity(data: any) {
  const payload: Record<string, any> = {
    title: data.title || '',
    slug: data.slug || null,
    category: data.category || 'INITIATIVE',
    status: data.status || null,
    description: data.description || '',
    excerpt: data.excerpt || null,
    cover_url: data.cover_url || null,
    official_site_url: data.official_site_url || null,
    location: data.location || 'Online',
    is_free: !!data.is_free,
    human_verified: !!data.human_verified,
    approved: typeof data.approved === 'boolean' ? data.approved : null,
    priority: typeof data.priority === 'number' ? data.priority : 0,
    next_deadline: data.next_deadline || null,
    timeline: normalizeTimeline(data.timeline).map(item => ({
      kind: item.kind || null,
      label: item.label || 'Evento',
      date: item.date || null,
      details: item.details || null,
      show_on_calendar: item.show_on_calendar === true,
    })),
    category_data:
      data.category_data && typeof data.category_data === 'object'
        ? data.category_data
        : cloneJson(categoryDataTemplate),
    keywords: data.keywords || null,
    tags: normalizeTags(data.tags),
    target_subjects: normalizeStringList(data.target_subjects),
    target_goals: normalizeStringList(data.target_goals),
    target_education_levels: normalizeStringList(data.target_education_levels),
    recommended_experience_levels: normalizeStringList(data.recommended_experience_levels),
    competitiveness_level: normalizeStringList(data.competitiveness_level),
    preparation_horizon: normalizeStringList(data.preparation_horizon),
    recurrence_type: normalizeStringList(data.recurrence_type),
    recommendation_notes: data.recommendation_notes || null,
  }

  return payload
}

function buildFullJsonFromForm() {
  return {
    ...cloneJson(fullJsonSchemaTemplate),
    ...buildVisualPayload(),
    slug: form.slug.trim() || null,
    status: loadedOpportunity.value?.status || null,
    approved: typeof loadedOpportunity.value?.approved === 'boolean'
      ? loadedOpportunity.value.approved
      : null,
    next_deadline: loadedOpportunity.value?.next_deadline || null,
  }
}

function syncFullJsonFromForm() {
  fullJsonText.value = JSON.stringify(buildFullJsonFromForm(), null, 2)
}

function applyFullJsonToForm() {
  const data = parsedFullJson.value
  if (!data) return false

  form.title = data.title || ''
  form.slug = data.slug || ''
  form.category = data.category || 'INITIATIVE'
  form.description = data.description || ''
  form.excerpt = data.excerpt || ''
  form.cover_url = data.cover_url || ''
  form.official_site_url = data.official_site_url || ''
  form.location = data.location || 'Online'
  form.is_free = !!data.is_free
  form.human_verified = !!data.human_verified
  form.priority = typeof data.priority === 'number' ? data.priority : 0
  form.keywords = data.keywords || ''
  form.tags = normalizeTags(data.tags)
  form.target_subjects = normalizeStringList(data.target_subjects)
  form.target_goals = normalizeStringList(data.target_goals)
  form.target_education_levels = normalizeStringList(data.target_education_levels)
  form.recommended_experience_levels = normalizeStringList(data.recommended_experience_levels)
  form.competitiveness_level = normalizeStringList(data.competitiveness_level)
  form.preparation_horizon = normalizeStringList(data.preparation_horizon)
  form.recurrence_type = normalizeStringList(data.recurrence_type)
  form.recommendation_notes = data.recommendation_notes || ''
  form.timeline = normalizeTimeline(data.timeline)

  const categoryData = data.category_data && typeof data.category_data === 'object'
    ? data.category_data
    : {}

  form.categoryDataJson = JSON.stringify(categoryData, null, 2)

  if (!form.timeline.length) addTimelineItem()

  return true
}

function toggleFullJsonMode() {
  error.value = null
  success.value = null
  errors.value = {}

  if (fullJsonMode.value) {
    if (!parsedFullJson.value) {
      error.value = 'O JSON completo está inválido. Corrija antes de voltar para os campos.'
      errors.value.full_json = 'O JSON completo está inválido.'
      return
    }

    applyFullJsonToForm()
    fullJsonMode.value = false
    return
  }

  syncFullJsonFromForm()
  fullJsonMode.value = true
}

function validateFullJson() {
  if (!opportunityId.value) {
    errors.value.id = 'ID da oportunidade inválido. Abra a edição a partir do botão Editar do card.'
  }

  const payload = parsedFullJson.value

  if (!payload) {
    errors.value.full_json = 'O JSON completo está inválido.'
    return false
  }

  if (!String(payload.title || '').trim()) {
    errors.value.full_json = 'O campo title é obrigatório.'
  }

  if (!String(payload.description || '').trim()) {
    errors.value.full_json = 'O campo description é obrigatório.'
  }

  if (!CATEGORIES.some(cat => cat.value === payload.category)) {
    errors.value.full_json = 'Categoria inválida.'
  }

  if (
    payload.status !== null &&
    payload.status !== undefined &&
    payload.status !== '' &&
    !STATUS_OPTIONS.includes(String(payload.status))
  ) {
    errors.value.full_json = 'Status inválido. Use OPEN, SOON, ONGOING ou CLOSED.'
  }

  if (
    !payload.category_data ||
    typeof payload.category_data !== 'object' ||
    Array.isArray(payload.category_data)
  ) {
    errors.value.full_json = 'category_data precisa ser um objeto JSON.'
  }

  if (payload.official_site_url && !/^https?:\/\/.+/.test(String(payload.official_site_url))) {
    errors.value.full_json = 'official_site_url precisa começar com http:// ou https://.'
  }

  if (payload.next_deadline && Number.isNaN(new Date(payload.next_deadline).getTime())) {
    errors.value.full_json = 'next_deadline está inválido.'
  }

  if (payload.timeline && !Array.isArray(payload.timeline)) {
    errors.value.full_json = 'timeline precisa ser uma lista.'
  }

  if (Array.isArray(payload.timeline)) {
    payload.timeline.forEach((item: any, idx: number) => {
      if (item?.date && Number.isNaN(new Date(`${String(item.date).slice(0, 10)}T12:00:00`).getTime())) {
        errors.value.full_json = `A data ${idx + 1} do cronograma está inválida.`
      }
    })
  }

  return !Object.keys(errors.value).length
}

function validate() {
  errors.value = {}

  if (fullJsonMode.value) {
    return validateFullJson()
  }

  if (!opportunityId.value) {
    errors.value.id = 'ID da oportunidade inválido. Abra a edição a partir do botão Editar do card.'
  }

  if (!form.title.trim()) {
    errors.value.title = 'O título é obrigatório.'
  } else if (form.title.length > 256) {
    errors.value.title = 'Máximo de 256 caracteres.'
  }

  if (!form.description.trim()) {
    errors.value.description = 'A descrição é obrigatória.'
  }


  if (form.official_site_url.trim() && !/^https?:\/\/.+/.test(form.official_site_url.trim())) {
    errors.value.official_site_url = 'URL do site oficial inválida.'
  }

  if (parsedCategoryData.value === null) {
    errors.value.category_data = 'O JSON de informações extras está inválido.'
  }

  form.timeline.forEach((item, idx) => {
    if (item.date && Number.isNaN(new Date(`${item.date}T12:00:00`).getTime())) {
      errors.value[`timeline_${idx}`] = `A data ${idx + 1} do cronograma está inválida.`
    }
  })

  return !Object.keys(errors.value).length
}

watch(() => form.title, () => delete errors.value.title)
watch(() => form.description, () => delete errors.value.description)
watch(() => form.cover_url, () => delete errors.value.cover_url)
watch(() => form.official_site_url, () => delete errors.value.official_site_url)
watch(() => form.categoryDataJson, () => delete errors.value.category_data)
watch(fullJsonText, () => delete errors.value.full_json)
watch(() => form.timeline, () => {
  Object.keys(errors.value)
    .filter(key => key.startsWith('timeline_'))
    .forEach(key => delete errors.value[key])
}, { deep: true })

function hydrateForm(data: any) {
  loadedOpportunity.value = data

  form.title = data.title || ''
  form.slug = data.slug || ''
  form.category = data.category || 'INITIATIVE'
  form.description = data.description || ''
  form.excerpt = data.excerpt || ''
  form.cover_url = data.cover_url || ''
  form.official_site_url = data.official_site_url || ''
  form.location = data.location || 'Online'
  form.is_free = !!data.is_free
  form.human_verified = !!data.human_verified
  form.priority = typeof data.priority === 'number' ? data.priority : 0
  form.keywords = data.keywords || ''
  form.tags = normalizeTags(data.tags)
  form.target_subjects = normalizeStringList(data.target_subjects)
  form.target_goals = normalizeStringList(data.target_goals)
  form.target_education_levels = normalizeStringList(data.target_education_levels)
  form.recommended_experience_levels = normalizeStringList(data.recommended_experience_levels)
  form.competitiveness_level = normalizeStringList(data.competitiveness_level)
  form.preparation_horizon = normalizeStringList(data.preparation_horizon)
  form.recurrence_type = normalizeStringList(data.recurrence_type)
  form.recommendation_notes = data.recommendation_notes || ''
  form.timeline = normalizeTimeline(data.timeline)

  const categoryData = data.category_data && typeof data.category_data === 'object'
    ? data.category_data
    : {}

  form.categoryDataJson = JSON.stringify(categoryData, null, 2)
  fullJsonText.value = JSON.stringify(buildFullJsonFromOpportunity(data), null, 2)

  if (!form.timeline.length) addTimelineItem()
}

async function fetchOpportunity() {
  loading.value = true
  error.value = null
  success.value = null

  if (!opportunityId.value) {
    loading.value = false
    error.value = 'ID da oportunidade inválido. O caminho precisa ser /oportunidades/edit/123.'
    return
  }

  try {
    const res = await get(`/opportunity/${opportunityId.value}`)
    hydrateForm(res.data)
  } catch (e: any) {
    error.value = e?.response?.data?.detail || e?.message || 'Erro ao carregar oportunidade.'
  } finally {
    loading.value = false
  }
}

function cleanFullJsonPayload(raw: Record<string, any>) {
  const payload: Record<string, any> = {
    title: String(raw.title || '').trim(),
    category: raw.category || 'INITIATIVE',
    description: String(raw.description || '').trim(),
    excerpt: raw.excerpt ? String(raw.excerpt).trim() : null,
    cover_url: raw.cover_url ? String(raw.cover_url).trim() : null,
    official_site_url: raw.official_site_url ? String(raw.official_site_url).trim() : null,
    location: raw.location ? String(raw.location).trim() : 'Online',
    is_free: raw.is_free === true,
    human_verified: raw.human_verified === true,
    priority: Math.min(5, Math.max(0, Number(raw.priority || 0))),
    timeline: cleanFullTimeline(raw.timeline),
    category_data:
      raw.category_data && typeof raw.category_data === 'object' && !Array.isArray(raw.category_data)
        ? raw.category_data
        : {},
    keywords: raw.keywords ? String(raw.keywords).trim() : null,
    tags: normalizeTags(raw.tags),
    target_subjects: normalizeStringList(raw.target_subjects),
    target_goals: normalizeStringList(raw.target_goals),
    target_education_levels: normalizeStringList(raw.target_education_levels),
    recommended_experience_levels: normalizeStringList(raw.recommended_experience_levels),
    competitiveness_level: normalizeStringList(raw.competitiveness_level),
    preparation_horizon: normalizeStringList(raw.preparation_horizon),
    recurrence_type: normalizeStringList(raw.recurrence_type),
    recommendation_notes: raw.recommendation_notes ? String(raw.recommendation_notes).trim() : null,
  }

  if (Object.prototype.hasOwnProperty.call(raw, 'slug')) {
    payload.slug = raw.slug ? String(raw.slug).trim() : null
  }

  if (raw.status) {
    payload.status = String(raw.status).trim()
  }

  if (Object.prototype.hasOwnProperty.call(raw, 'next_deadline')) {
    payload.next_deadline = raw.next_deadline || null
  }

  if (typeof raw.approved === 'boolean') {
    payload.approved = raw.approved
  }

  return payload
}

function buildPayload() {
  if (fullJsonMode.value && parsedFullJson.value) {
    return cleanFullJsonPayload(parsedFullJson.value)
  }

  return buildVisualPayload()
}

async function save() {
  error.value = null
  success.value = null

  if (uploadingCover.value) {
    error.value = 'Aguarde o envio da imagem terminar.'
    return
  }

  if (!validate()) {
    error.value = Object.values(errors.value)[0] || 'Revise os campos antes de salvar.'
    return
  }

  saving.value = true

  try {
    await patch(`/opportunity/${opportunityId.value}`, buildPayload())
    success.value = 'Oportunidade atualizada com sucesso.'
    await fetchOpportunity()
  } catch (e: any) {
    const detail = e?.response?.data?.detail
    if (Array.isArray(detail)) {
      error.value = detail.map((d: any) => d?.msg || JSON.stringify(d)).join(' · ')
    } else {
      error.value = detail || e?.message || 'Erro ao salvar oportunidade.'
    }
  } finally {
    saving.value = false
  }
}

async function enhanceWithAI() {
  error.value = null
  success.value = null

  if (!opportunityId.value) {
    error.value = 'ID inválido. Não dá para enriquecer esta oportunidade.'
    return
  }

  enhancing.value = true

  try {
    await post(`/opportunity/${opportunityId.value}/enhance`, {})
    success.value = 'Oportunidade enriquecida com IA. Revise os dados antes de publicar.'
    await fetchOpportunity()
  } catch (e: any) {
    error.value = e?.response?.data?.detail || e?.message || 'Erro ao enriquecer oportunidade.'
  } finally {
    enhancing.value = false
  }
}

function openDeleteModal() {
  showDeleteModal.value = true
}

function closeDeleteModal() {
  if (!deleting.value) showDeleteModal.value = false
}

async function confirmDelete() {
  if (!opportunityId.value || deleting.value) return

  deleting.value = true
  error.value = null

  try {
    await del(`/opportunity/${opportunityId.value}`)
    await router.push('/oportunidades')
  } catch (e: any) {
    error.value = e?.response?.data?.detail || e?.message || 'Erro ao deletar oportunidade.'
  } finally {
    deleting.value = false
    showDeleteModal.value = false
  }
}

function goBack() {
  if (loadedOpportunity.value?.slug) {
    router.push('/oportunidades')
    return
  }
  router.push('/oportunidades')
}

onMounted(fetchOpportunity)
</script>

<template>
  <div class="edit-page">
    <aside class="edit-guide">
      <div class="guide-card">
        <h2>Guia rápido</h2>

        <button
          class="guide-topic"
          :class="{ 'guide-topic--active': activeGuide === 0 }"
          @click="activeGuide = activeGuide === 0 ? null : 0"
        >
          Publicação
        </button>
        <div v-if="activeGuide === 0" class="guide-content">
          <p>Marque como verificada apenas depois de revisar título, descrição, cronograma, links e fontes.</p>
        </div>

        <button
          class="guide-topic"
          :class="{ 'guide-topic--active': activeGuide === 1 }"
          @click="activeGuide = activeGuide === 1 ? null : 1"
        >
          Prioridade
        </button>
        <div v-if="activeGuide === 1" class="guide-content">
          <p>0 normal, 3 destaque, 5 banner principal. Use 4–5 com moderação.</p>
        </div>

        <button
          class="guide-topic"
          :class="{ 'guide-topic--active': activeGuide === 2 }"
          @click="activeGuide = activeGuide === 2 ? null : 2"
        >
          Informações extras
        </button>
        <div v-if="activeGuide === 2" class="guide-content">
          <code>organizer</code>
          <code>requirements</code>
          <code>benefits</code>
          <code>application_process</code>
          <code>specifics.prizes</code>
          <code>references</code>
        </div>

        <button
          class="guide-topic"
          :class="{ 'guide-topic--active': activeGuide === 3 }"
          @click="activeGuide = activeGuide === 3 ? null : 3"
        >
          Perfil recomendado
        </button>
        <div v-if="activeGuide === 3" class="guide-content">
          <p>Esses campos alimentam o algoritmo de Para você, fit band, boletim e ranking personalizado.</p>
          <code>target_subjects</code>
          <code>target_goals</code>
          <code>recommended_experience_levels</code>
          <code>recurrence_type</code>
        </div>

        <button
          class="guide-topic"
          :class="{ 'guide-topic--active': activeGuide === 4 }"
          @click="activeGuide = activeGuide === 4 ? null : 4"
        >
          JSON completo
        </button>
        <div v-if="activeGuide === 4" class="guide-content">
          <p>Use o modo JSON completo para editar todos os campos enviados para a API de uma vez.</p>
          <code>title</code>
          <code>category</code>
          <code>status</code>
          <code>timeline</code>
          <code>category_data</code>
        </div>
      </div>
    </aside>

    <main class="edit-main">
      <div v-if="loading" class="loading-card">
        <div class="pulse-title"></div>
        <div class="pulse-line"></div>
        <div class="pulse-line pulse-line--short"></div>
      </div>

      <div v-else-if="error && !loadedOpportunity" class="error-card">
        <div class="error-icon">!</div>
        <h1>Não foi possível abrir a edição</h1>
        <p>{{ error }}</p>
        <div class="error-actions">
          <button class="ghost-btn" @click="router.push('/oportunidades')">Voltar</button>
          <button v-if="hasValidId" class="submit-btn" @click="fetchOpportunity">Tentar novamente</button>
        </div>
      </div>

      <form v-else class="editor-card" @submit.prevent="save">
        <header class="editor-header">
          <div>
            <button type="button" class="back-link" @click="goBack">
              ← Voltar para oportunidades
            </button>
            <h1>Editar oportunidade</h1>
            <p>
              Revise o conteúdo, organize os dados extras e publique quando estiver confiável.
            </p>
          </div>

          <div class="header-actions">
            <button
              type="button"
              class="json-toggle-btn"
              @click="toggleFullJsonMode"
            >
              {{ fullJsonMode ? 'Voltar para campos' : 'Editar JSON completo' }}
            </button>

            <button
              v-if="canUseAdminActions"
              type="button"
              class="danger-btn"
              :disabled="deleting"
              @click="openDeleteModal"
            >
              Deletar
            </button>
            <button
              type="button"
              class="ai-btn"
              :disabled="enhancing || !hasValidId"
              @click="enhanceWithAI"
            >
              {{ enhancing ? 'Enriquecendo…' : 'Enriquecer com IA' }}
            </button>
            <button
              type="submit"
              class="submit-btn"
              :disabled="saving || uploadingCover || !canSave"
            >
              {{ uploadingCover ? 'Enviando imagem…' : saving ? 'Salvando…' : 'Salvar' }}
            </button>
          </div>
        </header>

        <Transition name="slide-fade">
          <div v-if="success" class="notice notice--success">
            <strong>Pronto.</strong> {{ success }}
          </div>
        </Transition>

        <div v-if="error" class="notice notice--error">
          <strong>Erro.</strong> {{ error }}
        </div>

        <section v-if="!fullJsonMode" class="status-row">
          <label class="status-pill">
            <input v-model="form.is_free" type="checkbox" />
            <span>Gratuita</span>
          </label>

          <label class="status-pill status-pill--green">
            <input v-model="form.human_verified" type="checkbox" />
            <span>Verificada/publicada</span>
          </label>

          <span class="word-count">{{ wordCount }} palavras na descrição</span>
        </section>

        <template v-if="!fullJsonMode">
          <section class="form-section form-section--main">
            <div class="title-field">
              <input
                v-model="form.title"
                type="text"
                placeholder="Título da oportunidade…"
              />
              <p v-if="errors.title" class="field-error">{{ errors.title }}</p>
            </div>

            <div class="grid-two">
              <label class="field">
                <span>Categoria</span>
                <select v-model="form.category">
                  <option v-for="cat in CATEGORIES" :key="cat.value" :value="cat.value">
                    {{ cat.label }}
                  </option>
                </select>
              </label>

              <label class="field">
                <span>Prioridade</span>
                <select v-model.number="form.priority">
                  <option v-for="item in PRIORITY_OPTIONS" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </option>
                </select>
              </label>

              <label class="field">
                <span>Slug</span>
                <input v-model="form.slug" placeholder="deixe vazio para manter" />
              </label>

              <label class="field">
                <span>Local</span>
                <input v-model="form.location" placeholder="Online, Brasil, Fortaleza…" />
              </label>
            </div>
          </section>

          <section class="form-section">
            <div class="section-title-row">
              <div>
                <h2>Conteúdo</h2>
                <p>O resumo aparece no card. A descrição aparece no modal.</p>
              </div>
            </div>

            <label class="field">
              <span>Resumo</span>
              <textarea v-model="form.excerpt" rows="2" placeholder="Descrição curta e chamativa…" />
            </label>

            <label class="field">
              <span>Descrição *</span>
              <textarea
                v-model="form.description"
                rows="10"
                placeholder="Explique o que é, para quem é, por que vale a pena e como participar…"
              />
              <p v-if="errors.description" class="field-error">{{ errors.description }}</p>
            </label>
          </section>

          <section class="form-section">
            <div class="section-title-row">
              <div>
                <h2>Links e mídia</h2>
              </div>
            </div>

            <section class="upload-card">
              <div class="upload-card-header">
                <div>
                  <span>Imagem de capa</span>
                  <p>Upload opcional por Cloudinary. No formulário visual não há campo para colar link manualmente.</p>
                </div>

                <button
                  v-if="form.cover_url || coverPreviewUrl"
                  type="button"
                  class="small-btn small-btn--danger"
                  :disabled="uploadingCover"
                  @click="clearCoverImage"
                >
                  Remover capa
                </button>
              </div>

              <label
                class="cover-dropzone"
                :class="{ 'is-uploading': uploadingCover, 'has-preview': Boolean(coverPreviewUrl) }"
              >
                <input
                  ref="coverFileInput"
                  class="file-input"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  :disabled="uploadingCover"
                  @change="handleCoverFileChange"
                />

                <div v-if="coverPreviewUrl" class="cover-preview">
                  <img :src="coverPreviewUrl" alt="Prévia da capa da oportunidade" />
                </div>

                <div class="cover-dropzone-text">
                  <strong>
                    {{ uploadingCover ? 'Enviando imagem…' : coverPreviewUrl ? 'Trocar imagem' : 'Clique para escolher uma imagem' }}
                  </strong>
                  <small>Máximo 5MB · JPG, PNG ou WEBP · opcional</small>
                </div>
              </label>

              <div v-if="form.cover_url" class="cloudinary-url-preview">
                <span>URL da capa salva</span>
                <code>{{ form.cover_url }}</code>
              </div>

              <p v-if="coverUploadStatus" class="upload-status">{{ coverUploadStatus }}</p>
              <p v-if="errors.cover_url" class="field-error">{{ errors.cover_url }}</p>
            </section>

            <label class="field official-url-field">
              <span>Site oficial</span>
              <input v-model="form.official_site_url" placeholder="https://…" />
              <p v-if="errors.official_site_url" class="field-error">{{ errors.official_site_url }}</p>
            </label>
          </section>

          <section class="form-section">
            <div class="section-title-row">
              <div>
                <h2>Tags e busca</h2>
                <p>Tags ajudam filtros visuais. Keywords ajudam busca e embedding.</p>
              </div>
            </div>

            <label class="field">
              <span>Keywords</span>
              <input v-model="form.keywords" placeholder="redação, competição internacional, ensino médio…" />
            </label>

            <label class="field">
              <span>Tags</span>
              <div class="tag-box">
                <span v-for="tag in form.tags" :key="tag" class="tag-chip">
                  #{{ tag }}
                  <button type="button" @click="removeTag(tag)">×</button>
                </span>
                <input
                  v-model="tagInput"
                  placeholder="Adicionar tag…"
                  @keydown="onTagKeydown"
                  @blur="addTag"
                />
              </div>
            </label>
          </section>

          <section class="form-section">
            <div class="section-title-row">
              <div>
                <h2>Perfil recomendado</h2>
                <p>Campos usados pelo sistema de recomendações: Para você, boletim, fit band e seleção por nível.</p>
              </div>
            </div>

            <div class="recommendation-editor">
              <div class="recommendation-block">
                <div class="recommendation-block__header">
                  <strong>Áreas relacionadas</strong>
                  <span>Conecta a oportunidade aos interesses/matérias do estudante.</span>
                </div>

                <div class="option-chip-grid">
                  <button
                    v-for="option in TARGET_SUBJECT_OPTIONS"
                    :key="option.value"
                    type="button"
                    class="option-chip"
                    :class="{ 'option-chip--active': form.target_subjects.includes(option.value) }"
                    @click="toggleListValue(form.target_subjects, option.value)"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </div>

              <div class="recommendation-block">
                <div class="recommendation-block__header">
                  <strong>Objetivos que ela atende</strong>
                  <span>Ajuda a decidir se aparece para olimpíadas, pesquisa, college prep, habilidades etc.</span>
                </div>

                <div class="option-chip-grid">
                  <button
                    v-for="option in TARGET_GOAL_OPTIONS"
                    :key="option.value"
                    type="button"
                    class="option-chip"
                    :class="{ 'option-chip--active': form.target_goals.includes(option.value) }"
                    @click="toggleListValue(form.target_goals, option.value)"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </div>

              <div class="grid-two">
                <div class="recommendation-block">
                  <div class="recommendation-block__header">
                    <strong>Nível escolar sugerido</strong>
                    <span>Quem deveria considerar essa oportunidade.</span>
                  </div>

                  <div class="option-chip-grid option-chip-grid--compact">
                    <button
                      v-for="option in TARGET_EDUCATION_LEVEL_OPTIONS"
                      :key="option.value"
                      type="button"
                      class="option-chip"
                      :class="{ 'option-chip--active': form.target_education_levels.includes(option.value) }"
                      @click="toggleListValue(form.target_education_levels, option.value)"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                </div>

                <div class="recommendation-block">
                  <div class="recommendation-block__header">
                    <strong>Nível recomendado</strong>
                    <span>Base para safety, target, reach e aspiracional.</span>
                  </div>

                  <div class="option-chip-grid option-chip-grid--compact">
                    <button
                      v-for="option in EXPERIENCE_LEVEL_OPTIONS"
                      :key="option.value"
                      type="button"
                      class="option-chip"
                      :class="{ 'option-chip--active': form.recommended_experience_levels.includes(option.value) }"
                      @click="toggleListValue(form.recommended_experience_levels, option.value)"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                </div>

                <div class="recommendation-block">
                  <div class="recommendation-block__header">
                    <strong>Competitividade</strong>
                    <span>Quão seletiva/difícil é a oportunidade.</span>
                  </div>

                  <div class="option-chip-grid option-chip-grid--compact">
                    <button
                      v-for="option in COMPETITIVENESS_OPTIONS"
                      :key="option.value"
                      type="button"
                      class="option-chip"
                      :class="{ 'option-chip--active': form.competitiveness_level.includes(option.value) }"
                      @click="toggleListValue(form.competitiveness_level, option.value)"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                </div>

                <div class="recommendation-block">
                  <div class="recommendation-block__header">
                    <strong>Tempo de preparo</strong>
                    <span>Ajuda a decidir se é para agora ou para preparar.</span>
                  </div>

                  <div class="option-chip-grid option-chip-grid--compact">
                    <button
                      v-for="option in PREPARATION_HORIZON_OPTIONS"
                      :key="option.value"
                      type="button"
                      class="option-chip"
                      :class="{ 'option-chip--active': form.preparation_horizon.includes(option.value) }"
                      @click="toggleListValue(form.preparation_horizon, option.value)"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                </div>

                <div class="recommendation-block">
                  <div class="recommendation-block__header">
                    <strong>Recorrência</strong>
                    <span>Define se algo fechado ainda vale acompanhar no próximo ciclo.</span>
                  </div>

                  <div class="option-chip-grid option-chip-grid--compact">
                    <button
                      v-for="option in RECURRENCE_TYPE_OPTIONS"
                      :key="option.value"
                      type="button"
                      class="option-chip"
                      :class="{ 'option-chip--active': form.recurrence_type.includes(option.value) }"
                      @click="toggleListValue(form.recurrence_type, option.value)"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                </div>

                <label class="field recommendation-notes-field">
                  <span>Notas de recomendação</span>
                  <textarea
                    v-model="form.recommendation_notes"
                    rows="5"
                    maxlength="512"
                    placeholder="Ex.: boa primeira olimpíada para estudantes iniciantes em matemática."
                  />
                </label>
              </div>

              <div v-if="recommendationPreviewFacts.length > 0" class="preview-box recommendation-preview">
                <div class="preview-grid">
                  <div v-for="fact in recommendationPreviewFacts" :key="fact.label" class="preview-card">
                    <span>{{ fact.label }}</span>
                    <strong>{{ fact.value }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="form-section">
            <div class="section-title-row">
              <div>
                <h2>Cronograma</h2>
                <p>Marque “Calendário” apenas para datas acionáveis: inscrições, prazos, provas ou resultados importantes.</p>
              </div>
              <button type="button" class="small-btn" @click="addTimelineItem">+ Data</button>
            </div>

            <div class="timeline-editor">
              <div v-for="(item, idx) in form.timeline" :key="idx" class="timeline-row">
                <select v-model="item.kind" class="timeline-kind-select">
                  <option v-for="option in TIMELINE_KIND_OPTIONS" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
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
                <p>Esse JSON alimenta os cards verticais de detalhes no modal.</p>
              </div>
              <div class="section-actions">
                <button type="button" class="small-btn" @click="mergeJsonTemplate">Completar estrutura</button>
                <button type="button" class="small-btn" @click="formatJson">Formatar</button>
                <button type="button" class="small-btn small-btn--danger" @click="resetJsonTemplate">Resetar</button>
              </div>
            </div>

            <div class="tabs">
              <button type="button" :class="{ active: activeTab === 'write' }" @click="activeTab = 'write'">Campos</button>
              <button type="button" :class="{ active: activeTab === 'json' }" @click="activeTab = 'json'">JSON</button>
              <button type="button" :class="{ active: activeTab === 'preview' }" @click="activeTab = 'preview'">Prévia</button>
            </div>

            <div v-if="activeTab === 'write'" class="extra-fields-note">
              <p>
                Edite em JSON quando precisar de dados complexos. Convenções aceitas:
                <strong>requirements</strong>, <strong>benefits</strong>, <strong>application_process</strong>,
                <strong>specifics.prizes</strong>, <strong>specifics.stages</strong> e <strong>references</strong>.
              </p>
            </div>

            <textarea
              v-if="activeTab === 'json' || activeTab === 'write'"
              v-model="form.categoryDataJson"
              class="json-area"
              rows="24"
              spellcheck="false"
            />
            <p v-if="errors.category_data" class="field-error">{{ errors.category_data }}</p>

            <div v-if="activeTab === 'preview'" class="preview-box">
              <div v-if="previewFacts.length" class="preview-grid">
                <div v-for="fact in previewFacts" :key="fact.label" class="preview-card">
                  <span>{{ fact.label }}</span>
                  <strong>{{ fact.value }}</strong>
                </div>
              </div>
              <p v-else class="preview-empty">Nenhuma informação estruturada encontrada.</p>
            </div>
          </section>
        </template>

        <section v-else class="form-section form-section--full-json">
          <div class="section-title-row">
            <div>
              <h2>JSON completo da oportunidade</h2>
              <p>
                Edite diretamente o payload enviado para a API. Campos com <code>null</code> são opcionais.
              </p>
            </div>

            <div class="section-actions">
              <button type="button" class="small-btn" @click="syncFullJsonFromForm">Sincronizar campos</button>
              <button type="button" class="small-btn" @click="mergeFullJsonSchema">Completar schema</button>
              <button type="button" class="small-btn" @click="formatFullJson">Formatar</button>
              <button type="button" class="small-btn small-btn--danger" @click="resetFullJsonFromLoaded">Resetar original</button>
            </div>
          </div>

          <div class="full-json-warning">
            <strong>Modo avançado.</strong>
            Aqui você consegue editar tudo: conteúdo, links, cronograma, publicação, prioridade, tags e <code>category_data</code>.
          </div>

          <textarea
            v-model="fullJsonText"
            class="json-area json-area--full"
            rows="38"
            spellcheck="false"
          />

          <p v-if="errors.full_json" class="field-error">{{ errors.full_json }}</p>

          <div class="schema-help">
            <h3>Campos aceitos</h3>
            <p>
              <code>title</code>, <code>slug</code>, <code>category</code>, <code>status</code>,
              <code>description</code>, <code>excerpt</code>, <code>cover_url</code>,
              <code>official_site_url</code>, <code>location</code>, <code>is_free</code>,
              <code>human_verified</code>, <code>approved</code>, <code>priority</code>,
              <code>next_deadline</code>, <code>timeline</code>, <code>category_data</code>,
              <code>keywords</code>, <code>tags</code>, <code>target_subjects</code>,
              <code>target_goals</code>, <code>target_education_levels</code>,
              <code>recommended_experience_levels</code>, <code>competitiveness_level</code>,
              <code>preparation_horizon</code>, <code>recurrence_type</code> e
              <code>recommendation_notes</code>.
            </p>
          </div>
        </section>

        <footer class="actions">
          <button type="button" class="ghost-btn" @click="goBack">Cancelar</button>
          <button type="submit" class="submit-btn" :disabled="saving || !canSave">
            {{ saving ? 'Salvando…' : 'Salvar alterações' }}
          </button>
        </footer>
      </form>
    </main>

    <Transition name="fade">
      <div
        v-if="showDeleteModal"
        class="delete-backdrop"
        @click.self="closeDeleteModal"
      >
        <div class="delete-modal">
          <h3>Deletar oportunidade?</h3>
          <p>Essa ação move a oportunidade para fora da base. Não faça isso se você só quer despublicar — nesse caso, desmarque “Verificada/publicada”.</p>

          <div class="delete-actions">
            <button class="ghost-btn" :disabled="deleting" @click="closeDeleteModal">Cancelar</button>
            <button class="danger-btn" :disabled="deleting" @click="confirmDelete">
              {{ deleting ? 'Deletando…' : 'Sim, deletar' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.edit-page {
  min-height: 100vh;
  background: #fafaf9;
  color: #1c1917;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  display: flex;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 28px 18px 72px;
}

.edit-guide {
  display: none;
  width: 220px;
  flex-shrink: 0;
}

.guide-card {
  position: sticky;
  top: 24px;
  background: white;
  border: 1px solid #e8e4dc;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 8px 40px rgba(0,0,0,.04);
}

.guide-card h2 {
  margin: 0 0 14px;
  font-size: .72rem;
  font-weight: 900;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: #aaa;
}

.guide-topic {
  width: 100%;
  border: none;
  background: transparent;
  border-bottom: 1px solid #f7f5f0;
  color: #555;
  cursor: pointer;
  font-size: .78rem;
  font-weight: 800;
  padding: 10px 0;
  text-align: left;
}

.guide-topic--active,
.guide-topic:hover {
  color: #079272;
}

.guide-content {
  padding: 8px 0 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.guide-content p {
  margin: 0;
  font-size: .76rem;
  line-height: 1.5;
  color: #777;
}

.guide-content code {
  display: block;
  background: #f8fafc;
  color: #079272;
  border-radius: 7px;
  padding: 5px 7px;
  font-size: .68rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.edit-main {
  flex: 1;
  min-width: 0;
  max-width: 1040px;
  margin: 0 auto;
}

.loading-card,
.error-card,
.editor-card {
  background: white;
  border: 1px solid #e8e4dc;
  border-radius: 22px;
  box-shadow: 0 14px 55px rgba(0,0,0,.055);
  overflow: hidden;
}

.loading-card,
.error-card {
  padding: 34px;
}

.pulse-title,
.pulse-line {
  height: 16px;
  border-radius: 999px;
  background: #f0ece5;
  animation: pulse 1.4s ease-in-out infinite;
  margin-bottom: 12px;
}

.pulse-title { width: 220px; height: 22px; }
.pulse-line { width: 100%; }
.pulse-line--short { width: 64%; }

@keyframes pulse {
  0%, 100% { opacity: .55; }
  50% { opacity: 1; }
}

.error-card {
  text-align: center;
}

.error-icon {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: #fef2f2;
  color: #dc2626;
  display: grid;
  place-items: center;
  font-weight: 900;
  margin: 0 auto 14px;
}

.error-card h1 {
  margin: 0 0 8px;
  font-size: 1.1rem;
}

.error-card p {
  color: #666;
  margin: 0 auto 20px;
  max-width: 520px;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.editor-header {
  padding: 24px 26px 20px;
  border-bottom: 1px solid #f7f5f0;
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
}

.back-link {
  display: inline-flex;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #888;
  font-size: .75rem;
  font-weight: 800;
  padding: 0;
  margin-bottom: 12px;
}

.back-link:hover {
  color: #079272;
}

.editor-header h1 {
  margin: 0 0 6px;
  color: #111;
  font-size: clamp(1.35rem, 3vw, 2rem);
  line-height: 1.05;
  letter-spacing: -.04em;
  font-weight: 900;
}

.editor-header p {
  margin: 0;
  color: #888;
  line-height: 1.55;
  font-size: .84rem;
  max-width: 560px;
}

.header-actions,
.actions,
.delete-actions,
.section-actions {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}

.notice {
  margin: 18px 26px 0;
  padding: 13px 14px;
  border-radius: 13px;
  font-size: .84rem;
  line-height: 1.45;
}

.notice--success {
  background: #f0faf7;
  color: #079272;
  border: 1px solid rgba(7,146,114,.2);
}

.notice--error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.status-row {
  margin: 20px 26px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.status-pill,
.status-note,
.word-count {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 11px;
  border-radius: 999px;
  font-size: .76rem;
  font-weight: 850;
}

.status-pill {
  color: #57534e;
  background: #f7f5f0;
  border: 1px solid #e8e4dc;
  cursor: pointer;
}

.status-pill--green {
  background: #ecfdf5;
  color: #065f46;
  border-color: #a7f3d0;
}

.status-note,
.word-count {
  color: #aaa;
  background: transparent;
  padding-left: 0;
}

.upload-card {
  border: 1px solid #e8e4dc;
  border-radius: 16px;
  background: #fafaf9;
  padding: 16px;
  margin-bottom: 16px;
}

.upload-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
}

.upload-card-header span {
  color: #555;
  font-size: .78rem;
  font-weight: 850;
}

.upload-card-header p {
  margin: 4px 0 0;
  color: #999;
  font-size: .78rem;
  line-height: 1.5;
}

.cover-dropzone {
  position: relative;
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 14px;
  align-items: center;
  min-height: 148px;
  padding: 12px;
  border: 1.5px dashed #a7f3d0;
  border-radius: 15px;
  background: #ecfdf5;
  cursor: pointer;
  transition: border-color .15s, background .15s, opacity .15s;
}

.cover-dropzone:hover {
  border-color: #079272;
  background: #d1fae5;
}

.cover-dropzone.is-uploading {
  cursor: wait;
  opacity: .75;
}

.cover-dropzone:not(.has-preview) {
  grid-template-columns: 1fr;
  justify-items: center;
  text-align: center;
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.file-input:disabled {
  cursor: wait;
}

.cover-preview {
  height: 124px;
  border-radius: 13px;
  overflow: hidden;
  background: #e8e4dc;
  border: 1px solid #d6d3d1;
}

.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-dropzone-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #065f46;
}

.cover-dropzone-text strong {
  font-size: .88rem;
}

.cover-dropzone-text small {
  color: #047857;
  font-size: .74rem;
  font-weight: 800;
}

.cloudinary-url-preview {
  margin-top: 12px;
  padding: 10px 11px;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.cloudinary-url-preview span {
  color: #999;
  font-size: .68rem;
  font-weight: 900;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.cloudinary-url-preview code {
  color: #047857;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: .72rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-status {
  margin: 10px 0 0;
  color: #047857;
  font-size: .76rem;
  font-weight: 850;
}

.official-url-field {
  margin-bottom: 0;
}

.form-section {
  padding: 24px 26px 0;
}

.form-section--main {
  padding-top: 24px;
}

.form-section--full-json {
  padding-top: 24px;
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.section-title-row h2 {
  margin: 0 0 5px;
  font-size: .95rem;
  color: #111;
  font-weight: 900;
  letter-spacing: -.015em;
}

.section-title-row p,
.extra-fields-note p {
  margin: 0;
  color: #999;
  font-size: .78rem;
  line-height: 1.55;
}

.section-title-row code {
  background: #f1f5f9;
  color: #079272;
  border-radius: 6px;
  padding: 2px 5px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: .72rem;
}

.title-field input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: #111;
  font-size: clamp(1.4rem, 3vw, 2rem);
  font-weight: 900;
  letter-spacing: -.035em;
  padding: 6px 0 16px;
}

.title-field input::placeholder {
  color: #ccc;
}

.grid-two {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 14px;
}

.field span {
  color: #555;
  font-size: .78rem;
  font-weight: 850;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  padding: 11px 12px;
  font: inherit;
  font-size: .86rem;
  color: #1c1917;
  background: white;
  outline: none;
  transition: border-color .15s, box-shadow .15s, background .15s;
}

textarea {
  resize: vertical;
  line-height: 1.6;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #079272;
  box-shadow: 0 0 0 3px rgba(7,146,114,.13);
}

.field-error {
  margin: 8px 0 0;
  color: #dc2626;
  font-size: .72rem;
  font-weight: 700;
}

.tag-box {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  min-height: 46px;
  padding: 9px;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  background: white;
}

.tag-box:focus-within {
  border-color: #079272;
  box-shadow: 0 0 0 3px rgba(7,146,114,.13);
}

.tag-box input {
  flex: 1;
  min-width: 140px;
  border: none;
  box-shadow: none;
  padding: 4px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(7,146,114,.1);
  color: #079272;
  border-radius: 9px;
  padding: 5px 9px;
  font-size: .74rem;
  font-weight: 850;
}

.tag-chip button {
  border: none;
  background: transparent;
  color: inherit;
  font-weight: 900;
  cursor: pointer;
  padding: 0;
}

.recommendation-editor {
  display: grid;
  gap: 14px;
}

.recommendation-block {
  border: 1px solid #e8e4dc;
  border-radius: 16px;
  background: #fafaf9;
  padding: 14px;
}

.recommendation-block__header {
  display: grid;
  gap: 4px;
  margin-bottom: 12px;
}

.recommendation-block__header strong {
  color: #111;
  font-size: .84rem;
  font-weight: 950;
}

.recommendation-block__header span {
  color: #999;
  font-size: .76rem;
  line-height: 1.45;
}

.option-chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.option-chip-grid--compact {
  gap: 7px;
}

.option-chip {
  border: 1px solid #e8e4dc;
  background: white;
  color: #57534e;
  border-radius: 999px;
  padding: 8px 10px;
  font-size: .74rem;
  font-weight: 900;
  cursor: pointer;
  transition: background .15s, border-color .15s, color .15s, transform .15s;
}

.option-chip:hover {
  transform: translateY(-1px);
  border-color: #a7f3d0;
}

.option-chip--active {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #047857;
}

.recommendation-notes-field {
  margin-bottom: 0;
}

.recommendation-preview {
  background: #f0faf7;
  border-color: rgba(7,146,114,.18);
}

.timeline-editor {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.timeline-row {
  display: grid;
  grid-template-columns: 190px 1fr 150px 1fr 126px 38px;
  gap: 8px;
  align-items: center;
}

.timeline-kind-select {
  min-width: 0;
}

.timeline-row button {
  border: none;
  background: #fee2e2;
  color: #991b1b;
  height: 40px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 900;
}

.calendar-check {
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid #e8e4dc;
  background: #fafaf9;
  border-radius: 12px;
  padding: 0 10px;
  color: #57534e;
  cursor: pointer;
  font-size: .76rem;
  font-weight: 900;
  user-select: none;
}

.calendar-check input {
  width: auto;
  accent-color: #079272;
}

.calendar-check:has(input:checked) {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #065f46;
}

.tabs {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border: 1px solid #e8e4dc;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 12px;
}

.tabs button {
  border: none;
  background: transparent;
  color: #94a3b8;
  border-radius: 9px;
  cursor: pointer;
  font-size: .78rem;
  font-weight: 850;
  padding: 8px 12px;
}

.tabs button.active {
  background: white;
  color: #079272;
  box-shadow: 0 1px 3px rgba(0,0,0,.08);
}

.extra-fields-note {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 13px;
  padding: 12px 13px;
  margin-bottom: 12px;
}

.json-area {
  width: 100%;
  min-height: 380px;
  background: #0f172a;
  color: #e2e8f0;
  border-color: #1e293b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: .76rem;
  line-height: 1.55;
}

.json-area--full {
  min-height: 680px;
  font-size: .78rem;
}

.full-json-warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  border-radius: 14px;
  padding: 13px 14px;
  margin-bottom: 14px;
  font-size: .82rem;
  line-height: 1.5;
}

.full-json-warning code,
.schema-help code {
  background: rgba(255,255,255,.65);
  border-radius: 6px;
  padding: 2px 5px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.schema-help {
  margin-top: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px;
}

.schema-help h3 {
  margin: 0 0 8px;
  font-size: .82rem;
  font-weight: 900;
  color: #111;
}

.schema-help p {
  margin: 0;
  color: #64748b;
  line-height: 1.65;
  font-size: .78rem;
}

.preview-box {
  background: #fafaf9;
  border: 1px solid #e8e4dc;
  border-radius: 14px;
  padding: 15px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.preview-card {
  padding: 11px 12px;
  border-radius: 12px;
  background: white;
  border: 1px solid #eee7dc;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-card span {
  font-size: .68rem;
  font-weight: 900;
  color: #aaa;
  letter-spacing: .07em;
  text-transform: uppercase;
}

.preview-card strong {
  font-size: .82rem;
  color: #292524;
  line-height: 1.45;
}

.preview-empty {
  color: #999;
  font-size: .84rem;
  margin: 0;
}

.actions {
  border-top: 1px solid #f7f5f0;
  margin-top: 26px;
  padding: 20px 26px 24px;
  justify-content: flex-end;
}

button:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.submit-btn,
.ai-btn,
.ghost-btn,
.danger-btn,
.small-btn,
.json-toggle-btn {
  border: none;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: .82rem;
  font-weight: 900;
  cursor: pointer;
  transition: transform .15s, background .15s, box-shadow .15s;
}

.submit-btn {
  background: linear-gradient(135deg, #079272, #0DA790);
  color: white;
}

.submit-btn:hover:not(:disabled),
.ai-btn:hover:not(:disabled),
.json-toggle-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 22px rgba(7,146,114,.22);
}

.ai-btn {
  background: #1c1917;
  color: white;
}

.json-toggle-btn {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.ghost-btn,
.small-btn {
  background: #f7f5f0;
  color: #555;
  border: 1px solid #e8e4dc;
}

.danger-btn,
.small-btn--danger {
  background: #dc2626;
  color: white;
}

.delete-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0,0,0,.5);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}

.delete-modal {
  width: 100%;
  max-width: 440px;
  background: white;
  border-radius: 20px;
  border: 1px solid #e8e4dc;
  padding: 24px;
  box-shadow: 0 24px 80px rgba(0,0,0,.28);
}

.delete-modal h3 {
  margin: 0 0 8px;
  font-size: 1.05rem;
  font-weight: 900;
  color: #111;
}

.delete-modal p {
  margin: 0 0 22px;
  color: #666;
  font-size: .88rem;
  line-height: 1.6;
}

.delete-actions {
  justify-content: flex-end;
}

.slide-fade-enter-active { transition: all .2s ease; }
.slide-fade-leave-active { transition: all .12s ease; }
.slide-fade-enter-from { opacity: 0; transform: translateY(6px); }
.slide-fade-leave-to { opacity: 0; transform: translateY(-4px); }
.fade-enter-active,
.fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

@media (min-width: 1180px) {
  .edit-guide { display: block; }
}

@media (max-width: 820px) {
  .edit-page {
    display: block;
    padding: 18px 12px 60px;
  }

  .editor-header,
  .header-actions,
  .section-title-row,
  .actions,
  .upload-card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .grid-two,
  .preview-grid,
  .timeline-row,
  .cover-dropzone {
    grid-template-columns: 1fr;
  }

  .editor-header,
  .form-section,
  .actions,
  .status-row {
    padding-left: 18px;
    padding-right: 18px;
  }

  .notice {
    margin-left: 18px;
    margin-right: 18px;
  }

  .json-area--full {
    min-height: 520px;
  }

  .cover-preview {
    height: 180px;
  }
}
</style>