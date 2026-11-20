'use client'
import { formatAmountInput, parseAmount } from '@/lib/format'

const QUICK = [10000, 20000, 50000, 100000]

export default function AmountInput({ value, onChange, autoFocus, quick = true, id = 'amount', align = 'center', label = 'Nominal' }) {
  const center = align === 'center'
  return (
    <div className={center ? 'text-center' : ''}>
      <label htmlFor={id} className={center ? 'sr-only' : 'field-label'}>{label}</label>
      <div className={`flex items-baseline gap-1.5 ${center ? 'justify-center' : 'rounded-lg border border-edge px-3 focus-within:border-ink focus-within:ring-4 focus-within:ring-black/5'}`}>
        <span className={center ? 'text-2xl font-medium text-faint' : 'text-base text-faint'}>Rp</span>{center && <span className="w-0.5" />}
        <input id={id} inputMode="numeric" autoComplete="off" autoFocus={autoFocus} placeholder="0"
          className={`num bg-transparent outline-none focus-visible:outline-none placeholder:text-[#CFCFCA] ${center ? 'w-[11ch] text-4xl font-semibold tracking-tight' : 'h-10 w-full text-base'}`}
          style={center ? { width: `${Math.max(2, formatAmountInput(value).length || 1) + 0.5}ch` } : undefined}
          value={formatAmountInput(value)} onChange={(e) => onChange(Math.min(parseAmount(e.target.value), 999999999999))} />
      </div>
      {quick && (
        <div className="mt-3 flex justify-center gap-1.5">
          {QUICK.map((q) => (
            <button type="button" key={q} onClick={() => onChange((value || 0) + q)} className="num h-7 rounded-full border border-line px-2.5 text-xs text-sub hover:border-edge hover:text-ink">+{q / 1000} rb</button>
          ))}
        </div>
      )}
    </div>
  )
}
