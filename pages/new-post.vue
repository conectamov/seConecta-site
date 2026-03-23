<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Novo Post — seConecta' })

const router = useRouter()
const { post: apiPost } = useAxios()

const form = ref({ title: '', content_md: '', excerpt: '', cover_url: '', tags: [] as string[] })
const tagInput = ref('')
const submitting = ref(false)
const error = ref<string | null>(null)
const success = ref(false)
const activeTab = ref<'write' | 'preview'>('write')
const errors = ref<Record<string, string>>({})
const activeGuide = ref<number | null>(null)

function slugify(text: string) {
  return text.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function addTag() {
  const t = slugify(tagInput.value)
  if (t && !form.value.tags.includes(t) && form.value.tags.length < 5) form.value.tags.push(t)
  tagInput.value = ''
}

function removeTag(tag: string) { form.value.tags = form.value.tags.filter(t => t !== tag) }

function onTagKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
  if (e.key === 'Backspace' && !tagInput.value && form.value.tags.length) form.value.tags.pop()
}

function validate() {
  errors.value = {}
  if (!form.value.title.trim()) errors.value.title = 'O título é obrigatório.'
  else if (form.value.title.length > 256) errors.value.title = 'Máximo 256 caracteres.'
  if (!form.value.content_md.trim()) errors.value.content_md = 'O conteúdo é obrigatório.'
  if (form.value.cover_url && !/^https?:\/\/.+/.test(form.value.cover_url)) errors.value.cover_url = 'URL inválida.'
  return !Object.keys(errors.value).length
}

watch(() => form.value.title, () => delete errors.value.title)
watch(() => form.value.content_md, () => delete errors.value.content_md)
watch(() => form.value.cover_url, () => delete errors.value.cover_url)

const wordCount = computed(() => form.value.content_md.trim().split(/\s+/).filter(Boolean).length)
const readTime = computed(() => Math.max(1, Math.ceil(wordCount.value / 200)))

const markdownPreview = ref('')

watch(() => form.value.content_md, async (md) => {
  if (!import.meta.client || !md) { markdownPreview.value = ''; return }
  try {
    const { marked } = await import('marked')
    markdownPreview.value = String(await marked.parse(md))
  } catch { markdownPreview.value = md }
}, { immediate: true })

async function handleSubmit() {
  if (!validate()) return
  submitting.value = true; error.value = null
  const payload: Record<string, any> = { title: form.value.title.trim(), content_md: form.value.content_md.trim() }
  if (form.value.excerpt.trim()) payload.excerpt = form.value.excerpt.trim()
  if (form.value.cover_url.trim()) payload.cover_url = form.value.cover_url.trim()
  if (form.value.tags.length) payload.tags = form.value.tags
  try {
    await apiPost('/api/v1/posts/', payload)
    success.value = true
    setTimeout(() => router.push('/feed'), 2500)
  } catch (err: any) {
    const status = err?.response?.status
    if (status === 401 || status === 403) error.value = 'Sem permissão para publicar.'
    else if (status === 422) error.value = 'Dados inválidos. Verifique os campos.'
    else error.value = 'Erro ao publicar. Tente novamente.'
  } finally { submitting.value = false }
}

const topics = [
  { title: 'Títulos', content: ['# Título principal', '## Subtítulo', '### Seção menor'] },
  { title: 'Negrito', content: ['**Texto em negrito**'] },
  { title: 'Itálico', content: ['*Texto em itálico*'] },
  { title: 'Lista simples', content: ['- Item 1', '- Item 2'] },
  { title: 'Lista numerada', content: ['1. Primeiro', '2. Segundo'] },
  { title: 'Links', content: ['[Texto](https://url.com)'] },
  { title: 'Código inline', content: ['`console.log("olá")`'] },
  { title: 'Bloco de código', content: ['```javascript', 'console.log("olá")', '```'] },
  { title: 'Citações', content: ['> Esta é uma citação'] },
  { title: 'Linha horizontal', content: ['---'] },
]
</script>

<template>
  <div class="min-h-screen flex gap-5 px-4 md:px-8 py-6 max-w-[1400px] mx-auto relative z-10">

    <!-- Guia Markdown (sidebar) -->
    <aside class="hidden xl:flex flex-col w-52 flex-shrink-0">
      <div class="bg-white rounded-2xl border border-[#e8e4dc] p-5 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
        <h2 class="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#aaa] mb-4">Guia Markdown</h2>
        <div v-for="(topic, i) in topics" :key="i" class="border-b border-[#f7f5f0] last:border-0 pb-2 mb-2">
          <button class="w-full text-left text-[0.78rem] font-semibold text-[#555] hover:text-[#079272] transition-colors cursor-pointer border-none bg-transparent py-1"
            @click="activeGuide = activeGuide === i ? null : i">
            {{ topic.title }}
          </button>
          <Transition name="slide-fade">
            <div v-if="activeGuide === i" class="mt-1 space-y-1">
              <code v-for="c in topic.content" :key="c" class="block text-[0.68rem] bg-[#f8fafc] text-[#079272] px-2 py-1 rounded font-mono">{{ c }}</code>
            </div>
          </Transition>
        </div>
      </div>
    </aside>

    <!-- Editor principal -->
    <main class="flex-1 min-w-0">
      <!-- Sucesso -->
      <Transition name="slide-fade">
        <div v-if="success" class="mb-6 p-5 rounded-2xl bg-[#f0faf7] border border-[#079272]/20 flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-[#079272] flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <p class="font-bold text-[#079272] text-[0.88rem]">Post enviado com sucesso!</p>
            <p class="text-[0.8rem] text-[#0DA790] mt-0.5">Seu post está em análise e será publicado em breve. Redirecionando…</p>
          </div>
        </div>
      </Transition>

      <!-- Erro -->
      <div v-if="error" class="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[0.83rem] flex items-center gap-2">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ error }}
      </div>

      <!-- Card principal -->
      <div class="bg-white rounded-2xl border border-[#e8e4dc] shadow-sm overflow-hidden">
        <!-- Header -->
        <div class="px-6 pt-6 pb-4 border-b border-[#f7f5f0] flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 class="text-[1.1rem] font-extrabold text-[#111] tracking-[-0.02em]">Novo post</h1>
            <p class="text-[0.75rem] text-[#aaa] mt-0.5">Compartilhe oportunidades e histórias com a comunidade</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-[0.72rem] text-[#bbb]">{{ wordCount }} palavras · ~{{ readTime }}min leitura</span>
            <button
              class="px-5 py-2.5 rounded-xl text-[0.85rem] font-bold text-white bg-gradient-to-r from-[#079272] to-[#0DA790] hover:shadow-[0_4px_16px_rgba(7,146,114,0.3)] hover:-translate-y-0.5 transition-all border-none cursor-pointer disabled:opacity-50"
              :disabled="submitting || success" @click="handleSubmit">
              {{ submitting ? 'Publicando…' : 'Publicar' }}
            </button>
          </div>
        </div>

        <div class="p-6 space-y-5">
          <!-- Título -->
          <div>
            <input v-model="form.title" type="text" placeholder="Título do post…"
              class="w-full text-[1.4rem] font-extrabold text-[#111] placeholder-[#ccc] border-none outline-none bg-transparent tracking-[-0.02em]" />
            <p v-if="errors.title" class="text-red-500 text-[0.73rem] mt-1">{{ errors.title }}</p>
          </div>

          <!-- Capa URL -->
          <div>
            <label class="block text-[0.78rem] font-semibold text-[#555] mb-1.5">URL da imagem de capa <span class="text-[#bbb] font-normal">(opcional)</span></label>
            <input v-model="form.cover_url" type="url" placeholder="https://…"
              class="w-full px-4 py-2.5 rounded-xl border text-[0.85rem] outline-none transition-all"
              :class="errors.cover_url ? 'border-red-300 bg-red-50' : 'border-[#e8e4dc] focus:border-[#079272] focus:ring-2 focus:ring-[#079272]/15'" />
            <p v-if="errors.cover_url" class="text-red-500 text-[0.73rem] mt-1">{{ errors.cover_url }}</p>
          </div>

          <!-- Editor / Preview tabs -->
          <div class="border border-[#e8e4dc] rounded-xl overflow-hidden">
            <div class="flex border-b border-[#e8e4dc] bg-[#f8fafc]">
              <button
                class="px-4 py-2.5 text-[0.8rem] font-semibold transition-colors border-none cursor-pointer"
                :class="activeTab === 'write' ? 'text-[#079272] bg-white border-b-2 border-[#079272]' : 'text-[#94a3b8] bg-transparent hover:text-[#555]'"
                @click="activeTab = 'write'">Escrever</button>
              <button
                class="px-4 py-2.5 text-[0.8rem] font-semibold transition-colors border-none cursor-pointer"
                :class="activeTab === 'preview' ? 'text-[#079272] bg-white border-b-2 border-[#079272]' : 'text-[#94a3b8] bg-transparent hover:text-[#555]'"
                @click="activeTab = 'preview'">Prévia</button>
            </div>
            <Transition name="slide-fade" mode="out-in">
              <textarea v-if="activeTab === 'write'" v-model="form.content_md"
                placeholder="Escreva o conteúdo em Markdown…"
                class="w-full min-h-[320px] p-5 text-[0.88rem] font-mono text-[#374151] border-none outline-none resize-none bg-white leading-relaxed"
                :class="errors.content_md ? 'bg-red-50' : ''"></textarea>
              <div v-else class="min-h-[320px] p-5 prose prose-sm max-w-none text-[#374151]" v-html="markdownPreview"></div>
            </Transition>
          </div>
          <p v-if="errors.content_md" class="text-red-500 text-[0.73rem]">{{ errors.content_md }}</p>

          <!-- Resumo -->
          <div>
            <label class="block text-[0.78rem] font-semibold text-[#555] mb-1.5">Resumo <span class="text-[#bbb] font-normal">(opcional — gerado automaticamente se vazio)</span></label>
            <textarea v-model="form.excerpt" placeholder="Breve descrição do post…" rows="2"
              class="w-full px-4 py-2.5 rounded-xl border border-[#e8e4dc] text-[0.85rem] outline-none focus:border-[#079272] focus:ring-2 focus:ring-[#079272]/15 resize-none transition-all"></textarea>
          </div>

          <!-- Tags -->
          <div>
            <label class="block text-[0.78rem] font-semibold text-[#555] mb-1.5">Tags <span class="text-[#bbb] font-normal">(máx. 5)</span></label>
            <div class="flex flex-wrap gap-1.5 p-3 border border-[#e8e4dc] rounded-xl focus-within:border-[#079272] focus-within:ring-2 focus-within:ring-[#079272]/15 transition-all bg-white min-h-[44px]">
              <span v-for="tag in form.tags" :key="tag"
                class="inline-flex items-center gap-1 text-[0.72rem] font-semibold px-2.5 py-1 rounded-lg bg-[#079272]/10 text-[#079272]">
                #{{ tag }}
                <button type="button" class="border-none bg-transparent cursor-pointer p-0 leading-none text-[#079272] hover:text-red-500" @click="removeTag(tag)">×</button>
              </span>
              <input v-model="tagInput" type="text" placeholder="Adicionar tag…"
                class="flex-1 min-w-[100px] border-none outline-none text-[0.82rem] bg-transparent"
                @keydown="onTagKeydown" @blur="addTag" />
            </div>
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
