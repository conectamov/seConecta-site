<script setup lang="ts">
const route = useRoute()
const { currentUser, logout } = useAuth()

const sidebarOpen = ref(false)

const mainLinks = [
  {
    label: 'Início',
    to: '/me',
    icon: '⌂',
  },
  {
    label: 'Oportunidades',
    to: '/oportunidades',
    icon: '✦',
  },
  {
    label: 'Olimpíadas',
    to: '/olimpiadas',
    icon: '🏅',
  },
  {
    label: 'Calendário',
    to: '/calendario',
    icon: '◷',
  },
  {
    label: 'Feed',
    to: '/feed',
    icon: '≡',
  },
]

const secondaryLinks = [
  {
    label: 'Meu plano',
    to: '/me/plano',
    icon: '✓',
    disabled: true,
  },
  {
    label: 'Salvas',
    to: '/me/salvas',
    icon: '☆',
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

          <div>
            <strong>seConecta</strong>
            <span>Painel do estudante</span>
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

      <nav class="sidebar-nav">
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

      <nav class="sidebar-nav sidebar-nav--secondary">
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

          <span>
            {{ link.label }}
            <small v-if="link.disabled">em breve</small>
          </span>
        </NuxtLink>
      </nav>

      <section class="sidebar-card sidebar-card--saved">
        <div>
          <p>Salvas</p>
          <strong>Monte seu plano</strong>
          <span>Salve oportunidades para acompanhar prazos.</span>
        </div>
      </section>

      <UserPreferencesSidebarReminder />
      <section class="sidebar-card sidebar-card--nexo">
        <div>
          <p>Nexo</p>
          <strong>Precisa de direção?</strong>
          <span>Peça uma recomendação rápida.</span>
        </div>

        <NuxtLink to="/nexo" class="nexo-button" @click="closeMobileSidebar">
          Perguntar
        </NuxtLink>
      </section>

      <div class="sidebar-user">
        <NuxtLink to="/perfil" class="sidebar-user__profile" @click="closeMobileSidebar">
          <div class="user-avatar">
            <img
              v-if="currentUser?.profile_picture_url"
              :src="currentUser.profile_picture_url"
              :alt="userName"
            />

            <span v-else>{{ userInitial }}</span>
          </div>

          <div>
            <strong>{{ userName }}</strong>
            <span>Meu perfil</span>
          </div>
        </NuxtLink>

        <button
          type="button"
          class="logout-button"
          title="Sair"
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
  background: rgba(255, 255, 255, .86);
  backdrop-filter: blur(18px);
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 50;
  box-sizing: border-box;
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
  padding: 3px 4px 12px;
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
}

.sidebar-brand strong {
  display: block;
  color: #111;
  font-size: .95rem;
  letter-spacing: -.025em;
}

.sidebar-brand span {
  display: block;
  color: #999;
  font-size: .73rem;
  margin-top: 1px;
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
}

.sidebar-nav {
  display: grid;
  gap: 5px;
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
  transition: background .15s ease, color .15s ease, transform .15s ease;
}

.sidebar-link:hover {
  background: #f7f5f0;
  color: #111;
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
  width: 22px;
  color: currentColor;
  opacity: .9;
  flex-shrink: 0;
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

.sidebar-divider {
  height: 1px;
  background: #f0ece8;
  margin: 2px 4px;
}

.sidebar-card {
  border: 1px solid #e8e4dc;
  background: white;
  border-radius: 18px;
  padding: 14px;
}

.sidebar-card p {
  margin: 0 0 8px;
  color: #aaa;
  font-size: .68rem;
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

.sidebar-card--nexo {
  margin-top: auto;
  background: linear-gradient(135deg, #ecfdf5, #ffffff);
}

.nexo-button {
  margin-top: 13px;
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
}

.sidebar-user {
  border: 1px solid #e8e4dc;
  background: white;
  border-radius: 18px;
  padding: 9px;
  display: flex;
  align-items: center;
  gap: 8px;
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

.user-avatar--small {
  width: 30px;
  height: 30px;
  font-size: .78rem;
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