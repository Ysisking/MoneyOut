'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, Lock } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { EmptyState, ErrorText } from '@/components/ui'
import PasswordInput from '@/components/PasswordInput'

const KEY = 'moneyout:adminVerifiedUntil'
const WINDOW = 30 * 60 * 1000
const verified = () => { try { return Number(sessionStorage.getItem(KEY)) > Date.now() } catch { return false } }

// Fitur admin hanya untuk akun admin, dan wajib verifikasi ulang password (berlaku 30 menit).
export default function AdminGate({ children }) {
  const { user, verifyPassword } = useAuth()
  const [ok, setOk] = useState(verified)
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  if (!user.isAdmin) return <EmptyState icon={Lock} title="Halaman ini khusus admin" text="Akunmu tidak punya akses ke fitur admin." action={<Link href="/" className="btn-secondary">Ke dasbor</Link>} />
  if (ok) return children

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      await verifyPassword(pw)
      try { sessionStorage.setItem(KEY, String(Date.now() + WINDOW)) } catch {}
      setOk(true)
    } catch (e2) { setErr(e2.message); setBusy(false) }
  }
  return (
    <div className="mx-auto max-w-sm py-16">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-subtle"><ShieldCheck size={20} /></span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">Verifikasi admin</h1>
      <p className="mt-1.5 text-sm text-sub">Masukkan ulang password <span className="text-ink">{user.email}</span> untuk membuka fitur admin. Berlaku 30 menit.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div><label className="field-label" htmlFor="admin-pw">Password</label><PasswordInput id="admin-pw" value={pw} onChange={setPw} autoComplete="current-password" /></div>
        <ErrorText>{err}</ErrorText>
        <button className="btn-primary h-10 w-full" disabled={busy || !pw}>{busy ? 'Memeriksa…' : 'Verifikasi'}</button>
      </form>
    </div>
  )
}
