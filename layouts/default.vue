
<template>
  <div class=" bg-gradient-to-r from-[#D0FAFE] to-[#8DE5BF] min-h-screen flex flex-col">
    <header>
      <LayoutAppHeader />
    </header>

    <main class="flex-1">
      <LayoutBgFx />
      <slot />
    </main>

    <footer class=" text-center">
      <LayoutAppFooter />
    </footer>

  </div>
</template>