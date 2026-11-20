'use client'
import { useMemo, useState } from 'react'
import { Modal, ErrorText } from './ui'
import { useData } from './DataProvider'
import { categoriesFor } from '@/lib/categories'
import { rupiah, formatAmountInput, parseAmount, thisMonth, shiftMonth } from '@/lib/format'
import { byCategory, ofKind, inMonth } from '@/lib/stats'

export default function BudgetForm({ onClose }) {
  const { categories, budgets, transactions, save, remove } = useData()
  const cats = categoriesFor('pengeluaran', categories)
  const last = useMemo(() => byCategory(ofKind(inMonth(transactions, shiftMonth(thisMonth(), -1)), 'pengeluaran')), [transactions])
  const [vals, setVals] = useState(() => Object.fromEntries(budgets.map((b) => [b.category, Number(b.amount)])))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const sum = Object.values(vals).reduce((s, v) => s + (v || 0), 0)

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      for (const c of cats) {
        const v = vals[c.name] || 0
        const ex = budgets.find((b) => b.category === c.name)
        if (v > 0 && (!ex || Number(ex.amount) !== v)) await save('budgets', { ...(ex ? { id: ex.id } : {}), category: c.name, amount: v })
        if (!v && ex) await remove('budgets', ex.id)
      }
      onClose()
    } catch (e2) { setErr(e2.message); setBusy(false) }
  }

  return (
    <Modal open wide onClose={onClose} title="Anggaran bulanan" description="Isi batas belanja untuk kategori yang ingin diawasi. Kosongkan yang tidak perlu."
      footer={<>
        <p className="mr-auto text-sm text-sub">Total <span className="num font-medium text-ink">{rupiah(sum)}</span> per bulan</p>
        <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
        <button form="budget-form" className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
      </>}>
      <form id="budget-form" onSubmit={submit}>
        <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 border-b border-line pb-2 text-xs font-medium text-faint"><span>Kategori</span><span className="w-40 text-right">Batas per bulan</span></div>
        <ul className="divide-y divide-line">
          {cats.map((c) => {
            const prev = last.find((l) => l.name === c.name)?.amount
            return (
              <li key={c.name} className="grid grid-cols-[1fr_auto] items-center gap-x-4 py-2.5">
                <span className="flex min-w-0 items-center gap-2.5">
                  <c.icon size={16} strokeWidth={1.8} className="shrink-0 text-sub" />
                  <span className="min-w-0">
                    <span className="block truncate text-base">{c.name}</span>
                    {prev ? <button type="button" onClick={() => setVals({ ...vals, [c.name]: Math.ceil(prev / 10000) * 10000 })} className="num text-xs text-sub hover:text-ink hover:underline">Bulan lalu {rupiah(prev)}</button> : null}
                  </span>
                </span>
                <span className="flex h-9 w-40 items-center rounded-lg border border-edge px-2.5 focus-within:border-ink">
                  <span className="text-sm text-faint">Rp</span>
                  <input inputMode="numeric" aria-label={`Batas ${c.name}`} placeholder="0" className="num w-full bg-transparent text-right text-base outline-none placeholder:text-[#CFCFCA]"
                    value={formatAmountInput(vals[c.name])} onChange={(e) => setVals({ ...vals, [c.name]: parseAmount(e.target.value) })} />
                </span>
              </li>
            )
          })}
        </ul>
        <div className="mt-3"><ErrorText>{err}</ErrorText></div>
      </form>
    </Modal>
  )
}
