<template>
  <section class="bg-gradient-to-r from-[#D0FAFE] to-[#8DE5BF] min-h-screen flex flex-col">
    <LayoutAppHeader />
    <LayoutBgFx />

    <main class="flex-1">
      <slot />
    </main>

    <LayoutAppFooter />
  </section>
</template>