'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowDownLeft, ArrowUpRight, PiggyBank, ArrowRightLeft, ChevronRight, CalendarClock, BrainCircuit, Mail } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { useData } from '@/components/DataProvider'
import { MonthSwitcher, SectionTitle } from '@/components/ui'
import Register from '@/components/Register'
import Insight, { LEVEL } from '@/components/Insight'
import { SpendCalendar, BudgetEnvelopes, Streak, FlowBar } from '@/components/Widgets'
import { ACCOUNT_ICON } from '@/components/AccountPicker'
import { analyze } from '@/lib/insights'
import { rupiah, thisMonth, greeting, daysUntil, dateShort, todayISO, daysInMonth, monthLabel } from '@/lib/format'
import { total, ofKind, inMonth, debtInfo, registerRows, budgetStatus, recordStreak, dailySpend } from '@/lib/stats'

export default function Dasbor() {
  const { user } = useAuth()
  const data = useData()
  const { transactions, debts, payments, balances, budgets, openTx, openBudget } = data
  const [month, setMonth] = useState(thisMonth())
  const isCurrent = month === thisMonth()
  const elapsed = isCurrent ? Number(todayISO().slice(8)) : daysInMonth(month)

  const m = useMemo(() => {
    const tx = inMonth(transactions, month)
    const masuk = total(ofKind(tx, 'pemasukan')), keluar = total(ofKind(tx, 'pengeluaran')), simpan = total(ofKind(tx, 'simpanan'))
    return { masuk, keluar, simpan, sisa: masuk - keluar - simpan }
  }, [transactions, month])
  const saldo = balances.reduce((s, a) => s + a.balance, 0)
  const ai = useMemo(() => analyze(data, month), [data, month])
  const highlights = [...ai.risks, ...ai.findings].slice(0, 3)
  const env = useMemo(() => budgetStatus(data, month, { elapsed, days: daysInMonth(month) }), [data, month, elapsed])
  const streak = useMemo(() => recordStreak(transactions, todayISO()), [transactions])
  const daily = useMemo(() => dailySpend(transactions, month), [transactions, month])
  const rows = useMemo(() => registerRows(data), [data])
  const due = useMemo(() => debts.map((d) => ({ d, ...debtInfo(d, payments) }))
    .filter((x) => !x.done && x.d.due_date && daysUntil(x.d.due_date) <= 7)
    .sort((a, b) => a.d.due_date.localeCompare(b.d.due_date)), [debts, payments])
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-4">
        <div>
          <p className="eyebrow">{today}</p>
          <h1 className="mt-1 text-3xl font-semibold sm:text-[2.1rem]">{greeting()}, {user.username}.</h1>
        </div>
        <MonthSwitcher value={month} onChange={setMonth} />
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
        {/* Neraca: saldo + ringkasan bulan dalam format buku kas */}
        <section className="card p-5 sm:p-6">
          <p className="eyebrow">Saldo semua dompet</p>
          <p className={`num mt-1 text-[2.4rem] font-semibold leading-none tracking-tight sm:text-5xl ${saldo < 0 ? 'text-keluar-text' : ''}`}>{rupiah(saldo)}</p>
          <div className="no-scrollbar -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 lg:hidden">
            {balances.map((a) => {
              const Icon = ACCOUNT_ICON[a.type]
              return <Link key={a.id} href={`/dompet/?id=${a.id}`} className="flex shrink-0 items-center gap-2 rounded-md border border-rule px-2.5 py-1.5 text-xs"><Icon size={14} className="text-muted" /><span className="font-semibold">{a.name}</span><span className="num text-muted">{rupiah(a.balance)}</span></Link>
            })}
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <dl className="text-sm">
              <p className="eyebrow mb-2 capitalize">{monthLabel(month)}</p>
              {[
                ['Pemasukan', m.masuk, '+', 'text-masuk-text', '/pemasukan/'],
                ['Pengeluaran', m.keluar, '−', 'text-keluar-text', '/pengeluaran/'],
                ['Disimpan', m.simpan, '−', 'text-simpan-text', '/simpanan/'],
              ].map(([k, v, sg, c, href]) => (
                <Link key={k} href={href} className="group flex items-baseline justify-between border-b border-dotted border-rule py-1.5">
                  <dt className="group-hover:underline">{k}</dt>
                  <dd className={`num ${c}`}>{sg} {rupiah(v)}</dd>
                </Link>
              ))}
              <div className="flex items-baseline justify-between border-t border-ink pt-2">
                <dt className="font-semibold">{m.sisa >= 0 ? 'Sisa' : 'Kurang'}</dt>
                <dd className={`num total-rule font-semibold ${m.sisa < 0 ? 'text-keluar-text' : ''}`}>{rupiah(m.sisa)}</dd>
              </div>
            </dl>
            <div>
              <p className="eyebrow mb-2">Ke mana uang masuk pergi</p>
              <FlowBar {...m} />
            </div>
          </div>
        </section>

        <div className="grid gap-5">
          <section className="card p-5">
            <p className="eyebrow mb-3">Rantai mencatat</p>
            <Streak data={streak} />
          </section>
          <section className="card p-2">
            <div className="grid grid-cols-4 divide-x divide-line">
              {[
                ['Masuk', ArrowDownLeft, () => openTx({ kind: 'pemasukan' }), 'text-masuk-text'],
                ['Keluar', ArrowUpRight, () => openTx({ kind: 'pengeluaran' }), 'text-keluar-text'],
                ['Simpan', PiggyBank, () => openTx({ kind: 'simpanan' }), 'text-simpan-text'],
                ['Pindah', ArrowRightLeft, () => openTx({ transfer: null, kind: 'transfer' }), 'text-ink'],
              ].map(([k, Icon, fn, c]) => (
                <button key={k} onClick={fn} className="flex flex-col items-center gap-1 rounded py-2.5 text-xs font-semibold hover:bg-canvas">
                  <Icon size={20} className={c} /> {k}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      {(due.length > 0 || highlights.length > 0) && (
        <div className="grid items-start gap-5 lg:grid-cols-[1.45fr_1fr]">
          {highlights.length > 0 && (
            <section className="card p-5">
              <SectionTitle action={<Link href="/analisis/" className="flex items-center text-sm font-semibold text-brand">Selengkapnya <ChevronRight size={16} /></Link>}>
                <span className="flex items-center gap-2"><BrainCircuit size={18} /> Kata Data Analyst
                  {ai.score && (() => { const L = LEVEL[ai.score.level]; return <span className={`whitespace-nowrap rounded-sm px-1.5 py-0.5 font-sans text-xs font-bold ${L.cls}`}>Skor {ai.score.value}</span> })()}
                </span>
              </SectionTitle>
              <ul className="divide-y divide-line">{highlights.map((it, i) => <Insight key={i} item={it} compact />)}</ul>
            </section>
          )}
          {due.length > 0 && (
            <section className="card border-utang/50 p-5">
              <SectionTitle><span className="flex items-center gap-2"><CalendarClock size={18} /> Jatuh tempo</span></SectionTitle>
              <ul className="divide-y divide-line">
                {due.map(({ d, remaining }) => {
                  const n = daysUntil(d.due_date)
                  return (
                    <li key={d.id}>
                      <Link href="/hutang-piutang/" className="flex items-center gap-3 py-2.5 text-sm">
                        <Mail size={16} className="shrink-0 text-muted" />
                        <span className="min-w-0 flex-1"><b>{d.kind === 'hutang' ? 'Bayar ke' : 'Tagih'} {d.person}</b><span className="block text-xs text-muted">{dateShort(d.due_date)} · <span className={n < 0 ? 'font-semibold text-keluar-text' : 'text-utang-text'}>{n < 0 ? `lewat ${-n} hari` : n === 0 ? 'hari ini' : `${n} hari lagi`}</span></span></span>
                        <span className="num font-semibold">{rupiah(remaining)}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <SectionTitle action={<Link href="/pengeluaran/" className="text-sm font-semibold text-brand">Rincian</Link>}>Kalender pengeluaran</SectionTitle>
          <SpendCalendar month={month} daily={daily} />
        </section>
        <section className="card p-5">
          <SectionTitle action={<button onClick={openBudget} className="text-sm font-semibold text-brand hover:underline">{budgets.length ? 'Ubah' : 'Atur'}</button>}>Amplop anggaran</SectionTitle>
          {env.length ? <BudgetEnvelopes items={env} isCurrent={isCurrent} limit={5} onEdit={openBudget} /> : (
            <div className="rounded-md border border-dashed border-rule p-5 text-sm">
              <p className="font-display text-base font-semibold">Bagi uangmu ke dalam amplop.</p>
              <p className="mt-1 text-muted">Tentukan batas belanja per kategori — makan, jajan, transport. MoneyOut akan memberi tahu sisa jatah per hari dan kapan kamu belanja terlalu cepat.</p>
              <button onClick={openBudget} className="btn-primary mt-4">Atur anggaran</button>
            </div>
          )}
        </section>
      </div>

      <section className="card overflow-hidden pt-4">
        <SectionTitle className="px-4" action={<Link href="/input/" className="flex items-center text-sm font-semibold text-brand">Semua catatan <ChevronRight size={16} /></Link>}>Catatan terakhir</SectionTitle>
        <Register rows={rows} limit={8} empty="Buku masih kosong. Catat gaji atau pengeluaran pertamamu lewat tombol Catat." />
      </section>
    </div>
  )
}
