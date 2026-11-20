'use client'
import { useState } from 'react'
import { Modal, ErrorText } from './ui'
import AmountInput from './AmountInput'
import { ACCOUNT_ICON } from './AccountPicker'
import { useData } from './DataProvider'
import { ACCOUNT_TYPES } from '@/lib/stats'

export default function AccountForm({ account, onClose }) {
  const { accounts, transactions, transfers, save, remove } = useData()
  const [name, setName] = useState(account?.name || '')
  const [type, setType] = useState(account?.type || 'bank')
  const [opening, setOpening] = useState(account ? Number(account.opening_balance) : 0)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const used = account && (transactions.some((t) => t.account_id === account.id) || transfers.some((t) => t.from_account_id === account.id || t.to_account_id === account.id))

  async function submit(e) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return setErr('Beri nama dompet, misalnya BCA atau GoPay.')
    if (accounts.some((a) => a.id !== account?.id && a.name.toLowerCase() === n.toLowerCase())) return setErr('Nama dompet itu sudah dipakai.')
    setBusy(true); setErr('')
    try { await save('accounts', { ...(account ? { id: account.id } : {}), name: n, type, opening_balance: opening }); onClose() } catch (e2) { setErr(e2.message); setBusy(false) }
  }
  async function del() {
    if (accounts.length <= 1) return setErr('Minimal harus ada satu dompet.')
    if (used) return setErr('Dompet ini masih punya transaksi. Hapus atau pindahkan transaksinya dulu.')
    if (!confirmDel) return setConfirmDel(true)
    setBusy(true)
    try { await remove('accounts', account.id); onClose() } catch (e2) { setErr(e2.message); setBusy(false) }
  }

  return (
    <Modal open onClose={onClose} title={account ? 'Ubah dompet' : 'Dompet baru'} description="Pisahkan uang sesuai tempatnya agar saldo selalu cocok dengan kenyataan."
      footer={<>
        {account && <button type="button" className="btn-danger mr-auto" onClick={del} disabled={busy}>{confirmDel ? 'Klik lagi untuk hapus' : 'Hapus dompet'}</button>}
        <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
        <button form="acc-form" className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
      </>}>
      <form id="acc-form" onSubmit={submit} className="space-y-5">
        <fieldset>
          <legend className="field-label">Jenis</legend>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(ACCOUNT_TYPES).map(([k, v]) => {
              const Icon = ACCOUNT_ICON[k]
              const on = type === k
              return (
                <button type="button" key={k} onClick={() => setType(k)} aria-pressed={on}
                  className={`flex items-center gap-2.5 rounded-lg border p-3 text-left transition ${on ? 'border-ink ring-1 ring-ink' : 'border-edge hover:bg-subtle'}`}>
                  <Icon size={16} strokeWidth={1.8} className="shrink-0 text-sub" />
                  <span className="min-w-0"><span className="block text-sm font-medium">{v.label}</span><span className="block truncate text-xs text-sub">{v.hint}</span></span>
                </button>
              )
            })}
          </div>
        </fieldset>
        <div>
          <label className="field-label" htmlFor="acc-name">Nama</label>
          <input id="acc-name" className="input" maxLength={40} placeholder={type === 'bank' ? 'BCA Gaji' : type === 'ewallet' ? 'GoPay' : 'Dompet harian'} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <AmountInput label="Saldo awal" align="left" value={opening} onChange={setOpening} quick={false} />
          <p className="mt-1.5 text-xs text-sub">Saldo saat ini sebelum mulai mencatat. Boleh 0.</p>
        </div>
        <ErrorText>{err}</ErrorText>
      </form>
    </Modal>
  )
}
