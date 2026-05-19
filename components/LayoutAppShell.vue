<script setup lang="ts">
const route = useRoute()
const { currentUser, logout } = useAuth()

const sidebarOpen = ref(false)
const preferencesReminderVisible = ref(false)

const userProfileType = computed(() => {
  return String((currentUser.value as any)?.profile_type || '').toUpperCase()
})

const workspaceLabel = computed(() => {
  if (userProfileType.value === 'MENTOR') return 'Painel de mentoria'
  if (userProfileType.value === 'EDUCATOR') return 'Painel da comunidade'
  if (userProfileType.value === 'ORGANIZATION') return 'Painel da comunidade'
  return 'Jornada do estudante'
})

const mainLinks = [
  {
    label: 'Início',
    to: '/me',
    icon: '🏠',
  },
  {
    label: 'Oportunidades',
    to: '/oportunidades',
    icon: '✨',
  },
  {
    label: 'Olimpíadas',
    to: '/olimpiadas',
    icon: '🏅',
  },
  {
    label: 'Calendário',
    to: '/calendario',
    icon: '📅',
  },
  {
    label: 'Feed',
    to: '/feed',
    icon: '📰',
  },
]

const secondaryLinks = [
  {
    label: 'Minha jornada',
    to: '/me/plano',
    icon: '🧭',
    disabled: true,
  },
  {
    label: 'Salvas',
    to: '/me/salvas',
    icon: '🔖',
    disabled: true,
  },
]

const userInitial = computed(() => {
  const name =
    currentUser.value?.full_name ||
    currentUser.value?.username ||
    currentUser.value?.email ||
    'S'

  return String(name).trim().charAt(0).toUpperCase()
})

const userName = computed(() => {
  return (
    currentUser.value?.full_name ||
    currentUser.value?.username ||
    'Estudante'
  )
})

function isActive(to: string) {
  if (to === '/me') return route.path === '/me'
  return route.path === to || route.path.startsWith(`${to}/`)
}

function closeMobileSidebar() {
  sidebarOpen.value = false
}

async function handleLogout() {
  try {
    await logout?.()
  } finally {
    await navigateTo('/login')
  }
}
</script>

<template>
  <div class="app-shell">
    <button
      type="button"
      class="mobile-sidebar-button"
      aria-label="Abrir menu"
      @click="sidebarOpen = true"
    >
      ☰
    </button>

    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="sidebar-backdrop"
        @click="sidebarOpen = false"
      />
    </Transition>

    <aside
      class="app-sidebar"
      :class="{ 'app-sidebar--open': sidebarOpen }"
    >
      <div class="sidebar-brand">
        <NuxtLink to="/me" class="brand-link" @click="closeMobileSidebar">
          <div class="brand-mark">s</div>

          <div class="brand-copy">
            <strong>seConecta</strong>
            <span>{{ workspaceLabel }}</span>
          </div>
        </NuxtLink>

        <button
          type="button"
          class="sidebar-close"
          aria-label="Fechar menu"
          @click="sidebarOpen = false"
        >
          ×
        </button>
      </div>

      <nav class="sidebar-nav" aria-label="Navegação principal">
        <NuxtLink
          v-for="link in mainLinks"
          :key="link.to"
          :to="link.to"
          class="sidebar-link"
          :class="{ 'sidebar-link--active': isActive(link.to) }"
          @click="closeMobileSidebar"
        >
          <span class="sidebar-link__icon">{{ link.icon }}</span>
          <span>{{ link.label }}</span>
        </NuxtLink>
      </nav>

      <div class="sidebar-divider" />

      <nav class="sidebar-nav sidebar-nav--secondary" aria-label="Área pessoal">
        <NuxtLink
          v-for="link in secondaryLinks"
          :key="link.label"
          :to="link.disabled ? route.fullPath : link.to"
          class="sidebar-link"
          :class="{
            'sidebar-link--active': !link.disabled && isActive(link.to),
            'sidebar-link--disabled': link.disabled,
          }"
          @click="closeMobileSidebar"
        >
          <span class="sidebar-link__icon">{{ link.icon }}</span>

          <span class="sidebar-link__label">
            {{ link.label }}
            <small v-if="link.disabled">em breve</small>
          </span>
        </NuxtLink>
      </nav>

      <section
        v-if="!preferencesReminderVisible"
        class="sidebar-card sidebar-card--saved"
      >
        <div class="sidebar-card__icon">🔖</div>

        <div>
          <p>Salvas</p>
          <strong>Guarde oportunidades</strong>
          <span>Acompanhe prazos e monte sua jornada.</span>
        </div>
      </section>

      <UserPreferencesSidebarReminder
        @visible-change="preferencesReminderVisible = $event"
      />

      <section
        class="sidebar-card sidebar-card--nexo"
        :class="{ 'sidebar-card--compact': preferencesReminderVisible }"
      >
        <div class="sidebar-card__icon">🤖</div>

        <div>
          <p>Nexo</p>
          <strong>Precisa de direção?</strong>
          <span v-if="!preferencesReminderVisible">
            Peça uma recomendação rápida para seu momento.
          </span>
        </div>

        <NuxtLink to="/nexo" class="nexo-button" @click="closeMobileSidebar">
          Perguntar ao Nexo
        </NuxtLink>
      </section>

      <div class="sidebar-user">
        <NuxtLink to="/perfil" class="sidebar-user__profile" @click="closeMobileSidebar">
          <div class="user-avatar">
            <img
              v-if="currentUser?.profile_picture_url"
              :src="currentUser.profile_picture_url"
              :alt="userName"
            >

            <span v-else>{{ userInitial }}</span>
          </div>

          <div class="sidebar-user__copy">
            <strong>{{ userName }}</strong>
            <span>Ver perfil</span>
          </div>
        </NuxtLink>

        <button
          type="button"
          class="logout-button"
          title="Sair"
          aria-label="Sair"
          @click="handleLogout"
        >
          ↗
        </button>
      </div>
    </aside>

    <main class="app-content">
      <slot />
    </main>
  </div>

  <UserPreferencesOnboardingModal />
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(7, 146, 114, .075), transparent 32rem),
    #fafaf9;
  color: #1c1917;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  display: flex;
  align-items: stretch;
  width: 100%;
}

.app-sidebar {
  width: 270px;
  min-width: 270px;
  max-width: 270px;
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 22px 16px;
  border-right: 1px solid #e8e4dc;
  background: rgba(255, 255, 255, .88);
  backdrop-filter: blur(18px);
  display: flex;
  flex-direction: column;
  gap: 14px;
  z-index: 50;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
}

.app-sidebar::-webkit-scrollbar {
  width: 6px;
}

.app-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.app-sidebar::-webkit-scrollbar-thumb {
  background: #ddd6ce;
  border-radius: 999px;
}

.app-content {
  flex: 1;
  min-width: 0;
  width: calc(100% - 270px);
  box-sizing: border-box;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 3px 4px 10px;
  flex-shrink: 0;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 11px;
  text-decoration: none;
  color: inherit;
  min-width: 0;
}

.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: linear-gradient(135deg, #079272, #0DA790);
  color: white;
  display: grid;
  place-items: center;
  font-weight: 950;
  font-size: 1.15rem;
  flex-shrink: 0;
  box-shadow: 0 12px 28px rgba(7, 146, 114, .18);
}

.brand-copy {
  min-width: 0;
}

.sidebar-brand strong {
  display: block;
  color: #111;
  font-size: .95rem;
  letter-spacing: -.025em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-brand span {
  display: block;
  color: #888;
  font-size: .73rem;
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-close {
  display: none;
  border: none;
  background: #f5f5f4;
  color: #444;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  font-size: 1.2rem;
  cursor: pointer;
  flex-shrink: 0;
}

.sidebar-nav {
  display: grid;
  gap: 5px;
  flex-shrink: 0;
}

.sidebar-link {
  border: none;
  background: transparent;
  color: #5f5a54;
  border-radius: 14px;
  padding: 11px 12px;
  display: flex;
  align-items: center;
  gap: 11px;
  font-size: .84rem;
  font-weight: 850;
  cursor: pointer;
  text-align: left;
  text-decoration: none;
  transition:
    background .15s ease,
    color .15s ease,
    transform .15s ease;
}

.sidebar-link:hover {
  background: #f7f5f0;
  color: #111;
  transform: translateX(1px);
}

.sidebar-link--active {
  background: #0f172a;
  color: white;
}

.sidebar-link--active:hover {
  background: #0f172a;
  color: white;
}

.sidebar-link__icon {
  width: 23px;
  color: currentColor;
  opacity: .95;
  flex-shrink: 0;
  display: inline-grid;
  place-items: center;
}

.sidebar-link__label {
  min-width: 0;
}

.sidebar-link small {
  display: inline-flex;
  margin-left: 6px;
  color: #aaa;
  font-size: .64rem;
  font-weight: 850;
}

.sidebar-link--disabled {
  opacity: .65;
  cursor: default;
}

.sidebar-link--disabled:hover {
  transform: none;
}

.sidebar-divider {
  height: 1px;
  background: #f0ece8;
  margin: 1px 4px;
  flex-shrink: 0;
}

.sidebar-card {
  border: 1px solid #e8e4dc;
  background: white;
  border-radius: 18px;
  padding: 13px;
  display: grid;
  gap: 10px;
  flex-shrink: 0;
}

.sidebar-card__icon {
  width: 32px;
  height: 32px;
  border-radius: 13px;
  background: #f7f5f0;
  display: grid;
  place-items: center;
  font-size: .98rem;
}

.sidebar-card p {
  margin: 0 0 6px;
  color: #9a948b;
  font-size: .66rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .1em;
}

.sidebar-card strong {
  display: block;
  color: #111;
  font-size: .82rem;
  letter-spacing: -.015em;
  margin-bottom: 4px;
}

.sidebar-card span {
  display: block;
  color: #888;
  font-size: .73rem;
  line-height: 1.4;
}

.sidebar-card--saved {
  background: linear-gradient(135deg, #ffffff, #fafaf9);
}

.sidebar-card--saved .sidebar-card__icon {
  background: #fef3c7;
}

.sidebar-card--nexo {
  margin-top: auto;
  background: linear-gradient(135deg, #ecfdf5, #ffffff);
  border-color: #d9f4e8;
}

.sidebar-card--nexo .sidebar-card__icon {
  background: #d9f4e8;
}

.sidebar-card--compact {
  padding: 11px 12px;
  gap: 8px;
}

.sidebar-card--compact p {
  margin-bottom: 5px;
}

.nexo-button {
  width: 100%;
  border-radius: 12px;
  padding: 10px 12px;
  background: #079272;
  color: white;
  font-size: .8rem;
  font-weight: 900;
  text-decoration: none;
  display: grid;
  place-items: center;
  transition:
    background .15s ease,
    transform .15s ease;
}

.nexo-button:hover {
  background: #067f64;
  transform: translateY(-1px);
}

.sidebar-card--compact .nexo-button {
  padding: 8px 10px;
}

.sidebar-user {
  border: 1px solid #e8e4dc;
  background: white;
  border-radius: 18px;
  padding: 9px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.sidebar-user__profile {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 9px;
  color: inherit;
  text-decoration: none;
}

.sidebar-user__copy {
  min-width: 0;
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: #0f172a;
  color: white;
  display: grid;
  place-items: center;
  font-weight: 900;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sidebar-user strong {
  display: block;
  color: #111;
  font-size: .78rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 128px;
}

.sidebar-user span {
  display: block;
  color: #999;
  font-size: .68rem;
}

.logout-button {
  border: none;
  background: #f5f5f4;
  color: #777;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background .15s ease,
    color .15s ease,
    transform .15s ease;
}

.logout-button:hover {
  background: #fee2e2;
  color: #b91c1c;
  transform: translateY(-1px);
}

.mobile-sidebar-button {
  display: none;
}

.sidebar-backdrop {
  display: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .16s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-height: 760px) and (min-width: 1101px) {
  .app-sidebar {
    gap: 11px;
    padding-top: 16px;
    padding-bottom: 16px;
  }

  .sidebar-card {
    padding: 11px;
  }

  .sidebar-card span {
    font-size: .7rem;
  }

  .sidebar-link {
    padding-top: 10px;
    padding-bottom: 10px;
  }
}

@media (max-width: 1100px) {
  .app-shell {
    display: block;
  }

  .app-content {
    width: 100%;
  }

  .mobile-sidebar-button {
    display: grid;
    place-items: center;
    position: fixed;
    left: 14px;
    top: 14px;
    z-index: 70;
    width: 42px;
    height: 42px;
    border: 1px solid #e8e4dc;
    border-radius: 999px;
    background: white;
    color: #111;
    font-size: 1.15rem;
    cursor: pointer;
    box-shadow: 0 10px 30px rgba(0,0,0,.08);
  }

  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 55;
    background: rgba(0,0,0,.35);
    backdrop-filter: blur(2px);
  }

  .app-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: min(290px, calc(100vw - 42px));
    min-width: unset;
    max-width: unset;
    transform: translateX(-105%);
    transition: transform .18s ease;
    box-shadow: 22px 0 70px rgba(0,0,0,.16);
  }

  .app-sidebar--open {
    transform: translateX(0);
  }

  .sidebar-close {
    display: grid;
    place-items: center;
  }
}
</style>