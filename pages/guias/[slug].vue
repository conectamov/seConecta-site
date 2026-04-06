<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAxios } from '@/composables/useAxios'
import { useAuth } from '@/composables/useAuth'
import { useUserCache } from '@/composables/useUserCache'

const route = useRoute()
const router = useRouter()
const { get } = useAxios()
const { currentUser, isAuthenticated } = useAuth()
const { getUser, displayName, displayInitial } = useUserCache()

const guide = ref<any | null>(null)
const guideAuthor = ref<any | null>(null)
const loadingGuide = ref(true)
const errorGuide = ref<string | null>(null)
const contentHtml = ref('')
const activeTab = ref<'guide' | 'children' | 'posts'>('guide')
const mounted = ref(false)

const relatedPosts = computed(() => Array.isArray(guide.value?.posts) ? guide.value.posts : [])
const childGuides = computed(() => Array.isArray(guide.value?.children_guides) ? guide.value.children_guides : [])
const guideTags = computed(() => Array.isArray(guide.value?.tags) ? guide.value.tags : [])

function safeDate(value: any) {
  if (!value || typeof value !== 'string') return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function safeDateTime(value: any) {
  if (!value || typeof value !== 'string') return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ensureGuideShape(raw: any) {
  const children = Array.isArray(raw?.children_guides) ? raw.children_guides : []
  const posts = Array.isArray(raw?.posts) ? raw.posts : []

  return {
    id: raw?.id,
    title: raw?.title ?? '',
    description_md: raw?.description_md ?? '',
    excerpt: raw?.excerpt ?? '',
    cover_url: raw?.cover_url ?? '',
    slug: raw?.slug ?? null,
    approved: !!raw?.approved,
    parent_guide_id: raw?.parent_guide_id ?? null,
    tags: Array.isArray(raw?.tags) ? raw.tags : [],
    author_id: raw?.author_id ?? null,
    created_at: raw?.created_at ?? null,
    updated_at: raw?.updated_at ?? null,
    children_guides: children.map((g: any) => ({
      id: g?.id,
      title: g?.title ?? '',
      excerpt: g?.excerpt ?? '',
      cover_url: g?.cover_url ?? '',
      slug: g?.slug ?? null,
      tags: Array.isArray(g?.tags) ? g.tags : [],
      approved: !!g?.approved,
    })),
    posts: posts.map((p: any) => ({
      id: p?.id,
      title: p?.title ?? '',
      excerpt: p?.excerpt ?? '',
      slug: p?.slug ?? null,
      cover_url: p?.cover_url ?? '',
      tags: Array.isArray(p?.tags) ? p.tags : [],
      approved: !!p?.approved,
      created_at: p?.created_at ?? null,
      author_id: p?.author_id ?? null,
    })),
  }
}

async function fetchGuide() {
  loadingGuide.value = true
  errorGuide.value = null
  guide.value = null
  guideAuthor.value = null

  try {
    const slug = String(route.params.slug ?? '')
    let res: any

    // Ajuste estes endpoints se o backend expuser outra rota.
    try {
      res = await get(`/guides/${slug}`)
    } catch {
      res = await get(`/guides/${slug}`)
    }

    const raw = res?.data?.data ?? res?.data ?? null
    if (!raw) throw new Error('Guide not found')

    guide.value = ensureGuideShape(raw)

    if (guide.value.author_id) {
      try {
        guideAuthor.value = await getUser(guide.value.author_id)
      } catch {
        guideAuthor.value = null
      }
    }
  } catch (e: any) {
    errorGuide.value = e?.response?.status === 404 ? 'Guia não encontrado.' : 'Erro ao carregar o guia.'
  } finally {
    loadingGuide.value = false
  }
}

const formattedCreatedAt = computed(() => safeDateTime(guide.value?.created_at))
const formattedUpdatedAt = computed(() => safeDateTime(guide.value?.updated_at))
const authorProfileUrl = computed(() => guideAuthor.value?.profile_picture_url || null)
const authorName = computed(() => displayName(guideAuthor.value) || 'Autor desconhecido')
const authorInitial = computed(() => displayInitial(guideAuthor.value) || 'A')
const isOwner = computed(() => {
  if (!currentUser.value || !guide.value) return false
  return String(currentUser.value.id) === String(guide.value.author_id)
})
const canEdit = computed(() => isOwner.value || !!currentUser.value?.is_superuser)

function openChildGuide(child: any) {
  if (!child?.slug) return
  router.push(`/guias/${child.slug}`)
}

function openPost(postItem: any) {
  router.push(`/feed/${postItem.slug || postItem.id}`)
}

function goBack() {
  router.push('/guias')
}

const readTime = computed(() => {
  const words = (guide.value?.description_md || '').trim().split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.ceil(words / 180))} min`
})

watch(
  () => route.params.slug,
  () => {
    void fetchGuide()
  }
)

watch(
  () => guide.value?.description_md,
  async (md) => {
    if (!import.meta.client || !md) {
      contentHtml.value = ''
      return
    }

    try {
      const { marked } = await import('marked')
      const { default: DOMPurify } = await import('dompurify')
      contentHtml.value = DOMPurify.sanitize(String(marked.parse(md)))
    } catch {
      contentHtml.value = md || ''
    }
  },
  { immediate: true }
)

watch(
  () => guide.value?.children_guides,
  async () => {
    await nextTick()
  },
  { deep: true }
)

onMounted(async () => {
  mounted.value = true
  await fetchGuide()
})

useSeoMeta({
  title: computed(() => (guide.value ? `${guide.value.title} — seConecta` : 'Guias — seConecta')),
  description: computed(() => guide.value?.excerpt || guide.value?.title || 'Guia do seConecta'),
})
</script>

<template>
  <div class="min-h-screen bg-[#f7f5f0]">
    <div v-if="loadingGuide" class="min-h-screen animate-pulse">
      <div class="bg-[#0c1b32] pt-24 px-8 pb-0">
        <div class="max-w-[1000px] mx-auto space-y-4">
          <div class="h-4 w-24 bg-white/10 rounded"></div>
          <div class="h-10 w-2/3 bg-white/10 rounded-lg"></div>
          <div class="h-4 w-1/2 bg-white/10 rounded"></div>
          <div class="h-16 bg-white/5 rounded-t-xl mt-8"></div>
        </div>
      </div>
      <div class="max-w-[1000px] mx-auto px-8 pt-10 space-y-3">
        <div
          v-for="i in 8"
          :key="i"
          class="h-4 bg-[#e8e4dc] rounded"
          :style="{ width: ['100%','85%','95%','70%','90%','60%','88%','75%'][i-1] }"
        ></div>
      </div>
    </div>

    <div v-else-if="errorGuide" class="min-h-screen flex flex-col items-center justify-center gap-5 px-8 text-center">
      <div class="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p class="text-[#555]">{{ errorGuide }}</p>
      <div class="flex gap-3">
        <button
          class="text-sm font-semibold px-5 py-2 bg-[#0d0d0d] text-white rounded-lg hover:bg-[#079272] transition-colors border-none cursor-pointer"
          @click="fetchGuide"
        >
          Tentar novamente
        </button>
        <button
          class="text-sm font-semibold px-5 py-2 bg-white border border-[#e8e4dc] text-[#555] rounded-lg hover:border-[#0d0d0d] transition-colors cursor-pointer"
          @click="goBack"
        >
          Voltar aos guias
        </button>
      </div>
    </div>

    <template v-else-if="guide">
      <header class="relative overflow-hidden bg-[#0c1b32] pt-20 px-8 pb-0">
        <div class="relative z-10 max-w-[1000px] mx-auto">
          <button
            class="inline-flex items-center gap-1.5 text-[0.75rem] text-white/30 border-none bg-transparent cursor-pointer hover:text-white/80 transition-colors mb-8"
            @click="goBack"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Voltar aos guias
          </button>

          <div class="flex items-center gap-3 mb-4 flex-wrap text-[0.72rem] text-white/30">
            <span class="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {{ readTime }}
            </span>

            <span class="text-white/15">·</span>

            <span v-if="formattedCreatedAt" class="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Criado em {{ formattedCreatedAt }}
            </span>

            <span v-if="guide.approved" class="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full bg-[#079272]/20 text-[#079272]">
              Guia aprovado
            </span>
            <span v-else class="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/20">
              Em revisão
            </span>
          </div>

          <h1 class="text-[clamp(1.8rem,4.5vw,3.2rem)] font-extrabold text-white leading-[1.1] tracking-[-0.03em] mb-5">
            {{ guide.title }}
          </h1>

          <p v-if="guide.excerpt" class="text-base font-light text-white/40 leading-relaxed max-w-[680px] mb-6">
            {{ guide.excerpt }}
          </p>

          <div v-if="guideTags.length" class="flex flex-wrap gap-1.5 mb-8">
            <span
              v-for="tag in guideTags"
              :key="tag"
              class="text-[0.65rem] font-semibold px-2 py-0.5 bg-white/10 text-white/50 rounded-full border border-white/10"
            >
              #{{ tag }}
            </span>
          </div>

          <div class="flex items-center justify-between bg-white/5 border border-white/[0.08] rounded-t-xl p-4 md:p-5 gap-4 flex-wrap">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#079272] to-[#2464E8] flex items-center justify-center text-white text-sm font-bold">
                <img v-if="authorProfileUrl" :src="authorProfileUrl" :alt="authorName" class="w-full h-full object-cover" />
                <span v-else>{{ authorInitial }}</span>
              </div>
              <div>
                <div class="text-[0.88rem] font-semibold text-white">
                  {{ authorName }}
                </div>
                <div v-if="guideAuthor?.username" class="text-[0.72rem] text-white/35">
                  @{{ guideAuthor.username }}
                </div>
              </div>
            </div>

            <div class="flex gap-5 text-[0.78rem] text-white/35">
              <span class="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {{ childGuides.length }} subguias
              </span>
              <span class="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {{ relatedPosts.length }} posts
              </span>
            </div>

            <NuxtLink
              v-if="canEdit"
              :to="`/edit-guide/${guide.slug || guide.id}`"
              class="flex items-center gap-1.5 text-[0.78rem] font-semibold px-3 py-1.5 rounded-lg border border-white/20 text-white/70 hover:bg-white/10 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"/>
                <polygon points="18 2 22 6 12 16 8 16 8 12 18 2"/>
              </svg>
              Editar
            </NuxtLink>
          </div>
        </div>
      </header>

      <div v-if="guide.cover_url" class="max-w-[1000px] mx-auto">
        <img :src="guide.cover_url" :alt="guide.title" class="w-full h-[380px] max-md:h-52 object-cover block"/>
      </div>

      <div class="max-w-[1000px] mx-auto px-6 md:px-8 pb-16 grid grid-cols-1 md:grid-cols-[1fr_180px] gap-12 items-start">
        <article class="pt-12">
          <div class="bg-white rounded-2xl border border-[#e8e4dc] overflow-hidden shadow-sm">
            <div class="flex border-b border-[#e8e4dc] bg-[#f8fafc]">
              <button
                class="px-4 py-2.5 text-[0.8rem] font-semibold transition-colors border-none cursor-pointer"
                :class="activeTab === 'guide' ? 'text-[#079272] bg-white border-b-2 border-[#079272]' : 'text-[#94a3b8] bg-transparent hover:text-[#555]'"
                @click="activeTab = 'guide'"
              >
                Guia
              </button>
              <button
                class="px-4 py-2.5 text-[0.8rem] font-semibold transition-colors border-none cursor-pointer"
                :class="activeTab === 'children' ? 'text-[#079272] bg-white border-b-2 border-[#079272]' : 'text-[#94a3b8] bg-transparent hover:text-[#555]'"
                @click="activeTab = 'children'"
              >
                Subguias ({{ childGuides.length }})
              </button>
              <button
                class="px-4 py-2.5 text-[0.8rem] font-semibold transition-colors border-none cursor-pointer"
                :class="activeTab === 'posts' ? 'text-[#079272] bg-white border-b-2 border-[#079272]' : 'text-[#94a3b8] bg-transparent hover:text-[#555]'"
                @click="activeTab = 'posts'"
              >
                Posts ({{ relatedPosts.length }})
              </button>
            </div>

            <div v-show="activeTab === 'guide'" class="article-body prose max-w-none bg-white p-6 md:p-8">
              <div v-if="contentHtml" v-html="contentHtml"></div>
              <div v-else class="text-sm text-[#666]">
                Este guia ainda não tem descrição detalhada.
              </div>
            </div>

            <div v-show="activeTab === 'children'" class="p-6 md:p-8">
              <div v-if="childGuides.length === 0" class="py-10 text-center text-sm text-[#aaa]">
                Este guia ainda não possui subguias.
              </div>

              <div v-else class="grid gap-4 sm:grid-cols-2">
                <article
                  v-for="child in childGuides"
                  :key="child.id"
                  class="rounded-2xl border border-[#e8e4dc] overflow-hidden bg-white hover:shadow-md hover:border-[#079272]/20 transition-all cursor-pointer group"
                  @click="openChildGuide(child)"
                >
                  <div class="h-36 bg-[#f8fafc] relative overflow-hidden">
                    <img
                      v-if="child.cover_url"
                      :src="child.cover_url"
                      :alt="child.title"
                      class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent"></div>
                  </div>
                  <div class="p-4 space-y-2">
                    <h3 class="font-bold text-[#111] line-clamp-2 group-hover:text-[#079272] transition-colors">
                      {{ child.title }}
                    </h3>
                    <p class="text-xs text-[#666] line-clamp-3">
                      {{ child.excerpt || 'Sem resumo disponível.' }}
                    </p>
                    <div v-if="child.tags?.length" class="flex flex-wrap gap-1.5 pt-1">
                      <span
                        v-for="tag in child.tags.slice(0, 3)"
                        :key="tag"
                        class="text-[0.65rem] font-semibold px-2 py-0.5 bg-[#079272]/10 text-[#079272] rounded-full"
                      >
                        #{{ tag }}
                      </span>
                    </div>
                  </div>
                </article>
              </div>
            </div>

            <div v-show="activeTab === 'posts'" class="p-6 md:p-8">
              <div v-if="relatedPosts.length === 0" class="py-10 text-center text-sm text-[#aaa]">
                Este guia ainda não possui posts ligados.
              </div>

              <div v-else class="grid gap-4">
                <article
                  v-for="post in relatedPosts"
                  :key="post.id"
                  class="rounded-2xl border border-[#e8e4dc] overflow-hidden bg-white hover:shadow-md hover:border-[#079272]/20 transition-all cursor-pointer group"
                  @click="openPost(post)"
                >
                  <div class="grid sm:grid-cols-[180px_1fr]">
                    <div class="h-40 sm:h-full bg-[#f8fafc] relative overflow-hidden">
                      <img
                        v-if="post.cover_url"
                        :src="post.cover_url"
                        :alt="post.title"
                        class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div class="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent"></div>
                    </div>
                    <div class="p-5 flex flex-col gap-3">
                      <h3 class="font-bold text-[#111] text-[1rem] line-clamp-2 group-hover:text-[#079272] transition-colors">
                        {{ post.title }}
                      </h3>
                      <p class="text-sm text-[#666] line-clamp-3">
                        {{ post.excerpt || 'Sem resumo disponível.' }}
                      </p>

                      <div v-if="post.tags?.length" class="flex flex-wrap gap-1.5 mt-auto pt-1">
                        <span
                          v-for="tag in post.tags.slice(0, 4)"
                          :key="tag"
                          class="text-[0.65rem] font-semibold px-2 py-0.5 bg-[#f7f5f0] text-[#666] rounded-full border border-[#e8e4dc]"
                        >
                          #{{ tag }}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </article>

        <aside class="pt-12 sticky top-20 hidden md:flex flex-col gap-4">
          <div class="bg-white border border-[#e8e4dc] rounded-xl p-5 flex flex-col gap-2">
            <div class="text-[0.62rem] font-semibold tracking-[0.12em] uppercase text-[#777] mb-1">Sobre o guia</div>

            <div class="flex justify-between py-2 text-[0.75rem] border-b border-[#f7f5f0]">
              <span class="text-[#777]">Subguias</span>
              <strong class="text-[#111]">{{ childGuides.length }}</strong>
            </div>

            <div class="flex justify-between py-2 text-[0.75rem] border-b border-[#f7f5f0]">
              <span class="text-[#777]">Posts</span>
              <strong class="text-[#111]">{{ relatedPosts.length }}</strong>
            </div>

            <div v-if="formattedUpdatedAt" class="flex justify-between py-2 text-[0.75rem] border-b border-[#f7f5f0]">
              <span class="text-[#777]">Atualizado</span>
              <strong class="text-[#111]">{{ formattedUpdatedAt }}</strong>
            </div>

            <div v-if="guide.parent_guide_id" class="flex justify-between py-2 text-[0.75rem]">
              <span class="text-[#777]">Guia pai</span>
              <strong class="text-[#111]">#{{ guide.parent_guide_id }}</strong>
            </div>
          </div>

          <div v-if="guideTags.length" class="bg-white border border-[#e8e4dc] rounded-xl p-5">
            <div class="text-[0.62rem] font-semibold tracking-[0.12em] uppercase text-[#777] mb-3">Tags</div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in guideTags"
                :key="tag"
                class="text-[0.68rem] font-semibold px-2.5 py-1 bg-[#079272]/10 text-[#079272] rounded-full"
              >
                #{{ tag }}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<style>
.article-body h1 { font-size:1.6rem;font-weight:800;color:#111;margin:2rem 0 1rem;line-height:1.2; }
.article-body h2 { font-size:1.35rem;font-weight:700;color:#111;margin:2rem 0 .85rem;line-height:1.3; }
.article-body h3 { font-size:1.1rem;font-weight:600;color:#111;margin:1.5rem 0 .7rem; }
.article-body p  { font-size:.98rem;font-weight:300;color:#111;line-height:1.9;margin-bottom:1.4rem; }
.article-body strong { font-weight:600;color:#111; }
.article-body em  { font-style:italic; }
.article-body code { background:#f7f5f0;border:1px solid #e8e4dc;padding:.15rem .45rem;border-radius:4px;font-size:.88em;color:#079272;font-family:monospace; }
.article-body pre code { background:none;border:none;padding:0;color:inherit; }
.article-body pre { background:#1e1e2e;border-radius:10px;padding:1.25rem 1.5rem;overflow-x:auto;margin:1.5rem 0; }
.article-body blockquote { border-left:3px solid #079272;padding:1rem 1.5rem;margin:1.5rem 0;background:#e8f5f2;border-radius:0 10px 10px 0;font-size:1rem;font-style:italic;color:#333; }
.article-body ul, .article-body ol { padding-left:1.5rem;margin-bottom:1.4rem;color:#111; }
.article-body li { margin-bottom:.4rem;font-weight:300; }
.article-body a { color:#079272;text-decoration:underline; }
.article-body img { max-width:100%;border-radius:10px;margin:1rem 0; }
</style>