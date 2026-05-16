<script setup lang="ts">
const { isAuthenticated, authReady, restoreSession } = useAuth()

const mounted = ref(false)

onMounted(async () => {
  await restoreSession()
  mounted.value = true
})
</script>

<template>
  <div
    v-if="!mounted || !authReady"
    class="min-h-screen bg-[#fafaf9]"
  />

  <LayoutAppShell v-else-if="isAuthenticated">
    <slot />
  </LayoutAppShell>

  <section
    v-else
    class="bg-gradient-to-r from-[#D0FAFE] to-[#8DE5BF] min-h-screen flex flex-col"
  >
    <LayoutAppHeader />
    <LayoutBgFx />

    <main class="flex-1">
      <slot />
    </main>

    <LayoutAppFooter />
  </section>
</template>