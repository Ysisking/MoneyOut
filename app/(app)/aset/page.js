'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, Gem, Info } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { PageHeader, SectionTitle, Modal, ErrorText, EmptyState, IconBubble } from '@/components/ui'
import AmountInput from '@/components/AmountInput'
import { ACCOUNT_ICON } from '@/components/AccountPicker'
import { ASSET_ICON } from '@/components/AssetForm'
import { rupiah, dateShort } from '@/lib/format'
import { netWorth, ASSET_TYPES, ACCOUNT_TYPES } from '@/lib/stats'

// Komposisi kekayaan (bagian positif). Hutang ditampilkan terpisah sebagai pengurang.
const PARTS = [
  { k: 'dompet', label: 'Uang di dompet', color: '#0B7A57', href: null },
  { k: 'simpanan', label: 'Simpanan terkumpul', color: '#2a78d6', href: '/simpanan/' },
  { k: 'aset', label: 'Aset', color: '#C78100', href: null },
  { k: 'piutang', label: 'Piutang', color: '#9A9A95', href: '/hutang-piutang/' },
]

export default function AsetSaldo() {
  const data = useData()
  const { balances, assets, missing, openAccount, openAsset } = data
  const nw = useMemo(() => netWorth(data), [data])
  const [setFor, setSetFor] = useState(null)
  const positive = PARTS.reduce((s, p) => s + Math.max(0, nw[p.k]), 0)
  const assetsOff = missing.includes('assets')
  const sorted = [...assets].sort((a, b) => Number(b.value) - Number(a.value))

  return (
    <div>
      <PageHeader title="Aset & Saldo" desc="Uang dan harta yang sudah kamu miliki sebelum mulai mencatat. Nilainya tidak dihitung sebagai pemasukan."
        action={<button className="btn-primary" onClick={() => openAsset()} disabled={assetsOff}><Plus size={16} /> Tambah aset</button>} />

      <section className="panel mb-8 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-sub">Kekayaan bersih</p>
            <p className={`num mt-1 text-4xl font-semibold tracking-tight ${nw.total < 0 ? 'text-neg' : ''}`}>{rupiah(nw.total)}</p>
          </div>
          <p className="max-w-xs text-sm text-sub">Semua yang kamu miliki dikurangi hutang yang belum lunas.</p>
        </div>
        {positive > 0 && (
          <div className="mt-6 flex h-2 gap-[2px] overflow-hidden rounded-full">
            {PARTS.filter((p) => nw[p.k] > 0).map((p) => <div key={p.k} className="grow-x h-full" title={`${p.label}: ${rupiah(nw[p.k])}`} style={{ width: `${(nw[p.k] / positive) * 100}%`, background: p.color }} />)}
          </div>
        )}
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-5">
          {PARTS.map((p) => (
            <div key={p.k}>
              <dt className="flex items-center gap-1.5 text-sm text-sub"><span className="h-2 w-2 rounded-full" style={{ background: p.color }} />{p.label}</dt>
              <dd className="num mt-0.5 text-base font-medium">{p.href ? <Link href={p.href} className="hover:underline">{rupiah(nw[p.k])}</Link> : rupiah(nw[p.k])}</dd>
            </div>
          ))}
          <div>
            <dt className="text-sm text-sub">Hutang</dt>
            <dd className="num mt-0.5 text-base font-medium">{nw.hutang ? <Link href="/hutang-piutang/" className="text-neg hover:underline">−{rupiah(nw.hutang)}</Link> : rupiah(0)}</dd>
          </div>
        </dl>
      </section>

      <section className="mb-8">
        <SectionTitle action={<button className="btn-secondary h-8 px-3" onClick={() => openAccount()}><Plus size={14} /> Dompet baru</button>}>Saldo saat ini</SectionTitle>
        <p className="-mt-1 mb-3 text-sm text-sub">Isi saldo nyata tiap dompet hari ini — rekening, e-wallet, atau uang tunai yang belum pernah dicatat sebagai pemasukan.</p>
        <div className="panel overflow-hidden">
          <ul className="divide-y divide-line">
            {balances.map((a) => (
              <li key={a.id} className="flex items-center gap-3.5 px-5 py-3.5">
                <IconBubble icon={ACCOUNT_ICON[a.type]} />
                <Link href={`/dompet/?id=${a.id}`} className="min-w-0 flex-1">
                  <span className="block truncate text-base font-medium hover:underline">{a.name}</span>
                  <span className="block truncate text-sm text-sub">{ACCOUNT_TYPES[a.type].label} · saldo awal <span className="num">{rupiah(a.opening_balance)}</span></span>
                </Link>
                <span className={`num text-right text-base font-medium ${a.balance < 0 ? 'text-neg' : ''}`}>{rupiah(a.balance)}</span>
                <button className="btn-secondary h-8 px-3" onClick={() => setSetFor(a)}>Atur saldo</button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <SectionTitle action={!assetsOff && assets.length > 0 && <span className="num text-sm text-sub">Total <span className="font-medium text-ink">{rupiah(nw.aset)}</span></span>}>Aset lain</SectionTitle>
        <p className="-mt-1 mb-3 text-sm text-sub">Harta di luar dompet: rumah, kendaraan, emas, saham, deposito, barang berharga.</p>
        <div className="panel overflow-hidden">
          {assetsOff ? (
            <p className="flex items-start gap-2.5 p-5 text-sm text-sub"><Info size={16} className="mt-0.5 shrink-0" />Pencatatan aset belum aktif karena database perlu diperbarui. Jalankan ulang <code className="rounded bg-well px-1">supabase/moneyout.sql</code> di Supabase SQL Editor, lalu muat ulang halaman ini.</p>
          ) : sorted.length ? (
            <ul className="divide-y divide-line">
              {sorted.map((a) => (
                <li key={a.id}>
                  <button onClick={() => openAsset(a)} className="flex w-full items-center gap-3.5 px-5 py-3.5 text-left transition-colors hover:bg-subtle">
                    <IconBubble icon={ASSET_ICON[a.type] || Gem} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-medium">{a.name}</span>
                      <span className="block truncate text-sm text-sub">{ASSET_TYPES[a.type]?.label} · nilai per {dateShort(a.as_of)}{a.note && ` · ${a.note}`}</span>
                    </span>
                    <span className="text-right">
                      <span className="num block text-base font-medium">{rupiah(a.value)}</span>
                      <span className="num block text-xs text-faint">{nw.aset ? Math.round((Number(a.value) / nw.aset) * 100) : 0}% dari aset</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState compact icon={Gem} title="Belum ada aset" text="Misalnya rumah, motor, emas, atau saham yang sudah kamu miliki." action={<button className="btn-secondary" onClick={() => openAsset()}><Plus size={15} /> Tambah aset</button>} />
          )}
        </div>
      </section>

      {setFor && <SetBalance acc={setFor} onClose={() => setSetFor(null)} />}
    </div>
  )
}

// Atur saldo saat ini: ubah saldo awal dompet agar saldo sekarang sesuai kenyataan.
// Tidak membuat transaksi, jadi tidak tercatat sebagai pemasukan/pengeluaran.
function SetBalance({ acc, onClose }) {
  const { save } = useData()
  const [target, setTarget] = useState(Math.max(0, Math.round(acc.balance)))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const diff = target - acc.balance
  const newOpening = Number(acc.opening_balance) + diff
  async function submit(e) {
    e.preventDefault()
    if (!diff) return onClose()
    setBusy(true)
    try { await save('accounts', { id: acc.id, name: acc.name, type: acc.type, opening_balance: newOpening }); onClose() } catch (e2) { setErr(e2.message); setBusy(false) }
  }
  return (
    <Modal open onClose={onClose} title={`Saldo ${acc.name} saat ini`} description="Berapa uang di dompet ini sekarang?"
      footer={<><button className="btn-secondary" onClick={onClose}>Batal</button><button form="bal-form" className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan saldo'}</button></>}>
      <form id="bal-form" onSubmit={submit} className="space-y-5">
        <AmountInput label="Saldo sekarang" align="left" value={target} onChange={setTarget} quick={false} autoFocus />
        {diff !== 0 && (
          <dl className="divide-y divide-line rounded-lg border border-line text-sm">
            <div className="flex justify-between px-3.5 py-2.5"><dt className="text-sub">Saldo tercatat</dt><dd className="num">{rupiah(acc.balance)}</dd></div>
            <div className="flex justify-between px-3.5 py-2.5"><dt className="text-sub">Saldo awal berubah</dt><dd className="num">{rupiah(acc.opening_balance)} → {rupiah(newOpening)}</dd></div>
          </dl>
        )}
        <p className="text-sm text-sub">Selisihnya dimasukkan ke saldo awal dompet, bukan sebagai pemasukan, jadi laporan dan analisis tetap akurat. Untuk selisih karena lupa mencatat transaksi, pakai <b className="font-medium text-ink">Cocokkan saldo</b> di halaman dompet.</p>
        <ErrorText>{err}</ErrorText>
      </form>
    </Modal>
  )
}
