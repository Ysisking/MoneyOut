'use client'
import { useState } from 'react'
import { ExternalLink, Plus } from 'lucide-react'
import { Modal, ErrorText, Segmented } from './ui'
import AmountInput from './AmountInput'
import AccountSelect from './AccountPicker'
import { useData } from './DataProvider'
import { KINDS, categoriesFor } from '@/lib/categories'
import { rupiah, todayISO } from '@/lib/format'
import { ORDERBOOK_WEB, isFromOrderBook, stripOrderBook } from '@/lib/orderbook'

const TYPES = [
  { value: 'pengeluaran', label: 'Pengeluaran' },
  { value: 'pemasukan', label: 'Pemasukan' },
  { value: 'simpanan', label: 'Simpanan' },
  { value: 'transfer', label: 'Pindah' },
]
const LAST = 'moneyout:lastAccount'
const lastAccount = () => { try { return localStorage.getItem(LAST) } catch { return null } }

export default function TxForm({ initial, onClose }) {
  // Pemasukan dari OrderBook dikelola OrderBook: tampil hanya-baca (perubahan di sini akan ditimpa sinkron berikutnya).
  if (initial.tx && isFromOrderBook(initial.tx.note)) return <OrderBookTx tx={initial.tx} onClose={onClose} />
  return <TxEditor initial={initial} onClose={onClose} />
}

function OrderBookTx({ tx, onClose }) {
  const { accounts } = useData()
  const acc = accounts.find((a) => a.id === tx.account_id)?.name
  const rows = [['Kategori', tx.category], ['Tanggal', new Date(tx.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })], ['Dompet', acc || '—'], ['Catatan', stripOrderBook(tx.note)]]
  return (
    <Modal open onClose={onClose} title="Pemasukan dari OrderBook"
      footer={<>
        <button type="button" className="btn-secondary" onClick={onClose}>Tutup</button>
        <a className="btn-primary" href={`${ORDERBOOK_WEB}/riwayat`} target="_blank" rel="noreferrer">Buka OrderBook <ExternalLink size={14} /></a>
      </>}>
      <div className="space-y-5">
        <p className="num text-3xl font-semibold text-pos">+{rupiah(Number(tx.amount))}</p>
        <dl className="divide-y divide-line border-y border-line text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[7rem_1fr] gap-3 py-2.5"><dt className="text-sub">{k}</dt><dd className="min-w-0 break-words">{v}</dd></div>
          ))}
        </dl>
        <p className="rounded-lg bg-subtle p-3 text-sm text-sub">
          Transaksi ini dikirim otomatis dari akun OrderBook Anda (email yang sama). Untuk mengubah atau menghapusnya, ubah order di OrderBook
          (mis. pulihkan dari Riwayat atau ubah harganya), lalu MoneyOut ikut menyesuaikan. Pengaturan sinkron ada di OrderBook → Pengaturan → Aplikasi terhubung.
        </p>
      </div>
    </Modal>
  )
}

function TxEditor({ initial, onClose }) {
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

  return (
    <Modal open onClose={onClose} title={editing ? 'Ubah transaksi' : 'Transaksi baru'}
      footer={<>
        {editing && <button type="button" className="btn-danger mr-auto" onClick={del} disabled={busy}>{confirmDel ? 'Klik lagi untuk hapus' : 'Hapus'}</button>}
        <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
        <button type="submit" form="tx-form" className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
      </>}>
      <form id="tx-form" onSubmit={submit} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e) }} className="space-y-6">
        {!editing && <Segmented className="flex w-full" value={kind} onChange={(k) => { setKind(k); setCategory(''); setErr('') }} options={TYPES} />}

        <div className="py-2"><AmountInput value={amount} onChange={setAmount} autoFocus={!editing} /></div>

        {isTransfer ? (
          balances.length > 1 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <AccountSelect id="from" label="Dari" accounts={balances} value={account} onChange={(v) => { setAccount(v); if (v === toAccount) setToAccount(balances.find((a) => a.id !== v)?.id) }} />
              <AccountSelect id="to" label="Ke" accounts={balances} value={toAccount} onChange={setToAccount} exclude={account} />
            </div>
          ) : <p className="rounded-lg bg-subtle p-3 text-sm text-sub">Pindah dompet butuh minimal dua dompet. Tambahkan dompet lewat tombol + di bagian Dompet pada menu samping.</p>
        ) : (
          <>
            <fieldset>
              <legend className="field-label">Kategori</legend>
              <div className="flex flex-wrap gap-1.5">
                {cats.map((c) => {
                  const on = category === c.name
                  return (
                    <button type="button" key={c.name} onClick={() => setCategory(c.name)} aria-pressed={on}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition ${on ? 'border-ink bg-ink text-white' : 'border-line text-ink hover:border-edge hover:bg-subtle'}`}>
                      <c.icon size={14} strokeWidth={1.8} className={on ? '' : 'text-sub'} /> {c.name}
                    </button>
                  )
                })}
                {newCat === null ? (
                  <button type="button" onClick={() => setNewCat('')} className="inline-flex h-8 items-center gap-1 rounded-full border border-dashed border-edge px-3 text-sm text-sub hover:text-ink"><Plus size={14} /> Baru</button>
                ) : (
                  <span className="inline-flex h-8 items-center gap-1 rounded-full border border-ink pl-3 pr-1">
                    <input autoFocus className="w-36 bg-transparent text-sm outline-none" maxLength={40} placeholder="Nama kategori" value={newCat}
                      onChange={(e) => setNewCat(e.target.value)} onBlur={addCategory}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory() } if (e.key === 'Escape') { e.stopPropagation(); setNewCat(null) } }} />
                  </span>
                )}
              </div>
            </fieldset>
            {balances.length > 0 && <AccountSelect id="acc" label={kind === 'pemasukan' ? 'Masuk ke' : 'Dibayar dari'} accounts={balances} value={account} onChange={setAccount} />}
          </>
        )}

        <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <div>
            <label className="field-label" htmlFor="tx-date">Tanggal</label>
            <input id="tx-date" type="date" className="input" value={date} max="2100-12-31" onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="tx-note">Catatan</label>
            <input id="tx-note" className="input" maxLength={200} placeholder={isTransfer ? 'Tarik tunai, top up…' : meta.placeholder.replace(/^mis\. /, '')} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <ErrorText>{err}</ErrorText>
      </form>
    </Modal>
  )
}
