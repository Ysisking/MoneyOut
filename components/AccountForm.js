'use client'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
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
    if (!n) return setErr('Beri nama dompet, mis. "BCA" atau "GoPay".')
    if (accounts.some((a) => a.id !== account?.id && a.name.toLowerCase() === n.toLowerCase())) return setErr('Nama dompet itu sudah ada.')
    setBusy(true); setErr('')
    try { await save('accounts', { ...(account ? { id: account.id } : {}), name: n, type, opening_balance: opening }); onClose() } catch (e2) { setErr(e2.message); setBusy(false) }
  }
  async function del() {
    if (accounts.length <= 1) return setErr('Minimal harus ada satu dompet.')
    if (used) return setErr('Dompet ini sudah punya catatan. Pindahkan atau hapus catatannya dulu.')
    if (!confirmDel) return setConfirmDel(true)
    setBusy(true)
    try { await remove('accounts', account.id); onClose() } catch (e2) { setErr(e2.message); setBusy(false) }
  }

  return (
    <Modal open onClose={onClose} title={account ? `Ubah dompet ${account.name}` : 'Tambah dompet'}
      footer={<>
        {account && <button type="button" className="btn-danger mr-auto" onClick={del} disabled={busy}><Trash2 size={16} /> {confirmDel ? 'Yakin hapus?' : 'Hapus'}</button>}
        <button type="button" className="btn-ghost" onClick={onClose}>Batal</button>
        <button form="acc-form" className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
      </>}>
      <form id="acc-form" onSubmit={submit} className="space-y-5">
        <p className="text-sm text-muted">Pisahkan uang sesuai tempatnya — tunai, rekening, e-wallet — supaya saldo di aplikasi selalu cocok dengan kenyataan.</p>
        <div>
          <span className="label">Jenis</span>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(ACCOUNT_TYPES).map(([k, v]) => {
              const Icon = ACCOUNT_ICON[k]
              return (
                <button type="button" key={k} onClick={() => setType(k)} aria-pressed={type === k}
                  className={`flex items-start gap-2 rounded-md border p-2.5 text-left transition ${type === k ? 'border-ink bg-ink text-sheet' : 'border-rule hover:border-ink/50'}`}>
                  <Icon size={17} className="mt-0.5 shrink-0" />
                  <span><span className="block text-sm font-semibold">{v.label}</span><span className={`block text-[11px] ${type === k ? 'text-sheet/70' : 'text-muted'}`}>{v.hint}</span></span>
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="acc-name">Nama dompet</label>
          <input id="acc-name" className="input" maxLength={40} placeholder={type === 'bank' ? 'mis. BCA Gaji' : type === 'ewallet' ? 'mis. GoPay' : 'mis. Dompet harian'} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="eyebrow mb-1 block" htmlFor="amount">Saldo awal</label>
          <AmountInput value={opening} onChange={setOpening} quick={false} />
          <p className="mt-1.5 text-xs text-muted">Isi dengan saldo saat ini sebelum mulai mencatat. Boleh 0.</p>
        </div>
        <ErrorText>{err}</ErrorText>
      </form>
    </Modal>
  )
}
