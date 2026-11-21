'use client'
import { useEffect, useState } from 'react'
import { RotateCcw, Download, TriangleAlert } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { useData } from './DataProvider'
import { Modal, ErrorText } from './ui'
import PasswordInput from './PasswordInput'

const PHRASE = 'RESET'

// Mulai ulang pencatatan: 3 langkah konfirmasi (ringkasan + cadangan → ketik RESET → password) + jeda 5 detik.
export default function ResetData() {
  const [open, setOpen] = useState(false)
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-edge px-5 py-4">
      <div>
        <p className="text-sm font-medium">Mulai ulang pencatatan</p>
        <p className="text-sm text-sub">Hapus semua transaksi, dompet, anggaran, hutang-piutang, dan aset. Akunmu tetap ada.</p>
      </div>
      <button className="btn-secondary text-neg" onClick={() => setOpen(true)}><RotateCcw size={15} /> Reset</button>
      {open && <ResetDialog onClose={() => setOpen(false)} />}
    </section>
  )
}

function ResetDialog({ onClose }) {
  const { user, verifyPassword } = useAuth()
  const data = useData()
  const [step, setStep] = useState(1)
  const [phrase, setPhrase] = useState('')
  const [pw, setPw] = useState('')
  const [wait, setWait] = useState(5)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (step !== 3 || wait <= 0) return
    const t = setTimeout(() => setWait(wait - 1), 1000)
    return () => clearTimeout(t)
  }, [step, wait])

  const counts = [
    ['Transaksi', data.transactions.length], ['Pindah dompet', data.transfers.length], ['Dompet', data.accounts.length],
    ['Hutang & piutang', data.debts.length], ['Anggaran', data.budgets.length], ['Aset', data.assets.length], ['Kategori buatan sendiri', data.categories.length],
  ]

  function backup() {
    const keys = ['accounts', 'transactions', 'transfers', 'debts', 'payments', 'budgets', 'categories', 'assets']
    const blob = new Blob([JSON.stringify({ app: 'MoneyOut', user: user.email, exportedAt: new Date().toISOString(), ...Object.fromEntries(keys.map((k) => [k, data[k]])) }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = `moneyout-cadangan-${new Date().toISOString().slice(0, 10)}.json`; a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  async function confirmPassword(e) {
    e.preventDefault(); setBusy(true); setErr('')
    try { await verifyPassword(pw); setStep(3); setWait(5) } catch (e2) { setErr(e2.message) }
    setBusy(false)
  }
  async function runReset() {
    setBusy(true); setErr('')
    try { await data.resetAll(); setDone(true) } catch (e2) { setErr(e2.message); setBusy(false) }
  }

  if (done) return (
    <Modal open onClose={onClose} title="Pencatatan dimulai ulang" footer={<button className="btn-primary" onClick={onClose}>Selesai</button>}>
      <p className="text-sm text-sub">Semua catatan sudah dihapus. Dompet <b className="font-medium text-ink">Tunai</b> baru dibuat otomatis — kamu bisa mulai mencatat lagi.</p>
    </Modal>
  )

  return (
    <Modal open onClose={busy ? () => {} : onClose} title={`Reset pencatatan · langkah ${step} dari 3`}
      footer={<>
        <button className="btn-secondary" onClick={onClose} disabled={busy}>Batal</button>
        {step === 1 && <button className="btn-primary" onClick={() => setStep(2)}>Lanjut</button>}
        {step === 2 && <button form="reset-pw" className="btn-primary" disabled={phrase !== PHRASE || !pw || busy}>{busy ? 'Memeriksa…' : 'Lanjut'}</button>}
        {step === 3 && <button className="btn bg-neg text-white hover:bg-[#A82F26]" onClick={runReset} disabled={wait > 0 || busy}>{busy ? 'Menghapus…' : wait > 0 ? `Hapus semua (${wait})` : 'Hapus semua sekarang'}</button>}
      </>}>
      {step === 1 && (
        <div className="space-y-4">
          <p className="flex gap-2 rounded-lg bg-[#FBECEA] p-3 text-sm text-neg"><TriangleAlert size={16} className="mt-0.5 shrink-0" />Tindakan ini menghapus permanen semua pencatatanmu dan tidak bisa dibatalkan.</p>
          <div>
            <p className="mb-2 text-sm font-medium">Yang akan dihapus</p>
            <dl className="divide-y divide-line rounded-lg border border-line text-sm">
              {counts.map(([k, n]) => <div key={k} className="flex justify-between px-3.5 py-2"><dt className="text-sub">{k}</dt><dd className="num font-medium">{n}</dd></div>)}
            </dl>
            <p className="mt-2 text-xs text-sub">Akun, profil, dan notifikasimu tidak dihapus.</p>
          </div>
          <button className="btn-secondary w-full" onClick={backup}><Download size={15} /> Unduh cadangan dulu (.json)</button>
        </div>
      )}
      {step === 2 && (
        <form id="reset-pw" onSubmit={confirmPassword} className="space-y-4">
          <div>
            <label className="field-label" htmlFor="phrase">Ketik <span className="num rounded bg-well px-1.5 py-0.5">{PHRASE}</span> untuk melanjutkan</label>
            <input id="phrase" className="input" autoComplete="off" value={phrase} onChange={(e) => setPhrase(e.target.value.toUpperCase())} autoFocus />
          </div>
          <div><label className="field-label" htmlFor="reset-pw-input">Password akun</label><PasswordInput id="reset-pw-input" value={pw} onChange={setPw} autoComplete="current-password" /></div>
          <ErrorText>{err}</ErrorText>
        </form>
      )}
      {step === 3 && (
        <div className="space-y-3 text-sm">
          <p>Konfirmasi terakhir. Setelah tombol merah ditekan, <b>{data.transactions.length} transaksi</b> dan semua catatan lain akan hilang permanen.</p>
          <p className="text-sub">Tombol aktif setelah {wait > 0 ? `${wait} detik` : 'jeda selesai'}.</p>
          <ErrorText>{err}</ErrorText>
        </div>
      )}
    </Modal>
  )
}
