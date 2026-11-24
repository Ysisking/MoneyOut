'use client'
import { useState } from 'react'
import { Modal, ErrorText, Segmented } from './ui'
import AmountInput from './AmountInput'
import AccountSelect from './AccountPicker'
import { useData } from './DataProvider'
import { categoriesFor } from '@/lib/categories'
import { EVERY, dueDate } from '@/lib/bills'
import { thisMonth, todayISO, rupiah, monthLabel } from '@/lib/format'

// Template tagihan pribadi yang umum.
export const TEMPLATES = [
  { name: 'Ganti oli motor', kind: 'pengeluaran', category: 'Transportasi', amount: 65000, every_months: 2 },
  { name: 'Salon / pangkas rambut', kind: 'pengeluaran', category: 'Pengeluaran Lain', amount: 75000, every_months: 1 },
  { name: 'Belanja bulanan', kind: 'pengeluaran', category: 'Belanja Bulanan', amount: 900000, every_months: 1 },
  { name: 'Kirim uang orang tua', kind: 'pengeluaran', category: 'Keluarga & Anak', amount: 1000000, every_months: 1 },
  { name: 'Listrik & air', kind: 'pengeluaran', category: 'Tagihan & Listrik', amount: 400000, every_months: 1 },
  { name: 'Internet rumah', kind: 'pengeluaran', category: 'Pulsa & Internet', amount: 300000, every_months: 1 },
  { name: 'Tabungan rutin', kind: 'simpanan', category: 'Tabungan', amount: 500000, every_months: 1 },
]

export function BillForm({ bill, orgId = null, template, onClose }) {
  const { save, remove, categories, balances } = useData()
  const base = bill || template || {}
  const org = !!(bill?.org_id || orgId)
  const [kind, setKind] = useState(base.kind || (org ? 'iuran' : 'pengeluaran'))
  const [name, setName] = useState(base.name || '')
  const [category, setCategory] = useState(base.category || '')
  const [amount, setAmount] = useState(base.amount ? Number(base.amount) : 0)
  const [day, setDay] = useState(base.day || Math.min(28, Number(todayISO().slice(8))))
  const [every, setEvery] = useState(base.every_months || 1)
  const [start, setStart] = useState(base.start_month || thisMonth())
  const [account, setAccount] = useState(base.account_id || balances[0]?.id)
  const [active, setActive] = useState(bill ? bill.active : true)
  const [note, setNote] = useState(base.note || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const cats = org ? [] : categoriesFor(kind, categories)

  async function submit(e) {
    e.preventDefault()
    if (!name.trim()) return setErr('Beri nama tagihan.')
    if (!amount) return setErr('Isi nominalnya.')
    if (!org && !category) return setErr('Pilih kategori.')
    setBusy(true); setErr('')
    try {
      await save('bills', { ...(bill ? { id: bill.id } : {}), org_id: bill?.org_id || orgId, name: name.trim(), kind, category: org ? name.trim().slice(0, 40) : category, amount, day: Number(day), every_months: Number(every), start_month: start, account_id: org ? null : account || null, active, note: note.trim() })
      onClose()
    } catch (e2) { setErr(e2.message); setBusy(false) }
  }
  async function del() {
    if (!confirmDel) return setConfirmDel(true)
    setBusy(true)
    try { await remove('bills', bill.id); onClose() } catch (e2) { setErr(e2.message); setBusy(false) }
  }

  return (
    <Modal open onClose={onClose} title={bill ? 'Ubah tagihan terjadwal' : 'Tagihan terjadwal baru'} description={org ? 'Iuran ditagihkan ke setiap anggota aktif; pengeluaran dibayar dari kas instansi.' : 'Pengingat pembayaran rutin. Tombol Bayar langsung mencatat transaksinya.'}
      footer={<>
        {bill && <button type="button" className="btn-danger mr-auto" onClick={del} disabled={busy}>{confirmDel ? 'Klik lagi untuk hapus' : 'Hapus'}</button>}
        <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
        <button form="bill-form" className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
      </>}>
      <form id="bill-form" onSubmit={submit} className="space-y-5">
        <Segmented className="flex w-full" value={kind} onChange={(k) => { setKind(k); setCategory('') }}
          options={org ? [{ value: 'iuran', label: 'Iuran anggota' }, { value: 'keluar', label: 'Pengeluaran instansi' }] : [{ value: 'pengeluaran', label: 'Pengeluaran' }, { value: 'simpanan', label: 'Simpanan' }]} />
        <div><label className="field-label" htmlFor="bill-name">Nama</label><input id="bill-name" className="input" maxLength={80} placeholder={org ? (kind === 'iuran' ? 'Iuran kas bulanan' : 'Sewa ruang rapat') : 'Ganti oli motor'} value={name} onChange={(e) => setName(e.target.value)} /></div>
        {!org && (
          <div><label className="field-label" htmlFor="bill-cat">Kategori</label>
            <select id="bill-cat" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Pilih kategori</option>{cats.map((c) => <option key={c.name}>{c.name}</option>)}
            </select></div>
        )}
        <AmountInput label={org && kind === 'iuran' ? 'Iuran per anggota' : 'Nominal'} align="left" value={amount} onChange={setAmount} quick={false} />
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className="field-label" htmlFor="bill-day">Tanggal</label>
            <select id="bill-day" className="input" value={day} onChange={(e) => setDay(e.target.value)}>{Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>Tgl {i + 1}</option>)}</select></div>
          <div><label className="field-label" htmlFor="bill-every">Ulangi</label>
            <select id="bill-every" className="input" value={every} onChange={(e) => setEvery(e.target.value)}>{Object.entries(EVERY).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
          <div><label className="field-label" htmlFor="bill-start">Mulai</label><input id="bill-start" type="month" className="input" value={start} onChange={(e) => setStart(e.target.value)} /></div>
        </div>
        {Number(day) > 28 && <p className="-mt-3 text-xs text-sub">Di bulan yang lebih pendek, jatuh tempo pindah ke tanggal terakhir bulan itu.</p>}
        {!org && balances.length > 0 && <AccountSelect id="bill-acc" label="Dibayar dari" accounts={balances} value={account} onChange={setAccount} />}
        <div><label className="field-label" htmlFor="bill-note">Catatan</label><input id="bill-note" className="input" maxLength={200} placeholder="Opsional" value={note} onChange={(e) => setNote(e.target.value)} /></div>
        {bill && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Tagihan aktif</label>}
        <ErrorText>{err}</ErrorText>
      </form>
    </Modal>
  )
}

export function PayBillForm({ bill, period, member, onClose, onDone }) {
  const { payBill, balances } = useData()
  const [amount, setAmount] = useState(Number(bill.amount))
  const [date, setDate] = useState(todayISO())
  const [account, setAccount] = useState(bill.account_id || balances[0]?.id)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function submit(e) {
    e.preventDefault()
    if (!amount) return setErr('Isi nominalnya.')
    setBusy(true); setErr('')
    try { const t = await payBill(bill, period, { amount, date, accountId: account, memberId: member?.id || null }); onDone?.(t); onClose() } catch (e2) { setErr(e2.message); setBusy(false) }
  }
  const isIuran = bill.kind === 'iuran'
  return (
    <Modal open onClose={onClose} title={isIuran ? `Terima iuran · ${member?.name}` : `Bayar · ${bill.name}`} description={`Periode ${monthLabel(period)} · jatuh tempo ${dueDate(bill, period).slice(8)} · tagihan ${rupiah(bill.amount)}`}
      footer={<><button className="btn-secondary" onClick={onClose}>Batal</button><button form="pay-bill" className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : isIuran ? 'Tandai lunas' : 'Bayar & catat'}</button></>}>
      <form id="pay-bill" onSubmit={submit} className="space-y-5">
        <AmountInput label="Nominal" align="left" value={amount} onChange={setAmount} quick={false} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="field-label" htmlFor="pb-date">Tanggal</label><input id="pb-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          {!bill.org_id && balances.length > 0 && <AccountSelect id="pb-acc" label="Dari dompet" accounts={balances} value={account} onChange={setAccount} />}
        </div>
        <p className="text-sm text-sub">{bill.org_id ? (isIuran ? 'Dicatat sebagai uang masuk kas instansi.' : 'Dibayar dari kas instansi. Bila kas kurang, kekurangannya ditalangi dari dompet pribadimu.') : `Dicatat sebagai ${bill.kind} "${bill.category}" di dompet terpilih.`}</p>
        <ErrorText>{err}</ErrorText>
      </form>
    </Modal>
  )
}
