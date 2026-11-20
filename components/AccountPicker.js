'use client'
import { Wallet, Landmark, Smartphone, CreditCard } from 'lucide-react'
import { rupiah } from '@/lib/format'

export const ACCOUNT_ICON = { tunai: Wallet, bank: Landmark, ewallet: Smartphone, lainnya: CreditCard }

export default function AccountPicker({ accounts, value, onChange, exclude, label }) {
  return (
    <div>
      {label && <span className="label">{label}</span>}
      <div className="flex flex-wrap gap-2">
        {accounts.filter((a) => a.id !== exclude).map((a) => {
          const Icon = ACCOUNT_ICON[a.type] || Wallet
          const on = value === a.id
          return (
            <button type="button" key={a.id} onClick={() => onChange(a.id)} aria-pressed={on}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition ${on ? 'border-ink bg-ink text-sheet' : 'border-rule bg-sheet hover:border-ink/50'}`}>
              <Icon size={16} className="shrink-0" />
              <span>
                <span className="block font-semibold leading-tight">{a.name}</span>
                <span className={`num block text-[11px] ${on ? 'text-sheet/70' : 'text-muted'}`}>{rupiah(a.balance)}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
