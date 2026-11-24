'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { backend } from '@/lib/backend'
import { accountBalances } from '@/lib/stats'
import { orgLedger, TALANGAN, PENGEMBALIAN } from '@/lib/bills'
import { todayISO } from '@/lib/format'
import TxForm from './TxForm'
import AccountForm from './AccountForm'
import BudgetForm from './BudgetForm'
import AssetForm from './AssetForm'

const DataCtx = createContext(null)
export const useData = () => useContext(DataCtx)

const EMPTY = { transactions: [], debts: [], payments: [], categories: [], accounts: [], transfers: [], budgets: [], assets: [], orgs: [], orgMembers: [], orgEntries: [], bills: [], billPayments: [], missing: [] }

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
      if (table === 'orgs') { for (const k of ['orgMembers', 'orgEntries', 'bills']) next[k] = d[k].filter((r) => r.org_id !== id) }
      if (table === 'bills') next.billPayments = d.billPayments.filter((p) => p.bill_id !== id)
      if (table === 'accounts') next.transfers = d.transfers.filter((t) => t.from_account_id !== id && t.to_account_id !== id)
      return next
    })
  }, [])

  // ---------------------------------------------------------------- Instansi & tagihan
  const ref = useRef(data); ref.current = data
  const defaultAccount = () => { try { const id = localStorage.getItem('moneyout:lastAccount'); if (ref.current.accounts.some((a) => a.id === id)) return id } catch {} return ref.current.accounts[0]?.id || null }

  // Bila kas instansi minus, pengguna menalangi dari dompet pribadi secara otomatis.
  const settleOrg = useCallback(async (orgId) => {
    const L = orgLedger(orgId, ref.current.orgEntries)
    if (L.balance >= 0) return 0
    const org = ref.current.orgs.find((o) => o.id === orgId)
    const gap = -L.balance
    const tx = await save('transactions', { kind: 'pengeluaran', category: TALANGAN, amount: gap, date: todayISO(), note: `Talangan kas ${org?.name || 'instansi'}`, account_id: defaultAccount() })
    ref.current = { ...ref.current, transactions: [...ref.current.transactions, tx] }
    const e = await save('orgEntries', { org_id: orgId, kind: 'masuk', source: 'talangan', category: 'Talangan pengelola', amount: gap, date: todayISO(), note: 'Ditalangi dari dompet pribadi', linked_tx_id: tx.id })
    ref.current = { ...ref.current, orgEntries: [...ref.current.orgEntries, e] }
    return gap
  }, [save])

  const addOrgEntry = useCallback(async (entry) => {
    const e = await save('orgEntries', entry)
    ref.current = { ...ref.current, orgEntries: [...ref.current.orgEntries.filter((x) => x.id !== e.id), e] }
    return { entry: e, talangan: await settleOrg(entry.org_id) }
  }, [save, settleOrg])

  const removeOrgEntry = useCallback(async (entry) => {
    for (const p of ref.current.billPayments.filter((p) => p.entry_id === entry.id)) await remove('billPayments', p.id)
    await remove('orgEntries', entry.id)
    if (entry.linked_tx_id && ref.current.transactions.some((t) => t.id === entry.linked_tx_id)) await remove('transactions', entry.linked_tx_id)
    ref.current = { ...ref.current, orgEntries: ref.current.orgEntries.filter((x) => x.id !== entry.id) }
    return settleOrg(entry.org_id)
  }, [remove, settleOrg])

  const repayTalangan = useCallback(async (orgId, amount, accountId) => {
    const org = ref.current.orgs.find((o) => o.id === orgId)
    const tx = await save('transactions', { kind: 'pemasukan', category: PENGEMBALIAN, amount, date: todayISO(), note: `Pengembalian talangan ${org?.name || ''}`.trim(), account_id: accountId || defaultAccount() })
    await save('orgEntries', { org_id: orgId, kind: 'keluar', source: 'pengembalian', category: 'Pengembalian talangan', amount, date: todayISO(), note: 'Dikembalikan ke dompet pribadi pengelola', linked_tx_id: tx.id })
  }, [save])

  // Bayar tagihan terjadwal untuk satu periode (dan satu anggota bila iuran).
  const payBill = useCallback(async (bill, period, { amount, date, accountId, memberId = null }) => {
    if (!bill.org_id) {
      const tx = await save('transactions', { kind: bill.kind, category: bill.category, amount, date, note: bill.name, account_id: accountId || bill.account_id || defaultAccount() })
      await save('billPayments', { bill_id: bill.id, period, member_id: null, amount, tx_id: tx.id, date })
      return 0
    }
    const member = memberId && ref.current.orgMembers.find((m) => m.id === memberId)
    const { entry, talangan } = await addOrgEntry({
      org_id: bill.org_id, kind: bill.kind === 'iuran' ? 'masuk' : 'keluar', source: bill.kind === 'iuran' ? 'iuran' : 'tagihan',
      category: bill.name, amount, date, note: member ? `${bill.name} · ${member.name}` : bill.name, member_id: memberId, bill_id: bill.id, period,
    })
    await save('billPayments', { bill_id: bill.id, period, member_id: memberId, amount, entry_id: entry.id, date })
    return talangan
  }, [save, addOrgEntry])

  const skipBill = useCallback((bill, period, memberId = null) => save('billPayments', { bill_id: bill.id, period, member_id: memberId, amount: 0, date: todayISO() }), [save])

  const undoPayment = useCallback(async (p) => {
    await remove('billPayments', p.id)
    if (p.tx_id && ref.current.transactions.some((t) => t.id === p.tx_id)) await remove('transactions', p.tx_id)
    if (p.entry_id) { const e = ref.current.orgEntries.find((x) => x.id === p.entry_id); if (e) return removeOrgEntry(e) }
    return 0
  }, [remove, removeOrgEntry])

  const resetAll = useCallback(async () => { await backend.resetAll(); await reload() }, [reload])
  const balances = useMemo(() => accountBalances(data), [data])
  const openTx = useCallback((o = {}) => setModal({ type: 'tx', kind: o.kind || o.tx?.kind || (o.transfer ? 'transfer' : 'pengeluaran'), tx: o.tx || null, transfer: o.transfer || null, accountId: o.accountId || null, date: o.date || null }), [])
  const openAccount = useCallback((account = null) => setModal({ type: 'account', account }), [])
  const openBudget = useCallback(() => setModal({ type: 'budget' }), [])
  const openAsset = useCallback((asset = null) => setModal({ type: 'asset', asset }), [])
  const close = useCallback(() => setModal(null), [])

  return (
    <DataCtx.Provider value={{ ...data, balances, loading, error, reload, resetAll, save, remove, addOrgEntry, removeOrgEntry, repayTalangan, payBill, skipBill, undoPayment, openTx, openAccount, openBudget, openAsset }}>
      {children}
      {modal?.type === 'tx' && <TxForm key={modal.tx?.id || modal.transfer?.id || 'new'} initial={modal} onClose={close} />}
      {modal?.type === 'account' && <AccountForm account={modal.account} onClose={close} />}
      {modal?.type === 'budget' && <BudgetForm onClose={close} />}
      {modal?.type === 'asset' && <AssetForm asset={modal.asset} onClose={close} />}
    </DataCtx.Provider>
  )
}
