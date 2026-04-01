<template>
  <div class="min-h-screen bg-[#faf9f6]">
    <div class="max-w-[1100px] mx-auto px-4 md:px-8 py-8">
      
      <div v-if="userPending" class="flex flex-col items-center justify-center py-32">
        <div class="w-12 h-12 border-4 border-[#079272]/20 border-t-[#079272] rounded-full animate-spin"></div>
        <p class="mt-4 text-gray-400 animate-pulse">Carregando perfil...</p>
      </div>

      <div v-else-if="userError" class="text-center py-20">
        <p class="text-red-500 font-medium">Ops! Não conseguimos carregar este perfil.</p>
        <button @click="refreshUser" class="mt-4 px-6 py-2 bg-[#079272] text-white rounded-xl">Tentar novamente</button>
      </div>

      <div v-else-if="user" class="space-y-6 animate-in fade-in duration-500">
        <div class="relative bg-white border border-[#e8e4dc] rounded-[32px] overflow-hidden shadow-sm">
          <div class="h-32 bg-gradient-to-r from-[#0c1b32] to-[#1a3a32]"></div>
          <div class="px-8 pb-8">
            <div class="relative flex flex-col md:flex-row md:items-end gap-6 -mt-12">
              <div class="w-32 h-32 rounded-[24px] border-[6px] border-white shadow-xl overflow-hidden bg-white">
                <img v-if="user.profile_picture_url" :src="user.profile_picture_url" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full bg-[#079272] flex items-center justify-center text-4xl font-bold text-white">
                  {{ userInitial }}
                </div>
              </div>
              <div class="flex-1">
                <div class="flex flex-wrap items-center gap-3">
                  <h1 class="text-2xl font-black text-[#111]">{{ user.full_name }}</h1>
                  <span v-for="tag in user.tags" :key="tag" class="px-3 py-1 bg-[#079272] text-white text-[0.65rem] font-black uppercase rounded-lg">
                    {{ tag }}
                  </span>
                </div>
                <p class="text-[#444] font-medium mt-1">{{ user.public_title }}</p>
                <p class="text-sm text-[#aaa]">@{{ user.username }} • {{ user.location }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-4 space-y-6">
            <div class="bg-white border border-[#e8e4dc] rounded-3xl p-6">
              <h3 class="text-xs font-black uppercase text-[#079272] mb-3">Sobre</h3>
              <p class="text-sm text-[#555] leading-relaxed">{{ user.bio || 'Sem bio.' }}</p>
              <div class="flex gap-4 mt-6 pt-6 border-t border-gray-50">
                <div><b class="block text-lg">{{ user.posts_count || 0 }}</b> <span class="text-[0.6rem] text-gray-400 uppercase">Posts</span></div>
                <div><b class="block text-lg">{{ user.comments_count || 0 }}</b> <span class="text-[0.6rem] text-gray-400 uppercase">Comentários</span></div>
              </div>
            </div>
          </div>

          <div class="lg:col-span-8">
            <div class="bg-white border border-[#e8e4dc] rounded-3xl p-6 min-h-[300px]">
              <h2 class="text-lg font-black mb-6">Publicações</h2>

              <div v-if="postsPending" class="flex justify-center py-10">
                <div class="w-6 h-6 border-2 border-[#079272]/20 border-t-[#079272] rounded-full animate-spin"></div>
              </div>

              <div v-else-if="!posts.length" class="text-center py-10">
                <p class="text-gray-400 text-sm">Este usuário ainda não postou nada.</p>
              </div>

              <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NuxtLink v-for="post in posts" :key="post.id" :to="`/feed/${post.slug || post.id}`" class="border rounded-2xl p-4 hover:border-[#079272] transition-colors">
                  <h4 class="font-bold text-sm line-clamp-2">{{ post.title }}</h4>
                  <p class="text-[0.7rem] text-gray-400 mt-2">{{ formatDate(post.created_at) }}</p>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { get } = useAxios()
const username = computed(() => route.params.username as string)

// 1. Fetch User (Non-blocking)
const { 
  data: userData, 
  pending: userPending, 
  error: userError, 
  refresh: refreshUser 
} = useAsyncData(
  `profile-${username.value}`,
  async () => {
    const res = await get(`/users/username/${username.value}`)
    // Look at your JSON structure: it might be direct or in .data
    return res.data?.data || res.data
  },
  { watch: [username], server: false }
)

const user = computed(() => userData.value)
const userId = computed(() => user.value?.id)

// 2. Fetch Posts (Depends on userId)
const { 
  data: postsData, 
  pending: postsPending 
} = useAsyncData(
  `posts-${username.value}`,
  async () => {
    if (!userId.value) return []
    
    try {
      // Trying the slash version as seen in Swagger
      const res = await get('/posts/', {
        params: { 
          author_id: userId.value, 
          approved: true 
        }
      })
      // If response is the array itself (as Swagger shows), return res.data
      return Array.isArray(res.data) ? res.data : (res.data?.data || [])
    } catch (e) {
      console.error("Posts error:", e)
      return []
    }
  },
  { 
    watch: [userId], 
    immediate: true, 
    server: false 
  }
)

const posts = computed(() => postsData.value || [])

const userInitial = computed(() => user.value?.full_name?.charAt(0) || 'U')

function formatDate(d?: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
</script>