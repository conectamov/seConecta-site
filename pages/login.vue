<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' })
useSeoMeta({ title: 'Entrar — seConecta' })

const router = useRouter()
const route = useRoute()
const { login, register } = useAuth()

const activeTab = ref(route.query.mode === 'register' ? 'register' : 'login')
const loginForm = ref({ email: '', password: '' })
const registerForm = ref({ email: '', username: '', password: '', confirmPassword: '', full_name: '' })
const submitting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const showPass = ref(false)
const showConfirm = ref(false)
const loginErr = ref<Record<string, string>>({})
const registerErr = ref<Record<string, string>>({})

function validateLogin() {
  loginErr.value = {}
  if (!loginForm.value.email.trim()) loginErr.value.email = 'E-mail obrigatório.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginForm.value.email)) loginErr.value.email = 'E-mail inválido.'
  if (!loginForm.value.password) loginErr.value.password = 'Senha obrigatória.'
  return !Object.keys(loginErr.value).length
}

function validateRegister() {
  registerErr.value = {}
  if (!registerForm.value.full_name.trim()) registerErr.value.full_name = 'Nome completo obrigatório.'
  if (!registerForm.value.username.trim()) registerErr.value.username = 'Nome de usuário obrigatório.'
  else if (registerForm.value.username.length > 64) registerErr.value.username = 'Máximo 64 caracteres.'
  else if (!/^[a-z0-9_]+$/.test(registerForm.value.username)) registerErr.value.username = 'Apenas letras minúsculas, números e _.'
  if (!registerForm.value.email.trim()) registerErr.value.email = 'E-mail obrigatório.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.value.email)) registerErr.value.email = 'E-mail inválido.'
  if (!registerForm.value.password) registerErr.value.password = 'Senha obrigatória.'
  else if (registerForm.value.password.length < 8) registerErr.value.password = 'Mínimo 8 caracteres.'
  if (registerForm.value.password !== registerForm.value.confirmPassword) registerErr.value.confirmPassword = 'As senhas não coincidem.'
  return !Object.keys(registerErr.value).length
}

const pwdStrength = computed(() => {
  const p = registerForm.value.password
  if (!p) return 0
  let s = 0
  if (p.length >= 8) s++
  if (p.length >= 12) s++
  if (/[A-Z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return s
})
const pwdLabel = computed(() => ['', 'Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte'][pwdStrength.value] || '')
const pwdColor = computed(() => ['', '#e53e3e', '#f6891a', '#f6c90e', '#079272', '#2464E8'][pwdStrength.value] || '')

async function handleLogin() {
  if (!validateLogin()) return
  submitting.value = true; errorMsg.value = ''
  try {
    await login(loginForm.value.email, loginForm.value.password)
    router.replace((route.query.redirect as string) || '/')
  } catch (err: any) {
    const status = err?.response?.status
    errorMsg.value = (status === 401 || status === 400) ? 'E-mail ou senha incorretos.' : 'Erro ao fazer login. Tente novamente.'
  } finally { submitting.value = false }
}

async function handleRegister() {
  if (!validateRegister()) return
  submitting.value = true; errorMsg.value = ''; successMsg.value = ''
  try {
    await register({ email: registerForm.value.email, username: registerForm.value.username, password: registerForm.value.password, full_name: registerForm.value.full_name })
    successMsg.value = 'Conta criada! Fazendo login...'
    await login(registerForm.value.email, registerForm.value.password)
    router.replace('/')
  } catch (err: any) {
    const status = err?.response?.status
    const detail = err?.response?.data?.detail
    if (status === 409 || (status === 400 && typeof detail === 'string' && detail.includes('exist')))
      errorMsg.value = 'Este e-mail ou username já está em uso.'
    else if (status === 422) errorMsg.value = 'Dados inválidos. Verifique os campos.'
    else errorMsg.value = 'Erro ao criar conta. Tente novamente.'
  } finally { submitting.value = false }
}

function switchTab(tab: string) {
  activeTab.value = tab
  errorMsg.value = ''; successMsg.value = ''
  loginErr.value = {}; registerErr.value = {}
}
</script>

<template>
  <div class="min-h-screen bg-[#0c1b32] flex">

    <!-- Painel esquerdo — branding -->
    <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12">
      <div class="absolute inset-0 pointer-events-none"
        :style="{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '50px 50px' }"
        aria-hidden="true"></div>
      <div class="absolute w-[350px] h-[350px] rounded-full bg-[#079272] opacity-15 blur-[80px] top-[10%] left-[10%] pointer-events-none" style="animation: orb1 8s ease-in-out infinite;"></div>
      <div class="absolute w-[250px] h-[250px] rounded-full bg-[#2464E8] opacity-15 blur-[80px] bottom-[20%] right-[5%] pointer-events-none" style="animation: orb2 11s ease-in-out infinite reverse;"></div>

      <div class="relative z-10 flex-1 flex flex-col justify-center">
        <p class="text-[clamp(2rem,3.5vw,3rem)] font-extrabold text-white leading-[1.1] tracking-[-0.03em] mb-6">
          Conecte-se<br/>com quem<br/>
          <em class="not-italic bg-gradient-to-r from-[#079272] to-[#2464E8] bg-clip-text text-transparent">constrói</em> o futuro.
        </p>
        <p class="text-sm font-light text-white/40 leading-relaxed max-w-[340px]">
          Histórias reais de pessoas que estão transformando tecnologia, design e cultura.
        </p>
      </div>

      <!-- Depoimento -->
      <div class="relative z-10 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5">
        <p class="text-sm font-light text-white/60 leading-relaxed mb-4 italic">
          "O Conecta me ajudou a compartilhar minha trajetória e conectar com pessoas incríveis da área de tecnologia."
        </p>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#079272] to-[#2464E8] flex items-center justify-center text-white text-xs font-bold">M</div>
          <div>
            <div class="text-xs font-semibold text-white">Marcos Vinicios</div>
            <div class="text-[0.68rem] text-white/30">Game Developer · Cumbuca Labs</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Painel direito — formulário -->
    <div class="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 bg-[#f7f5f0] relative">

      <!-- Logo mobile -->
      <button class="lg:hidden absolute top-6 left-6 text-base font-bold tracking-[-0.02em] text-[#111] bg-none border-none cursor-pointer" @click="router.push('/')">
        conecta<span class="text-[#079272]">.</span>
      </button>

      <div class="w-full max-w-[400px]">

        <!-- Tab switcher -->
        <div class="flex bg-white border border-[#e8e4dc] rounded-xl p-1 mb-8">
          <button class="flex-1 text-sm font-semibold py-2.5 rounded-lg transition-all duration-200 border-none cursor-pointer"
            :class="activeTab === 'login' ? 'bg-[#0d0d0d] text-white shadow-sm' : 'text-[#aaa] hover:text-[#555] bg-transparent'"
            @click="switchTab('login')">Entrar</button>
          <button class="flex-1 text-sm font-semibold py-2.5 rounded-lg transition-all duration-200 border-none cursor-pointer"
            :class="activeTab === 'register' ? 'bg-[#0d0d0d] text-white shadow-sm' : 'text-[#aaa] hover:text-[#555] bg-transparent'"
            @click="switchTab('register')">Criar conta</button>
        </div>

        <!-- Heading -->
        <div class="mb-7">
          <h1 class="text-2xl font-bold text-[#111] tracking-[-0.02em] mb-1">
            {{ activeTab === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta' }}
          </h1>
          <p class="text-sm font-light text-[#aaa]">
            {{ activeTab === 'login' ? 'Entre com seu e-mail e senha para continuar.' : 'Junte-se a nossa comunidade SeConecta.' }}
          </p>
        </div>

        <!-- Sucesso -->
        <div v-if="successMsg" class="flex items-center gap-2.5 bg-[#e8f5f2] border border-[#b2dfdb] text-[#079272] rounded-xl px-4 py-3 mb-5 text-sm font-medium">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          {{ successMsg }}
        </div>

        <!-- Erro -->
        <div v-if="errorMsg" class="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-5 text-sm font-medium">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ errorMsg }}
          <button class="ml-auto text-red-400 hover:text-red-600 leading-none border-none bg-transparent cursor-pointer" @click="errorMsg = ''">✕</button>
        </div>

        <!-- FORM LOGIN -->
        <form v-if="activeTab === 'login'" class="flex flex-col gap-4" @submit.prevent="handleLogin">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-[0.08em] text-[#888] mb-1.5">E-mail</label>
            <input v-model="loginForm.email" type="email" placeholder="seu@email.com" autocomplete="email"
              class="w-full h-11 px-4 bg-white border rounded-xl text-[0.9rem] text-[#111] placeholder:text-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all duration-200"
              :class="loginErr.email ? 'border-red-400' : 'border-[#e8e4dc]'"
              @input="delete loginErr.email" />
            <p v-if="loginErr.email" class="text-xs text-red-500 mt-1">{{ loginErr.email }}</p>
          </div>

          <div>
            <div class="flex justify-between items-baseline mb-1.5">
              <label class="text-xs font-semibold uppercase tracking-[0.08em] text-[#888]">Senha</label>
              <button type="button" class="text-xs text-[#079272] hover:underline bg-none border-none cursor-pointer font-medium">Esqueceu?</button>
            </div>
            <div class="relative">
              <input v-model="loginForm.password" :type="showPass ? 'text' : 'password'" placeholder="••••••••" autocomplete="current-password"
                class="w-full h-11 px-4 pr-11 bg-white border rounded-xl text-[0.9rem] text-[#111] placeholder:text-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all duration-200"
                :class="loginErr.password ? 'border-red-400' : 'border-[#e8e4dc]'"
                @input="delete loginErr.password" />
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#555] bg-none border-none cursor-pointer" @click="showPass = !showPass">
                <svg v-if="!showPass" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <p v-if="loginErr.password" class="text-xs text-red-500 mt-1">{{ loginErr.password }}</p>
          </div>

          <button type="submit"
            class="w-full h-11 flex items-center justify-center gap-2 text-sm font-semibold bg-[#0d0d0d] text-white rounded-xl border-none cursor-pointer hover:bg-[#079272] transition-all duration-200 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="submitting">
            <svg v-if="submitting" class="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            {{ submitting ? 'Entrando...' : 'Entrar' }}
          </button>

          <div class="flex items-center gap-3"><div class="flex-1 h-px bg-[#e8e4dc]"></div><span class="text-xs text-[#ccc]">ou</span><div class="flex-1 h-px bg-[#e8e4dc]"></div></div>

          <p class="text-center text-sm text-[#aaa]">
            Não tem conta?
            <button type="button" class="text-[#079272] font-semibold hover:underline bg-none border-none cursor-pointer" @click="switchTab('register')">Cadastre-se</button>
          </p>
        </form>

        <!-- FORM CADASTRO -->
        <form v-else class="flex flex-col gap-4" @submit.prevent="handleRegister">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-[0.08em] text-[#888] mb-1.5">Nome completo</label>
            <input v-model="registerForm.full_name" type="text" placeholder="Seu nome" autocomplete="name"
              class="w-full h-11 px-4 bg-white border rounded-xl text-[0.9rem] text-[#111] placeholder:text-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all duration-200"
              :class="registerErr.full_name ? 'border-red-400' : 'border-[#e8e4dc]'"
              @input="delete registerErr.full_name" />
            <p v-if="registerErr.full_name" class="text-xs text-red-500 mt-1">{{ registerErr.full_name }}</p>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-[0.08em] text-[#888] mb-1.5">Nome de usuário</label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#aaa] text-sm font-medium select-none">@</span>
              <input v-model="registerForm.username" type="text" placeholder="seu_username" autocomplete="username" maxlength="64"
                class="w-full h-11 pl-8 pr-4 bg-white border rounded-xl text-[0.9rem] text-[#111] placeholder:text-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all duration-200"
                :class="registerErr.username ? 'border-red-400' : 'border-[#e8e4dc]'"
                @input="registerForm.username = (registerForm.username as string).toLowerCase().replace(/[^a-z0-9_]/g, ''); delete registerErr.username" />
            </div>
            <p v-if="registerErr.username" class="text-xs text-red-500 mt-1">{{ registerErr.username }}</p>
            <p v-else class="text-[0.68rem] text-[#aaa] mt-1">Apenas letras minúsculas, números e _</p>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-[0.08em] text-[#888] mb-1.5">E-mail</label>
            <input v-model="registerForm.email" type="email" placeholder="seu@email.com" autocomplete="email"
              class="w-full h-11 px-4 bg-white border rounded-xl text-[0.9rem] text-[#111] placeholder:text-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all duration-200"
              :class="registerErr.email ? 'border-red-400' : 'border-[#e8e4dc]'"
              @input="delete registerErr.email" />
            <p v-if="registerErr.email" class="text-xs text-red-500 mt-1">{{ registerErr.email }}</p>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-[0.08em] text-[#888] mb-1.5">Senha</label>
            <div class="relative">
              <input v-model="registerForm.password" :type="showPass ? 'text' : 'password'" placeholder="Mínimo 8 caracteres" autocomplete="new-password"
                class="w-full h-11 px-4 pr-11 bg-white border rounded-xl text-[0.9rem] text-[#111] placeholder:text-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all duration-200"
                :class="registerErr.password ? 'border-red-400' : 'border-[#e8e4dc]'"
                @input="delete registerErr.password" />
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#555] bg-none border-none cursor-pointer" @click="showPass = !showPass">
                <svg v-if="!showPass" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <div v-if="registerForm.password" class="mt-2">
              <div class="flex gap-1 mb-1">
                <div v-for="i in 5" :key="i" class="h-1 flex-1 rounded-full transition-all duration-300" :style="{ background: i <= pwdStrength ? pwdColor : '#e8e4dc' }"></div>
              </div>
              <p class="text-[0.7rem] font-medium" :style="{ color: pwdColor }">{{ pwdLabel }}</p>
            </div>
            <p v-if="registerErr.password" class="text-xs text-red-500 mt-1">{{ registerErr.password }}</p>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-[0.08em] text-[#888] mb-1.5">Confirmar senha</label>
            <div class="relative">
              <input v-model="registerForm.confirmPassword" :type="showConfirm ? 'text' : 'password'" placeholder="Repita a senha" autocomplete="new-password"
                class="w-full h-11 px-4 pr-11 bg-white border rounded-xl text-[0.9rem] text-[#111] placeholder:text-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#079272] focus:border-transparent transition-all duration-200"
                :class="registerErr.confirmPassword ? 'border-red-400' : 'border-[#e8e4dc]'"
                @input="delete registerErr.confirmPassword" />
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#555] bg-none border-none cursor-pointer" @click="showConfirm = !showConfirm">
                <svg v-if="!showConfirm" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <p v-if="registerErr.confirmPassword" class="text-xs text-red-500 mt-1">{{ registerErr.confirmPassword }}</p>
          </div>

          <p class="text-[0.72rem] text-[#aaa] leading-relaxed">
            Ao criar conta, você concorda com os
            <button type="button" class="text-[#079272] font-medium hover:underline bg-none border-none cursor-pointer">Termos de Uso</button>
            e a
            <button type="button" class="text-[#079272] font-medium hover:underline bg-none border-none cursor-pointer">Política de Privacidade</button>.
          </p>

          <button type="submit"
            class="w-full h-11 flex items-center justify-center gap-2 text-sm font-semibold bg-[#0d0d0d] text-white rounded-xl border-none cursor-pointer hover:bg-[#079272] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="submitting">
            <svg v-if="submitting" class="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            {{ submitting ? 'Criando conta...' : 'Criar conta' }}
          </button>

          <p class="text-center text-sm text-[#aaa]">
            Já tem conta?
            <button type="button" class="text-[#079272] font-semibold hover:underline bg-none border-none cursor-pointer" @click="switchTab('login')">Entrar</button>
          </p>
        </form>

      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes orb1 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-40px) scale(1.05)} }
@keyframes orb2 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-30px) scale(1.03)} }
</style>
