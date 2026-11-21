'use client'
import { useState } from 'react'
import { useAuth } from '@/app/providers'
import { Modal, ErrorText } from '@/components/ui'
import { backend } from '@/lib/backend'

// Kontrol masuk ON/OFF. OFF = pengguna baru langsung aktif (gratis). ON = harus di-Accept admin.
export default function ControlSwitch() {
  const { user, refreshUser } = useAuth()
  const on = !!user.accessControl
  const [ask, setAsk] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function apply() {
    setBusy(true); setErr('')
    try { await backend.admin.setControl(!on); await refreshUser(); setAsk(false) } catch (e) { setErr(e.message) }
    setBusy(false)
  }
  return (
    <section className="panel mb-6 flex flex-wrap items-center gap-4 p-5">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-md font-semibold tracking-tight">Kontrol masuk <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${on ? 'bg-ink text-white' : 'bg-well text-sub'}`}>{on ? 'ON' : 'OFF'}</span></p>
        <p className="mt-0.5 text-sm text-sub">{on
          ? 'Pendaftar baru harus melalui Purchase Order dan kamu Accept setelah verifikasi pembayaran.'
          : 'Semua pendaftar langsung bisa memakai web secara gratis. Block dan Freeze tetap berlaku.'}</p>
      </div>
      <button role="switch" aria-checked={on} aria-label="Kontrol masuk" onClick={() => setAsk(true)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? 'bg-ink' : 'bg-edge'}`}>
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
      {ask && (
        <Modal open onClose={() => setAsk(false)} title={on ? 'Matikan kontrol masuk?' : 'Nyalakan kontrol masuk?'}
          footer={<><button className="btn-secondary" onClick={() => setAsk(false)}>Batal</button><button className="btn-primary" disabled={busy} onClick={apply}>{busy ? 'Menyimpan…' : on ? 'Matikan' : 'Nyalakan'}</button></>}>
          <div className="space-y-3 text-sm text-sub">
            {on ? <p>Pendaftar baru akan langsung aktif, dan pengguna yang masih menunggu atau antre bisa langsung memakai web. Pengguna yang diblokir atau dibekukan tetap tidak bisa masuk.</p>
              : <p>Pendaftar baru akan masuk Purchase Order dan melihat pesan: <span className="text-ink">“Akunmu sedang menunggu persetujuan admin… Silakan hubungi kontak admin untuk verifikasi pembayaran pesanan.”</span> Pengguna yang sudah aktif tidak terpengaruh.</p>}
            <ErrorText>{err}</ErrorText>
          </div>
        </Modal>
      )}
    </section>
  )
}
