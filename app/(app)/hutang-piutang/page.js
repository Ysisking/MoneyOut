'use client'
import { useMemo, useState } from 'react'
import { Plus, HandCoins, Pencil, Trash2, CircleCheck, CalendarClock, ChevronDown } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { Modal, Segmented, EmptyState, ErrorText, PageHeader } from '@/components/ui'
import AmountInput from '@/components/AmountInput'
import { rupiah, todayISO, dateShort, daysUntil } from '@/lib/format'
import { debtInfo } from '@/lib/stats'

const KIND = {
  hutang: { label: 'Hutang', who: 'Pemberi pinjaman', desc: 'Uang yang saya pinjam dari orang lain', pay: 'Catat pembayaran', placeholder: 'mis. Mas Andi, Koperasi kantor' },
  piutang: { label: 'Piutang', who: 'Peminjam', desc: 'Uang saya yang dipinjam orang lain', pay: 'Catat uang kembali', placeholder: 'mis. Rina, teman kos' },
}

export default function HutangPiutang() {
  const { debts, payments } = useData()
  const [tab, setTab] = useState('hutang')
  const [status, setStatus] = useState('aktif')
  const [form, setForm] = useState(null)   // { debt? }
  const [payFor, setPayFor] = useState(null) // { debt, remaining }

  const rows = useMemo(() => debts.map((d) => ({ d, ...debtInfo(d, payments) })), [debts, payments])
  const sum = (kind) => rows.filter((r) => r.d.kind === kind).reduce((s, r) => s + r.remaining, 0)
  const list = rows
    .filter((r) => r.d.kind === tab && (status === 'semua' || (status === 'lunas' ? r.done : !r.done)))
    .sort((a, b) => (a.done - b.done) || (a.d.due_date || '9999').localeCompare(b.d.due_date || '9999') || b.d.date.localeCompare(a.d.date))

  return (
    <div>
      <PageHeader title="Hutang & Piutang" desc="Catat siapa meminjam berapa, kapan jatuh tempo, dan cicilannya."
        action={<button className="btn-primary" onClick={() => setForm({})}><Plus size={18} /> Catat baru</button>} />

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        {['hutang', 'piutang'].map((k) => (
          <button key={k} onClick={() => setTab(k)} className={`card p-4 text-left transition ${tab === k ? 'ring-2 ring-brand' : 'hover:-translate-y-0.5'}`}>
            <p className="text-sm text-muted">{KIND[k].label} belum lunas</p>
            <p className={`tnum mt-0.5 text-2xl font-extrabold ${k === 'hutang' ? 'text-keluar-text' : 'text-utang-text'}`}>{rupiah(sum(k))}</p>
            <p className="mt-1 text-xs text-muted">{KIND[k].desc}</p>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented className="w-full sm:w-auto" value={tab} onChange={setTab} options={[{ value: 'hutang', label: 'Hutang saya' }, { value: 'piutang', label: 'Piutang saya' }]} />
        <Segmented className="w-full sm:w-auto" value={status} onChange={setStatus} options={[{ value: 'aktif', label: 'Belum lunas' }, { value: 'lunas', label: 'Lunas' }, { value: 'semua', label: 'Semua' }]} />
      </div>

      {list.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((r) => <DebtCard key={r.d.id} r={r} onEdit={() => setForm({ debt: r.d })} onPay={() => setPayFor(r)} />)}
        </div>
      ) : (
        <div className="card">
          <EmptyState icon={HandCoins} title={`Tidak ada ${KIND[tab].label.toLowerCase()} ${status === 'lunas' ? 'yang lunas' : status === 'aktif' ? 'yang aktif' : ''}`}
            text={KIND[tab].desc + '.'} action={<button className="btn-primary" onClick={() => setForm({ kind: tab })}><Plus size={16} /> Catat {KIND[tab].label.toLowerCase()}</button>} />
        </div>
      )}

      {form && <DebtForm init={form} defaultKind={tab} onClose={() => setForm(null)} />}
      {payFor && <PaymentForm r={payFor} onClose={() => setPayFor(null)} />}
    </div>
  )
}

function DebtCard({ r, onEdit, onPay }) {
  const { remove } = useData()
  const [open, setOpen] = useState(false)
  const { d, paid, remaining, done, progress } = r
  const n = d.due_date ? daysUntil(d.due_date) : null
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold uppercase ${d.kind === 'hutang' ? 'bg-keluar-soft text-keluar-text' : 'bg-utang-soft text-utang-text'}`}>{d.person.slice(0, 2)}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{d.person}</p>
          <p className="truncate text-xs text-muted">{dateShort(d.date)}{d.note ? ` · ${d.note}` : ''}</p>
        </div>
        {done ? (
          <span className="flex items-center gap-1 rounded-full bg-masuk-soft px-2 py-0.5 text-xs font-semibold text-masuk-text"><CircleCheck size={13} /> Lunas</span>
        ) : n !== null && (
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${n < 0 ? 'bg-red-50 text-red-700' : n <= 7 ? 'bg-utang-soft text-utang-text' : 'bg-canvas text-muted'}`}>
            <CalendarClock size={13} /> {n < 0 ? `Lewat ${-n} hari` : n === 0 ? 'Hari ini' : dateShort(d.due_date)}
          </span>
        )}
      </div>
      <div className="mt-4 flex items-end justify-between text-sm">
        <div><p className="text-xs text-muted">Sisa</p><p className="tnum text-lg font-extrabold">{rupiah(remaining)}</p></div>
        <p className="tnum text-right text-xs text-muted">Dibayar {rupiah(paid)}<br />dari {rupiah(d.amount)}</p>
      </div>
      <div className="mt-2 h-2 rounded-full bg-canvas" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-2 rounded-full bg-masuk" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {!done && <button className="btn-primary !px-3 !py-2" onClick={onPay}>{KIND[d.kind].pay}</button>}
        <button className="btn-ghost !px-3 !py-2" onClick={onEdit} aria-label="Ubah"><Pencil size={15} /> Ubah</button>
        {r.payments.length > 0 && (
          <button className="btn-ghost ml-auto !px-3 !py-2" onClick={() => setOpen(!open)} aria-expanded={open}>
            {r.payments.length} pembayaran <ChevronDown size={15} className={open ? 'rotate-180' : ''} />
          </button>
        )}
      </div>
      {open && (
        <ul className="mt-3 divide-y divide-line rounded-xl border border-line text-sm">
          {r.payments.map((p) => (
            <li key={p.id} className="flex items-center gap-2 px-3 py-2">
              <span className="flex-1 text-muted">{dateShort(p.date)}{p.note ? ` · ${p.note}` : ''}</span>
              <span className="tnum font-semibold">{rupiah(p.amount)}</span>
              <button onClick={() => confirm('Hapus pembayaran ini?') && remove('payments', p.id)} className="rounded p-1 text-muted hover:text-red-700" aria-label="Hapus pembayaran"><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
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
    <Modal open onClose={onClose} title={d ? `Ubah ${KIND[kind].label.toLowerCase()}` : 'Catat hutang / piutang'}
      footer={<>
        {d && <button className="btn-danger mr-auto" onClick={del} disabled={busy}><Trash2 size={16} /> {confirmDel ? 'Yakin hapus?' : 'Hapus'}</button>}
        <button className="btn-ghost" onClick={onClose}>Batal</button>
        <button form="debt-form" className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
      </>}>
      <form id="debt-form" onSubmit={submit} className="space-y-4">
        <div>
          <Segmented className="w-full" value={kind} onChange={setKind} options={[{ value: 'hutang', label: 'Saya berhutang' }, { value: 'piutang', label: 'Orang berhutang ke saya' }]} />
          <p className="mt-1.5 text-xs text-muted">{KIND[kind].desc}.</p>
        </div>
        <div>
          <label className="label" htmlFor="person">{KIND[kind].who}</label>
          <input id="person" className="input" maxLength={60} placeholder={KIND[kind].placeholder} value={person} onChange={(e) => setPerson(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="amount">Jumlah pinjaman</label>
          <AmountInput value={amount} onChange={setAmount} quick={false} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="d-date">Tanggal pinjam</label><input id="d-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><label className="label" htmlFor="d-due">Jatuh tempo <span className="font-normal text-muted">(opsional)</span></label><input id="d-due" type="date" className="input" value={due} min={date} onChange={(e) => setDue(e.target.value)} /></div>
        </div>
        <div><label className="label" htmlFor="d-note">Catatan <span className="font-normal text-muted">(opsional)</span></label><input id="d-note" className="input" maxLength={200} placeholder="mis. Untuk servis motor, dicicil 3x" value={note} onChange={(e) => setNote(e.target.value)} /></div>
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
    <Modal open onClose={onClose} title={`${KIND[r.d.kind].pay} · ${r.d.person}`}
      footer={<><button className="btn-ghost" onClick={onClose}>Batal</button><button form="pay-form" className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button></>}>
      <form id="pay-form" onSubmit={submit} className="space-y-4">
        <p className="rounded-xl bg-canvas px-3.5 py-2.5 text-sm">Sisa saat ini <b className="tnum">{rupiah(r.remaining)}</b></p>
        <div><label className="label" htmlFor="amount">Nominal dibayar</label><AmountInput value={amount} onChange={setAmount} quick={false} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="p-date">Tanggal</label><input id="p-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><label className="label" htmlFor="p-note">Catatan</label><input id="p-note" className="input" maxLength={200} placeholder="mis. Cicilan ke-1" value={note} onChange={(e) => setNote(e.target.value)} /></div>
        </div>
        <ErrorText>{err}</ErrorText>
      </form>
    </Modal>
  )
}
