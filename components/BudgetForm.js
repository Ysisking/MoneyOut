'use client'
import { useMemo, useState } from 'react'
import { Modal, ErrorText } from './ui'
import { useData } from './DataProvider'
import { categoriesFor } from '@/lib/categories'
import { rupiah, formatAmountInput, parseAmount, thisMonth, shiftMonth } from '@/lib/format'
import { byCategory, ofKind, inMonth } from '@/lib/stats'

// Metode amplop: tentukan batas belanja bulanan per kategori.
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
    <Modal open wide onClose={onClose} title="Atur anggaran bulanan"
      footer={<>
        <p className="mr-auto text-sm">Total <b className="num total-rule">{rupiah(sum)}</b> / bulan</p>
        <button type="button" className="btn-ghost" onClick={onClose}>Batal</button>
        <button form="budget-form" className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan anggaran'}</button>
      </>}>
      <form id="budget-form" onSubmit={submit}>
        <p className="mb-4 text-sm text-muted">Isi batas belanja per bulan untuk kategori yang ingin diawasi — seperti membagi uang ke beberapa amplop. Kosongkan bila tidak perlu.</p>
        <ul className="divide-y divide-line border-y border-line">
          {cats.map((c) => {
            const prev = last.find((l) => l.name === c.name)?.amount
            return (
              <li key={c.name} className="flex items-center gap-3 py-2">
                <c.icon size={17} className="shrink-0 text-muted" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{c.name}</span>
                  {prev ? <button type="button" onClick={() => setVals({ ...vals, [c.name]: Math.ceil(prev / 10000) * 10000 })} className="num text-[11px] text-muted underline decoration-dotted underline-offset-2 hover:text-ink" title="Pakai angka bulan lalu">bulan lalu {rupiah(prev)}</button> : <span className="block text-[11px] text-muted/70">belum ada data</span>}
                </span>
                <span className="flex w-36 items-baseline gap-1 border-b border-rule focus-within:border-ink">
                  <span className="text-xs text-muted">Rp</span>
                  <input inputMode="numeric" aria-label={`Anggaran ${c.name}`} placeholder="—" className="num w-full bg-transparent py-1 text-right text-sm outline-none"
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
