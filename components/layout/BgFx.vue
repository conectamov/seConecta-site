<script setup lang="ts">
const bubbles = [
  { x: 5, size: 15, speed: 2, delay: 0, opacity: 0.25 },
  { x: 95, size: 12, speed: 1.8, delay: 0.1, opacity: 0.22 },
  { x: 20, size: 18, speed: 2.2, delay: 0.05, opacity: 0.23 },
  { x: 80, size: 14, speed: 1.9, delay: 0.15, opacity: 0.21 },
  { x: 35, size: 16, speed: 2.1, delay: 0.08, opacity: 0.24 },
  { x: 65, size: 13, speed: 1.7, delay: 0.12, opacity: 0.2 },
  { x: 50, size: 10, speed: 1.5, delay: 0, opacity: 0.3 },
  { x: 15, size: 20, speed: 2.5, delay: 0.3, opacity: 0.18 },
  { x: 85, size: 22, speed: 2.8, delay: 0.4, opacity: 0.16 },
  { x: 40, size: 25, speed: 3, delay: 0.5, opacity: 0.15 },
  { x: 70, size: 18, speed: 2.3, delay: 0.35, opacity: 0.19 },
  { x: 25, size: 28, speed: 3.2, delay: 0.6, opacity: 0.14 },
  { x: 75, size: 24, speed: 2.9, delay: 0.45, opacity: 0.17 },
  { x: 55, size: 30, speed: 3.5, delay: 0.7, opacity: 0.12 },
  { x: 10, size: 40, speed: 4, delay: 0, opacity: 0.1 },
  { x: 90, size: 35, speed: 4.5, delay: 0.2, opacity: 0.09 },
  { x: 30, size: 45, speed: 5, delay: 0.4, opacity: 0.08 },
  { x: 70, size: 50, speed: 5.5, delay: 0.6, opacity: 0.07 },
  { x: 50, size: 60, speed: 6, delay: 0.8, opacity: 0.06 },
]
</script>

<template>
  <div class="fast-bubbles fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
    <div
      v-for="(bubble, index) in bubbles"
      :key="index"
      class="bubble absolute rounded-full bottom-[-50px]"
      :style="{
        left: `${bubble.x}%`,
        width: `${bubble.size}px`,
        height: `${bubble.size}px`,
        animationDuration: `${bubble.speed}s`,
        animationDelay: `${bubble.delay}s`,
        opacity: bubble.opacity,
        animationName: index % 3 === 0 ? 'fast-float-with-drift' : 'fast-float',
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
      }"
    />
  </div>
</template>

<style scoped>
.bubble {
  background: radial-gradient(
    circle,
    rgba(7, 146, 114, 0.4) 30%,
    rgba(36, 100, 232, 0.5) 70%,
    transparent 100%
  );
  filter: blur(0.5px);
  will-change: transform;
}

@keyframes fast-float {
  0% { transform: translateY(0) scale(0.8) rotate(0deg); opacity: 0; }
  5% { opacity: inherit; }
  95% { opacity: inherit; }
  100% { transform: translateY(calc(-100vh - 50px)) scale(1.2) rotate(90deg); opacity: 0; }
}

@keyframes fast-float-with-drift {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
  5% { opacity: inherit; }
  50% { transform: translate(20px, -50vh) rotate(45deg); }
  95% { opacity: inherit; }
  100% { transform: translate(10px, calc(-100vh - 50px)) rotate(90deg); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .bubble { animation: none !important; opacity: 0.03 !important; }
}
</style>
