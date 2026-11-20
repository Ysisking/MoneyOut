'use client'
import { rupiah, rupiahShort, daysInMonth, todayISO } from '@/lib/format'
import { iconFor } from '@/lib/categories'

// Kalender pengeluaran: satu rona abu-abu, makin gelap makin besar.
const RAMP = ['#EDEDEA', '#D3D3CE', '#A9A9A3', '#6E6E69', '#2B2B29']
const WEEK = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

export function SpendCalendar({ month, daily, selected, onPick }) {
  const dim = daysInMonth(month)
  const first = (new Date(month + '-01T00:00:00').getDay() + 6) % 7
  const today = todayISO()
  const max = Math.max(0, ...daily.values())
  const level = (v) => (!v ? -1 : Math.min(4, Math.floor((v / (max || 1)) * 4.999)))
  const cells = [...Array(first).fill(null), ...Array.from({ length: dim }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)]
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-2xs text-faint">{WEEK.map((w) => <span key={w}>{w}</span>)}</div>
      <div className="mt-1.5 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <span key={'x' + i} />
          const v = daily.get(d) || 0
          const lv = level(v)
          const future = d > today
          const label = `${Number(d.slice(8))}: ${v ? rupiah(v) : 'tanpa pengeluaran'}`
          const clickable = onPick && !future
          const Tag = clickable ? 'button' : 'div'
          return (
            <Tag key={d} title={label} aria-label={label} aria-pressed={clickable ? selected === d : undefined} onClick={clickable ? () => onPick(selected === d ? null : d) : undefined}
              className={`num grid aspect-square place-items-center rounded-md text-xs transition ${future ? 'text-faint/60' : ''} ${clickable ? 'hover:ring-2 hover:ring-ink/20' : ''} ${selected === d ? 'ring-2 ring-ink ring-offset-1' : ''} ${d === today ? 'font-semibold underline decoration-2 underline-offset-2' : ''}`}
              style={{ background: future ? 'transparent' : lv < 0 ? '#F7F7F6' : RAMP[lv], color: lv >= 3 ? '#fff' : undefined }}>
              {Number(d.slice(8))}
            </Tag>
          )
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-2xs text-faint">
        <span>Terbesar {max ? rupiah(max) : '—'}</span>
        <span className="flex items-center gap-1">Sedikit {RAMP.map((c) => <span key={c} className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />)} Banyak</span>
      </div>
    </div>
  )
}

// Anggaran per kategori: batang progres + penanda posisi hari ini.
export function BudgetList({ items, isCurrent, limit }) {
  const list = limit ? items.slice(0, limit) : items
  return (
    <ul className="space-y-4">
      {list.map((b) => {
        const Icon = iconFor('pengeluaran', b.category)
        const over = b.used > b.limit
        const fast = !over && isCurrent && b.ratio > b.pace + 0.1
        const color = over ? '#C2382E' : fast ? '#C78100' : '#111111'
        return (
          <li key={b.category}>
            <div className="flex items-center gap-2 text-sm">
              <Icon size={15} strokeWidth={1.8} className="shrink-0 text-sub" />
              <span className="min-w-0 flex-1 truncate font-medium">{b.category}</span>
              <span className="num text-sub"><span className="text-ink">{rupiahShort(b.used)}</span> / {rupiahShort(b.limit)}</span>
            </div>
            <div className="relative mt-2 h-1.5 rounded-full bg-well">
              <div className="grow-x h-full rounded-full" style={{ width: `${Math.min(100, b.ratio * 100)}%`, background: color }} />
              {isCurrent && <span className="absolute -top-1 h-3.5 w-px bg-ink/40" style={{ left: `${b.pace * 100}%` }} title="Hari ini" />}
            </div>
            <p className="mt-1.5 text-xs text-sub">
              {over ? <span className="font-medium text-neg">Lewat {rupiah(b.used - b.limit)}</span>
                : fast ? <span><span className="font-medium text-warn">Terlalu cepat.</span> Sisa {rupiah(b.left)}, maks {rupiah(b.perDay)}/hari</span>
                : <span>Sisa {rupiah(b.left)}{isCurrent ? `, ${rupiah(b.perDay)}/hari` : ''}</span>}
            </p>
          </li>
        )
      })}
    </ul>
  )
}
