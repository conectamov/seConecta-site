<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Nova Olimpíada — seConecta' })

const router = useRouter()
const { post: apiPost } = useAxios()

type OlympiadStatus = 'SOON' | 'OPEN' | 'ONGOING' | 'CLOSED'

type ResourceRow = {
  name: string
  url: string
}

const form = ref({
  title: '',
  organizer: '',
  description: '',
  cover_url: '',
  status: 'SOON' as OlympiadStatus,
  categories: [] as string[],
  levels: [] as string[],
  languages: [] as string[],
  modalities: [] as string[],
  start_date: '',
  end_date: '',
  resources: [{ name: '', url: '' }] as ResourceRow[],
  official_site_url: '',
  location: '',
  is_free: true,
  target_audience: '',
  has_certificate: false,
  has_mentorship: false,
  how_to_register: '',
  prizes: '',
  requirements: '',
})

const categoryInput = ref('')
const levelInput = ref('')
const languageInput = ref('')
const modalityInput = ref('')
const submitting = ref(false)
const error = ref<string | null>(null)
const success = ref(false)
const errors = ref<Record<string, string>>({})
const activeTab = ref<'write' | 'preview'>('write')
const activeGuide = ref<number | null>(null)

const statusOptions: Array<{ value: OlympiadStatus; label: string }> = [
  { value: 'SOON', label: 'Em breve' },
  { value: 'OPEN', label: 'Inscrições abertas' },
  { value: 'ONGOING', label: 'Em andamento' },
  { value: 'CLOSED', label: 'Encerrada' },
]

const topics = [
  { title: 'Categorias', content: ['matemática', 'tecnologia', 'ciências'] },
  { title: 'Níveis', content: ['Ensino Fundamental', 'Ensino Médio'] },
  { title: 'Idiomas', content: ['Português', 'Inglês'] },
  { title: 'Modalidades', content: ['Online', 'Presencial'] },
  { title: 'Status', content: ['SOON', 'OPEN', 'ONGOING', 'CLOSED'] },
]

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function normalizeLabel(text: string) {
  return text.trim().replace(/\s+/g, ' ')
}

function addToList(list: string[], value: string) {
  const cleaned = value.trim()
  if (!cleaned) return list

  if (list.includes(cleaned)) return list
  if (list.length >= 10) return list

  return [...list, cleaned]
}

function addCategory() {
  form.value.categories = addToList(form.value.categories, categoryInput.value.toLowerCase())
  categoryInput.value = ''
}

function addLevel() {
  form.value.levels = addToList(form.value.levels, normalizeLabel(levelInput.value))
  levelInput.value = ''
}

function addLanguage() {
  form.value.languages = addToList(form.value.languages, normalizeLabel(languageInput.value))
  languageInput.value = ''
}

function addModality() {
  form.value.modalities = addToList(form.value.modalities, normalizeLabel(modalityInput.value))
  modalityInput.value = ''
}

function removeFromList(field: 'categories' | 'levels' | 'languages' | 'modalities', value: string) {
  form.value[field] = form.value[field].filter(item => item !== value)
}

function onKeydown(e: KeyboardEvent, field: 'categories' | 'levels' | 'languages' | 'modalities') {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    if (field === 'categories') addCategory()
    if (field === 'levels') addLevel()
    if (field === 'languages') addLanguage()
    if (field === 'modalities') addModality()
  }
}

function addResource() {
  form.value.resources.push({ name: '', url: '' })
}

function removeResource(index: number) {
  if (form.value.resources.length === 1) {
    form.value.resources[0] = { name: '', url: '' }
    return
  }
  form.value.resources.splice(index, 1)
}

function isValidUrl(value: string) {
  if (!value.trim()) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function localDateTimeToIso(value: string) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString()
}

function validate() {
  errors.value = {}

  if (!form.value.title.trim()) errors.value.title = 'O título é obrigatório.'
  if (!form.value.organizer.trim()) errors.value.organizer = 'O organizador é obrigatório.'
  if (!form.value.description.trim()) errors.value.description = 'A descrição é obrigatória.'
  if (!form.value.cover_url.trim()) errors.value.cover_url = 'A imagem de capa é obrigatória.'
  else if (!isValidUrl(form.value.cover_url)) errors.value.cover_url = 'URL inválida.'

  if (!form.value.categories.length) errors.value.categories = 'Adicione ao menos uma categoria.'
  if (!form.value.levels.length) errors.value.levels = 'Adicione ao menos um nível.'
  if (!form.value.languages.length) errors.value.languages = 'Adicione ao menos um idioma.'
  if (!form.value.modalities.length) errors.value.modalities = 'Adicione ao menos uma modalidade.'

  if (form.value.start_date) {
    const start = new Date(form.value.start_date)
    if (Number.isNaN(start.getTime())) errors.value.start_date = 'Data de início inválida.'
  }

  if (form.value.end_date) {
    const end = new Date(form.value.end_date)
    if (Number.isNaN(end.getTime())) errors.value.end_date = 'Data de término inválida.'
  }

  if (form.value.start_date && form.value.end_date) {
    const start = new Date(form.value.start_date)
    const end = new Date(form.value.end_date)
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start) {
      errors.value.end_date = 'A data de término deve ser depois da data de início.'
    }
  }

  if (!form.value.official_site_url.trim()) errors.value.official_site_url = 'O site oficial é obrigatório.'
  else if (!isValidUrl(form.value.official_site_url)) errors.value.official_site_url = 'URL inválida.'

  if (!form.value.location.trim()) errors.value.location = 'A localização é obrigatória.'
  if (!form.value.target_audience.trim()) errors.value.target_audience = 'O público-alvo é obrigatório.'
  if (!form.value.how_to_register.trim()) errors.value.how_to_register = 'Informe como se inscrever.'
  if (!form.value.prizes.trim()) errors.value.prizes = 'Informe os prêmios.'
  if (!form.value.requirements.trim()) errors.value.requirements = 'Informe os requisitos.'

  const hasResource = form.value.resources.some(r => r.name.trim() || r.url.trim())
  if (!hasResource) errors.value.resources = 'Adicione ao menos um recurso.'

  for (const [i, r] of form.value.resources.entries()) {
    if ((r.name.trim() && !r.url.trim()) || (!r.name.trim() && r.url.trim())) {
      errors.value.resources = `Preencha nome e URL do recurso ${i + 1}.`
      break
    }
    if (r.url.trim() && !isValidUrl(r.url.trim())) {
      errors.value.resources = `URL inválida no recurso ${i + 1}.`
      break
    }
  }

  return !Object.keys(errors.value).length
}

watch(() => form.value.title, () => delete errors.value.title)
watch(() => form.value.organizer, () => delete errors.value.organizer)
watch(() => form.value.description, () => delete errors.value.description)
watch(() => form.value.cover_url, () => delete errors.value.cover_url)
watch(() => form.value.start_date, () => delete errors.value.start_date)
watch(() => form.value.end_date, () => delete errors.value.end_date)
watch(() => form.value.official_site_url, () => delete errors.value.official_site_url)
watch(() => form.value.location, () => delete errors.value.location)
watch(() => form.value.target_audience, () => delete errors.value.target_audience)
watch(() => form.value.how_to_register, () => delete errors.value.how_to_register)
watch(() => form.value.prizes, () => delete errors.value.prizes)
watch(() => form.value.requirements, () => delete errors.value.requirements)
watch(() => form.value.categories, () => delete errors.value.categories, { deep: true })
watch(() => form.value.levels, () => delete errors.value.levels, { deep: true })
watch(() => form.value.languages, () => delete errors.value.languages, { deep: true })
watch(() => form.value.modalities, () => delete errors.value.modalities, { deep: true })
watch(() => form.value.resources, () => delete errors.value.resources, { deep: true })

async function handleSubmit() {
  if (!validate()) return

  submitting.value = true
  error.value = null

  const payload: Record<string, any> = {
    title: form.value.title.trim(),
    organizer: form.value.organizer.trim(),
    description: form.value.description.trim(),
    cover_url: form.value.cover_url.trim(),
    status: form.value.status,
    categories: form.value.categories,
    levels: form.value.levels,
    languages: form.value.languages,
    modalities: form.value.modalities,
    official_site_url: form.value.official_site_url.trim(),
    location: form.value.location.trim(),
    is_free: form.value.is_free,
    target_audience: form.value.target_audience.trim(),
    has_certificate: form.value.has_certificate,
    has_mentorship: form.value.has_mentorship,
    how_to_register: form.value.how_to_register.trim(),
    prizes: form.value.prizes.trim(),
    requirements: form.value.requirements.trim(),
  }

  if (form.value.start_date) payload.start_date = localDateTimeToIso(form.value.start_date)
  if (form.value.end_date) payload.end_date = localDateTimeToIso(form.value.end_date)

  const cleanedResources = form.value.resources
    .map(r => ({
      name: r.name.trim(),
      url: r.url.trim(),
    }))
    .filter(r => r.name || r.url)

  if (cleanedResources.length) payload.resources = cleanedResources

  try {
    await apiPost('/olympiads/', payload)
    success.value = true
    setTimeout(() => router.push('/olimpiadas'), 2200)
  } catch (err: any) {
    const status = err?.response?.status

    if (status === 401 || status === 403) {
      error.value = 'Sem permissão para criar olimpíadas.'
    } else if (status === 422) {
      error.value = 'Dados inválidos. Verifique os campos.'
    } else {
      error.value = 'Erro ao criar olimpíada. Tente novamente.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex gap-5 px-4 md:px-8 py-6 max-w-[1400px] mx-auto relative z-10">
    <aside class="hidden xl:flex flex-col w-56 flex-shrink-0">
      <div class="bg-white rounded-2xl border border-[#e8e4dc] p-5 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
        <h2 class="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#aaa] mb-4">Guia rápido</h2>
        <div v-for="(topic, i) in topics" :key="i" class="border-b border-[#f7f5f0] last:border-0 pb-2 mb-2">
          <button
            class="w-full text-left text-[0.78rem] font-semibold text-[#555] hover:text-[#079272] transition-colors cursor-pointer border-none bg-transparent py-1"
            @click="activeGuide = activeGuide === i ? null : i"
          >
            {{ topic.title }}
          </button>
          <Transition name="slide-fade">
            <div v-if="activeGuide === i" class="mt-1 space-y-1">
              <code
                v-for="c in topic.content"
                :key="c"
                class="block text-[0.68rem] bg-[#f8fafc] text-[#079272] px-2 py-1 rounded font-mono"
              >{{ c }}</code>
            </div>
          </Transition>
        </div>
      </div>
    </aside>

    <main class="flex-1 min-w-0">
      <Transition name="slide-fade">
        <div v-if="success" class="mb-6 p-5 rounded-2xl bg-[#f0faf7] border border-[#079272]/20 flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-[#079272] flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <p class="font-bold text-[#079272] text-[0.88rem]">Olimpíada enviada com sucesso!</p>
            <p class="text-[0.8rem] text-[#0DA790] mt-0.5">A submissão foi enviada para análise. Redirecionando…</p>
          </div>
        </div>
      </Transition>

      <div v-if="error" class="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[0.83rem] flex items-center gap-2">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ error }}
      </div>

      <div class="bg-white rounded-2xl border border-[#e8e4dc] shadow-sm overflow-hidden">
        <div class="px-6 pt-6 pb-4 border-b border-[#f7f5f0] flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 class="text-[1.1rem] font-extrabold text-[#111] tracking-[-0.02em]">Nova olimpíada</h1>
            <p class="text-[0.75rem] text-[#aaa] mt-0.5">Crie uma nova oportunidade para a comunidade</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-[0.72rem] text-[#bbb]">{{ form.categories.length }} categorias · {{ form.levels.length }} níveis</span>
            <button
              class="px-5 py-2.5 rounded-xl text-[0.85rem] font-bold text-white bg-gradient-to-r from-[#079272] to-[#0DA790] hover:shadow-[0_4px_16px_rgba(7,146,114,0.3)] hover:-translate-y-0.5 transition-all border-none cursor-pointer disabled:opacity-50"
              :disabled="submitting || success"
              @click="handleSubmit"
            >
              {{ submitting ? 'Enviando…' : 'Publicar' }}
            </button>
          </div>
        </div>

        <div class="p-6 space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="block text-[0.78rem] font-semibold text-[#555] mb-1.5">Título</label>
              <input
                v-model="form.title"
                type="text"
                placeholder="Nome da olimpíada…"
                class="w-full px-4 py-2.5 rounded-xl border text-[0.85rem] outline-none transition-all"
                :class="errors.title ? 'border-red-300 bg-red-50' : 'border-[#e8e4dc] focus:border-[#079272] focus:ring-2 focus:ring-[#079272]/15'"
              />
              <p v-if="errors.title" class="text-red-500 text-[0.73rem] mt-1">{{ errors.title }}</p>
            </div>

            <div>
              <label class="block text-[0.78rem] font-semibold text-[#555] mb-1.5">Organizador</label>
              <input
                v-model="form.organizer"
                type="text"
                placeholder="IMPA, SBF, universidade…"
                class="w-full px-4 py-2.5 rounded-xl border text-[0.85rem] outline-none transition-all"
                :class="errors.organizer ? 'border-red-300 bg-red-50' : 'border-[#e8e4dc] focus:border-[#079272] focus:ring-2 focus:ring-[#079272]/15'"
              />
              <p v-if="errors.organizer" class="text-red-500 text-[0.73rem] mt-1">{{ errors.organizer }}</p>
            </div>
          </div>

          <div>
            <label class="block text-[0.78rem] font-semibold text-[#555] mb-1.5">URL da imagem de capa</label>
            <input
              v-model="form.cover_url"
              type="url"
              placeholder="https://…"
              class="w-full px-4 py-2.5 rounded-xl border text-[0.85rem] outline-none transition-all"
              :class="errors.cover_url ? 'border-red-300 bg-red-50' : 'border-[#e8e4dc] focus:border-[#079272] focus:ring-2 focus:ring-[#079272]/15'"
            />
            <p v-if="errors.cover_url" class="text-red-500 text-[0.73rem] mt-1">{{ errors.cover_url }}</p>
          </div>

          <div>
            <label class="block text-[0.78rem] font-semibold text-[#555] mb-1.5">Descrição</label>
            <textarea
              v-model="form.description"
              rows="4"
              placeholder="Descreva a olimpíada, público, objetivo e contexto…"
              class="w-full px-4 py-3 rounded-xl border text-[0.85rem] outline-none resize-none transition-all leading-relaxed"
              :class="errors.description ? 'border-red-300 bg-red-50' : 'border-[#e8e4dc] focus:border-[#079272] focus:ring-2 focus:ring-[#079272]/15'"
            ></textarea>
            <p v-if="errors.description" class="text-red-500 text-[0.73rem] mt-1">{{ errors.description }}</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label class="block text-[0.78rem] font-semibold text-[#555] mb-1.5">Status</label>
              <select
                v-model="form.status"
                class="w-full px-4 py-2.5 rounded-xl border text-[0.85rem] outline-none transition-all bg-white"
              >
                <option v-for="s in statusOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </div>

            <div>
              <label class="block text-[0.78rem] font-semibold text-[#555] mb-1.5">Início <span class="text-[#bbb] font-normal">(opcional)</span></label>
              <input
                v-model="form.start_date"
                type="datetime-local"
                class="w-full px-4 py-2.5 rounded-xl border text-[0.85rem] outline-none transition-all"
                :class="errors.start_date ? 'border-red-300 bg-red-50' : 'border-[#e8e4dc] focus:border-[#079272] focus:ring-2 focus:ring-[#079272]/15'"
              />
              <p v-if="errors.start_date" class="text-red-500 text-[0.73rem] mt-1">{{ errors.start_date }}</p>
            </div>

            <div>
              <label class="block text-[0.78rem] font-semibold text-[#555] mb-1.5">Término <span class="text-[#bbb] font-normal">(opcional)</span></label>
              <input
                v-model="form.end_date"
                type="datetime-local"
                class="w-full px-4 py-2.5 rounded-xl border text-[0.85rem] outline-none transition-all"
                :class="errors.end_date ? 'border-red-300 bg-red-50' : 'border-[#e8e4dc] focus:border-[#079272] focus:ring-2 focus:ring-[#079272]/15'"
              />
              <p v-if="errors.end_date" class="text-red-500 text-[0.73rem] mt-1">{{ errors.end_date }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="block text-[0.78rem] font-semibold text-[#555] mb-1.5">Localização</label>
              <input
                v-model="form.location"
                type="text"
                placeholder="Brasil, Internacional, estado…"
                class="w-full px-4 py-2.5 rounded-xl border text-[0.85rem] outline-none transition-all"
                :class="errors.location ? 'border-red-300 bg-red-50' : 'border-[#e8e4dc] focus:border-[#079272] focus:ring-2 focus:ring-[#079272]/15'"
              />
              <p v-if="errors.location" class="text-red-500 text-[0.73rem] mt-1">{{ errors.location }}</p>
            </div>

            <div>
              <label class="block text-[0.78rem] font-semibold text-[#555] mb-1.5">Site oficial</label>
              <input
                v-model="form.official_site_url"
                type="url"
                placeholder="https://…"
                class="w-full px-4 py-2.5 rounded-xl border text-[0.85rem] outline-none transition-all"
                :class="errors.official_site_url ? 'border-red-300 bg-red-50' : 'border-[#e8e4dc] focus:border-[#079272] focus:ring-2 focus:ring-[#079272]/15'"
              />
              <p v-if="errors.official_site_url" class="text-red-500 text-[0.73rem] mt-1">{{ errors.official_site_url }}</p>
            </div>
          </div>

          <div>
            <label class="block text-[0.78rem] font-semibold text-[#555] mb-1.5">Público-alvo</label>
            <textarea
              v-model="form.target_audience"
              rows="2"
              placeholder="Para quem esta olimpíada é voltada?"
              class="w-full px-4 py-2.5 rounded-xl border text-[0.85rem] outline-none resize-none transition-all"
              :class="errors.target_audience ? 'border-red-300 bg-red-50' : 'border-[#e8e4dc] focus:border-[#079272] focus:ring-2 focus:ring-[#079272]/15'"
            ></textarea>
            <p v-if="errors.target_audience" class="text-red-500 text-[0.73rem] mt-1">{{ errors.target_audience }}</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label class="flex items-center gap-3 p-4 rounded-xl border border-[#e8e4dc] bg-white cursor-pointer">
              <input v-model="form.is_free" type="checkbox" class="w-4 h-4 accent-[#079272]" />
              <span class="text-[0.84rem] font-semibold text-[#333]">Gratuita</span>
            </label>

            <label class="flex items-center gap-3 p-4 rounded-xl border border-[#e8e4dc] bg-white cursor-pointer">
              <input v-model="form.has_certificate" type="checkbox" class="w-4 h-4 accent-[#079272]" />
              <span class="text-[0.84rem] font-semibold text-[#333]">Certificado</span>
            </label>

            <label class="flex items-center gap-3 p-4 rounded-xl border border-[#e8e4dc] bg-white cursor-pointer">
              <input v-model="form.has_mentorship" type="checkbox" class="w-4 h-4 accent-[#079272]" />
              <span class="text-[0.84rem] font-semibold text-[#333]">Mentoria</span>
            </label>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <label class="block text-[0.78rem] font-semibold text-[#555] mb-1.5">Categorias</label>
              <div class="flex flex-wrap gap-1.5 p-3 border rounded-xl focus-within:border-[#079272] focus-within:ring-2 focus-within:ring-[#079272]/15 transition-all bg-white min-h-[44px]"
                   :class="errors.categories ? 'border-red-300 bg-red-50' : 'border-[#e8e4dc]'">
                <span v-for="tag in form.categories" :key="tag"
                  class="inline-flex items-center gap-1 text-[0.72rem] font-semibold px-2.5 py-1 rounded-lg bg-[#079272]/10 text-[#079272]">
                  #{{ tag }}
                  <button type="button" class="border-none bg-transparent cursor-pointer p-0 leading-none text-[#079272] hover:text-red-500" @click="removeFromList('categories', tag)">×</button>
                </span>
                <input
                  v-model="categoryInput"
                  type="text"
                  placeholder="Adicionar categoria…"
                  class="flex-1 min-w-[120px] border-none outline-none text-[0.82rem] bg-transparent"
                  @keydown="onKeydown($event, 'categories')"
                  @blur="addCategory"
                />
              </div>
              <p v-if="errors.categories" class="text-red-500 text-[0.73rem] mt-1">{{ errors.categories }}</p>
            </div>

            <div>
              <label class="block text-[0.78rem] font-semibold text-[#555] mb-1.5">Níveis</label>
              <div class="flex flex-wrap gap-1.5 p-3 border rounded-xl focus-within:border-[#079272] focus-within:ring-2 focus-within:ring-[#079272]/15 transition-all bg-white min-h-[44px]"
                   :class="errors.levels ? 'border-red-300 bg-red-50' : 'border-[#e8e4dc]'">
                <span v-for="tag in form.levels" :key="tag"
                  class="inline-flex items-center gap-1 text-[0.72rem] font-semibold px-2.5 py-1 rounded-lg bg-[#079272]/10 text-[#079272]">
                  {{ tag }}
                  <button type="button" class="border-none bg-transparent cursor-pointer p-0 leading-none text-[#079272] hover:text-red-500" @click="removeFromList('levels', tag)">×</button>
                </span>
                <input
                  v-model="levelInput"
                  type="text"
                  placeholder="Adicionar nível…"
                  class="flex-1 min-w-[120px] border-none outline-none text-[0.82rem] bg-transparent"
                  @keydown="onKeydown($event, 'levels')"
                  @blur="addLevel"
                />
              </div>
              <p v-if="errors.levels" class="text-red-500 text-[0.73rem] mt-1">{{ errors.levels }}</p>
            </div>

            <div>
              <label class="block text-[0.78rem] font-semibold text-[#555] mb-1.5">Idiomas</label>
              <div class="flex flex-wrap gap-1.5 p-3 border rounded-xl focus-within:border-[#079272] focus-within:ring-2 focus-within:ring-[#079272]/15 transition-all bg-white min-h-[44px]"
                   :class="errors.languages ? 'border-red-300 bg-red-50' : 'border-[#e8e4dc]'">
                <span v-for="tag in form.languages" :key="tag"
                  class="inline-flex items-center gap-1 text-[0.72rem] font-semibold px-2.5 py-1 rounded-lg bg-[#079272]/10 text-[#079272]">
                  {{ tag }}
                  <button type="button" class="border-none bg-transparent cursor-pointer p-0 leading-none text-[#079272] hover:text-red-500" @click="removeFromList('languages', tag)">×</button>
                </span>
                <input
                  v-model="languageInput"
                  type="text"
                  placeholder="Adicionar idioma…"
                  class="flex-1 min-w-[120px] border-none outline-none text-[0.82rem] bg-transparent"
                  @keydown="onKeydown($event, 'languages')"
                  @blur="addLanguage"
                />
              </div>
              <p v-if="errors.languages" class="text-red-500 text-[0.73rem] mt-1">{{ errors.languages }}</p>
            </div>

            <div>
              <label class="block text-[0.78rem] font-semibold text-[#555] mb-1.5">Modalidades</label>
              <div class="flex flex-wrap gap-1.5 p-3 border rounded-xl focus-within:border-[#079272] focus-within:ring-2 focus-within:ring-[#079272]/15 transition-all bg-white min-h-[44px]"
                   :class="errors.modalities ? 'border-red-300 bg-red-50' : 'border-[#e8e4dc]'">
                <span v-for="tag in form.modalities" :key="tag"
                  class="inline-flex items-center gap-1 text-[0.72rem] font-semibold px-2.5 py-1 rounded-lg bg-[#079272]/10 text-[#079272]">
                  {{ tag }}
                  <button type="button" class="border-none bg-transparent cursor-pointer p-0 leading-none text-[#079272] hover:text-red-500" @click="removeFromList('modalities', tag)">×</button>
                </span>
                <input
                  v-model="modalityInput"
                  type="text"
                  placeholder="Adicionar modalidade…"
                  class="flex-1 min-w-[120px] border-none outline-none text-[0.82rem] bg-transparent"
                  @keydown="onKeydown($event, 'modalities')"
                  @blur="addModality"
                />
              </div>
              <p v-if="errors.modalities" class="text-red-500 text-[0.73rem] mt-1">{{ errors.modalities }}</p>
            </div>
          </div>

          <div>
            <label class="block text-[0.78rem] font-semibold text-[#555] mb-1.5">Como se inscrever</label>
            <textarea
              v-model="form.how_to_register"
              rows="3"
              placeholder="Explique o processo de inscrição…"
              class="w-full px-4 py-2.5 rounded-xl border text-[0.85rem] outline-none resize-none transition-all"
              :class="errors.how_to_register ? 'border-red-300 bg-red-50' : 'border-[#e8e4dc] focus:border-[#079272] focus:ring-2 focus:ring-[#079272]/15'"
            ></textarea>
            <p v-if="errors.how_to_register" class="text-red-500 text-[0.73rem] mt-1">{{ errors.how_to_register }}</p>
          </div>

          <div>
            <label class="block text-[0.78rem] font-semibold text-[#555] mb-1.5">Prêmios</label>
            <textarea
              v-model="form.prizes"
              rows="3"
              placeholder="Medalhas, bolsas, certificados, etc."
              class="w-full px-4 py-2.5 rounded-xl border text-[0.85rem] outline-none resize-none transition-all"
              :class="errors.prizes ? 'border-red-300 bg-red-50' : 'border-[#e8e4dc] focus:border-[#079272] focus:ring-2 focus:ring-[#079272]/15'"
            ></textarea>
            <p v-if="errors.prizes" class="text-red-500 text-[0.73rem] mt-1">{{ errors.prizes }}</p>
          </div>

          <div>
            <label class="block text-[0.78rem] font-semibold text-[#555] mb-1.5">Requisitos</label>
            <textarea
              v-model="form.requirements"
              rows="3"
              placeholder="Descreva os requisitos para participar…"
              class="w-full px-4 py-2.5 rounded-xl border text-[0.85rem] outline-none resize-none transition-all"
              :class="errors.requirements ? 'border-red-300 bg-red-50' : 'border-[#e8e4dc] focus:border-[#079272] focus:ring-2 focus:ring-[#079272]/15'"
            ></textarea>
            <p v-if="errors.requirements" class="text-red-500 text-[0.73rem] mt-1">{{ errors.requirements }}</p>
          </div>

          <div>
            <div class="flex items-center justify-between gap-3 mb-2">
              <label class="block text-[0.78rem] font-semibold text-[#555]">Recursos</label>
              <button
                type="button"
                class="text-[0.75rem] font-semibold text-[#079272] hover:text-[#0DA790] transition-colors border-none bg-transparent cursor-pointer"
                @click="addResource"
              >+ adicionar recurso</button>
            </div>

            <div class="space-y-3">
              <div
                v-for="(resource, index) in form.resources"
                :key="index"
                class="grid grid-cols-1 md:grid-cols-[1fr_1.3fr_auto] gap-3 p-3 rounded-xl border border-[#e8e4dc] bg-white"
              >
                <input
                  v-model="resource.name"
                  type="text"
                  placeholder="Nome do recurso"
                  class="w-full px-4 py-2.5 rounded-xl border border-[#e8e4dc] text-[0.85rem] outline-none focus:border-[#079272] focus:ring-2 focus:ring-[#079272]/15 transition-all"
                />
                <input
                  v-model="resource.url"
                  type="url"
                  placeholder="https://…"
                  class="w-full px-4 py-2.5 rounded-xl border border-[#e8e4dc] text-[0.85rem] outline-none focus:border-[#079272] focus:ring-2 focus:ring-[#079272]/15 transition-all"
                />
                <button
                  type="button"
                  class="px-4 py-2.5 rounded-xl border border-[#e8e4dc] text-[0.8rem] font-semibold text-[#666] hover:text-red-500 hover:border-red-200 transition-colors"
                  @click="removeResource(index)"
                >
                  Remover
                </button>
              </div>
            </div>
            <p v-if="errors.resources" class="text-red-500 text-[0.73rem] mt-1">{{ errors.resources }}</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.slide-fade-enter-active { transition: all 0.2s ease; }
.slide-fade-leave-active { transition: all 0.12s ease; }
.slide-fade-enter-from { opacity: 0; transform: translateY(6px); }
.slide-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>  