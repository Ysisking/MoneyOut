import { iconFor } from '@/lib/categories'
import { rupiah } from '@/lib/format'

// Porsi per kategori: batang tipis netral, persentase di kanan.
export default function CategoryBars({ rows, kind, limit = 6, color = '#111111' }) {
  const sum = rows.reduce((s, r) => s + r.amount, 0)
  const max = rows[0]?.amount || 1
  const shown = rows.slice(0, limit)
  const rest = rows.slice(limit)
  const list = rest.length ? [...shown, { name: `Lainnya (${rest.length})`, amount: rest.reduce((s, r) => s + r.amount, 0), other: true }] : shown
  return (
    <ul className="space-y-3.5">
      {list.map((r) => {
        const Icon = iconFor(kind, r.name)
        const pct = sum ? Math.round((r.amount / sum) * 100) : 0
        return (
          <li key={r.name} title={`${r.name}: ${rupiah(r.amount)} (${pct}%)`}>
            <div className="flex items-center gap-2 text-sm">
              <Icon size={15} strokeWidth={1.8} className="shrink-0 text-sub" />
              <span className="min-w-0 flex-1 truncate">{r.name}</span>
              <span className="num font-medium">{rupiah(r.amount)}</span>
              <span className="num w-9 text-right text-xs text-faint">{pct}%</span>
            </div>
            <div className="mt-1.5 h-1 rounded-full bg-well">
              <div className="grow-x h-full rounded-full" style={{ width: `${Math.max(2, (r.amount / max) * 100)}%`, background: r.other ? '#C8C8C3' : color }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
