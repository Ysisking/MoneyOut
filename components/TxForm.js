'use client'
import { useState } from 'react'
import { Trash2, Plus, Check, ArrowRightLeft } from 'lucide-react'
import { Modal, ErrorText } from './ui'
import AmountInput from './AmountInput'
import AccountPicker from './AccountPicker'
import { useData } from './DataProvider'
import { KINDS, TONE, categoriesFor } from '@/lib/categories'
import { todayISO } from '@/lib/format'

const TABS = [
  { value: 'pemasukan', label: 'Masuk' },
  { value: 'pengeluaran', label: 'Keluar' },
  { value: 'simpanan', label: 'Simpanan' },
  { value: 'transfer', label: 'Pindah' },
]
const LAST = 'moneyout:lastAccount'
const lastAccount = () => { try { return localStorage.getItem(LAST) } catch { return null } }

export default function TxForm({ initial, onClose }) {
  const { categories, balances, save, remove } = useData()
  const tx = initial.tx, tr = initial.transfer
  const editing = !!(tx || tr)
  const pick = (id) => (balances.some((a) => a.id === id) ? id : balances[0]?.id)
  const [kind, setKind] = useState(tr ? 'transfer' : initial.kind)
  const [amount, setAmount] = useState(tx ? Number(tx.amount) : tr ? Number(tr.amount) : 0)
  const [category, setCategory] = useState(tx?.category || '')
  const [account, setAccount] = useState(pick(tx?.account_id || tr?.from_account_id || initial.accountId || lastAccount()))
  const [toAccount, setToAccount] = useState(tr?.to_account_id || balances.find((a) => a.id !== account)?.id)
  const [date, setDate] = useState(tx?.date || tr?.date || initial.date || todayISO())
  const [note, setNote] = useState(tx?.note || tr?.note || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const [newCat, setNewCat] = useState(null)

  const isTransfer = kind === 'transfer'
  const meta = KINDS[kind]
  const cats = isTransfer ? [] : categoriesFor(kind, categories)
  const tone = meta ? TONE[meta.tone] : null

  async function submit(e) {
    e?.preventDefault()
    if (!amount) return setErr('Isi nominalnya dulu.')
    if (!date) return setErr('Isi tanggalnya.')
    setBusy(true); setErr('')
    try {
      if (isTransfer) {
        if (!account || !toAccount || account === toAccount) throw new Error('Pilih dompet asal dan tujuan yang berbeda.')
        await save('transfers', { ...(tr ? { id: tr.id } : {}), from_account_id: account, to_account_id: toAccount, amount, date, note: note.trim() })
      } else {
        if (!category) throw new Error('Pilih kategori.')
        await save('transactions', { ...(tx ? { id: tx.id } : {}), kind, amount, category, date, note: note.trim(), account_id: account || null })
      }
      try { localStorage.setItem(LAST, account) } catch {}
      onClose()
    } catch (e2) { setErr(e2.message); setBusy(false) }
  }

  async function addCategory() {
    const n = (newCat || '').trim().replace(/\s+/g, ' ')
    if (!n) return setNewCat(null)
    const exist = cats.find((c) => c.name.toLowerCase() === n.toLowerCase())
    if (exist) { setCategory(exist.name); return setNewCat(null) }
    try { await save('categories', { kind, name: n }); setCategory(n); setNewCat(null); setErr('') } catch (e2) { setErr(e2.message) }
  }

  async function del() {
    if (!confirmDel) return setConfirmDel(true)
    setBusy(true)
    try { await remove(tr ? 'transfers' : 'transactions', (tx || tr).id); onClose() } catch (e2) { setErr(e2.message); setBusy(false) }
  }

  const title = editing ? (isTransfer ? 'Ubah pindah dompet' : `Ubah ${meta.label.toLowerCase()}`) : 'Catat'
  return (
    <Modal open onClose={onClose} title={title}
      footer={<>
        {editing && <button type="button" className="btn-danger mr-auto" onClick={del} disabled={busy}><Trash2 size={16} /> {confirmDel ? 'Yakin hapus?' : 'Hapus'}</button>}
        <button type="button" className="btn-ghost" onClick={onClose}>Batal</button>
        <button type="submit" form="tx-form" className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
      </>}>
      <form id="tx-form" onSubmit={submit} className="space-y-5">
        {!editing && (
          <div className="grid grid-cols-4 border-b border-line" role="tablist">
            {TABS.map((t) => (
              <button type="button" role="tab" key={t.value} aria-selected={kind === t.value} onClick={() => { setKind(t.value); setCategory(''); setErr('') }}
                className={`-mb-px border-b-2 pb-2 text-sm font-semibold transition ${kind === t.value ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'}`}>
                {t.label}
              </button>
            ))}
          </div>
        )}
        <div>
          <label className="eyebrow mb-1 block" htmlFor="amount">{isTransfer ? 'Nominal dipindah' : `Nominal ${meta.label.toLowerCase()}`}</label>
          <AmountInput value={amount} onChange={setAmount} autoFocus={!editing} tone={tone ? tone.text : 'text-ink'} />
        </div>

        {isTransfer ? (
          <div className="space-y-4">
            <AccountPicker label="Dari dompet" accounts={balances} value={account} onChange={(v) => { setAccount(v); if (v === toAccount) setToAccount(balances.find((a) => a.id !== v)?.id) }} />
            <div className="flex items-center gap-2 text-muted"><ArrowRightLeft size={16} /><span className="h-px flex-1 bg-line" /></div>
            {balances.length > 1
              ? <AccountPicker label="Ke dompet" accounts={balances} value={toAccount} onChange={setToAccount} exclude={account} />
              : <p className="rounded-md border border-dashed border-rule p-3 text-sm text-muted">Butuh minimal 2 dompet. Tambahkan dompet baru (mis. rekening bank atau e-wallet) dari menu samping.</p>}
          </div>
        ) : (
          <>
            <div>
              <span className="eyebrow mb-2 block">Kategori</span>
              <div className="flex flex-wrap gap-1.5">
                {cats.map((c) => {
                  const on = category === c.name
                  const Icon = c.icon
                  return (
                    <button type="button" key={c.name} onClick={() => setCategory(c.name)} aria-pressed={on}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${on ? `border-transparent font-semibold ring-2 ${tone.ring} ${tone.bg} ${tone.text}` : 'border-rule hover:border-ink/50'}`}>
                      <Icon size={15} className={on ? '' : 'text-muted'} /> {c.name}
                    </button>
                  )
                })}
                {newCat === null && (
                  <button type="button" onClick={() => setNewCat('')} className="inline-flex items-center gap-1 rounded-full border border-dashed border-rule px-3 py-1.5 text-sm text-muted hover:border-ink hover:text-ink">
                    <Plus size={15} /> Kategori baru
                  </button>
                )}
              </div>
              {newCat !== null && (
                <div className="mt-2 flex gap-2">
                  <input autoFocus className="input !py-2" maxLength={40} placeholder="Nama kategori baru, mis. Cicilan motor" value={newCat}
                    onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory() } if (e.key === 'Escape') { e.stopPropagation(); setNewCat(null) } }} />
                  <button type="button" className="btn-primary !px-3" onClick={addCategory} aria-label="Simpan kategori"><Check size={18} /></button>
                </div>
              )}
            </div>
            {balances.length > 0 && <AccountPicker label={kind === 'pemasukan' ? 'Masuk ke dompet' : 'Dibayar dari dompet'} accounts={balances} value={account} onChange={setAccount} />}
          </>
        )}

        <div className="grid gap-4 sm:grid-cols-[11rem_1fr]">
          <div>
            <label className="label" htmlFor="tx-date">Tanggal</label>
            <input id="tx-date" type="date" className="input" value={date} max="2100-12-31" onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="tx-note">Keterangan <span className="font-normal text-muted">(opsional)</span></label>
            <input id="tx-note" className="input" maxLength={200} placeholder={isTransfer ? 'mis. Tarik tunai ATM' : meta.placeholder} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <ErrorText>{err}</ErrorText>
      </form>
    </Modal>
  )
}
