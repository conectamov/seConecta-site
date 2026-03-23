<script setup lang="ts">
const router = useRouter()
const route = useRoute()
const { currentUser, logout } = useAuth()
const { notifications, unreadCount, totalNotifs, notifMeta, notifTime, markAllRead, markOneRead, startPolling, stopPolling } = useNotifications()

const socialLinks = [
  { name: 'Instagram', icon: 'fa-brands fa-instagram', url: 'https://instagram.com/projetoseconecta', color: '#E4405F' },
  { name: 'YouTube', icon: 'fa-brands fa-youtube', url: '/', color: '#FF0000' },
]

const showProgramas = ref(false)
const showUserMenu = ref(false)
const showNotifs = ref(false)
const isMobileOpen = ref(false)
const showSocialInMobile = ref(false)
let programasTimer: ReturnType<typeof setTimeout> | null = null

function closeAll() {
  showProgramas.value = false
  showUserMenu.value = false
  showNotifs.value = false
  showSocialInMobile.value = false
}

function onDocClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('[data-menu]') && !target.closest('[data-social]')) closeAll()
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  startPolling()
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  stopPolling()
  if (programasTimer) clearTimeout(programasTimer)
})

watch(() => route.path, () => {
  isMobileOpen.value = false
  closeAll()
})

function hoverProgramas() { if (programasTimer) clearTimeout(programasTimer); showProgramas.value = true }
function leaveProgramas() { programasTimer = setTimeout(() => { showProgramas.value = false }, 180) }
function toggleProgramas() { showProgramas.value = !showProgramas.value; showUserMenu.value = false; showNotifs.value = false }

function handleLogout() {
  closeAll(); isMobileOpen.value = false
  logout()
  router.push('/login')
}

function go(path: string) {
  closeAll(); isMobileOpen.value = false
  router.push('/' + path)
}

function openNotifDropdown() {
  showNotifs.value = !showNotifs.value
  showUserMenu.value = false; showProgramas.value = false; showSocialInMobile.value = false
}

const userInitial = computed(() =>
  (currentUser.value?.full_name || currentUser.value?.username || '?').charAt(0).toUpperCase()
)

const isManager = computed(() =>
  currentUser.value?.is_manager || currentUser.value?.is_superuser
)

const isHidden = computed(() => ['/login', '/signup'].includes(route.path))
</script>

<template>
  <header v-if="!isHidden" class="w-full z-50 top-0">
    <div class="max-w-[1280px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">

      <button class="text-[1.6rem] font-bold tracking-[-0.03em] text-black bg-transparent border-none cursor-pointer flex-shrink-0 p-0" @click="go('')">
        <span class="bg-gradient-to-r from-[#079272] to-[#2464E8] bg-clip-text text-transparent">Se</span>Conecta<span class="text-[#079272]">.</span>
      </button>

      <nav class="hidden lg:flex items-center gap-1">
        <button class="text-[0.88rem] text-gray-600 font-medium hover:text-[#079272] transition-colors px-3 py-2 rounded-lg hover:bg-[#f7f5f0] border-none bg-transparent cursor-pointer" @click="go('sobre')">Sobre</button>

        <div class="relative" data-menu @mouseenter="hoverProgramas" @mouseleave="leaveProgramas">
          <button class="flex items-center gap-1 text-[0.88rem] text-gray-600 font-medium hover:text-[#079272] transition-colors px-3 py-2 rounded-lg hover:bg-[#f7f5f0] border-none bg-transparent cursor-pointer" :class="showProgramas && 'bg-[#f7f5f0] text-[#079272]'" @click.stop="toggleProgramas">
            Programas
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" :class="['transition-transform duration-200', showProgramas ? 'rotate-180' : '']"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <Transition enter-from-class="opacity-0 -translate-y-1 scale-95" enter-active-class="transition-all duration-150 origin-top" leave-to-class="opacity-0 -translate-y-1 scale-95" leave-active-class="transition-all duration-100 origin-top">
            <div v-if="showProgramas" class="absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 w-52 bg-white border border-[#e8e4dc] rounded-xl shadow-xl py-1.5 z-50">
              <div class="absolute -top-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-t border-l border-[#e8e4dc] rotate-45"></div>
              <button class="w-full text-left px-4 py-2.5 text-[0.83rem] text-gray-700 hover:bg-[#f7f5f0] hover:text-[#079272] transition-colors cursor-pointer bg-transparent border-none" @click="go('embaixadores'); showProgramas = false">Embaixadores</button>
              <div class="px-4 py-2.5 text-[0.8rem] text-[#bbb]">Em breve mais programas!</div>
            </div>
          </Transition>
        </div>

        <button class="text-[0.88rem] text-gray-600 font-medium hover:text-[#079272] transition-colors px-3 py-2 rounded-lg hover:bg-[#f7f5f0] border-none bg-transparent cursor-pointer" @click="go('equipe')">Equipe</button>
      </nav>

      <div class="flex items-center gap-1 md:gap-2">
        <button class="hidden lg:flex items-center gap-1.5 text-[0.85rem] font-semibold text-[#111] px-3.5 py-2 rounded-lg hover:bg-[#f7f5f0] transition-colors border-none bg-transparent cursor-pointer" @click="go('feed')">Feed</button>

        <button v-if="isManager" class="hidden md:flex items-center gap-1.5 text-[0.78rem] font-semibold text-[#079272] px-3 py-1.5 rounded-lg bg-[#079272]/10 hover:bg-[#079272]/20 transition-colors border-none cursor-pointer" @click="go('reviewFeed')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Review
        </button>

        <!-- Notificações -->
        <div class="relative" data-menu>
          <button class="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#f7f5f0] transition-colors border-none bg-transparent cursor-pointer" :class="showNotifs && 'bg-[#f7f5f0]'" @click.stop="openNotifDropdown" title="Notificações">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="unreadCount > 0 ? 'stroke-[#111]' : 'stroke-[#999]'">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span v-if="unreadCount > 0" class="absolute top-1 right-1 min-w-[16px] h-4 px-[3px] bg-red-500 text-white text-[0.55rem] font-bold rounded-full flex items-center justify-center leading-none">
              {{ unreadCount > 99 ? '99+' : unreadCount }}
            </span>
          </button>

          <Transition enter-from-class="opacity-0 translate-y-1 scale-95" enter-active-class="transition-all duration-150 origin-top-right" leave-to-class="opacity-0 translate-y-1 scale-95" leave-active-class="transition-all duration-100 origin-top-right">
            <div v-if="showNotifs" class="absolute right-0 top-[calc(100%+8px)] w-[340px] max-w-[calc(100vw-2rem)] bg-white border border-[#e8e4dc] rounded-2xl shadow-xl z-50 overflow-hidden">
              <div class="flex items-center justify-between px-4 py-3 border-b border-[#f7f5f0]">
                <div class="flex items-center gap-2">
                  <span class="text-[0.85rem] font-bold text-[#111]">Notificações</span>
                  <span v-if="unreadCount > 0" class="text-[0.65rem] font-semibold px-1.5 py-0.5 bg-red-50 text-red-500 rounded-full">{{ unreadCount }} nova{{ unreadCount > 1 ? 's' : '' }}</span>
                </div>
                <button v-if="unreadCount > 0" class="text-[0.72rem] text-[#079272] font-semibold hover:underline border-none bg-transparent cursor-pointer" @click="markAllRead">Marcar todas</button>
              </div>
              <div class="max-h-[360px] overflow-y-auto">
                <div v-if="notifications.length === 0" class="py-10 text-center">
                  <div class="w-10 h-10 mx-auto rounded-full bg-[#f7f5f0] flex items-center justify-center mb-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  </div>
                  <p class="text-[0.8rem] text-[#bbb]">Nenhuma notificação</p>
                </div>
                <button v-for="notif in notifications" :key="notif.id"
                  class="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-[#f7f5f0] transition-colors cursor-pointer border-none border-b border-[#f7f5f0] last:border-0"
                  :class="!notif.read && 'bg-[#f0faf7]'"
                  @click="markOneRead(notif); notif.post_id && (showNotifs = false)">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5" :style="{ background: notifMeta(notif.type).color + '18' }">
                    <svg v-if="notifMeta(notif.type).icon === 'heart'" width="13" height="13" viewBox="0 0 24 24" fill="none" :stroke="notifMeta(notif.type).color" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    <svg v-else-if="notifMeta(notif.type).icon === 'check'" width="13" height="13" viewBox="0 0 24 24" fill="none" :stroke="notifMeta(notif.type).color" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-[0.8rem] leading-snug" :class="notif.read ? 'text-[#666]' : 'text-[#111] font-medium'">{{ notif.message }}</p>
                    <p class="text-[0.68rem] text-[#bbb] mt-1">{{ notifTime(notif.created_at) }}</p>
                  </div>
                  <div v-if="!notif.read" class="flex-shrink-0 w-2 h-2 bg-[#079272] rounded-full mt-1.5"></div>
                </button>
              </div>
              <div v-if="totalNotifs > notifications.length" class="border-t border-[#f7f5f0] px-4 py-2.5">
                <button class="text-[0.75rem] text-[#079272] font-medium hover:underline border-none bg-transparent cursor-pointer w-full text-center" @click="go('notifications'); showNotifs = false">Ver todas as notificações</button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- User menu desktop -->
        <div class="relative hidden lg:block" data-menu>
          <button class="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-[#f7f5f0] transition-colors border-none bg-transparent cursor-pointer"
            @click.stop="showUserMenu = !showUserMenu; showNotifs = false; showProgramas = false">
            <div class="w-12 h-8 rounded-2xl overflow-hidden bg-gradient-to-br from-[#079272] to-[#2464E8] flex items-center justify-center">
              <img v-if="currentUser?.profile_picture_url" :src="currentUser.profile_picture_url" :alt="currentUser.full_name" class="w-full h-full object-cover" @error="($event.target as HTMLElement).style.display='none'" />
              <span v-else class="text-sm font-bold text-white">{{ userInitial }}</span>
            </div>
            <span class="hidden xl:block text-[0.83rem] font-medium text-[#111] max-w-[120px] truncate">{{ currentUser?.full_name || currentUser?.username }}</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2.5" :class="['transition-transform duration-200', showUserMenu ? 'rotate-180' : '']"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          <Transition enter-from-class="opacity-0 translate-y-1 scale-95" enter-active-class="transition-all duration-150 origin-top-right" leave-to-class="opacity-0 translate-y-1 scale-95" leave-active-class="transition-all duration-100 origin-top-right">
            <div v-if="showUserMenu" class="absolute right-0 top-[calc(100%+8px)] w-56 bg-white border border-[#e8e4dc] rounded-xl shadow-lg py-1.5 z-50">
              <div class="px-4 py-3 border-b border-[#f7f5f0]">
                <div class="text-[0.82rem] font-semibold text-[#111] truncate">{{ currentUser?.full_name || currentUser?.username }}</div>
                <div class="text-[0.7rem] text-[#aaa] truncate mt-0.5">@{{ currentUser?.username }}</div>
              </div>
              <button class="w-full flex items-center gap-2.5 px-4 py-2.5 text-[0.8rem] text-[#555] hover:bg-[#f7f5f0] transition-colors cursor-pointer bg-transparent border-none text-left" @click="go('perfil'); showUserMenu = false">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Meu perfil
              </button>
              <button class="w-full flex items-center gap-2.5 px-4 py-2.5 text-[0.8rem] text-[#555] hover:bg-[#f7f5f0] transition-colors cursor-pointer bg-transparent border-none text-left" @click="go('new-post'); showUserMenu = false">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Novo post
              </button>
              <button v-if="isManager" class="w-full flex items-center gap-2.5 px-4 py-2.5 text-[0.8rem] text-[#079272] hover:bg-[#f0faf7] transition-colors cursor-pointer bg-transparent border-none text-left" @click="go('reviewFeed'); showUserMenu = false">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Revisar posts
              </button>
              <div class="h-px bg-[#f7f5f0] mx-2 my-1"></div>
              <button class="w-full flex items-center gap-2.5 px-4 py-2.5 text-[0.8rem] text-red-500 hover:bg-red-50 transition-colors cursor-pointer bg-transparent border-none text-left" @click="handleLogout">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sair
              </button>
            </div>
          </Transition>
        </div>

        <!-- Redes sociais desktop -->
        <div class="hidden lg:flex items-center gap-1 mr-2">
          <a v-for="social in socialLinks" :key="social.name" :href="social.url" target="_blank" rel="noopener noreferrer"
            class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f7f5f0] transition-all duration-200 group" :title="social.name">
            <i :class="social.icon" class="text-lg transition-transform duration-200 group-hover:scale-110" :style="{ color: social.color }"></i>
          </a>
        </div>

        <!-- Mobile: social + hamburger -->
        <div class="flex items-center lg:hidden gap-1">
          <button class="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#f7f5f0] transition-colors border-none bg-transparent cursor-pointer"
            @click.stop="showSocialInMobile = !showSocialInMobile; closeAll()" data-social>
            <i class="fa-brands fa-instagram text-lg" style="color: #E4405F;"></i>
          </button>
          <button class="w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-lg hover:bg-[#f7f5f0] transition-colors border-none bg-transparent cursor-pointer flex-shrink-0"
            :aria-expanded="isMobileOpen" aria-label="Menu"
            @click.stop="isMobileOpen = !isMobileOpen; closeAll()">
            <span class="block w-5 h-[1.5px] bg-[#333] transition-all duration-300 origin-center" :class="isMobileOpen ? 'rotate-45 translate-y-[6.5px]' : ''"></span>
            <span class="block w-5 h-[1.5px] bg-[#333] transition-all duration-300" :class="isMobileOpen ? 'opacity-0 scale-x-0' : ''"></span>
            <span class="block w-5 h-[1.5px] bg-[#333] transition-all duration-300 origin-center" :class="isMobileOpen ? '-rotate-45 -translate-y-[6.5px]' : ''"></span>
          </button>

          <Transition enter-from-class="opacity-0 translate-y-1 scale-95" enter-active-class="transition-all duration-150 origin-top-right" leave-to-class="opacity-0 translate-y-1 scale-95" leave-active-class="transition-all duration-100 origin-top-right">
            <div v-if="showSocialInMobile" class="absolute right-16 top-14 bg-white border border-[#e8e4dc] rounded-xl shadow-lg py-2 px-1 z-50 flex gap-1" data-social>
              <a v-for="social in socialLinks" :key="social.name" :href="social.url" target="_blank" rel="noopener noreferrer"
                class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#f7f5f0] transition-all duration-200 group" :title="social.name" @click="showSocialInMobile = false">
                <i :class="social.icon" class="text-xl" :style="{ color: social.color }"></i>
              </a>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Mobile overlay -->
    <Transition enter-from-class="opacity-0" enter-active-class="transition-opacity duration-200" leave-to-class="opacity-0" leave-active-class="transition-opacity duration-200">
      <div v-if="isMobileOpen" class="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40" @click="isMobileOpen = false"></div>
    </Transition>

    <!-- Mobile drawer -->
    <Transition enter-from-class="translate-x-full" enter-active-class="transition-transform duration-300 ease-out" leave-to-class="translate-x-full" leave-active-class="transition-transform duration-250 ease-in">
      <aside v-if="isMobileOpen" class="lg:hidden fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 flex flex-col">
        <div class="px-5 pt-6 pb-4 bg-gradient-to-br from-[#0c1b32] to-[#0d2a20]">
          <div class="flex items-center justify-between mb-4">
            <span class="text-white/60 text-xs font-medium uppercase tracking-widest">Menu</span>
            <button class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center border-none cursor-pointer transition-colors" @click="isMobileOpen = false">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#079272] to-[#2464E8] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{{ userInitial }}</div>
            <div class="min-w-0">
              <div class="text-white font-semibold text-sm truncate">{{ currentUser?.full_name || currentUser?.username }}</div>
              <div class="text-white/50 text-xs truncate">@{{ currentUser?.username }}</div>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <nav class="px-3 py-3 space-y-0.5">
            <button @click="go('feed')" class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[0.88rem] font-medium text-[#333] hover:bg-[#f7f5f0] hover:text-[#079272] transition-colors border-none bg-transparent cursor-pointer text-left">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Feed
            </button>
            <button @click="go('perfil')" class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[0.88rem] font-medium text-[#333] hover:bg-[#f7f5f0] hover:text-[#079272] transition-colors border-none bg-transparent cursor-pointer text-left">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Meu perfil
            </button>
            <button @click="go('new-post')" class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[0.88rem] font-medium text-[#333] hover:bg-[#f7f5f0] hover:text-[#079272] transition-colors border-none bg-transparent cursor-pointer text-left">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Novo post
            </button>
            <div class="h-px bg-[#f7f5f0] my-2"></div>
            <button @click="go('sobre')" class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[0.88rem] font-medium text-[#555] hover:bg-[#f7f5f0] hover:text-[#079272] transition-colors border-none bg-transparent cursor-pointer text-left">Sobre</button>
            <button @click="go('embaixadores')" class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[0.88rem] font-medium text-[#555] hover:bg-[#f7f5f0] hover:text-[#079272] transition-colors border-none bg-transparent cursor-pointer text-left">Embaixadores</button>
            <button @click="go('equipe')" class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[0.88rem] font-medium text-[#555] hover:bg-[#f7f5f0] hover:text-[#079272] transition-colors border-none bg-transparent cursor-pointer text-left">Equipe</button>
          </nav>
        </div>

        <div class="p-4 border-t border-[#f7f5f0]">
          <button class="w-full flex items-center justify-center gap-2 py-2.5 text-[0.85rem] font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors border-none bg-transparent cursor-pointer" @click="handleLogout">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sair da conta
          </button>
        </div>
      </aside>
    </Transition>
  </header>
</template>
