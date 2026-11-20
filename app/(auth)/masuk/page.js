'use client'
import { useState } from 'react'
import Link from 'next/link'
import AuthFrame from '@/components/AuthFrame'
import PasswordInput from '@/components/PasswordInput'
import { ErrorText } from '@/components/ui'
import { useAuth } from '@/app/providers'

export default function MasukPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErr('')
    try { await signIn({ email, password }) } catch (e2) { setErr(e2.message); setBusy(false) }
  }

  return (
    <AuthFrame title="Masuk" subtitle="Lanjutkan mencatat keuanganmu.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" required autoComplete="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" />
        </div>
        <ErrorText>{err}</ErrorText>
        <button className="btn-primary w-full !py-3" disabled={busy}>{busy ? 'Memeriksa…' : 'Masuk'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">Belum punya akun? <Link href="/daftar/" className="font-semibold text-brand hover:underline">Daftar gratis</Link></p>
    </AuthFrame>
  )
}
