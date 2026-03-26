<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Meu Perfil — seConecta' })

const router = useRouter()
const { patch, del, post } = useAxios()
const { currentUser, fetchMe, logout, isAuthenticated } = useAuth()

const activeTab = ref('info')

// ── Country definitions ───────────────────────────────────────────────────────
const COUNTRIES = [
  { code: 'BR', flag: '🇧🇷', dial: '55',  placeholder: '(38) 98825-2013', minDigits: 12 },
  { code: 'US', flag: '🇺🇸', dial: '1',   placeholder: '(555) 867-5309',  minDigits: 11 },
  { code: 'PT', flag: '🇵🇹', dial: '351', placeholder: '912 345 678',     minDigits: 12 },
  { code: 'AR', flag: '🇦🇷', dial: '54',  placeholder: '(11) 2345-6789',  minDigits: 12 },
  { code: 'MX', flag: '🇲🇽', dial: '52',  placeholder: '(55) 1234-5678',  minDigits: 12 },
  { code: 'CO', flag: '🇨🇴', dial: '57',  placeholder: '(300) 123-4567',  minDigits: 12 },
]

const phoneCountry    = ref('BR')
const phoneDisplay    = ref('')
const selectedCountry = computed(() => COUNTRIES.find(c => c.code === phoneCountry.value) ?? COUNTRIES[0])

// ── Máscaras e conversão (mesmo código original) ─────────────────────────────
function maskDigits(digits: string, country: string): string {
  const d = digits.replace(/\D/g, '')
  if (!d) return ''
  if (country === 'BR') {
    if (d.length <= 2) return `(${d}`
    const area  = d.slice(0, 2)
    const local = d.slice(2)
    if (!local) return `(${area}) `
    const split = local.length >= 9 ? 5 : 4
    if (local.length <= split) return `(${area}) ${local}`
    return `(${area}) ${local.slice(0, split)}-${local.slice(split, split + 4)}`
  }
  if (country === 'US') {
    if (d.length <= 3) return `(${d}`
    const area = d.slice(0, 3)
    const rest = d.slice(3)
    if (!rest)            return `(${area}) `
    if (rest.length <= 3) return `(${area}) ${rest}`
    return `(${area}) ${rest.slice(0, 3)}-${rest.slice(3, 7)}`
  }
  return d
}

function buildE164(): string {
  const c      = selectedCountry.value
  const digits = phoneDisplay.value.replace(/\D/g, '')
  if (!digits) return ''
  if (c.code === 'BR') {
    const area  = digits.slice(0, 2)
    let   local = digits.slice(2)
    if (local.length === 9 && local.startsWith('9')) local = local.slice(1)
    if (!local) return ''
    return `${c.dial}${area}${local}`
  }
  return `${c.dial}${digits}`
}

function storedToDisplay(raw: string): { country: string; display: string } {
  if (!raw) return { country: 'BR', display: '' }
  const digits = raw.replace(/\D/g, '')
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)
  for (const c of sorted) {
    if (digits.startsWith(c.dial)) {
      const local = digits.slice(c.dial.length)
      return { country: c.code, display: maskDigits(local, c.code) }
    }
  }
  return { country: 'BR', display: maskDigits(digits.slice(2), 'BR') }
}

const willStripNine = computed(() => {
  if (phoneCountry.value !== 'BR') return false
  const d     = phoneDisplay.value.replace(/\D/g, '')
  const local = d.slice(2)
  return local.length === 9 && local.startsWith('9')
})

const phoneE164Form = computed(() => buildE164())
const savedPhone    = computed(() => currentUser.value?.phone ?? '')
const isLinked      = computed(() => currentUser.value?.linked ?? false)
const phoneUnsaved  = computed(() => phoneE164Form.value !== savedPhone.value)

// 🆕 Validação de telefone: verifica se o E164 tem o comprimento mínimo esperado
const phoneError = computed(() => {
  const e164 = phoneE164Form.value
  if (!e164) return null
  const expected = selectedCountry.value.minDigits
  if (e164.length !== expected) {
    return `Número incompleto. Deve ter ${expected - selectedCountry.value.dial.length} dígitos após o código do país.`
  }
  return null
})

function onPhoneInput(e: Event) {
  const raw    = (e.target as HTMLInputElement).value
  const digits = raw.replace(/\D/g, '')
  const max = phoneCountry.value === 'BR' ? 11 : 13
  phoneDisplay.value = maskDigits(digits.slice(0, max), phoneCountry.value)
}

watch(phoneCountry, (newCountry) => {
  const digits = phoneDisplay.value.replace(/\D/g, '')
  phoneDisplay.value = maskDigits(digits, newCountry)
})

// ── Info form ─────────────────────────────────────────────────────────────────
const infoForm = ref({
  full_name: '', email: '', birthdate: '',
  public_title: '', bio: '', location: '',
  profile_picture_url: '',
  opportunities: false,
})
const originalInfo = ref<any>({})
const infoErrors  = ref<Record<string, string>>({})
const infoSaving  = ref(false)
const infoSuccess = ref(false)
const infoError   = ref<string | null>(null)
const interestInput = ref('')
const interests     = ref<string[]>([])

function syncInfoForm(u: any) {
  if (!u) return
  infoForm.value.full_name           = u.full_name           ?? ''
  infoForm.value.email               = u.email               ?? ''
  infoForm.value.birthdate           = u.birthdate ? new Date(u.birthdate).toISOString().split('T')[0] : ''
  infoForm.value.public_title        = u.public_title        ?? ''
  infoForm.value.bio                 = u.bio                 ?? ''
  infoForm.value.location            = u.location            ?? ''
  infoForm.value.profile_picture_url = u.profile_picture_url ?? ''
  infoForm.value.opportunities       = u.opportunities       ?? false
  interests.value                    = u.interests ? [...u.interests] : []

  const parsed       = storedToDisplay(u.phone ?? '')
  phoneCountry.value = parsed.country
  phoneDisplay.value = parsed.display

  originalInfo.value = {
    full_name: infoForm.value.full_name,
    email: infoForm.value.email,
    birthdate: infoForm.value.birthdate,
    public_title: infoForm.value.public_title,
    bio: infoForm.value.bio,
    location: infoForm.value.location,
    profile_picture_url: infoForm.value.profile_picture_url,
    opportunities: infoForm.value.opportunities,
    interests: [...interests.value],
    phone: phoneE164Form.value,
  }
}
watch(currentUser, syncInfoForm, { immediate: true })

// ── Interests ─────────────────────────────────────────────────────────────────
function addInterest() {
  const val = interestInput.value.trim().toLowerCase().replace(/\s+/g, '-')
  if (!val || interests.value.includes(val) || interests.value.length >= 10) return
  interests.value.push(val)
  interestInput.value = ''
}
function removeInterest(tag: string) {
  interests.value = interests.value.filter(t => t !== tag)
}

// ── Validation (inclui telefone) ─────────────────────────────────────────────
function validateInfo() {
  infoErrors.value = {}
  if (!infoForm.value.email.trim()) infoErrors.value.email = 'Email é obrigatório.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(infoForm.value.email)) infoErrors.value.email = 'Email inválido.'
  if (infoForm.value.full_name.length > 255) infoErrors.value.full_name = 'Máximo 255 caracteres.'
  if (infoForm.value.bio.length > 500) infoErrors.value.bio = 'Máximo 500 caracteres.'

  // 🆕 Validação do telefone
  if (phoneE164Form.value && phoneError.value) {
    infoErrors.value.phone = phoneError.value
  }

  return !Object.keys(infoErrors.value).length
}

// ── infoChanged (comparação com snapshot original) ────────────────────────────
const infoChanged = computed(() => {
  if (!currentUser.value) return false

  const current = {
    full_name: infoForm.value.full_name,
    email: infoForm.value.email,
    birthdate: infoForm.value.birthdate,
    public_title: infoForm.value.public_title,
    bio: infoForm.value.bio,
    location: infoForm.value.location,
    profile_picture_url: infoForm.value.profile_picture_url,
    opportunities: infoForm.value.opportunities,
    interests: [...interests.value].sort(),
    phone: phoneE164Form.value,
  }
  const original = {
    full_name: originalInfo.value.full_name ?? '',
    email: originalInfo.value.email ?? '',
    birthdate: originalInfo.value.birthdate ?? '',
    public_title: originalInfo.value.public_title ?? '',
    bio: originalInfo.value.bio ?? '',
    location: originalInfo.value.location ?? '',
    profile_picture_url: originalInfo.value.profile_picture_url ?? '',
    opportunities: originalInfo.value.opportunities ?? false,
    interests: [...(originalInfo.value.interests ?? [])].sort(),
    phone: originalInfo.value.phone ?? '',
  }

  return JSON.stringify(current) !== JSON.stringify(original)
})

// ── Save info ─────────────────────────────────────────────────────────────────
async function saveInfo() {
  if (!validateInfo()) return
  infoSaving.value = true; infoError.value = null; infoSuccess.value = false
  const payload: Record<string, any> = {
    email:         infoForm.value.email.trim(),
    interests:     interests.value,
    opportunities: infoForm.value.opportunities,
  }
  if (infoForm.value.full_name.trim())           payload.full_name           = infoForm.value.full_name.trim()
  if (infoForm.value.birthdate)                  payload.birthdate           = infoForm.value.birthdate
  if (infoForm.value.public_title.trim())        payload.public_title        = infoForm.value.public_title.trim()
  if (infoForm.value.bio.trim())                 payload.bio                 = infoForm.value.bio.trim()
  if (infoForm.value.location.trim())            payload.location            = infoForm.value.location.trim()
  if (infoForm.value.profile_picture_url.trim()) payload.profile_picture_url = infoForm.value.profile_picture_url.trim()
  if (phoneE164Form.value && !phoneError.value)  payload.phone               = phoneE164Form.value
  try {
    await patch('/users/me', payload)
    await fetchMe()
    originalInfo.value = {
      full_name: infoForm.value.full_name,
      email: infoForm.value.email,
      birthdate: infoForm.value.birthdate,
      public_title: infoForm.value.public_title,
      bio: infoForm.value.bio,
      location: infoForm.value.location,
      profile_picture_url: infoForm.value.profile_picture_url,
      opportunities: infoForm.value.opportunities,
      interests: [...interests.value],
      phone: phoneE164Form.value,
    }
    infoSuccess.value = true
    setTimeout(() => { infoSuccess.value = false }, 3000)
  } catch (e: any) {
    if (e?.response?.status === 429) {
      infoError.value = 'Você fez muitas alterações em pouco tempo. Tente novamente em alguns minutos.'
    } else if (e?.response?.status === 409) {
      infoError.value = 'Email ou número de telefone já em uso.'
    } else if(e?.response?.status === 404) {
      infoError.value = 'Número de telefone não existe ou não está cadastrado no WhatsApp.'
    } else {
      infoError.value = 'Erro ao salvar. Tente novamente.'
    }
  } finally {
    infoSaving.value = false
  }
}

// ── Auto-save do toggle de newsletter (idêntico ao original) ─────────────────
let updatingOpportunities = false
watch(() => infoForm.value.opportunities, async (newVal, oldVal) => {
  if (updatingOpportunities) return
  if (newVal === oldVal) return
  if (!currentUser.value) return

  updatingOpportunities = true
  try {
    await patch('/users/me', { opportunities: newVal })
    await fetchMe()
    originalInfo.value.opportunities = newVal
    infoSuccess.value = true
    setTimeout(() => { infoSuccess.value = false }, 2000)
  } catch {
    infoForm.value.opportunities = oldVal
    infoError.value = 'Erro ao salvar preferência de newsletter.'
    setTimeout(() => { infoError.value = null }, 3000)
  } finally {
    updatingOpportunities = false
  }
})

// ── WhatsApp verification (idêntico ao original) ─────────────────────────────
const verifying        = ref(false)
const verifySuccess    = ref(false)
const verifyError      = ref<string | null>(null)
const refreshingLinked = ref(false)
const refreshError     = ref<string | null>(null)
const refreshSuccess   = ref(false)

async function sendVerification() {
  if (!savedPhone.value) return
  verifying.value = true; verifyError.value = null; verifySuccess.value = false
  try {
    await post(`/bot/verification-message?phone=${encodeURIComponent(savedPhone.value)}`)
    verifySuccess.value = true
  } catch (e: any) {
    verifyError.value = e?.response?.status === 429
      ? 'Muitas tentativas. Aguarde alguns minutos.'
      : 'Erro ao enviar mensagem. Tente novamente.'
  } finally {
    verifying.value = false
  }
}

async function refreshLinked() {
  refreshingLinked.value = true; refreshError.value = null; refreshSuccess.value = false
  try {
    await post('/users/refresh-linked')
    await fetchMe()
    if (currentUser.value?.linked) {
      refreshSuccess.value = true
      setTimeout(() => { refreshSuccess.value = false }, 4000)
    } else {
      refreshError.value = 'Verificação ainda não concluída. Complete pelo WhatsApp e tente novamente.'
    }
  } catch {
    refreshError.value = 'Erro ao atualizar status. Tente novamente.'
  } finally {
    refreshingLinked.value = false
  }
}

// ── Notifications ─────────────────────────────────────────────────────────────
const notifForm = ref({
  notify_comments: true, notify_replies: true,
  notify_likes: false,   notify_post_approved: true,
})
const notifSaving  = ref(false)
const notifSuccess = ref(false)
const notifError   = ref<string | null>(null)
watch(currentUser, (u) => {
  if (!u) return
  notifForm.value.notify_comments      = u.notify_comments      ?? true
  notifForm.value.notify_replies       = u.notify_replies       ?? true
  notifForm.value.notify_likes         = u.notify_likes         ?? false
  notifForm.value.notify_post_approved = u.notify_post_approved ?? true
}, { immediate: true })
const notifChanged = computed(() => {
  const u = currentUser.value; if (!u) return false
  return (
    notifForm.value.notify_comments      !== (u.notify_comments      ?? true)  ||
    notifForm.value.notify_replies       !== (u.notify_replies       ?? true)  ||
    notifForm.value.notify_likes         !== (u.notify_likes         ?? false) ||
    notifForm.value.notify_post_approved !== (u.notify_post_approved ?? true)
  )
})
async function saveNotifications() {
  notifSaving.value = true; notifError.value = null; notifSuccess.value = false
  try {
    await patch('/users/me', { ...notifForm.value })
    await fetchMe()
    notifSuccess.value = true
    setTimeout(() => { notifSuccess.value = false }, 3000)
  } catch {
    notifError.value = 'Erro ao salvar preferências.'
  } finally {
    notifSaving.value = false
  }
}

// ── Password ──────────────────────────────────────────────────────────────────
const pwForm    = ref({ current_password: '', new_password: '', confirm_password: '' })
const pwErrors  = ref<Record<string, string>>({})
const pwSaving  = ref(false)
const pwSuccess = ref(false)
const pwError   = ref<string | null>(null)
const showPw    = ref({ current: false, new: false, confirm: false })
watch(() => pwForm.value.current_password, () => delete pwErrors.value.current_password)
watch(() => pwForm.value.new_password,     () => delete pwErrors.value.new_password)
watch(() => pwForm.value.confirm_password, () => delete pwErrors.value.confirm_password)
function validatePw() {
  pwErrors.value = {}
  if (!pwForm.value.current_password) pwErrors.value.current_password = 'Senha atual é obrigatória.'
  if (!pwForm.value.new_password || pwForm.value.new_password.length < 8) pwErrors.value.new_password = 'Mínimo 8 caracteres.'
  else if (pwForm.value.new_password.length > 128) pwErrors.value.new_password = 'Máximo 128 caracteres.'
  if (pwForm.value.new_password !== pwForm.value.confirm_password) pwErrors.value.confirm_password = 'As senhas não coincidem.'
  return !Object.keys(pwErrors.value).length
}
async function savePassword() {
  if (!validatePw()) return
  pwSaving.value = true; pwError.value = null; pwSuccess.value = false
  try {
    await patch('/users/me/password', {
      current_password: pwForm.value.current_password,
      new_password:     pwForm.value.new_password,
    })
    pwSuccess.value = true
    pwForm.value = { current_password: '', new_password: '', confirm_password: '' }
    setTimeout(() => { pwSuccess.value = false }, 4000)
  } catch (e: any) {
    pwError.value = e?.response?.status === 400 ? 'Senha atual incorreta.' : 'Erro ao alterar senha. Tente novamente.'
  } finally {
    pwSaving.value = false
  }
}
const pwStrength = computed(() => {
  const p = pwForm.value.new_password; if (!p) return 0
  let score = 0
  if (p.length >= 8)       score++; if (p.length >= 12)     score++
  if (/[A-Z]/.test(p))     score++; if (/[0-9]/.test(p))    score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return score
})
const pwStrengthLabel = computed(() => ['', 'Muito fraca', 'Fraca', 'Média', 'Forte', 'Muito forte'][pwStrength.value] || '')
const pwStrengthColor = computed(() => ['', '#e53e3e', '#e53e3e', '#d97706', '#079272', '#079272'][pwStrength.value] || '')

// ── Delete account ────────────────────────────────────────────────────────────
const deleteModal   = ref(false)
const deleteConfirm = ref('')
const deleting      = ref(false)
const deleteError   = ref<string | null>(null)
const canDelete     = computed(() => deleteConfirm.value === currentUser.value?.username)
async function deleteAccount() {
  if (!canDelete.value) return
  deleting.value = true; deleteError.value = null
  try { await del('/users/me'); logout(); router.push('/login') }
  catch { deleteError.value = 'Erro ao deletar conta. Tente novamente.'; deleting.value = false }
}

// ── Misc computed ─────────────────────────────────────────────────────────────
const myPosts        = computed(() => currentUser.value?.posts ?? [])
const pendingPosts   = computed(() => myPosts.value.filter((p: any) => !p.approved))
const publishedPosts = computed(() => myPosts.value.filter((p: any) => p.approved))
const myComments     = computed(() => currentUser.value?.comments ?? [])
const userInitial    = computed(() => (currentUser.value?.full_name || currentUser.value?.username || '?').charAt(0).toUpperCase())
const isManager      = computed(() => currentUser.value?.is_manager   ?? false)
const isSuperuser    = computed(() => currentUser.value?.is_superuser ?? false)

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function timeAgo(dateStr: string) {
  if (!dateStr) return ''
  const diff  = Date.now() - new Date(dateStr).getTime()
  const days  = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  const mins  = Math.floor(diff / 60000)
  if (mins  < 60) return `há ${mins}min`
  if (hours < 24) return `há ${hours}h`
  if (days  < 30) return `há ${days}d`
  return formatDate(dateStr)
}
onMounted(() => { if (!isAuthenticated.value) router.replace('/login') })
</script>

<template>
  <div class="min-h-screen">

    <!-- ── Modal deletar conta ────────────────────────────────────────────── -->
    <Transition name="modal">
      <div v-if="deleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="deleteModal = false; deleteConfirm = ''"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl p-7 max-w-[440px] w-full z-10" style="animation: modalIn .25s ease">
          <div class="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-[#111] mb-1">Deletar conta?</h3>
          <p class="text-sm font-light text-[#666] mb-5 leading-relaxed">
            Esta ação é <strong class="font-semibold text-[#333]">irreversível</strong>. Todos os seus posts e comentários serão removidos permanentemente.
          </p>
          <label class="block text-xs font-semibold uppercase tracking-[0.1em] text-[#aaa] mb-2">
            Digite <span class="text-[#333]">{{ currentUser?.username }}</span> para confirmar
          </label>
          <input v-model="deleteConfirm" type="text" :placeholder="currentUser?.username"
            class="w-full h-10 px-4 text-sm text-[#111] bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 transition-all mb-4"/>
          <p v-if="deleteError" class="text-xs text-red-500 mb-3">{{ deleteError }}</p>
          <div class="flex gap-3">
            <button
              class="flex-1 text-sm font-semibold px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              :disabled="!canDelete || deleting" @click="deleteAccount"
            >
              <svg v-if="deleting" class="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              {{ deleting ? 'Deletando...' : 'Deletar minha conta' }}
            </button>
            <button
              class="flex-1 text-sm font-semibold px-4 py-2.5 bg-[#f7f5f0] text-[#555] rounded-xl hover:bg-[#e8e4dc] transition-colors border-none cursor-pointer"
              @click="deleteModal = false; deleteConfirm = ''"
            >Cancelar</button>
          </div>
        </div>
      </div>
    </Transition>

    <div class="max-w-[960px] mx-auto px-6 md:px-8 py-10">

      <!-- ── Hero ──────────────────────────────────────────────────────────── -->
      <div class="bg-white border border-[#e8e4dc] rounded-3xl overflow-hidden mb-8" style="animation: fadeUp .5s ease both">
        <div class="h-28 bg-gradient-to-r from-[#0c1b32] via-[#0d2a20] to-[#0c1b32] relative overflow-hidden">
          <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 20% 50%, #079272 0%, transparent 50%), radial-gradient(circle at 80% 50%, #2464E8 0%, transparent 50%)"></div>
          <div class="absolute inset-0 opacity-5" style="background-image: repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%); background-size: 12px 12px;"></div>
        </div>
        <div class="px-7 pb-7 mt-12">
          <div class="flex items-end gap-4 -mt-10 mb-5 flex-wrap">
            <div class="relative flex-shrink-0">
              <div class="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-[#079272] to-[#2464E8] flex items-center justify-center">
                <img v-if="currentUser?.profile_picture_url" :src="currentUser.profile_picture_url" :alt="currentUser.full_name"
                  class="w-full h-full object-cover" @error="($event.target as HTMLImageElement).style.display='none'"/>
                <span v-else class="text-3xl font-bold text-white">{{ userInitial }}</span>
              </div>
              <div v-if="isManager || isSuperuser"
                class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center"
                :class="isSuperuser ? 'bg-[#2464E8]' : 'bg-[#079272]'" :title="isSuperuser ? 'Admin' : 'Manager'">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>
            <div class="flex-1 min-w-0 pb-1 w-full sm:w-auto">
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="text-xl font-bold text-[#111] tracking-[-0.02em] truncate">{{ currentUser?.full_name || currentUser?.username }}</h1>
                <span v-if="currentUser?.public_title" class="text-[0.7rem] font-medium px-2.5 py-0.5 bg-[#f7f5f0] border border-[#e8e4dc] text-[#666] rounded-full">{{ currentUser.public_title }}</span>
                <span v-if="isSuperuser" class="text-[0.68rem] font-semibold px-2.5 py-0.5 bg-[#2464E8]/10 border border-[#2464E8]/20 text-[#2464E8] rounded-full">Admin</span>
                <span v-else-if="isManager" class="text-[0.68rem] font-semibold px-2.5 py-0.5 bg-[#079272]/10 border border-[#079272]/20 text-[#079272] rounded-full">Manager</span>
              </div>
              <p class="text-[0.82rem] text-[#aaa] mt-0.5">@{{ currentUser?.username }}</p>
              <p v-if="currentUser?.bio" class="text-[0.8rem] text-[#777] mt-1.5 leading-relaxed line-clamp-2">{{ currentUser.bio }}</p>
            </div>
            <div class="hidden sm:flex items-center gap-6 pb-1">
              <div class="text-center">
                <div class="text-lg font-bold text-[#111]">{{ publishedPosts.length }}</div>
                <div class="text-[0.68rem] text-[#aaa] font-medium">Publicados</div>
              </div>
              <div v-if="pendingPosts.length" class="text-center">
                <div class="text-lg font-bold text-amber-500">{{ pendingPosts.length }}</div>
                <div class="text-[0.68rem] text-[#aaa] font-medium">Em análise</div>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3 md:gap-4 flex-wrap text-[0.72rem] md:text-[0.75rem] text-[#999]">
            <span v-if="currentUser?.email" class="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              {{ currentUser.email }}
            </span>
            <span v-if="currentUser?.location" class="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ currentUser.location }}
            </span>
            <span v-if="currentUser?.phone" class="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.07 1.18 2 2 0 012.04 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.07 7.91a16 16 0 006.02 6.02l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              +{{ currentUser.phone }}
              <span v-if="isLinked" class="inline-flex items-center gap-1 text-[#079272] font-semibold">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                verificado
              </span>
            </span>
          </div>
          <div v-if="currentUser?.interests?.length" class="flex flex-wrap gap-1.5 mt-3">
            <span v-for="tag in currentUser.interests" :key="tag"
              class="text-[0.68rem] font-medium px-2 py-0.5 bg-[#f0faf7] border border-[#c5e8df] text-[#079272] rounded-full">#{{ tag }}</span>
          </div>
        </div>
      </div>

      <!-- ── Layout ─────────────────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">

        <!-- Sidebar -->
        <nav class="bg-white border border-[#e8e4dc] rounded-2xl p-3 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:sticky lg:top-20" style="animation: fadeUp .5s ease .1s both">
          <button v-for="tab in [
              { key: 'info',          icon: 'user',     label: 'Meu perfil'   },
              { key: 'notifications', icon: 'bell',     label: 'Notificações' },
              { key: 'security',      icon: 'lock',     label: 'Segurança'    },
              { key: 'activity',      icon: 'activity', label: 'Atividade'    },
            ]" :key="tab.key"
            class="flex items-center gap-2 lg:gap-3 px-3 lg:px-3.5 py-2 lg:py-2.5 rounded-xl text-[0.78rem] lg:text-[0.83rem] font-medium whitespace-nowrap transition-all cursor-pointer border-none text-left"
            :class="activeTab === tab.key ? 'bg-[#0d0d0d] text-white' : 'bg-transparent text-[#666] hover:bg-[#f7f5f0] hover:text-[#111]'"
            @click="activeTab = tab.key">
            <svg v-if="tab.icon === 'user'"      width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <svg v-else-if="tab.icon === 'bell'"  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            <svg v-else-if="tab.icon === 'lock'"  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <span class="hidden sm:inline">{{ tab.label }}</span>
            <span v-if="tab.key === 'activity' && pendingPosts.length"
              class="ml-auto text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full"
              :class="activeTab === 'activity' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-600'">{{ pendingPosts.length }}</span>
          </button>
        </nav>

        <!-- Content -->
        <div style="animation: fadeUp .5s ease .15s both">

          <!-- ── Tab: Meu perfil ────────────────────────────────────────────── -->
          <div v-if="activeTab === 'info'" class="flex flex-col gap-5">

            <div v-if="!isLinked" class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
              <div class="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <p class="text-[0.88rem] font-bold text-amber-800">Conta não verificada pelo WhatsApp</p>
                <p class="text-[0.78rem] text-amber-700 mt-0.5 leading-relaxed">Adicione seu número e conclua a verificação para receber notificações e usar todos os recursos.</p>
              </div>
            </div>

            <div class="bg-white border border-[#e8e4dc] rounded-2xl p-6">
              <h2 class="text-[0.88rem] font-bold text-[#111] tracking-[-0.01em] mb-5">Informações do perfil</h2>
              <div class="flex flex-col gap-4">

                <!-- Foto -->
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-[0.1em] text-[#aaa] mb-1.5">URL da foto de perfil</label>
                  <input v-model="infoForm.profile_picture_url" type="url" placeholder="https://exemplo.com/foto.jpg"
                    class="w-full h-11 px-4 text-sm text-[#111] bg-[#f7f5f0] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#079272] focus:bg-white transition-all"/>
                </div>

                <!-- Nome + Cargo -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold uppercase tracking-[0.1em] text-[#aaa] mb-1.5">Nome completo</label>
                    <input v-model="infoForm.full_name" type="text" placeholder="Seu nome" maxlength="255"
                      class="w-full h-11 px-4 text-sm text-[#111] bg-[#f7f5f0] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#079272] focus:bg-white transition-all"
                      :class="infoErrors.full_name ? 'border-red-400' : 'border-transparent'"/>
                    <p v-if="infoErrors.full_name" class="text-xs text-red-500 mt-1">{{ infoErrors.full_name }}</p>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold uppercase tracking-[0.1em] text-[#aaa] mb-1.5">Cargo público</label>
                    <input v-model="infoForm.public_title" type="text" placeholder="Ex: Engenheiro de Software" maxlength="128"
                      class="w-full h-11 px-4 text-sm text-[#111] bg-[#f7f5f0] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#079272] focus:bg-white transition-all"/>
                  </div>
                </div>

                <!-- Email -->
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-[0.1em] text-[#aaa] mb-1.5">E-mail <span class="text-red-500">*</span></label>
                  <input v-model="infoForm.email" type="email" placeholder="seu@email.com"
                    class="w-full h-11 px-4 text-sm text-[#111] bg-[#f7f5f0] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#079272] focus:bg-white transition-all"
                    :class="infoErrors.email ? 'border-red-400' : 'border-transparent'"/>
                  <p v-if="infoErrors.email" class="text-xs text-red-500 mt-1">{{ infoErrors.email }}</p>
                </div>

                <!-- Bio -->
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-[0.1em] text-[#aaa] mb-1.5">
                    Bio <span class="text-[#ccc] normal-case font-normal">({{ infoForm.bio.length }}/500)</span>
                  </label>
                  <textarea v-model="infoForm.bio" rows="3" maxlength="500" placeholder="Fale um pouco sobre você..."
                    class="w-full px-4 py-3 text-sm text-[#111] bg-[#f7f5f0] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#079272] focus:bg-white transition-all resize-none"
                    :class="infoErrors.bio ? 'border-red-400' : 'border-transparent'"></textarea>
                  <p v-if="infoErrors.bio" class="text-xs text-red-500 mt-1">{{ infoErrors.bio }}</p>
                </div>

                <!-- Localização + Telefone -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold uppercase tracking-[0.1em] text-[#aaa] mb-1.5">Localização</label>
                    <input v-model="infoForm.location" type="text" placeholder="Ex: São Paulo, SP"
                      class="w-full h-11 px-4 text-sm text-[#111] bg-[#f7f5f0] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#079272] focus:bg-white transition-all"/>
                  </div>

                  <div class="overflow-hidden break-words">
                    <label class="block text-xs font-semibold uppercase tracking-[0.1em] text-[#aaa] mb-1.5">
                      Telefone (WhatsApp)
                      <span v-if="savedPhone && isLinked"
                        class="ml-1.5 normal-case font-semibold text-[0.62rem] px-1.5 py-0.5 bg-[#e8f5f2] text-[#079272] rounded-full border border-[#c5e8df] align-middle">✓ verificado</span>
                      <span v-else-if="savedPhone && !isLinked && !phoneUnsaved"
                        class="ml-1.5 normal-case font-medium text-[0.62rem] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-full border border-amber-200 align-middle">não verificado</span>
                    </label>

                    <!-- Single smart input with country selector -->
                    <div class="flex gap-1.5">
                      <select v-model="phoneCountry"
                        class="h-11 px-2 text-sm bg-[#f7f5f0] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#079272] transition-all cursor-pointer flex-shrink-0">
                        <option v-for="c in COUNTRIES" :key="c.code" :value="c.code">{{ c.flag }} +{{ c.dial }}</option>
                      </select>
                      <input
                        :value="phoneDisplay"
                        @input="onPhoneInput"
                        type="tel"
                        :placeholder="selectedCountry.placeholder"
                        class="flex-1 h-11 px-3 text-sm text-[#111] bg-[#f7f5f0] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#079272] focus:bg-white transition-all min-w-0"
                      />
                    </div>

                    <!-- 9-stripping notice -->
                    <p v-if="willStripNine" class="text-[0.68rem] text-[#999] mt-1.5 flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      O 9 inicial será removido ao salvar — formato esperado pelo bot.
                    </p>

                    <!-- Exibição do erro de telefone -->
                    <p v-if="phoneError" class="text-red-500 text-xs mt-1">{{ phoneError }}</p>
                  </div>
                </div>

                <!-- ── Bloco de verificação WhatsApp ──────────────────────────────────────── -->
                <div class="clear-both mt-4">
                  <!-- Caso 1: nenhum número em lugar algum -->
                  <div v-if="!savedPhone && !phoneE164Form"
                    class="flex items-start gap-3 bg-[#f7f5f0] border border-[#e8e4dc] rounded-xl px-4 py-3.5">
                    <div class="w-8 h-8 rounded-lg bg-[#e8e4dc] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.07 1.18 2 2 0 012.04 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.07 7.91a16 16 0 006.02 6.02l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                    </div>
                    <div>
                      <p class="text-[0.83rem] font-semibold text-[#444]">Adicione seu número de WhatsApp</p>
                      <p class="text-[0.75rem] text-[#999] mt-0.5 leading-relaxed">Preencha o campo telefone acima, salve e conclua a verificação para receber notificações.</p>
                    </div>
                  </div>

                  <!-- Caso 2: número digitado mas não salvo -->
                  <div v-else-if="phoneUnsaved && phoneE164Form"
                    class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5">
                    <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <div>
                      <p class="text-[0.83rem] font-semibold text-amber-700">Salve para verificar</p>
                      <p class="text-[0.75rem] text-amber-600 mt-0.5">Clique em "Salvar alterações" para confirmar o número antes de verificar pelo WhatsApp.</p>
                    </div>
                  </div>

                  <!-- Caso 3: salvo, verificação pendente -->
                  <div v-else-if="savedPhone && !isLinked" class="bg-[#fffbf0] border border-amber-200 rounded-xl p-4">
                    <div class="flex items-start gap-3 mb-3.5">
                      <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="#d97706"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      </div>
                      <div>
                        <p class="text-[0.85rem] font-semibold text-amber-800">Verificação pendente</p>
                        <p class="text-[0.75rem] text-amber-700 mt-0.5 leading-relaxed">
                          Envie uma mensagem de verificação para <strong>+{{ savedPhone }}</strong> e conclua pelo WhatsApp.
                        </p>
                      </div>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <button
                        class="flex items-center gap-2 text-[0.8rem] font-semibold px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl border-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        :disabled="verifying" @click="sendVerification">
                        <svg v-if="verifying"  class="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                        <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        {{ verifying ? 'Enviando...' : 'Enviar código por WhatsApp' }}
                      </button>
                      <button
                        class="flex items-center gap-2 text-[0.8rem] font-semibold px-4 py-2 bg-white hover:bg-[#f7f5f0] text-amber-700 border border-amber-300 rounded-xl cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        :disabled="refreshingLinked" @click="refreshLinked">
                        <svg v-if="refreshingLinked" class="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                        <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                        {{ refreshingLinked ? 'Verificando...' : 'Já verifiquei' }}
                      </button>
                    </div>
                    <p v-if="verifySuccess" class="text-[0.75rem] text-amber-700 font-medium mt-2.5 flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Mensagem enviada! Conclua a verificação no WhatsApp e clique em "Já verifiquei".
                    </p>
                    <p v-if="verifyError"  class="text-[0.75rem] text-red-500 mt-2.5">{{ verifyError }}</p>
                    <p v-if="refreshError" class="text-[0.75rem] text-red-500 mt-2.5">{{ refreshError }}</p>
                  </div>

                  <!-- Caso 4: verificado ✓ -->
                  <div v-else-if="savedPhone && isLinked"
                    class="flex items-center gap-3 bg-[#f0faf7] border border-[#c5e8df] rounded-xl px-4 py-3">
                    <div class="w-7 h-7 rounded-lg bg-[#079272] flex items-center justify-center flex-shrink-0">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[0.83rem] font-semibold text-[#079272]">WhatsApp verificado</p>
                      <p class="text-[0.72rem] text-[#5a9e8a] mt-0.5">+{{ savedPhone }} está vinculado ao bot.</p>
                    </div>
                    <button class="text-[0.72rem] font-medium text-[#5a9e8a] hover:text-[#079272] border-none bg-transparent cursor-pointer underline flex-shrink-0"
                      :disabled="refreshingLinked" @click="refreshLinked">{{ refreshingLinked ? '...' : 'Atualizar' }}</button>
                  </div>
                </div>
                <!-- ── fim verificação ──────────────────────────────────── -->

                <!-- Nascimento -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold uppercase tracking-[0.1em] text-[#aaa] mb-1.5">Data de nascimento</label>
                    <input v-model="infoForm.birthdate" type="date"
                      class="w-full h-11 px-4 text-sm text-[#111] bg-[#f7f5f0] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#079272] focus:bg-white transition-all"/>
                  </div>
                </div>

                <!-- Interesses -->
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-[0.1em] text-[#aaa] mb-1.5">
                    Interesses <span class="text-[#ccc] normal-case font-normal">({{ interests.length }}/10)</span>
                  </label>
                  <div v-if="interests.length" class="flex flex-wrap gap-1.5 mb-2">
                    <span v-for="tag in interests" :key="tag"
                      class="inline-flex items-center gap-1 text-[0.72rem] font-medium px-2.5 py-1 bg-[#f0faf7] border border-[#c5e8df] text-[#079272] rounded-full">
                      #{{ tag }}
                      <button type="button"
                        class="w-3.5 h-3.5 rounded-full bg-[#c5e8df] hover:bg-red-100 hover:text-red-500 flex items-center justify-center border-none cursor-pointer transition-colors flex-shrink-0 ml-0.5"
                        :title="`Remover ${tag}`" @click.stop="removeInterest(tag)">
                        <svg width="7" height="7" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8">
                          <line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/>
                        </svg>
                      </button>
                    </span>
                  </div>
                  <div class="flex gap-2">
                    <input v-model="interestInput" type="text" placeholder="Ex: tecnologia, saúde, finanças"
                      class="flex-1 h-10 px-3 text-sm text-[#111] bg-[#f7f5f0] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#079272] focus:bg-white transition-all"
                      :disabled="interests.length >= 10"
                      @keydown.enter.prevent="addInterest" @keydown.188.prevent="addInterest"/>
                    <button type="button"
                      class="h-10 px-4 text-sm font-semibold bg-[#f7f5f0] text-[#555] hover:bg-[#e8e4dc] rounded-xl border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      :disabled="!interestInput.trim() || interests.length >= 10" @click="addInterest">+ Adicionar</button>
                  </div>
                  <p class="text-[0.68rem] text-[#bbb] mt-1">Pressione Enter ou vírgula para adicionar. Usado para personalizar seu feed.</p>
                </div>

                <!-- Feedbacks -->
                <div v-if="infoSuccess" class="flex items-center gap-2 text-[0.82rem] text-[#079272] font-medium">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Perfil atualizado com sucesso!
                </div>
                <div v-if="refreshSuccess" class="flex items-center gap-2 text-[0.82rem] text-[#079272] font-medium">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  WhatsApp verificado com sucesso!
                </div>
                <div v-if="infoError" class="text-[0.82rem] text-red-500">{{ infoError }}</div>

                <div class="flex justify-end pt-1">
                  <button
                    class="flex items-center gap-2 text-sm font-semibold px-6 py-2.5 bg-[#0d0d0d] text-white rounded-xl hover:bg-[#079272] transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-none cursor-pointer"
                    :disabled="infoSaving || !infoChanged" @click="saveInfo">
                    <svg v-if="infoSaving" class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    {{ infoSaving ? 'Salvando...' : 'Salvar alterações' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Newsletter -->
            <div class="bg-white border border-[#e8e4dc] rounded-2xl p-6">
              <h2 class="text-[0.88rem] font-bold text-[#111] tracking-[-0.01em] mb-1">Newsletter</h2>
              <p class="text-[0.78rem] text-[#aaa] mb-4 leading-relaxed">Receba oportunidades de bolsas, eventos e vagas diretamente no seu e-mail.</p>
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-[0.85rem] font-medium text-[#333]">Receber newsletter de oportunidades</p>
                  <p class="text-[0.75rem] text-[#aaa] mt-0.5">Enviado para <strong class="text-[#555]">{{ currentUser?.email }}</strong></p>
                </div>
                <div class="relative rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer"
                  style="width: 40px; height: 22px;"
                  :style="{ background: infoForm.opportunities ? '#079272' : '#ddd' }"
                  @click="infoForm.opportunities = !infoForm.opportunities">
                  <div class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
                    :style="{ transform: infoForm.opportunities ? 'translateX(20px)' : 'translateX(2px)' }"></div>
                </div>
              </div>
              <p class="text-[0.68rem] text-[#bbb] mt-3">Você pode alterar isso a qualquer momento. Salve para confirmar.</p>
            </div>

            <!-- Dados da conta (read-only) -->
            <div class="bg-white border border-[#e8e4dc] rounded-2xl p-6">
              <h2 class="text-[0.88rem] font-bold text-[#111] tracking-[-0.01em] mb-4">Dados da conta</h2>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="bg-[#f7f5f0] rounded-xl px-4 py-3">
                  <p class="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[#bbb] mb-1">Username</p>
                  <p class="text-[0.85rem] font-medium text-[#555]">@{{ currentUser?.username }}</p>
                </div>
                <div class="bg-[#f7f5f0] rounded-xl px-4 py-3">
                  <p class="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[#bbb] mb-1">ID da conta</p>
                  <p class="text-[0.85rem] font-medium text-[#555] truncate">{{ currentUser?.id?.slice(0, 8) }}...</p>
                </div>
                <div class="bg-[#f7f5f0] rounded-xl px-4 py-3">
                  <p class="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[#bbb] mb-1">Papel</p>
                  <p class="text-[0.85rem] font-medium" :class="isSuperuser ? 'text-[#2464E8]' : isManager ? 'text-[#079272]' : 'text-[#555]'">
                    {{ isSuperuser ? 'Admin' : isManager ? 'Manager' : 'Usuário' }}
                  </p>
                </div>
              </div>
              <p class="text-[0.72rem] text-[#bbb] mt-3">Username e ID não podem ser alterados.</p>
            </div>
          </div>

          <!-- ── Tab: Notificações ──────────────────────────────────────────── -->
          <div v-else-if="activeTab === 'notifications'" class="flex flex-col gap-5">
            <div class="bg-white border border-[#e8e4dc] rounded-2xl p-6">
              <h2 class="text-[0.88rem] font-bold text-[#111] tracking-[-0.01em] mb-1">Preferências de notificação</h2>
              <p class="text-[0.78rem] text-[#aaa] mb-6">Escolha quando você quer ser notificado.</p>
              <div class="flex flex-col gap-1">
                <div v-for="pref in [
                    { key: 'notify_comments',     label: 'Alguém comentou no meu post',         desc: 'Notificação toda vez que um novo comentário chegar.'     },
                    { key: 'notify_replies',       label: 'Alguém respondeu meu comentário',      desc: 'Notificação quando alguém responder diretamente a você.' },
                    { key: 'notify_likes',         label: 'Alguém curtiu meu post ou comentário', desc: 'Pode gerar muitas notificações em posts populares.'      },
                    { key: 'notify_post_approved', label: 'Meu post foi aprovado ou rejeitado',   desc: 'Informado quando um manager revisar sua publicação.'     },
                  ]" :key="pref.key"
                  class="flex items-center justify-between gap-4 py-4 border-b border-[#f7f5f0] last:border-0">
                  <div>
                    <p class="text-[0.85rem] font-medium text-[#333]">{{ pref.label }}</p>
                    <p class="text-[0.75rem] text-[#aaa] mt-0.5">{{ pref.desc }}</p>
                  </div>
                  <div class="relative rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer"
                    style="width: 40px; height: 22px;"
                    :style="{ background: notifForm[pref.key as keyof typeof notifForm] ? '#079272' : '#ddd' }"
                    @click="(notifForm[pref.key as keyof typeof notifForm] as boolean) = !(notifForm[pref.key as keyof typeof notifForm] as boolean)">
                    <div class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
                      :style="{ transform: notifForm[pref.key as keyof typeof notifForm] ? 'translateX(20px)' : 'translateX(2px)' }"></div>
                  </div>
                </div>
              </div>
              <div v-if="notifSuccess" class="flex items-center gap-2 text-[0.82rem] text-[#079272] font-medium mt-4">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Preferências salvas!
              </div>
              <div v-if="notifError" class="text-[0.82rem] text-red-500 mt-4">{{ notifError }}</div>
              <div class="flex justify-end mt-5">
                <button
                  class="flex items-center gap-2 text-sm font-semibold px-6 py-2.5 bg-[#0d0d0d] text-white rounded-xl hover:bg-[#079272] transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-none cursor-pointer"
                  :disabled="notifSaving || !notifChanged" @click="saveNotifications">
                  <svg v-if="notifSaving" class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  {{ notifSaving ? 'Salvando...' : 'Salvar preferências' }}
                </button>
              </div>
            </div>
          </div>

          <!-- ── Tab: Segurança ─────────────────────────────────────────────── -->
          <div v-else-if="activeTab === 'security'" class="flex flex-col gap-5">
            <div class="bg-white border border-[#e8e4dc] rounded-2xl p-6">
              <h2 class="text-[0.88rem] font-bold text-[#111] tracking-[-0.01em] mb-5">Alterar senha</h2>
              <div class="flex flex-col gap-4">
                <div v-for="field in [
                    { model: 'current_password', label: 'Senha atual',          show: 'current', placeholder: '••••••••'            },
                    { model: 'new_password',      label: 'Nova senha',           show: 'new',     placeholder: 'Mínimo 8 caracteres' },
                    { model: 'confirm_password',  label: 'Confirmar nova senha', show: 'confirm', placeholder: 'Repita a nova senha'  },
                  ]" :key="field.model">
                  <div>
                    <label class="block text-xs font-semibold uppercase tracking-[0.1em] text-[#aaa] mb-1.5">{{ field.label }}</label>
                    <div class="relative">
                      <input
                        v-model="pwForm[field.model as keyof typeof pwForm]"
                        :type="showPw[field.show as keyof typeof showPw] ? 'text' : 'password'"
                        :placeholder="field.placeholder"
                        class="w-full h-11 px-4 pr-11 text-sm text-[#111] bg-[#f7f5f0] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#079272] focus:bg-white transition-all"
                        :class="pwErrors[field.model] ? 'border-red-400' : 'border-transparent'"/>
                      <button type="button"
                        class="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#555] border-none bg-transparent cursor-pointer"
                        @click="(showPw[field.show as keyof typeof showPw] as boolean) = !(showPw[field.show as keyof typeof showPw] as boolean)">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <template v-if="!showPw[field.show as keyof typeof showPw]">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </template>
                          <template v-else>
                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </template>
                        </svg>
                      </button>
                    </div>
                    <div v-if="field.model === 'new_password' && pwForm.new_password" class="mt-2 flex items-center gap-2">
                      <div class="flex gap-1 flex-1">
                        <div v-for="i in 5" :key="i" class="h-1 flex-1 rounded-full transition-all duration-300"
                          :style="{ background: i <= pwStrength ? pwStrengthColor : '#e8e4dc' }"></div>
                      </div>
                      <span class="text-[0.68rem] font-medium" :style="{ color: pwStrengthColor }">{{ pwStrengthLabel }}</span>
                    </div>
                    <p v-if="pwErrors[field.model]" class="text-xs text-red-500 mt-1">{{ pwErrors[field.model] }}</p>
                  </div>
                </div>
                <div v-if="pwSuccess" class="flex items-center gap-2 text-[0.82rem] text-[#079272] font-medium">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Senha alterada com sucesso!
                </div>
                <div v-if="pwError" class="text-[0.82rem] text-red-500">{{ pwError }}</div>
                <div class="flex justify-end pt-1">
                  <button
                    class="flex items-center gap-2 text-sm font-semibold px-6 py-2.5 bg-[#0d0d0d] text-white rounded-xl hover:bg-[#079272] transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-none cursor-pointer"
                    :disabled="pwSaving || !pwForm.current_password || !pwForm.new_password || !pwForm.confirm_password"
                    @click="savePassword">
                    <svg v-if="pwSaving" class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    {{ pwSaving ? 'Alterando...' : 'Alterar senha' }}
                  </button>
                </div>
              </div>
            </div>

            <div class="bg-white border border-red-100 rounded-2xl p-6">
              <div class="flex items-center gap-2 mb-1">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <h2 class="text-[0.88rem] font-bold text-red-600">Zona de perigo</h2>
              </div>
              <p class="text-[0.8rem] font-light text-[#888] leading-relaxed mb-5">Ao deletar sua conta, todos os seus dados, posts e comentários serão permanentemente removidos.</p>
              <button class="flex items-center gap-2 text-[0.82rem] font-semibold px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors cursor-pointer"
                @click="deleteModal = true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
                Deletar minha conta
              </button>
            </div>
          </div>

          <!-- ── Tab: Atividade ─────────────────────────────────────────────── -->
          <div v-else-if="activeTab === 'activity'" class="flex flex-col gap-5">
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-white border border-[#e8e4dc] rounded-2xl p-4 text-center">
                <div class="text-2xl font-bold text-[#111]">{{ publishedPosts.length }}</div>
                <div class="text-[0.72rem] text-[#aaa]">Publicados</div>
              </div>
              <div class="bg-white border rounded-2xl p-4 text-center" :class="pendingPosts.length ? 'border-amber-200' : 'border-[#e8e4dc]'">
                <div class="text-2xl font-bold" :class="pendingPosts.length ? 'text-amber-500' : 'text-[#ccc]'">{{ pendingPosts.length }}</div>
                <div class="text-[0.72rem] text-[#aaa]">Em análise</div>
              </div>
              <div class="bg-white border border-[#e8e4dc] rounded-2xl p-4 text-center">
                <div class="text-2xl font-bold text-[#111]">{{ currentUser?.comments_count ?? 0 }}</div>
                <div class="text-[0.72rem] text-[#aaa]">Comentários</div>
              </div>
            </div>

            <div v-if="pendingPosts.length" class="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div class="flex items-center gap-2 mb-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <h3 class="text-[0.83rem] font-bold text-amber-700">Aguardando aprovação</h3>
              </div>
              <div class="flex flex-col gap-2">
                <div v-for="p in pendingPosts" :key="p.id" class="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-amber-100">
                  <div class="flex-1 min-w-0">
                    <p class="text-[0.84rem] font-semibold text-[#333] truncate">{{ p.title }}</p>
                    <p class="text-[0.71rem] text-[#aaa] mt-0.5">{{ timeAgo(p.created_at) }}</p>
                  </div>
                  <span class="text-[0.62rem] font-semibold px-2 py-1 bg-amber-100 text-amber-600 rounded-full flex-shrink-0">Em análise</span>
                </div>
              </div>
              <p class="text-[0.72rem] text-amber-600 mt-3">Um manager irá revisar seus posts em breve.</p>
            </div>

            <div class="bg-white border border-[#e8e4dc] rounded-2xl p-6">
              <div class="flex items-center justify-between mb-5">
                <h2 class="text-[0.88rem] font-bold text-[#111]">Meus posts</h2>
                <span class="text-[0.72rem] text-[#aaa]">{{ myPosts.length }} total</span>
              </div>
              <div v-if="myPosts.length === 0" class="py-8 text-center">
                <p class="text-[0.85rem] text-[#aaa]">Nenhum post ainda.</p>
                <button class="mt-3 text-[0.8rem] font-semibold text-[#079272] hover:underline border-none bg-transparent cursor-pointer"
                  @click="router.push({ name: 'newPost' })">Criar meu primeiro post →</button>
              </div>
              <div v-else class="flex flex-col divide-y divide-[#f7f5f0]">
                <div v-for="p in myPosts" :key="p.id"
                  class="py-3.5 flex items-start gap-3 group"
                  :class="p.approved ? 'cursor-pointer' : 'cursor-default'"
                  @click="p.approved && p.slug && router.push(`/article/${p.slug || p.id}`)">
                  <div v-if="p.cover_url" class="w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden border border-[#e8e4dc]">
                    <img :src="p.cover_url" :alt="p.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                  </div>
                  <div v-else class="w-14 h-14 flex-shrink-0 rounded-xl bg-[#f7f5f0] flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-[0.85rem] font-semibold text-[#111] line-clamp-1"
                      :class="p.approved ? 'group-hover:text-[#079272] transition-colors' : 'opacity-70'">{{ p.title }}</p>
                    <p v-if="p.excerpt" class="text-[0.75rem] text-[#aaa] line-clamp-1 mt-0.5">{{ p.excerpt }}</p>
                    <div class="flex items-center gap-3 mt-1.5 text-[0.68rem] text-[#bbb] flex-wrap">
                      <span>{{ formatDate(p.created_at) }}</span>
                      <span class="flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                        {{ p.likes_count ?? 0 }}
                      </span>
                      <span class="text-[0.62rem] font-semibold px-1.5 py-0.5 rounded-full"
                        :class="p.approved ? 'bg-[#e8f5f2] text-[#079272]' : 'bg-amber-50 text-amber-600'">{{ p.approved ? 'Publicado' : 'Em análise' }}</span>
                      <span v-for="tag in (p.tags ?? []).slice(0, 2)" :key="tag"
                        class="text-[0.6rem] px-1.5 py-0.5 bg-[#f7f5f0] text-[#999] rounded-full">#{{ tag }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white border border-[#e8e4dc] rounded-2xl p-6">
              <div class="flex items-center justify-between mb-5">
                <h2 class="text-[0.88rem] font-bold text-[#111]">Meus comentários</h2>
                <span class="text-[0.72rem] text-[#aaa]">{{ myComments.length }} total</span>
              </div>
              <div v-if="myComments.length === 0" class="py-8 text-center">
                <p class="text-[0.85rem] text-[#aaa]">Você não comentou em nenhum post ainda</p>
              </div>
              <div v-else class="flex flex-col divide-y divide-[#f7f5f0]">
                <div v-for="c in myComments" :key="c.id"
                  class="py-3.5 flex items-start gap-3 group cursor-pointer"
                  @click="router.push({ name: 'article', params: { slug: c.post_id } })">
                  <div class="flex-1 min-w-0">
                    <p v-if="c.message" class="text-[0.8rem] text-[#444] line-clamp-2">{{ c.message }}</p>
                    <div class="flex items-center gap-3 mt-1.5 text-[0.68rem] text-[#bbb] flex-wrap">
                      <span>{{ formatDate(c.created_at) }}</span>
                      <span class="flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                        {{ c.likes_count ?? 0 }}
                      </span>
                    </div>
                  </div>
                  <svg class="flex-shrink-0 text-[#ddd] group-hover:text-[#079272] transition-colors mt-1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(.95) translateY(8px); }
  to   { opacity: 1; transform: scale(1)   translateY(0);   }
}
.modal-enter-active, .modal-leave-active { transition: opacity .25s ease; }
.modal-enter-from,   .modal-leave-to     { opacity: 0; }
</style>