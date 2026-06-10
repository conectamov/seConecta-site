<template>
  <main class="classes-page">

    <!-- ─── Toast ─────────────────────────────────────────── -->
    <Transition name="toast">
      <div
        v-if="toast"
        class="toast"
        :class="`toast--${toast.tone}`"
        role="alert"
        aria-live="polite"
      >
        <div class="toast__icon" aria-hidden="true">{{ toast.icon }}</div>
        <div class="toast__body">
          <strong>{{ toast.title }}</strong>
          <p>{{ toast.text }}</p>
        </div>
        <button class="toast__close" aria-label="Fechar notificação" @click="toast = null">✕</button>
      </div>
    </Transition>

    <!-- ─── Modals ─────────────────────────────────────────── -->
    <TurmaDetailsModal
      v-model="detailsOpen"
      :turma="selectedTurma"
      :api-base="apiBase"
      @enroll="openEnrollment"
    />

    <TurmaEnrollmentModal
      v-model="enrollmentOpen"
      :turma="selectedTurma"
      :api-base="apiBase"
      @success="handleEnrollmentSuccess"
    />

    <MentorProfileModal
      v-model="mentorModalOpen"
      :api-base="apiBase"
      @success="handleMentorSuccess"
      @deleted="handleMentorDeleted"
    />

    <!-- ─── Hero ───────────────────────────────────────────── -->
    <section class="hero" aria-label="Apresentação das turmas">
      <div class="hero__content">
        <p class="eyebrow">
          <span class="eyebrow__dot" aria-hidden="true" />
          Turmas seConecta
        </p>

        <div class="hero__grid">
          <div class="hero__left">
            <h1>
              Aprenda com quem já passou
              <em>pelo caminho.</em>
            </h1>

            <p class="hero__description">
              Encontre turmas guiadas por mentores, embaixadores e estudantes experientes
              para começar olimpíadas, aplicações, projetos e oportunidades com mais clareza.
            </p>

            <div class="hero__actions">
              <button class="btn btn--primary" @click="scrollToClasses">
                <span>Explorar turmas abertas</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>

              <button class="btn btn--ghost" @click="navigateTo('/turmas/minhas')">
                Minhas turmas
              </button>

              <button class="btn btn--ghost" @click="isApprovedMentor ? goToCreateTurma() : openMentorProfileFlow()">
                {{ isApprovedMentor ? 'Criar turma' : 'Quero ser mentor' }}
              </button>
            </div>
          </div>

          <!-- Featured card -->
          <aside v-if="featuredClass" class="hero-card" aria-label="Turma em destaque">
            <div class="hero-card__label">
              <span class="blink-dot" aria-hidden="true" />
              Próxima turma recomendada
            </div>

            <div class="hero-card__category">{{ featuredClass.categoryLabel }}</div>
            <h2>{{ featuredClass.title }}</h2>
            <p>{{ featuredClass.shortDescription }}</p>

            <div class="hero-card__stats" aria-label="Estatísticas da turma">
              <div class="hero-stat">
                <strong>{{ featuredClass.meetingsCount }}</strong>
                <span>encontros</span>
              </div>
              <div class="hero-stat">
                <strong>{{ featuredClass.duration }}</strong>
                <span>duração</span>
              </div>
              <div class="hero-stat">
                <strong>{{ availableSeats(featuredClass) }}</strong>
                <span>vagas livres</span>
              </div>
            </div>

            <div class="hero-card__progress">
              <div class="hero-card__progress-bar" role="progressbar" :aria-valuenow="turmaFillPercentage(featuredClass)" aria-valuemin="0" aria-valuemax="100">
                <div
                  class="hero-card__progress-fill"
                  :style="{ width: `${turmaFillPercentage(featuredClass)}%` }"
                />
              </div>
              <span>{{ turmaFillPercentage(featuredClass) }}%</span>
            </div>

            <div class="hero-card__bottom">
              <div class="hero-card__mentor">
                <div class="mentor-avatar mentor-avatar--sm" aria-hidden="true">
                  <img v-if="featuredClass.mentor.avatarUrl" :src="featuredClass.mentor.avatarUrl" alt="" />
                  <span v-else>{{ featuredClass.mentor.initials }}</span>
                </div>
                <div>
                  <NuxtLink
                    v-if="featuredClass.mentor.profileUrl"
                    :to="featuredClass.mentor.profileUrl"
                    class="mentor-link mentor-link--light"
                  >
                    {{ featuredClass.mentor.name }}
                  </NuxtLink>
                  <strong v-else>{{ featuredClass.mentor.name }}</strong>
                  <span>{{ featuredClass.mentor.headline || getMentorTypeLabel(featuredClass.mentor.type) }}</span>
                </div>
              </div>

              <div class="hero-card__start">{{ featuredClass.startLabel }}</div>
            </div>

            <button
              class="btn btn--card"
              @click="isCurrentOwner(featuredClass) ? goToEditTurma(featuredClass) : openDetails(featuredClass)"
            >
              {{ isCurrentOwner(featuredClass) ? 'Editar sua turma' : 'Ver detalhes da turma' }}
            </button>
          </aside>

          <aside v-else class="hero-card hero-card--empty" aria-label="Sem turmas em destaque">
            <div class="hero-card__label">Turmas</div>
            <h2>Nenhuma turma publicada ainda</h2>
            <p>Quando as primeiras turmas forem aprovadas, elas aparecerão aqui.</p>
          </aside>
        </div>
      </div>
    </section>

    <!-- ─── Main layout ────────────────────────────────────── -->
    <section ref="classesSection" class="layout-grid" aria-label="Lista de turmas">

      <!-- Left: filters + grid -->
      <div class="main-column">

        <!-- Filters -->
        <section class="filters-panel" aria-label="Filtros">
          <div class="search-box" role="search">
            <span class="search-icon" aria-hidden="true">⌕</span>
            <input
              ref="searchInput"
              v-model="searchRaw"
              type="search"
              placeholder="Buscar por OBI, OBMEP, bolsas, pesquisa…"
              aria-label="Buscar turmas"
              autocomplete="off"
              @keydown.escape="searchRaw = ''"
            />
            <button v-if="searchRaw" class="search-clear" aria-label="Limpar busca" @click="searchRaw = ''">
              ✕
            </button>
          </div>

          <div class="filter-row" role="group" aria-label="Categorias">
            <button
              v-for="category in categories"
              :key="category.key"
              class="filter-chip"
              :class="{ 'filter-chip--active': activeCategory === category.key }"
              :aria-pressed="activeCategory === category.key"
              @click="setCategory(category.key)"
            >
              {{ category.label }}
              <span v-if="category.key !== 'ALL'" class="chip-count" aria-label=", {{ getCategoryCount(category.key) }} turmas">
                {{ getCategoryCount(category.key) }}
              </span>
            </button>
          </div>

          <div class="compact-filters">
            <label>
              <span>Nível</span>
              <select v-model="activeLevel" aria-label="Filtrar por nível">
                <option value="ALL">Todos os níveis</option>
                <option value="BEGINNER">Iniciante</option>
                <option value="INTERMEDIATE">Intermediário</option>
                <option value="ADVANCED">Avançado</option>
                <option value="OPEN_TO_ALL">Aberta para todos</option>
              </select>
            </label>

            <label>
              <span>Status</span>
              <select v-model="activeStatus" aria-label="Filtrar por status">
                <option value="ALL">Qualquer status</option>
                <option value="ENROLLMENT_OPEN">Inscrições abertas</option>
                <option value="PUBLISHED">Publicada</option>
                <option value="FULL">Cheia</option>
                <option value="ONGOING">Em andamento</option>
                <option value="COMPLETED">Concluída</option>
              </select>
            </label>
          </div>
        </section>

        <!-- Section head -->
        <section class="section-head" aria-live="polite" aria-atomic="true">
          <div>
            <p class="eyebrow"><span class="eyebrow__dot" aria-hidden="true" />Turmas disponíveis</p>
            <h2>
              <span class="count-badge">{{ filteredClasses.length }}</span>
              {{ filteredClasses.length === 1 ? 'turma encontrada' : 'turmas encontradas' }}
            </h2>
          </div>

          <div class="section-head__actions">
            <button
              class="btn btn--ghost btn--sm"
              :class="{ 'btn--loading': loading }"
              :disabled="loading"
              aria-label="Atualizar lista de turmas"
              @click="fetchTurmas"
            >
              <span v-if="loading" class="spinner" aria-hidden="true" />
              <span>{{ loading ? 'Atualizando…' : 'Atualizar' }}</span>
            </button>

            <Transition name="fade">
              <button v-if="hasActiveFilters" class="btn btn--reset" @click="resetFilters">
                Limpar filtros
              </button>
            </Transition>
          </div>
        </section>

        <!-- Skeleton loaders -->
        <section v-if="loading" class="class-grid" aria-label="Carregando turmas" aria-busy="true">
          <div v-for="n in 6" :key="n" class="skeleton-card">
            <div class="skeleton-banner" />
            <div class="skeleton-body">
              <div class="skeleton-row">
                <div class="skeleton-circle" />
                <div class="skeleton-lines">
                  <div class="skeleton-line skeleton-line--md" />
                  <div class="skeleton-line skeleton-line--sm" />
                </div>
              </div>
              <div class="skeleton-line skeleton-line--full" style="margin-top: 16px" />
              <div class="skeleton-line skeleton-line--lg" style="margin-top: 8px" />
              <div class="skeleton-grid" style="margin-top: 16px">
                <div class="skeleton-cell" />
                <div class="skeleton-cell" />
                <div class="skeleton-cell" />
                <div class="skeleton-cell" />
              </div>
              <div class="skeleton-bar" style="margin-top: 14px" />
              <div class="skeleton-footer" style="margin-top: 16px">
                <div class="skeleton-btn" />
                <div class="skeleton-btn" />
              </div>
            </div>
          </div>
        </section>

        <!-- Class grid -->
        <section v-else-if="filteredClasses.length > 0" class="class-grid" aria-label="Turmas">
          <article
            v-for="(turma, index) in filteredClasses"
            :key="turma.id"
            class="class-card"
            :style="{ '--delay': `${Math.min(index, 11) * 40}ms` }"
          >
            <div
              class="class-card__banner"
              :style="{
                background: turma.coverUrl
                  ? `linear-gradient(rgba(0,0,0,0.38), rgba(0,0,0,0.42)), url(${turma.coverUrl}) center/cover no-repeat`
                  : turma.gradient,
              }"
            >
              <div>
                <span class="banner__category">{{ turma.categoryLabel }}</span>
                <strong class="banner__topic">{{ turma.topic }}</strong>
              </div>
              <span class="status-pill" :class="`status-pill--${turma.status.toLowerCase()}`">
                {{ getStatusLabel(turma.status) }}
              </span>
            </div>

            <div class="class-card__body">
              <div class="mentor-row">
                <div
                  class="mentor-avatar"
                  :class="`mentor-avatar--${turma.mentor.type.toLowerCase()}`"
                  aria-hidden="true"
                >
                  <img v-if="turma.mentor.avatarUrl" :src="turma.mentor.avatarUrl" :alt="turma.mentor.name" />
                  <span v-else>{{ turma.mentor.initials }}</span>
                </div>

                <div class="mentor-info">
                  <NuxtLink
                    v-if="turma.mentor.profileUrl"
                    :to="turma.mentor.profileUrl"
                    class="mentor-link"
                  >
                    {{ turma.mentor.name }}
                  </NuxtLink>
                  <strong v-else>{{ turma.mentor.name }}</strong>
                  <span class="mentor-badge" :class="`mentor-badge--${turma.mentor.type.toLowerCase()}`">
                    {{ turma.mentor.headline || getMentorTypeLabel(turma.mentor.type) }}
                  </span>
                </div>
              </div>

              <h3>{{ turma.title }}</h3>
              <p class="class-description">{{ turma.shortDescription }}</p>

              <div class="class-info-grid" aria-label="Informações da turma">
                <div class="info-cell">
                  <span>Nível</span>
                  <strong>{{ turma.levelLabel }}</strong>
                </div>
                <div class="info-cell">
                  <span>Vagas</span>
                  <strong :class="{ 'text-danger': availableSeats(turma) <= 2 && canEnroll(turma) }">
                    {{ availableSeats(turma) }} livres
                  </strong>
                </div>
                <div class="info-cell">
                  <span>Encontros</span>
                  <strong>{{ turma.meetingsCount }}x</strong>
                </div>
                <div class="info-cell">
                  <span>Duração</span>
                  <strong>{{ turma.duration }}</strong>
                </div>
              </div>

              <div class="progress-block">
                <div class="progress-block__top">
                  <span>Preenchimento</span>
                  <strong :class="{ 'text-warning': turmaFillPercentage(turma) >= 80 }">
                    {{ turmaFillPercentage(turma) }}%
                  </strong>
                </div>
                <div
                  class="progress-bar"
                  role="progressbar"
                  :aria-valuenow="turmaFillPercentage(turma)"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <div
                    class="progress-fill"
                    :style="{ width: `${turmaFillPercentage(turma)}%` }"
                    :class="{
                      'progress-fill--warning': turmaFillPercentage(turma) >= 80,
                      'progress-fill--full': turmaFillPercentage(turma) >= 100,
                    }"
                  />
                </div>
              </div>

              <div v-if="turma.tags.length > 0" class="tag-list" aria-label="Etiquetas">
                <span v-for="tag in turma.tags" :key="tag" class="tag">{{ tag }}</span>
              </div>

              <div class="class-card__footer">
                <button class="btn btn--outline btn--sm" @click="openDetails(turma)">
                  Ver detalhes
                </button>

                <button
                  v-if="isCurrentOwner(turma)"
                  class="btn btn--primary btn--sm"
                  @click="goToEditTurma(turma)"
                >
                  Editar turma
                </button>

                <button
                  v-else
                  class="btn btn--sm"
                  :class="canEnroll(turma) ? 'btn--primary' : 'btn--muted'"
                  :disabled="!canEnroll(turma) || isAlreadyEnrolled(turma.id)"
                  @click="openEnrollment(turma)"
                >
                  <span v-if="enrollingId === turma.id" class="spinner spinner--sm" aria-hidden="true" />
                  {{ isAlreadyEnrolled(turma.id) ? 'Inscrito ✓' : getEnrollLabel(turma) }}
                </button>
              </div>
            </div>
          </article>
        </section>

        <!-- Empty state -->
        <div v-else class="empty-state">
          <div class="empty-state__icon" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="23" stroke="currentColor" stroke-width="1.5" opacity="0.2" />
              <path d="M16 24h16M24 16v16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.4" />
            </svg>
          </div>
          <h3>Nenhuma turma encontrada</h3>
          <p>Tente ajustar os filtros ou buscar por outro tema.</p>
          <button class="btn btn--primary" @click="resetFilters">Limpar filtros</button>
        </div>

        <!-- Error state -->
        <div v-if="fetchError && !loading" class="error-banner" role="alert">
          <span aria-hidden="true">⚠</span>
          {{ fetchError }}
          <button class="btn btn--sm btn--ghost" @click="fetchTurmas">Tentar novamente</button>
        </div>
      </div>

      <!-- ─── Sidebar ─────────────────────────────────────── -->
      <aside class="side-column">

        <!-- Journey -->
        <section class="side-card">
          <p class="eyebrow"><span class="eyebrow__dot" aria-hidden="true" />Sua jornada</p>
          <h2>Como escolher uma turma?</h2>

          <div class="journey-steps" role="list">
            <article v-for="(step, i) in journeySteps" :key="i" class="journey-step" role="listitem">
              <span class="journey-step__num" aria-hidden="true">{{ i + 1 }}</span>
              <div>
                <strong>{{ step.title }}</strong>
                <p>{{ step.text }}</p>
              </div>
            </article>
          </div>
        </section>

        <!-- Recommended -->
        <section class="side-card">
          <div class="side-card__head">
            <p class="eyebrow"><span class="eyebrow__dot" aria-hidden="true" />Recomendadas</p>
            <h2>Para começar bem</h2>
          </div>

          <div class="recommended-list" role="list">
            <article
              v-for="turma in recommendedClasses"
              :key="turma.id"
              class="recommended-item"
              role="listitem"
            >
              <div class="recommended-item__bar" :style="{ background: turma.gradient }" aria-hidden="true" />
              <div class="recommended-item__body">
                <span>{{ turma.categoryLabel }}</span>
                <strong>{{ turma.title }}</strong>
                <p>{{ turma.startLabel }} · {{ turma.meetingsCount }} encontros</p>
              </div>
              <button class="btn btn--pill" @click="openDetails(turma)">Ver</button>
            </article>

            <p v-if="recommendedClasses.length === 0 && !loading" class="muted-note">
              Nenhuma turma aberta por enquanto.
            </p>

            <div v-if="loading" class="recommended-skeleton">
              <div v-for="n in 3" :key="n" class="recommended-skeleton__item">
                <div class="skeleton-bar-thin" />
                <div class="skeleton-lines" style="flex:1">
                  <div class="skeleton-line skeleton-line--sm" />
                  <div class="skeleton-line skeleton-line--md" />
                  <div class="skeleton-line skeleton-line--sm" />
                </div>
                <div class="skeleton-btn-sm" />
              </div>
            </div>
          </div>
        </section>

        <!-- Mentor card -->
        <section class="side-card mentor-card">
          <p class="eyebrow"><span class="eyebrow__dot" aria-hidden="true" />Mentores</p>
          <h2>{{ mentorCardTitle }}</h2>
          <p>{{ mentorCardText }}</p>

          <div v-if="myMentorLoading" class="mentor-mini-state" aria-live="polite">
            <span class="spinner" aria-hidden="true" />
            Carregando perfil…
          </div>

          <div v-else-if="myMentorProfile" class="mentor-profile-card">
            <span
              class="mentor-status"
              :class="`mentor-status--${String(myMentorProfile.status).toLowerCase()}`"
            >
              {{ myMentorProfile.status === 'APPROVED' ? 'mentor ativo' : myMentorProfile.status === 'PENDING' ? 'em revisão' : 'ajustes necessários' }}
            </span>
            <strong>{{ myMentorProfile.headline || 'Perfil de mentor' }}</strong>
            <small>{{ (myMentorProfile.areas || []).slice(0, 3).join(', ') || 'Áreas não informadas' }}</small>
          </div>

          <div v-if="isApprovedMentor" class="mentor-actions">
            <button class="btn btn--card-dark" @click="goToMentorDashboard">Painel do mentor</button>
            <button class="btn btn--outline btn--block" @click="goToCreateTurma">Criar turma</button>
            <button class="btn btn--outline btn--block" @click="openMentorProfileFlow">Editar perfil</button>
          </div>

          <button v-else class="btn btn--card-dark" @click="openMentorProfileFlow">
            {{
              mentorStatus === 'REJECTED' ? 'Ajustar perfil'
              : mentorStatus === 'PENDING' ? 'Ver perfil enviado'
              : 'Criar perfil de mentor'
            }}
          </button>
        </section>
      </aside>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import MentorProfileModal from '~/components/MentorProfileModal.vue'
import TurmaDetailsModal from '~/components/TurmaDetailsModal.vue'
import TurmaEnrollmentModal from '~/components/TurmaEnrollmentModal.vue'

const config = useRuntimeConfig()
const { restoreSession, getAccessToken, currentUser } = useAuth()

const apiBase = computed(() => {
  return config.public?.apiBase || config.public?.apiBaseUrl || '/api/v1'
})

// ── Search (debounced) ──────────────────────────────────────────────────────
const searchRaw = ref('')
const search = ref('')
let searchDebounce = null
watch(searchRaw, (val) => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => { search.value = val.trim().toLowerCase() }, 280)
})

const activeCategory = ref('ALL')
const activeLevel = ref('ALL')
const activeStatus = ref('ALL')

const loading = ref(false)
const fetchError = ref(null)
const enrollingId = ref(null)
const toast = ref(null)
const classesSection = ref(null)
const searchInput = ref(null)

// ── Data ───────────────────────────────────────────────────────────────────
// reactive() instead of ref({}) for proper nested key reactivity
const turmas = ref([])
const enrollments = ref([])
const mentorProfiles = reactive({})

const selectedTurma = ref(null)
const detailsOpen = ref(false)
const enrollmentOpen = ref(false)
const mentorModalOpen = ref(false)
const myMentorProfile = ref(null)
const myMentorLoading = ref(false)

// ── Static data ────────────────────────────────────────────────────────────
const journeySteps = [
  { title: 'Escolha um caminho', text: 'Olimpíada, aplicação, pesquisa, projetos ou exploração.' },
  { title: 'Veja o formato', text: 'Confira nível, encontros, vagas, duração e mentor.' },
  { title: 'Entre ou aplique', text: 'Algumas turmas são abertas; outras usam candidatura simples.' },
]

const categories = [
  { key: 'ALL', label: 'Todas' },
  { key: 'OLYMPIAD', label: 'Olimpíadas' },
  { key: 'OPPORTUNITY_APPLICATION', label: 'Aplicações' },
  { key: 'RESEARCH', label: 'Pesquisa' },
  { key: 'TECHNOLOGY', label: 'Tecnologia' },
  { key: 'PROJECTS', label: 'Projetos' },
  { key: 'EXPLORATION', label: 'Exploração' },
]

const categoryLabels = {
  OLYMPIAD: 'Olimpíada',
  OPPORTUNITY_APPLICATION: 'Aplicações',
  RESEARCH: 'Pesquisa',
  TECHNOLOGY: 'Tecnologia',
  PROJECTS: 'Projetos',
  SCHOLARSHIPS: 'Bolsas',
  CAREER: 'Carreira',
  EXPLORATION: 'Exploração',
  OTHER: 'Outra',
}

const levelLabels = {
  BEGINNER: 'Iniciante',
  INTERMEDIATE: 'Intermediário',
  ADVANCED: 'Avançado',
  OPEN_TO_ALL: 'Aberta para todos',
}

const categoryGradients = {
  OLYMPIAD: 'linear-gradient(135deg, #064e3b, #059669)',
  OPPORTUNITY_APPLICATION: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
  RESEARCH: 'linear-gradient(135deg, #164e63, #0891b2)',
  TECHNOLOGY: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
  PROJECTS: 'linear-gradient(135deg, #7c2d12, #ea580c)',
  SCHOLARSHIPS: 'linear-gradient(135deg, #831843, #db2777)',
  CAREER: 'linear-gradient(135deg, #374151, #111827)',
  EXPLORATION: 'linear-gradient(135deg, #134e4a, #0d9488)',
  OTHER: 'linear-gradient(135deg, #374151, #6b7280)',
}

// ── Computed ───────────────────────────────────────────────────────────────
const formattedClasses = computed(() => turmas.value.map(formatTurma))

const featuredClass = computed(() =>
  formattedClasses.value.find((t) => t.status === 'ENROLLMENT_OPEN') || formattedClasses.value[0] || null,
)

const filteredClasses = computed(() => {
  const term = search.value

  return formattedClasses.value.filter((turma) => {
    const matchSearch =
      !term ||
      [turma.title, turma.topic, turma.description, turma.shortDescription, ...turma.tags]
        .join(' ')
        .toLowerCase()
        .includes(term)

    const matchCat = activeCategory.value === 'ALL' || turma.category === activeCategory.value
    const matchLvl = activeLevel.value === 'ALL' || turma.level === activeLevel.value
    const matchSts = activeStatus.value === 'ALL' || turma.status === activeStatus.value

    return matchSearch && matchCat && matchLvl && matchSts
  })
})

const recommendedClasses = computed(() =>
  formattedClasses.value
    .filter((t) => t.status === 'ENROLLMENT_OPEN')
    .sort((a, b) => new Date(a.raw.start_date || '2999-01-01') - new Date(b.raw.start_date || '2999-01-01'))
    .slice(0, 3),
)

const hasActiveFilters = computed(() =>
  Boolean(searchRaw.value || activeCategory.value !== 'ALL' || activeLevel.value !== 'ALL' || activeStatus.value !== 'ALL'),
)

const mentorStatus = computed(() => myMentorProfile.value?.status || null)
const isApprovedMentor = computed(() => mentorStatus.value === 'APPROVED')

const mentorCardTitle = computed(() => {
  if (isApprovedMentor.value) return 'Seu painel de mentor'
  if (mentorStatus.value === 'PENDING') return 'Perfil em revisão'
  if (mentorStatus.value === 'REJECTED') return 'Perfil precisa de ajustes'
  return 'Quer guiar uma turma?'
})

const mentorCardText = computed(() => {
  if (isApprovedMentor.value) return 'Você já pode criar turmas, acompanhar inscrições e controlar seus próximos encontros.'
  if (mentorStatus.value === 'PENDING') return 'Seu perfil foi enviado para revisão. Quando for aprovado, você poderá criar turmas.'
  if (mentorStatus.value === 'REJECTED') return 'Seu perfil foi revisado e precisa de ajustes antes de liberar criação de turmas.'
  return 'Crie seu perfil de mentor, envie para revisão e depois organize turmas para estudantes.'
})

// ── Watchers ───────────────────────────────────────────────────────────────
// Scroll to classes list top when filters change
watch([activeCategory, activeLevel, activeStatus, search], async () => {
  await nextTick()
  classesSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
})

// ── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([fetchTurmas(), fetchMyEnrollments(), fetchMyMentorProfile()])
})

// ── API helpers ────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}, reqConfig = {}) {
  await restoreSession()
  const token = getAccessToken()

  if (reqConfig.requireAuth && !token) {
    throw { status: 401, data: { detail: 'Not authenticated' } }
  }

  return await $fetch(path, {
    baseURL: apiBase.value,
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}

async function fetchTurmas() {
  loading.value = true
  fetchError.value = null

  try {
    const response = await apiFetch('/turmas/', { query: { limit: 100 } })
    turmas.value = Array.isArray(response) ? response : response?.data || []
    await fetchMentorProfiles()
  } catch (error) {
    fetchError.value = getApiError(error, 'Não foi possível carregar as turmas.')
    openToast('error', null, fetchError.value)
  } finally {
    loading.value = false
  }
}

async function fetchMentorProfiles() {
  const ids = [...new Set(turmas.value.map((t) => t.mentor_profile_id).filter(Boolean))]

  await Promise.allSettled(
    ids.map(async (id) => {
      if (mentorProfiles[id] !== undefined) return

      try {
        mentorProfiles[id] = await apiFetch(`/turmas/mentor/${id}`)
      } catch {
        mentorProfiles[id] = null
      }
    }),
  )
}

async function fetchMyEnrollments() {
  try {
    const response = await apiFetch('/turmas/my/enrollments', {
      query: { active_only: true, limit: 100 },
    }, { requireAuth: true })

    enrollments.value = Array.isArray(response) ? response : response?.data || []
  } catch {
    enrollments.value = []
  }
}

async function fetchMyMentorProfile() {
  myMentorLoading.value = true
  try {
    myMentorProfile.value = await apiFetch('/turmas/mentor/me', {}, { requireAuth: true })
  } catch {
    myMentorProfile.value = null
  } finally {
    myMentorLoading.value = false
  }
}

// ── Navigation ─────────────────────────────────────────────────────────────
function openMentorProfileFlow() { mentorModalOpen.value = true }
function goToMentorDashboard() { navigateTo('/turmas/mentor') }
function goToCreateTurma() { navigateTo('/turmas/mentor/criar') }
function goToEditTurma(turma) { navigateTo(`/turmas/mentor/${turma.id}/editar`) }
function openDetails(turma) { navigateTo(`/turmas/${turma.id}`) }
function openEnrollment(turma) { navigateTo(`/turmas/${turma.id}?enroll=1`) }

function setCategory(key) {
  activeCategory.value = key
}

// ── Formatters ─────────────────────────────────────────────────────────────
function formatTurma(raw) {
  const category = raw.category || 'OTHER'
  const level = raw.level || 'OPEN_TO_ALL'
  // Use reactive mentorProfiles (no .value needed)
  const mentorProfile = raw.mentor_account || mentorProfiles[raw.mentor_profile_id]
  const mentorName = mentorProfile?.user_full_name || mentorProfile?.user_username || 'Mentor seConecta'
  const mentorHeadline = mentorProfile?.headline || ''
  const mentorType = mentorProfile?.mentor_type || 'PEER'
  const mentorProfileUrl =
    mentorProfile?.user_profile_url ||
    (mentorProfile?.user_username ? `/profile/${mentorProfile.user_username}` : null)

  return {
    id: raw.id,
    raw,
    title: raw.title || 'Turma sem título',
    topic: raw.topic || categoryLabels[category] || 'Turma',
    shortDescription: raw.short_description || truncate(raw.description, 120),
    description: raw.description || raw.short_description || 'Sem descrição disponível.',
    category,
    categoryLabel: categoryLabels[category] || category,
    level,
    levelLabel: levelLabels[level] || level,
    coverUrl: raw.cover_url || null,
    status: raw.status || 'PUBLISHED',
    enrollmentMode: raw.enrollment_mode || 'OPEN',
    classSize: Number(raw.class_size || 0),
    seatsTaken: Number(raw.current_enrollment_count || 0),
    meetingsCount: Number(raw.number_of_meetings || 0),
    duration: durationLabel(raw),
    startLabel: startLabel(raw),
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    gradient: categoryGradients[category] || categoryGradients.OTHER,
    mentorProfileId: raw.mentor_profile_id,
    mentor: {
      name: mentorName,
      headline: mentorHeadline,
      initials: initialsFrom(mentorName),
      type: mentorType,
      username: mentorProfile?.user_username || null,
      userId: mentorProfile?.user_id || null,
      profileUrl: mentorProfileUrl,
      avatarUrl: mentorProfile?.user_profile_picture_url || null,
    },
  }
}

function durationLabel(raw) {
  if (raw.start_date && raw.end_date) {
    const diffDays = Math.max(1, Math.round((new Date(raw.end_date) - new Date(raw.start_date)) / 86400000))
    if (diffDays >= 30) return `${Math.round(diffDays / 30)} mês`
    if (diffDays >= 14) return `${Math.round(diffDays / 7)} semanas`
    return `${diffDays} dias`
  }
  if (raw.number_of_meetings && raw.meeting_duration_minutes) {
    return `${raw.number_of_meetings}x ${raw.meeting_duration_minutes}min`
  }
  return 'A definir'
}

function startLabel(raw) {
  if (!raw.start_date) return 'Data a definir'
  const diffDays = Math.ceil((new Date(raw.start_date) - Date.now()) / 86400000)

  if (diffDays < 0) return 'Já começou'
  if (diffDays === 0) return 'Começa hoje'
  if (diffDays === 1) return 'Começa amanhã'
  if (diffDays <= 14) return `Em ${diffDays} dias`

  return new Date(raw.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function truncate(text, max = 120) {
  if (!text) return ''
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}…`
}

function initialsFrom(text) {
  if (!text) return 'SC'
  return text.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

// ── Business logic ─────────────────────────────────────────────────────────
function availableSeats(turma) {
  return Math.max(0, Number(turma.classSize || 0) - Number(turma.seatsTaken || 0))
}

function getCategoryCount(key) {
  return formattedClasses.value.filter((t) => t.category === key).length
}

function turmaFillPercentage(turma) {
  if (!turma.classSize) return 0
  return Math.min(100, Math.round((turma.seatsTaken / turma.classSize) * 100))
}

function isCurrentOwner(turma) {
  const myId = currentUser.value?.id
  if (!myId || !turma) return false

  return [turma.raw?.created_by_id, turma.raw?.mentor_account?.user_id, turma.mentor?.userId]
    .filter(Boolean)
    .some((id) => String(id) === String(myId))
}

function canEnroll(turma) {
  return !isCurrentOwner(turma) && turma.status === 'ENROLLMENT_OPEN' && availableSeats(turma) > 0
}

function isAlreadyEnrolled(turmaId) {
  // Use string comparison to avoid type mismatch bugs
  return enrollments.value.some(
    (e) => String(e.turma_id) === String(turmaId) && ['ACCEPTED', 'ENROLLED', 'ACTIVE', 'COMPLETED'].includes(e.status),
  )
}

function getEnrollLabel(turma) {
  if (isCurrentOwner(turma)) return 'Sua turma'
  if (turma.status === 'FULL') return 'Turma cheia'
  if (turma.status === 'ONGOING') return 'Em andamento'
  if (turma.status === 'PUBLISHED') return 'Em breve'
  if (turma.enrollmentMode === 'APPLICATION') return 'Aplicar'
  return 'Entrar na turma'
}

function getStatusLabel(status) {
  return {
    PUBLISHED: 'Publicada',
    ENROLLMENT_OPEN: 'Inscrições abertas',
    FULL: 'Cheia',
    ONGOING: 'Em andamento',
    COMPLETED: 'Concluída',
    ARCHIVED: 'Arquivada',
  }[status] || status
}

function getMentorTypeLabel(type) {
  return {
    PEER: 'Mentor estudante',
    AMBASSADOR: 'Embaixador seConecta',
    VERIFIED: 'Mentor verificado',
  }[type] || 'Mentor'
}

function resetFilters() {
  searchRaw.value = ''
  search.value = ''
  activeCategory.value = 'ALL'
  activeLevel.value = 'ALL'
  activeStatus.value = 'ALL'
  searchInput.value?.focus()
}

function scrollToClasses() {
  classesSection.value?.scrollIntoView({ behavior: 'smooth' })
}

// ── Event handlers ─────────────────────────────────────────────────────────
async function handleEnrollmentSuccess(enrollment) {
  enrollmentOpen.value = false
  await Promise.all([fetchTurmas(), fetchMyEnrollments()])
  openToast(
    'success',
    null,
    enrollment?.status === 'APPLIED'
      ? 'Aplicação enviada. Você verá o status na sua jornada.'
      : 'Você entrou na turma. Ela já pode aparecer na sua jornada.',
  )
}

async function handleMentorSuccess(profile) {
  mentorModalOpen.value = false
  await fetchMyMentorProfile()
  openToast(
    'success',
    null,
    profile?.status === 'PENDING'
      ? 'Perfil enviado para revisão.'
      : profile?.status === 'APPROVED'
        ? 'Perfil de mentor atualizado.'
        : 'Perfil de mentor salvo.',
  )
}

async function handleMentorDeleted() {
  mentorModalOpen.value = false
  myMentorProfile.value = null
  openToast('success', null, 'Perfil de mentor excluído.')
  await fetchMyMentorProfile()
}

// ── Toast ──────────────────────────────────────────────────────────────────
let toastTimer = null

function getApiError(error, fallback) {
  return error?.data?.detail || error?.message || fallback
}

function openToast(type, turma = null, customText = null) {
  const map = {
    success: { tone: 'green', icon: '✓', title: 'Tudo certo', text: customText || 'Ação concluída.' },
    error: { tone: 'red', icon: '!', title: 'Algo deu errado', text: customText || 'Tente novamente em alguns segundos.' },
    mentor: { tone: 'green', icon: '+', title: 'Perfil de mentor', text: customText || 'Preencha seu perfil para enviar à revisão.' },
    details: { tone: 'info', icon: 'i', title: turma?.title || 'Detalhes', text: 'Abrindo detalhes da turma.' },
    enroll: {
      tone: turma?.enrollmentMode === 'APPLICATION' ? 'purple' : 'green',
      icon: turma?.enrollmentMode === 'APPLICATION' ? '?' : '✓',
      title: turma?.enrollmentMode === 'APPLICATION' ? 'Aplicação para turma' : 'Entrada na turma',
      text: customText || (turma?.enrollmentMode === 'APPLICATION' ? 'Preencha a candidatura para continuar.' : 'Confirme sua entrada na turma.'),
    },
  }

  toast.value = map[type] || map.success
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = null }, 5000)
}
</script>

<style scoped>
/* ─── Design tokens ─────────────────────────────────────────────────────── */
.classes-page {
  --brand: #079272;
  --brand-dark: #064e3b;
  --brand-soft: #e8f7f2;
  --brand-ring: rgba(7, 146, 114, 0.15);
  --ink: #111827;
  --ink-soft: #2f3a35;
  --muted: #64716b;
  --muted-2: #8b9691;
  --surface: #f8f6f0;
  --card: #ffffff;
  --border: #e8e4dc;
  --border-strong: #d8d3ca;
  --shadow-sm: 0 2px 12px rgba(15, 23, 42, 0.05), 0 8px 24px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 4px 16px rgba(15, 23, 42, 0.07), 0 18px 44px rgba(15, 23, 42, 0.07);
  --shadow-lift: 0 8px 32px rgba(15, 23, 42, 0.11), 0 2px 8px rgba(15, 23, 42, 0.06);
  --radius-sm: 14px;
  --radius-md: 20px;
  --radius-lg: 26px;
  --radius-xl: 30px;
  --font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --tracking-tight: -0.045em;
  --tracking-title: -0.06em;
  --leading-title: 0.98;
  --leading-body: 1.58;

  min-height: 100vh;
  padding: 22px;
  background:
    radial-gradient(circle at 0% 0%, rgba(7, 146, 114, 0.09) 0%, transparent 28%),
    radial-gradient(circle at 100% 80%, rgba(7, 146, 114, 0.05) 0%, transparent 24%),
    linear-gradient(180deg, #fbfaf7 0%, #f7f4ee 100%);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: var(--leading-body);
  -webkit-font-smoothing: antialiased;
  text-rendering: geometricPrecision;
  font-variant-numeric: tabular-nums;
}

.classes-page *,
.classes-page *::before,
.classes-page *::after { box-sizing: border-box; }

h1, h2, h3, p { margin-top: 0; }
h1, h2, h3, strong, button, input, select { font-family: inherit; }
button, input, select { font: inherit; }
button { letter-spacing: -0.01em; }

/* ─── Utility ────────────────────────────────────────────────────────────── */
.eyebrow {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  color: var(--brand);
  font-size: 0.7rem;
  font-weight: 780;
  letter-spacing: 0.075em;
  line-height: 1.2;
  text-transform: uppercase;
}

.eyebrow__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand);
  flex-shrink: 0;
}

/* ─── Spinner ─────────────────────────────────────────────────────────────── */
.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
  flex-shrink: 0;
}

.spinner--sm {
  width: 12px;
  height: 12px;
  border-width: 1.5px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Toast ───────────────────────────────────────────────────────────────── */
.toast {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: 380px;
  width: calc(100vw - 48px);
  border: 1px solid var(--border);
  border-left: 4px solid var(--brand);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  background: var(--card);
  box-shadow: var(--shadow-md);
}

.toast__icon {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 999px;
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 0.88rem;
  font-weight: 800;
}

.toast__body { min-width: 0; flex: 1; }

.toast strong {
  display: block;
  margin-bottom: 3px;
  font-size: 0.94rem;
  font-weight: 760;
  line-height: 1.25;
  letter-spacing: -0.02em;
}

.toast p {
  margin: 0;
  color: var(--muted);
  font-size: 0.85rem;
  line-height: 1.5;
}

.toast__close {
  margin-left: auto;
  flex-shrink: 0;
  border: 0;
  background: transparent;
  color: var(--muted-2);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 6px;
  transition: background 0.15s;
}

.toast__close:hover { background: #f3f1ec; }

.toast--info  { border-left-color: #2563eb; }
.toast--purple { border-left-color: #7c3aed; }
.toast--red   { border-left-color: #dc2626; }

.toast-enter-active, .toast-leave-active { transition: 0.22s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(12px) scale(0.98); }

/* ─── Fade transition ─────────────────────────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ─── Buttons ─────────────────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 0;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 730;
  line-height: 1.1;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, opacity 0.15s ease;
  white-space: nowrap;
  position: relative;
}

.btn:hover { transform: translateY(-1px); }
.btn:active { transform: translateY(0); }
.btn:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 3px;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.52;
  transform: none !important;
  pointer-events: none;
}

.btn--primary {
  padding: 11px 16px;
  background: var(--brand);
  color: #fff;
  box-shadow: 0 6px 18px rgba(7, 146, 114, 0.22);
}

.btn--primary:hover {
  background: #068260;
  box-shadow: 0 10px 24px rgba(7, 146, 114, 0.28);
}

.btn--ghost,
.btn--outline,
.btn--reset,
.btn--pill {
  border: 1px solid var(--border-strong);
  background: #fff;
  color: var(--ink);
}

.btn--ghost { padding: 11px 16px; }
.btn--outline,
.btn--muted,
.btn--pill { padding: 9px 13px; }

.btn--outline:hover,
.btn--ghost:hover,
.btn--pill:hover {
  border-color: var(--brand);
  color: var(--brand);
  box-shadow: 0 2px 8px rgba(7, 146, 114, 0.1);
}

.btn--reset {
  padding: 9px 13px;
  color: var(--muted);
  font-size: 0.83rem;
}

.btn--muted {
  background: #f3f1ec;
  color: var(--muted-2);
}

.btn--sm {
  min-height: 38px;
  padding: 9px 13px;
  font-size: 0.84rem;
}

.btn--card {
  width: 100%;
  margin-top: 10px;
  padding: 10px 14px;
  background: rgba(255,255,255,0.15);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.22);
  backdrop-filter: blur(6px);
  transition: background 0.18s;
}

.btn--card:hover {
  background: rgba(255,255,255,0.24);
  transform: translateY(-1px);
}

.btn--card-dark {
  width: 100%;
  margin-top: 16px;
  padding: 12px 16px;
  background: var(--ink);
  color: #fff;
}

.btn--card-dark:hover { background: #1f2937; }

.btn--block {
  width: 100%;
  padding: 12px 16px;
}

.btn--loading { pointer-events: none; opacity: 0.75; }

/* ─── Layout ──────────────────────────────────────────────────────────────── */
.hero,
.layout-grid {
  max-width: 1180px;
  margin-inline: auto;
}

.hero { margin-bottom: 14px; }

.hero__content {
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(4px);
}

.hero__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 318px;
  gap: 22px;
  align-items: stretch;
  margin-top: 10px;
}

.hero__left { min-width: 0; }

.hero h1 {
  max-width: 720px;
  margin: 7px 0 0;
  font-size: clamp(2rem, 4.2vw, 3.1rem);
  font-weight: 820;
  line-height: var(--leading-title);
  letter-spacing: var(--tracking-title);
  text-wrap: balance;
}

.hero h1 em {
  color: var(--brand);
  font-style: normal;
}

.hero__description {
  max-width: 600px;
  margin: 12px 0 0;
  color: var(--muted);
  font-size: 0.96rem;
  font-weight: 430;
  line-height: 1.62;
  text-wrap: pretty;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 18px;
}

/* ─── Hero card ───────────────────────────────────────────────────────────── */
.hero-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  border-radius: 22px;
  padding: 18px;
  background: linear-gradient(145deg, #0d2821, #079272);
  color: #fff;
}

.hero-card--empty { justify-content: center; }

.hero-card__label {
  display: flex;
  align-items: center;
  gap: 7px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.64rem;
  font-weight: 780;
  letter-spacing: 0.075em;
  line-height: 1.25;
  text-transform: uppercase;
}

.blink-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ade80;
  animation: blink 2.2s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.hero-card__category {
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.66rem;
  font-weight: 780;
  letter-spacing: 0.075em;
  text-transform: uppercase;
}

.hero-card h2 {
  margin: 5px 0 6px;
  font-size: 1.28rem;
  font-weight: 790;
  line-height: 1.08;
  letter-spacing: -0.04em;
  text-wrap: balance;
}

.hero-card > p {
  margin: 0;
  color: rgba(255, 255, 255, 0.76);
  font-size: 0.82rem;
  font-weight: 430;
  line-height: 1.5;
}

.hero-card__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
  margin-top: 12px;
}

.hero-stat {
  border-radius: 12px;
  padding: 8px 6px;
  background: rgba(255, 255, 255, 0.11);
  text-align: center;
}

.hero-stat strong {
  display: block;
  font-size: 0.95rem;
  font-weight: 820;
  line-height: 1.1;
  letter-spacing: -0.035em;
}

.hero-stat span {
  display: block;
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.56rem;
  font-weight: 740;
  letter-spacing: 0.055em;
  text-transform: uppercase;
}

.hero-card__progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 11px;
}

.hero-card__progress-bar {
  height: 5px;
  flex: 1;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
}

.hero-card__progress-fill {
  height: 100%;
  border-radius: inherit;
  background: #86efac;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.hero-card__progress span {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.66rem;
  font-weight: 780;
  white-space: nowrap;
}

.hero-card__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 11px;
}

.hero-card__mentor {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
}

.hero-card__mentor strong {
  display: block;
  overflow: hidden;
  max-width: 118px;
  font-size: 0.8rem;
  font-weight: 740;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-card__mentor span {
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.67rem;
  line-height: 1.25;
}

.hero-card__start {
  color: rgba(255, 255, 255, 0.68);
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.25;
  white-space: nowrap;
}

/* ─── Mentor links ─────────────────────────────────────────────────────────── */
.mentor-link {
  display: block;
  color: var(--ink-soft);
  font-size: 0.88rem;
  font-weight: 720;
  line-height: 1.2;
  letter-spacing: -0.02em;
  text-decoration: none;
  transition: color 0.15s;
}

.mentor-link:hover { color: var(--brand); text-decoration: underline; }
.mentor-link:focus-visible { outline: 2px solid var(--brand); border-radius: 4px; }

.mentor-link--light {
  color: rgba(255, 255, 255, 0.92);
  font-weight: 720;
  font-size: 0.82rem;
}

.mentor-link--light:hover { color: #fff; }

/* ─── Avatars ─────────────────────────────────────────────────────────────── */
.mentor-avatar {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #dcfce7;
  color: #166534;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  overflow: hidden;
}

.mentor-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mentor-avatar--sm {
  width: 30px;
  height: 30px;
  font-size: 0.66rem;
}

.mentor-avatar--ambassador { background: #ede9fe; color: #5b21b6; }
.mentor-avatar--verified   { background: #dbeafe; color: #1d4ed8; }
.mentor-avatar--peer       { background: #dcfce7; color: #166534; }

/* ─── Main layout ─────────────────────────────────────────────────────────── */
.layout-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 336px;
  gap: 16px;
  align-items: start;
}

.main-column,
.side-column {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.filters-panel,
.side-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 18px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(4px);
}

/* ─── Filters ─────────────────────────────────────────────────────────────── */
.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1.5px solid var(--border-strong);
  border-radius: var(--radius-md);
  padding: 0 14px;
  background: #fff;
  transition: border-color 0.18s, box-shadow 0.18s;
}

.search-box:focus-within {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px var(--brand-ring);
}

.search-icon {
  color: var(--muted-2);
  font-size: 1.1rem;
  line-height: 1;
}

.search-box input {
  width: 100%;
  border: 0;
  outline: none;
  padding: 13px 0;
  background: transparent;
  color: var(--ink);
  font-size: 0.92rem;
  font-weight: 450;
  line-height: 1.25;
}

.search-box input::placeholder { color: #9aa39f; font-weight: 420; }

/* Clear X on search */
.search-box input[type="search"]::-webkit-search-cancel-button { display: none; }
.search-box input[type="search"]::-webkit-search-decoration { display: none; }

.search-clear {
  border: 0;
  background: transparent;
  color: var(--muted-2);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
}

.search-clear:hover { background: #f3f1ec; color: var(--ink); }

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 12px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1.5px solid var(--border-strong);
  border-radius: 999px;
  padding: 8px 12px;
  background: #fff;
  color: var(--ink-soft);
  font-size: 0.81rem;
  font-weight: 680;
  line-height: 1.1;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s, box-shadow 0.15s;
}

.filter-chip:hover {
  border-color: var(--brand);
  color: var(--brand);
  box-shadow: 0 2px 6px rgba(7, 146, 114, 0.1);
}

.filter-chip:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

.filter-chip--active {
  border-color: var(--brand);
  background: var(--brand);
  color: #fff;
  box-shadow: 0 4px 12px rgba(7, 146, 114, 0.25);
}

.chip-count {
  display: inline-grid;
  min-width: 18px;
  height: 18px;
  place-items: center;
  border-radius: 999px;
  padding: 0 5px;
  background: rgba(0, 0, 0, 0.08);
  font-size: 0.68rem;
  font-weight: 760;
}

.filter-chip--active .chip-count { background: rgba(255, 255, 255, 0.24); }

.compact-filters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.compact-filters label {
  display: grid;
  gap: 6px;
}

.compact-filters label > span {
  color: var(--muted-2);
  font-size: 0.69rem;
  font-weight: 760;
  letter-spacing: 0.055em;
  line-height: 1.2;
  text-transform: uppercase;
}

.compact-filters select {
  width: 100%;
  border: 1.5px solid var(--border-strong);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  background: #fff;
  color: var(--ink);
  font-size: 0.86rem;
  font-weight: 520;
  line-height: 1.25;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  appearance: auto;
}

.compact-filters select:focus {
  outline: none;
  border-color: var(--brand);
  box-shadow: 0 0 0 3px var(--brand-ring);
}

/* ─── Section head ────────────────────────────────────────────────────────── */
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-head__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.section-head h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 6px 0 0;
  color: var(--ink);
  font-size: 1.24rem;
  font-weight: 780;
  line-height: 1.15;
  letter-spacing: -0.04em;
}

.count-badge {
  display: inline-grid;
  min-width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 8px;
  padding: 0 7px;
  background: var(--brand);
  color: #fff;
  font-size: 0.82rem;
  font-weight: 780;
  transition: transform 0.2s;
}

/* ─── Skeleton loaders ────────────────────────────────────────────────────── */
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

.skeleton-card {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: #fff;
}

.skeleton-banner {
  height: 104px;
  background: linear-gradient(90deg, #ede9e0 25%, #f5f2ec 50%, #ede9e0 75%);
  background-size: 800px 100%;
  animation: shimmer 1.6s infinite linear;
}

.skeleton-body { padding: 18px; }

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.skeleton-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  flex-shrink: 0;
  background: linear-gradient(90deg, #ede9e0 25%, #f5f2ec 50%, #ede9e0 75%);
  background-size: 800px 100%;
  animation: shimmer 1.6s infinite linear;
}

.skeleton-lines { flex: 1; display: grid; gap: 6px; }

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #ede9e0 25%, #f5f2ec 50%, #ede9e0 75%);
  background-size: 800px 100%;
  animation: shimmer 1.6s infinite linear;
}

.skeleton-line--sm   { width: 60%; }
.skeleton-line--md   { width: 78%; }
.skeleton-line--lg   { width: 90%; }
.skeleton-line--full { width: 100%; height: 16px; }

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 7px;
}

.skeleton-cell {
  height: 56px;
  border-radius: var(--radius-sm);
  background: linear-gradient(90deg, #ede9e0 25%, #f5f2ec 50%, #ede9e0 75%);
  background-size: 800px 100%;
  animation: shimmer 1.6s infinite linear;
}

.skeleton-bar {
  height: 20px;
  border-radius: 10px;
  background: linear-gradient(90deg, #ede9e0 25%, #f5f2ec 50%, #ede9e0 75%);
  background-size: 800px 100%;
  animation: shimmer 1.6s infinite linear;
}

.skeleton-footer {
  display: flex;
  gap: 8px;
}

.skeleton-btn {
  flex: 1;
  height: 38px;
  border-radius: 999px;
  background: linear-gradient(90deg, #ede9e0 25%, #f5f2ec 50%, #ede9e0 75%);
  background-size: 800px 100%;
  animation: shimmer 1.6s infinite linear;
}

/* ─── Class cards ─────────────────────────────────────────────────────────── */
.class-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.class-card {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.97);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  animation: cardIn 0.35s ease both;
  animation-delay: var(--delay, 0ms);
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.class-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lift);
}

.class-card__banner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  min-height: 104px;
  padding: 18px;
  color: #fff;
}

.banner__category {
  display: block;
  margin-bottom: 5px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.68rem;
  font-weight: 760;
  letter-spacing: 0.075em;
  line-height: 1.2;
  text-transform: uppercase;
}

.banner__topic {
  display: block;
  max-width: 220px;
  font-size: 1.18rem;
  font-weight: 790;
  line-height: 1.08;
  letter-spacing: -0.04em;
  text-wrap: balance;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  height: fit-content;
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 750;
  letter-spacing: 0.04em;
  line-height: 1.1;
  white-space: nowrap;
  flex-shrink: 0;
}

.status-pill--enrollment_open { background: rgba(74, 222, 128, 0.2); }
.status-pill--full            { background: rgba(239, 68, 68, 0.22); }
.status-pill--ongoing         { background: rgba(59, 130, 246, 0.22); }
.status-pill--completed       { background: rgba(107, 114, 128, 0.22); }

.class-card__body { padding: 18px; }

.mentor-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mentor-info strong {
  display: block;
  color: var(--ink-soft);
  font-size: 0.88rem;
  font-weight: 720;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.mentor-badge {
  display: inline-block;
  margin-top: 3px;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 0.65rem;
  font-weight: 740;
  line-height: 1.3;
}

.mentor-badge--peer       { background: #dcfce7; color: #166534; }
.mentor-badge--ambassador { background: #ede9fe; color: #5b21b6; }
.mentor-badge--verified   { background: #dbeafe; color: #1d4ed8; }

.class-card h3 {
  margin: 14px 0 6px;
  color: var(--ink);
  font-size: 1.1rem;
  font-weight: 780;
  line-height: 1.16;
  letter-spacing: -0.04em;
  text-wrap: balance;
}

.class-description {
  margin: 0;
  color: var(--muted);
  font-size: 0.87rem;
  font-weight: 430;
  line-height: 1.58;
  text-wrap: pretty;
  /* Clamp to 3 lines to keep cards uniform */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.class-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
  margin-top: 14px;
}

.info-cell {
  border: 1px solid #eee9e0;
  border-radius: var(--radius-sm);
  padding: 10px 11px;
  background: #fbfaf7;
}

.info-cell span {
  display: block;
  color: var(--muted-2);
  font-size: 0.64rem;
  font-weight: 760;
  letter-spacing: 0.055em;
  line-height: 1.2;
  text-transform: uppercase;
}

.info-cell strong {
  display: block;
  margin-top: 3px;
  color: var(--ink-soft);
  font-size: 0.86rem;
  font-weight: 720;
  line-height: 1.2;
  letter-spacing: -0.015em;
}

.text-danger { color: #dc2626; }
.text-warning { color: #d97706; }

/* ─── Progress ────────────────────────────────────────────────────────────── */
.progress-block { margin-top: 12px; }

.progress-block__top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 0.74rem;
  line-height: 1.2;
}

.progress-block__top span { color: var(--muted-2); font-weight: 680; }
.progress-block__top strong { color: var(--brand); font-weight: 760; }

.progress-bar {
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: #e5e7eb;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--brand), #34d399);
  transition: width 0.55s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-fill--warning { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.progress-fill--full    { background: linear-gradient(90deg, #ef4444, #f87171); }

/* ─── Tags ────────────────────────────────────────────────────────────────── */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.tag {
  border-radius: 999px;
  padding: 5px 10px;
  background: var(--brand-soft);
  color: var(--brand-dark);
  font-size: 0.71rem;
  font-weight: 680;
  line-height: 1.15;
}

/* ─── Card footer ─────────────────────────────────────────────────────────── */
.class-card__footer {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.class-card__footer .btn { flex: 1; }

/* ─── Empty state ─────────────────────────────────────────────────────────── */
.empty-state {
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-xl);
  padding: 56px 24px;
  background: rgba(255, 255, 255, 0.7);
  text-align: center;
  animation: cardIn 0.3s ease;
}

.empty-state__icon {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
  color: var(--muted-2);
}

.empty-state h3 {
  margin: 0 0 8px;
  color: var(--ink);
  font-size: 1.24rem;
  font-weight: 780;
  line-height: 1.15;
  letter-spacing: -0.04em;
}

.empty-state p {
  margin: 0 0 20px;
  color: var(--muted);
  font-size: 0.9rem;
}

/* ─── Error banner ────────────────────────────────────────────────────────── */
.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  padding: 14px 16px;
  background: #fff5f5;
  color: #991b1b;
  font-size: 0.88rem;
  font-weight: 580;
}

/* ─── Sidebar ─────────────────────────────────────────────────────────────── */
.side-card h2 {
  margin: 7px 0 0;
  color: var(--ink);
  font-size: 1.14rem;
  font-weight: 780;
  line-height: 1.15;
  letter-spacing: -0.04em;
  text-wrap: balance;
}

.side-card p {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 0.88rem;
  font-weight: 430;
  line-height: 1.58;
}

.journey-steps {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.journey-step {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid #eee9e0;
  border-radius: var(--radius-sm);
  background: #fbfaf7;
  transition: border-color 0.18s, box-shadow 0.18s;
}

.journey-step:hover {
  border-color: rgba(7, 146, 114, 0.3);
  box-shadow: 0 2px 8px rgba(7, 146, 114, 0.08);
}

.journey-step__num {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 9px;
  background: var(--brand);
  color: #fff;
  font-size: 0.82rem;
  font-weight: 780;
}

.journey-step strong {
  display: block;
  color: var(--ink-soft);
  font-size: 0.9rem;
  font-weight: 730;
  line-height: 1.22;
  letter-spacing: -0.02em;
}

.journey-step p {
  margin: 3px 0 0;
  font-size: 0.82rem;
  line-height: 1.45;
}

/* ─── Recommended ─────────────────────────────────────────────────────────── */
.recommended-list {
  display: grid;
  gap: 9px;
  margin-top: 14px;
}

.recommended-item {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #eee9e0;
  border-radius: var(--radius-md);
  padding: 12px;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}

.recommended-item:hover {
  border-color: rgba(7, 146, 114, 0.28);
  box-shadow: 0 2px 10px rgba(7, 146, 114, 0.08);
  transform: translateX(2px);
}

.recommended-item__bar {
  width: 4px;
  height: 40px;
  flex: 0 0 auto;
  border-radius: 4px;
}

.recommended-item__body {
  min-width: 0;
  flex: 1;
}

.recommended-item__body span {
  color: var(--brand);
  font-size: 0.65rem;
  font-weight: 760;
  letter-spacing: 0.06em;
  line-height: 1.2;
  text-transform: uppercase;
}

.recommended-item__body strong {
  display: block;
  margin-top: 2px;
  overflow: hidden;
  color: var(--ink-soft);
  font-size: 0.86rem;
  font-weight: 730;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.02em;
}

.recommended-item__body p {
  margin: 2px 0 0;
  font-size: 0.77rem;
  line-height: 1.35;
}

.muted-note {
  color: var(--muted);
  font-size: 0.86rem;
  text-align: center;
  padding: 10px 0;
}

/* Recommended skeleton */
.recommended-skeleton { display: grid; gap: 9px; }

.recommended-skeleton__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid #eee9e0;
  border-radius: var(--radius-md);
}

.skeleton-bar-thin {
  width: 4px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 4px;
  background: linear-gradient(90deg, #ede9e0 25%, #f5f2ec 50%, #ede9e0 75%);
  background-size: 400px 100%;
  animation: shimmer 1.6s infinite linear;
}

.skeleton-btn-sm {
  width: 42px;
  height: 32px;
  border-radius: 999px;
  flex-shrink: 0;
  background: linear-gradient(90deg, #ede9e0 25%, #f5f2ec 50%, #ede9e0 75%);
  background-size: 400px 100%;
  animation: shimmer 1.6s infinite linear;
}

/* ─── Mentor card ─────────────────────────────────────────────────────────── */
.mentor-card {
  background:
    radial-gradient(circle at 110% -10%, rgba(7, 146, 114, 0.12), transparent 50%),
    #fff;
}

.mentor-mini-state {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  color: var(--muted);
  font-size: 0.85rem;
}

.mentor-mini-state .spinner {
  border-color: rgba(0, 0, 0, 0.15);
  border-top-color: var(--brand);
}

.mentor-profile-card {
  display: grid;
  gap: 5px;
  margin-top: 14px;
  padding: 13px;
  border: 1px solid #eee9e0;
  border-radius: var(--radius-md);
  background: #fbfaf7;
}

.mentor-profile-card strong {
  color: var(--ink-soft);
  font-size: 0.9rem;
  font-weight: 730;
  line-height: 1.25;
  letter-spacing: -0.02em;
}

.mentor-profile-card small {
  color: var(--muted);
  font-size: 0.78rem;
  line-height: 1.35;
}

.mentor-status {
  width: fit-content;
  border-radius: 999px;
  padding: 4px 9px;
  background: var(--brand-soft);
  color: var(--brand-dark);
  font-size: 0.64rem;
  font-weight: 820;
  letter-spacing: 0.075em;
  line-height: 1.15;
  text-transform: uppercase;
}

.mentor-status--pending  { background: #fff7ed; color: #c2410c; }
.mentor-status--rejected { background: #fff1f2; color: #be123c; }

.mentor-actions { display: grid; gap: 9px; margin-top: 14px; }

/* ─── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 1060px) {
  .hero__grid,
  .layout-grid {
    grid-template-columns: 1fr;
  }

  .side-column {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .mentor-card {
    grid-column: 1 / -1;
  }
}

@media (max-width: 780px) {
  .classes-page { padding: 14px; }

  .hero__content {
    border-radius: 24px;
    padding: 18px;
  }

  .hero__grid { gap: 16px; }

  .hero h1 {
    font-size: 2.15rem;
    letter-spacing: -0.055em;
  }

  .class-grid,
  .side-column,
  .compact-filters {
    grid-template-columns: 1fr;
  }

  .section-head,
  .section-head__actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero__actions {
    flex-direction: column;
  }

  .hero__actions .btn { width: 100%; }

  .class-card__footer { flex-direction: column; }

  /* Toast takes full width on mobile */
  .toast {
    top: auto;
    bottom: 16px;
    right: 14px;
    left: 14px;
    max-width: none;
    width: auto;
  }

  /* Sticky filter panel */
  .filters-panel {
    position: sticky;
    top: 10px;
    z-index: 10;
  }
}
</style>