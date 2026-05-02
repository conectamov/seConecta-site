<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { get } = useAxios()

type OpportunityRedirectData = {
  slug?: string | null
  category?: string | null
}

const slug = computed(() => String(route.params.slug || '').trim())

const status = ref<'loading' | 'not_found' | 'error'>('loading')
const errorMessage = ref('')

useSeoMeta({
  title: 'Abrindo oportunidade — seConecta',
  robots: 'noindex',
})

function buildRedirectUrl(opportunity: OpportunityRedirectData) {
  const query: Record<string, string> = {}

  if (opportunity.category) {
    query.category = opportunity.category
  }

  if (opportunity.slug || slug.value) {
    query.open = opportunity.slug || slug.value
  }

  const search = new URLSearchParams(query).toString()

  return search ? `/oportunidades?${search}` : '/oportunidades'
}

onMounted(async () => {
  if (!slug.value) {
    await router.replace('/oportunidades')
    return
  }

  try {
    const response = await get(`/opportunity/slug/${encodeURIComponent(slug.value)}`)
    const opportunity = response.data

    if (!opportunity?.slug) {
      status.value = 'not_found'
      return
    }

    await router.replace(buildRedirectUrl(opportunity))
  } catch (error: any) {
    const code = error?.response?.status

    if (code === 404) {
      status.value = 'not_found'
      return
    }

    status.value = 'error'
    errorMessage.value =
      error?.response?.data?.detail ||
      error?.message ||
      'Não foi possível abrir essa oportunidade.'
  }
})
</script>

<template>
  <main class="opportunity-redirect">
    <section v-if="status === 'loading'" class="opportunity-redirect__card">
      <div class="opportunity-redirect__spinner"></div>

      <h1>Abrindo oportunidade…</h1>
      <p>Estamos te levando para a página certa.</p>
    </section>

    <section v-else-if="status === 'not_found'" class="opportunity-redirect__card">
      <div class="opportunity-redirect__icon">🔎</div>

      <h1>Oportunidade não encontrada</h1>
      <p>Ela pode ter sido removida, estar em revisão ou o link pode estar incorreto.</p>

      <NuxtLink to="/oportunidades" class="opportunity-redirect__button">
        Ver oportunidades
      </NuxtLink>
    </section>

    <section v-else class="opportunity-redirect__card">
      <div class="opportunity-redirect__icon">⚠️</div>

      <h1>Não foi possível abrir</h1>
      <p>{{ errorMessage }}</p>

      <NuxtLink to="/oportunidades" class="opportunity-redirect__button">
        Voltar para oportunidades
      </NuxtLink>
    </section>
  </main>
</template>

<style scoped>
.opportunity-redirect {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at 20% 10%, rgba(16, 185, 129, 0.16), transparent 32%),
    radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.12), transparent 34%),
    #fafaf9;
  color: #1c1917;
  font-family: 'DM Sans', Inter, ui-sans-serif, system-ui, sans-serif;
}

.opportunity-redirect__card {
  width: min(100%, 420px);
  border: 1px solid #e7e5e4;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.08);
  padding: 32px;
  text-align: center;
}

.opportunity-redirect__card h1 {
  margin: 16px 0 8px;
  font-size: 1.35rem;
  line-height: 1.15;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.opportunity-redirect__card p {
  margin: 0;
  color: #78716c;
  font-size: 0.92rem;
  line-height: 1.6;
}

.opportunity-redirect__spinner {
  width: 36px;
  height: 36px;
  margin: 0 auto;
  border-radius: 999px;
  border: 3px solid #e7e5e4;
  border-top-color: #10b981;
  animation: spin 0.8s linear infinite;
}

.opportunity-redirect__icon {
  width: 44px;
  height: 44px;
  margin: 0 auto;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: #ecfdf5;
  font-size: 1.35rem;
}

.opportunity-redirect__button {
  min-height: 44px;
  margin-top: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: #1c1917;
  color: white;
  padding: 0 18px;
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 900;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>