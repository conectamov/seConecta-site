export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
