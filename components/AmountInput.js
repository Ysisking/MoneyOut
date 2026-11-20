'use client'
import { formatAmountInput, parseAmount } from '@/lib/format'

const QUICK = [5000, 10000, 20000, 50000, 100000]

// Nominal ditulis di atas garis, seperti mengisi buku kas.
export default function AmountInput({ value, onChange, autoFocus, quick = true, id = 'amount', tone = 'text-ink' }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 border-b-2 border-ink/80 pb-1 focus-within:border-brand">
        <span className="font-display text-xl font-semibold text-muted">Rp</span>
        <input id={id} inputMode="numeric" autoComplete="off" autoFocus={autoFocus} placeholder="0"
          className={`num w-full bg-transparent py-1 text-[2rem] font-semibold leading-none outline-none placeholder:text-rule ${tone}`}
          value={formatAmountInput(value)} onChange={(e) => onChange(Math.min(parseAmount(e.target.value), 999999999999))} />
      </div>
      {quick && (
        <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto">
          {QUICK.map((q) => (
            <button type="button" key={q} onClick={() => onChange((value || 0) + q)} className="num rounded border border-dashed border-rule px-2 py-0.5 text-xs text-muted hover:border-ink hover:text-ink">
              +{q / 1000}rb
            </button>
          ))}
          {value > 0 && <button type="button" onClick={() => onChange(0)} className="px-2 py-0.5 text-xs text-muted underline-offset-2 hover:underline">hapus</button>}
        </div>
      )}
    </div>
  )
}
