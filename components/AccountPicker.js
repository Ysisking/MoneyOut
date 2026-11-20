'use client'
import { Wallet, Landmark, Smartphone, CreditCard } from 'lucide-react'
import { rupiah } from '@/lib/format'

export const ACCOUNT_ICON = { tunai: Wallet, bank: Landmark, ewallet: Smartphone, lainnya: CreditCard }

export default function AccountSelect({ id, label, accounts, value, onChange, exclude }) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      <select id={id} className="input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
        {accounts.filter((a) => a.id !== exclude).map((a) => <option key={a.id} value={a.id}>{a.name} · {rupiah(a.balance)}</option>)}
      </select>
    </div>
  )
}
