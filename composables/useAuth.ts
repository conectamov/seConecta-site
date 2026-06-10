import { ref, computed } from 'vue'
import axios from 'axios'

const BASE_URL = 'https://api.seconecta.org/api/v1'
const TOKEN_KEY = 'conecta_token'
const TOKEN_EXPIRY_KEY = 'conecta_token_expiry'
const USER_KEY = 'conecta_user'
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000

const accessToken = ref<string | null>(null)
const currentUser = ref<Record<string, any> | null>(null)
const authLoading = ref(false)
const authReady = ref(false)

let restorePromise: Promise<void> | null = null

const authAxios = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

function getAxiosStatus(error: any): number | null {
  return error?.response?.status ?? error?.status ?? null
}

function setAxiosToken(token: string | null) {
  if (token) {
    authAxios.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete authAxios.defaults.headers.common.Authorization
  }
}

function saveToken(token: string) {
  if (!import.meta.client) return

  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + TOKEN_TTL_MS))
}

function loadToken(): string | null {
  if (!import.meta.client) return null

  const token = localStorage.getItem(TOKEN_KEY)
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)

  if (!token || !expiry) return null

  const expiryNumber = Number(expiry)

  if (!Number.isFinite(expiryNumber) || Date.now() > expiryNumber) {
    clearToken()
    clearUser()
    return null
  }

  return token
}

function clearToken() {
  if (!import.meta.client) return

  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
}

function saveUser(user: Record<string, any>) {
  if (!import.meta.client) return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function loadUser(): Record<string, any> | null {
  if (!import.meta.client) return null

  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function clearUser() {
  if (!import.meta.client) return
  localStorage.removeItem(USER_KEY)
}

export function useAuth() {
  const isAuthenticated = computed(() => !!accessToken.value)

  async function fetchMe() {
    const token = accessToken.value || loadToken()

    if (!token) {
      accessToken.value = null
      setAxiosToken(null)
      return null
    }

    accessToken.value = token
    setAxiosToken(token)

    const res = await authAxios.get('/users/me')
    currentUser.value = res.data
    saveUser(res.data)

    return res.data
  }

  async function restoreSession() {
    if (!import.meta.client) return

    if (authReady.value) return

    if (restorePromise) {
      await restorePromise
      return
    }

    restorePromise = (async () => {
      authLoading.value = true

      const token = loadToken()

      if (!token) {
        accessToken.value = null
        currentUser.value = null
        setAxiosToken(null)
        authReady.value = true
        return
      }

      accessToken.value = token
      setAxiosToken(token)

      const cachedUser = loadUser()
      if (cachedUser) {
        currentUser.value = cachedUser
      }

      try {
        await fetchMe()
      } catch (error: any) {
        const status = getAxiosStatus(error)

        if (status === 401) {
          logout()
          return
        }

        // Erro de rede, timeout, 500, backend lento etc.
        // Mantém token e usuário cacheado. Não desloga automaticamente.
        console.warn('[auth] Could not refresh /users/me, keeping local session:', error?.message || error)
      } finally {
        authLoading.value = false
        authReady.value = true
      }
    })()

    try {
      await restorePromise
    } finally {
      restorePromise = null
    }
  }

  async function login(email: string, password: string) {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)

    const res = await authAxios.post('/login/access-token', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    const token = res.data.access_token

    accessToken.value = token
    authReady.value = true
    saveToken(token)
    setAxiosToken(token)

    await fetchMe()
  }

  async function register({ email, username, password, full_name }: {
    email: string
    username: string
    password: string
    full_name?: string
  }) {
    const payload: Record<string, string> = { email, username, password }

    if (full_name?.trim()) {
      payload.full_name = full_name.trim()
    }

    const res = await authAxios.post('/users/signup', payload)
    return res.data
  }

  function logout() {
    accessToken.value = null
    currentUser.value = null
    authReady.value = true
    authLoading.value = false

    setAxiosToken(null)
    clearToken()
    clearUser()
  }

  function getAccessToken() {
    return accessToken.value || loadToken()
  }

  return {
    accessToken,
    isAuthenticated,
    currentUser,
    authLoading,
    authReady,
    login,
    register,
    logout,
    restoreSession,
    fetchMe,
    getAccessToken,
  }
}