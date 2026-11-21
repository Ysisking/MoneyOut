'use client'
import { useEffect, useState } from 'react'
import { Bell, Megaphone, Trash2, Send } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { useNotifications } from '@/components/Notifications'
import { NotificationItem, LEVEL_LABEL } from '@/components/NotificationList'
import { PageHeader, Segmented, EmptyState, ErrorText } from '@/components/ui'
import AdminGate from '@/components/admin/AdminGate'
import { backend } from '@/lib/backend'

function List({ items, empty, action }) {
  if (!items.length) return <EmptyState icon={Bell} title={empty.title} text={empty.text} />
  return <ul className="divide-y divide-line">{items.map((n) => <NotificationItem key={n.id} n={n} action={action?.(n)} />)}</ul>
}

export default function Notifikasi() {
  const { user } = useAuth()
  const { list, unread, markAllRead, missing } = useNotifications()
  const [tab, setTab] = useState('sistem')
  const shown = user.isAdmin ? (tab === 'sistem' ? list.filter((n) => n.kind === 'system') : list.filter((n) => n.kind === 'broadcast')) : list

  // Tandai dibaca setelah halaman dilihat sebentar.
  useEffect(() => {
    const ids = shown.filter((n) => !n.read).map((n) => n.id)
    if (!ids.length) return
    const t = setTimeout(() => markAllRead(ids), 2500)
    return () => clearTimeout(t)
  }, [shown, markAllRead])

  return (
    <div className="max-w-3xl">
      <PageHeader title="Notifikasi" desc={user.isAdmin ? 'Pemberitahuan dari sistem, dan pengumuman yang kamu kirim ke semua pengguna.' : 'Kabar tentang akunmu dan pengumuman dari admin.'}
        action={unread > 0 && <button className="btn-secondary" onClick={() => markAllRead()}>Tandai semua dibaca</button>} />
      {missing && <p className="mb-4 rounded-lg border border-line bg-subtle p-4 text-sm text-sub">Notifikasi belum aktif di database.</p>}
      {user.isAdmin && (
        <Segmented className="mb-4" value={tab} onChange={setTab} options={[
          { value: 'sistem', label: 'Sistem', count: list.filter((n) => n.kind === 'system' && !n.read).length || null },
          { value: 'pengumuman', label: 'Pengumuman' },
        ]} />
      )}
      {user.isAdmin && tab === 'pengumuman'
        ? <AdminGate><Broadcasts items={shown} /></AdminGate>
        : <section className="panel overflow-hidden"><List items={shown} empty={{ title: 'Belum ada notifikasi', text: 'Pemberitahuan baru akan muncul di sini.' }} /></section>}
    </div>
  )
}

function Broadcasts({ items }) {
  const { refresh } = useNotifications()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [level, setLevel] = useState('info')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [sent, setSent] = useState(false)
  const [confirm, setConfirm] = useState(null)

  async function send(e) {
    e.preventDefault()
    if (!title.trim()) return setErr('Isi judul pengumuman.')
    setBusy(true); setErr(''); setSent(false)
    try { await backend.broadcast({ title, body, level }); setTitle(''); setBody(''); setLevel('info'); setSent(true); await refresh() } catch (e2) { setErr(e2.message) }
    setBusy(false)
  }
  async function del(n) {
    if (confirm !== n.id) return setConfirm(n.id)
    try { await backend.deleteNotification(n.id); await refresh() } catch (e2) { setErr(e2.message) }
    setConfirm(null)
  }
  return (
    <div className="space-y-6">
      <form onSubmit={send} className="panel space-y-4 p-5">
        <div className="flex items-center gap-2"><Megaphone size={17} /><h2 className="text-md font-semibold tracking-tight">Pengumuman baru</h2><span className="ml-auto text-xs text-faint">Dikirim ke semua pengguna</span></div>
        <div><label className="field-label" htmlFor="b-title">Judul</label><input id="b-title" className="input" maxLength={120} placeholder="Pemeliharaan sistem Minggu malam" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><label className="field-label" htmlFor="b-body">Isi</label><textarea id="b-body" rows={4} maxLength={1000} className="input h-auto py-2" placeholder="MoneyOut tidak bisa diakses pukul 22.00–23.00 WIB." value={body} onChange={(e) => setBody(e.target.value)} /></div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><label className="field-label" htmlFor="b-level">Jenis</label>
            <select id="b-level" className="input h-9 w-auto" value={level} onChange={(e) => setLevel(e.target.value)}>{Object.entries(LEVEL_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </div>
          <div className="flex items-center gap-3">{sent && <span className="text-sm text-pos">Terkirim</span>}<button className="btn-primary" disabled={busy}><Send size={15} /> {busy ? 'Mengirim…' : 'Kirim ke semua'}</button></div>
        </div>
        <ErrorText>{err}</ErrorText>
      </form>
      <section className="panel overflow-hidden">
        <div className="border-b border-line px-5 py-3.5 text-sm font-medium">Terkirim <span className="text-faint">{items.length}</span></div>
        <List items={items} empty={{ title: 'Belum ada pengumuman', text: 'Pengumuman yang kamu kirim akan tampil di sini dan di notifikasi semua pengguna.' }}
          action={(n) => <button onClick={() => del(n)} className={`btn-ghost h-8 shrink-0 px-2 text-xs ${confirm === n.id ? 'text-neg' : ''}`} aria-label="Hapus pengumuman"><Trash2 size={14} /> {confirm === n.id ? 'Yakin?' : ''}</button>} />
      </section>
    </div>
  )
}
