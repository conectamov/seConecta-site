// composables/useOpportunityBulletin.ts

import { ref } from 'vue'
import axios from 'axios'
import { useAuth } from '~/composables/useAuth'

const BASE_URL = 'https://api.seconecta.org/api/v1'

const bulletin = ref<any | null>(null)
const bulletins = ref<any[]>([])
const preferences = ref<any | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const bulletinAxios = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

function getAxiosStatus(err: any): number | null {
  return err?.response?.status ?? err?.status ?? null
}

function getAxiosMessage(err: any, fallback: string): string {
  return (
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  )
}

function normalizeBulletin(data: any) {
  if (!data) return null

  return {
    ...data,
    opportunities:
      data.opportunities ||
      data.items ||
      data.recommendations ||
      data.opportunity_items ||
      [],
  }
}

export function useOpportunityBulletin() {
  const {
    getAccessToken,
    restoreSession,
    authReady,
  } = useAuth()

  async function api<T>(path: string, options: any = {}): Promise<T> {
    if (import.meta.client && !authReady.value) {
      await restoreSession()
    }

    const token = getAccessToken()

    if (!token) {
      throw new Error('Usuário não autenticado.')
    }

    const response = await bulletinAxios.request<T>({
      url: path,
      method: options.method || 'GET',
      data: options.body ?? options.data,
      params: options.params,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    })

    return response.data
  }

  async function loadPreferences() {
    try {
      preferences.value = await api('/users/me/opportunity-bulletin/preferences')
      return preferences.value
    } catch (err: any) {
      const status = getAxiosStatus(err)

      if (status === 404) {
        preferences.value = null
        return null
      }

      throw err
    }
  }

  async function savePreferences(payload: any) {
    preferences.value = await api('/users/me/opportunity-bulletin/preferences', {
      method: 'PUT',
      body: payload,
    })

    return preferences.value
  }

  async function patchPreferences(payload: any) {
    preferences.value = await api('/users/me/opportunity-bulletin/preferences', {
      method: 'PATCH',
      body: payload,
    })

    return preferences.value
  }

  async function loadPreview() {
    loading.value = true
    error.value = null

    try {
      const data = await api('/users/me/opportunity-bulletin/preview')
      bulletin.value = normalizeBulletin(data)
      return bulletin.value
    } catch (err: any) {
      const status = getAxiosStatus(err)

      if (status === 404) {
        bulletin.value = null
        return null
      }

      error.value = getAxiosMessage(
        err,
        'Não foi possível carregar seu boletim.'
      )

      throw err
    } finally {
      loading.value = false
    }
  }

  async function generateBulletin() {
    loading.value = true
    error.value = null

    try {
      const data = await api('/users/me/opportunity-bulletin/generate', {
        method: 'POST',
      })

      bulletin.value = normalizeBulletin(data)
      return bulletin.value
    } catch (err: any) {
      error.value = getAxiosMessage(
        err,
        'Não foi possível gerar seu boletim.'
      )

      throw err
    } finally {
      loading.value = false
    }
  }

  async function loadBulletins() {
    const data = await api<any[]>('/users/me/opportunity-bulletins')
    bulletins.value = Array.isArray(data) ? data.map(normalizeBulletin) : []
    return bulletins.value
  }

  async function loadBulletinById(bulletinId: number | string) {
    const data = await api(`/users/me/opportunity-bulletins/${bulletinId}`)
    bulletin.value = normalizeBulletin(data)
    return bulletin.value
  }

  async function markBulletinRead(bulletinId?: number | string) {
    const id = bulletinId || bulletin.value?.id

    if (!id) return null

    const data = await api(`/users/me/opportunity-bulletins/${id}/read`, {
      method: 'POST',
    })

    bulletin.value = normalizeBulletin(data)
    return bulletin.value
  }

  async function dismissBulletin(bulletinId?: number | string) {
    const id = bulletinId || bulletin.value?.id

    if (!id) return null

    const data = await api(`/users/me/opportunity-bulletins/${id}/dismiss`, {
      method: 'POST',
    })

    bulletin.value = normalizeBulletin(data)
    return bulletin.value
  }

  async function deleteBulletin(bulletinId?: number | string) {
    const id = bulletinId || bulletin.value?.id

    if (!id) return

    await api(`/users/me/opportunity-bulletins/${id}`, {
      method: 'DELETE',
    })

    bulletins.value = bulletins.value.filter((item: any) => item.id !== id)

    if (bulletin.value?.id === id) {
      bulletin.value = null
    }
  }

  function hideOpportunityLocally(opportunityId: number | string) {
    if (!bulletin.value?.opportunities) return

    bulletin.value.opportunities = bulletin.value.opportunities.filter(
      (item: any) => item.id !== opportunityId
    )
  }

  return {
    bulletin,
    bulletins,
    preferences,
    loading,
    error,

    loadPreferences,
    savePreferences,
    patchPreferences,

    loadPreview,
    generateBulletin,

    loadBulletins,
    loadBulletinById,
    markBulletinRead,
    dismissBulletin,
    deleteBulletin,

    hideOpportunityLocally,
  }
}