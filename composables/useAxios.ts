import axios from 'axios'
import { navigateTo } from 'nuxt/app'

const BASE_URL = 'https://api.seconecta.org/api/v1'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

axiosInstance.interceptors.request.use((cfg) => {
  if (import.meta.client) {
    const token = localStorage.getItem('conecta_token')

    if (token) {
      cfg.headers.Authorization = `Bearer ${token}`
    }
  }

  return cfg
})

axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (!import.meta.client) {
      return Promise.reject(err)
    }

    const status = err.response?.status
    const url = String(err.config?.url || '')
    const hasAuth = Boolean(err.config?.headers?.Authorization)

    console.warn('[AXIOS ERROR]', {
      status,
      url,
      method: err.config?.method,
      hasAuth,
      data: err.response?.data,
    })

    // Importante:
    // 401 sem Authorization NÃO é sessão expirada.
    // É só uma página pública tentando acessar endpoint privado.
    if (status === 401 && hasAuth) {
      console.warn('[AUTH 401] Token rejeitado pela API:', {
        url,
        detail: err.response?.data?.detail,
      })

      localStorage.removeItem('conecta_token')
      localStorage.removeItem('conecta_token_expiry')
      localStorage.removeItem('conecta_user')

      if (window.location.pathname !== '/login') {
        await navigateTo({
          path: '/login',
          query: {
            redirect: window.location.pathname + window.location.search,
          },
        })
      }
    }

    return Promise.reject(err)
  }
)

export function useAxios() {
  const get = (url: string, config: object = {}) => axiosInstance.get(url, config)
  const post = (url: string, data?: unknown, config: object = {}) => axiosInstance.post(url, data, config)
  const put = (url: string, data?: unknown, config: object = {}) => axiosInstance.put(url, data, config)
  const patch = (url: string, data?: unknown, config: object = {}) => axiosInstance.patch(url, data, config)
  const del = (url: string, config: object = {}) => axiosInstance.delete(url, config)

  return {
    axiosInstance,
    get,
    post,
    put,
    patch,
    del,
  }
}