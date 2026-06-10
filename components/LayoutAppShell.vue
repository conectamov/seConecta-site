<script setup lang="ts">
import brandMark from '~/assets/logo/seconecta-mark.png'
const route = useRoute()
const { currentUser, logout } = useAuth()

const sidebarOpen = ref(false)
const sidebarCollapsed = useState(
  'sidebar-collapsed',
  () => false
)

const preferencesReminderVisible = ref(false)

const userProfileType = computed(() => {
  return String(
    (currentUser.value as any)?.profile_type || ''
  ).toUpperCase()
})

const workspaceLabel = computed(() => {
  if (userProfileType.value === 'MENTOR') {
    return 'Painel de mentoria'
  }

  if (userProfileType.value === 'EDUCATOR') {
    return 'Painel da comunidade'
  }

  if (userProfileType.value === 'ORGANIZATION') {
    return 'Painel da comunidade'
  }

  return 'Jornada do estudante'
})

const navigationSections = [
  {
    label: 'Explorar',
    items: [
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
        label: 'Feed',
        to: '/feed',
        icon: '📰',
      },
    ],
  },

  {
    label: 'Minha jornada',
    items: [
      {
        label: 'Minha rotina',
        to: '/calendario',
        icon: '📅',
      },
      {
        label: 'Mentores',
        to: '/turmas',
        icon: '🫂',
      },
    ],
  },

  {
    label: 'Comunidade',
    items: [
      {
        label: 'Comunidade',
        to: '/comunidade',
        icon: '🧭',
        disabled: true,
      },
      {
        label: 'Embaixadores',
        to: '/embaixadores',
        icon: '🚀',
        disabled: true,
      },
    ],
  },
]

const userInitial = computed(() => {
  const name =
    currentUser.value?.full_name ||
    currentUser.value?.username ||
    currentUser.value?.email ||
    'S'

  return String(name)
    .trim()
    .charAt(0)
    .toUpperCase()
})

const userName = computed(() => {
  return (
    currentUser.value?.full_name ||
    currentUser.value?.username ||
    'Estudante'
  )
})

function isActive(to: string) {
  if (to === '/me') {
    return route.path === '/me'
  }

  return (
    route.path === to ||
    route.path.startsWith(`${to}/`)
  )
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
      :class="{
        'app-sidebar--open': sidebarOpen,
        'app-sidebar--collapsed': sidebarCollapsed
      }"
    >
      <div class="sidebar-brand">
        <NuxtLink
          to="/me"
          class="brand-link"
          @click="closeMobileSidebar"
        >
          <div class="brand-mark">
            <img
              :src="brandMark"
              alt="seConecta"
              class="brand-mark__image"
            >
          </div>

          <Transition name="sidebar-fade">
            <div
              v-if="!sidebarCollapsed"
              class="brand-copy"
            >
              <strong>seConecta</strong>
              <span>{{ workspaceLabel }}</span>
            </div>
          </Transition>
        </NuxtLink>

        <div class="sidebar-brand__actions">
          <button
            type="button"
            class="sidebar-collapse"
            @click="
              sidebarCollapsed =
                !sidebarCollapsed
            "
          >
            {{ sidebarCollapsed ? '→' : '←' }}
          </button>

          <button
            type="button"
            class="sidebar-close"
            aria-label="Fechar menu"
            @click="sidebarOpen = false"
          >
            ×
          </button>
        </div>
      </div>

      <button class="command-button">
        <span>⌘K</span>

        <Transition name="sidebar-fade">
          <strong v-if="!sidebarCollapsed">
            Buscar algo...
          </strong>
        </Transition>
      </button>

      <nav
        class="sidebar-sections"
        aria-label="Navegação principal"
      >
        <section
          v-for="section in navigationSections"
          :key="section.label"
          class="sidebar-section"
        >
          <Transition name="sidebar-fade">
            <p
              v-if="!sidebarCollapsed"
              class="sidebar-section__label"
            >
              {{ section.label }}
            </p>
          </Transition>

          <div class="sidebar-nav">
            <NuxtLink
              v-for="link in section.items"
              :key="link.to"
              :to="
                link.disabled
                  ? route.fullPath
                  : link.to
              "
              class="sidebar-link"
              :class="{
                'sidebar-link--active':
                  !link.disabled &&
                  isActive(link.to),

                'sidebar-link--disabled':
                  link.disabled,
              }"
              @click="closeMobileSidebar"
            >
              <span class="sidebar-link__icon">
                {{ link.icon }}
              </span>

              <Transition name="sidebar-fade">
                <div
                  v-if="!sidebarCollapsed"
                  class="sidebar-link__content"
                >
                  <span>
                    {{ link.label }}
                  </span>

                  <small v-if="link.disabled">
                    em breve
                  </small>
                </div>
              </Transition>
            </NuxtLink>
          </div>
        </section>
      </nav>
      <!--
      <Transition name="sidebar-fade">
        <section
          v-if="!sidebarCollapsed"
          class="journey-card"
        >
          <span class="journey-card__label">
            Seu foco atual
          </span>

          <strong>
            🏅 OBMEP Nível 2
          </strong>

          <div class="journey-progress">
            <div
              class="journey-progress__fill"
              style="width: 72%"
            />
          </div>

          <span class="journey-card__hint">
            Próximo passo:
            geometria intermediária
          </span>
        </section>
      </Transition>

      <UserPreferencesSidebarReminder
        v-if="!sidebarCollapsed"
        @visible-change="
          preferencesReminderVisible = $event
        "
      />
    -->

      <!--
      <section
        class="sidebar-card sidebar-card--nexo"
        :class="{
          'sidebar-card--compact':
            preferencesReminderVisible,
          'sidebar-card--collapsed':
            sidebarCollapsed
        }"
      >
        <div class="sidebar-card__icon">
          🤖
        </div>

        <Transition name="sidebar-fade">
          <div v-if="!sidebarCollapsed">
            <p>Nexo</p>

            <strong>
              Continue sua jornada
            </strong>

            <span>
              Quer uma recomendação para
              estudar hoje?
            </span>
          </div>
        </Transition>

        <NuxtLink
          to="/nexo"
          class="nexo-button"
          @click="closeMobileSidebar"
        >
          <span v-if="sidebarCollapsed">
            ✨
          </span>

          <span v-else>
            Perguntar ao Nexo
          </span>
        </NuxtLink>
      </section>
    -->

      <div class="sidebar-user">
        <NuxtLink
          to="/perfil"
          class="sidebar-user__profile"
          @click="closeMobileSidebar"
        >
          <div class="user-avatar">
            <img
              v-if="
                currentUser?.profile_picture_url
              "
              :src="
                currentUser.profile_picture_url
              "
              :alt="userName"
            >

            <span v-else>
              {{ userInitial }}
            </span>
          </div>

          <Transition name="sidebar-fade">
            <div
              v-if="!sidebarCollapsed"
              class="sidebar-user__copy"
            >
              <strong>
                {{ userName }}
              </strong>

              <span>
                Ver perfil
              </span>
            </div>
          </Transition>
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
    radial-gradient(
      circle at top left,
      rgba(7, 146, 114, .08),
      transparent 32rem
    ),
    #fafaf9;

  color: #1c1917;

  display: flex;
  align-items: stretch;

  width: 100%;
}

.app-sidebar {
  width: 280px;
  min-width: 280px;

  position: sticky;
  top: 0;

  height: 100vh;

  padding: 18px 14px;

  background:
    rgba(255,255,255,.74);

  backdrop-filter: blur(24px);

  border-right:
    1px solid rgba(0,0,0,.05);

  display: flex;
  flex-direction: column;
  gap: 14px;

  overflow-y: auto;
  overflow-x: hidden;

  transition:
    width .22s cubic-bezier(.22,1,.36,1),
    min-width .22s cubic-bezier(.22,1,.36,1);
}

.app-sidebar--collapsed {
  width: 88px;
  min-width: 88px;
}

.app-content {
  flex: 1;
  min-width: 0;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 10px;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 12px;

  text-decoration: none;
  color: inherit;
}

.brand-mark {
  width: 42px;
  height: 42px;

  border-radius: 14px;

  background:
    linear-gradient(
      135deg,
      #079272,
      #0da790
    );

  color: white;

  display: grid;
  place-items: center;

  font-size: 1.1rem;
  font-weight: 950;

  box-shadow:
    0 10px 28px rgba(7,146,114,.18);

  flex-shrink: 0;
}

.brand-copy strong {
  display: block;

  font-size: .95rem;
  color: #111;
}

.brand-copy span {
  display: block;

  margin-top: 2px;

  font-size: .72rem;
  color: #888;
}

.sidebar-brand__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sidebar-collapse,
.sidebar-close {
  border: none;

  width: 32px;
  height: 32px;

  border-radius: 999px;

  background: #f5f5f4;

  cursor: pointer;

  color: #666;

  transition:
    background .15s ease,
    transform .15s ease;
}

.sidebar-collapse:hover,
.sidebar-close:hover {
  background: #ece7df;
  transform: translateY(-1px);
}

.sidebar-close {
  display: none;
}

.command-button {
  width: 100%;

  border: 1px solid rgba(0,0,0,.05);

  background: rgba(255,255,255,.9);

  border-radius: 16px;

  padding: 11px 12px;

  display: flex;
  align-items: center;
  gap: 10px;

  cursor: pointer;

  transition:
    background .15s ease,
    transform .18s ease;
}

.command-button:hover {
  background: white;
  transform: translateY(-1px);
}

.command-button span {
  width: 30px;
  height: 30px;

  border-radius: 10px;

  background: #f5f5f4;

  display: grid;
  place-items: center;

  font-size: .72rem;
  font-weight: 900;

  color: #666;
}

.command-button strong {
  color: #666;
  font-size: .8rem;
}

.sidebar-sections {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-section__label {
  margin: 0 10px;

  color: #9a948b;

  font-size: .68rem;
  font-weight: 950;

  text-transform: uppercase;
  letter-spacing: .12em;
}

.sidebar-nav {
  display: grid;
  gap: 4px;
}

.sidebar-link {
  position: relative;

  border-radius: 16px;

  padding: 11px 12px;

  display: flex;
  align-items: center;
  gap: 12px;

  text-decoration: none;

  color: #5f5a54;

  transition:
    transform .22s cubic-bezier(.22,1,.36,1),
    background .18s ease,
    color .18s ease,
    box-shadow .18s ease;
}

.sidebar-link:hover {
  transform: translateX(3px);

  background: rgba(255,255,255,.9);

  color: #111;
}

.sidebar-link--active {
  background:
    linear-gradient(
      135deg,
      rgba(7,146,114,.14),
      rgba(13,167,144,.08)
    );

  color: #065f46;

  border:
    1px solid rgba(7,146,114,.08);

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.65),
    0 4px 14px rgba(7,146,114,.08);
}

.sidebar-link__icon {
  width: 24px;

  display: inline-grid;
  place-items: center;

  flex-shrink: 0;
}

.sidebar-link__content {
  display: flex;
  flex-direction: column;
}

.sidebar-link__content span {
  font-size: .84rem;
  font-weight: 850;
}

.sidebar-link__content small {
  color: #999;

  font-size: .62rem;

  margin-top: 2px;
}

.sidebar-link--disabled {
  opacity: .6;
}

.journey-card {
  margin-top: 6px;

  border:
    1px solid rgba(0,0,0,.05);

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.9),
      rgba(255,255,255,.72)
    );

  border-radius: 20px;

  padding: 14px;

  display: flex;
  flex-direction: column;
  gap: 10px;
}

.journey-card__label {
  color: #9a948b;

  font-size: .66rem;
  font-weight: 950;

  text-transform: uppercase;
  letter-spacing: .12em;
}

.journey-card strong {
  color: #111;
  font-size: .9rem;
}

.journey-card__hint {
  color: #777;
  font-size: .73rem;
}

.journey-progress {
  height: 8px;

  border-radius: 999px;

  overflow: hidden;

  background: #ece7df;
}

.journey-progress__fill {
  height: 100%;

  border-radius: inherit;

  background:
    linear-gradient(
      90deg,
      #079272,
      #0da790
    );
}

.sidebar-card {
  border:
    1px solid rgba(0,0,0,.05);

  background:
    linear-gradient(
      135deg,
      rgba(236,253,245,.95),
      rgba(255,255,255,.8)
    );

  border-radius: 20px;

  padding: 13px;

  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-card--collapsed {
  align-items: center;
}

.sidebar-card__icon {
  width: 34px;
  height: 34px;

  border-radius: 12px;

  background: #d9f4e8;

  display: grid;
  place-items: center;
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

  font-size: .84rem;

  margin-bottom: 4px;
}

.sidebar-card span {
  color: #777;

  font-size: .74rem;

  line-height: 1.4;
}

.nexo-button {
  width: 100%;

  border-radius: 14px;

  padding: 10px 12px;

  background:
    linear-gradient(
      135deg,
      #079272,
      #0da790
    );

  color: white;

  font-size: .8rem;
  font-weight: 900;

  display: grid;
  place-items: center;

  text-decoration: none;

  transition:
    transform .18s ease,
    box-shadow .18s ease;
}

.nexo-button:hover {
  transform: translateY(-1px);

  box-shadow:
    0 10px 24px rgba(7,146,114,.18);
}

.sidebar-user {
  margin-top: auto;

  border:
    1px solid rgba(0,0,0,.05);

  background:
    rgba(255,255,255,.8);

  border-radius: 18px;

  padding: 9px;

  display: flex;
  align-items: center;
  gap: 8px;
}

.sidebar-user__profile {
  flex: 1;

  display: flex;
  align-items: center;
  gap: 10px;

  text-decoration: none;
  color: inherit;
}

.user-avatar {
  width: 38px;
  height: 38px;

  border-radius: 999px;

  overflow: hidden;

  background: #0f172a;

  color: white;

  display: grid;
  place-items: center;

  font-weight: 900;

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
}

.sidebar-user span {
  color: #999;

  font-size: .68rem;
}

.logout-button {
  border: none;

  width: 32px;
  height: 32px;

  border-radius: 999px;

  background: #f5f5f4;

  color: #777;

  cursor: pointer;

  transition:
    transform .18s ease,
    background .18s ease;
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

.sidebar-fade-enter-active,
.sidebar-fade-leave-active {
  transition:
    opacity .12s ease,
    transform .12s ease;
}

.sidebar-fade-enter-from,
.sidebar-fade-leave-to {
  opacity: 0;
  transform: translateX(-4px);
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

    z-index: 80;

    width: 42px;
    height: 42px;

    border:
      1px solid rgba(0,0,0,.06);

    border-radius: 999px;

    background: white;

    box-shadow:
      0 10px 30px rgba(0,0,0,.08);
  }

  .sidebar-backdrop {
    display: block;

    position: fixed;
    inset: 0;

    background: rgba(0,0,0,.35);

    z-index: 55;

    backdrop-filter: blur(3px);
  }

  .app-sidebar {
    position: fixed;

    inset: 0 auto 0 0;

    width: min(
      290px,
      calc(100vw - 42px)
    );

    min-width: unset;

    transform: translateX(-105%);

    transition:
      transform .22s cubic-bezier(.22,1,.36,1);
  }

  .app-sidebar--collapsed {
    width: min(
      290px,
      calc(100vw - 42px)
    );

    min-width: unset;
  }

  .app-sidebar--open {
    transform: translateX(0);
  }

  .sidebar-close {
    display: grid;
    place-items: center;
  }

  .sidebar-collapse {
    display: none;
  }
}
</style>