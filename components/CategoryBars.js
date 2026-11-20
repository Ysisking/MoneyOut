import { iconFor, TONE } from '@/lib/categories'
import { rupiah } from '@/lib/format'

// Batang horizontal satu warna: porsi tiap kategori terhadap total.
export default function CategoryBars({ rows, kind, tone, limit = 6 }) {
  const t = TONE[tone]
  const sum = rows.reduce((s, r) => s + r.amount, 0)
  const max = rows[0]?.amount || 1
  const shown = rows.slice(0, limit)
  const rest = rows.slice(limit)
  const list = rest.length ? [...shown, { name: `${rest.length} kategori lain`, amount: rest.reduce((s, r) => s + r.amount, 0), other: true }] : shown
  return (
    <ul className="space-y-3">
      {list.map((r) => {
        const Icon = iconFor(kind, r.name)
        const pct = sum ? Math.round((r.amount / sum) * 100) : 0
        return (
          <li key={r.name} title={`${r.name}: ${rupiah(r.amount)} (${pct}%)`}>
            <div className="mb-1 flex items-baseline gap-2 text-sm">
              <Icon size={15} className="shrink-0 self-center text-muted" />
              <span className="min-w-0 flex-1 truncate">{r.name}</span>
              <span className="num">{rupiah(r.amount)}</span>
              <span className="num w-9 text-right text-xs text-muted">{pct}%</span>
            </div>
            <div className="h-2 rounded-sm bg-canvas ring-1 ring-inset ring-line">
              <div className="grow-x h-2 rounded-sm" style={{ width: `${Math.max(2, (r.amount / max) * 100)}%`, background: r.other ? '#B9AE9A' : t.fill }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
