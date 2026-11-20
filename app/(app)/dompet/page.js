'use client'
import { Suspense, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, ArrowRightLeft, Pencil, Scale } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { PageHeader, Modal, ErrorText, EmptyState } from '@/components/ui'
import Register from '@/components/Register'
import AmountInput from '@/components/AmountInput'
import { ACCOUNT_ICON } from '@/components/AccountPicker'
import { rupiah, todayISO, thisMonth } from '@/lib/format'
import { registerRows, ACCOUNT_TYPES, ADJUSTMENT } from '@/lib/stats'

export default function DompetPage() {
  return <Suspense fallback={null}><Dompet /></Suspense>
}

function Dompet() {
  const id = useSearchParams().get('id')
  const data = useData()
  const { balances, openTx, openAccount } = data
  const acc = balances.find((a) => a.id === id)
  const rows = useMemo(() => (acc ? registerRows(data, { accountId: acc.id }) : []), [data, acc])
  const [recon, setRecon] = useState(false)

  if (!acc) return <div className="card"><EmptyState title="Dompet tidak ditemukan" text="Mungkin sudah dihapus." action={<Link href="/" className="btn-primary">Ke dasbor</Link>} /></div>
  const Icon = ACCOUNT_ICON[acc.type]
  const month = rows.filter((r) => r.date.startsWith(thisMonth()))
  const inM = month.filter((r) => r.delta > 0).reduce((s, r) => s + r.delta, 0)
  const outM = month.filter((r) => r.delta < 0).reduce((s, r) => s - r.delta, 0)

  return (
    <div>
      <PageHeader eyebrow={<span className="flex items-center gap-1.5"><Icon size={13} /> {ACCOUNT_TYPES[acc.type].label}</span>} title={acc.name}
        action={<div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={() => setRecon(true)}><Scale size={16} /> Cocokkan saldo</button>
          <button className="btn-ghost" onClick={() => openTx({ kind: 'transfer', accountId: acc.id })}><ArrowRightLeft size={16} /> Pindah</button>
          <button className="btn-ghost !px-3" onClick={() => openAccount(acc)} aria-label="Ubah dompet"><Pencil size={16} /></button>
          <button className="btn-primary" onClick={() => openTx({ kind: 'pengeluaran', accountId: acc.id })}><Plus size={18} /> Catat</button>
        </div>} />

      <dl className="mb-6 grid grid-cols-2 gap-y-4 border-b border-rule pb-5 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1"><dt className="eyebrow">Saldo sekarang</dt><dd className={`num total-rule mt-1 inline-block text-3xl font-semibold ${acc.balance < 0 ? 'text-keluar-text' : ''}`}>{rupiah(acc.balance)}</dd></div>
        <div><dt className="eyebrow">Masuk bulan ini</dt><dd className="num mt-1 text-lg text-masuk-text">+ {rupiah(inM)}</dd></div>
        <div><dt className="eyebrow">Keluar bulan ini</dt><dd className="num mt-1 text-lg text-keluar-text">− {rupiah(outM)}</dd></div>
        <div><dt className="eyebrow">Saldo awal</dt><dd className="num mt-1 text-lg text-muted">{rupiah(acc.opening_balance)}</dd></div>
      </dl>

      <section className="card overflow-hidden pt-3">
        <p className="eyebrow px-4 pb-2">Register · saldo berjalan</p>
        <Register rows={rows} showBalance showAccount={false} quick={{ accountId: acc.id }} empty="Belum ada catatan di dompet ini." />
        <div className="flex items-baseline justify-between px-4 py-3 text-sm text-muted">
          <span>Saldo awal</span><span className="num">{rupiah(acc.opening_balance)}</span>
        </div>
      </section>
      {recon && <Reconcile acc={acc} onClose={() => setRecon(false)} />}
    </div>
  )
}

// Cocokkan saldo (rekonsiliasi): bandingkan dengan saldo nyata, catat selisihnya.
function Reconcile({ acc, onClose }) {
  const { save } = useData()
  const [real, setReal] = useState(Math.max(0, Math.round(acc.balance)))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const diff = real - acc.balance
  async function fix() {
    if (!diff) return onClose()
    setBusy(true)
    try {
      await save('transactions', { kind: diff > 0 ? 'pemasukan' : 'pengeluaran', category: ADJUSTMENT, amount: Math.abs(diff), date: todayISO(), note: 'Hasil cocokkan saldo', account_id: acc.id })
      onClose()
    } catch (e) { setErr(e.message); setBusy(false) }
  }
  return (
    <Modal open onClose={onClose} title={`Cocokkan saldo ${acc.name}`}
      footer={<><button className="btn-ghost" onClick={onClose}>Batal</button><button className="btn-primary" onClick={fix} disabled={busy}>{diff ? 'Catat selisih' : 'Sudah cocok'}</button></>}>
      <div className="space-y-5">
        <p className="text-sm text-muted">Lihat saldo asli di aplikasi bank / e-wallet atau hitung uang tunaimu, lalu tulis di bawah.</p>
        <div><label className="eyebrow mb-1 block" htmlFor="amount">Saldo sebenarnya</label><AmountInput value={real} onChange={setReal} quick={false} /></div>
        <dl className="text-sm">
          <div className="flex justify-between border-b border-dotted border-rule py-1.5"><dt>Menurut MoneyOut</dt><dd className="num">{rupiah(acc.balance)}</dd></div>
          <div className="flex justify-between border-b border-dotted border-rule py-1.5"><dt>Sebenarnya</dt><dd className="num">{rupiah(real)}</dd></div>
          <div className="flex justify-between border-t border-ink pt-2 font-semibold"><dt>Selisih</dt><dd className={`num total-rule ${diff > 0 ? 'text-masuk-text' : diff < 0 ? 'text-keluar-text' : ''}`}>{diff > 0 ? '+' : diff < 0 ? '−' : ''} {rupiah(Math.abs(diff))}</dd></div>
        </dl>
        {diff !== 0 && <p className="text-sm">Selisih dicatat sebagai <b>Penyesuaian Saldo</b> di register dompet ini. Tidak dihitung sebagai pemasukan/pengeluaran di laporan & analisis.</p>}
        <ErrorText>{err}</ErrorText>
      </div>
    </Modal>
  )
}
