<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from '#imports'
import { useAxios } from '~/composables/useAxios'

const route = useRoute()
const username = computed(() => route.params.username as string)

const { data: user, pending, error } = await useAsyncData(
  () => `user-${username.value}`,
  async () => {
    const { get } = useAxios()
    const response = await get(`/users/username/${encodeURIComponent(username.value)}`)
    return response.data
  },
  { watch: [username] }
)

const userId = computed(() => user.value?.id)
</script>

<template>
  <div v-if="pending">Carregando...</div>
  <div v-else-if="error">Usuário não encontrado</div>
  <div v-else-if="user">
    {{ user.full_name }}
  </div>
</template>