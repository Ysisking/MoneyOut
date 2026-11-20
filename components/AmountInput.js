'use client'
import { formatAmountInput, parseAmount } from '@/lib/format'

const QUICK = [5000, 10000, 20000, 50000, 100000]

export default function AmountInput({ value, onChange, autoFocus, quick = true, id = 'amount' }) {
  return (
    <div>
      <div className="flex items-center rounded-2xl border border-line bg-white px-4 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
        <span className="text-lg font-bold text-muted">Rp</span>
        <input id={id} inputMode="numeric" autoComplete="off" autoFocus={autoFocus} placeholder="0"
          className="tnum w-full bg-transparent px-2 py-3 text-2xl font-extrabold outline-none placeholder:text-line"
          value={formatAmountInput(value)} onChange={(e) => onChange(Math.min(parseAmount(e.target.value), 999999999999))} />
      </div>
      {quick && (
        <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
          {QUICK.map((q) => (
            <button type="button" key={q} onClick={() => onChange((value || 0) + q)} className="chip-off !px-2.5 !py-1 text-xs">
              +{q / 1000} rb
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
