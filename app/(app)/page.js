'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowDownLeft, ArrowUpRight, PiggyBank, HandCoins, ChevronRight, Wallet, CalendarClock, Receipt } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { useData } from '@/components/DataProvider'
import { MonthSwitcher, EmptyState } from '@/components/ui'
import TxRow from '@/components/TxRow'
import CategoryBars from '@/components/CategoryBars'
import { rupiah, thisMonth, greeting, daysUntil, dateShort } from '@/lib/format'
import { total, ofKind, inMonth, byCategory, newestFirst, overview, debtInfo } from '@/lib/stats'

export default function Dasbor() {
  const { user } = useAuth()
  const { transactions, debts, payments, openTx } = useData()
  const [month, setMonth] = useState(thisMonth())

  const all = useMemo(() => overview({ transactions, debts, payments }), [transactions, debts, payments])
  const m = useMemo(() => {
    const tx = inMonth(transactions, month)
    const masuk = total(ofKind(tx, 'pemasukan')), keluar = total(ofKind(tx, 'pengeluaran')), simpan = total(ofKind(tx, 'simpanan'))
    return { masuk, keluar, simpan, sisa: masuk - keluar - simpan, cats: byCategory(ofKind(tx, 'pengeluaran')), count: tx.length }
  }, [transactions, month])
  const recent = useMemo(() => [...transactions].sort(newestFirst).slice(0, 6), [transactions])
  const due = useMemo(() => debts
    .map((d) => ({ d, ...debtInfo(d, payments) }))
    .filter((x) => !x.done && x.d.due_date && daysUntil(x.d.due_date) <= 7)
    .sort((a, b) => a.d.due_date.localeCompare(b.d.due_date)), [debts, payments])

  const tiles = [
    { label: 'Pemasukan', value: m.masuk, icon: ArrowDownLeft, href: '/pemasukan/', cls: 'bg-masuk-soft text-masuk-text' },
    { label: 'Pengeluaran', value: m.keluar, icon: ArrowUpRight, href: '/pengeluaran/', cls: 'bg-keluar-soft text-keluar-text' },
    { label: 'Disimpan', value: m.simpan, icon: PiggyBank, href: '/simpanan/', cls: 'bg-simpan-soft text-simpan-text' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{greeting()},</p>
          <h1 className="text-2xl font-extrabold tracking-tight">@{user.username}</h1>
          {user.occupation && <span className="mt-1.5 inline-block rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-muted ring-1 ring-line">{user.occupation}</span>}
        </div>
        <MonthSwitcher value={month} onChange={setMonth} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-brand-dark p-5 text-white lg:col-span-2">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-light/30 blur-2xl" />
          <div className="relative">
            <p className="flex items-center gap-2 text-sm text-white/75"><Wallet size={16} /> Saldo bisa dipakai</p>
            <p className="tnum mt-1 text-3xl font-extrabold sm:text-4xl">{rupiah(all.saldo)}</p>
            <p className="mt-1 text-xs text-white/60">Total pemasukan − pengeluaran − simpanan, sepanjang waktu.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => openTx({ kind: 'pemasukan' })} className="btn bg-white/15 text-white hover:bg-white/25"><ArrowDownLeft size={16} /> Pemasukan</button>
              <button onClick={() => openTx({ kind: 'pengeluaran' })} className="btn bg-white text-brand-dark hover:bg-white/90"><ArrowUpRight size={16} /> Pengeluaran</button>
              <button onClick={() => openTx({ kind: 'simpanan' })} className="btn bg-white/15 text-white hover:bg-white/25"><PiggyBank size={16} /> Simpan</button>
            </div>
          </div>
        </div>
        <div className="card grid grid-cols-1 divide-y divide-line">
          {[
            { label: 'Total simpanan', value: all.simpan, href: '/simpanan/', icon: PiggyBank, cls: 'text-simpan-text' },
            { label: 'Hutang belum lunas', value: all.hutang, href: '/hutang-piutang/', icon: HandCoins, cls: 'text-keluar-text' },
            { label: 'Piutang belum kembali', value: all.piutang, href: '/hutang-piutang/', icon: HandCoins, cls: 'text-utang-text' },
          ].map(({ label, value, href, icon: Icon, cls }) => (
            <Link key={label} href={href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-canvas">
              <Icon size={18} className={cls} />
              <span className="flex-1 text-sm text-muted">{label}</span>
              <span className="tnum font-bold">{rupiah(value)}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon, href, cls }) => (
          <Link key={label} href={href} className="card p-4 transition hover:-translate-y-0.5">
            <span className={`inline-flex rounded-lg p-1.5 ${cls}`}><Icon size={16} /></span>
            <p className="mt-2 text-xs font-medium text-muted">{label} bulan ini</p>
            <p className="tnum mt-0.5 text-lg font-extrabold">{rupiah(value)}</p>
          </Link>
        ))}
        <div className="card p-4">
          <span className="inline-flex rounded-lg bg-brand-soft p-1.5 text-brand"><Wallet size={16} /></span>
          <p className="mt-2 text-xs font-medium text-muted">Sisa bulan ini</p>
          <p className={`tnum mt-0.5 text-lg font-extrabold ${m.sisa < 0 ? 'text-red-700' : ''}`}>{rupiah(m.sisa)}</p>
        </div>
      </div>

      {due.length > 0 && (
        <div className="card border-utang/40 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-utang-text"><CalendarClock size={16} /> Jatuh tempo dalam 7 hari</p>
          <ul className="divide-y divide-line">
            {due.map(({ d, remaining }) => {
              const n = daysUntil(d.due_date)
              return (
                <li key={d.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="flex-1"><b>{d.kind === 'hutang' ? 'Bayar ke' : 'Tagih'} {d.person}</b> <span className="text-muted">· {dateShort(d.due_date)}</span></span>
                  <span className={`text-xs font-semibold ${n < 0 ? 'text-red-700' : 'text-utang-text'}`}>{n < 0 ? `Lewat ${-n} hari` : n === 0 ? 'Hari ini' : `${n} hari lagi`}</span>
                  <span className="tnum font-bold">{rupiah(remaining)}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Pengeluaran per kategori</h2>
            <Link href="/laporan/" className="flex items-center text-sm font-semibold text-brand">Laporan <ChevronRight size={16} /></Link>
          </div>
          {m.cats.length
            ? <CategoryBars rows={m.cats} kind="pengeluaran" tone="keluar" />
            : <EmptyState icon={Receipt} title="Belum ada pengeluaran bulan ini" text="Catat kopi, parkir, atau makan siang pertamamu." />}
        </section>
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-2">
            <h2 className="font-bold">Transaksi terakhir</h2>
            <Link href="/pengeluaran/" className="flex items-center text-sm font-semibold text-brand">Semua <ChevronRight size={16} /></Link>
          </div>
          {recent.length
            ? <div className="divide-y divide-line pb-2">{recent.map((t) => <TxRow key={t.id} tx={t} showDate />)}</div>
            : <EmptyState icon={Wallet} title="Belum ada catatan" text="Mulai dengan mencatat gaji atau pemasukan pertamamu." action={<button className="btn-primary" onClick={() => openTx({ kind: 'pemasukan' })}>Catat pemasukan</button>} />}
        </section>
      </div>
    </div>
  )
}
