'use client'
import { useState } from 'react'
import { LogOut, Check } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { PageHeader, ErrorText } from '@/components/ui'
import PasswordInput from '@/components/PasswordInput'
import { USERNAME_RE } from '@/lib/validate'
import { dateShort } from '@/lib/format'

function Row({ title, desc, children }) {
  return (
    <div className="grid gap-x-10 gap-y-4 border-t border-line py-8 md:grid-cols-[240px_1fr]">
      <div><h2 className="text-md font-semibold tracking-tight">{title}</h2><p className="mt-1 text-sm text-sub">{desc}</p></div>
      <div className="max-w-md">{children}</div>
    </div>
  )
}

export default function Akun() {
  const { user, updateProfile, changePassword, signOut, mode } = useAuth()
  const [username, setUsername] = useState(user.username)
  const [occupation, setOccupation] = useState(user.occupation)
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState({})
  const [busy, setBusy] = useState('')
  const dirty = username !== user.username || occupation !== user.occupation

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
  const Ok = ({ children }) => <span className="flex items-center gap-1 text-sm text-pos"><Check size={15} /> {children}</span>

  return (
    <div className="max-w-4xl">
      <PageHeader title="Profil" desc={`${user.email}${user.createdAt ? ` · bergabung ${dateShort(user.createdAt.slice(0, 10))}` : ''}`} />
      <Row title="Informasi profil" desc="Nama yang tampil di aplikasi dan status pekerjaanmu.">
        <form onSubmit={saveProfile} className="space-y-4">
          <div><label className="field-label" htmlFor="email">Email</label><input id="email" className="input bg-subtle text-sub" value={user.email} disabled /></div>
          <div><label className="field-label" htmlFor="username">Username</label><input id="username" className="input" maxLength={20} value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))} /></div>
          <div><label className="field-label" htmlFor="occupation">Status pekerjaan</label><input id="occupation" className="input" maxLength={60} value={occupation} onChange={(e) => setOccupation(e.target.value)} /></div>
          <ErrorText>{msg.profErr}</ErrorText>
          <div className="flex items-center gap-3"><button className="btn-primary" disabled={busy === 'prof' || !dirty}>{busy === 'prof' ? 'Menyimpan…' : 'Simpan perubahan'}</button>{msg.profOk && <Ok>Tersimpan</Ok>}</div>
        </form>
      </Row>
      <Row title="Password" desc="Gunakan minimal 8 karakter yang tidak dipakai di layanan lain.">
        <form onSubmit={savePw} className="space-y-4">
          <div><label className="field-label" htmlFor="new-pw">Password baru</label><PasswordInput id="new-pw" value={pw} onChange={setPw} autoComplete="new-password" /></div>
          <ErrorText>{msg.pwErr}</ErrorText>
          <div className="flex items-center gap-3"><button className="btn-secondary" disabled={busy === 'pw' || !pw}>{busy === 'pw' ? 'Menyimpan…' : 'Ganti password'}</button>{msg.pwOk && <Ok>Password diganti</Ok>}</div>
        </form>
      </Row>
      <Row title="Sesi" desc={mode === 'local' ? 'Akun lokal di browser ini.' : 'Keluar dari perangkat ini.'}>
        <button onClick={signOut} className="btn-secondary"><LogOut size={15} /> Keluar</button>
      </Row>
    </div>
  )
}
