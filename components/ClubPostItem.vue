<script setup lang="ts">
const props = defineProps<{
  post: any
  canManage: boolean
  currentUserId?: string
}>()

const emit = defineEmits<{
  delete: [postId: string]
}>()

const isMyPost = computed(() => props.post.authorId === props.currentUserId)

const displayName = computed(() => {
  const u = props.post.author
  if (!u) return 'Usuário'
  return u.fullName || u.username || 'Usuário'
})

const displayInitial = computed(() => displayName.value.charAt(0).toUpperCase())

const timeAgo = computed(() => {
  if (!props.post.createdAt) return ''
  const diff = Date.now() - new Date(props.post.createdAt).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'agora mesmo'
  if (mins < 60)  return `há ${mins} min`
  if (hours < 24) return `há ${hours}h`
  if (days < 30)  return `há ${days} dias`
  return new Date(props.post.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
})

const showDeleteConfirm = ref(false)

function confirmDelete() {
  showDeleteConfirm.value = false
  emit('delete', props.post.id)
}
</script>

<template>
  <div class="bg-white rounded-xl border border-[#e8e4dc] p-5 flex flex-col gap-3">
    <!-- Header -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3">
        <!-- Avatar -->
        <div class="w-9 h-9 flex-shrink-0 rounded-full overflow-hidden">
          <img
            v-if="post.author?.profilePictureUrl"
            :src="post.author.profilePictureUrl"
            :alt="displayName"
            class="w-full h-full object-cover"
          />
          <div
            v-else
            class="w-full h-full bg-gradient-to-br from-[#079272] to-[#2464E8] flex items-center justify-center text-white text-xs font-bold"
          >
            {{ displayInitial }}
          </div>
        </div>

        <div>
          <div class="text-[0.85rem] font-semibold text-[#111]">{{ displayName }}</div>
          <div class="text-[0.7rem] text-[#aaa]">{{ timeAgo }}</div>
        </div>
      </div>

      <!-- Badges -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <span
          v-if="post.isAnnouncement"
          class="text-[0.6rem] font-bold px-2 py-0.5 rounded-full bg-[#fff8e6] border border-[#f5d480] text-[#a07800]"
        >
          📢 Anúncio
        </span>
        <span
          v-if="post.isPinned"
          class="text-[0.6rem] font-bold px-2 py-0.5 rounded-full bg-[#f0faf7] border border-[#c5e8df] text-[#079272]"
        >
          📌 Fixado
        </span>

        <!-- Delete -->
        <button
          v-if="isMyPost || canManage"
          class="w-7 h-7 rounded-lg flex items-center justify-center text-[#bbb] hover:bg-red-50 hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer"
          @click="showDeleteConfirm = true"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Title -->
    <h4 v-if="post.title" class="text-[0.95rem] font-bold text-[#111] leading-snug">
      {{ post.title }}
    </h4>

    <!-- Content -->
    <p class="text-[0.88rem] font-light text-[#444] leading-relaxed whitespace-pre-wrap">{{ post.content }}</p>

    <!-- Delete confirm inline -->
    <Transition name="fade">
      <div
        v-if="showDeleteConfirm"
        class="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-lg p-3 mt-1"
      >
        <span class="text-[0.78rem] text-red-700">Excluir este post?</span>
        <div class="flex gap-2">
          <button
            class="text-[0.75rem] px-3 py-1 rounded-lg border border-[#e8e4dc] bg-white text-[#666] cursor-pointer hover:bg-[#f7f5f0] transition-colors"
            @click="showDeleteConfirm = false"
          >
            Cancelar
          </button>
          <button
            class="text-[0.75rem] px-3 py-1 rounded-lg bg-red-500 text-white cursor-pointer hover:bg-red-600 transition-colors border-none"
            @click="confirmDelete"
          >
            Excluir
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
