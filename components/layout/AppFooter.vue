<script setup lang="ts">
const route = useRoute()
const isHidden = computed(() => ['/login', '/signup'].includes(route.path))
</script>

<template>
  <template v-if="!isHidden">
    <footer class="z-50 bg-gradient-to-r from-[#60b6c1] to-[#36ad90] text-white px-8 md:px-16 lg:px-20 py-6 relative flex flex-col items-center">
      <div class="mb-4 w-full flex flex-col items-center justify-center">
        <p class="text-lg mb-6 leading-relaxed text-white/90 text-center">
          Uma rede de crescimento feita por estudantes, para estudantes. Juntos, criamos pontes entre potencial e oportunidade.
        </p>
        <div class="flex gap-4 mb-2">
          <NuxtLink to="/sobre" class="text-white/80 hover:text-white transition-colors text-sm">Sobre</NuxtLink>
          <NuxtLink to="/embaixadores" class="text-white/80 hover:text-white transition-colors text-sm">Embaixadores</NuxtLink>
          <NuxtLink to="/equipe" class="text-white/80 hover:text-white transition-colors text-sm">Equipe</NuxtLink>
          <NuxtLink to="/feed" class="text-white/80 hover:text-white transition-colors text-sm">Feed</NuxtLink>
        </div>
      </div>
    </footer>
    <p class="bg-[#0c1b32] w-full text-white/80 text-center py-4 text-sm">
      seConecta © {{ new Date().getFullYear() }} - Todos os direitos reservados.
    </p>
  </template>
</template>
