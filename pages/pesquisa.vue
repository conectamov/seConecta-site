<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  setTimeout(() => {
    window.location.replace('https://forms.gle/98T9hnvSj7UcgcgB7')
  }, 300)
})

const openForm = () => {
  window.location.replace('https://forms.gle/98T9hnvSj7UcgcgB7')
}
</script>

<template>
  <div class="redirect-page">
    <div class="card">
      <!-- Replace with your logo if desired -->
      <div class="logo">✨</div>

      <h1>Redirecionando...</h1>

      <p>
        Estamos abrindo o formulário para você.
        Caso isso não aconteça automaticamente, clique no botão abaixo.
      </p>

      <button @click="openForm">
        Abrir formulário
      </button>

      <div class="spinner" />
    </div>
  </div>
</template>

<style scoped>
.redirect-page {
  min-height: 100vh;
  display: grid;
  place-items: center;

  padding: 24px;

  background: linear-gradient(
    135deg,
    #0f172a 0%,
    #1e293b 100%
  );
}

.card {
  width: min(500px, 100%);

  padding: 48px 40px;

  text-align: center;

  background: rgba(255, 255, 255, 0.96);

  border-radius: 24px;

  box-shadow:
    0 25px 60px rgba(0, 0, 0, 0.18);
}

.logo {
  font-size: 3rem;
  margin-bottom: 16px;
}

h1 {
  margin: 0;

  font-size: 2rem;

  color: #0f172a;
}

p {
  margin: 18px 0 28px;

  line-height: 1.6;

  color: #475569;
}

button {
  cursor: pointer;

  border: none;

  padding: 14px 24px;

  border-radius: 12px;

  font-size: 1rem;
  font-weight: 600;

  color: white;

  background: #2563eb;

  transition: transform .2s ease;
}

button:hover {
  transform: translateY(-2px);
}

.spinner {
  width: 28px;
  height: 28px;

  margin: 28px auto 0;

  border: 3px solid #dbeafe;
  border-top-color: #2563eb;

  border-radius: 50%;

  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>