'use client'
import { useMemo, useState } from 'react'
import { BrainCircuit, SearchCheck, ShieldAlert, Lightbulb, Gauge, Target } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { MonthSwitcher, EmptyState, PageHeader } from '@/components/ui'
import Insight, { LEVEL } from '@/components/Insight'
import { analyze } from '@/lib/insights'
import { thisMonth, monthLabel, rupiah } from '@/lib/format'

export default function DataAnalyst() {
  const data = useData()
  const [month, setMonth] = useState(thisMonth())
  const a = useMemo(() => analyze(data, month), [data, month])

  return (
    <div>
      <PageHeader title="Data Analyst" desc="Membaca catatanmu, lalu menjelaskan apa yang terjadi, risikonya, dan peluang yang bisa diambil."
        action={<MonthSwitcher value={month} onChange={setMonth} />} />

      {!a.hasData ? (
        <div className="card"><EmptyState icon={BrainCircuit} title={`Belum ada data di ${monthLabel(month)}`} text="Catat pemasukan dan pengeluaran dulu. Analisis akan muncul otomatis." action={<button className="btn-primary" onClick={() => data.openTx({ kind: 'pemasukan' })}>Catat pemasukan</button>} /></div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
            <section className="relative flex flex-col overflow-hidden rounded-2xl bg-brand-dark p-5 text-white sm:p-6">
              <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-brand-light/30 blur-3xl" />
              <div className="relative flex flex-1 flex-col">
                <p className="flex items-center gap-2 text-sm font-semibold text-white/75"><BrainCircuit size={17} /> Kesimpulan {monthLabel(month)}</p>
                <div className="mt-3 space-y-2 text-[15px] leading-relaxed">
                  {a.summary.length ? a.summary.map((s, i) => <p key={i}>{s}</p>) : <p>Belum ada transaksi bulan ini, tapi ada hutang/piutang aktif yang perlu dipantau.</p>}
                </div>
                {a.risks[0] && (
                  <p className="mt-4 rounded-xl bg-white/10 px-3.5 py-2.5 text-sm"><b>Yang paling perlu diperhatikan:</b> {a.risks[0].title}.</p>
                )}
                <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/15 pt-4 sm:grid-cols-4 [&:not(:first-child)]:mt-6">
                  {[['Masuk', a.stats.masuk], ['Keluar', a.stats.keluar], ['Disimpan', a.stats.simpan], ['Sisa', a.stats.sisa]].map(([k, v]) => (
                    <div key={k}><dt className="text-xs text-white/60">{k}</dt><dd className="tnum font-bold">{rupiah(v)}</dd></div>
                  ))}
                </dl>
              </div>
            </section>
            <ScoreCard score={a.score} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Column icon={SearchCheck} title="Temuan" sub="Apa yang terjadi" items={a.findings} empty="Belum ada pola menonjol. Terus catat agar temuan makin tajam." />
            <Column icon={ShieldAlert} title="Risiko" sub="Yang bisa jadi masalah" items={a.risks} empty="Tidak ada risiko berarti. Arus uangmu terlihat aman." />
            <Column icon={Lightbulb} title="Peluang" sub="Yang bisa kamu lakukan" items={a.opportunities} empty="Belum ada saran tambahan untuk bulan ini." />
          </div>

          {a.budget && <BudgetCard budget={a.budget} />}

          <p className="text-xs text-muted">Analisis dibuat otomatis dari catatanmu sendiri dan dihitung di perangkatmu. Gunakan sebagai bahan pertimbangan, bukan nasihat keuangan profesional.</p>
        </div>
      )}
    </div>
  )
}

function Column({ icon: Icon, title, sub, items, empty }) {
  return (
    <section className="card p-5">
      <h2 className="flex items-center gap-2 font-bold"><Icon size={18} className="text-brand" /> {title} <span className="ml-auto rounded-full bg-canvas px-2 py-0.5 text-xs font-semibold text-muted">{items.length}</span></h2>
      <p className="mb-3 text-xs text-muted">{sub}</p>
      {items.length ? <ul className="space-y-2.5">{items.map((it, i) => <Insight key={i} item={it} />)}</ul> : <p className="rounded-xl bg-canvas p-4 text-sm text-muted">{empty}</p>}
    </section>
  )
}

function ScoreCard({ score }) {
  if (!score) return (
    <section className="card flex flex-col justify-center p-5 text-center">
      <Gauge className="mx-auto text-muted" />
      <p className="mt-2 font-bold">Skor kesehatan</p>
      <p className="mt-1 text-sm text-muted">Catat pemasukan bulan ini agar skor bisa dihitung.</p>
    </section>
  )
  const L = LEVEL[score.level]
  const r = 42, c = 2 * Math.PI * r
  return (
    <section className="card p-5">
      <h2 className="flex items-center gap-2 font-bold"><Gauge size={18} className="text-brand" /> Skor kesehatan keuangan</h2>
      <div className="mt-3 flex items-center gap-4">
        <svg viewBox="0 0 100 100" className="h-24 w-24 shrink-0 -rotate-90" role="img" aria-label={`Skor ${score.value} dari 100, ${score.word}`}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="#E3E9E6" strokeWidth="9" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={L.bar} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(score.value / 100) * c} ${c}`} />
          <text x="50" y="50" transform="rotate(90 50 50)" textAnchor="middle" dominantBaseline="central" className="fill-ink text-[26px] font-extrabold">{score.value}</text>
        </svg>
        <div>
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold ${L.cls}`}><L.icon size={15} /> {score.word}</span>
          <p className="mt-1.5 text-xs text-muted">dari 100. Dihitung dari 4 aspek di bawah.</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2.5">
        {score.parts.map((p) => (
          <li key={p.label} className="text-sm">
            <div className="flex justify-between gap-2"><span className="font-medium">{p.label}</span><span className="tnum text-muted">{p.value}/{p.max}</span></div>
            <div className="mt-1 h-1.5 rounded-full bg-canvas"><div className="h-1.5 rounded-full bg-brand" style={{ width: `${(p.value / p.max) * 100}%` }} /></div>
            <p className="mt-0.5 text-xs text-muted">{p.note}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function BudgetCard({ budget }) {
  return (
    <section className="card p-5">
      <h2 className="flex items-center gap-2 font-bold"><Target size={18} className="text-brand" /> Pembagian uang vs aturan 50/30/20</h2>
      <p className="mb-4 text-xs text-muted">Patokan umum: maksimal 50% pemasukan untuk kebutuhan, 30% untuk keinginan, dan minimal 20% disimpan. Garis tegak = batas ideal.</p>
      <div className="grid gap-5 md:grid-cols-3">
        {budget.rows.map((r) => {
          const ok = r.better === 'lower' ? r.value <= r.ideal : r.value >= r.ideal
          const L = LEVEL[ok ? 'baik' : 'perhatian']
          const scale = Math.max(1, r.value, r.ideal * 1.6)
          return (
            <div key={r.label}>
              <div className="flex items-baseline justify-between">
                <p className="font-semibold">{r.label}</p>
                <p className="tnum text-xl font-extrabold">{Math.round(r.value * 100)}%</p>
              </div>
              <p className="text-xs text-muted">{r.hint}</p>
              <div className="relative mt-2 h-2.5 rounded-full bg-canvas">
                <div className="h-2.5 rounded-full" style={{ width: `${Math.min(100, (r.value / scale) * 100)}%`, background: L.bar }} />
                <div className="absolute -top-1 h-[18px] w-0.5 rounded bg-ink" style={{ left: `${(r.ideal / scale) * 100}%` }} title={`Ideal ${r.ideal * 100}%`} />
              </div>
              <p className={`mt-1.5 inline-flex items-center gap-1 text-xs font-semibold ${ok ? 'text-masuk-text' : 'text-utang-text'}`}><L.icon size={13} /> {ok ? 'Sesuai patokan' : r.better === 'lower' ? `Lewat ${Math.round((r.value - r.ideal) * 100)} poin dari ${r.ideal * 100}%` : `Kurang ${Math.round((r.ideal - r.value) * 100)} poin dari ${r.ideal * 100}%`}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
