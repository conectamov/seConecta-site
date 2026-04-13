<script setup lang="ts">
import { useClubs } from '@/composables/useClubs'
import { useAuth } from '@/composables/useAuth'

useSeoMeta({ title: 'Criar Clube — seConecta' })

const router = useRouter()
const { isAuthenticated } = useAuth()
const clubs = useClubs()

// Guard
onMounted(() => {
  if (!isAuthenticated.value) router.push('/login')
})

const submitting = ref(false)
const error      = ref<string | null>(null)

const MODE_OPTIONS = [
  { value: 'FREE',       label: 'Grupo Livre',   desc: 'Estudo flexível sem estrutura rígida', emoji: '🧩' },
  { value: 'CLASSROOM',  label: 'Sala de Aula',  desc: 'Tarefas, notas e conteúdo estruturado', emoji: '🏫' },
  { value: 'MENTORSHIP', label: 'Mentoria',      desc: 'Poucos alunos, acompanhamento próximo', emoji: '🎓' },
  { value: 'COURSE',     label: 'Curso',         desc: 'Trilha sequencial de aprendizado', emoji: '📚' },
  { value: 'COMMUNITY',  label: 'Comunidade',    desc: 'Foco em discussões e engajamento', emoji: '🌐' },
]

const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC',   label: 'Público',      desc: 'Qualquer pessoa pode ver e entrar', icon: '🌍' },
  { value: 'UNLISTED', label: 'Não listado',  desc: 'Apenas quem tem o link pode ver', icon: '🔗' },
  { value: 'PRIVATE',  label: 'Privado',      desc: 'Somente membros aprovados enxergam', icon: '🔒' },
]

// Form state
const form = reactive({
  name:             '',
  mode:             'FREE' as string,
  visibility:       'PUBLIC' as string,
  shortDescription: '',
  longDescription:  '',
  coverImage:       '',
  themeColor:       '',
  maxMembers:       null as number | null,
  tags:             [] as string[],
  level:            '',
  language:         'pt-BR',
  timezone:         '',
  estimatedDuration:'',
  requireApproval:  false,
  allowInvites:     true,
  welcomeMessage:   '',
  rules:            '',
  // Feature flags
  assignmentsEnabled:  false,
  gradingEnabled:      false,
  discussionsEnabled:  true,
  liveSessionsEnabled: false,
  gamificationEnabled: false,
  rankingEnabled:      false,
  certificatesEnabled: false,
})

// Auto-set feature flags from mode defaults
watch(() => form.mode, (mode) => {
  form.assignmentsEnabled  = ['CLASSROOM', 'MENTORSHIP', 'COURSE'].includes(mode)
  form.gradingEnabled      = ['CLASSROOM', 'COURSE'].includes(mode)
  form.discussionsEnabled  = ['FREE', 'CLASSROOM', 'COMMUNITY'].includes(mode)
  form.liveSessionsEnabled = mode === 'MENTORSHIP'
  form.gamificationEnabled = mode === 'COMMUNITY'
  form.rankingEnabled      = mode === 'COMMUNITY'
  form.certificatesEnabled = mode === 'COURSE'
})

// Tags input
const tagInput = ref('')

function addTag() {
  const t = tagInput.value.trim().toLowerCase().replace(/^#/, '')
  if (t && !form.tags.includes(t) && form.tags.length < 8) {
    form.tags.push(t)
  }
  tagInput.value = ''
}

function removeTag(tag: string) {
  form.tags = form.tags.filter(t => t !== tag)
}

function handleTagKeydown(e: KeyboardEvent) {
  if (['Enter', ',', ' '].includes(e.key)) {
    e.preventDefault()
    addTag()
  }
}

// Submit
async function submit() {
  if (!form.name.trim()) {
    error.value = 'O nome do clube é obrigatório.'
    return
  }

  submitting.value = true
  error.value = null

  try {
    const input: Record<string, any> = {
      name:             form.name.trim(),
      mode:             form.mode,
      visibility:       form.visibility,
      shortDescription: form.shortDescription || null,
      longDescription:  form.longDescription  || null,
      coverImage:       form.coverImage        || null,
      themeColor:       form.themeColor        || null,
      maxMembers:       form.maxMembers         || null,
      tags:             form.tags.length ? form.tags : null,
      level:            form.level             || null,
      language:         form.language          || null,
      estimatedDuration:form.estimatedDuration || null,
      requireApproval:  form.requireApproval,
      allowInvites:     form.allowInvites,
      welcomeMessage:   form.welcomeMessage    || null,
      rules:            form.rules             || null,
      // Flags
      assignmentsEnabled:  form.assignmentsEnabled,
      gradingEnabled:      form.gradingEnabled,
      discussionsEnabled:  form.discussionsEnabled,
      liveSessionsEnabled: form.liveSessionsEnabled,
      gamificationEnabled: form.gamificationEnabled,
      rankingEnabled:      form.rankingEnabled,
      certificatesEnabled: form.certificatesEnabled,
    }

    const club = await clubs.createClub(input)
    router.push(`/clubs/${club.slug}`)
  } catch (e: any) {
    error.value = e?.message || 'Não foi possível criar o clube. Tente novamente.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#f7f5f0]">

    <!-- Header -->
    <header class="bg-[#0c1b32] pt-20 pb-10 px-8">
      <div class="max-w-[680px] mx-auto">
        <button
          class="inline-flex items-center gap-1.5 text-[0.75rem] text-white/30 border-none bg-transparent cursor-pointer hover:text-white/80 transition-colors mb-6"
          @click="router.push('/clubs')"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Voltar aos clubes
        </button>
        <h1 class="text-[2rem] font-extrabold text-white tracking-[-0.03em] mb-2">Criar clube</h1>
        <p class="text-sm font-light text-white/40">Configure seu ambiente de aprendizado colaborativo.</p>
      </div>
    </header>

    <!-- Form -->
    <form class="max-w-[680px] mx-auto px-4 md:px-0 py-10 flex flex-col gap-10" @submit.prevent="submit">

      <!-- 1. Identidade -->
      <section class="bg-white rounded-2xl border border-[#e8e4dc] p-6 md:p-8 flex flex-col gap-5">
        <h2 class="text-[0.88rem] font-bold text-[#111] tracking-[0.06em] uppercase text-[#aaa]">Identidade</h2>

        <!-- Name -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[0.82rem] font-semibold text-[#555]">Nome do clube <span class="text-red-500">*</span></label>
          <input
            v-model="form.name"
            type="text"
            maxlength="255"
            placeholder="Ex: Turma de Física 2026"
            class="h-11 px-4 bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[0.95rem] text-[#111] outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all"
          />
        </div>

        <!-- Short description -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[0.82rem] font-semibold text-[#555]">Descrição curta</label>
          <input
            v-model="form.shortDescription"
            type="text"
            maxlength="500"
            placeholder="Uma frase que resume o clube"
            class="h-11 px-4 bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[0.95rem] text-[#111] outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all"
          />
        </div>

        <!-- Long description -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[0.82rem] font-semibold text-[#555]">Descrição completa</label>
          <textarea
            v-model="form.longDescription"
            rows="4"
            placeholder="Descreva os objetivos, o que os membros vão aprender, quem pode participar..."
            class="px-4 py-3 bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[0.9rem] text-[#111] outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all resize-none"
          ></textarea>
        </div>

        <!-- Cover image URL -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[0.82rem] font-semibold text-[#555]">URL da capa</label>
          <input
            v-model="form.coverImage"
            type="url"
            placeholder="https://..."
            class="h-11 px-4 bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[0.9rem] text-[#111] outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all"
          />
        </div>

        <!-- Tags -->
        <div class="flex flex-col gap-2">
          <label class="text-[0.82rem] font-semibold text-[#555]">Tags</label>
          <div class="flex flex-wrap gap-1.5 mb-1">
            <span
              v-for="tag in form.tags"
              :key="tag"
              class="flex items-center gap-1 text-[0.72rem] font-semibold px-2.5 py-1 bg-[#f0faf7] border border-[#c5e8df] text-[#079272] rounded-full"
            >
              #{{ tag }}
              <button type="button" class="border-none bg-transparent cursor-pointer text-[#079272] opacity-60 hover:opacity-100" @click="removeTag(tag)">×</button>
            </span>
          </div>
          <input
            v-model="tagInput"
            type="text"
            placeholder="Digite uma tag e pressione Enter"
            class="h-10 px-4 bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[0.88rem] text-[#111] outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all"
            :disabled="form.tags.length >= 8"
            @keydown="handleTagKeydown"
            @blur="addTag"
          />
          <p class="text-[0.7rem] text-[#aaa]">Pressione Enter, vírgula ou espaço para adicionar. Máximo 8 tags.</p>
        </div>
      </section>

      <!-- 2. Modo -->
      <section class="bg-white rounded-2xl border border-[#e8e4dc] p-6 md:p-8 flex flex-col gap-4">
        <h2 class="text-[0.88rem] font-bold tracking-[0.06em] uppercase text-[#aaa]">Modo do clube</h2>
        <p class="text-[0.82rem] text-[#777]">Define o comportamento padrão. As funcionalidades podem ser ajustadas individualmente abaixo.</p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            v-for="opt in MODE_OPTIONS"
            :key="opt.value"
            class="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
            :class="form.mode === opt.value ? 'border-[#079272] bg-[#f0faf7]' : 'border-[#e8e4dc] bg-white hover:border-[#c5e8df]'"
          >
            <input type="radio" v-model="form.mode" :value="opt.value" class="sr-only" />
            <span class="text-xl mt-0.5">{{ opt.emoji }}</span>
            <div>
              <div class="text-[0.88rem] font-bold text-[#111]">{{ opt.label }}</div>
              <div class="text-[0.75rem] text-[#777] mt-0.5">{{ opt.desc }}</div>
            </div>
          </label>
        </div>
      </section>

      <!-- 3. Visibilidade e acesso -->
      <section class="bg-white rounded-2xl border border-[#e8e4dc] p-6 md:p-8 flex flex-col gap-5">
        <h2 class="text-[0.88rem] font-bold tracking-[0.06em] uppercase text-[#aaa]">Visibilidade e acesso</h2>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label
            v-for="opt in VISIBILITY_OPTIONS"
            :key="opt.value"
            class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer text-center transition-all"
            :class="form.visibility === opt.value ? 'border-[#079272] bg-[#f0faf7]' : 'border-[#e8e4dc] bg-white hover:border-[#c5e8df]'"
          >
            <input type="radio" v-model="form.visibility" :value="opt.value" class="sr-only" />
            <span class="text-2xl">{{ opt.icon }}</span>
            <div class="text-[0.85rem] font-bold text-[#111]">{{ opt.label }}</div>
            <div class="text-[0.72rem] text-[#888]">{{ opt.desc }}</div>
          </label>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#f7f5f0]">
          <label class="flex items-center gap-3 cursor-pointer">
            <div
              class="w-10 h-6 rounded-full relative transition-colors flex-shrink-0"
              :class="form.requireApproval ? 'bg-[#079272]' : 'bg-[#e8e4dc]'"
              @click="form.requireApproval = !form.requireApproval"
            >
              <div class="w-4 h-4 rounded-full bg-white absolute top-1 transition-all" :class="form.requireApproval ? 'left-5' : 'left-1'"></div>
            </div>
            <div>
              <div class="text-[0.85rem] font-semibold text-[#333]">Exigir aprovação</div>
              <div class="text-[0.72rem] text-[#aaa]">Novos membros ficam como "Pendente"</div>
            </div>
          </label>

          <label class="flex items-center gap-3 cursor-pointer">
            <div
              class="w-10 h-6 rounded-full relative transition-colors flex-shrink-0"
              :class="form.allowInvites ? 'bg-[#079272]' : 'bg-[#e8e4dc]'"
              @click="form.allowInvites = !form.allowInvites"
            >
              <div class="w-4 h-4 rounded-full bg-white absolute top-1 transition-all" :class="form.allowInvites ? 'left-5' : 'left-1'"></div>
            </div>
            <div>
              <div class="text-[0.85rem] font-semibold text-[#333]">Permitir convites</div>
              <div class="text-[0.72rem] text-[#aaa]">Membros podem convidar outras pessoas</div>
            </div>
          </label>
        </div>

        <!-- Max members -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[0.82rem] font-semibold text-[#555]">Máximo de membros <span class="text-[#bbb] font-normal">(deixe vazio para ilimitado)</span></label>
          <input
            v-model.number="form.maxMembers"
            type="number"
            min="2"
            max="10000"
            placeholder="Ex: 30"
            class="h-11 px-4 bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[0.95rem] text-[#111] outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all w-40"
          />
        </div>
      </section>

      <!-- 4. Configurações extras -->
      <section class="bg-white rounded-2xl border border-[#e8e4dc] p-6 md:p-8 flex flex-col gap-5">
        <h2 class="text-[0.88rem] font-bold tracking-[0.06em] uppercase text-[#aaa]">Configurações extras</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-[0.82rem] font-semibold text-[#555]">Nível</label>
            <select
              v-model="form.level"
              class="h-11 px-4 bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[0.9rem] text-[#555] outline-none focus:ring-2 focus:ring-[#079272] cursor-pointer"
            >
              <option value="">Sem nível definido</option>
              <option value="iniciante">Iniciante</option>
              <option value="intermediário">Intermediário</option>
              <option value="avançado">Avançado</option>
            </select>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-[0.82rem] font-semibold text-[#555]">Idioma</label>
            <select
              v-model="form.language"
              class="h-11 px-4 bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[0.9rem] text-[#555] outline-none focus:ring-2 focus:ring-[#079272] cursor-pointer"
            >
              <option value="pt-BR">Português (BR)</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-[0.82rem] font-semibold text-[#555]">Mensagem de boas-vindas</label>
          <textarea
            v-model="form.welcomeMessage"
            rows="2"
            placeholder="Texto exibido quando um novo membro entra no clube"
            class="px-4 py-3 bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl text-[0.88rem] text-[#111] outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all resize-none"
          ></textarea>
        </div>
      </section>

      <!-- 5. Feature flags -->
      <section class="bg-white rounded-2xl border border-[#e8e4dc] p-6 md:p-8 flex flex-col gap-4">
        <div>
          <h2 class="text-[0.88rem] font-bold tracking-[0.06em] uppercase text-[#aaa]">Funcionalidades</h2>
          <p class="text-[0.78rem] text-[#aaa] mt-1">Pré-definidas pelo modo escolhido. Personalize aqui se necessário.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            v-for="flag in [
              { key: 'assignmentsEnabled',  label: 'Tarefas',         desc: 'Criar e enviar assignments' },
              { key: 'gradingEnabled',       label: 'Correção',        desc: 'Notas e feedback' },
              { key: 'discussionsEnabled',   label: 'Discussões',      desc: 'Feed de posts abertos' },
              { key: 'liveSessionsEnabled',  label: 'Sessões ao vivo', desc: 'Videoaulas e encontros' },
              { key: 'gamificationEnabled',  label: 'Gamificação',     desc: 'Pontos e conquistas' },
              { key: 'rankingEnabled',       label: 'Ranking',         desc: 'Tabela de líderes' },
              { key: 'certificatesEnabled',  label: 'Certificados',    desc: 'Emissão de certificados' },
            ]"
            :key="flag.key"
            class="flex items-center gap-3 p-3 rounded-xl border border-[#e8e4dc] cursor-pointer hover:border-[#c5e8df] transition-colors"
            :class="(form as any)[flag.key] ? 'bg-[#f0faf7] border-[#c5e8df]' : 'bg-white'"
          >
            <div
              class="w-9 h-5 rounded-full relative transition-colors flex-shrink-0"
              :class="(form as any)[flag.key] ? 'bg-[#079272]' : 'bg-[#e8e4dc]'"
              @click.prevent="(form as any)[flag.key] = !(form as any)[flag.key]"
            >
              <div class="w-3 h-3 rounded-full bg-white absolute top-1 transition-all" :class="(form as any)[flag.key] ? 'left-[18px]' : 'left-1'"></div>
            </div>
            <div>
              <div class="text-[0.82rem] font-semibold text-[#333]">{{ flag.label }}</div>
              <div class="text-[0.68rem] text-[#aaa]">{{ flag.desc }}</div>
            </div>
          </label>
        </div>
      </section>

      <!-- Error -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[0.85rem] text-red-700 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {{ error }}
      </div>

      <!-- Submit -->
      <div class="flex gap-3 justify-end">
        <button
          type="button"
          class="px-6 py-3 rounded-xl border border-[#e8e4dc] text-[#666] font-semibold bg-white hover:bg-[#f7f5f0] transition-colors cursor-pointer"
          @click="router.push('/clubs')"
        >
          Cancelar
        </button>
        <button
          type="submit"
          :disabled="submitting || !form.name.trim()"
          class="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#079272] text-white font-semibold hover:bg-[#068060] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-none"
        >
          <svg v-if="submitting" class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          {{ submitting ? 'Criando...' : 'Criar clube' }}
        </button>
      </div>
    </form>
  </div>
</template>
