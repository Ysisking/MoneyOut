'use client'
import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, ChartColumn } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { PageHeader, Segmented, EmptyState } from '@/components/ui'
import CategoryBars from '@/components/CategoryBars'
import { KINDS, KIND_ORDER, TONE } from '@/lib/categories'
import { rupiah, rupiahShort, monthShort, monthLabel } from '@/lib/format'
import { total, ofKind, inYear, byCategory } from '@/lib/stats'

const SERIES = KIND_ORDER.map((k) => ({ kind: k, label: KINDS[k].label, color: TONE[KINDS[k].tone].fill }))

export default function Laporan() {
  const { transactions } = useData()
  const [year, setYear] = useState(new Date().getFullYear())
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
  const ticks = [max, max / 2, 0]
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
      <PageHeader title="Laporan" desc="Arus uang per bulan dan kategori dalam setahun."
        action={<div className="flex gap-2">
          <div className="inline-flex items-center gap-1 rounded-xl border border-line bg-white p-1">
            <button className="rounded-lg p-1.5 hover:bg-canvas disabled:opacity-30" disabled={year <= minYear} onClick={() => setYear(year - 1)} aria-label="Tahun sebelumnya"><ChevronLeft size={18} /></button>
            <span className="w-14 text-center text-sm font-semibold">{year}</span>
            <button className="rounded-lg p-1.5 hover:bg-canvas disabled:opacity-30" disabled={year >= new Date().getFullYear()} onClick={() => setYear(year + 1)} aria-label="Tahun berikutnya"><ChevronRight size={18} /></button>
          </div>
          <button className="btn-ghost" onClick={exportCsv} disabled={!yearTx.length}><Download size={16} /> CSV</button>
        </div>} />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KIND_ORDER.map((k) => (
          <div key={k} className="card p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-muted"><span className={`h-2.5 w-2.5 rounded-sm ${TONE[KINDS[k].tone].dot}`} />{KINDS[k].label} {year}</p>
            <p className="tnum mt-1 text-lg font-extrabold">{rupiah(sums[k])}</p>
          </div>
        ))}
        <div className="card p-4">
          <p className="text-xs font-medium text-muted">Sisa {year}</p>
          <p className="tnum mt-1 text-lg font-extrabold">{rupiah(sums.pemasukan - sums.pengeluaran - sums.simpanan)}</p>
        </div>
      </div>

      {!yearTx.length ? (
        <div className="card"><EmptyState icon={ChartColumn} title={`Belum ada catatan di ${year}`} text="Laporan akan terisi setelah kamu mencatat transaksi." /></div>
      ) : (
        <>
          <section className="card mb-5 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold">Arus uang per bulan</h2>
              <ul className="flex flex-wrap gap-4 text-xs text-muted">
                {SERIES.map((s) => <li key={s.kind} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />{s.label}</li>)}
              </ul>
            </div>
            <div className="relative flex gap-2">
              <div className="flex h-52 w-12 shrink-0 flex-col justify-between text-right text-[11px] text-muted tnum">
                {ticks.map((t, i) => <span key={i} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">{rupiahShort(t)}</span>)}
              </div>
              <div className="relative min-w-0 flex-1 overflow-x-auto">
                <div className="relative h-52 min-w-[36rem]">
                  {ticks.map((_, i) => <div key={i} className="absolute inset-x-0 border-t border-line" style={{ top: `${(i / 2) * 100}%` }} />)}
                  <div className="absolute inset-0 grid grid-cols-12">
                    {months.map((m, i) => (
                      <div key={m.key} className={`relative flex items-end justify-center gap-[2px] px-1 ${hover === i ? 'bg-canvas' : ''}`}
                        onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0}
                        aria-label={`${monthLabel(m.key)}: ${SERIES.map((s) => `${s.label} ${rupiah(m[s.kind])}`).join(', ')}`}>
                        {SERIES.map((s) => (
                          <div key={s.kind} className="w-full max-w-[12px] rounded-t" style={{ height: `${(m[s.kind] / max) * 100}%`, background: s.color, minHeight: m[s.kind] ? 2 : 0 }} />
                        ))}
                        {hover === i && (
                          <div className={`pointer-events-none absolute bottom-full z-10 mb-2 w-48 rounded-xl bg-ink p-3 text-xs text-white shadow-xl ${i > 8 ? 'right-0' : i < 3 ? 'left-0' : 'left-1/2 -translate-x-1/2'}`}>
                            <p className="mb-1.5 font-bold capitalize">{monthLabel(m.key)}</p>
                            {SERIES.map((s) => <p key={s.kind} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: s.color }} /><span className="flex-1 text-white/70">{s.label}</span><span className="tnum">{rupiah(m[s.kind])}</span></p>)}
                            <p className="mt-1.5 flex border-t border-white/20 pt-1.5"><span className="flex-1 text-white/70">Sisa</span><span className="tnum font-semibold">{rupiah(m.sisa)}</span></p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid min-w-[36rem] grid-cols-12 pt-1.5 text-center text-[11px] text-muted">
                  {months.map((m) => <span key={m.key}>{monthShort(m.key)}</span>)}
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
            <section className="card overflow-x-auto">
              <h2 className="p-5 pb-3 font-bold">Tabel bulanan</h2>
              <table className="w-full min-w-[32rem] text-sm">
                <thead><tr className="border-y border-line bg-canvas/70 text-left text-xs text-muted">
                  <th className="px-5 py-2 font-semibold">Bulan</th>
                  {SERIES.map((s) => <th key={s.kind} className="px-3 py-2 text-right font-semibold">{s.label}</th>)}
                  <th className="px-5 py-2 text-right font-semibold">Sisa</th>
                </tr></thead>
                <tbody className="tnum divide-y divide-line">
                  {months.map((m) => (
                    <tr key={m.key} className={m.pemasukan + m.pengeluaran + m.simpanan ? '' : 'text-muted/60'}>
                      <td className="px-5 py-2 capitalize">{monthShort(m.key)}</td>
                      {SERIES.map((s) => <td key={s.kind} className="px-3 py-2 text-right">{rupiahShort(m[s.kind])}</td>)}
                      <td className={`px-5 py-2 text-right font-semibold ${m.sisa < 0 ? 'text-red-700' : ''}`}>{rupiahShort(m.sisa)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className="card p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-bold">Per kategori</h2>
                <Segmented value={catKind} onChange={setCatKind} options={KIND_ORDER.map((k) => ({ value: k, label: KINDS[k].short }))} />
              </div>
              {cats.length ? <CategoryBars rows={cats} kind={catKind} tone={KINDS[catKind].tone} limit={8} /> : <p className="py-8 text-center text-sm text-muted">Belum ada data.</p>}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
