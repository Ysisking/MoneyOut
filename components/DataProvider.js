'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { backend } from '@/lib/backend'
import { accountBalances } from '@/lib/stats'
import TxForm from './TxForm'
import AccountForm from './AccountForm'
import BudgetForm from './BudgetForm'
import AssetForm from './AssetForm'

const DataCtx = createContext(null)
export const useData = () => useContext(DataCtx)

const EMPTY = { transactions: [], debts: [], payments: [], categories: [], accounts: [], transfers: [], budgets: [], assets: [], missing: [] }

export default function DataProvider({ userId, children }) {
  const [data, setData] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null) // { type: 'tx'|'account'|'budget', ...opsi }

  const reload = useCallback(async () => {
    setError('')
    try {
      let d = { ...EMPTY, ...(await backend.loadAll()) }
      // Pengguna lama / baru tanpa dompet: buat "Tunai" lalu pindahkan catatan lama ke sana.
      if (!d.accounts.length) {
        const acc = await backend.save('accounts', { name: 'Tunai', type: 'tunai', opening_balance: 0 })
        if (d.transactions.some((t) => !t.account_id)) await backend.assignOrphans(acc.id)
        d = { ...EMPTY, ...(await backend.loadAll()) }
      }
      setData(d)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [])
  useEffect(() => { setLoading(true); reload() }, [userId, reload])

  const save = useCallback(async (table, row) => {
    const saved = await backend.save(table, row)
    setData((d) => {
      const list = d[table]
      const i = list.findIndex((r) => r.id === saved.id)
      return { ...d, [table]: i < 0 ? [...list, saved] : list.map((r) => (r.id === saved.id ? saved : r)) }
    })
    return saved
  }, [])

  const remove = useCallback(async (table, id) => {
    await backend.remove(table, id)
    setData((d) => {
      const next = { ...d, [table]: d[table].filter((r) => r.id !== id) }
      if (table === 'debts') next.payments = d.payments.filter((p) => p.debt_id !== id)
      if (table === 'accounts') next.transfers = d.transfers.filter((t) => t.from_account_id !== id && t.to_account_id !== id)
      return next
    })
  }, [])

  const resetAll = useCallback(async () => { await backend.resetAll(); await reload() }, [reload])
  const balances = useMemo(() => accountBalances(data), [data])
  const openTx = useCallback((o = {}) => setModal({ type: 'tx', kind: o.kind || o.tx?.kind || (o.transfer ? 'transfer' : 'pengeluaran'), tx: o.tx || null, transfer: o.transfer || null, accountId: o.accountId || null, date: o.date || null }), [])
  const openAccount = useCallback((account = null) => setModal({ type: 'account', account }), [])
  const openBudget = useCallback(() => setModal({ type: 'budget' }), [])
  const openAsset = useCallback((asset = null) => setModal({ type: 'asset', asset }), [])
  const close = useCallback(() => setModal(null), [])

  return (
    <DataCtx.Provider value={{ ...data, balances, loading, error, reload, resetAll, save, remove, openTx, openAccount, openBudget, openAsset }}>
      {children}
      {modal?.type === 'tx' && <TxForm key={modal.tx?.id || modal.transfer?.id || 'new'} initial={modal} onClose={close} />}
      {modal?.type === 'account' && <AccountForm account={modal.account} onClose={close} />}
      {modal?.type === 'budget' && <BudgetForm onClose={close} />}
      {modal?.type === 'asset' && <AssetForm asset={modal.asset} onClose={close} />}
    </DataCtx.Provider>
  )
}
