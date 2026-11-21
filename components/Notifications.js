'use client'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { backend } from '@/lib/backend'

const Ctx = createContext({ list: [], unread: 0, pending: 0, refresh: () => {}, markAllRead: () => {} })
export const useNotifications = () => useContext(Ctx)

// Notifikasi pengguna (+ jumlah pendaftar menunggu untuk admin), diperbarui tiap menit.
export default function NotificationsProvider({ user, children }) {
  const [list, setList] = useState([])
  const [missing, setMissing] = useState(false)
  const [pending, setPending] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const r = await backend.notifications()
      setList(r.list); setMissing(r.missing)
    } catch { /* jaringan putus: coba lagi nanti */ }
    if (user.isAdmin) {
      try { setPending((await backend.admin.users()).filter((u) => !u.approvedAt && u.status !== 'blocked').length) } catch {}
    }
  }, [user.isAdmin])

  useEffect(() => {
    refresh()
    backend.heartbeat()
    const t1 = setInterval(refresh, 60000)
    const t2 = setInterval(() => document.visibilityState === 'visible' && backend.heartbeat(), 240000)
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(t1); clearInterval(t2); window.removeEventListener('focus', onFocus) }
  }, [refresh])

  const markAllRead = useCallback(async (ids) => {
    const target = ids || list.filter((n) => !n.read).map((n) => n.id)
    if (!target.length) return
    setList((l) => l.map((n) => (target.includes(n.id) ? { ...n, read: true } : n)))
    try { await backend.markRead(target) } catch {}
  }, [list])

  const unread = list.filter((n) => !n.read && !(user.isAdmin && n.kind === 'broadcast')).length
  return <Ctx.Provider value={{ list, unread, pending, missing, refresh, markAllRead }}>{children}</Ctx.Provider>
}
