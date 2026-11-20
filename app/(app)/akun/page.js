'use client'
import { useState } from 'react'
import { LogOut, Check } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { PageHeader, ErrorText } from '@/components/ui'
import PasswordInput from '@/components/PasswordInput'
import { USERNAME_RE } from '@/lib/validate'
import { dateShort } from '@/lib/format'

export default function Akun() {
  const { user, updateProfile, changePassword, signOut, mode } = useAuth()
  const [username, setUsername] = useState(user.username)
  const [occupation, setOccupation] = useState(user.occupation)
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState({})
  const [busy, setBusy] = useState('')

  async function saveProfile(e) {
    e.preventDefault()
    if (!USERNAME_RE.test(username)) return setMsg({ profErr: 'Username 3–20 karakter: huruf, angka, titik, atau garis bawah.' })
    if (!occupation.trim()) return setMsg({ profErr: 'Status pekerjaan wajib diisi.' })
    setBusy('prof'); setMsg({})
    try { await updateProfile({ username, occupation }); setMsg({ profOk: true }) } catch (e2) { setMsg({ profErr: e2.message }) }
    setBusy('')
  }
  async function savePw(e) {
    e.preventDefault()
    if (pw.length < 8) return setMsg({ pwErr: 'Password minimal 8 karakter.' })
    setBusy('pw'); setMsg({})
    try { await changePassword(pw); setPw(''); setMsg({ pwOk: true }) } catch (e2) { setMsg({ pwErr: e2.message }) }
    setBusy('')
  }

  const Ok = ({ children }) => <p className="flex items-center gap-1.5 text-sm font-semibold text-masuk-text"><Check size={16} /> {children}</p>

  return (
    <div className="max-w-2xl">
      <PageHeader title="Akun" desc={`Masuk sebagai ${user.email}${user.createdAt ? ` · bergabung ${dateShort(user.createdAt.slice(0, 10))}` : ''}`} />
      <form onSubmit={saveProfile} className="card mb-4 space-y-4 p-5">
        <h2 className="font-bold">Profil</h2>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="input bg-canvas text-muted" value={user.email} disabled />
        </div>
        <div>
          <label className="label" htmlFor="username">Username</label>
          <input id="username" className="input" maxLength={20} value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))} />
        </div>
        <div>
          <label className="label" htmlFor="occupation">Status pekerjaan</label>
          <input id="occupation" className="input" maxLength={60} value={occupation} onChange={(e) => setOccupation(e.target.value)} />
        </div>
        <ErrorText>{msg.profErr}</ErrorText>
        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={busy === 'prof'}>{busy === 'prof' ? 'Menyimpan…' : 'Simpan profil'}</button>
          {msg.profOk && <Ok>Tersimpan</Ok>}
        </div>
      </form>
      <form onSubmit={savePw} className="card mb-4 space-y-4 p-5">
        <h2 className="font-bold">Ganti password</h2>
        <div>
          <label className="label" htmlFor="new-pw">Password baru</label>
          <PasswordInput id="new-pw" value={pw} onChange={setPw} autoComplete="new-password" placeholder="Minimal 8 karakter" />
        </div>
        <ErrorText>{msg.pwErr}</ErrorText>
        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={busy === 'pw'}>{busy === 'pw' ? 'Menyimpan…' : 'Ganti password'}</button>
          {msg.pwOk && <Ok>Password diganti</Ok>}
        </div>
      </form>
      <button onClick={signOut} className="btn-ghost"><LogOut size={16} /> Keluar dari {mode === 'local' ? 'akun lokal' : 'akun'}</button>
    </div>
  )
}
