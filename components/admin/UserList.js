'use client'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { Segmented, EmptyState } from '@/components/ui'
import { timeAgo } from '@/components/NotificationList'
import StatusActions from './StatusActions'
import { STATUS } from './useAdmin'

export function StatusPill({ status }) {
  const s = STATUS[status] || STATUS.pending
  return <span className="inline-flex items-center gap-1.5 text-sm"><span className="h-2 w-2 rounded-full" style={{ background: s.dot }} />{s.label}</span>
}

const Initials = ({ name }) => <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-subtle text-xs font-semibold uppercase">{name.slice(0, 2)}</span>

// Daftar pengguna + saringan status + tombol aksi.
export default function UserList({ users, filters, actions, onSet, dateLabel, dateOf, empty }) {
  const [f, setF] = useState('all')
  const [q, setQ] = useState('')
  const s = q.trim().toLowerCase()
  const list = users.filter((u) => (f === 'all' || u.status === f) && (!s || u.username.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)))
  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-3">
        <Segmented size="sm" value={f} onChange={setF} options={[{ value: 'all', label: 'Semua', count: users.length }, ...filters.map((k) => ({ value: k, label: STATUS[k].label, count: users.filter((u) => u.status === k).length }))]} />
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input className="input h-9 pl-9" placeholder="Cari nama atau email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari pengguna" />
        </div>
      </div>
      {list.length ? (
        <ul className="divide-y divide-line">
          {list.map((u) => (
            <li key={u.id} className="grid gap-x-4 gap-y-3 px-5 py-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <Initials name={u.username} />
                <div className="min-w-0">
                  <p className="truncate text-base font-medium">{u.username}</p>
                  <p className="truncate text-sm text-sub">{u.email}{u.occupation && ` · ${u.occupation}`}</p>
                </div>
              </div>
              <div className="min-w-0 pl-12 md:pl-0">
                <StatusPill status={u.status} />
                <p className="truncate text-xs text-faint">{u.statusReason ? `“${u.statusReason}” · ` : ''}{dateLabel} {timeAgo(dateOf(u))}</p>
              </div>
              <div className="pl-12 md:pl-0"><StatusActions user={u} actions={actions} onSet={onSet} /></div>
            </li>
          ))}
        </ul>
      ) : <EmptyState compact title={users.length ? 'Tidak ada yang cocok' : empty.title} text={users.length ? 'Ubah saringan atau kata kunci.' : empty.text} />}
    </section>
  )
}
