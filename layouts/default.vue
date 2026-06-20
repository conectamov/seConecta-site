<script setup lang="ts">
const { isAuthenticated, authReady, restoreSession } = useAuth()

const mounted = ref(false)

onMounted(async () => {
  await restoreSession()
  mounted.value = true
})
</script>

<template>
  <div v-if="!mounted || !authReady" class="min-h-screen bg-[#fafaf9]" />

  <template v-else>
    <ClientOnly>
      <PromoPostModal
        post-slug="o-que-realmente-cria-um-medalhista "
        redirectUrl="https://forms.gle/3iZt1Zx8iAaLmcB99"
        storage-key="launch-2026-06"
      />
    </ClientOnly>

    <LayoutAppShell v-if="isAuthenticated">
      <slot />
    </LayoutAppShell>

    <section v-else class="bg-gradient-to-r from-[#D0FAFE] to-[#8DE5BF] min-h-screen flex flex-col">
      <LayoutAppHeader />
      <LayoutBgFx />

      <main class="flex-1">
        <slot />
      </main>

      <LayoutAppFooter />
    </section>
  </template>
</template>