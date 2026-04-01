<template>
  <div class="min-h-screen bg-[#faf9f6] text-[#111]">
    <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#079272]/5 blur-[120px] animate-pulse"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#2464E8]/5 blur-[120px] animate-pulse" style="animation-delay: 2s"></div>
    </div>

    <div class="max-w-[1100px] mx-auto px-4 md:px-8 py-8">
      
      <div v-if="userPending" class="flex flex-col items-center justify-center py-32">
        <div class="w-12 h-12 border-4 border-[#079272]/20 border-t-[#079272] rounded-full animate-spin"></div>
        <p class="mt-4 text-gray-500 font-medium animate-pulse">Carregando perfil...</p>
      </div>

      <div v-else-if="userError" class="flex flex-col items-center justify-center py-32 text-center">
        <p class="text-red-500 font-bold text-lg mb-2">Ops! Não conseguimos carregar este perfil.</p>
        <button @click="refreshUser" class="px-6 py-2.5 bg-[#079272] hover:bg-[#067a61] text-white font-medium rounded-xl transition-colors">
          Tentar novamente
        </button>
      </div>

      <div v-else-if="user" class="space-y-6 animate-in fade-in duration-500">
        
        <div class="bg-white border border-[#e8e4dc] rounded-[32px] overflow-hidden shadow-sm">
          <div class="h-32 sm:h-40 bg-gradient-to-r from-[#0c1b32] via-[#1a3a32] to-[#0c1b32] relative">
            <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 20% 50%, #079272 0%, transparent 50%), radial-gradient(circle at 80% 50%, #2464E8 0%, transparent 50%)"></div>
          </div>

          <div class="px-6 md:px-10 pb-8">
            <div class="flex flex-col sm:flex-row gap-4 sm:gap-6 relative">
              
              <div class="flex-shrink-0 z-10 -mt-12 sm:-mt-16">
                <div class="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[24px] border-[6px] border-white shadow-xl bg-white mx-auto sm:mx-0">
                  <img v-if="user.profile_picture_url" :src="user.profile_picture_url" class="w-full h-full object-cover rounded-[18px]" />
                  <div v-else class="w-full h-full rounded-[18px] bg-gradient-to-br from-[#079272] to-[#2464E8] flex items-center justify-center text-4xl sm:text-5xl font-bold text-white">
                    {{ userInitial }}
                  </div>
                  <div v-if="user.matching" class="absolute -bottom-2 -right-2 bg-[#FF6B35] p-2 rounded-xl border-4 border-white shadow-md" title="Buscando conexões">
                    <svg class="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  </div>
                </div>
              </div>

              <div class="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 sm:pt-4">
                
                <div class="flex-1 min-w-0 text-center sm:text-left"> <h1 class="text-2xl sm:text-3xl font-black text-[#111] tracking-tight truncate" :title="user.full_name">
                    {{ user.full_name }}
                  </h1>
                  
                  <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                    <span v-if="user.public_title" class="text-[0.95rem] font-semibold text-[#444]">
                      {{ user.public_title }}
                    </span>
                    
                    <span v-if="user.public_title && user.tags?.length" class="text-gray-300 hidden sm:block">•</span>
                    
                    <span 
                      v-for="(tag, index) in user.tags" 
                      :key="tag" 
                      :class="['px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider rounded-md border', getTagColor(index)]"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>

                <div class="w-full sm:w-auto flex-shrink-0 mt-2 sm:mt-0">
                  <button 
                    @click="handleConnect"
                    class="w-full sm:w-auto px-8 py-2.5 bg-[#079272] hover:bg-[#057a5f] text-white font-bold rounded-xl shadow-lg shadow-[#079272]/20 transition-all hover:-translate-y-0.5"
                  >
                    Conectar
                  </button>
                </div>
              </div>

            </div>

            <div class="mt-8 flex flex-wrap items-center justify-center sm:justify-start gap-y-3 gap-x-6 text-sm text-[#666] border-t border-[#f0eee9] pt-6">
              <span class="flex items-center gap-1.5 font-medium text-[#444]">
                @{{ user.username }}
              </span>
              
              <span v-if="user.organization" class="flex items-center gap-1.5">
                <svg class="w-4 h-4 text-[#079272]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 14v6.5"/></svg>
                <span class="font-medium truncate max-w-[200px]">{{ user.organization }}</span>
              </span>

              <span v-if="user.location" class="flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                {{ user.location }}
              </span>

              <div class="flex items-center gap-3 w-full sm:w-auto sm:ml-auto justify-center sm:justify-end mt-2 sm:mt-0">
                <a v-if="user.linkedin" :href="user.linkedin" target="_blank" class="p-2 bg-[#f4f7fa] hover:bg-[#e1e9f0] rounded-xl transition-colors text-[#0a66c2]" title="LinkedIn">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
                <a v-if="user.instagram" :href="user.instagram" target="_blank" class="p-2 bg-[#fdf4f6] hover:bg-[#fae6eb] rounded-xl transition-colors" title="Instagram">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="ig-grad" x1="2.16" y1="21.83" x2="21.83" y2="2.16" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#f9ce34"/><stop offset="0.5" stop-color="#ee2a7b"/><stop offset="1" stop-color="#6228d7"/>
                      </linearGradient>
                    </defs>
                    <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div class="lg:col-span-4 space-y-6">
            <div class="bg-white border border-[#e8e4dc] rounded-[24px] p-7 shadow-sm">
              <h3 class="text-xs font-black uppercase text-[#079272] tracking-widest mb-4">Sobre</h3>
              <p class="text-[0.92rem] text-[#555] leading-relaxed italic">
                "{{ user.bio || 'Sem biografia disponível no momento.' }}"
              </p>
              
              <div class="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#f0eee9]">
                <div class="text-center p-3 bg-[#fbfbfa] rounded-2xl border border-[#f0eee9]">
                  <div class="text-2xl font-black text-[#111]">{{ user.posts_count || 0 }}</div>
                  <div class="text-[0.65rem] font-bold text-[#aaa] uppercase tracking-widest mt-1">Posts</div>
                </div>
                <div class="text-center p-3 bg-[#fbfbfa] rounded-2xl border border-[#f0eee9]">
                  <div class="text-2xl font-black text-[#111]">{{ user.comments_count || 0 }}</div>
                  <div class="text-[0.65rem] font-bold text-[#aaa] uppercase tracking-widest mt-1">Respostas</div>
                </div>
              </div>
            </div>

            <div v-if="user.interests?.length" class="bg-white border border-[#e8e4dc] rounded-[24px] p-7 shadow-sm">
              <h3 class="text-xs font-black uppercase text-[#079272] tracking-widest mb-4">Interesses</h3>
              <div class="flex flex-wrap gap-2">
                <span v-for="interest in user.interests" :key="interest" class="px-3 py-1.5 bg-[#f7f5f0] text-[#555] text-xs font-bold rounded-xl border border-[#e8e4dc]">
                  #{{ interest }}
                </span>
              </div>
            </div>
          </div>

          <div class="lg:col-span-8">
            <div class="bg-white border border-[#e8e4dc] rounded-[24px] p-7 shadow-sm min-h-[400px]">
              <h2 class="text-xl font-black text-[#111] mb-6">Últimas Publicações</h2>

              <div v-if="postsPending" class="flex justify-center py-16">
                <div class="w-8 h-8 border-4 border-[#079272]/20 border-t-[#079272] rounded-full animate-spin"></div>
              </div>

              <div v-else-if="!posts.length" class="flex flex-col items-center justify-center py-16 text-center">
                <div class="w-16 h-16 bg-[#f4f7fa] rounded-full flex items-center justify-center mb-4">
                  <svg class="w-8 h-8 text-[#cbd5e1]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
                </div>
                <p class="text-gray-500 font-medium">Este usuário ainda não publicou nada.</p>
              </div>

              <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <NuxtLink
                  v-for="post in posts"
                  :key="post.id"
                  :to="`/feed/${post.slug || post.id}`"
                  class="group flex flex-col bg-white border border-[#e8e4dc] rounded-2xl overflow-hidden hover:border-[#079272] hover:shadow-lg transition-all duration-300"
                >
                  <div class="relative h-36 bg-[#f0faf7] overflow-hidden">
                    <img v-if="post.cover_url" :src="post.cover_url" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div v-else class="w-full h-full flex items-center justify-center text-[#079272]/30 font-black text-xl">seConecta</div>
                  </div>
                  <div class="p-5 flex-1 flex flex-col">
                    <h3 class="text-[0.95rem] font-bold text-[#111] line-clamp-2 group-hover:text-[#079272] transition-colors mb-3">
                      {{ post.title }}
                    </h3>
                    <div class="mt-auto flex items-center justify-between text-[0.65rem] font-bold text-[#aaa] uppercase tracking-widest">
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

    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center px-4 bg-[#0c1b32]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div class="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
        <button @click="isModalOpen = false" class="absolute top-5 right-5 text-gray-400 hover:text-gray-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        
        <div class="w-16 h-16 bg-[#fff4e5] text-[#FF6B35] rounded-full flex items-center justify-center mb-6 mx-auto">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        
        <h3 class="text-xl font-black text-center text-[#111] mb-2">Verifique sua conta</h3>
        <p class="text-sm text-center text-[#555] mb-8 leading-relaxed">
          Para se conectar com outros membros, você precisa primeiro verificar sua conta pelo WhatsApp.
        </p>
        
        <button 
          @click="goToMyProfile"
          class="w-full py-3.5 bg-[#111] hover:bg-[#333] text-white font-bold rounded-xl transition-colors shadow-lg"
        >
          Ir para meu perfil
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { get } = useAxios() // Assumindo que você tem esse composable
const username = computed(() => route.params.username as string)

// ==========================================
// MOCK DO CURRENT USER (Substitua pela sua lógica de Auth)
// ==========================================
// Ex: const { user: currentUser } = useAuth()
const currentUser = ref({
  linked: false // Altere para true para testar o fluxo de sucesso
})

// Controle do Modal
const isModalOpen = ref(false)

// 1. Buscar Perfil Visitado
const { 
  data: userData, 
  pending: userPending, 
  error: userError, 
  refresh: refreshUser 
} = useAsyncData(
  `profile-${username.value}`,
  async () => {
    const res = await get(`/users/username/${username.value}`)
    return res.data?.data || res.data
  },
  { watch: [username], server: false }
)

const user = computed(() => userData.value)
const userId = computed(() => user.value?.id)

// 2. Buscar Posts
const { 
  data: postsData, 
  pending: postsPending 
} = useAsyncData(
  `posts-${username.value}`,
  async () => {
    if (!userId.value) return []
    try {
      const res = await get('/posts/', { params: { author_id: userId.value, approved: true } })
      return Array.isArray(res.data) ? res.data : (res.data?.data || [])
    } catch (e) {
      console.error("Posts error:", e)
      return []
    }
  },
  { watch: [userId], immediate: true, server: false }
)

const posts = computed(() => postsData.value || [])

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

const userInitial = computed(() => {
  const name = user.value?.full_name || user.value?.username || 'U'
  return name.charAt(0).toUpperCase()
})

// Definição das cores das tags (As 3 primeiras ganham destaque)
function getTagColor(index: number) {
  switch(index) {
    case 0: return 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]' // Azul
    case 1: return 'bg-[#fff7ed] text-[#ea580c] border-[#fed7aa]' // Laranja
    case 2: return 'bg-[#faf5ff] text-[#9333ea] border-[#e9d5ff]' // Roxo
    default: return 'bg-[#f0faf7] text-[#079272] border-[#c5e8df]' // Padrão seConecta
  }
}

function formatDate(d?: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Ação do Botão Conectar
function handleConnect() {
  if (!currentUser.value || !currentUser.value.linked) {
    isModalOpen.value = true // Abre o modal se não for linked
  } else {
    // Lógica para quando o usuário pode conectar (Inativa por enquanto)
    alert('Função de conexão em desenvolvimento!')
  }
}

function goToMyProfile() {
  isModalOpen.value = false
  router.push('/perfil') // Redireciona o usuário
}
</script>

<style scoped>
.animate-in {
  animation-fill-mode: both;
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>