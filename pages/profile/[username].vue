<script setup lang="ts">
import type { UserPublicProfile, Post } from '~/types'
import { useAxios } from '~/composables/useAxios'

const route = useRoute()
const username = computed(() => route.params.username as string)

// Fetch user by username
const { data: user, pending, error, refresh } = await useAsyncData(
  `user-${username.value}`,
  async () => {
    const { get } = useAxios()
    const response = await get(`/users/username/${username.value}`)
    console.log('Raw user response:', response.data) // Debug
    
    // Handle possible nested structure: { data: {...} }
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data
    }
    return response.data
  },
  {
    watch: [username],
    immediate: true,
  }
)

// Extract user ID for posts (only if user exists)
const userId = computed(() => user.value?.id)

// Fetch user's approved posts
const { data: postsData, pending: postsPending, error: postsError } = await useAsyncData(
  `user-posts-${userId.value}`,
  async () => {
    if (!userId.value) return null
    const { get } = useAxios()
    const response = await get('/posts', {
      params: { user_id: userId.value, approved: true },
    })
    console.log('Raw posts response:', response.data) // Debug

    // Handle possible nested structure: { data: [...] }
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data
    }
    return response.data
  },
  {
    watch: [userId],
    immediate: true,
  }
)

// Derive posts array
const posts = computed(() => {
  if (!postsData.value) return []
  // If postsData.value is already an array (after unwrapping), return it
  if (Array.isArray(postsData.value)) return postsData.value
  // Otherwise, try to extract array from possible wrapper
  if (postsData.value && Array.isArray(postsData.value.data)) return postsData.value.data
  return []
})

// User initial for avatar fallback
const userInitial = computed(() => {
  if (user.value?.full_name) return user.value.full_name.charAt(0).toUpperCase()
  if (user.value?.username) return user.value.username.charAt(0).toUpperCase()
  return '?'
})

function formatDate(dateStr?: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-white to-gray-50">
    <!-- Animated background elements (same as other pages) -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div
        class="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-gradient-to-r from-[#079272]/20 to-[#2464E8]/20 blur-3xl"
        style="animation: float 15s ease-in-out infinite"
      ></div>
      <div
        class="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-gradient-to-r from-[#2464E8]/20 to-[#079272]/20 blur-3xl"
        style="animation: float 18s ease-in-out infinite reverse"
      ></div>
      <div class="absolute inset-0 opacity-5">
        <div
          class="absolute inset-0"
          style="
            background-image: linear-gradient(to right, #079272 1px, transparent 1px),
              linear-gradient(to bottom, #2464e8 1px, transparent 1px);
            background-size: 60px 60px;
          "
        ></div>
      </div>
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
        <!-- Hero Card -->
        <div class="bg-white border border-[#e8e4dc] rounded-3xl overflow-hidden">
          <!-- Cover gradient -->
          <div class="h-28 bg-gradient-to-r from-[#0c1b32] via-[#0d2a20] to-[#0c1b32] relative overflow-hidden">
            <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 20% 50%, #079272 0%, transparent 50%), radial-gradient(circle at 80% 50%, #2464E8 0%, transparent 50%)"></div>
            <div class="absolute inset-0 opacity-5" style="background-image: repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%); background-size: 12px 12px;"></div>
          </div>

          <div class="px-7 pb-7 mt-12">
            <div class="flex items-end gap-4 -mt-10 mb-5 flex-wrap">
              <!-- Avatar -->
              <div class="relative flex-shrink-0">
                <div class="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-[#079272] to-[#2464E8] flex items-center justify-center">
                  <img
                    v-if="user.profile_picture_url"
                    :src="user.profile_picture_url"
                    :alt="user.full_name || user.username"
                    class="w-full h-full object-cover"
                    @error="($event.target as HTMLImageElement).style.display='none'"
                  />
                  <span v-else class="text-3xl font-bold text-white">
                    {{ userInitial }}
                  </span>
                </div>
                <!-- Matching badge -->
                <div
                  v-if="user.matching"
                  class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white bg-[#FF6B35] flex items-center justify-center"
                  title="Match disponível"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/>
                  </svg>
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h1 class="text-xl font-bold text-[#111] tracking-[-0.02em] truncate">
                    {{ user.full_name || user.username }}
                  </h1>
                  <!-- Roles (tags) -->
                  <span
                    v-for="tag in user.tags"
                    :key="tag"
                    class="text-[0.68rem] font-semibold px-2.5 py-0.5 bg-[#f0faf7] border border-[#c5e8df] text-[#079272] rounded-full"
                  >
                    {{ tag }}
                  </span>
                  <!-- Public title (mini bio) -->
                  <span
                    v-if="user.public_title"
                    class="text-[0.7rem] font-medium px-2.5 py-0.5 bg-[#f7f5f0] border border-[#e8e4dc] text-[#666] rounded-full"
                  >
                    {{ user.public_title }}
                  </span>
                </div>
                <p class="text-[0.82rem] text-[#aaa] mt-0.5">@{{ user.username }}</p>
                <p v-if="user.bio" class="text-[0.8rem] text-[#777] mt-1.5 leading-relaxed">
                  {{ user.bio }}
                </p>
              </div>
            </div>

            <!-- Info row: location & socials -->
            <div class="flex flex-wrap items-center gap-4 text-[0.75rem] text-[#999] mb-4">
              <span v-if="user.location" class="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {{ user.location }}
              </span>
              <a
                v-if="user.instagram"
                :href="user.instagram"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-1.5 hover:text-[#079272] transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
                Instagram
              </a>
              <a
                v-if="user.linkedin"
                :href="user.linkedin"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-1.5 hover:text-[#079272] transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/>
                  <rect x="2" y="9" width="4" height="12"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
                LinkedIn
              </a>
            </div>

            <!-- Interests -->
            <div v-if="user.interests?.length" class="flex flex-wrap gap-1.5 mt-2">
              <span
                v-for="interest in user.interests"
                :key="interest"
                class="text-[0.68rem] font-medium px-2 py-0.5 bg-[#f0faf7] border border-[#c5e8df] text-[#079272] rounded-full"
              >
                #{{ interest }}
              </span>
            </div>
          </div>
        </div>

        <!-- Stats & Posts -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Stats Card -->
          <div class="bg-white border border-[#e8e4dc] rounded-2xl p-6 text-center">
            <div class="text-3xl font-bold text-[#111]">{{ user.posts_count }}</div>
            <div class="text-[0.72rem] text-[#aaa] mt-1">Publicações</div>
            <div class="mt-4 pt-4 border-t border-[#f7f5f0] text-[0.75rem] text-[#999]">
              Membro desde {{ formatDate(user.created_at) }}
            </div>
          </div>

          <!-- Posts List (2 columns on large screens) -->
          <div class="lg:col-span-2">
            <div class="bg-white border border-[#e8e4dc] rounded-2xl p-6">
              <h2 class="text-[0.88rem] font-bold text-[#111] tracking-[-0.01em] mb-4">
                Publicações
              </h2>

              <div v-if="postsPending" class="text-center py-8">
                <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#079272]"></div>
                <p class="mt-2 text-gray-600 text-sm">Carregando posts...</p>
              </div>

              <div v-else-if="postsError" class="text-center py-8 text-red-500 text-sm">
                Erro ao carregar posts.
              </div>

              <div v-else-if="!posts.length" class="text-center py-8 text-gray-500 text-sm">
                Este usuário ainda não publicou nada.
              </div>

              <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NuxtLink
                  v-for="post in posts"
                  :key="post.id"
                  :to="`/feed/${post.slug || post.id}`"
                  class="group block bg-white rounded-xl border border-[#e8e4dc] hover:border-[#079272] transition-all duration-200 overflow-hidden hover:shadow-md"
                >
                  <div v-if="post.cover_url" class="h-32 overflow-hidden">
                    <img
                      :src="post.cover_url"
                      :alt="post.title"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div class="p-4">
                    <h3 class="text-sm font-semibold text-[#111] line-clamp-2 mb-1">
                      {{ post.title }}
                    </h3>
                    <p v-if="post.excerpt" class="text-xs text-[#666] line-clamp-2">
                      {{ post.excerpt }}
                    </p>
                    <div class="flex items-center gap-2 mt-3 text-[0.65rem] text-[#aaa]">
                      <span class="flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                        </svg>
                        {{ post.likes_count || 0 }}
                      </span>
                      <span>{{ formatDate(post.created_at) }}</span>
                    </div>
                  </div>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>