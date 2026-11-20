'use client'
import { useMemo, useState } from 'react'
import { Plus, HandCoins, Pencil, Trash2, ChevronDown, Check } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { Modal, Segmented, EmptyState, ErrorText, PageHeader, Progress } from '@/components/ui'
import AmountInput from '@/components/AmountInput'
import { rupiah, todayISO, dateShort, daysUntil } from '@/lib/format'
import { debtInfo } from '@/lib/stats'

const KIND = {
  hutang: { label: 'Hutang', tab: 'Hutang saya', who: 'Pemberi pinjaman', desc: 'Uang yang kamu pinjam', pay: 'Catat pembayaran', placeholder: 'Mas Andi, koperasi kantor' },
  piutang: { label: 'Piutang', tab: 'Piutang saya', who: 'Peminjam', desc: 'Uangmu yang dipinjam orang lain', pay: 'Catat uang kembali', placeholder: 'Rina, teman kos' },
}

function dueText(d, done) {
  if (done) return { t: 'Lunas', c: 'text-pos' }
  if (!d.due_date) return { t: 'Tanpa jatuh tempo', c: 'text-faint' }
  const n = daysUntil(d.due_date)
  if (n < 0) return { t: `Lewat ${-n} hari`, c: 'text-neg font-medium' }
  if (n === 0) return { t: 'Jatuh tempo hari ini', c: 'text-warn font-medium' }
  if (n <= 7) return { t: `${n} hari lagi`, c: 'text-warn' }
  return { t: `Jatuh tempo ${dateShort(d.due_date)}`, c: 'text-sub' }
}

export default function HutangPiutang() {
  const { debts, payments } = useData()
  const [tab, setTab] = useState('hutang')
  const [status, setStatus] = useState('aktif')
  const [form, setForm] = useState(null)
  const [payFor, setPayFor] = useState(null)

  const rows = useMemo(() => debts.map((d) => ({ d, ...debtInfo(d, payments) })), [debts, payments])
  const active = (k) => rows.filter((r) => r.d.kind === k && !r.done)
  const sum = (k) => active(k).reduce((s, r) => s + r.remaining, 0)
  const list = rows
    .filter((r) => r.d.kind === tab && (status === 'semua' || (status === 'lunas' ? r.done : !r.done)))
    .sort((a, b) => (a.done - b.done) || (a.d.due_date || '9999').localeCompare(b.d.due_date || '9999') || b.d.date.localeCompare(a.d.date))

  return (
    <div>
      <PageHeader title="Hutang & Piutang" desc="Catat pinjaman, jatuh tempo, dan cicilannya."
        action={<button className="btn-primary" onClick={() => setForm({ kind: tab })}><Plus size={16} /> Catat baru</button>} />

      <div className="panel mb-6 grid grid-cols-2 divide-x divide-line">
        {['hutang', 'piutang'].map((k) => (
          <button key={k} onClick={() => setTab(k)} className="px-5 py-4 text-left transition-colors hover:bg-subtle">
            <p className="text-sm text-sub">{k === 'hutang' ? 'Hutang belum lunas' : 'Piutang belum kembali'}</p>
            <p className="num mt-1 text-xl font-semibold tracking-tight">{rupiah(sum(k))}</p>
            <p className="mt-0.5 text-xs text-faint">{active(k).length} catatan aktif</p>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented value={tab} onChange={setTab} options={['hutang', 'piutang'].map((k) => ({ value: k, label: KIND[k].tab, count: active(k).length }))} />
        <select className="input h-9 w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="aktif">Belum lunas</option><option value="lunas">Lunas</option><option value="semua">Semua</option>
        </select>
      </div>

      <section className="panel overflow-hidden">
        {list.length ? (
          <ul className="divide-y divide-line">
            {list.map((r) => <DebtRow key={r.d.id} r={r} onEdit={() => setForm({ debt: r.d })} onPay={() => setPayFor(r)} />)}
          </ul>
        ) : (
          <EmptyState icon={HandCoins} title={status === 'lunas' ? 'Belum ada yang lunas' : `Tidak ada ${KIND[tab].label.toLowerCase()} aktif`} text={`${KIND[tab].desc}.`}
            action={<button className="btn-secondary" onClick={() => setForm({ kind: tab })}><Plus size={15} /> Catat {KIND[tab].label.toLowerCase()}</button>} />
        )}
      </section>

      {form && <DebtForm init={form} defaultKind={tab} onClose={() => setForm(null)} />}
      {payFor && <PaymentForm r={payFor} onClose={() => setPayFor(null)} />}
    </div>
  )
}

function DebtRow({ r, onEdit, onPay }) {
  const { remove } = useData()
  const [open, setOpen] = useState(false)
  const { d, paid, remaining, done, progress } = r
  const due = dueText(d, done)
  return (
    <li>
      <div className="grid grid-flow-dense grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-5 py-4 md:grid-flow-row md:grid-cols-[2.25rem_minmax(0,1fr)_13rem_8.5rem_7.5rem]">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-subtle text-xs font-semibold uppercase">{done ? <Check size={15} className="text-pos" /> : d.person.slice(0, 2)}</span>
        <div className="min-w-0">
          <p className={`truncate text-base font-medium ${done ? 'text-sub' : ''}`}>{d.person}</p>
          <p className="truncate text-sm"><span className={due.c}>{due.t}</span>{d.note && <span className="text-sub"> · {d.note}</span>}</p>
        </div>
        <div className="col-span-2 col-start-2 md:col-span-1 md:col-start-auto">
          <Progress value={progress} color={done ? '#0B7A57' : '#111'} />
          <p className="num mt-1.5 whitespace-nowrap text-xs text-sub">{Math.round(progress * 100)}% · {rupiah(paid)} dari {rupiah(d.amount)}</p>
        </div>
        <div className="text-right">
          <p className="num text-base font-medium">{rupiah(remaining)}</p>
          <p className="text-xs text-faint">sisa</p>
        </div>
        <div className="col-span-2 col-start-2 flex items-center gap-1 md:col-span-1 md:col-start-auto md:justify-end">
          {!done && <button className="btn-secondary h-8 px-3" onClick={onPay}>{d.kind === 'hutang' ? 'Bayar' : 'Terima'}</button>}
          <button className="btn-ghost h-8 w-8 px-0" onClick={onEdit} aria-label="Ubah" title="Ubah"><Pencil size={15} /></button>
          <button className="btn-ghost h-8 w-8 px-0" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Riwayat pembayaran" title="Riwayat pembayaran" disabled={!r.payments.length}><ChevronDown size={16} className={open ? 'rotate-180' : ''} /></button>
        </div>
      </div>
      {open && (
        <ul className="mx-5 mb-4 divide-y divide-line rounded-lg bg-subtle text-sm">
          {r.payments.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3.5 py-2">
              <span className="flex-1 text-sub">{dateShort(p.date)}{p.note && ` · ${p.note}`}</span>
              <span className="num font-medium">{rupiah(p.amount)}</span>
              <button onClick={() => confirm('Hapus pembayaran ini?') && remove('payments', p.id)} className="rounded p-1 text-faint hover:text-neg" aria-label="Hapus pembayaran"><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

function DebtForm({ init, defaultKind, onClose }) {
  const { save, remove } = useData()
  const d = init.debt
  const [kind, setKind] = useState(d?.kind || init.kind || defaultKind)
  const [person, setPerson] = useState(d?.person || '')
  const [amount, setAmount] = useState(d ? Number(d.amount) : 0)
  const [date, setDate] = useState(d?.date || todayISO())
  const [due, setDue] = useState(d?.due_date || '')
  const [note, setNote] = useState(d?.note || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!person.trim()) return setErr(`Isi nama ${KIND[kind].who.toLowerCase()}.`)
    if (!amount) return setErr('Isi nominalnya.')
    if (due && due < date) return setErr('Jatuh tempo tidak boleh sebelum tanggal pinjam.')
    setBusy(true); setErr('')
    try {
      await save('debts', { ...(d ? { id: d.id } : {}), kind, person: person.trim(), amount, date, due_date: due || null, note: note.trim() })
      onClose()
    } catch (e2) { setErr(e2.message); setBusy(false) }
  }
  async function del() {
    if (!confirmDel) return setConfirmDel(true)
    setBusy(true)
    try { await remove('debts', d.id); onClose() } catch (e2) { setErr(e2.message); setBusy(false) }
  }

  return (
    <Modal open onClose={onClose} title={d ? `Ubah ${KIND[kind].label.toLowerCase()}` : 'Hutang atau piutang baru'}
      footer={<>
        {d && <button className="btn-danger mr-auto" onClick={del} disabled={busy}>{confirmDel ? 'Klik lagi untuk hapus' : 'Hapus'}</button>}
        <button className="btn-secondary" onClick={onClose}>Batal</button>
        <button form="debt-form" className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
      </>}>
      <form id="debt-form" onSubmit={submit} className="space-y-5">
        <Segmented className="flex w-full" value={kind} onChange={setKind} options={[{ value: 'hutang', label: 'Saya meminjam' }, { value: 'piutang', label: 'Saya meminjamkan' }]} />
        <div><label className="field-label" htmlFor="person">{KIND[kind].who}</label><input id="person" className="input" maxLength={60} placeholder={KIND[kind].placeholder} value={person} onChange={(e) => setPerson(e.target.value)} /></div>
        <AmountInput label="Jumlah" align="left" value={amount} onChange={setAmount} quick={false} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="field-label" htmlFor="d-date">Tanggal</label><input id="d-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><label className="field-label" htmlFor="d-due">Jatuh tempo <span className="font-normal text-faint">(opsional)</span></label><input id="d-due" type="date" className="input" value={due} min={date} onChange={(e) => setDue(e.target.value)} /></div>
        </div>
        <div><label className="field-label" htmlFor="d-note">Catatan</label><input id="d-note" className="input" maxLength={200} placeholder="Untuk servis motor, dicicil 3 kali" value={note} onChange={(e) => setNote(e.target.value)} /></div>
        <ErrorText>{err}</ErrorText>
      </form>
    </Modal>
  )
}

function PaymentForm({ r, onClose }) {
  const { save } = useData()
  const [amount, setAmount] = useState(r.remaining)
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!amount) return setErr('Isi nominalnya.')
    if (amount > r.remaining) return setErr(`Melebihi sisa ${rupiah(r.remaining)}.`)
    setBusy(true); setErr('')
    try { await save('payments', { debt_id: r.d.id, amount, date, note: note.trim() }); onClose() } catch (e2) { setErr(e2.message); setBusy(false) }
  }

  return (
    <Modal open onClose={onClose} title={KIND[r.d.kind].pay} description={`${r.d.person} · sisa ${rupiah(r.remaining)}`}
      footer={<><button className="btn-secondary" onClick={onClose}>Batal</button><button form="pay-form" className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button></>}>
      <form id="pay-form" onSubmit={submit} className="space-y-5">
        <AmountInput label="Nominal" align="left" value={amount} onChange={setAmount} quick={false} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="field-label" htmlFor="p-date">Tanggal</label><input id="p-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><label className="field-label" htmlFor="p-note">Catatan</label><input id="p-note" className="input" maxLength={200} placeholder="Cicilan ke-1" value={note} onChange={(e) => setNote(e.target.value)} /></div>
        </div>
        <ErrorText>{err}</ErrorText>
      </form>
    </Modal>
  )
}
