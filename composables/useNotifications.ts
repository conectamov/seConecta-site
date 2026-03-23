export function useNotifications() {
  const { get, patch } = useAxios()
  const { currentUser } = useAuth()

  const notifications = ref<any[]>([])
  const unreadCount = ref(0)
  const totalNotifs = ref(0)
  let pollInterval: ReturnType<typeof setInterval> | null = null

  const notifIconMap: Record<string, { icon: string; color: string }> = {
    comment_on_post:  { icon: 'comment', color: '#2464E8' },
    reply_on_comment: { icon: 'reply',   color: '#7C3AED' },
    like_on_post:     { icon: 'heart',   color: '#e53e3e' },
    like_on_comment:  { icon: 'heart',   color: '#e53e3e' },
    post_approved:    { icon: 'check',   color: '#079272' },
    post_rejected:    { icon: 'x',       color: '#d97706' },
  }

  function notifMeta(type: string) {
    return notifIconMap[type] ?? { icon: 'bell', color: '#aaa' }
  }

  function notifTime(dateStr: string) {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days  = Math.floor(diff / 86400000)
    if (mins  < 1)  return 'agora'
    if (mins  < 60) return `${mins}min`
    if (hours < 24) return `${hours}h`
    if (days  < 7)  return `${days}d`
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  async function fetchNotifications() {
    if (!currentUser.value) return
    try {
      const res = await get('/notifications/?limit=15')
      notifications.value = res.data.data ?? []
      unreadCount.value   = res.data.unread_count ?? 0
      totalNotifs.value   = res.data.count ?? 0
    } catch {}
  }

  async function markAllRead() {
    try {
      await patch('/notifications/read-all', {})
      notifications.value.forEach(n => { n.read = true })
      unreadCount.value = 0
    } catch {}
  }

  async function markOneRead(notif: any) {
    if (notif.read) return
    try {
      await patch(`/notifications/${notif.id}/read`, {})
      notif.read = true
      if (unreadCount.value > 0) unreadCount.value--
    } catch {}
  }

  function startPolling() {
    fetchNotifications()
    pollInterval = setInterval(fetchNotifications, 60000)
  }

  function stopPolling() {
    if (pollInterval) clearInterval(pollInterval)
  }

  return { notifications, unreadCount, totalNotifs, notifMeta, notifTime, fetchNotifications, markAllRead, markOneRead, startPolling, stopPolling }
}
