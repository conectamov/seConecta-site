<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({ breaks: true })

const props = defineProps<{
  postSlug: string
  redirectUrl: string
  storageKey: string
}>()

const { get } = useAxios()

const open = ref(false)
const loading = ref(true)
const post = ref<any>(null)
const error = ref<string | null>(null)
const dialogRef = ref<HTMLElement | null>(null)

const seenKey = computed(() => `promo-modal-seen:${props.storageKey}`)

function markAsSeen() {
  if (!import.meta.client) return
  localStorage.setItem(seenKey.value, '1')
}

function hasSeen() {
  if (!import.meta.client) return true
  return localStorage.getItem(seenKey.value) === '1'
}

function closeModal() {
  markAsSeen()
  open.value = false
}

function resolvePostImage(p: any) {
  return (
    p?.cover_url ||
    p?.image_url ||
    p?.thumbnail_url ||
    p?.media_url ||
    p?.banner_url ||
    null
  )
}

function resolveAuthor(p: any) {
  return (
    p?.author_name ||
    p?.author?.full_name ||
    p?.author?.username ||
    'seConecta'
  )
}

function resolveDate(p: any) {
  const raw = p?.created_at || p?.published_at || p?.date
  if (!raw) return null

  const dt = new Date(raw)
  if (Number.isNaN(dt.getTime())) return null

  return dt.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function resolveCategory(p: any) {
  return (
    p?.category_label ||
    p?.category_name ||
    p?.category ||
    'Atualização'
  )
}

const imageUrl = computed(() => resolvePostImage(post.value))
const title = computed(() => post.value?.title || 'Novidade da comunidade')
const excerpt = computed(() => post.value?.excerpt || post.value?.description || '')
const content = computed(() => post.value?.content_md || post.value?.content || '')
const author = computed(() => resolveAuthor(post.value))
const publishedAt = computed(() => resolveDate(post.value))
const category = computed(() => resolveCategory(post.value))

const renderedContent = computed(() => {
  if (!content.value) return ''
  return DOMPurify.sanitize(marked.parse(content.value) as string)
})

const isExternalLink = computed(() => /^https?:\/\//i.test(props.redirectUrl))

function handleCtaClick() {
  markAsSeen()
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeModal()
}

onMounted(async () => {
  if (hasSeen()) return

  open.value = true
  loading.value = true
  error.value = null

  if (import.meta.client) {
    window.addEventListener('keydown', handleKeydown)
  }

  try {
    const res = await get(`/posts/slug/${props.postSlug}`)
    post.value = res.data
  } catch (e: any) {
    error.value = e?.response?.status === 404
      ? 'Post não encontrado.'
      : 'Não foi possível carregar a novidade.'
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', handleKeydown)
  }
})

watch(open, (val) => {
  if (!import.meta.client) return
  document.body.style.overflow = val ? 'hidden' : ''
  if (val) {
    nextTick(() => dialogRef.value?.focus())
  }
}, { immediate: true })
</script>

<template>
  <Teleport to="body">
    <Transition name="promo-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-[10px] px-3 py-4 sm:p-6 lg:p-10 flex items-center justify-center"
        @click.self="closeModal"
      >
        <div
          ref="dialogRef"
          role="dialog"
          aria-modal="true"
          aria-labelledby="promo-modal-title"
          tabindex="-1"
          class="w-full max-w-2xl sm:max-w-3xl lg:max-w-5xl max-h-[94vh] flex flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_30px_120px_rgba(0,0,0,0.35)] ring-1 ring-black/5 outline-none"
        >
          <div class="h-1.5 w-full shrink-0 bg-gradient-to-r from-emerald-500 via-sky-500 to-violet-500"></div>

          <div
            class="relative w-full shrink-0 bg-zinc-950"
            :class="!loading && !imageUrl ? 'h-[200px] sm:h-[260px] lg:h-[320px]' : 'h-[260px] sm:h-[360px] lg:h-[330px]'"
          >
            <div v-if="loading" class="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950"></div>

            <template v-else-if="imageUrl">
              <img
                :src="imageUrl"
                :alt="title"
                class="absolute inset-0 h-full w-full object-cover"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent"></div>
            </template>

            <div
              v-else
              class="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(59,130,246,0.32),transparent_45%),radial-gradient(circle_at_25%_85%,rgba(16,185,129,0.28),transparent_42%),linear-gradient(145deg,#0f172a,#111827_45%,#0b1220)]"
            ></div>

            <button
              type="button"
              class="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/12 text-xl text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              @click="closeModal"
              aria-label="Fechar modal"
            >
              ×
            </button>

            <div v-if="!loading" class="absolute bottom-5 left-5 flex flex-wrap gap-2">
              <span class="inline-flex items-center rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-white backdrop-blur-md">
                {{ category }}
              </span>
              <span v-if="publishedAt" class="inline-flex items-center rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/85 backdrop-blur-md">
                {{ publishedAt }}
              </span>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto px-6 sm:px-10 lg:px-14 py-7 sm:py-9">
            <div v-if="loading" class="space-y-4 max-w-2xl">
              <div class="h-3 w-24 animate-pulse rounded-full bg-zinc-100"></div>
              <div class="h-9 w-5/6 animate-pulse rounded-2xl bg-zinc-100"></div>
              <div class="h-3 w-32 animate-pulse rounded-full bg-zinc-100"></div>
              <div class="h-4 w-full animate-pulse rounded-full bg-zinc-100"></div>
              <div class="h-4 w-11/12 animate-pulse rounded-full bg-zinc-100"></div>
              <div class="mt-2 h-28 animate-pulse rounded-2xl bg-zinc-100"></div>
            </div>

            <div v-else-if="error" class="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 max-w-2xl">
              {{ error }}
            </div>

            <div v-else class="space-y-6 max-w-2xl">
              <p class="text-xs font-extrabold uppercase tracking-[0.22em] text-emerald-600">
                Informação importante
              </p>

              <div>
                <h2 id="promo-modal-title" class="text-[28px] sm:text-4xl lg:text-[42px] font-black tracking-tight text-zinc-950 leading-[1.08]">
                  {{ title }}
                </h2>
                <p class="mt-3 text-sm text-zinc-500">
                  Por {{ author }}<span v-if="publishedAt"> · {{ publishedAt }}</span>
                </p>
              </div>

              <p class="text-base sm:text-lg leading-7 sm:leading-8 text-zinc-600">
                {{ excerpt || 'Veja o que está acontecendo no projeto agora.' }}
              </p>

              <div
                v-if="content"
                class="md-content text-base sm:text-[17px] leading-7 sm:leading-8 text-zinc-700"
                v-html="renderedContent"
              ></div>
            </div>
          </div>

          <div class="shrink-0 border-t border-zinc-100 px-6 sm:px-10 lg:px-14 py-6">
            <a
              :href="redirectUrl"
              :target="isExternalLink ? '_blank' : undefined"
              :rel="isExternalLink ? 'noopener noreferrer' : undefined"
              class="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-sky-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:shadow-emerald-600/35 hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              @click="handleCtaClick"
            >
              Contribuir
              <svg
                class="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M7 17 17 7" />
                <path d="M8 7h9v9" />
              </svg>
            </a>

            <button
              type="button"
              class="mx-auto mt-3 block text-xs font-medium text-zinc-400 transition hover:text-zinc-600"
              @click="closeModal"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.promo-fade-enter-active,
.promo-fade-leave-active {
  transition: opacity 180ms ease;
}

.promo-fade-enter-from,
.promo-fade-leave-to {
  opacity: 0;
}

.promo-fade-enter-active > div,
.promo-fade-leave-active > div {
  transition: transform 180ms ease;
}

.promo-fade-enter-from > div,
.promo-fade-leave-to > div {
  transform: translateY(12px) scale(0.985);
}

@media (prefers-reduced-motion: reduce) {
  .promo-fade-enter-active,
  .promo-fade-leave-active,
  .promo-fade-enter-active > div,
  .promo-fade-leave-active > div {
    transition: none !important;
  }
}

.md-content :deep(p) {
  margin: 0 0 0.85em;
}

.md-content :deep(p:last-child) {
  margin-bottom: 0;
}

.md-content :deep(strong) {
  font-weight: 700;
  color: #18181b;
}

.md-content :deep(em) {
  font-style: italic;
}

.md-content :deep(a) {
  color: #059669;
  font-weight: 600;
  text-decoration: underline;
  text-decoration-color: #a7f3d0;
  text-underline-offset: 2px;
}

.md-content :deep(a:hover) {
  color: #047857;
}

.md-content :deep(ul),
.md-content :deep(ol) {
  margin: 0.6em 0 0.85em;
  padding-left: 1.25em;
}

.md-content :deep(ul) {
  list-style: disc;
}

.md-content :deep(ol) {
  list-style: decimal;
}

.md-content :deep(li) {
  margin-bottom: 0.35em;
}

.md-content :deep(li)::marker {
  color: #10b981;
}

.md-content :deep(h1),
.md-content :deep(h2),
.md-content :deep(h3) {
  font-weight: 800;
  color: #09090b;
  margin: 0.9em 0 0.4em;
  line-height: 1.3;
}

.md-content :deep(h1) {
  font-size: 1.2em;
}

.md-content :deep(h2) {
  font-size: 1.1em;
}

.md-content :deep(h3) {
  font-size: 1.02em;
}

.md-content :deep(blockquote) {
  border-left: 3px solid #a7f3d0;
  padding-left: 1em;
  margin: 0.85em 0;
  color: #71717a;
  font-style: italic;
}

.md-content :deep(code) {
  background: #e4e4e7;
  padding: 0.15em 0.4em;
  border-radius: 0.35em;
  font-size: 0.9em;
  font-family: ui-monospace, monospace;
}

.md-content :deep(pre) {
  background: #18181b;
  color: #fafafa;
  padding: 0.9em 1em;
  border-radius: 0.9em;
  overflow-x: auto;
  margin: 0.85em 0;
}

.md-content :deep(pre code) {
  background: transparent;
  padding: 0;
}

.md-content :deep(hr) {
  border-color: #e4e4e7;
  margin: 1em 0;
}

.md-content :deep(img) {
  border-radius: 1em;
  margin: 0.85em 0;
  max-width: 100%;
}
</style>