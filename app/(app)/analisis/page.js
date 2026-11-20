'use client'
import { useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { MonthSwitcher, EmptyState, PageHeader, Segmented, SectionTitle, Progress } from '@/components/ui'
import Insight, { LEVEL } from '@/components/Insight'
import { analyze } from '@/lib/insights'
import { thisMonth, monthLabel, rupiah } from '@/lib/format'

const GROUPS = [
  { key: 'risks', label: 'Risiko', hint: 'Yang bisa jadi masalah' },
  { key: 'findings', label: 'Temuan', hint: 'Apa yang terjadi' },
  { key: 'opportunities', label: 'Peluang', hint: 'Yang bisa kamu lakukan' },
]

export default function DataAnalyst() {
  const data = useData()
  const [month, setMonth] = useState(thisMonth())
  const [filter, setFilter] = useState('all')
  const a = useMemo(() => analyze(data, month), [data, month])
  const groups = GROUPS.filter((g) => filter === 'all' || filter === g.key)

  return (
    <div>
      <PageHeader title="Data Analyst" desc="Membaca catatanmu lalu menjelaskan apa yang terjadi, risikonya, dan langkah yang bisa diambil."
        action={<MonthSwitcher value={month} onChange={setMonth} />} />

      {!a.hasData ? (
        <div className="panel"><EmptyState icon={Sparkles} title={`Belum ada data di ${monthLabel(month)}`} text="Catat pemasukan dan pengeluaran dulu. Analisis muncul otomatis." action={<button className="btn-primary" onClick={() => data.openTx({ kind: 'pemasukan' })}>Catat pemasukan</button>} /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="panel">
              <div className="p-6">
                <SectionTitle>Ringkasan <span className="font-normal capitalize text-sub">{monthLabel(month)}</span></SectionTitle>
                <div className="space-y-2.5 text-md leading-relaxed text-[#2B2B29]">
                  {a.summary.length ? a.summary.map((s, i) => <p key={i}>{s}</p>) : <p>Belum ada transaksi bulan ini, tapi ada hutang atau piutang aktif yang perlu dipantau.</p>}
                </div>
              </div>
              <dl className="grid grid-cols-2 divide-line border-t border-line sm:grid-cols-4 sm:divide-x [&>div]:px-6 [&>div]:py-4">
                {[['Masuk', a.stats.masuk, 'text-pos'], ['Keluar', a.stats.keluar, ''], ['Disimpan', a.stats.simpan, ''], ['Sisa', a.stats.sisa, a.stats.sisa < 0 ? 'text-neg' : '']].map(([k, v, c]) => (
                  <div key={k}><dt className="text-sm text-sub">{k}</dt><dd className={`num mt-0.5 text-lg font-semibold tracking-tight ${c}`}>{rupiah(v)}</dd></div>
                ))}
              </dl>
            </section>
            <ScoreCard score={a.score} />
          </div>

          <section className="panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
              <h2 className="text-md font-semibold tracking-tight">Hasil analisis</h2>
              <Segmented size="sm" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'Semua', count: a.risks.length + a.findings.length + a.opportunities.length }, ...GROUPS.map((g) => ({ value: g.key, label: g.label, count: a[g.key].length }))]} />
            </div>
            {groups.map((g) => (
              <div key={g.key}>
                {filter === 'all' && <p className="border-b border-line bg-subtle px-5 py-2 text-xs font-medium text-sub">{g.label} <span className="font-normal text-faint">· {g.hint}</span></p>}
                {a[g.key].length
                  ? <ul className="divide-y divide-line">{a[g.key].map((it, i) => <Insight key={i} item={it} />)}</ul>
                  : <p className="px-5 py-4 text-sm text-faint">{g.key === 'risks' ? 'Tidak ada risiko berarti bulan ini.' : 'Belum ada yang menonjol.'}</p>}
              </div>
            ))}
          </section>

          {a.budget && <BudgetCard budget={a.budget} />}
          <p className="text-xs text-faint">Dihitung otomatis di perangkatmu dari catatanmu sendiri. Gunakan sebagai bahan pertimbangan, bukan nasihat keuangan profesional.</p>
        </div>
      )}
    </div>
  )
}

function ScoreCard({ score }) {
  if (!score) return (
    <section className="panel p-6">
      <SectionTitle>Skor kesehatan</SectionTitle>
      <p className="text-sm text-sub">Catat pemasukan bulan ini agar skor bisa dihitung.</p>
    </section>
  )
  const L = LEVEL[score.level]
  return (
    <section className="panel p-6">
      <SectionTitle>Skor kesehatan</SectionTitle>
      <div className="flex items-baseline gap-2">
        <span className="num text-4xl font-semibold tracking-tight">{score.value}</span>
        <span className="text-sm text-faint">/ 100</span>
        <span className={`ml-auto flex items-center gap-1 text-sm font-medium ${L.text}`}><L.icon size={15} /> {score.word}</span>
      </div>
      <Progress value={score.value / 100} color={L.dot} className="mt-3" />
      <ul className="mt-6 space-y-4">
        {score.parts.map((p) => (
          <li key={p.label}>
            <div className="flex justify-between text-sm"><span>{p.label}</span><span className="num text-sub">{p.value}/{p.max}</span></div>
            <Progress value={p.value / p.max} className="mt-1.5" />
            <p className="mt-1 text-xs text-faint">{p.note}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function BudgetCard({ budget }) {
  return (
    <section className="panel p-6">
      <SectionTitle>Aturan 50/30/20</SectionTitle>
      <p className="-mt-1 mb-5 text-sm text-sub">Patokan umum: maksimal 50% pemasukan untuk kebutuhan, 30% untuk keinginan, minimal 20% disimpan.</p>
      <div className="grid gap-6 md:grid-cols-3">
        {budget.rows.map((r) => {
          const ok = r.better === 'lower' ? r.value <= r.ideal : r.value >= r.ideal
          const scale = Math.max(1, r.value, r.ideal * 1.6)
          return (
            <div key={r.label}>
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium">{r.label}</p>
                <p className="num text-lg font-semibold">{Math.round(r.value * 100)}%</p>
              </div>
              <div className="relative mt-2 h-1.5 rounded-full bg-well">
                <div className="grow-x h-full rounded-full" style={{ width: `${Math.min(100, (r.value / scale) * 100)}%`, background: ok ? '#111' : '#C78100' }} />
                <span className="absolute -top-1 h-3.5 w-0.5 rounded bg-ink/50" style={{ left: `${(r.ideal / scale) * 100}%` }} title={`Patokan ${r.ideal * 100}%`} />
              </div>
              <p className="mt-2 text-xs text-sub">{r.hint}</p>
              <p className={`mt-0.5 text-xs font-medium ${ok ? 'text-pos' : 'text-warn'}`}>{ok ? 'Sesuai patokan' : r.better === 'lower' ? `${Math.round((r.value - r.ideal) * 100)} poin di atas ${r.ideal * 100}%` : `${Math.round((r.ideal - r.value) * 100)} poin di bawah ${r.ideal * 100}%`}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
