<template>
  <div class="min-h-screen bg-gradient-to-b from-white to-gray-50">
    <!-- Animated background (same style as profile) -->
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
      <h1 class="text-2xl font-bold text-[#111] tracking-[-0.02em] mb-6">
        Explorar usuários
      </h1>

      <!-- Loading state -->
      <div v-if="pending" class="text-center py-20">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#079272]"></div>
        <p class="mt-4 text-gray-600">Carregando usuários...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center py-20">
        <p class="text-red-500">Erro ao carregar usuários. Tente novamente mais tarde.</p>
        <button
          @click="refresh"
          class="mt-4 px-6 py-2 bg-[#079272] text-white rounded-lg hover:bg-[#067a61] transition"
        >
          Tentar novamente
        </button>
      </div>

      <!-- No users -->
      <div v-else-if="!filteredUsers.length" class="text-center py-20">
        <p class="text-gray-600">Nenhum usuário ativo encontrado.</p>
      </div>

      <!-- User grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink
          v-for="user in filteredUsers"
          :key="user.id"
          :to="`/profile/${user.username}`"
          class="group block bg-white rounded-xl border border-[#e8e4dc] hover:border-[#079272] transition-all duration-200 overflow-hidden hover:shadow-md"
        >
          <div class="p-5">
            <!-- Avatar and name row -->
            <div class="flex items-center gap-3 mb-3">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-[#079272] to-[#2464E8] flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                <img
                  v-if="user.profile_picture_url"
                  :src="user.profile_picture_url"
                  :alt="user.full_name || user.username"
                  class="w-full h-full object-cover"
                  @error="($event.target as HTMLImageElement).style.display='none'"
                />
                <span v-else>{{ userInitial(user) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-[#111] truncate">{{ user.full_name || user.username }}</p>
                <p class="text-xs text-[#aaa]">@{{ user.username }}</p>
              </div>
            </div>

            <!-- Public title / bio -->
            <p v-if="user.public_title" class="text-xs font-medium text-[#079272] mb-1">
              {{ user.public_title }}
            </p>
            <p v-if="user.bio" class="text-sm text-[#666] line-clamp-2 mb-3">
              {{ user.bio }}
            </p>

            <!-- Location & stats -->
            <div class="flex items-center justify-between text-xs text-[#999]">
              <span v-if="user.location" class="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {{ user.location }}
              </span>
              <span class="flex items-center gap-2">
                <span>📝 {{ user.posts_count || 0 }}</span>
                <span>💬 {{ user.comments_count || 0 }}</span>
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Modal for unverified user -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="closeModal"
      >
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#e8e4dc]">
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-lg font-bold text-[#111]">Verifique sua conta</h3>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p class="text-gray-600 mb-6">
            Para aparecer na lista de usuários, você precisa completar sua verificação via WhatsApp.
            Isso ajuda a manter nossa comunidade segura.
          </p>
          <div class="flex gap-3">
            <button
              @click="closeModal"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Agora não
            </button>
            <NuxtLink
              to="/perfil"
              class="flex-1 px-4 py-2 bg-[#079272] text-white rounded-lg hover:bg-[#067a61] transition text-center"
            >
              Verificar agora
            </NuxtLink>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useAxios } from '~/composables/useAxios'
import { useAuth } from '~/composables/useAuth' // Adjust based on your auth composable

// Authentication guard: redirect if not logged in
const { user: currentUser, isLoggedIn } = useAuth()
if (!isLoggedIn.value) {
  navigateTo('/login')
}

// State for modal
const showModal = ref(false)

// Watch for current user and show modal if they are not linked
watch(
  () => currentUser.value,
  (user) => {
    if (user && user.linked === false) {
      showModal.value = true
    }
  },
  { immediate: true }
)

// Fetch all users (active only)
const { data: usersData, pending, error, refresh } = await useAsyncData(
  'active-users',
  async () => {
    const { get } = useAxios()
    const response = await get('/users', {
      params: { skip: 0, limit: 100 } // Adjust limit as needed
    })
    // API returns { data: [...], count: ... }
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data
    }
    return response.data
  },
  {
    server: false,
    immediate: true
  }
)

// Filter users: private_account === false AND linked === true
const filteredUsers = computed(() => {
  if (!usersData.value) return []
  if (!Array.isArray(usersData.value)) return []
  return usersData.value.filter(
    (user: any) => user.private_account === false && user.linked === true
  )
})

// Helper to get user initial
function userInitial(user: any) {
  const name = user.full_name || user.username
  return name ? name.charAt(0).toUpperCase() : '?'
}

function closeModal() {
  showModal.value = false
}
</script>

<style scoped>
@keyframes float {
  0%, 100% { transform: translateY(0px) translateX(0px); }
  33% { transform: translateY(-20px) translateX(20px); }
  66% { transform: translateY(20px) translateX(-20px); }
}
</style>