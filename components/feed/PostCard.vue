<script setup lang="ts">
const props = defineProps<{ post: any; index: number }>()
const emit = defineEmits<{ read: [post: any] }>()

const { getUser, displayName, displayInitial } = useUserCache()

const liked = ref(false)
const likeCount = ref(props.post.likes_count ?? 0)
const saved = ref(false)
const postAuthor = ref<any>(null)

onMounted(async () => {
  if (props.post.author_id) postAuthor.value = await getUser(props.post.author_id)
})

function toggleLike(e: Event) {
  e.stopPropagation()
  liked.value = !liked.value
  likeCount.value += liked.value ? 1 : -1
}

const formattedDate = computed(() => {
  if (!props.post.created_at) return ''
  return new Date(props.post.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
})
const readTime = computed(() => {
  const src = props.post.content_md || props.post.excerpt || ''
  const words = src.trim().split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.ceil(words / 200))} min`
})
const authorName = computed(() => displayName(postAuthor.value))
const authorInitial = computed(() => displayInitial(postAuthor.value))
const visibleTags = computed(() => (props.post.tags ?? []).slice(0, 4))
</script>

<template>
  <article
    class="bg-white rounded-2xl border border-[#e8e4dc] cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] hover:border-[rgba(7,146,114,0.25)] group overflow-hidden"
    :class="post.cover_url ? 'grid md:grid-cols-[1fr_280px]' : ''"
    :style="{ animation: `cardIn 0.5s ease ${index * 0.07}s both` }"
    @click="emit('read', post)"
  >
    <div class="p-7 md:p-8 flex flex-col">
      <div class="flex items-center gap-3 mb-4 flex-wrap">
        <div class="w-7 h-7 flex-shrink-0 rounded-full bg-gradient-to-br from-[#079272] to-[#2464E8] flex items-center justify-center text-white text-[0.6rem] font-bold">{{ authorInitial }}</div>
        <div class="flex items-center gap-2 text-[0.7rem] text-[#bbb] flex-wrap">
          <span class="text-[0.75rem] font-medium text-[#555]">{{ authorName }}</span>
          <span class="text-[#e8e4dc]">·</span>
          <span class="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {{ formattedDate }}
          </span>
          <span class="text-[#e8e4dc]">·</span>
          <span class="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {{ readTime }} de leitura
          </span>
        </div>
        <span v-if="post.approved === false" class="ml-auto text-[0.62rem] font-semibold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600">Em análise</span>
      </div>
      <h2 class="text-[1.2rem] font-bold text-[#111] leading-snug tracking-[-0.02em] mb-3 transition-colors duration-200 group-hover:text-[#079272] line-clamp-2">{{ post.title }}</h2>
      <p v-if="post.excerpt" class="text-sm font-light text-[#777] leading-relaxed line-clamp-2 mb-4">{{ post.excerpt }}</p>
      <div v-if="visibleTags.length > 0" class="flex flex-wrap gap-1.5 mb-4">
        <span v-for="tag in visibleTags" :key="tag" class="text-[0.65rem] font-semibold px-2 py-0.5 bg-[#f7f5f0] border border-[#e8e4dc] text-[#888] rounded-full">#{{ tag }}</span>
        <span v-if="(post.tags?.length ?? 0) > 4" class="text-[0.65rem] text-[#bbb]">+{{ post.tags.length - 4 }}</span>
      </div>
      <div class="flex items-center justify-between mt-auto pt-4 border-t border-[#f5f3f0]">
        <div class="flex items-center gap-0.5">
          <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.75rem] text-[#bbb] border-none bg-transparent cursor-pointer transition-all hover:bg-[#f7f5f0] hover:text-[#333]" :class="{ '!text-red-500': liked }" @click="toggleLike">
            <svg width="14" height="14" viewBox="0 0 24 24" :fill="liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {{ likeCount }}
          </button>
          <span class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.75rem] text-[#bbb]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {{ post.comments_count ?? 0 }}
          </span>
          <button class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.75rem] border-none bg-transparent cursor-pointer transition-all hover:bg-[#f7f5f0]" :class="saved ? 'text-[#079272]' : 'text-[#bbb]'" @click.stop="saved = !saved">
            <svg width="14" height="14" viewBox="0 0 24 24" :fill="saved ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
        </div>
        <button class="flex items-center gap-1.5 px-4 py-2 bg-[#0d0d0d] text-white rounded-lg text-[0.75rem] font-semibold border-none cursor-pointer transition-all hover:bg-[#079272]" @click.stop="emit('read', post)">
          Ler <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>
    </div>
    <div v-if="post.cover_url" class="relative overflow-hidden min-h-[180px] md:order-last">
      <img :src="post.cover_url" :alt="post.title" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
    </div>
  </article>
</template>
<style scoped>
@keyframes cardIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
</style>
