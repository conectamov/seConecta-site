const _cache = new Map<number, any>()

export function useUserCache() {
  const { get } = useAxios()

  async function getUser(id: number) {
    if (!id) return null
    if (_cache.has(id)) return _cache.get(id)
    _cache.set(id, null)
    try {
      const res = await get(`/api/v1/users/${id}`)
      _cache.set(id, res.data)
      return res.data
    } catch { return null }
  }

  function getCached(id: number) { return _cache.get(id) ?? null }

  function displayName(user: any) {
    if (!user) return 'Autor'
    return user.full_name || user.username || 'Autor'
  }

  function displayInitial(user: any) {
    if (!user) return '?'
    const name = user.full_name || user.username || ''
    return name.charAt(0).toUpperCase() || '?'
  }

  return { getUser, getCached, displayName, displayInitial }
}
