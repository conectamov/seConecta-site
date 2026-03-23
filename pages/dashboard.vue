<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Dashboard — seConecta' })

const { get, patch, del } = useAxios()
const { currentUser } = useAuth()

const users        = ref<any[]>([])
const totalUsers   = ref(0)
const loading      = ref(true)
const error        = ref<string|null>(null)
const skip         = ref(0)
const LIMIT        = 20
const searchQuery  = ref('')
const permsOverride = ref<Record<string, any>>({})
const patching  = ref<Record<string, boolean>>({})
const deleting  = ref<Record<string, boolean>>({})
const confirmDeleteId = ref<any>(null)
const toast = ref<{ type: string; msg: string } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(type: string, msg: string) {
  toast.value = { type, msg }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.value = null, 3500)
}

async function fetchUsers(reset = true) {
  if (reset) { skip.value = 0; users.value = [] }
  loading.value = true; error.value = null
  try {
    const res  = await get('/api/v1/users/', { params: { skip: skip.value, limit: LIMIT } })
    const data = res.data.data ?? []
    totalUsers.value = res.data.count ?? 0
    if (reset) users.value = data
    else users.value.push(...data)
  } catch (e: any) {
    error.value = e?.response?.status === 403
      ? 'Sem permissão para acessar a lista de usuários.'
      : 'Erro ao carregar usuários.'
  } finally { loading.value = false }
}

async function loadMore() { skip.value += LIMIT; await fetchUsers(false) }
onMounted(() => fetchUsers())

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return users.value
  const q = searchQuery.value.trim().toLowerCase()
  return users.value.filter(u =>
    (u.full_name || '').toLowerCase().includes(q) ||
    (u.username  || '').toLowerCase().includes(q) ||
    (u.email     || '').toLowerCase().includes(q)
  )
})

function getPerm(userId: any, field: string) {
  return permsOverride.value[userId]?.[field] ??
    users.value.find(u => u.id === userId)?.[field] ?? false
}

function initial(u: any) {
  return (u.full_name || u.username || '?').charAt(0).toUpperCase()
}

async function togglePerm(user: any, field: string) {
  if (patching.value[user.id]) return
  if (user.id === currentUser.value?.id) { showToast('error', 'Você não pode alterar suas próprias permissões.'); return }
  const current = getPerm(user.id, field)
  const newVal  = !current
  if (!permsOverride.value[user.id]) permsOverride.value[user.id] = {}
  permsOverride.value[user.id][field] = newVal
  patching.value[user.id] = true
  try {
    await patch(`/api/v1/users/${user.id}`, { [field]: newVal })
    showToast('success', `${field === 'is_manager' ? 'Manager' : 'Superuser'} ${newVal ? 'ativado' : 'removido'} para @${user.username}.`)
  } catch (e: any) {
    permsOverride.value[user.id][field] = current
    const status = e?.response?.status
    showToast('error', status === 403 ? 'Sem permissão para alterar este usuário.' : 'Erro ao atualizar permissão.')
  } finally { patching.value[user.id] = false }
}

async function deleteUser(userId: any) {
  if (deleting.value[userId]) return
  confirmDeleteId.value = null; deleting.value[userId] = true
  try {
    await del(`/api/v1/users/${userId}`)
    users.value = users.value.filter(u => u.id !== userId)
    totalUsers.value = Math.max(0, totalUsers.value - 1)
    showToast('success', 'Usuário removido com sucesso.')
  } catch (e: any) {
    const status = e?.response?.status
    showToast('error', status === 403 ? 'Sem permissão para deletar.' : 'Erro ao remover usuário.')
  } finally { deleting.value[userId] = false }
}

const hasMore = computed(() => skip.value + LIMIT < totalUsers.value)
</script>

<template>
  <div class="min-h-screen bg-[#f7f5f0]">

    <div class="max-w-[1100px] mx-auto px-6 md:px-8 py-10">

      <!-- Page header -->
      <div class="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-2xl font-bold text-[#111] tracking-[-0.02em] mb-1">Gerenciar Usuários</h1>
          <p class="text-sm font-light text-[#888]">
            Controle permissões de manager e superuser.
            <span class="text-[#bbb]">·</span>
            <span class="font-medium text-[#555]">{{ totalUsers }} usuários no total</span>
          </p>
        </div>

        <!-- Stats cards -->
        <div class="flex gap-3">
          <div class="bg-white border border-[#e8e4dc] rounded-xl px-5 py-3 text-center">
            <div class="text-xl font-bold text-[#111]">{{ totalUsers }}</div>
            <div class="text-[0.65rem] uppercase tracking-[0.1em] text-[#bbb]">Total</div>
          </div>
          <div class="bg-white border border-[#e8e4dc] rounded-xl px-5 py-3 text-center">
            <div class="text-xl font-bold text-[#079272]">
              {{ Object.values(permsOverride).filter(p => p.is_manager).length }}
            </div>
            <div class="text-[0.65rem] uppercase tracking-[0.1em] text-[#bbb]">Managers</div>
          </div>
          <div class="bg-white border border-[#e8e4dc] rounded-xl px-5 py-3 text-center">
            <div class="text-xl font-bold text-[#2464E8]">
              {{ Object.values(permsOverride).filter(p => p.is_superuser).length }}
            </div>
            <div class="text-[0.65rem] uppercase tracking-[0.1em] text-[#bbb]">Superusers</div>
          </div>
        </div>
      </div>

      <!-- Busca -->
      <div class="relative mb-5">
        <svg class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nome, username ou e-mail..."
          class="w-full h-11 pl-11 pr-5 bg-white border border-[#e8e4dc] rounded-xl text-sm text-[#111] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all"
        />
      </div>

      <!-- Legenda -->
      <div class="flex items-center gap-6 mb-4 text-[0.72rem] text-[#888]">
        <span class="flex items-center gap-1.5">
          <span class="w-4 h-4 rounded bg-[#e8f5f2] border border-[#079272]/30 flex items-center justify-center">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#079272" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          Manager — acesso ao dashboard e gestão de usuários
        </span>
        <span class="flex items-center gap-1.5">
          <span class="w-4 h-4 rounded bg-[#eff2ff] border border-[#2464E8]/30 flex items-center justify-center">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#2464E8" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          Superuser — pode criar e deletar posts
        </span>
      </div>

      <!-- Erro -->
      <div v-if="error" class="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 mb-6 text-sm">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ error }}
        <button class="ml-auto text-sm font-semibold px-3 py-1 bg-red-100 rounded-lg hover:bg-red-200 transition-colors" @click="fetchUsers()">Tentar novamente</button>
      </div>

      <!-- Tabela -->
      <div class="bg-white border border-[#e8e4dc] rounded-2xl overflow-hidden shadow-sm">

        <!-- Header da tabela -->
        <div class="grid grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-4 px-6 py-3 bg-[#f7f5f0] border-b border-[#e8e4dc] text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[#aaa]">
          <span>Usuário</span>
          <span class="hidden md:block">E-mail</span>
          <span class="text-center">Manager</span>
          <span class="text-center">Superuser</span>
          <span></span>
        </div>

        <!-- Skeleton -->
        <template v-if="loading">
          <div v-for="i in 8" :key="i" class="grid grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-4 px-6 py-4 border-b border-[#f7f5f0] animate-pulse">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-[#f0ece5]"></div>
              <div class="space-y-1.5">
                <div class="h-3 w-28 bg-[#f0ece5] rounded"></div>
                <div class="h-2.5 w-20 bg-[#f0ece5] rounded"></div>
              </div>
            </div>
            <div class="h-3 w-36 bg-[#f0ece5] rounded hidden md:block"></div>
            <div class="w-12 h-7 bg-[#f0ece5] rounded-full mx-auto"></div>
            <div class="w-12 h-7 bg-[#f0ece5] rounded-full mx-auto"></div>
            <div class="w-8 h-8 bg-[#f0ece5] rounded-lg"></div>
          </div>
        </template>

        <!-- Vazio -->
        <div v-else-if="filteredUsers.length === 0 && !loading" class="flex flex-col items-center py-16 gap-3 text-center">
          <div class="w-12 h-12 rounded-2xl bg-[#f7f5f0] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <p class="text-sm text-[#888]">Nenhum usuário encontrado<span v-if="searchQuery"> para "{{ searchQuery }}"</span>.</p>
        </div>

        <!-- Linhas de usuários -->
        <template v-else>
          <div
            v-for="user in filteredUsers"
            :key="user.id"
            class="grid grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-4 px-6 py-4 border-b border-[#f7f5f0] last:border-0 hover:bg-[#fafaf9] transition-colors"
            :class="{ 'opacity-40': deleting[user.id] }"
          >
            <!-- Usuário -->
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center text-white text-sm font-bold"
                :class="user.id === currentUser?.id
                  ? 'bg-gradient-to-br from-[#079272] to-[#2464E8]'
                  : 'bg-gradient-to-br from-[#555] to-[#888]'"
              >
                {{ initial(user) }}
              </div>
              <div class="min-w-0">
                <div class="text-[0.85rem] font-semibold text-[#111] truncate flex items-center gap-1.5">
                  {{ user.full_name || user.username }}
                  <span v-if="user.id === currentUser?.id" class="text-[0.62rem] font-medium text-[#079272] shrink-0">(você)</span>
                </div>
                <div class="text-[0.72rem] text-[#aaa] truncate">@{{ user.username }}</div>
              </div>
            </div>

            <!-- Email -->
            <div class="hidden md:block text-[0.82rem] text-[#777] truncate">{{ user.email }}</div>

            <!-- Toggle Manager -->
            <div class="flex justify-center">
              <button
                class="relative w-11 h-6 rounded-full transition-all duration-200 border-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1"
                :class="[
                  getPerm(user.id, 'is_manager') ? 'bg-[#079272] focus:ring-[#079272]' : 'bg-[#e8e4dc] focus:ring-[#aaa]',
                  user.id === currentUser?.id ? 'opacity-40 cursor-not-allowed' : '',
                ]"
                :disabled="patching[user.id] || user.id === currentUser?.id"
                :title="user.id === currentUser?.id ? 'Não pode alterar suas próprias permissões' : ''"
                @click="togglePerm(user, 'is_manager')"
              >
                <!-- Loading spinner -->
                <svg v-if="patching[user.id]" class="absolute inset-0 m-auto animate-spin text-white" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                <!-- Thumb -->
                <span v-else class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
                  :class="getPerm(user.id, 'is_manager') ? 'translate-x-5' : 'translate-x-0'"
                ></span>
              </button>
            </div>

            <!-- Toggle Superuser -->
            <div class="flex justify-center">
              <button
                class="relative w-11 h-6 rounded-full transition-all duration-200 border-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1"
                :class="[
                  getPerm(user.id, 'is_superuser') ? 'bg-[#2464E8] focus:ring-[#2464E8]' : 'bg-[#e8e4dc] focus:ring-[#aaa]',
                  user.id === currentUser?.id ? 'opacity-40 cursor-not-allowed' : '',
                ]"
                :disabled="patching[user.id] || user.id === currentUser?.id"
                @click="togglePerm(user, 'is_superuser')"
              >
                <svg v-if="patching[user.id]" class="absolute inset-0 m-auto animate-spin text-white" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                <span v-else class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
                  :class="getPerm(user.id, 'is_superuser') ? 'translate-x-5' : 'translate-x-0'"
                ></span>
              </button>
            </div>

            <!-- Ações -->
            <div class="flex items-center justify-end">
              <!-- Confirmar delete -->
              <template v-if="confirmDeleteId === user.id">
                <div class="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                  <span class="text-[0.7rem] text-red-600 font-medium">Confirmar?</span>
                  <button
                    class="text-[0.7rem] font-semibold px-2 py-0.5 bg-red-500 text-white rounded cursor-pointer border-none hover:bg-red-600 transition-colors"
                    @click="deleteUser(user.id)"
                  >Sim</button>
                  <button
                    class="text-[0.7rem] text-red-400 hover:text-red-600 border-none bg-none cursor-pointer font-medium"
                    @click="confirmDeleteId = null"
                  >Não</button>
                </div>
              </template>
              <template v-else>
                <button
                  class="w-8 h-8 flex items-center justify-center rounded-lg text-[#ccc] hover:bg-red-50 hover:text-red-400 transition-all border-none bg-none cursor-pointer"
                  :class="{ 'opacity-40 cursor-not-allowed': user.id === currentUser?.id }"
                  :disabled="user.id === currentUser?.id || deleting[user.id]"
                  :title="user.id === currentUser?.id ? 'Não pode deletar sua própria conta aqui' : 'Remover usuário'"
                  @click="user.id !== currentUser?.id && (confirmDeleteId = user.id)"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </template>
            </div>
          </div>
        </template>
      </div>

      <!-- Paginação (load more) -->
      <div v-if="hasMore && !loading" class="flex justify-center mt-6">
        <button
          class="text-sm font-semibold px-8 py-3 border border-[#e8e4dc] bg-white text-[#666] rounded-xl hover:border-[#0d0d0d] hover:text-[#111] transition-all"
          @click="loadMore"
        >
          Carregar mais ({{ totalUsers - users.length }} restantes)
        </button>
      </div>

    </div>

    <Transition
      enter-from-class="opacity-0 translate-y-2"
      enter-active-class="transition-all duration-300"
      leave-to-class="opacity-0 translate-y-2"
      leave-active-class="transition-all duration-200"
    >
      <div
        v-if="toast"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium max-w-sm"
        :class="toast.type === 'success'
          ? 'bg-[#0d0d0d] text-white'
          : 'bg-red-600 text-white'"
      >
        <svg v-if="toast.type === 'success'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ toast.msg }}
      </div>
    </Transition>

  </div>
</template>
