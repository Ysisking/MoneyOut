'use client'
import { Suspense, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, ArrowRightLeft, Pencil, Scale } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { PageHeader, Modal, ErrorText, EmptyState } from '@/components/ui'
import Register from '@/components/Register'
import AmountInput from '@/components/AmountInput'
import BalanceChart from '@/components/BalanceChart'
import { rupiah, todayISO, thisMonth } from '@/lib/format'
import { registerRows, ACCOUNT_TYPES, ADJUSTMENT, balanceSeries } from '@/lib/stats'

export default function DompetPage() {
  return <Suspense fallback={null}><Dompet /></Suspense>
}

function Dompet() {
  const id = useSearchParams().get('id')
  const data = useData()
  const { balances, openTx, openAccount } = data
  const acc = balances.find((a) => a.id === id)
  const rows = useMemo(() => (acc ? registerRows(data, { accountId: acc.id }) : []), [data, acc])
  const series = useMemo(() => (acc ? balanceSeries(data, { days: 90, accountId: acc.id, today: todayISO() }) : []), [data, acc])
  const [recon, setRecon] = useState(false)

  if (!acc) return <EmptyState title="Dompet tidak ditemukan" text="Mungkin sudah dihapus." action={<Link href="/" className="btn-primary">Ke dasbor</Link>} />
  const month = rows.filter((r) => r.date.startsWith(thisMonth()))
  const inM = month.filter((r) => r.delta > 0).reduce((s, r) => s + r.delta, 0)
  const outM = month.filter((r) => r.delta < 0).reduce((s, r) => s - r.delta, 0)

  return (
    <div>
      <PageHeader title={acc.name} desc={ACCOUNT_TYPES[acc.type].label}
        action={<>
          <button className="btn-secondary" onClick={() => setRecon(true)}><Scale size={15} /> Cocokkan saldo</button>
          <button className="btn-secondary" onClick={() => openTx({ kind: 'transfer', accountId: acc.id })}><ArrowRightLeft size={15} /> Pindah</button>
          <button className="btn-secondary w-9 px-0" onClick={() => openAccount(acc)} aria-label="Ubah dompet" title="Ubah dompet"><Pencil size={15} /></button>
          <button className="btn-primary" onClick={() => openTx({ kind: 'pengeluaran', accountId: acc.id })}><Plus size={16} /> Catat</button>
        </>} />

      <section className="panel mb-6">
        <div className="flex flex-wrap items-end justify-between gap-6 px-6 pt-6">
          <div>
            <p className="text-sm text-sub">Saldo</p>
            <p className={`num mt-1 text-4xl font-semibold tracking-tight ${acc.balance < 0 ? 'text-neg' : ''}`}>{rupiah(acc.balance)}</p>
          </div>
          <dl className="flex gap-8 text-sm">
            <div><dt className="text-sub">Masuk bulan ini</dt><dd className="num mt-0.5 font-medium text-pos">+{rupiah(inM)}</dd></div>
            <div><dt className="text-sub">Keluar bulan ini</dt><dd className="num mt-0.5 font-medium">−{rupiah(outM)}</dd></div>
            <div><dt className="text-sub">Saldo awal</dt><dd className="num mt-0.5 font-medium">{rupiah(acc.opening_balance)}</dd></div>
          </dl>
        </div>
        <div className="px-6 pb-4 pt-4"><BalanceChart data={series} height={180} /></div>
      </section>

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-md font-semibold tracking-tight">Transaksi</h2>
          <span className="text-xs text-faint">Angka kecil = saldo setelah transaksi</span>
        </div>
        <Register rows={rows} showBalance showAccount={false} empty="Belum ada transaksi di dompet ini." />
      </section>
      {recon && <Reconcile acc={acc} onClose={() => setRecon(false)} />}
    </div>
  )
}

// Rekonsiliasi: samakan saldo dengan kenyataan, catat selisihnya.
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
    <Modal open onClose={onClose} title="Cocokkan saldo" description={`Samakan saldo ${acc.name} dengan saldo sebenarnya di bank, e-wallet, atau dompetmu.`}
      footer={<><button className="btn-secondary" onClick={onClose}>Batal</button><button className="btn-primary" onClick={fix} disabled={busy}>{diff ? 'Simpan penyesuaian' : 'Sudah cocok'}</button></>}>
      <div className="space-y-5">
        <AmountInput label="Saldo sebenarnya" align="left" value={real} onChange={setReal} quick={false} />
        <dl className="divide-y divide-line rounded-lg border border-line text-sm">
          <div className="flex justify-between px-3.5 py-2.5"><dt className="text-sub">Tercatat di MoneyOut</dt><dd className="num">{rupiah(acc.balance)}</dd></div>
          <div className="flex justify-between px-3.5 py-2.5"><dt className="text-sub">Sebenarnya</dt><dd className="num">{rupiah(real)}</dd></div>
          <div className="flex justify-between px-3.5 py-2.5 font-medium"><dt>Selisih</dt><dd className={`num ${diff > 0 ? 'text-pos' : diff < 0 ? 'text-neg' : ''}`}>{diff > 0 ? '+' : diff < 0 ? '−' : ''}{rupiah(Math.abs(diff))}</dd></div>
        </dl>
        {diff !== 0 && <p className="text-sm text-sub">Selisih dicatat sebagai Penyesuaian Saldo. Tidak dihitung di laporan dan analisis.</p>}
        <ErrorText>{err}</ErrorText>
      </div>
    </Modal>
  )
}
