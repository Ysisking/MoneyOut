'use client'
import { rupiah, rupiahShort, daysInMonth, todayISO } from '@/lib/format'
import { iconFor } from '@/lib/categories'

// ------------------------------------------------------------ Kalender pengeluaran
// Satu warna (oranye) dari terang ke gelap = makin besar pengeluaran hari itu.
const RAMP = ['#FBE6DA', '#F6C4A8', '#EE9C70', '#DE7140', '#B9501F']
const WEEK = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

export function SpendCalendar({ month, daily, selected, onPick }) {
  const dim = daysInMonth(month)
  const first = (new Date(month + '-01T00:00:00').getDay() + 6) % 7 // Senin = 0
  const today = todayISO()
  const max = Math.max(0, ...daily.values())
  const level = (v) => (!v ? -1 : Math.min(4, Math.floor((v / (max || 1)) * 4.999)))
  const cells = [...Array(first).fill(null), ...Array.from({ length: dim }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)]
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted">
        {WEEK.map((w) => <span key={w}>{w}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <span key={'x' + i} />
          const v = daily.get(d) || 0
          const lv = level(v)
          const future = d > today
          const label = `${Number(d.slice(8))}: ${v ? rupiah(v) : 'tanpa pengeluaran'}`
          const Tag = onPick && !future ? 'button' : 'div'
          return (
            <Tag key={d} title={label} aria-label={label} onClick={onPick && !future ? () => onPick(selected === d ? null : d) : undefined}
              className={`relative flex aspect-square flex-col justify-between rounded p-1 text-left transition sm:aspect-[1.25] ${future ? 'opacity-35' : ''} ${selected === d ? 'ring-2 ring-ink ring-offset-1 ring-offset-sheet' : ''} ${d === today ? 'outline outline-1 outline-ink' : ''}`}
              style={{ background: lv < 0 ? '#F7F2E9' : RAMP[lv], color: lv >= 3 ? '#fff' : undefined }}>
              <span className="num text-[11px] leading-none">{Number(d.slice(8))}</span>
              {v > 0 && <span className="num hidden truncate text-[10px] font-medium leading-none sm:block">{rupiahShort(v)}</span>}
            </Tag>
          )
        })}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted">
        sedikit {RAMP.map((c) => <span key={c} className="h-2.5 w-3.5 rounded-sm" style={{ background: c }} />)} banyak
      </div>
    </div>
  )
}

// ------------------------------------------------------------ Amplop anggaran
export function BudgetEnvelopes({ items, isCurrent, onEdit, limit }) {
  const list = limit ? items.slice(0, limit) : items
  return (
    <ul className="space-y-3.5">
      {list.map((b) => {
        const Icon = iconFor('pengeluaran', b.category)
        const over = b.used > b.limit
        const ahead = !over && isCurrent && b.ratio > b.pace + 0.1 // belanja lebih cepat dari jalannya bulan
        const state = over ? { t: `Lewat ${rupiah(b.used - b.limit)}`, c: 'text-keluar-text', bar: '#C2410C' } : ahead ? { t: 'Terlalu cepat', c: 'text-utang-text', bar: '#D18A00' } : { t: 'Aman', c: 'text-masuk-text', bar: '#1F5A43' }
        return (
          <li key={b.category}>
            <div className="flex items-baseline gap-2 text-sm">
              <Icon size={15} className="shrink-0 self-center text-muted" />
              <span className="min-w-0 flex-1 truncate font-medium">{b.category}</span>
              <span className="num text-xs text-muted">{rupiahShort(b.used)} / {rupiahShort(b.limit)}</span>
            </div>
            <div className="relative mt-1.5 h-2.5 overflow-hidden rounded-sm bg-canvas ring-1 ring-inset ring-line">
              <div className="grow-x h-full" style={{ width: `${Math.min(100, b.ratio * 100)}%`, background: state.bar }} />
              {isCurrent && <span className="absolute inset-y-0 w-px bg-ink/60" style={{ left: `${b.pace * 100}%` }} title="Posisi hari ini dalam bulan" />}
            </div>
            <p className="mt-1 flex justify-between gap-2 text-xs">
              <span className={`font-semibold ${state.c}`}>{state.t}</span>
              <span className="num text-muted">{over ? 'stop dulu belanja ini' : `sisa ${rupiah(b.left)}${isCurrent ? ` · ${rupiahShort(b.perDay)}/hari` : ''}`}</span>
            </p>
          </li>
        )
      })}
      {onEdit && items.length > (limit || Infinity) && <li><button onClick={onEdit} className="text-sm font-semibold text-brand hover:underline">+{items.length - limit} amplop lain</button></li>}
    </ul>
  )
}

// ------------------------------------------------------------ Rantai mencatat
// Teknik lama "jangan putuskan rantainya": satu kotak per hari mencatat.
export function Streak({ data }) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-4xl font-semibold leading-none">{data.streak}</span>
        <span className="text-sm text-muted">hari berturut-turut mencatat</span>
      </div>
      <div className="mt-3 flex gap-1" aria-label="14 hari terakhir">
        {data.last14.map((d, i) => (
          <span key={d.date} title={`${d.date}: ${d.on ? 'ada catatan' : 'kosong'}`}
            className={`h-6 flex-1 rounded-sm border ${d.on ? 'border-ink bg-ink' : 'border-rule bg-sheet'} ${i === 13 && !d.on ? 'border-dashed border-ink/60' : ''}`} />
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">{data.today ? 'Hari ini sudah tercatat. Rantai aman.' : data.streak ? 'Belum ada catatan hari ini — catat satu agar rantai tidak putus.' : 'Mulai rantai dengan mencatat satu transaksi hari ini.'}</p>
    </div>
  )
}

// ------------------------------------------------------------ Ke mana uang masuk pergi
export function FlowBar({ masuk, keluar, simpan }) {
  if (!masuk) return <p className="text-sm text-muted">Catat pemasukan bulan ini untuk melihat ke mana uangmu pergi.</p>
  const sisa = masuk - keluar - simpan
  const base = Math.max(masuk, keluar + simpan)
  const parts = [
    { k: 'Keluar', v: keluar, c: '#eb6834' },
    { k: 'Disimpan', v: simpan, c: '#2a78d6' },
    { k: sisa >= 0 ? 'Sisa' : 'Kurang', v: Math.abs(sisa), c: sisa >= 0 ? '#1baf7a' : '#B3261E', hatch: sisa < 0 },
  ].filter((p) => p.v > 0)
  return (
    <div>
      <div className="flex h-4 gap-[2px] overflow-hidden rounded-sm">
        {parts.map((p) => (
          <div key={p.k} className="grow-x h-full" title={`${p.k}: ${rupiah(p.v)}`} style={{ width: `${(p.v / base) * 100}%`, background: p.hatch ? `repeating-linear-gradient(45deg, ${p.c} 0 4px, #fff0 4px 7px)` : p.c }} />
        ))}
      </div>
      <ul className="mt-2.5 grid grid-cols-3 gap-2 text-xs">
        {parts.map((p) => (
          <li key={p.k}>
            <span className="flex items-center gap-1.5 text-muted"><span className="h-2 w-2 rounded-sm" style={{ background: p.c }} />{p.k}</span>
            <span className="num font-semibold">{Math.round((p.v / masuk) * 100)}%</span>{' '}<span className="num text-muted">· {rupiahShort(p.v)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
