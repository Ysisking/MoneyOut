'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarClock, Wallet } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { useData } from '@/components/DataProvider'
import { MonthSwitcher, SectionTitle, Segmented, EmptyState } from '@/components/ui'
import Register from '@/components/Register'
import BalanceChart from '@/components/BalanceChart'
import Insight from '@/components/Insight'
import CategoryBars from '@/components/CategoryBars'
import { BudgetList } from '@/components/Widgets'
import ResetData from '@/components/ResetData'
import { analyze } from '@/lib/insights'
import { rupiah, thisMonth, shiftMonth, greeting, daysUntil, dateShort, todayISO, daysInMonth, monthShort } from '@/lib/format'
import { total, ofKind, inMonth, byCategory, debtInfo, registerRows, budgetStatus, balanceSeries, netWorth } from '@/lib/stats'

const RANGES = [{ value: 30, label: '30H', long: '30 hari' }, { value: 90, label: '90H', long: '90 hari' }, { value: 182, label: '6B', long: '6 bulan' }, { value: 365, label: '1T', long: '1 tahun' }]
const monthTotals = (txs, m) => {
  const tx = inMonth(txs, m)
  return { masuk: total(ofKind(tx, 'pemasukan')), keluar: total(ofKind(tx, 'pengeluaran')), simpan: total(ofKind(tx, 'simpanan')) }
}

function Change({ now, prev, invert, label }) {
  if (!prev) return <p className="mt-1 text-xs text-faint">Belum ada pembanding</p>
  const d = (now - prev) / prev
  const good = invert ? d <= 0 : d >= 0
  return (
    <p className="mt-1 text-xs text-sub">
      <span className={`num font-medium ${Math.abs(d) < 0.005 ? '' : good ? 'text-pos' : 'text-neg'}`}>{d >= 0 ? '↑' : '↓'} {Math.abs(Math.round(d * 100))}%</span> dari {label}
    </p>
  )
}

export default function Dasbor() {
  const { user } = useAuth()
  const data = useData()
  const { transactions, debts, payments, balances, budgets, openTx, openBudget } = data
  const [month, setMonth] = useState(thisMonth())
  const [range, setRange] = useState(90)
  const isCurrent = month === thisMonth()
  const elapsed = isCurrent ? Number(todayISO().slice(8)) : daysInMonth(month)

  const saldo = balances.reduce((s, a) => s + a.balance, 0)
  const nw = useMemo(() => netWorth(data), [data])
  const series = useMemo(() => balanceSeries(data, { days: range, today: todayISO() }), [data, range])
  const delta = series.length ? series[series.length - 1].value - series[0].value : 0
  const cur = useMemo(() => monthTotals(transactions, month), [transactions, month])
  const prev = useMemo(() => monthTotals(transactions, shiftMonth(month, -1)), [transactions, month])
  const prevLabel = monthShort(shiftMonth(month, -1))
  const cats = useMemo(() => byCategory(ofKind(inMonth(transactions, month), 'pengeluaran')), [transactions, month])
  const env = useMemo(() => budgetStatus(data, month, { elapsed, days: daysInMonth(month) }), [data, month, elapsed])
  const rows = useMemo(() => registerRows(data), [data])
  const ai = useMemo(() => analyze(data, month), [data, month])
  const due = useMemo(() => debts.map((d) => ({ d, ...debtInfo(d, payments) }))
    .filter((x) => !x.done && x.d.due_date && daysUntil(x.d.due_date) <= 7)
    .sort((a, b) => a.d.due_date.localeCompare(b.d.due_date)), [debts, payments])
  const attention = ai.risks.filter((r) => !/^Hutang ke/.test(r.title)).slice(0, 3)
  const empty = !transactions.length
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{greeting()}, {user.username}</h1>
          <p className="mt-1 text-sm capitalize text-sub">{today}</p>
        </div>
        <MonthSwitcher value={month} onChange={setMonth} />
      </header>

      <section className="panel">
        <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-6">
          <div>
            <p className="text-sm text-sub">Total saldo</p>
            <p className={`num mt-1 text-4xl font-semibold tracking-tight ${saldo < 0 ? 'text-neg' : ''}`}>{rupiah(saldo)}</p>
            {!empty && (
              <p className="mt-1.5 text-sm text-sub">
                <span className={`num font-medium ${delta >= 0 ? 'text-pos' : 'text-neg'}`}>{delta >= 0 ? '+' : '−'}{rupiah(Math.abs(delta))}</span> dalam {RANGES.find((r) => r.value === range).long} terakhir
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-3">
            {!empty && <Segmented size="sm" value={range} onChange={setRange} options={RANGES} />}
            <Link href="/aset/" className="group text-right">
              <span className="block text-xs text-sub">Kekayaan bersih</span>
              <span className="num block text-base font-medium group-hover:underline">{rupiah(nw.total)}</span>
            </Link>
          </div>
        </div>
        <div className="px-6 pb-2 pt-4">
          {empty ? (
            <EmptyState icon={Wallet} title="Mulai dengan transaksi pertama" text="Catat gaji atau pengeluaran hari ini. Grafik saldo akan terisi otomatis." action={<button className="btn-primary" onClick={() => openTx({ kind: 'pemasukan' })}>Catat pemasukan</button>} />
          ) : <BalanceChart data={series} />}
        </div>
        <div className="grid grid-cols-1 divide-y divide-line border-t border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            ['Pemasukan', cur.masuk, prev.masuk, false, '/pemasukan/'],
            ['Pengeluaran', cur.keluar, prev.keluar, true, '/pengeluaran/'],
            ['Disimpan', cur.simpan, prev.simpan, false, '/simpanan/'],
          ].map(([k, v, p, inv, href]) => (
            <Link key={k} href={href} className="group px-6 py-4 transition-colors hover:bg-subtle">
              <p className="flex items-center justify-between text-sm text-sub">{k} <span className="capitalize text-faint">{monthShort(month)}</span></p>
              <p className="num mt-1 text-xl font-semibold tracking-tight">{rupiah(v)}</p>
              <Change now={v} prev={p} invert={inv} label={prevLabel} />
            </Link>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-md font-semibold tracking-tight">Transaksi terbaru</h2>
            <Link href="/input/" className="flex items-center gap-1 text-sm font-medium text-sub hover:text-ink">Lihat semua <ArrowRight size={14} /></Link>
          </div>
          <div className="border-t border-line">
            <Register rows={rows} limit={8} dense empty="Belum ada transaksi. Tekan N atau tombol Catat untuk mulai." />
          </div>
        </section>
        {cats.length > 0 && (
          <section className="panel p-5">
            <SectionTitle action={<Link href="/pengeluaran/" className="text-sm font-medium text-sub hover:text-ink">Rincian</Link>}>Pengeluaran per kategori</SectionTitle>
            <CategoryBars rows={cats} kind="pengeluaran" limit={6} />
          </section>
        )}
        </div>

        <div className="space-y-6">
          {(due.length > 0 || attention.length > 0) && (
            <section className="panel p-5">
              <SectionTitle action={<Link href="/analisis/" className="text-sm font-medium text-sub hover:text-ink">Analisis</Link>}>Perlu perhatian</SectionTitle>
              <ul className="-my-1 divide-y divide-line">
                {due.map(({ d, remaining }) => {
                  const n = daysUntil(d.due_date)
                  return (
                    <li key={d.id}>
                      <Link href="/hutang-piutang/" className="flex gap-3 py-3">
                        <CalendarClock size={16} className={`mt-[3px] shrink-0 ${n < 0 ? 'text-neg' : 'text-warn'}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-base font-medium">{d.kind === 'hutang' ? `Bayar ${d.person}` : `Tagih ${d.person}`}</span>
                          <span className="block text-sm text-sub"><span className="num">{rupiah(remaining)}</span> · {n < 0 ? `lewat ${-n} hari` : n === 0 ? 'hari ini' : `${dateShort(d.due_date)}`}</span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
                {attention.map((it, i) => <Insight key={i} item={it} compact />)}
              </ul>
            </section>
          )}

          <section className="panel p-5">
            <SectionTitle action={<button onClick={openBudget} className="text-sm font-medium text-sub hover:text-ink">{budgets.length ? 'Ubah' : 'Atur'}</button>}>Anggaran</SectionTitle>
            {env.length ? <BudgetList items={env} isCurrent={isCurrent} limit={4} /> : (
              <p className="text-sm text-sub">Tetapkan batas belanja bulanan per kategori. Kamu akan diberi tahu sisa jatah per hari dan saat belanja terlalu cepat.
                <button onClick={openBudget} className="btn-secondary mt-3 w-full">Atur anggaran</button>
              </p>
            )}
          </section>

        </div>
      </div>
      <ResetData />
    </div>
  )
}
