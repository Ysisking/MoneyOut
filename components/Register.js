'use client'
import { useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { useData } from './DataProvider'
import { IconBubble } from './ui'
import { iconFor } from '@/lib/categories'
import { rupiah, todayISO } from '@/lib/format'
import { isFromOrderBook, stripOrderBook } from '@/lib/orderbook'

const PAGE = 50

function dayLabel(iso) {
  const t = todayISO()
  const y = new Date(t + 'T00:00:00'); y.setDate(y.getDate() - 1)
  const yIso = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`
  if (iso === t) return 'Hari ini'
  if (iso === yIso) return 'Kemarin'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', ...(iso.slice(0, 4) !== t.slice(0, 4) ? { year: 'numeric' } : {}) })
}
const KIND_LABEL = { pemasukan: 'Pemasukan', pengeluaran: 'Pengeluaran', simpanan: 'Simpanan', transfer: 'Pindah dompet' }

// Daftar transaksi dikelompokkan per hari. showBalance = saldo berjalan (tampilan satu dompet).
export default function Register({ rows, showBalance = false, showAccount = true, empty = 'Belum ada transaksi.', limit, dense }) {
  const { openTx, accounts } = useData()
  const [shown, setShown] = useState(PAGE)
  const list = rows.slice(0, limit || shown)
  const more = !limit && rows.length > shown
  const accName = (id) => accounts.find((a) => a.id === id)?.name
  const open = (r) => (r.type === 'transfer' ? openTx({ transfer: r.ref }) : openTx({ tx: r.ref }))

  if (!list.length) return <p className="px-5 py-12 text-center text-sm text-sub">{empty}</p>

  const groups = []
  list.forEach((r) => {
    const g = groups[groups.length - 1]
    if (g && g.date === r.date) { g.items.push(r); g.net += r.delta } else groups.push({ date: r.date, items: [r], net: r.delta })
  })

  return (
    <div>
      {groups.map((g) => (
        <section key={g.date}>
          {!dense && (
            <div className="sticky top-14 z-[1] flex items-center justify-between border-b border-line bg-canvas/95 px-5 py-2 text-xs font-medium text-sub backdrop-blur lg:top-0">
              <span className="capitalize">{dayLabel(g.date)}</span>
              {g.net !== 0 && <span className="num">{g.net > 0 ? '+' : '−'}{rupiah(Math.abs(g.net))}</span>}
            </div>
          )}
          <ul>
            {g.items.map((r) => {
              const isT = r.type === 'transfer'
              const Icon = isT ? ArrowRightLeft : iconFor(r.kind, r.category)
              const fromOB = !isT && isFromOrderBook(r.note)
              const title = isT ? r.category : stripOrderBook(r.note) || r.category
              const meta = [
                dense && dayLabel(r.date),
                !isT && r.note && r.category,
                r.kind === 'simpanan' && 'Simpanan',
                isT && r.note,
                showAccount && !isT && accName(r.accountId),
              ].filter(Boolean)
              const amt = isT && !r.delta ? r.amount : Math.abs(r.delta)
              return (
                <li key={r.id}>
                  <button onClick={() => open(r)} className="group flex w-full items-center gap-3.5 border-b border-line px-5 py-3 text-left transition-colors last:border-0 hover:bg-subtle">
                    <IconBubble icon={Icon} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-base font-medium">{title}</span>
                        {fromOB && <span className="shrink-0 rounded border border-line px-1 text-[10px] font-semibold uppercase tracking-wide text-sub" title="Dikirim otomatis dari OrderBook">OrderBook</span>}
                      </span>
                      <span className="block truncate text-sm text-sub">{meta.join(' · ') || KIND_LABEL[r.kind]}</span>
                    </span>
                    <span className="text-right">
                      <span className={`num block text-base font-medium ${r.delta > 0 ? 'text-pos' : isT && !r.delta ? 'text-sub' : 'text-ink'}`}>
                        {r.delta > 0 ? '+' : r.delta < 0 ? '−' : ''}{rupiah(amt)}
                      </span>
                      {showBalance && <span className="num block text-xs text-faint">{rupiah(r.balance)}</span>}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
      {more && (
        <button onClick={() => setShown(shown + PAGE)} className="w-full border-t border-line py-3 text-sm font-medium text-sub hover:bg-subtle hover:text-ink">
          Muat {Math.min(PAGE, rows.length - shown)} transaksi sebelumnya
        </button>
      )}
    </div>
  )
}
