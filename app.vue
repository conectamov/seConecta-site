<script setup lang="ts">
const router = useRouter()
router.afterEach(() => {
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
