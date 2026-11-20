'use client'
import { useMemo, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { useData } from './DataProvider'
import { MonthSwitcher, PageHeader, SectionTitle } from './ui'
import Register from './Register'
import CategoryBars from './CategoryBars'
import { SpendCalendar, BudgetList } from './Widgets'
import { KINDS, iconFor } from '@/lib/categories'
import { rupiah, thisMonth, shiftMonth, daysInMonth, todayISO, dateLong, monthShort } from '@/lib/format'
import { total, ofKind, inMonth, byCategory, registerRows, budgetStatus, dailySpend } from '@/lib/stats'

const DESC = {
  pemasukan: 'Gaji, freelance, bonus, dan uang masuk lainnya.',
  pengeluaran: 'Semua yang dibeli atau dibayar.',
  simpanan: 'Uang yang disisihkan untuk tabungan, investasi, dan aset.',
}

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
  const prevSum = useMemo(() => total(inMonth(mine, shiftMonth(month, -1))), [mine, month])
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
  const change = prevSum ? Math.round(((sum - prevSum) / prevSum) * 100) : null
  const filtered = cat || day || q.trim()

  return (
    <div>
      <PageHeader title={meta.label} desc={DESC[kind]}
        action={<><MonthSwitcher value={month} onChange={(v) => { setMonth(v); setCat(''); setDay(null) }} /><button onClick={() => openTx({ kind })} className="btn-primary"><Plus size={16} /> Catat</button></>} />

      <dl className="panel mb-6 grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x [&>div]:px-5 [&>div]:py-4">
        <div><dt className="text-sm text-sub">Total <span className="capitalize">{monthShort(month)}</span></dt><dd className={`num mt-1 text-xl font-semibold tracking-tight ${kind === 'pemasukan' ? 'text-pos' : ''}`}>{rupiah(sum)}</dd></div>
        <div><dt className="text-sm text-sub">Dibanding <span className="capitalize">{monthShort(shiftMonth(month, -1))}</span></dt><dd className="num mt-1 text-xl font-semibold tracking-tight">{change == null ? '—' : `${change > 0 ? '+' : ''}${change}%`}</dd></div>
        <div><dt className="text-sm text-sub">Transaksi</dt><dd className="num mt-1 text-xl font-semibold tracking-tight">{monthTx.length}</dd></div>
        <div><dt className="text-sm text-sub">Rata-rata per hari</dt><dd className="num mt-1 text-xl font-semibold tracking-tight">{rupiah(sum / Math.max(1, days))}</dd></div>
      </dl>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="panel overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
            <div className="relative min-w-[12rem] flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input className="input h-9 pl-9" placeholder="Cari catatan atau kategori" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari" />
            </div>
            <select className="input h-9 w-auto min-w-[10rem]" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Saring kategori">
              <option value="">Semua kategori</option>
              {cats.map((c) => <option key={c.name} value={c.name}>{c.name} ({c.count})</option>)}
            </select>
          </div>
          {filtered && (
            <div className="flex items-center justify-between gap-3 border-b border-line bg-subtle px-5 py-2 text-sm">
              <span className="text-sub">{rows.length} transaksi{day && <> pada <span className="text-ink">{dateLong(day)}</span></>} · <span className="num text-ink">{rupiah(rows.reduce((s, r) => s + Math.abs(r.delta), 0))}</span></span>
              <button onClick={() => { setCat(''); setDay(null); setQ('') }} className="flex items-center gap-1 text-sub hover:text-ink"><X size={14} /> Hapus saringan</button>
            </div>
          )}
          <Register rows={rows} empty={monthTx.length ? 'Tidak ada yang cocok dengan saringan.' : `Belum ada ${meta.label.toLowerCase()} bulan ini.`} />
        </section>

        <aside className="space-y-6">
          {kind === 'pengeluaran' && (
            <>
              <section className="panel p-5">
                <SectionTitle>Kalender</SectionTitle>
                <SpendCalendar month={month} daily={daily} selected={day} onPick={setDay} />
              </section>
              <section className="panel p-5">
                <SectionTitle action={<button onClick={openBudget} className="text-sm font-medium text-sub hover:text-ink">{env.length ? 'Ubah' : 'Atur'}</button>}>Anggaran</SectionTitle>
                {env.length ? <BudgetList items={env} isCurrent={isCurrent} /> : <p className="text-sm text-sub">Belum ada anggaran. Atur batas per kategori untuk mengawasi belanja.</p>}
              </section>
            </>
          )}
          {kind === 'simpanan' && allTime.length > 0 && (
            <section className="panel p-5">
              <SectionTitle>Terkumpul</SectionTitle>
              <ul className="-my-1 divide-y divide-line">
                {allTime.map((c) => {
                  const Icon = iconFor(kind, c.name)
                  return <li key={c.name} className="flex items-center gap-2.5 py-2.5 text-sm"><Icon size={15} strokeWidth={1.8} className="text-sub" /><span className="flex-1">{c.name}</span><span className="num font-medium">{rupiah(c.amount)}</span></li>
                })}
                <li className="flex justify-between pt-2.5 text-sm font-medium"><span>Total</span><span className="num">{rupiah(total(mine))}</span></li>
              </ul>
            </section>
          )}
          {kind !== 'pengeluaran' && cats.length > 0 && (
            <section className="panel p-5">
              <SectionTitle>{kind === 'pemasukan' ? 'Sumber pemasukan' : 'Bulan ini'}</SectionTitle>
              <CategoryBars rows={cats} kind={kind} limit={6} color={kind === 'pemasukan' ? '#0B7A57' : '#111'} />
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
