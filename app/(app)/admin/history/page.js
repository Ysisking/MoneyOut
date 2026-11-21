'use client'
import { useState } from 'react'
import { Search } from 'lucide-react'
import AdminPage from '@/components/admin/AdminPage'
import { Segmented, SectionTitle, EmptyState } from '@/components/ui'
import { timeAgo } from '@/components/NotificationList'
import { STATUS } from '@/components/admin/useAdmin'

const PRESENCE = {
  online: { label: 'Aktif', dot: '#0B7A57' },
  offline: { label: 'Tidak aktif', dot: '#B5B5B0' },
  blocked: { label: 'Diblokir', dot: '#C2382E' },
  frozen: { label: 'Dibekukan', dot: '#7A7A75' },
  pending: { label: 'Menunggu', dot: '#C78100' },
  queued: { label: 'Antre', dot: '#2F64B0' },
}
const EVENT = { login: 'Masuk', logout: 'Keluar', signup: 'Mendaftar', status: 'Status diubah admin' }
const fmt = (iso) => new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

function Body({ users, activity }) {
  const [ev, setEv] = useState('all')
  const [q, setQ] = useState('')
  const byId = Object.fromEntries(users.map((u) => [u.id, u]))
  const count = (k) => users.filter((u) => u.presence === k).length
  const s = q.trim().toLowerCase()
  const log = activity.filter((a) => (ev === 'all' || a.event === ev) && (!s || (byId[a.user_id]?.username || '').toLowerCase().includes(s) || (byId[a.user_id]?.email || '').toLowerCase().includes(s)))
  const order = { online: 0, offline: 1, pending: 2, queued: 3, frozen: 4, blocked: 5 }
  return (
    <div className="space-y-6">
      <dl className="panel grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x [&>div]:px-5 [&>div]:py-4">
        {[['online', 'Aktif sekarang'], ['offline', 'Tidak aktif'], ['blocked', 'Diblokir'], ['frozen', 'Dibekukan']].map(([k, l]) => (
          <div key={k}><dt className="flex items-center gap-2 text-sm text-sub"><span className="h-2 w-2 rounded-full" style={{ background: PRESENCE[k].dot }} />{l}</dt><dd className="num mt-1 text-xl font-semibold">{count(k)}</dd></div>
        ))}
      </dl>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <section className="panel overflow-hidden">
          <div className="border-b border-line px-5 py-4"><SectionTitle className="!mb-0">Status pengguna</SectionTitle><p className="text-xs text-faint">Aktif = membuka MoneyOut dalam 10 menit terakhir</p></div>
          <ul className="divide-y divide-line">
            {[...users].sort((a, b) => order[a.presence] - order[b.presence] || String(b.lastSeenAt).localeCompare(String(a.lastSeenAt))).map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-5 py-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PRESENCE[u.presence].dot }} />
                <span className="min-w-0 flex-1"><span className="block truncate text-base font-medium">{u.username}{u.isAdmin && <span className="ml-1.5 text-xs font-normal text-faint">admin</span>}</span><span className="block truncate text-sm text-sub">{u.email}</span></span>
                <span className="text-right"><span className="block text-sm">{PRESENCE[u.presence].label}</span><span className="block text-xs text-faint">{u.lastSeenAt ? `terlihat ${timeAgo(u.lastSeenAt)}` : 'belum pernah aktif'}</span></span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-3">
            <Segmented size="sm" value={ev} onChange={setEv} options={[{ value: 'all', label: 'Semua' }, ...Object.entries(EVENT).map(([k, l]) => ({ value: k, label: k === 'status' ? 'Status' : l }))]} />
            <div className="relative w-full sm:w-52">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input className="input h-9 pl-9" placeholder="Cari pengguna" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari pengguna" />
            </div>
          </div>
          {log.length ? (
            <ul className="divide-y divide-line">
              {log.slice(0, 200).map((a) => {
                const u = byId[a.user_id]
                return (
                  <li key={a.id} className="grid grid-cols-[6.5rem_1fr] gap-3 px-5 py-3 text-sm">
                    <span className="num text-xs text-faint">{fmt(a.created_at)}</span>
                    <span className="min-w-0">
                      <span className="font-medium">{u?.username || 'pengguna terhapus'}</span> <span className="text-sub">{EVENT[a.event].toLowerCase()}</span>
                      {a.detail && <span className="block truncate text-xs text-sub">{a.detail.split(' · ').map((p, i) => (i === 0 ? p.replace(/\w+/g, (w) => STATUS[w]?.label || w) : p)).join(' · ')}</span>}
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : <EmptyState compact title="Belum ada aktivitas" text="Aktivitas masuk, keluar, dan perubahan status akan tercatat di sini." />}
        </section>
      </div>
    </div>
  )
}

export default function History() {
  return (
    <AdminPage title="History" desc="Aktivitas masuk dan keluar semua pengguna, serta siapa yang aktif, tidak aktif, dan diblokir.">
      {(a) => <Body users={a.users} activity={a.activity} />}
    </AdminPage>
  )
}
