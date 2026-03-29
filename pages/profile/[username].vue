<script setup lang="ts">
const { data: user, pending, error } = await useAsyncData(
  () => `user-${username.value}`,
  async () => {
    const { get } = useAxios()
    const res = await get(`/api/v1/users/username/${username.value}`)
    console.log('API RESPONSE:', res.data)
    return res.data
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