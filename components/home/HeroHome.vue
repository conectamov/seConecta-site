<template>
  <section
    class="relative min-h-[92vh] flex items-center overflow-hidden px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24"
    aria-labelledby="hero-heading"
  >
    <div class="relative w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16 py-16 lg:py-0">

      <!-- LADO ESQUERDO -->
      <div class="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">

        <h1
          id="hero-heading"
          class="text-[clamp(2.2rem,5vw,3.8rem)] font-extrabold text-[#0f172a] leading-[1.08] tracking-[-0.02em] mb-5"
          style="animation: fadeInUp 0.65s 0.1s ease both;"
        >
          Conecte-se com
          <span class="bg-gradient-to-r from-[#079272] via-[#0DA790] to-[#2464E8] bg-[length:200%_200%] animate-[gradMove_4s_ease_infinite] bg-clip-text text-transparent">estudantes</span>
          que pensam como
          <span class="bg-gradient-to-r from-[#079272] via-[#0DA790] to-[#2464E8] bg-[length:200%_200%] animate-[gradMove_4s_ease_infinite] bg-clip-text text-transparent">você</span>
        </h1>

        <p
          class="text-[clamp(1rem,1.8vw,1.15rem)] text-[#475569] leading-relaxed max-w-[520px] mb-8"
          style="animation: fadeInUp 0.65s 0.2s ease both;"
        >
          Encontre colegas com os mesmos objetivos acadêmicos e receba oportunidades de bolsas, estágios e editais personalizadas para o seu perfil.
        </p>

        <div
          class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-9"
          style="animation: fadeInUp 0.65s 0.3s ease both;"
        >
          <a
            href="https://wa.me/558599783928?text=Olá!%20Quero%20participar%20do%20beta%20do%20Conecta"
            target="_blank"
            rel="noopener noreferrer"
            class="group relative inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-[14px] text-[0.95rem] font-bold text-white no-underline bg-gradient-to-r from-[#079272] via-[#0DA790] to-[#2464E8] bg-[length:200%_200%] hover:bg-[position:100%_50%] shadow-[0_8px_20px_rgba(7,146,114,0.3)] hover:shadow-[0_12px_28px_rgba(7,146,114,0.45)] transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] w-full sm:w-auto overflow-hidden"
            aria-label="Testar no WhatsApp"
          >
            <span class="absolute inset-0 bg-white/20 translate-x-[-100%] skew-x-[-12deg] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></span>
            <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Testar no WhatsApp
          </a>

          <NuxtLink
            to="/sobre"
            class="group relative inline-flex items-center justify-center gap-2 px-6 py-4 rounded-[14px] text-[0.95rem] font-semibold no-underline transition-all duration-300 hover:-translate-y-1 active:translate-y-0 w-full sm:w-auto"
            aria-label="Saiba mais sobre o Conecta"
          >
            <span class="absolute inset-[2px] rounded-[12px] bg-white transition-all duration-300 group-hover:bg-white/95 border border-[#079272]/20"></span>
            <span class="relative z-10 bg-gradient-to-r from-[#079272] via-[#0DA790] to-[#2464E8] bg-[length:200%_200%] group-hover:bg-[position:100%_50%] bg-clip-text text-transparent transition-all duration-300">
              Saiba mais
            </span>
          </NuxtLink>
        </div>

      </div>

      <!-- LADO DIREITO — Modelo 3D do smartphone -->
      <div class="w-full lg:w-1/2 flex justify-center lg:justify-end items-center" style="animation: fadeInRight 0.8s 0.2s ease both;">
        <div class="w-full max-w-[480px]">
          <HomePhone3D />
        </div>
      </div>

    </div>
  </section>
</template>

<style scoped>
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeInRight {
  from { opacity: 0; transform: translateX(32px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes gradMove {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>
