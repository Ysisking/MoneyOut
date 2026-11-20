'use client'
import { useState } from 'react'
import { Trash2, Plus, Check } from 'lucide-react'
import { Modal, Segmented, ErrorText } from './ui'
import AmountInput from './AmountInput'
import { useData } from './DataProvider'
import { KINDS, KIND_ORDER, TONE, categoriesFor } from '@/lib/categories'
import { todayISO } from '@/lib/format'

export default function TxForm({ initial, onClose }) {
  const { categories, save, remove } = useData()
  const editing = !!initial.tx
  const [kind, setKind] = useState(initial.kind)
  const [amount, setAmount] = useState(initial.tx ? Number(initial.tx.amount) : 0)
  const [category, setCategory] = useState(initial.tx?.category || '')
  const [date, setDate] = useState(initial.tx?.date || todayISO())
  const [note, setNote] = useState(initial.tx?.note || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const [newCat, setNewCat] = useState(null) // null = tertutup, string = sedang diketik

  const cats = categoriesFor(kind, categories)
  const meta = KINDS[kind]
  const tone = TONE[meta.tone]

  async function submit(e) {
    e?.preventDefault()
    if (!amount) return setErr('Isi nominalnya dulu.')
    if (!category) return setErr('Pilih kategori.')
    if (!date) return setErr('Isi tanggalnya.')
    setBusy(true); setErr('')
    try {
      await save('transactions', { ...(editing ? { id: initial.tx.id } : {}), kind, amount, category, date, note: note.trim() })
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
    try { await remove('transactions', initial.tx.id); onClose() } catch (e2) { setErr(e2.message); setBusy(false) }
  }

  return (
    <Modal open onClose={onClose} title={editing ? `Ubah ${meta.label.toLowerCase()}` : 'Catat transaksi'}
      footer={<>
        {editing && (
          <button type="button" className="btn-danger mr-auto" onClick={del} disabled={busy}>
            <Trash2 size={16} /> {confirmDel ? 'Yakin hapus?' : 'Hapus'}
          </button>
        )}
        <button type="button" className="btn-ghost" onClick={onClose}>Batal</button>
        <button type="submit" form="tx-form" className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
      </>}>
      <form id="tx-form" onSubmit={submit} className="space-y-4">
        {!editing && (
          <Segmented className="w-full" value={kind} onChange={(k) => { setKind(k); setCategory('') }}
            options={KIND_ORDER.map((k) => ({ value: k, label: KINDS[k].label }))} />
        )}
        <div>
          <label className="label" htmlFor="amount">Nominal</label>
          <AmountInput value={amount} onChange={setAmount} autoFocus={!editing} />
        </div>
        <div>
          <span className="label">Kategori</span>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {cats.map((c) => {
              const on = category === c.name
              const Icon = c.icon
              return (
                <button type="button" key={c.name} onClick={() => setCategory(c.name)} aria-pressed={on}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center text-xs font-medium leading-tight transition ${on ? `border-transparent ring-2 ${tone.ring} ${tone.bg}` : 'border-line hover:border-brand/40'}`}>
                  <span className={`rounded-lg p-1.5 ${on ? 'bg-white' : tone.bg} ${tone.text}`}><Icon size={18} /></span>
                  {c.name}
                </button>
              )
            })}
            {newCat === null && (
              <button type="button" onClick={() => setNewCat('')}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line p-2.5 text-xs font-medium text-muted hover:border-brand/50 hover:text-brand">
                <span className="rounded-lg bg-canvas p-1.5"><Plus size={18} /></span> Kategori baru
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="tx-date">Tanggal</label>
            <input id="tx-date" type="date" className="input" value={date} max="2100-12-31" onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="tx-note">Catatan <span className="font-normal text-muted">(opsional)</span></label>
            <input id="tx-note" className="input" maxLength={200} placeholder={meta.placeholder} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <ErrorText>{err}</ErrorText>
      </form>
    </Modal>
  )
}
