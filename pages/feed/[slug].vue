<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { get, post: apiPost, patch, del } = useAxios()
const { currentUser, isAuthenticated } = useAuth()
const { getUser, displayName, displayInitial } = useUserCache()

const post = ref<any>(null)
const postAuthor = ref<any>(null)
const loadingPost = ref(true)
const errorPost = ref<string | null>(null)
const liked = ref(false)
const likeCount = ref(0)
const saved = ref(false)

const comments = ref<any[]>([])
const commentsCount = ref(0)
const loadingComments = ref(false)
const commentPage = ref(1)
const commentHasMore = ref(true)
const COMMENT_LIMIT = 10

const repliesMap = ref(new Map())
const editingId = ref<any>(null)
const editText = ref('')
const deletingId = ref<any>(null)
const replyingTo = ref<any>(null)
const replyMsg = ref('')
const submittingReply = ref(false)
const newMsg = ref('')
const submitting = ref(false)
const approving = ref(false)

const recommendedPosts = ref<any[]>([])
const recommendedLoading = ref(false)
const recommendedError = ref<string | null>(null)
const recommendedCarouselRef = ref<HTMLElement | null>(null)
const recommendedCanScrollLeft = ref(false)
const recommendedCanScrollRight = ref(false)

const mounted = ref(false)
const authReady = ref(false)

const showAuthModal = ref(false)
const authGateMessage = ref('')

const isLinked = computed(() => currentUser.value?.linked ?? false)

const MODALITY_ICON: Record<string, string> = {
  online: 'fa-globe',
  presencial: 'fa-location-dot',
  híbrido: 'fa-arrows-spin',
}

const CATEGORY_ORDER = [
  { key: 'olimpiadas' },
  { key: 'bolsas' },
  { key: 'estagios' },
  { key: 'acampamentos' },
  { key: 'eventos' },
  { key: 'pesquisa' },
  { key: 'workshops' },
  { key: 'oportunidades' },
  { key: 'outros' },
] as const

const CATEGORY_MAP: Record<string, { label: string; color: string; hints: string[] }> = {
  olimpiadas: {
    label: 'Olimpíadas',
    color: '#079272',
    hints: ['olimpiada', 'olimpíada', 'obmep', 'obf', 'obo', 'obq', 'competição', 'competicao', 'olympiad'],
  },
  bolsas: {
    label: 'Bolsas',
    color: '#2464E8',
    hints: ['bolsa', 'scholarship', 'grant', 'auxilio', 'auxílio', 'financiamento'],
  },
  estagios: {
    label: 'Estágios',
    color: '#8B5CF6',
    hints: ['estagio', 'estágio', 'internship', 'trainee'],
  },
  acampamentos: {
    label: 'Summer Camps',
    color: '#F59E0B',
    hints: ['camp', 'summer camp', 'acampamento', 'verao', 'verão', 'ferias', 'férias'],
  },
  eventos: {
    label: 'Eventos',
    color: '#EC4899',
    hints: ['evento', 'conference', 'conferencia', 'conferência', 'seminario', 'seminário', 'palestra', 'summit', 'meetup', 'feira'],
  },
  pesquisa: {
    label: 'Pesquisa',
    color: '#059669',
    hints: ['pesquisa', 'research', 'laboratorio', 'laboratório', 'iniciacao cientifica', 'iniciação científica', 'ic'],
  },
  workshops: {
    label: 'Workshops',
    color: '#0EA5E9',
    hints: ['workshop', 'oficina', 'curso', 'bootcamp', 'treinamento', 'training'],
  },
  oportunidades: {
    label: 'Oportunidades',
    color: '#111827',
    hints: ['oportunidade', 'opportunity', 'vaga', 'edital', 'open call'],
  },
  outros: {
    label: 'Outros',
    color: '#6B7280',
    hints: [],
  },
}

function safeArray<T>(value: any): T[] {
  return Array.isArray(value) ? value : []
}

function normalizeText(input: any) {
  return String(input ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function getPostSearchBlob(p: any) {
  return normalizeText([
    ...(safeArray<string>(p?.tags) || []),
    p?.post_type,
    p?.title,
    p?.excerpt,
  ].join(' '))
}

function classifyPost(p: any) {
  const blob = getPostSearchBlob(p)

  for (const key of CATEGORY_ORDER.map(c => c.key)) {
    const cat = CATEGORY_MAP[key]
    if (cat.hints.some(h => blob.includes(normalizeText(h)))) return key
  }

  return 'outros'
}

function colorFor(p: any) {
  return CATEGORY_MAP[classifyPost(p)]?.color ?? CATEGORY_MAP.outros.color
}

function labelFor(p: any) {
  return CATEGORY_MAP[classifyPost(p)]?.label ?? 'Outros'
}

function openAuthGate(message = 'Faça login para continuar.') {
  authGateMessage.value = message
  showAuthModal.value = true
}

function goToLogin() {
  showAuthModal.value = false
  router.push({ path: '/login', query: { redirect: route.fullPath } })
}

function ensureAuth(message = 'Faça login para continuar.') {
  if (isAuthenticated.value) return true
  openAuthGate(message)
  return false
}

async function fetchPost() {
  loadingPost.value = true
  errorPost.value = null

  try {
    const res = await get(`/posts/slug/${route.params.slug}`)
    post.value = res.data
    likeCount.value = res.data.likes_count ?? 0
    liked.value = res.data.liked_by_me ?? false

    if (res.data.author_id) {
      postAuthor.value = await getUser(res.data.author_id)
    }

    await fetchComments(true)
  } catch (e: any) {
    errorPost.value = e?.response?.status === 404 ? 'Post não encontrado.' : 'Erro ao carregar o post.'
  } finally {
    loadingPost.value = false
  }
}

async function fetchComments(reset = false) {
  if (!post.value?.id) return

  if (reset) {
    commentPage.value = 1
    comments.value = []
    repliesMap.value.clear()
  }

  loadingComments.value = true
  try {
    const res = await get(`/comments/post/${post.value.id}`, {
      params: { page: commentPage.value, limit: COMMENT_LIMIT },
    })

    let data: any[] = []
    let count: number | null = null

    if (Array.isArray(res.data)) {
      data = res.data
      count = res.data.length
    } else if (res.data?.data) {
      data = res.data.data
      count = typeof res.data.count === 'number' ? res.data.count : data.length
    }

    if (reset) {
      commentsCount.value = count ?? data.length
    } else if (typeof count === 'number') {
      commentsCount.value = Math.max(commentsCount.value, count)
    } else {
      commentsCount.value = Math.max(commentsCount.value, comments.value.length + data.length)
    }

    comments.value.push(...data)
    commentHasMore.value = data.length === COMMENT_LIMIT
  } catch (e) {
    console.error('Erro ao carregar comentários:', e)
  } finally {
    loadingComments.value = false
  }
}

async function fetchReplies(commentId: any, openAfterLoad = false) {
  if (repliesMap.value.has(commentId) && !openAfterLoad) {
    repliesMap.value.get(commentId).open = !repliesMap.value.get(commentId).open
    return
  }

  repliesMap.value.set(commentId, { data: [], loading: true, open: openAfterLoad })

  try {
    const res = await get(`/comments/${commentId}/replies`)
    const replies = res.data.data ?? []
    repliesMap.value.set(commentId, { data: replies, loading: false, open: openAfterLoad })

    const parent = findCommentById(commentId)
    if (parent && replies.length) parent.replies_count = replies.length
  } catch {
    repliesMap.value.set(commentId, { data: [], loading: false, open: openAfterLoad })
  }
}

function findCommentById(id: any) {
  let found = comments.value.find(c => c.id === id)
  if (found) return found

  for (const [, state] of repliesMap.value) {
    found = state.data.find((r: any) => r.id === id)
    if (found) return found
  }

  return null
}

async function toggleReplies(commentId: any) {
  await fetchReplies(commentId, true)
}

async function submitComment() {
  if (!ensureAuth('Faça login para comentar.')) return
  if (!newMsg.value.trim() || submitting.value || !post.value?.id) return

  submitting.value = true
  try {
    const res = await apiPost('/comments/', {
      message: newMsg.value.trim(),
      post_id: post.value.id,
    })

    comments.value.unshift({ ...res.data, author_id: currentUser.value?.id })
    commentsCount.value++
    newMsg.value = ''

    if (post.value) post.value.comments_count = commentsCount.value
  } catch (e) {
    console.error('Erro ao publicar comentário:', e)
  } finally {
    submitting.value = false
  }
}

async function submitReply(parentId: any) {
  if (!ensureAuth('Faça login para responder comentários.')) return
  if (!replyMsg.value.trim() || submittingReply.value || !post.value?.id) return

  submittingReply.value = true
  try {
    const res = await apiPost('/comments/', {
      message: replyMsg.value.trim(),
      post_id: post.value.id,
      parent_comment_id: parentId,
    })

    const parent = findCommentById(parentId)
    if (parent) parent.replies_count = (parent.replies_count ?? 0) + 1

    if (!repliesMap.value.has(parentId)) {
      repliesMap.value.set(parentId, { data: [], loading: false, open: true })
    }

    const state = repliesMap.value.get(parentId)
    state.data.unshift({ ...res.data, author_id: currentUser.value?.id })
    state.open = true

    replyMsg.value = ''
    replyingTo.value = null
  } catch (e) {
    console.error('Erro ao responder:', e)
  } finally {
    submittingReply.value = false
  }
}

function startEdit(comment: any) {
  if (!ensureAuth('Faça login para editar comentários.')) return
  editingId.value = comment.id
  editText.value = comment.message
}

async function saveEdit(commentId: any, parentId: any = null) {
  if (!ensureAuth('Faça login para editar comentários.')) return
  if (!editText.value.trim()) return

  try {
    const res = await patch(`/comments/${commentId}`, { message: editText.value.trim() })

    if (parentId) {
      const state = repliesMap.value.get(parentId)
      const reply = state?.data.find((r: any) => r.id === commentId)
      if (reply) reply.message = res.data.message
    } else {
      const c = comments.value.find(c => c.id === commentId)
      if (c) c.message = res.data.message
    }
  } catch (e) {
    console.error('Erro ao editar:', e)
  } finally {
    editingId.value = null
    editText.value = ''
  }
}

async function deleteComment(commentId: any, parentId: any = null) {
  if (!ensureAuth('Faça login para excluir comentários.')) return
  if (deletingId.value) return

  deletingId.value = commentId
  try {
    await del(`/comments/${commentId}`)

    if (parentId) {
      const state = repliesMap.value.get(parentId)
      if (state) {
        state.data = state.data.filter((r: any) => r.id !== commentId)
        const parent = findCommentById(parentId)
        if (parent) parent.replies_count = Math.max(0, (parent.replies_count ?? 1) - 1)
      }
    } else {
      comments.value = comments.value.filter(c => c.id !== commentId)
      commentsCount.value = Math.max(0, commentsCount.value - 1)
      repliesMap.value.delete(commentId)
    }
  } catch (e) {
    console.error('Erro ao deletar:', e)
  } finally {
    deletingId.value = null
  }
}

async function loadMoreComments() {
  if (!commentHasMore.value || loadingComments.value) return
  commentPage.value++
  await fetchComments()
}

async function approvePost(targetPost: any) {
  if (!ensureAuth('Faça login para aprovar este post.')) return
  if (approving.value) return

  const { default: Swal } = await import('sweetalert2')
  const result = await Swal.fire({
    title: 'Aprovar post?',
    text: 'Esse post será publicado e ficará visível para todos.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Aprovar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#16a34a',
  })

  if (!result.isConfirmed) return

  approving.value = true
  try {
    await patch(`/posts/${targetPost.id}`, { approved: true })
    if (post.value) post.value.approved = true

    await Swal.fire({
      icon: 'success',
      title: 'Post aprovado!',
      text: 'O post foi publicado com sucesso.',
      timer: 2000,
      showConfirmButton: false,
    })
  } catch (e: any) {
    await Swal.fire({
      icon: 'error',
      title: 'Erro ao aprovar',
      text: e?.response?.data?.detail || 'Não foi possível aprovar o post.',
    })
  } finally {
    approving.value = false
  }
}

async function likePost() {
  if (!ensureAuth('Faça login para curtir posts.')) return
  if (!post.value?.id) return

  try {
    await apiPost(`/posts/${post.value.id}/like`, {})
    liked.value = true
    likeCount.value++
  } catch (e) {
    console.error('Erro ao curtir:', e)
  }
}

async function unlikePost() {
  if (!ensureAuth('Faça login para descurtir posts.')) return
  if (!post.value?.id) return

  try {
    await del(`/posts/${post.value.id}/like`)
    liked.value = false
    likeCount.value--
  } catch (e) {
    console.error('Erro ao descurtir:', e)
  }
}

function handleSaveToggle() {
  if (!ensureAuth('Faça login para salvar posts.')) return
  saved.value = !saved.value
}

const formattedDate = computed(() => {
  if (!post.value?.created_at) return ''
  return new Date(post.value.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
})

const deadlineInfo = computed(() => {
  if (!post.value?.deadline) return null
  const deadlineDate = new Date(post.value.deadline)
  if (isNaN(deadlineDate.getTime())) return null

  const expired = deadlineDate.getTime() < Date.now()

  return {
    expired,
    full: deadlineDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    dateOnly: deadlineDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
  }
})

const formattedDeadline = computed(() => deadlineInfo.value?.full ?? null)
const isDeadlineExpired = computed(() => deadlineInfo.value?.expired ?? false)

const readTime = computed(() => {
  const words = (post.value?.content_md || '').trim().split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.ceil(words / 200))} min`
})

const isMyPost = computed(() => {
  if (!currentUser.value || !post.value) return false
  return String(post.value.author_id) === String(currentUser.value.id)
})

const canEdit = computed(() => {
  if (!currentUser.value) return false
  return isMyPost.value || currentUser.value.is_superuser
})

const authorProfileUrl = computed(() => {
  if (isMyPost.value) return currentUser.value?.profile_picture_url || null
  return postAuthor.value?.profile_picture_url || null
})

const isManager = computed(() => currentUser.value?.is_manager || currentUser.value?.is_superuser)

const authorDisplayName = computed(() => {
  if (isMyPost.value) return currentUser.value?.full_name || currentUser.value?.username || 'Você'
  return displayName(postAuthor.value)
})

const authorDisplayInitial = computed(() => {
  if (isMyPost.value) return (currentUser.value?.full_name || currentUser.value?.username || '?').charAt(0).toUpperCase()
  return displayInitial(postAuthor.value)
})

const contentHtml = ref('')

watch(
  () => post.value?.content_md,
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

const currentUserInitial = computed(() =>
  (currentUser.value?.full_name || currentUser.value?.username || '?').charAt(0).toUpperCase()
)

useSeoMeta({
  title: computed(() => (post.value ? `${post.value.title} — seConecta` : 'seConecta')),
})

function updateRecommendedCarouselState() {
  const el = recommendedCarouselRef.value
  if (!el) {
    recommendedCanScrollLeft.value = false
    recommendedCanScrollRight.value = false
    return
  }

  const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth)
  recommendedCanScrollLeft.value = el.scrollLeft > 4
  recommendedCanScrollRight.value = el.scrollLeft < maxScrollLeft - 4
}

function scrollRecommendedCarousel(direction: number) {
  const el = recommendedCarouselRef.value
  if (!el) return

  const amount = Math.max(220, Math.min(360, Math.round(el.clientWidth * 0.82)))
  el.scrollBy({ left: direction * amount, behavior: 'smooth' })
}

async function fetchRecommended() {
  if (!authReady.value || !isAuthenticated.value || !isLinked.value) {
    recommendedPosts.value = []
    recommendedError.value = null
    recommendedLoading.value = false
    await nextTick()
    updateRecommendedCarouselState()
    return
  }

  recommendedLoading.value = true
  recommendedError.value = null

  try {
    let data: any[] = []

    try {
      const res = await apiPost('/posts/get-feed-posts', {})
      data = safeArray<any>(res.data?.data ?? res.data ?? [])
    } catch (err: any) {
      if (err?.response?.status === 405) {
        const res = await get('/posts/get-feed-posts')
        data = safeArray<any>(res.data?.data ?? res.data ?? [])
      } else {
        throw err
      }
    }

    recommendedPosts.value = data
    await nextTick()
    updateRecommendedCarouselState()
  } catch (err: any) {
    console.error('Error fetching recommendations:', err)
    recommendedPosts.value = []

    const status = err?.response?.status
    if (status === 401 || status === 429) {
      recommendedError.value = null
    } else {
      recommendedError.value = 'Não foi possível carregar recomendações.'
    }
  } finally {
    recommendedLoading.value = false
  }
}

const recommendedDisplayPosts = computed<any[]>(() => safeArray<any>(recommendedPosts.value))

watch(() => route.params.slug, fetchPost)
watch([isAuthenticated, isLinked, authReady], () => {
  if (!mounted.value || !authReady.value) return
  void fetchRecommended()
}, { immediate: true })

watch(recommendedDisplayPosts, async () => {
  await nextTick()
  updateRecommendedCarouselState()
})

onMounted(async () => {
  mounted.value = true
  authReady.value = true

  await fetchPost()
  await nextTick()
  updateRecommendedCarouselState()
  void fetchRecommended()

  window.addEventListener('resize', updateRecommendedCarouselState)
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('resize', updateRecommendedCarouselState)
  }
})

function openPost(postItem: any) {
  router.push(`/feed/${postItem.slug || postItem.id}`)
}
</script>

<template>
  <div class="min-h-screen bg-[#f7f5f0]">
    <!-- Loading -->
    <div v-if="loadingPost" class="min-h-screen animate-pulse">
      <div class="bg-[#0c1b32] pt-24 px-8 pb-0">
        <div class="max-w-[1000px] mx-auto space-y-4">
          <div class="h-4 w-24 bg-white/10 rounded"></div>
          <div class="h-10 w-2/3 bg-white/10 rounded-lg"></div>
          <div class="h-4 w-1/2 bg-white/10 rounded"></div>
          <div class="h-16 bg-white/5 rounded-t-xl mt-8"></div>
        </div>
      </div>
      <div class="max-w-[900px] mx-auto px-8 pt-10 space-y-3">
        <div
          v-for="i in 8"
          :key="i"
          class="h-4 bg-[#e8e4dc] rounded"
          :style="{ width: ['100%','85%','95%','70%','90%','60%','88%','75%'][i-1] }"
        ></div>
      </div>
    </div>

    <!-- Erro -->
    <div v-else-if="errorPost" class="min-h-screen flex flex-col items-center justify-center gap-5 px-8 text-center">
      <div class="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p class="text-[#555]">{{ errorPost }}</p>
      <div class="flex gap-3">
        <button
          class="text-sm font-semibold px-5 py-2 bg-[#0d0d0d] text-white rounded-lg hover:bg-[#079272] transition-colors border-none cursor-pointer"
          @click="fetchPost"
        >
          Tentar novamente
        </button>
        <button
          class="text-sm font-semibold px-5 py-2 bg-white border border-[#e8e4dc] text-[#555] rounded-lg hover:border-[#0d0d0d] transition-colors cursor-pointer"
          @click="router.push('/feed')"
        >
          Voltar ao feed
        </button>
      </div>
    </div>

    <template v-else-if="post">
      <!-- Banner análise pendente -->
      <div
        v-if="post.approved === false"
        class="sticky top-0 z-50 bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-center gap-3 text-sm text-amber-700 flex-wrap"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span class="font-medium">Este post está aguardando aprovação antes de ser publicado.</span>
        <button
          v-if="isManager"
          @click="approvePost(post)"
          :disabled="approving"
          class="px-3 py-1 text-xs font-semibold text-white rounded transition border-none cursor-pointer"
          :class="approving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'"
        >
          {{ approving ? 'Aprovando...' : 'Aprovar' }}
        </button>
      </div>

      <!-- Header do post -->
      <header class="relative overflow-hidden bg-[#0c1b32] pt-20 px-8 pb-0">
        <div class="relative z-10 max-w-[1000px] mx-auto">
          <button
            class="inline-flex items-center gap-1.5 text-[0.75rem] text-white/30 border-none bg-transparent cursor-pointer hover:text-white/80 transition-colors mb-8"
            @click="router.push('/feed')"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Voltar ao feed
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

            <span class="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {{ formattedDate }}
            </span>

            <template v-if="formattedDeadline">
              <span class="text-white/15">·</span>
              <span class="flex items-center gap-1.5" :class="isDeadlineExpired ? 'text-red-300' : 'text-amber-200'">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Prazo: {{ formattedDeadline }}
                <span v-if="isDeadlineExpired" class="text-[0.65rem] font-bold ml-1">(encerrado)</span>
              </span>
            </template>

            <span
              v-if="isMyPost"
              class="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full bg-[#079272]/20 text-[#079272]"
            >
              Seu post
            </span>
          </div>

          <div
            v-if="formattedDeadline && isDeadlineExpired"
            class="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-100"
          >
            <div class="flex items-center gap-2 text-sm font-semibold">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Oportunidade encerrada
              <span class="font-normal text-red-100/80">• Prazo final: {{ formattedDeadline }}</span>
            </div>
          </div>

          <h1 class="text-[clamp(1.8rem,4.5vw,3.2rem)] font-extrabold text-white leading-[1.1] tracking-[-0.03em] mb-5">
            {{ post.title }}
          </h1>

          <p v-if="post.excerpt" class="text-base font-light text-white/40 leading-relaxed max-w-[580px] mb-6">
            {{ post.excerpt }}
          </p>

          <div v-if="post.tags?.length" class="flex flex-wrap gap-1.5 mb-8">
            <span
              v-for="tag in post.tags"
              :key="tag"
              class="text-[0.65rem] font-semibold px-2 py-0.5 bg-white/10 text-white/50 rounded-full border border-white/10"
            >
              #{{ tag }}
            </span>
          </div>

          <div class="flex items-center justify-between bg-white/5 border border-white/[0.08] rounded-t-xl p-4 md:p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#079272] to-[#2464E8] flex items-center justify-center text-white text-sm font-bold">
                <img
                  v-if="authorProfileUrl"
                  :src="authorProfileUrl"
                  :alt="authorDisplayName"
                  class="w-full h-full object-cover"
                />
                <span v-else>{{ authorDisplayInitial }}</span>
              </div>

              <div>
                <div class="text-[0.88rem] font-semibold text-white">{{ authorDisplayName }}</div>
                <div
                  v-if="postAuthor?.username || (isMyPost && currentUser?.username)"
                  class="text-[0.72rem] text-white/35"
                >
                  @{{ postAuthor?.username || currentUser?.username }}
                </div>
              </div>
            </div>

            <div class="flex gap-5 text-[0.78rem] text-white/35">
              <span class="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {{ likeCount }}
              </span>
              <span class="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {{ commentsCount }}
              </span>
            </div>

            <NuxtLink
              v-if="canEdit"
              :to="`/edit/${route.params.slug}`"
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

      <!-- Cover -->
      <div v-if="post.cover_url" class="max-w-[1000px] mx-auto">
        <img :src="post.cover_url" :alt="post.title" class="w-full h-[380px] max-md:h-52 object-cover block"/>
      </div>

      <!-- Content + Sidebar -->
      <div class="max-w-[1000px] mx-auto px-6 md:px-8 pb-16 grid grid-cols-1 md:grid-cols-[1fr_180px] gap-12 items-start">
        <article class="pt-12 article-body prose max-w-none" v-html="contentHtml"></article>

        <aside class="pt-12 sticky top-20 hidden md:flex flex-col gap-4">
          <div class="bg-white border border-[#e8e4dc] rounded-xl p-5 flex flex-col gap-2">
            <div class="text-[0.62rem] font-semibold tracking-[0.12em] uppercase text-[#bbb] mb-1">Ações</div>

            <button
              class="text-[0.78rem] font-semibold px-3 py-2 rounded-lg border-none cursor-pointer transition-all flex items-center gap-1.5 w-full bg-[#f7f5f0] text-[#666] hover:bg-[#fff0f0] hover:text-[#e53e3e]"
              :class="{ '!bg-[#fff0f0] !text-[#e53e3e]': liked }"
              @click="liked ? unlikePost() : likePost()"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" :fill="liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {{ liked ? 'Curtido' : 'Curtir' }}
            </button>

            <button
              class="text-[0.78rem] font-semibold px-3 py-2 rounded-lg border-none cursor-pointer transition-all flex items-center gap-1.5 w-full bg-[#f7f5f0] text-[#666] hover:bg-[#e8f5f2] hover:text-[#079272]"
              :class="{ '!bg-[#e8f5f2] !text-[#079272]': saved }"
              @click="handleSaveToggle"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" :fill="saved ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
              {{ saved ? 'Salvo ✓' : 'Salvar' }}
            </button>

            <NuxtLink
              v-if="canEdit"
              :to="`/edit/${route.params.slug}`"
              class="text-[0.78rem] font-semibold px-3 py-2 rounded-lg border-none cursor-pointer transition-all flex items-center gap-1.5 w-full bg-[#f7f5f0] text-[#666] hover:bg-[#e8f5f2] hover:text-[#079272]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"/>
                <polygon points="18 2 22 6 12 16 8 16 8 12 18 2"/>
              </svg>
              Editar
            </NuxtLink>
          </div>

          <div class="bg-white border border-[#e8e4dc] rounded-xl p-5">
            <div class="text-[0.62rem] font-semibold tracking-[0.12em] uppercase text-[#bbb] mb-3">Stats</div>
            <div
              v-for="s in [
                { l: 'Curtidas', v: likeCount },
                { l: 'Comentários', v: commentsCount },
                { l: 'Leitura', v: readTime }
              ]"
              :key="s.l"
              class="flex justify-between py-2 text-[0.75rem] border-b border-[#f7f5f0] last:border-0"
            >
              <span class="text-[#bbb]">{{ s.l }}</span>
              <strong class="text-[#111]">{{ s.v }}</strong>
            </div>

            <div v-if="formattedDeadline" class="flex justify-between py-2 text-[0.75rem] border-b border-[#f7f5f0]">
              <span class="text-[#bbb]">Prazo</span>
              <strong class="text-[#111]" :class="{ 'text-red-600': isDeadlineExpired }">
                {{ formattedDeadline }}
              </strong>
            </div>
          </div>
        </aside>
      </div>

      <!-- Recomendações compactas -->
      <div class="max-w-[1000px] mx-auto px-6 md:px-8 mt-2">
        <div class="flex items-end justify-between gap-4 mb-3">
          <div>
            <h2 class="text-[1rem] md:text-[1.1rem] font-bold text-[#111] tracking-[-0.02em]">
              Recomendado para você
            </h2>
            <p class="text-[0.74rem] text-[#aaa] mt-1">
              Sugestões rápidas com base no seu perfil.
            </p>
          </div>

          <div class="flex gap-2">
            <button
              @click="scrollRecommendedCarousel(-1)"
              class="w-8 h-8 rounded-full border border-[#e8e4dc] bg-white flex items-center justify-center hover:border-[#079272] hover:text-[#079272] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="recommendedLoading || !recommendedCanScrollLeft"
              aria-label="Voltar recomendações"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <button
              @click="scrollRecommendedCarousel(1)"
              class="w-8 h-8 rounded-full border border-[#e8e4dc] bg-white flex items-center justify-center hover:border-[#079272] hover:text-[#079272] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="recommendedLoading || !recommendedCanScrollRight"
              aria-label="Avançar recomendações"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="recommendedLoading" class="text-center py-6 text-[#aaa] text-sm">
          <svg class="animate-spin w-4 h-4 inline-block mr-2 text-[#079272]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Carregando recomendações...
        </div>

        <div v-else-if="recommendedError" class="text-center py-5 text-sm text-red-500">
          {{ recommendedError }}
        </div>

        <div v-else-if="!authReady" class="text-center py-6 text-[#aaa] text-sm">
          Carregando conta...
        </div>

        <div v-else-if="isAuthenticated && !isLinked" class="text-center py-6 text-[#aaa] text-sm">
          Conecte seu WhatsApp na
          <NuxtLink to="/perfil" class="text-[#079272] font-semibold hover:underline">página de perfil</NuxtLink>
          para receber recomendações personalizadas.
        </div>

        <div v-else-if="recommendedDisplayPosts.length > 0" class="relative">
          <div
            ref="recommendedCarouselRef"
            class="recommended-carousel flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 pr-1"
            @scroll.passive="updateRecommendedCarouselState"
          >
            <button
              v-for="rec in recommendedDisplayPosts"
              :key="rec.id ?? rec.slug"
              class="snap-start shrink-0 w-[240px] sm:w-[260px] text-left bg-white border border-[#e8e4dc] rounded-2xl overflow-hidden hover:shadow-md hover:border-[#079272]/20 transition-all group cursor-pointer"
              @click="openPost(rec)"
            >
              <div class="p-4 flex flex-col gap-3 h-full">
                <div class="flex items-start justify-between gap-2">
                  <span
                    v-if="rec.similarity"
                    class="text-[0.6rem] font-semibold px-2 py-0.5 rounded-full bg-[#f0faf7] text-[#079272] border border-[#c5e8df] whitespace-nowrap"
                  >
                    {{ Math.round(rec.similarity * 100) }}% match
                  </span>

                  <span class="text-[0.6rem] font-semibold px-2 py-0.5 rounded-full" :style="{ background: colorFor(rec) + '18', color: colorFor(rec) }">
                    {{ labelFor(rec) }}
                  </span>
                </div>

                <h3 class="text-[0.9rem] font-bold text-[#111] line-clamp-2 group-hover:text-[#079272] transition-colors">
                  {{ rec.title }}
                </h3>

                <p v-if="rec.excerpt" class="text-[0.72rem] text-[#666] line-clamp-3">
                  {{ rec.excerpt }}
                </p>

                <div class="pt-2 mt-auto flex items-center justify-between text-[0.65rem] text-[#aaa] border-t border-[#f7f5f0]">
                  <span v-if="rec.deadline">
                    Prazo: {{ new Date(rec.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) }}
                  </span>
                  <span>Clique para ler</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div v-else-if="isAuthenticated" class="text-center py-6 text-[#aaa] text-sm">
          Nenhuma recomendação disponível agora.
        </div>

        <div v-else class="text-center py-6 text-[#aaa] text-sm">
          Faça
          <NuxtLink to="/login" class="text-[#079272] font-semibold hover:underline">login</NuxtLink>
          para ver recomendações personalizadas.
        </div>
      </div>

      <!-- Comentários -->
      <div class="max-w-[760px] mx-auto px-6 md:px-8 pb-28 mt-10">
        <div class="flex items-center gap-3 mb-8 pb-5 border-b border-[#e8e4dc]">
          <h2 class="text-lg font-bold text-[#111] tracking-[-0.02em]">Comentários</h2>
          <span class="text-[0.72rem] font-semibold px-2.5 py-0.5 bg-[#f7f5f0] border border-[#e8e4dc] text-[#888] rounded-full">
            {{ commentsCount }}
          </span>
        </div>

        <div v-if="isAuthenticated" class="flex gap-3 mb-10">
          <div class="w-9 h-9 flex-shrink-0 rounded-full overflow-hidden">
            <img
              v-if="currentUser?.profile_picture_url"
              :src="currentUser.profile_picture_url"
              alt="Seu avatar"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full bg-gradient-to-br from-[#079272] to-[#2464E8] flex items-center justify-center text-white text-xs font-bold"
            >
              {{ currentUserInitial }}
            </div>
          </div>

          <div class="flex-1 flex flex-col gap-2">
            <textarea
              v-model="newMsg"
              rows="3"
              placeholder="Escreva um comentário..."
              class="w-full text-[0.88rem] font-light p-3.5 bg-white border border-[#e8e4dc] rounded-xl resize-none text-[#111] outline-none transition-colors focus:border-[#079272] focus:ring-2 focus:ring-[#079272]/10"
            ></textarea>

            <button
              class="self-end text-[0.78rem] font-semibold px-5 py-2 bg-[#079272] text-white rounded-lg border-none cursor-pointer hover:bg-[#068060] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              :disabled="!newMsg.trim() || submitting"
              @click="submitComment"
            >
              <svg
                v-if="submitting"
                class="animate-spin"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              {{ submitting ? 'Publicando...' : 'Publicar' }}
            </button>
          </div>
        </div>

        <div
          v-else
          class="mb-8 p-4 bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-sm text-center text-[#888]"
        >
          <button
            class="text-[#079272] font-semibold hover:underline border-none bg-transparent cursor-pointer"
            @click="openAuthGate('Faça login para comentar.')"
          >
            Faça login
          </button>
          para comentar.
        </div>

        <div v-if="loadingComments && comments.length === 0" class="flex flex-col gap-4">
          <div v-for="i in 3" :key="i" class="flex gap-3 animate-pulse">
            <div class="w-9 h-9 flex-shrink-0 rounded-full bg-[#f0ece5]"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3 w-28 bg-[#f0ece5] rounded"></div>
              <div class="h-3.5 w-full bg-[#f0ece5] rounded"></div>
              <div class="h-3.5 w-4/5 bg-[#f0ece5] rounded"></div>
            </div>
          </div>
        </div>

        <div v-else-if="!loadingComments && comments.length === 0" class="py-12 text-center text-sm text-[#aaa]">
          Nenhum comentário ainda. Seja o primeiro!
        </div>

        <div v-else class="flex flex-col divide-y divide-[#f0ece5]">
          <div v-for="comment in comments" :key="comment.id" class="py-5">
            <FeedCommentItem
              :comment="comment"
              :replies-map="repliesMap"
              :editing-id="editingId"
              :edit-text="editText"
              :deleting-id="deletingId"
              :replying-to="replyingTo"
              :reply-msg="replyMsg"
              :submitting-reply="submittingReply"
              :is-authenticated="!!isAuthenticated"
              :current-user="currentUser"
              @toggle-replies="toggleReplies"
              @fetch-replies="fetchReplies"
              @start-reply="(id: any) => { replyingTo = id; replyMsg = '' }"
              @submit-reply="submitReply"
              @start-edit="startEdit"
              @save-edit="saveEdit"
              @cancel-edit="editingId = null; editText = ''"
              @delete-comment="deleteComment"
              @update:edit-text="editText = $event"
              @update:reply-msg="replyMsg = $event"
              @cancel-reply="replyingTo = null"
            />
          </div>
        </div>

        <div v-if="commentHasMore && !loadingComments" class="flex justify-center pt-6">
          <button
            class="text-sm font-semibold px-6 py-2.5 border border-[#e8e4dc] text-[#666] rounded-xl hover:border-[#079272] hover:text-[#079272] transition-all cursor-pointer bg-transparent"
            @click="loadMoreComments"
          >
            Ver mais comentários
          </button>
        </div>

        <div v-if="loadingComments && comments.length > 0" class="flex justify-center pt-4">
          <svg class="animate-spin text-[#079272]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        </div>
      </div>
    </template>

    <!-- Auth gate modal -->
    <Transition name="modal-fade">
      <div v-if="showAuthModal" class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/45 backdrop-blur-sm" @click="showAuthModal = false"></div>

        <div class="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#e8e4dc]">
          <div class="p-6 sm:p-7">
            <div class="w-11 h-11 rounded-2xl bg-[#f0faf7] flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#079272" stroke-width="2">
                <path d="M12 11c1.657 0 3-1.567 3-3.5S13.657 4 12 4 9 5.567 9 7.5 10.343 11 12 11z"/>
                <path d="M5 20v-1c0-2.761 3.134-5 7-5s7 2.239 7 5v1"/>
              </svg>
            </div>

            <h3 class="text-[1.1rem] font-bold text-[#111] mb-2">Entre para interagir</h3>
            <p class="text-sm text-[#666] leading-relaxed">
              {{ authGateMessage }}
            </p>

            <div class="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                class="h-11 px-4 rounded-xl border border-[#e8e4dc] text-[#666] font-semibold bg-white hover:bg-[#fafaf9] transition-colors"
                @click="showAuthModal = false"
              >
                Agora não
              </button>

              <button
                class="h-11 px-4 rounded-xl bg-[#0d0d0d] text-white font-semibold hover:bg-[#079272] transition-colors"
                @click="goToLogin"
              >
                Ir para login
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
.article-body h1 { font-size:1.6rem;font-weight:800;color:#111;margin:2rem 0 1rem;line-height:1.2; }
.article-body h2 { font-size:1.35rem;font-weight:700;color:#111;margin:2rem 0 .85rem;line-height:1.3; }
.article-body h3 { font-size:1.1rem;font-weight:600;color:#111;margin:1.5rem 0 .7rem; }
.article-body p  { font-size:.98rem;font-weight:300;color:#555;line-height:1.9;margin-bottom:1.4rem; }
.article-body strong { font-weight:600;color:#111; }
.article-body em  { font-style:italic; }
.article-body code { background:#f7f5f0;border:1px solid #e8e4dc;padding:.15rem .45rem;border-radius:4px;font-size:.88em;color:#079272;font-family:monospace; }
.article-body pre code { background:none;border:none;padding:0;color:inherit; }
.article-body pre { background:#1e1e2e;border-radius:10px;padding:1.25rem 1.5rem;overflow-x:auto;margin:1.5rem 0; }
.article-body blockquote { border-left:3px solid #079272;padding:1rem 1.5rem;margin:1.5rem 0;background:#e8f5f2;border-radius:0 10px 10px 0;font-size:1rem;font-style:italic;color:#333; }
.article-body ul, .article-body ol { padding-left:1.5rem;margin-bottom:1.4rem;color:#555; }
.article-body li { margin-bottom:.4rem;font-weight:300; }
.article-body a { color:#079272;text-decoration:underline; }
.article-body img { max-width:100%;border-radius:10px;margin:1rem 0; }

.recommended-carousel {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.recommended-carousel::-webkit-scrollbar {
  display: none;
}
</style>
