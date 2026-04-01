<template>
  <div class="min-h-screen bg-gradient-to-b from-white to-gray-50">
    <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div
        class="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-gradient-to-r from-[#079272]/20 to-[#2464E8]/20 blur-3xl"
        style="animation: float 15s ease-in-out infinite"
      ></div>
      <div
        class="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-gradient-to-r from-[#2464E8]/20 to-[#079272]/20 blur-3xl"
        style="animation: float 18s ease-in-out infinite reverse"
      ></div>
    </div>

    <div class="max-w-[960px] mx-auto px-6 md:px-8 py-10">
      <div v-if="pending" class="text-center py-20">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#079272]"></div>
        <p class="mt-4 text-gray-600">Carregando perfil...</p>
      </div>

      <div v-else-if="error" class="text-center py-20">
        <p class="text-red-500">Erro ao carregar perfil. Tente novamente mais tarde.</p>
        <button
          @click="refresh"
          class="mt-4 px-6 py-2 bg-[#079272] text-white rounded-lg hover:bg-[#067a61] transition"
        >
          Tentar novamente
        </button>
      </div>

      <div v-else-if="!user" class="text-center py-20">
        <p class="text-gray-600">Usuário não encontrado.</p>
        <NuxtLink to="/" class="mt-4 inline-block px-6 py-2 text-[#079272] hover:underline">
          Voltar para a página inicial
        </NuxtLink>
      </div>

      <div v-else class="space-y-8" style="animation: fadeUp 0.6s ease both">
        <div class="bg-white border border-[#e8e4dc] rounded-3xl overflow-hidden">
          <div class="h-28 bg-gradient-to-r from-[#0c1b32] via-[#0d2a20] to-[#0c1b32] relative overflow-hidden">
            <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 20% 50%, #079272 0%, transparent 50%), radial-gradient(circle at 80% 50%, #2464E8 0%, transparent 50%)"></div>
          </div>

          <div class="px-7 pb-7 mt-12">
            <div class="flex items-end gap-4 -mt-10 mb-5 flex-wrap">
              <div class="relative flex-shrink-0">
                <div class="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-[#079272] to-[#2464E8] flex items-center justify-center">
                  <img
                    v-if="user.profile_picture_url"
                    :src="user.profile_picture_url"
                    :alt="user.full_name || user.username"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="text-3xl font-bold text-white">{{ userInitial }}</span>
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h1 class="text-xl font-bold text-[#111] tracking-[-0.02em] truncate">
                    {{ user.full_name || user.username }}
                  </h1>
                  <span v-for="tag in user.tags" :key="tag" class="text-[0.68rem] font-semibold px-2.5 py-0.5 bg-[#f0faf7] border border-[#c5e8df] text-[#079272] rounded-full">
                    {{ tag }}
                  </span>
                </div>
                <p class="text-[0.82rem] text-[#aaa] mt-0.5">@{{ user.username }}</p>
                <p v-if="user.bio" class="text-[0.8rem] text-[#777] mt-1.5 leading-relaxed">{{ user.bio }}</p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-4 text-[0.75rem] text-[#999] mb-4">
              <span v-if="user.location" class="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {{ user.location }}
              </span>
              <a v-if="user.linkedin" :href="user.linkedin" target="_blank" class="hover:text-[#079272]">LinkedIn</a>
              <a v-if="user.instagram" :href="user.instagram" target="_blank" class="hover:text-[#079272]">Instagram</a>
            </div>
          </div>
        </div>

        <div class="bg-white border border-[#e8e4dc] rounded-2xl p-6">
          <h2 class="text-[0.88rem] font-bold text-[#111] mb-4">Publicações</h2>

          <div v-if="postsPending" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#079272]"></div>
          </div>

          <div v-else-if="postsError" class="text-center py-8 text-red-500 text-sm">
            Erro ao carregar publicações.
          </div>

          <div v-else-if="!posts || posts.length === 0" class="text-center py-8 text-gray-500 text-sm">
            Este usuário ainda não publicou nada.
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NuxtLink
              v-for="post in posts"
              :key="post.id"
              :to="`/feed/${post.slug || post.id}`"
              class="group block bg-white rounded-xl border border-[#e8e4dc] hover:border-[#079272] transition-all overflow-hidden"
            >
              <div v-if="post.cover_url" class="h-32 overflow-hidden">
                <img :src="post.cover_url" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div class="p-4">
                <h3 class="text-sm font-semibold text-[#111] line-clamp-2">{{ post.title }}</h3>
                <div class="flex items-center gap-2 mt-3 text-[0.65rem] text-[#aaa]">
                  <span>{{ formatDate(post.created_at) }}</span>
                </div>
              </div>
            </NuxtLink>
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

// 1. Fetch User
const { data: user, pending, error, refresh } = await useAsyncData(
  `user-profile-${username.value}`,
  async () => {
    const response = await get(`/users/username/${username.value}`)
    // Unwrap if the backend wraps in { data: ... }
    return response.data?.data || response.data
  },
  { watch: [username] }
)

// 2. Fetch Posts (Depends on User ID)
const userId = computed(() => user.value?.id)

const { data: postsData, pending: postsPending, error: postsError } = await useAsyncData(
  `user-posts-${username.value}`, // Use username in key for stability
  async () => {
    if (!userId.value) return []
    
    try {
      // NOTE: Added trailing slash to '/posts/' to match Swagger exactly
      const response = await get('/posts/', {
        params: { 
          author_id: userId.value, 
          approved: true 
        }
      })

      console.log('Posts Raw Response:', response.data)

      // Logic based on your Swagger image: response is likely a direct array
      if (Array.isArray(response.data)) return response.data
      if (response.data?.data && Array.isArray(response.data.data)) return response.data.data
      
      return []
    } catch (err) {
      console.error('Fetch posts error:', err)
      throw err
    }
  },
  { 
    watch: [userId], // Re-run when user info is finally loaded
    immediate: true 
  }
)

const posts = computed(() => postsData.value || [])

const userInitial = computed(() => {
  const name = user.value?.full_name || user.value?.username || '?'
  return name.charAt(0).toUpperCase()
})

function formatDate(dateStr?: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}
</script>