<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const { get, patch: apiPatch, delete: apiDelete } = useAxios()
const { currentUser } = useAuth()

// Estados do Guia
const guide = ref<any | null>(null)
const guides = ref<Array<{ id: number; title: string }>>([])
const loadingGuide = ref(true)
const loadingGuides = ref(false)
const submitting = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

// UI States
const activeTab = ref<'write' | 'preview'>('write')
const activeGuideHelp = ref<number | null>(null)
const tagInput = ref('')
const markdownPreview = ref('')
const showDeleteModal = ref(false) // Controle do Modal

const form = ref({
  title: '',
  description_md: '',
  excerpt: '',
  cover_url: '',
  slug: '',
  parent_guide_id: null as number | null,
  tags: [] as string[],
})

// Permissões
const isOwner = computed(() => {
  if (!currentUser.value || !guide.value) return false
  return String(currentUser.value.id) === String(guide.value.author_id)
})
console.log(currentUser)
const isManager = computed(() => !!currentUser.value?.is_manager || !!currentUser.value?.is_superuser)
const canEdit = computed(() => isOwner.value || isManager.value)

// Métricas
const wordCount = computed(() => form.value.description_md.trim().split(/\s+/).filter(Boolean).length)
const readTime = computed(() => Math.max(1, Math.ceil(wordCount.value / 180)))

const topics = [
  { title: 'Títulos', content: ['# Título', '## Subtítulo'] },
  { title: 'Formatos', content: ['**Negrito**', '*Itálico*'] },
  { title: 'Listas', content: ['- Item', '1. Item'] },
  { title: 'Mídia', content: ['[Link](url)', '![Alt](img_url)'] },
]

function slugify(text: string) {
  return text.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
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
  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
  if (e.key === 'Backspace' && !tagInput.value && form.value.tags.length) form.value.tags.pop()
}

// Preview Markdown
watch(() => form.value.description_md, async (md) => {
  if (!import.meta.client || !md) { markdownPreview.value = ''; return }
  try {
    const { marked } = await import('marked')
    markdownPreview.value = String(await marked.parse(md))
  } catch { markdownPreview.value = md }
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
    guides.value = Array.isArray(data) ? data.filter((g: any) => g.id !== guide.value?.id) : []
  } finally { loadingGuides.value = false }
}

async function fetchGuide() {
  loadingGuide.value = true
  try {
    const slug = String(route.params.slug)
    const res = await get(`/guides/${slug}`)
    const raw = res?.data?.data ?? res?.data
    if (!raw) throw new Error()
    guide.value = raw
    applyGuideToForm(raw)
    await loadGuides()
  } catch { error.value = 'Não foi possível carregar o guia.' }
  finally { loadingGuide.value = false }
}

async function handleSubmit() {
  if (!form.value.title || !guide.value?.id) return
  submitting.value = true
  try {
    const payload = { ...form.value, title: form.value.title.trim() }
    await apiPatch(`/guides/${guide.value.id}`, payload)
    success.value = true
    setTimeout(() => router.push(`/guias/${payload.slug || guide.value.slug}`), 2000)
  } catch { error.value = 'Erro ao salvar alterações.' }
  finally { submitting.value = false }
}

// Função de Deletar Final
async function confirmDelete() {
  if (!guide.value?.id || !isManager.value) return
  submitting.value = true
  showDeleteModal.value = false

  try {
    // Rota baseada no Swagger: /api/v1/guides/{guide_id}
    await apiDelete(`/guides/${guide.value.id}`)
    router.push('/guias')
  } catch (err) {
    error.value = 'Falha ao deletar. Verifique se você tem permissões de Manager.'
    submitting.value = false
  }
}

onMounted(() => fetchGuide())
</script>

<template>
  <div class="min-h-screen bg-[#fdfcf9] flex gap-6 px-4 md:px-8 py-8 max-w-[1400px] mx-auto relative z-10">
    
    <aside class="hidden xl:block w-60 flex-shrink-0">
      <div class="bg-white rounded-2xl border border-[#e8e4dc] p-5 sticky top-24">
        <h3 class="text-[0.65rem] font-black uppercase tracking-widest text-[#bbb] mb-4">Markdown Help</h3>
        <div v-for="(topic, i) in topics" :key="i" class="mb-3">
          <button @click="activeGuideHelp = activeGuideHelp === i ? null : i" class="w-full text-left text-[0.8rem] font-bold text-[#555] flex justify-between bg-transparent border-none cursor-pointer">
            {{ topic.title }}
            <span>{{ activeGuideHelp === i ? '−' : '+' }}</span>
          </button>
          <div v-if="activeGuideHelp === i" class="mt-2 space-y-1">
            <code v-for="c in topic.content" :key="c" class="block text-[0.7rem] bg-[#f8fafc] text-[#079272] p-1.5 rounded border border-[#079272]/10">{{ c }}</code>
          </div>
        </div>
      </div>
    </aside>

    <main class="flex-1 min-w-0">
      <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center gap-3">
        <span class="font-bold">⚠️</span> {{ error }}
      </div>

      <div v-if="!loadingGuide && guide" class="bg-white rounded-3xl border border-[#e8e4dc] shadow-sm overflow-hidden">
        <div class="px-8 py-5 border-b border-[#f7f5f0] flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div>
            <h1 class="text-xl font-black text-[#111] tracking-tight">Editar Guia</h1>
            <p class="text-[0.7rem] text-[#aaa] font-medium">{{ wordCount }} palavras • {{ readTime }} min leitura</p>
          </div>
          <div class="flex items-center gap-3">
            <button @click="router.back()" class="px-4 py-2 text-sm font-bold text-[#888] hover:text-[#555] bg-transparent border-none cursor-pointer">Cancelar</button>
            <button @click="handleSubmit" :disabled="submitting" class="px-6 py-2.5 bg-black text-white rounded-xl font-bold text-sm hover:bg-[#222] disabled:opacity-50 transition-all cursor-pointer">
              {{ submitting ? 'Salvando...' : 'Publicar Alterações' }}
            </button>
          </div>
        </div>

        <div class="p-8 space-y-8">
          <input v-model="form.title" type="text" placeholder="Título impactante..." class="w-full text-3xl md:text-4xl font-black border-none outline-none placeholder-[#eee] text-[#111]" />

          <div class="space-y-2">
            <label class="text-[0.7rem] font-black uppercase text-[#bbb] tracking-widest">URL da Imagem de Capa</label>
            <input v-model="form.cover_url" type="text" class="w-full p-4 bg-[#f9f8f6] border border-[#e8e4dc] rounded-2xl text-sm focus:border-[#079272] focus:ring-4 focus:ring-[#079272]/5 outline-none transition-all" placeholder="https://..." />
          </div>

          <div class="border border-[#e8e4dc] rounded-2xl overflow-hidden bg-white">
            <div class="flex bg-[#f9f8f6] border-b border-[#e8e4dc] p-1">
              <button @click="activeTab = 'write'" :class="activeTab === 'write' ? 'bg-white shadow-sm text-[#111]' : 'text-[#888]'" class="px-6 py-2 text-xs font-black rounded-lg border-none cursor-pointer transition-all">ESCREVER</button>
              <button @click="activeTab = 'preview'" :class="activeTab === 'preview' ? 'bg-white shadow-sm text-[#111]' : 'text-[#888]'" class="px-6 py-2 text-xs font-black rounded-lg border-none cursor-pointer transition-all">PREVIEW</button>
            </div>
            <textarea v-if="activeTab === 'write'" v-model="form.description_md" rows="18" class="w-full p-6 border-none outline-none font-mono text-[0.9rem] leading-relaxed resize-y" placeholder="Comece a escrever sua jornada..."></textarea>
            <div v-else class="p-8 prose prose-slate max-w-none min-h-[400px]" v-html="markdownPreview"></div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-[0.7rem] font-black uppercase text-[#bbb] tracking-widest">Slug (URL amigável)</label>
              <input v-model="form.slug" type="text" class="w-full p-4 bg-[#f9f8f6] border border-[#e8e4dc] rounded-2xl text-sm outline-none" />
            </div>
            <div class="space-y-2">
              <label class="text-[0.7rem] font-black uppercase text-[#bbb] tracking-widest">Vincular a Guia Pai</label>
              <select v-model="form.parent_guide_id" class="w-full p-4 bg-[#f9f8f6] border border-[#e8e4dc] rounded-2xl text-sm outline-none appearance-none">
                <option :value="null">Nenhum (Guia Raiz)</option>
                <option v-for="g in guides" :key="g.id" :value="g.id">{{ g.title }}</option>
              </select>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-[0.7rem] font-black uppercase text-[#bbb] tracking-widest">Tags (Máximo 8)</label>
            <div class="flex flex-wrap gap-2 p-4 bg-[#f9f8f6] border border-[#e8e4dc] rounded-2xl">
              <span v-for="tag in form.tags" :key="tag" class="bg-white border border-[#e8e4dc] text-[#111] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm">
                #{{ tag }}
                <button @click="removeTag(tag)" class="text-red-400 hover:text-red-600 border-none bg-transparent cursor-pointer font-bold">×</button>
              </span>
              <input v-model="tagInput" @keydown="onTagKeydown" placeholder="nova-tag..." class="flex-1 outline-none border-none text-sm bg-transparent min-w-[120px]" />
            </div>
          </div>

          <div v-if="isManager" class="pt-10 border-t border-[#f7f5f0] flex flex-col md:flex-row justify-between items-center gap-4">
            <div class="text-center md:text-left">
              <p class="text-sm font-black text-red-600">Zona de Perigo</p>
              <p class="text-xs text-[#aaa]">A exclusão removerá permanentemente o guia e suas referências.</p>
            </div>
            <button @click="showDeleteModal = true" class="px-6 py-3 border-2 border-red-100 text-red-500 rounded-2xl text-xs font-black hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer">
              DELETAR GUIA DEFINITIVAMENTE
            </button>
          </div>
        </div>
      </div>
    </main>

    <Transition name="fade">
      <div v-if="showDeleteModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showDeleteModal = false"></div>
        
        <div class="relative bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 overflow-hidden">
          <div class="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
            <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          
          <h2 class="text-2xl font-black text-[#111] mb-2">Excluir este guia?</h2>
          <p class="text-[#888] text-sm leading-relaxed mb-8">
            Esta ação é irreversível. O guia <span class="font-bold text-[#444]">"{{ form.title }}"</span> deixará de existir no seConecta imediatamente.
          </p>

          <div class="flex flex-col gap-3">
            <button @click="confirmDelete" :disabled="submitting" class="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-sm hover:bg-red-600 transition-all cursor-pointer shadow-lg shadow-red-500/20">
              {{ submitting ? 'EXCLUINDO...' : 'SIM, EXCLUIR AGORA' }}
            </button>
            <button @click="showDeleteModal = false" class="w-full py-4 bg-transparent text-[#aaa] font-bold text-sm hover:text-[#555] transition-all border-none cursor-pointer">
              NÃO, MANTER GUIA
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
/* Transições do Modal */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.prose :deep(h1) { font-size: 1.8rem; font-weight: 900; color: #111; margin-top: 2rem; }
.prose :deep(h2) { font-size: 1.4rem; font-weight: 800; color: #111; margin-top: 1.5rem; }
.prose :deep(p) { line-height: 1.7; color: #444; margin-bottom: 1.25rem; }
.prose :deep(code) { background: #f1f5f9; padding: 0.2rem 0.4rem; rounded: 0.3rem; font-size: 0.85em; color: #079272; }

/* Custom Scrollbar */
textarea::-webkit-scrollbar { width: 8px; }
textarea::-webkit-scrollbar-track { background: #fdfcf9; }
textarea::-webkit-scrollbar-thumb { background: #e8e4dc; border-radius: 10px; }
</style>