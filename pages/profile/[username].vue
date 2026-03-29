<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from '#imports'
import { useAxios } from '~/composables/useAxios'

const route = useRoute()

const username = computed(() => {
  const p = route.params.username
  return Array.isArray(p) ? p[0] : p
})

const { data: user, pending, error } = await useAsyncData(
  () => `user-${username.value}`,
  async () => {
    if (!username.value) return null // 🔴 prevents bad call

    const { get } = useAxios()
    const res = await get(`/users/username/${username.value}`)

    console.log('API RESPONSE:', res.data)
    return res.data
  },
  {
    watch: [username], // 🔴 refetch when param arrives
  }
)
</script>
<template>
  <div v-if="pending">Carregando...</div>
  <div v-else-if="error">
    {{ error }}
  </div>
  <div v-else-if="user">
    {{ user.full_name }}
  </div>
</template>