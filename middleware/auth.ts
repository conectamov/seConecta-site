export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const { isAuthenticated, restoreSession, authReady, getAccessToken } = useAuth()

  await restoreSession()

  console.log('[AUTH MIDDLEWARE]', {
    path: to.fullPath,
    authReady: authReady.value,
    isAuthenticated: isAuthenticated.value,
    token: getAccessToken() ? 'exists' : 'missing',
  })

  if (!isAuthenticated.value) {
    return navigateTo({
      path: '/login',
      query: {
        redirect: to.fullPath,
      },
    })
  }
})