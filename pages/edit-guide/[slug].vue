<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const { get, patch: apiPatch, delete: apiDelete } = useAxios()
const { currentUser } = useAuth()

const guide = ref<any | null>(null)
const guides = ref<Array<{ id: number; title: string }>>([])
const loadingGuide = ref(true)
const loadingGuides = ref(false)
const submitting = ref(false)
const error = ref<string | null>(null)
const success = ref(false)
const activeTab = ref<'write' | 'preview'>('write')
const activeGuide = ref<number | null>(null)
const tagInput = ref('')
const errors = ref<Record<string, string>>({})
const markdownPreview = ref('')

const form = ref({
  title: '',
  description_md: '',
  excerpt: '',
  cover_url: '',
  slug: '',
  parent_guide_id: null as number | null,
  tags: [] as string[],
})

// Lógica de Permissões
const isOwner = computed(() => {
  if (!currentUser.value || !guide.value) return false
  return String(currentUser.value.id) === String(guide.value.author_id)
})
const isManager = computed(() => !!currentUser.value?.is_manager || !!currentUser.value?.is_superuser)
const canEdit = computed(() => isOwner.value || isManager.value)

const wordCount = computed(() => form.value.description_md.trim().split(/\s+/).filter(Boolean).length)
const readTime = computed(() => Math.max(1, Math.ceil(wordCount.value / 180)))

const topics = [
  { title: 'Títulos', content: ['# Título principal', '## Subtítulo', '### Seção menor'] },
  { title: 'Negrito', content: ['**Texto em negrito**'] },
  { title: 'Itálico', content: ['*Texto em itálico*'] },
  { title: 'Lista simples', content: ['- Item 1', '- Item 2'] },
  { title: 'Links', content: ['[Texto](https://url.com)'] },
  { title: 'Código', content: ['`code`', '```javascript\n...\n```'] },
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

function addTag() {
  const t = slugify(tagInput.value)
  if (t && !form.value.tags.includes(t) && form.value.tags.length < 8) form.value.tags.push(t)
  tagInput.value = ''
}

function removeTag(tag: string) {
  form.value.tags = form.value.tags.filter(t => t !== tag)
}

function onTagKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addTag()
  }
  if (e.key === 'Backspace' && !tagInput.value && form.value.tags.length) form.value.tags.pop()
}

function validate() {
  errors.value = {}
  if (!form.value.title.trim()) errors.value.title = 'O título é obrigatório.'
  if (!form.value.description_md.trim()) errors.value.description_md = 'A descrição é obrigatória.'
  return !Object.keys(errors.value).length
}

// Markdown Preview logic
watch(() => form.value.description_md, async (md) => {
  if (!import.meta.client || !md) {
    markdownPreview.value = ''
    return
  }
  try {
    const { marked } = await import('marked')
    markdownPreview.value = String(await marked.parse(md))
  } catch {
    markdownPreview.value = md
  }
}, { immediate: true })

function applyGuideToForm(raw: any) {
  form.value.title = raw?.title ?? ''
  form.value.description_md = raw?.description_md ?? ''
  form.value.excerpt = raw?.excerpt ?? ''
  form.value.cover_url = raw?.cover_url ?? ''
  form.value.slug = raw?.slug ?? ''
  form.value.parent_guide_id = raw?.parent_guide_id ?? null
  form.value.tags = Array.isArray(raw?.tags) ? raw.tags : []
}

async function loadGuides() {
  loadingGuides.value = true
  try {
    const res = await get('/guides/?skip=0&limit=200')
    const data = res?.data?.data ?? res?.data ?? []
    guides.value = Array.isArray(data) 
      ? data.filter((g: any) => g.id !== guide.value?.id).map((g: any) => ({ id: g.id, title: g.title }))
      : []
  } catch {
    guides.value = []
  } finally {
    loadingGuides.value = false
  }
}

async function fetchGuide() {
  loadingGuide.value = true
  error.value = null
  try {
    const slug = String(route.params.slug ?? '')
    const res = await get(`/guides/${slug}`)
    const raw = res?.data?.data ?? res?.data ?? null
    if (!raw) throw new Error('Not found')
    guide.value = raw
    applyGuideToForm(raw)
    await loadGuides()
  } catch (e: any) {
    error.value = 'Erro ao carregar o guia.'
  } finally {
    loadingGuide.value = false
  }
}

async function handleSubmit() {
  if (!validate() || !guide.value?.id) return
  submitting.value = true
  error.value = null

  const payload = { ...form.value, title: form.value.title.trim(), description_md: form.value.description_md.trim() }

  try {
    await apiPatch(`/guides/${guide.value.id}`, payload)
    success.value = true
    setTimeout(() => router.push(`/guias/${payload.slug || guide.value.slug}`), 2000)
  } catch (err: any) {
    error.value = 'Erro ao salvar o guia.'
  } finally {
    submitting.value = false
  }
}

async function handleDelete() {
  if (!guide.value?.id || !isManager.value) return

  submitting.value = true
  error.value = null

  try {
    // Usando o ID conforme o endpoint /api/v1/guides/{guide_id}
    await apiDelete(`/guides/${guide.value.id}`)
    router.push('/guias')
  } catch (err: any) {
    error.value = 'Erro ao deletar o guia. Verifique suas permissões.'
  } finally {
    submitting.value = false
  }
}

onMounted(() => fetchGuide())

useSeoMeta({
  title: computed(() => (guide.value ? `Editar ${guide.value.title} — seConecta` : 'Editar Guia — seConecta')),
})
</script>

<template>
  <div class="min-h-screen flex gap-5 px-4 md:px-8 py-6 max-w-[1400px] mx-auto relative z-10">
    <aside class="hidden xl:flex flex-col w-56 flex-shrink-0">
      <div class="bg-white rounded-2xl border border-[#e8e4dc] p-5 sticky top-20">
        <h2 class="text-[0.7rem] font-bold uppercase tracking-widest text-[#aaa] mb-4">Markdown</h2>
        <div v-for="(topic, i) in topics" :key="i" class="mb-2">
          <button @click="activeGuide = activeGuide === i ? null : i" class="w-full text-left text-[0.78rem] font-semibold text-[#555] py-1 bg-transparent border-none cursor-pointer">
            {{ topic.title }}
          </button>
          <div v-if="activeGuide === i" class="mt-1 space-y-1">
            <code v-for="c in topic.content" :key="c" class="block text-[0.65rem] bg-gray-50 text-[#079272] p-1 rounded">{{ c }}</code>
          </div>
        </div>
      </div>
    </aside>

    <main class="flex-1 min-w-0">
      <div v-if="loadingGuide" class="bg-white p-6 rounded-2xl border border-[#e8e4dc] animate-pulse space-y-4">
        <div class="h-8 bg-gray-100 rounded w-1/3"></div>
        <div class="h-64 bg-gray-100 rounded"></div>
      </div>

      <div v-if="error" class="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
        {{ error }}
      </div>

      <div v-if="!loadingGuide && guide" class="bg-white rounded-2xl border border-[#e8e4dc] shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-[#f7f5f0] flex justify-between items-center bg-white sticky top-0 z-20">
          <div>
            <h1 class="text-lg font-bold text-[#111]">Editar guia</h1>
            <p class="text-xs text-[#aaa]">{{ wordCount }} palavras · ~{{ readTime }}min</p>
          </div>
          <button 
            @click="handleSubmit" 
            :disabled="submitting"
            class="px-6 py-2 bg-gradient-to-r from-[#079272] to-[#0DA790] text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all border-none cursor-pointer"
          >
            {{ submitting ? 'Salvando...' : 'Salvar alterações' }}
          </button>
        </div>

        <div class="p-6 space-y-6">
          <input v-model="form.title" type="text" placeholder="Título do guia" class="w-full text-2xl font-black border-none outline-none placeholder-gray-300" />
          
          <div>
            <label class="block text-[0.75rem] font-bold text-gray-400 uppercase mb-1">URL da Capa</label>
            <input v-model="form.cover_url" type="text" class="w-full p-3 bg-gray-50 border border-[#e8e4dc] rounded-xl text-sm focus:border-[#079272] outline-none transition-all" />
          </div>

          <div class="border border-[#e8e4dc] rounded-xl overflow-hidden">
            <div class="flex bg-gray-50 border-b border-[#e8e4dc]">
              <button @click="activeTab = 'write'" :class="activeTab === 'write' ? 'bg-white text-[#079272] border-b-2 border-[#079272]' : 'text-gray-400'" class="px-4 py-2 text-xs font-bold border-none cursor-pointer">Escrever</button>
              <button @click="activeTab = 'preview'" :class="activeTab === 'preview' ? 'bg-white text-[#079272] border-b-2 border-[#079272]' : 'text-gray-400'" class="px-4 py-2 text-xs font-bold border-none cursor-pointer">Visualizar</button>
            </div>
            <textarea v-if="activeTab === 'write'" v-model="form.description_md" rows="15" class="w-full p-4 border-none outline-none font-mono text-sm resize-y" placeholder="Conteúdo em Markdown..."></textarea>
            <div v-else class="p-4 prose prose-sm max-w-none min-h-[300px]" v-html="markdownPreview"></div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-[0.75rem] font-bold text-gray-400 uppercase mb-1">Slug (URL)</label>
              <input v-model="form.slug" type="text" class="w-full p-3 bg-gray-50 border border-[#e8e4dc] rounded-xl text-sm outline-none" />
            </div>
            <div>
              <label class="block text-[0.75rem] font-bold text-gray-400 uppercase mb-1">Guia Pai</label>
              <select v-model="form.parent_guide_id" class="w-full p-3 bg-gray-50 border border-[#e8e4dc] rounded-xl text-sm outline-none">
                <option :value="null">Nenhum (Guia Principal)</option>
                <option v-for="g in guides" :key="g.id" :value="g.id">{{ g.title }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-[0.75rem] font-bold text-gray-400 uppercase mb-1">Tags (máx 8)</label>
            <div class="flex flex-wrap gap-2 p-3 border border-[#e8e4dc] rounded-xl min-h-[50px]">
              <span v-for="tag in form.tags" :key="tag" class="bg-[#079272]/10 text-[#079272] px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                #{{ tag }}
                <button @click="removeTag(tag)" class="hover:text-red-500 border-none bg-transparent cursor-pointer">×</button>
              </span>
              <input v-model="tagInput" @keydown="onTagKeydown" placeholder="Adicionar tag..." class="flex-1 outline-none border-none text-sm bg-transparent" />
            </div>
          </div>

          <div class="pt-6 border-t border-[#f7f5f0] flex justify-between items-center">
            <span class="text-[0.7rem] text-gray-400">ID do Guia: {{ guide.id }}</span>
            <button 
              v-if="isManager" 
              @click="handleDelete" 
              type="button"
              class="px-4 py-2 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors bg-white cursor-pointer"
            >
              Deletar guia definitivamente
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.prose :deep(h1) { font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem; }
.prose :deep(p) { margin-bottom: 1rem; line-height: 1.6; }
</style>