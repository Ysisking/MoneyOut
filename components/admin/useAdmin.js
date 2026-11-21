'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { backend } from '@/lib/backend'
import { useNotifications } from '@/components/Notifications'
import { ADMIN_EMAIL } from '@/lib/config'

export const STATUS = {
  pending: { label: 'Menunggu', dot: '#C78100' },
  queued: { label: 'Antre', dot: '#2F64B0' },
  active: { label: 'Aktif', dot: '#0B7A57' },
  blocked: { label: 'Diblokir', dot: '#C2382E' },
  frozen: { label: 'Dibekukan', dot: '#7A7A75' },
}
const ONLINE_MS = 10 * 60 * 1000

export function useAdmin() {
  const notif = useNotifications()
  const [users, setUsers] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(true)

  const load = useCallback(async () => {
    setError('')
    try {
      const [u, a, r] = await Promise.all([backend.admin.users(), backend.admin.activity(), backend.admin.ready()])
      setUsers(u); setActivity(a); setReady(r)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t) }, [load])

  const setStatus = useCallback(async (id, status, reason) => {
    await backend.admin.setStatus(id, status, reason)
    await load(); notif.refresh()
  }, [load, notif])

  // Status kehadiran: aktif (online ≤10 menit & belum keluar), tidak aktif, diblokir/dibekukan.
  const withPresence = useMemo(() => users.map((u) => {
    const last = activity.find((a) => a.user_id === u.id && (a.event === 'login' || a.event === 'logout'))
    const seen = u.lastSeenAt ? new Date(u.lastSeenAt).getTime() : 0
    const loggedOut = last?.event === 'logout' && new Date(last.created_at).getTime() >= seen - 60000
    const online = u.status === 'active' && seen > Date.now() - ONLINE_MS && !loggedOut
    const presence = ['blocked', 'frozen'].includes(u.status) ? u.status : online ? 'online' : u.status === 'active' ? 'offline' : u.status
    return { ...u, online, presence, isAdmin: u.isAdmin ?? u.email.toLowerCase() === ADMIN_EMAIL }
  }), [users, activity])

  return { users: withPresence, activity, loading, error, ready, reload: load, setStatus }
}
