'use client'
import { useState } from 'react'
import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import AuthFrame from '@/components/AuthFrame'
import PasswordInput from '@/components/PasswordInput'
import { ErrorText } from '@/components/ui'
import { useAuth } from '@/app/providers'
import { validateSignup } from '@/lib/validate'

export default function DaftarPage() {
  const { signUp } = useAuth()
  const [f, setF] = useState({ email: '', username: '', password: '', occupation: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [sent, setSent] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: typeof e === 'string' ? e : e.target.value })

  async function submit(e) {
    e.preventDefault()
    const v = validateSignup(f)
    if (v) return setErr(v)
    setBusy(true); setErr('')
    try {
      const { needsConfirm } = await signUp(f)
      if (needsConfirm) setSent(true)
    } catch (e2) { setErr(e2.message) }
    setBusy(false)
  }

  if (sent) return (
    <AuthFrame title="Cek email kamu" subtitle={`Kami mengirim tautan konfirmasi ke ${f.email}.`}>
      <div className="rounded-2xl border border-line bg-white p-5 text-sm text-muted">
        <MailCheck className="mb-2 text-brand" />
        Buka tautan di email tersebut untuk mengaktifkan akun, lalu masuk dengan email &amp; password yang baru dibuat.
      </div>
      <Link href="/masuk/" className="btn-primary mt-5 w-full">Ke halaman masuk</Link>
    </AuthFrame>
  )

  return (
    <AuthFrame title="Buat akun" subtitle="Gratis. Cukup empat isian.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" autoComplete="email" placeholder="nama@email.com" value={f.email} onChange={set('email')} />
        </div>
        <div>
          <label className="label" htmlFor="username">Username</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-muted">@</span>
            <input id="username" className="input pl-8" autoComplete="username" maxLength={20} placeholder="budi_santoso" value={f.username}
              onChange={(e) => setF({ ...f, username: e.target.value.replace(/\s/g, '') })} />
          </div>
          <p className="mt-1 text-xs text-muted">3–20 karakter: huruf, angka, titik, garis bawah.</p>
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <PasswordInput id="password" value={f.password} onChange={set('password')} autoComplete="new-password" placeholder="Minimal 8 karakter" />
        </div>
        <div>
          <label className="label" htmlFor="occupation">Status pekerjaan</label>
          <input id="occupation" className="input" maxLength={60} placeholder="mis. Karyawan swasta, Freelancer desain, Mahasiswa" value={f.occupation} onChange={set('occupation')} />
        </div>
        <ErrorText>{err}</ErrorText>
        <button className="btn-primary w-full !py-3" disabled={busy}>{busy ? 'Mendaftarkan…' : 'Daftar'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">Sudah punya akun? <Link href="/masuk/" className="font-semibold text-brand hover:underline">Masuk</Link></p>
    </AuthFrame>
  )
}
