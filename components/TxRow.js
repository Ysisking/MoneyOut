'use client'
import { KINDS, TONE, iconFor } from '@/lib/categories'
import { rupiah, dateShort } from '@/lib/format'
import { useData } from './DataProvider'

export default function TxRow({ tx, showDate }) {
  const { openTx } = useData()
  const meta = KINDS[tx.kind]
  const tone = TONE[meta.tone]
  const Icon = iconFor(tx.kind, tx.category)
  return (
    <button onClick={() => openTx({ tx })} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-canvas">
      <span className={`shrink-0 rounded-xl p-2 ${tone.bg} ${tone.text}`}><Icon size={18} /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{tx.category}</span>
        <span className="block truncate text-xs text-muted">
          {[showDate && dateShort(tx.date), tx.note].filter(Boolean).join(' · ') || meta.label}
        </span>
      </span>
      <span className={`tnum shrink-0 text-sm font-bold ${tone.text}`}>{meta.sign} {rupiah(tx.amount)}</span>
    </button>
  )
}
