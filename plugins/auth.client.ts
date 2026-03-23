export default defineNuxtPlugin(async () => {
  const { restoreSession } = useAuth()
  await restoreSession()
})
