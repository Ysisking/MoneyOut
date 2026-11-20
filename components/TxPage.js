'use client'
import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useData } from './DataProvider'
import { MonthSwitcher, EmptyState, PageHeader } from './ui'
import TxRow from './TxRow'
import CategoryBars from './CategoryBars'
import { KINDS, TONE, iconFor } from '@/lib/categories'
import { rupiah, thisMonth, dateLong, daysInMonth, todayISO } from '@/lib/format'
import { total, ofKind, inMonth, byCategory, groupByDate } from '@/lib/stats'

export default function TxPage({ kind }) {
  const meta = KINDS[kind]
  const tone = TONE[meta.tone]
  const { transactions, openTx } = useData()
  const [month, setMonth] = useState(thisMonth())
  const [cat, setCat] = useState('')
  const [q, setQ] = useState('')

  const mine = useMemo(() => ofKind(transactions, kind), [transactions, kind])
  const monthTx = useMemo(() => inMonth(mine, month), [mine, month])
  const cats = useMemo(() => byCategory(monthTx), [monthTx])
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return monthTx.filter((t) => (!cat || t.category === cat) && (!s || t.note.toLowerCase().includes(s) || t.category.toLowerCase().includes(s)))
  }, [monthTx, cat, q])
  const groups = useMemo(() => groupByDate(shown), [shown])
  const sum = total(monthTx)
  const allTime = useMemo(() => byCategory(mine), [mine])

  // Rata-rata per hari: hari yang sudah lewat untuk bulan berjalan.
  const days = month === thisMonth() ? Number(todayISO().slice(8)) : daysInMonth(month)

  return (
    <div>
      <PageHeader title={meta.label} desc={meta.desc}
        action={<button onClick={() => openTx({ kind })} className="btn-primary"><Plus size={18} /> Catat {meta.label.toLowerCase()}</button>} />

      {kind === 'simpanan' && allTime.length > 0 && (
        <section className="mb-5">
          <h2 className="mb-2 text-sm font-bold text-muted">Total terkumpul per jenis simpanan</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {allTime.map((c) => {
              const Icon = iconFor(kind, c.name)
              return (
                <div key={c.name} className="card p-4">
                  <span className={`inline-flex rounded-lg p-1.5 ${tone.bg} ${tone.text}`}><Icon size={16} /></span>
                  <p className="mt-2 truncate text-xs font-medium text-muted">{c.name}</p>
                  <p className="tnum font-extrabold">{rupiah(c.amount)}</p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <MonthSwitcher value={month} onChange={(v) => { setMonth(v); setCat('') }} />
        <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input !py-2 pl-9" placeholder="Cari catatan…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari catatan" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <section className="card overflow-hidden">
          {cats.length > 0 && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-line p-3">
              <button className={!cat ? 'chip-on' : 'chip-off'} onClick={() => setCat('')}>Semua</button>
              {cats.map((c) => (
                <button key={c.name} className={cat === c.name ? 'chip-on' : 'chip-off'} onClick={() => setCat(cat === c.name ? '' : c.name)}>
                  {c.name} <span className="opacity-70">({c.count})</span>
                </button>
              ))}
            </div>
          )}
          {groups.length ? groups.map((g) => (
            <div key={g.date}>
              <div className="flex items-center justify-between bg-canvas/70 px-4 py-1.5 text-xs font-semibold text-muted">
                <span className="capitalize">{dateLong(g.date)}</span>
                <span className="tnum">{rupiah(total(g.items))}</span>
              </div>
              <div className="divide-y divide-line">{g.items.map((t) => <TxRow key={t.id} tx={t} />)}</div>
            </div>
          )) : (
            <EmptyState icon={meta.icon} title={monthTx.length ? 'Tidak ada yang cocok' : `Belum ada ${meta.label.toLowerCase()} bulan ini`}
              text={monthTx.length ? 'Coba ubah kata kunci atau kategori.' : meta.desc}
              action={!monthTx.length && <button className="btn-primary" onClick={() => openTx({ kind })}><Plus size={16} /> Catat sekarang</button>} />
          )}
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <p className="text-sm text-muted">Total {meta.label.toLowerCase()} bulan ini</p>
            <p className={`tnum mt-1 text-2xl font-extrabold ${tone.text}`}>{rupiah(sum)}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Jumlah catatan</dt><dd className="font-semibold">{monthTx.length}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Rata-rata per hari</dt><dd className="tnum font-semibold">{rupiah(sum / Math.max(1, days))}</dd></div>
              {cats[0] && <div className="flex justify-between gap-3"><dt className="text-muted">Terbesar</dt><dd className="truncate font-semibold">{cats[0].name}</dd></div>}
            </dl>
          </div>
          {cats.length > 0 && (
            <div className="card p-5">
              <h2 className="mb-4 text-sm font-bold">Per kategori</h2>
              <CategoryBars rows={cats} kind={kind} tone={meta.tone} limit={5} />
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
