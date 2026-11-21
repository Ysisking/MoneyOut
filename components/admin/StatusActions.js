'use client'
import { useState } from 'react'
import { Check, Hourglass, Ban, Snowflake } from 'lucide-react'
import { Modal, ErrorText } from '@/components/ui'

const ACTIONS = {
  active: { label: 'Accept', icon: Check, cls: 'btn-primary', title: 'Terima pengguna', desc: 'Pengguna langsung bisa memakai web.' },
  queued: { label: 'Queue', icon: Hourglass, cls: 'btn-secondary', title: 'Masukkan ke antrean', desc: 'Pengguna menunggu giliran karena sistem sibuk.', optional: true },
  blocked: { label: 'Block', icon: Ban, cls: 'btn-secondary text-neg', title: 'Blokir pengguna', desc: 'Pengguna tidak bisa memakai web sampai blokir dipulihkan.', required: true, placeholder: 'Pelanggaran ketentuan, data palsu, …' },
  frozen: { label: 'Freeze', icon: Snowflake, cls: 'btn-secondary', title: 'Bekukan akun', desc: 'Akses ditangguhkan sementara, data tetap aman.', required: true, placeholder: 'Belum membayar langganan bulan ini, …' },
}

// Tombol aksi status. Accept langsung jalan; Queue/Block/Freeze membuka kotak alasan.
export default function StatusActions({ user, actions, onSet }) {
  const [open, setOpen] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')

  async function run(status, r = '') {
    setBusy(status); setErr('')
    try { await onSet(user.id, status, r); setOpen(null); setReason('') } catch (e) { setErr(e.message) }
    setBusy('')
  }
  const a = open && ACTIONS[open]
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {actions.map((k) => {
          const A = ACTIONS[k]
          const current = user.status === k
          return (
            <button key={k} disabled={current || !!busy} title={current ? 'Status saat ini' : A.desc}
              onClick={() => (k === 'active' ? run(k) : (setOpen(k), setReason(''), setErr('')))}
              className={`${A.cls} h-8 px-2.5 text-xs ${current ? 'opacity-40' : ''}`}>
              <A.icon size={13} /> {busy === k ? '…' : A.label}
            </button>
          )
        })}
      </div>
      {!open && err && <p className="mt-1.5 text-xs text-neg">{err}</p>}
      {a && (
        <Modal open onClose={() => setOpen(null)} title={a.title} description={`${user.username} · ${user.email}`}
          footer={<><button className="btn-secondary" onClick={() => setOpen(null)}>Batal</button>
            <button className={open === 'blocked' ? 'btn bg-neg text-white hover:bg-[#A82F26]' : 'btn-primary'} disabled={!!busy || (a.required && !reason.trim())} onClick={() => run(open, reason)}>{busy ? 'Menyimpan…' : a.label}</button></>}>
          <div className="space-y-3">
            <p className="text-sm text-sub">{a.desc}</p>
            <div>
              <label className="field-label" htmlFor="reason">{a.required ? 'Alasan' : 'Pesan untuk pengguna'} {a.optional && <span className="font-normal text-faint">(opsional)</span>}</label>
              <textarea id="reason" rows={3} maxLength={200} className="input h-auto py-2" placeholder={a.placeholder || 'Perkiraan diproses besok pagi'} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
              <p className="mt-1 text-xs text-faint">Pengguna akan melihat ini di notifikasi dan di layar statusnya.</p>
            </div>
            <ErrorText>{err}</ErrorText>
          </div>
        </Modal>
      )}
    </>
  )
}
