<script setup lang="ts">
const props = defineProps<{
  comment: any
  repliesMap: Map<any, any>
  editingId: number | string | null
  editText: string
  deletingId: number | string | null
  replyingTo: number | string | null
  replyMsg: string
  submittingReply: boolean
  isAuthenticated: boolean
  currentUser: any
  level?: number
  parentId?: number | string | null
}>()

const emit = defineEmits([
  'toggle-replies', 'fetch-replies', 'load-more-replies',
  'start-reply', 'submit-reply', 'start-edit', 'save-edit',
  'cancel-edit', 'delete-comment', 'update:edit-text',
  'update:reply-msg', 'cancel-reply',
])

const { getUser, displayName, displayInitial } = useUserCache()
const localReplyingTo = ref<any>(null)
const commentAuthor = ref<any>(null)

onMounted(async () => {
  if (props.comment.author_id && props.comment.author_id !== props.currentUser?.id)
    commentAuthor.value = await getUser(props.comment.author_id)
})

const replyState = computed(() => props.repliesMap.get(props.comment.id))
const hasReplies  = computed(() => (props.comment.replies_count ?? 0) > 0)
const isEditing   = computed(() => props.editingId === props.comment.id)
const isDeleting  = computed(() => props.deletingId === props.comment.id)
const isReplying  = computed(() => props.replyingTo === props.comment.id || localReplyingTo.value === props.comment.id)
const isMyComment = computed(() => props.isAuthenticated && props.comment.author_id === props.currentUser?.id)

const authorName = computed(() => {
  if (isMyComment.value) return props.currentUser?.full_name || props.currentUser?.username || 'Você'
  if (commentAuthor.value) return displayName(commentAuthor.value)
  return 'Usuário'
})
const userInitial = computed(() => {
  if (isMyComment.value) return (props.currentUser?.full_name || props.currentUser?.username || '?').charAt(0).toUpperCase()
  if (commentAuthor.value) return displayInitial(commentAuthor.value)
  return '?'
})
const currentUserInitial = computed(() =>
  (props.currentUser?.full_name || props.currentUser?.username || '?').charAt(0).toUpperCase()
)
const timeAgo = computed(() => {
  if (!props.comment.created_at) return ''
  const diff  = Date.now() - new Date(props.comment.created_at).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'agora mesmo'
  if (mins < 60)  return `há ${mins} min`
  if (hours < 24) return `há ${hours}h`
  if (days < 30)  return `há ${days} dias`
  return new Date(props.comment.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
})

function handleStartReply() {
  if ((props.level ?? 0) < 5) { localReplyingTo.value = props.comment.id; emit('start-reply', props.comment.id) }
}
function handleCancelReply() { localReplyingTo.value = null; emit('cancel-reply') }
function handleSubmitReply()   { emit('submit-reply', props.comment.id) }
function handleToggleReplies() { emit('toggle-replies', props.comment.id) }
function handleLoadMore()      { emit('load-more-replies', props.comment.id) }
function handleStartEdit()     { emit('start-edit', props.comment) }
function handleSaveEdit()      { emit('save-edit', props.comment.id, props.parentId) }
function handleCancelEdit()    { emit('cancel-edit') }
function handleDelete() {
  if (confirm('Tem certeza que deseja excluir este comentário?'))
    emit('delete-comment', props.comment.id, props.parentId)
}
function handleEditInput(e: Event)  { emit('update:edit-text', (e.target as HTMLTextAreaElement).value) }
function handleReplyInput(e: Event) { emit('update:reply-msg', (e.target as HTMLTextAreaElement).value) }
</script>

<template>
  <div :class="['comment-item', { 'reply': (level ?? 0) > 0 }]">
    <div class="flex items-start gap-3">
      <div
        class="w-9 h-9 flex-shrink-0 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold"
        :class="isMyComment ? 'from-[#079272] to-[#2464E8]' : 'from-[#555] to-[#888]'"
      >{{ userInitial }}</div>

      <div class="flex-1 min-w-0">
        <div class="flex items-baseline gap-2 mb-1.5 flex-wrap">
          <span class="text-[0.83rem] font-semibold text-[#111]">
            {{ authorName }}
            <span v-if="isMyComment" class="text-[0.65rem] font-medium text-[#079272] ml-1">(você)</span>
          </span>
          <span v-if="commentAuthor?.public_title && !isMyComment" class="text-[0.65rem] text-[#aaa]">{{ commentAuthor.public_title }}</span>
          <span class="text-[0.7rem] text-[#bbb]">{{ timeAgo }}</span>
        </div>

        <div v-if="isEditing">
          <textarea
            :value="editText" rows="2"
            class="w-full text-[0.85rem] p-2.5 bg-white border border-[#079272] rounded-lg resize-none outline-none text-[#111] focus:ring-2 focus:ring-[#079272]/10"
            @input="handleEditInput"
            @keydown.esc="handleCancelEdit"
          ></textarea>
          <div class="flex gap-2 mt-2">
            <button class="text-xs font-semibold px-3 py-1.5 bg-[#079272] text-white rounded-lg cursor-pointer hover:bg-[#068060] transition-colors border-none" @click="handleSaveEdit">Salvar</button>
            <button class="text-xs font-semibold px-3 py-1.5 bg-[#f7f5f0] text-[#666] rounded-lg cursor-pointer hover:bg-[#e8e4dc] transition-colors border-none" @click="handleCancelEdit">Cancelar</button>
          </div>
        </div>

        <p v-else class="text-[0.88rem] font-light text-[#555] leading-relaxed whitespace-pre-wrap break-words">{{ comment.message }}</p>

        <div class="flex items-center gap-3 mt-2.5 flex-wrap">
          <span class="flex items-center gap-1 text-[0.7rem] text-[#bbb]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {{ comment.likes_count ?? 0 }}
          </span>

          <button v-if="isAuthenticated && (level ?? 0) < 5"
            class="text-[0.7rem] text-[#bbb] hover:text-[#079272] transition-colors cursor-pointer border-none bg-transparent font-medium"
            @click="isReplying ? handleCancelReply() : handleStartReply()"
          >{{ isReplying ? 'Cancelar' : 'Responder' }}</button>

          <template v-if="isMyComment && !isEditing">
            <button class="text-[0.7rem] text-[#bbb] hover:text-[#111] transition-colors cursor-pointer border-none bg-transparent" @click="handleStartEdit">Editar</button>
            <button class="text-[0.7rem] text-[#bbb] hover:text-red-500 transition-colors cursor-pointer border-none bg-transparent" :class="{ 'opacity-40': isDeleting }" :disabled="isDeleting" @click="handleDelete">{{ isDeleting ? '...' : 'Excluir' }}</button>
          </template>

          <button v-if="hasReplies"
            class="flex items-center gap-1 text-[0.7rem] text-[#079272] hover:underline cursor-pointer border-none bg-transparent font-medium ml-auto"
            @click="handleToggleReplies">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline :points="replyState?.open ? '18 15 12 9 6 15' : '6 9 12 15 18 9'"/>
            </svg>
            {{ replyState?.open ? 'Ocultar' : `${comment.replies_count} respostas` }}
          </button>
        </div>

        <div v-if="isReplying" class="mt-3 flex gap-2.5">
          <div class="w-7 h-7 flex-shrink-0 rounded-full bg-gradient-to-br from-[#079272] to-[#2464E8] flex items-center justify-center text-white text-[0.62rem] font-bold">{{ currentUserInitial }}</div>
          <div class="flex-1 flex flex-col gap-1.5">
            <textarea :value="replyMsg" rows="2" :placeholder="`Responder a ${authorName}...`"
              class="w-full text-[0.83rem] font-light p-2.5 bg-white border border-[#e8e4dc] rounded-lg resize-none outline-none text-[#111] transition-colors focus:border-[#079272]"
              @input="handleReplyInput"></textarea>
            <div class="flex gap-2 self-end">
              <button class="text-[0.73rem] font-semibold px-4 py-1.5 bg-[#079272] text-white rounded-lg border-none cursor-pointer hover:bg-[#068060] transition-colors disabled:opacity-40 flex items-center gap-1.5"
                :disabled="!replyMsg.trim() || submittingReply" @click="handleSubmitReply">
                <svg v-if="submittingReply" class="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Responder
              </button>
              <button class="text-[0.73rem] font-semibold px-4 py-1.5 bg-[#f7f5f0] text-[#666] rounded-lg border-none cursor-pointer hover:bg-[#e8e4dc] transition-colors" @click="handleCancelReply">Cancelar</button>
            </div>
          </div>
        </div>

        <div v-if="replyState?.open" class="mt-4 ml-2 pl-4 border-l-2 border-[#f0ece5] hover:border-[#079272] transition-colors">
          <div v-if="replyState.loading" class="flex gap-2.5 animate-pulse py-2">
            <div class="w-7 h-7 rounded-full bg-[#f0ece5] flex-shrink-0"></div>
            <div class="flex-1 space-y-1.5">
              <div class="h-2.5 w-20 bg-[#f0ece5] rounded"></div>
              <div class="h-3 w-full bg-[#f0ece5] rounded"></div>
            </div>
          </div>
          <template v-else>
            <p v-if="replyState.data.length === 0" class="text-[0.8rem] text-[#999] py-2">Nenhuma resposta ainda.</p>
            <div v-for="reply in replyState.data" :key="reply.id" class="py-3">
              <FeedCommentItem
                :comment="reply" :replies-map="repliesMap"
                :editing-id="editingId" :edit-text="editText"
                :deleting-id="deletingId" :replying-to="replyingTo"
                :reply-msg="replyMsg" :submitting-reply="submittingReply"
                :is-authenticated="isAuthenticated" :current-user="currentUser"
                :level="(level ?? 0) + 1" :parent-id="comment.id"
                @toggle-replies="$emit('toggle-replies', $event)"
                @fetch-replies="$emit('fetch-replies', $event)"
                @load-more-replies="$emit('load-more-replies', $event)"
                @start-reply="$emit('start-reply', $event)"
                @submit-reply="$emit('submit-reply', $event)"
                @start-edit="$emit('start-edit', $event)"
                @save-edit="(id: any, parentId: any) => $emit('save-edit', id, parentId)"
                @cancel-edit="$emit('cancel-edit')"
                @delete-comment="(id: any, parentId: any) => $emit('delete-comment', id, parentId)"
                @update:edit-text="$emit('update:edit-text', $event)"
                @update:reply-msg="$emit('update:reply-msg', $event)"
                @cancel-reply="$emit('cancel-reply')"
              />
            </div>
            <button v-if="replyState.hasMore"
              class="text-[0.7rem] text-[#079272] hover:underline mt-2 cursor-pointer border-none bg-transparent font-medium"
              @click="handleLoadMore">Carregar mais respostas...</button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comment-item { transition: background-color 0.2s ease; }
.comment-item.reply { margin-left: 0.5rem; }
textarea:focus { box-shadow: 0 0 0 3px rgba(7,146,114,0.1); }
@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
@media (max-width: 640px) { .comment-item.reply { margin-left: 0.25rem; } }
</style>
