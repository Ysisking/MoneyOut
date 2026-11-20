'use client'
import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, BarChart3 } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { PageHeader, Segmented, EmptyState, SectionTitle } from '@/components/ui'
import CategoryBars from '@/components/CategoryBars'
import { KINDS, KIND_ORDER } from '@/lib/categories'
import { rupiah, rupiahShort, monthShort, monthLabel } from '@/lib/format'
import { total, ofKind, inYear, byCategory } from '@/lib/stats'

const SERIES = [
  { kind: 'pemasukan', label: 'Pemasukan', color: '#1baf7a' },
  { kind: 'pengeluaran', label: 'Pengeluaran', color: '#eb6834' },
  { kind: 'simpanan', label: 'Simpanan', color: '#2a78d6' },
]

export default function Laporan() {
  const { transactions } = useData()
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useState(thisYear)
  const [catKind, setCatKind] = useState('pengeluaran')
  const [hover, setHover] = useState(null)

  const yearTx = useMemo(() => inYear(transactions, year), [transactions, year])
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, '0')}`
    const tx = yearTx.filter((t) => t.date.startsWith(key))
    const v = Object.fromEntries(KIND_ORDER.map((k) => [k, total(ofKind(tx, k))]))
    return { key, ...v, sisa: v.pemasukan - v.pengeluaran - v.simpanan }
  }), [yearTx, year])
  const sums = Object.fromEntries(KIND_ORDER.map((k) => [k, total(ofKind(yearTx, k))]))
  const max = Math.max(1, ...months.flatMap((m) => KIND_ORDER.map((k) => m[k])))
  const cats = useMemo(() => byCategory(ofKind(yearTx, catKind)), [yearTx, catKind])
  const minYear = Math.min(year, ...transactions.map((t) => Number(t.date.slice(0, 4))))

  function exportCsv() {
    const esc = (s) => `"${String(s).replace(/"/g, '""')}"`
    const rows = [['Tanggal', 'Jenis', 'Kategori', 'Nominal', 'Catatan'], ...[...yearTx].sort((a, b) => a.date.localeCompare(b.date)).map((t) => [t.date, KINDS[t.kind].label, t.category, Number(t.amount), t.note])]
    const blob = new Blob(['﻿' + rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = `moneyout-${year}.csv`; a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  return (
    <div>
      <PageHeader title="Laporan" desc="Arus uang per bulan dan per kategori dalam setahun."
        action={<>
          <div className="inline-flex h-9 items-center rounded-lg border border-edge">
            <button className="grid h-full w-8 place-items-center text-sub hover:text-ink disabled:opacity-30" disabled={year <= minYear} onClick={() => setYear(year - 1)} aria-label="Tahun sebelumnya"><ChevronLeft size={16} /></button>
            <span className="num w-12 text-center text-sm font-medium">{year}</span>
            <button className="grid h-full w-8 place-items-center text-sub hover:text-ink disabled:opacity-30" disabled={year >= thisYear} onClick={() => setYear(year + 1)} aria-label="Tahun berikutnya"><ChevronRight size={16} /></button>
          </div>
          <button className="btn-secondary" onClick={exportCsv} disabled={!yearTx.length}><Download size={15} /> Ekspor CSV</button>
        </>} />

      {!yearTx.length ? <div className="panel"><EmptyState icon={BarChart3} title={`Belum ada transaksi di ${year}`} text="Laporan terisi otomatis setelah kamu mencatat." /></div> : (
        <>
          <section className="panel mb-6">
            <dl className="grid grid-cols-2 divide-line border-b border-line sm:grid-cols-4 sm:divide-x [&>div]:px-5 [&>div]:py-4">
              {SERIES.map((s) => (
                <div key={s.kind}><dt className="flex items-center gap-2 text-sm text-sub"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}</dt><dd className="num mt-1 text-xl font-semibold tracking-tight">{rupiah(sums[s.kind])}</dd></div>
              ))}
              <div><dt className="text-sm text-sub">Sisa</dt><dd className="num mt-1 text-xl font-semibold tracking-tight">{rupiah(sums.pemasukan - sums.pengeluaran - sums.simpanan)}</dd></div>
            </dl>
            <div className="p-5">
              <div className="flex gap-3">
                <div className="num flex h-56 w-10 shrink-0 flex-col justify-between pb-6 text-right text-2xs text-faint">
                  {[max, max / 2, 0].map((t, i) => <span key={i}>{rupiahShort(t)}</span>)}
                </div>
                <div className="min-w-0 flex-1 overflow-x-auto">
                  <div className="relative h-56 min-w-[34rem]">
                    {[0, 0.5].map((f) => <div key={f} className="absolute inset-x-0 border-t border-dashed border-line" style={{ top: `${f * (100 - 10.7)}%` }} />)}
                    <div className="absolute inset-x-0 bottom-6 top-0 grid grid-cols-12 border-b border-edge">
                      {months.map((m, i) => (
                        <div key={m.key} tabIndex={0} className={`relative flex items-end justify-center gap-[3px] rounded-t-md px-1.5 outline-none ${hover === i ? 'bg-subtle' : ''}`}
                          onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                          aria-label={`${monthLabel(m.key)}: ${SERIES.map((s) => `${s.label} ${rupiah(m[s.kind])}`).join(', ')}`}>
                          {SERIES.map((s) => <div key={s.kind} className="w-full max-w-[10px] rounded-t-[3px]" style={{ height: `${(m[s.kind] / max) * 100}%`, background: s.color, minHeight: m[s.kind] ? 2 : 0 }} />)}
                          {hover === i && (
                            <div className={`pointer-events-none absolute bottom-full z-10 mb-2 w-52 rounded-lg border border-line bg-canvas p-3 text-xs shadow-pop ${i > 8 ? 'right-0' : i < 3 ? 'left-0' : 'left-1/2 -translate-x-1/2'}`}>
                              <p className="mb-2 font-medium capitalize">{monthLabel(m.key)}</p>
                              {SERIES.map((s) => <p key={s.kind} className="flex items-center gap-2 py-0.5"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} /><span className="flex-1 text-sub">{s.label}</span><span className="num">{rupiah(m[s.kind])}</span></p>)}
                              <p className="mt-1.5 flex border-t border-line pt-1.5"><span className="flex-1 text-sub">Sisa</span><span className="num font-medium">{rupiah(m.sisa)}</span></p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 grid h-6 grid-cols-12 items-end text-center text-2xs capitalize text-faint">{months.map((m) => <span key={m.key}>{monthShort(m.key)}</span>)}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <section className="panel overflow-x-auto">
              <table className="w-full min-w-[30rem] text-sm">
                <thead><tr className="border-b border-line text-left text-xs text-faint">
                  <th className="px-5 py-3 font-medium">Bulan</th>
                  {SERIES.map((s) => <th key={s.kind} className="px-3 py-3 text-right font-medium">{s.label}</th>)}
                  <th className="px-5 py-3 text-right font-medium">Sisa</th>
                </tr></thead>
                <tbody className="num divide-y divide-line">
                  {months.map((m) => {
                    const emptyRow = !(m.pemasukan + m.pengeluaran + m.simpanan)
                    return (
                      <tr key={m.key} className={emptyRow ? 'text-faint' : 'hover:bg-subtle'}>
                        <td className="px-5 py-2.5 capitalize">{monthShort(m.key)}</td>
                        {SERIES.map((s) => <td key={s.kind} className="px-3 py-2.5 text-right">{emptyRow ? '—' : rupiahShort(m[s.kind])}</td>)}
                        <td className={`px-5 py-2.5 text-right font-medium ${m.sisa < 0 ? 'text-neg' : ''}`}>{emptyRow ? '—' : rupiahShort(m.sisa)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </section>
            <section className="panel p-5">
              <SectionTitle>Per kategori</SectionTitle>
              <Segmented size="sm" className="mb-5 flex w-full" value={catKind} onChange={setCatKind} options={KIND_ORDER.map((k) => ({ value: k, label: KINDS[k].label }))} />
              {cats.length ? <CategoryBars rows={cats} kind={catKind} limit={8} color={SERIES.find((s) => s.kind === catKind).color} /> : <p className="py-8 text-center text-sm text-sub">Belum ada data.</p>}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
