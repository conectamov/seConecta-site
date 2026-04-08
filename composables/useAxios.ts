import axios from 'axios'
import { useRoute } from 'vue-router'
import { navigateTo } from 'nuxt/app'

const BASE_URL = 'https://api.seconecta.org/api/v1'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

axiosInstance.interceptors.request.use((cfg) => {
  if (import.meta.client) {
    const token = localStorage.getItem('conecta_token')
    if (token) {
      cfg.headers.Authorization = `Bearer ${token}`
    } else {
      delete cfg.headers?.Authorization
    }
  }
  return cfg
})

axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    
    if (err.response?.status === 401 && import.meta.client) {
      localStorage.removeItem('conecta_token')
      localStorage.removeItem('conecta_token_expiry')
      localStorage.removeItem('conecta_user')

      const route = useRoute()

      if (route.meta.requiresAuth) {
        navigateTo('/login')
      }
    }
    return Promise.reject(err)
  }
)

export function useAxios() {
  const get  = (url: string, config: object = {}) => axiosInstance.get(url, config)
  const post  = (url: string, data?: unknown, config: object = {}) => axiosInstance.post(url, data, config)
  const put   = (url: string, data?: unknown, config: object = {}) => axiosInstance.put(url, data, config)
  const patch = (url: string, data?: unknown, config: object = {}) => axiosInstance.patch(url, data, config)
  const del   = (url: string, config: object = {}) => axiosInstance.delete(url, config)
  return { axiosInstance, get, post, put, patch, del }
}
