'use client'
import { useMemo, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { useData } from './DataProvider'
import { MonthSwitcher, PageHeader, SectionTitle } from './ui'
import Register from './Register'
import CategoryBars from './CategoryBars'
import { SpendCalendar, BudgetEnvelopes } from './Widgets'
import { KINDS, iconFor } from '@/lib/categories'
import { rupiah, thisMonth, daysInMonth, todayISO, dateLong } from '@/lib/format'
import { total, ofKind, inMonth, byCategory, registerRows, budgetStatus, dailySpend } from '@/lib/stats'

export default function TxPage({ kind }) {
  const meta = KINDS[kind]
  const data = useData()
  const { transactions, openTx, openBudget } = data
  const [month, setMonth] = useState(thisMonth())
  const [cat, setCat] = useState('')
  const [day, setDay] = useState(null)
  const [q, setQ] = useState('')
  const isCurrent = month === thisMonth()
  const days = isCurrent ? Number(todayISO().slice(8)) : daysInMonth(month)

  const mine = useMemo(() => ofKind(transactions, kind), [transactions, kind])
  const monthTx = useMemo(() => inMonth(mine, month), [mine, month])
  const cats = useMemo(() => byCategory(monthTx), [monthTx])
  const allTime = useMemo(() => byCategory(mine), [mine])
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return registerRows(data, { kind }).filter((r) => r.date.startsWith(month) && (!cat || r.category === cat) && (!day || r.date === day)
      && (!s || r.note.toLowerCase().includes(s) || r.category.toLowerCase().includes(s)))
  }, [data, kind, month, cat, day, q])
  const sum = total(monthTx)
  const env = useMemo(() => (kind === 'pengeluaran' ? budgetStatus(data, month, { elapsed: days, days: daysInMonth(month) }) : []), [data, kind, month, days])
  const daily = useMemo(() => dailySpend(transactions, month), [transactions, month])
  const big = [...monthTx].sort((a, b) => b.amount - a.amount)[0]
  const shownSum = rows.reduce((s, r) => s + Math.abs(r.delta), 0)
  const filtered = cat || day || q

  return (
    <div>
      <PageHeader eyebrow="Input Variable" title={meta.label} desc={meta.desc}
        action={<div className="flex flex-wrap gap-2"><MonthSwitcher value={month} onChange={(v) => { setMonth(v); setCat(''); setDay(null) }} /><button onClick={() => openTx({ kind })} className="btn-primary"><Plus size={18} /> Catat</button></div>} />

      {/* Ringkasan satu baris, gaya kop laporan */}
      <dl className="mb-6 grid grid-cols-2 gap-y-4 border-b border-rule pb-5 sm:grid-cols-4">
        <div><dt className="eyebrow">Total bulan ini</dt><dd className={`num total-rule mt-1 inline-block text-2xl font-semibold ${{ masuk: 'text-masuk-text', keluar: 'text-keluar-text', simpan: 'text-simpan-text' }[meta.tone]}`}>{rupiah(sum)}</dd></div>
        <div><dt className="eyebrow">Catatan</dt><dd className="num mt-1 text-2xl font-semibold">{monthTx.length}</dd></div>
        <div><dt className="eyebrow">Rata-rata / hari</dt><dd className="num mt-1 text-lg font-semibold">{rupiah(sum / Math.max(1, days))}</dd></div>
        <div><dt className="eyebrow">Terbesar</dt><dd className="mt-1 truncate text-sm"><span className="font-semibold">{big ? big.category : '—'}</span>{big && <span className="num block text-muted">{rupiah(big.amount)}</span>}</dd></div>
      </dl>

      {kind === 'pengeluaran' && (
        <div className="mb-6 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <section className="card p-5">
            <SectionTitle action={day && <button onClick={() => setDay(null)} className="flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink"><X size={13} /> semua hari</button>}>Kalender</SectionTitle>
            <SpendCalendar month={month} daily={daily} selected={day} onPick={setDay} />
            <p className="mt-2 text-xs text-muted">Klik tanggal untuk melihat catatannya saja.</p>
          </section>
          <section className="card p-5">
            <SectionTitle action={<button onClick={openBudget} className="text-sm font-semibold text-brand hover:underline">{env.length ? 'Ubah' : 'Atur'} anggaran</button>}>Amplop</SectionTitle>
            {env.length ? <BudgetEnvelopes items={env} isCurrent={isCurrent} /> : cats.length ? <CategoryBars rows={cats} kind={kind} tone="keluar" limit={6} /> : <p className="text-sm text-muted">Belum ada pengeluaran bulan ini.</p>}
          </section>
        </div>
      )}

      {kind === 'simpanan' && allTime.length > 0 && (
        <section className="mb-6">
          <p className="eyebrow mb-2">Terkumpul sepanjang waktu</p>
          <div className="grid grid-cols-2 border-l border-t border-rule sm:grid-cols-3 lg:grid-cols-4">
            {allTime.map((c) => {
              const Icon = iconFor(kind, c.name)
              return (
                <div key={c.name} className="border-b border-r border-rule bg-sheet p-4">
                  <p className="flex items-center gap-1.5 text-xs text-muted"><Icon size={14} /> {c.name}</p>
                  <p className="num mt-1 text-lg font-semibold">{rupiah(c.amount)}</p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {kind === 'pemasukan' && cats.length > 0 && (
        <section className="card mb-6 p-5">
          <SectionTitle>Sumber pemasukan</SectionTitle>
          <CategoryBars rows={cats} kind={kind} tone="masuk" limit={6} />
        </section>
      )}

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <div className="no-scrollbar flex flex-1 gap-1.5 overflow-x-auto">
            <button className={!cat ? 'chip-on' : 'chip-off'} onClick={() => setCat('')}>Semua</button>
            {cats.map((c) => <button key={c.name} className={cat === c.name ? 'chip-on' : 'chip-off'} onClick={() => setCat(cat === c.name ? '' : c.name)}>{c.name}</button>)}
          </div>
          <div className="relative w-full sm:w-56">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input !py-1.5 pl-8 text-sm" placeholder="Cari keterangan…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari" />
          </div>
        </div>
        {filtered && (
          <p className="flex items-center justify-between border-b border-line bg-gold-soft/50 px-4 py-1.5 text-xs">
            <span>{day ? <>Tanggal <b>{dateLong(day)}</b></> : 'Hasil saringan'} · {rows.length} catatan</span>
            <span className="num font-semibold">{rupiah(shownSum)}</span>
          </p>
        )}
        <div className="pt-2">
          <Register rows={rows} quick={isCurrent ? { kind } : null} empty={monthTx.length ? 'Tidak ada yang cocok dengan saringan.' : `Belum ada ${meta.label.toLowerCase()} di bulan ini.`} />
        </div>
      </section>
    </div>
  )
}
