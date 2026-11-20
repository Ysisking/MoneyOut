'use client'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { backend } from '@/lib/backend'
import TxForm from './TxForm'

const DataCtx = createContext(null)
export const useData = () => useContext(DataCtx)

const EMPTY = { transactions: [], debts: [], payments: [], categories: [] }

export default function DataProvider({ userId, children }) {
  const [data, setData] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [txForm, setTxForm] = useState(null) // { kind, tx } atau null

  const reload = useCallback(async () => {
    setError('')
    try { setData(await backend.loadAll()) } catch (e) { setError(e.message) } finally { setLoading(false) }
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
      return next
    })
  }, [])

  const openTx = useCallback((opts = {}) => setTxForm({ kind: opts.kind || opts.tx?.kind || 'pengeluaran', tx: opts.tx || null }), [])

  return (
    <DataCtx.Provider value={{ ...data, loading, error, reload, save, remove, openTx }}>
      {children}
      {txForm && <TxForm key={txForm.tx?.id || 'new'} initial={txForm} onClose={() => setTxForm(null)} />}
    </DataCtx.Provider>
  )
}
