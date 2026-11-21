'use client'
import { useEffect, useState } from 'react'
import { Clock, Hourglass, Ban, Snowflake, LogOut, RefreshCw, MessageCircle } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { backend } from '@/lib/backend'
import Logo from './Logo'
import { NotificationItem } from './NotificationList'

const STATE = {
  pending: { icon: Clock, title: 'Pendaftaranmu sedang ditinjau', text: 'Akunmu sedang menunggu persetujuan admin. Kamu akan diberi tahu di sini begitu akun aktif.', pay: true },
  queued: { icon: Hourglass, title: 'Kamu dalam antrean', text: 'Sistem sedang sibuk. Akunmu akan diproses sesuai giliran — tidak perlu daftar ulang.' },
  blocked: { icon: Ban, title: 'Akunmu diblokir', text: 'Kamu tidak bisa memakai MoneyOut sampai blokir dipulihkan oleh admin.' },
  frozen: { icon: Snowflake, title: 'Akunmu dibekukan sementara', text: 'Akses ditangguhkan. Datamu tetap aman dan bisa dipakai lagi setelah akun dipulihkan.' },
}

// Ditampilkan untuk akun yang belum/tidak aktif. Memeriksa status tiap 20 detik.
export default function StatusScreen({ user }) {
  const { signOut, refreshUser } = useAuth()
  const [notes, setNotes] = useState([])
  const [busy, setBusy] = useState(false)
  const s = STATE[user.status] || STATE.pending

  useEffect(() => {
    const load = () => backend.notifications().then((r) => setNotes(r.list.slice(0, 5))).catch(() => {})
    load(); backend.heartbeat()
    const t = setInterval(() => { refreshUser(); load() }, 20000)
    return () => clearInterval(t)
  }, [refreshUser])

  async function check() { setBusy(true); await refreshUser(); setBusy(false) }

  return (
    <div className="flex min-h-dvh flex-col px-6 py-6">
      <Logo />
      <div className="m-auto w-full max-w-md py-12">
        <span className={`grid h-11 w-11 place-items-center rounded-full ${user.status === 'blocked' || user.status === 'frozen' ? 'bg-[#FBECEA] text-neg' : 'bg-subtle text-sub'}`}><s.icon size={20} /></span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">{s.title}</h1>
        <p className="mt-2 text-base text-sub">{s.text}</p>
        {s.pay && <p className="mt-3 text-base font-medium">Silakan hubungi kontak admin untuk verifikasi pembayaran pesanan.</p>}
        {user.statusReason && <p className="mt-4 rounded-lg border border-line bg-subtle px-4 py-3 text-sm"><span className="text-sub">{user.status === 'queued' ? 'Catatan admin: ' : 'Alasan: '}</span>{user.statusReason}</p>}
        <p className="mt-4 text-sm text-sub">Masuk sebagai <span className="text-ink">{user.email}</span></p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button className="btn-primary" onClick={check} disabled={busy}><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> Cek status</button>
          {user.contactWa && (
            <a className="btn-secondary" target="_blank" rel="noopener" href={`https://wa.me/${user.contactWa}?text=${encodeURIComponent(`Halo admin MoneyOut, saya ingin verifikasi pembayaran pesanan untuk akun ${user.email} (@${user.username}).`)}`}>
              <MessageCircle size={15} /> Hubungi admin
            </a>
          )}
          <button className="btn-ghost" onClick={signOut}><LogOut size={15} /> Keluar</button>
        </div>
        {notes.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-2 text-sm font-medium text-sub">Pesan untukmu</h2>
            <ul className="panel divide-y divide-line">{notes.map((n) => <NotificationItem key={n.id} n={n} />)}</ul>
          </section>
        )}
      </div>
      <p className="text-xs text-faint">© {new Date().getFullYear()} gammaproject. Hak cipta dilindungi.</p>
    </div>
  )
}
