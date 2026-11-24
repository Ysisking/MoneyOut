'use client'
import { Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Pencil, Trash2, ArrowLeft, Building2, Check, Undo2, HandCoins, Info } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { PageHeader, Segmented, EmptyState, Modal, ErrorText, MonthSwitcher, IconBubble } from '@/components/ui'
import AmountInput from '@/components/AmountInput'
import AccountSelect from '@/components/AccountPicker'
import OrgForm from '@/components/OrgForm'
import { BillForm, PayBillForm } from '@/components/BillForms'
import { orgLedger, isDueIn, dueDate, EVERY } from '@/lib/bills'
import { rupiah, todayISO, thisMonth, dateShort, monthLabel } from '@/lib/format'

export default function Page() { return <Suspense fallback={null}><OrgDetail /></Suspense> }

const SOURCE = { talangan: 'Talangan', pengembalian: 'Pengembalian talangan', iuran: 'Iuran', tagihan: 'Tagihan rutin' }

function OrgDetail() {
  const id = useSearchParams().get('id')
  const router = useRouter()
  const data = useData()
  const org = data.orgs.find((o) => o.id === id)
  const [tab, setTab] = useState('kas')
  const [modal, setModal] = useState(null)
  const [notice, setNotice] = useState('')
  const L = useMemo(() => orgLedger(id, data.orgEntries), [id, data.orgEntries])
  if (!org) return <EmptyState icon={Building2} title="Profil instansi tidak ditemukan" action={<Link href="/instansi/" className="btn-secondary">Kembali</Link>} />
  const members = data.orgMembers.filter((m) => m.org_id === id)
  const bills = data.bills.filter((b) => b.org_id === id)
  const month = thisMonth()
  const inM = L.list.filter((e) => e.date.startsWith(month))
  const tal = (n) => n > 0 && setNotice(`Kas kurang ${rupiah(n)} — otomatis ditalangi dari dompet pribadimu dan dicatat sebagai talangan.`)

  return (
    <div>
      <PageHeader back={<Link href="/instansi/" className="mb-2 inline-flex items-center gap-1 text-sm text-sub hover:text-ink"><ArrowLeft size={14} /> Sistem Tagihan</Link>}
        title={org.name} desc={[org.unit, org.role && `Kamu: ${org.role}`].filter(Boolean).join(' · ') || 'Profil instansi'}
        action={<>
          <button className="btn-secondary w-9 px-0" onClick={() => setModal({ t: 'org' })} aria-label="Ubah profil" title="Ubah profil"><Pencil size={15} /></button>
          <button className="btn-primary" onClick={() => setModal({ t: 'entry' })}><Plus size={16} /> Catat kas</button>
        </>} />

      {notice && <p className="mb-4 flex items-start gap-2 rounded-lg border border-line bg-[#FDF6E7] px-4 py-3 text-sm"><Info size={16} className="mt-0.5 shrink-0 text-warn" /><span className="flex-1">{notice}</span><button className="text-sub hover:text-ink" onClick={() => setNotice('')}>Tutup</button></p>}

      <section className="panel mb-6 grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x [&>div]:px-5 [&>div]:py-4">
        <div><p className="text-sm text-sub">Saldo kas</p><p className="num mt-1 text-xl font-semibold">{rupiah(L.balance)}</p></div>
        <div><p className="text-sm text-sub">Masuk bulan ini</p><p className="num mt-1 text-xl font-semibold text-pos">{rupiah(inM.filter((e) => e.kind === 'masuk' && e.source !== 'talangan').reduce((s, e) => s + Number(e.amount), 0))}</p></div>
        <div><p className="text-sm text-sub">Keluar bulan ini</p><p className="num mt-1 text-xl font-semibold">{rupiah(inM.filter((e) => e.kind === 'keluar' && e.source !== 'pengembalian').reduce((s, e) => s + Number(e.amount), 0))}</p></div>
        <div>
          <p className="text-sm text-sub">Talangan belum kembali</p>
          <p className={`num mt-1 text-xl font-semibold ${L.outstanding ? 'text-warn' : ''}`}>{rupiah(L.outstanding)}</p>
          {L.outstanding > 0 && L.balance > 0 && <button className="mt-1 text-sm font-medium underline" onClick={() => setModal({ t: 'repay' })}>Kembalikan dari kas</button>}
        </div>
      </section>

      <Segmented className="mb-4" value={tab} onChange={setTab} options={[{ value: 'kas', label: 'Kas', count: L.list.length }, { value: 'tagihan', label: 'Iuran & tagihan', count: bills.length }, { value: 'anggota', label: 'Anggota', count: members.filter((m) => m.active).length }]} />
      {tab === 'kas' && <Kas L={L} members={members} onDelete={async (e) => tal(await data.removeOrgEntry(e))} />}
      {tab === 'tagihan' && <Tagihan org={org} bills={bills} members={members.filter((m) => m.active)} onTalangan={tal} setModal={setModal} />}
      {tab === 'anggota' && <Anggota members={members} setModal={setModal} />}

      {modal?.t === 'org' && <OrgForm org={org} onClose={(deleted) => { setModal(null); if (deleted === true) router.push('/instansi/') }} />}
      {modal?.t === 'entry' && <EntryForm org={org} members={members.filter((m) => m.active)} onClose={() => setModal(null)} onTalangan={tal} />}
      {modal?.t === 'repay' && <Repay org={org} L={L} onClose={() => setModal(null)} />}
      {modal?.t === 'member' && <MemberForm org={org} member={modal.member} onClose={() => setModal(null)} />}
      {modal?.t === 'bill' && <BillForm bill={modal.bill} orgId={org.id} onClose={() => setModal(null)} />}
      {modal?.t === 'pay' && <PayBillForm bill={modal.bill} period={modal.period} member={modal.member} onClose={() => setModal(null)} onDone={tal} />}
    </div>
  )
}

function Kas({ L, members, onDelete }) {
  const [confirm, setConfirm] = useState(null)
  const list = [...L.list].sort((a, b) => b.date.localeCompare(a.date) || String(b.created_at).localeCompare(String(a.created_at)))
  if (!list.length) return <div className="panel"><EmptyState compact title="Belum ada catatan kas" text="Catat uang masuk (iuran, dana dari instansi) dan uang keluar (konsumsi, ATK, sewa)." /></div>
  return (
    <section className="panel overflow-hidden">
      <ul className="divide-y divide-line">
        {list.map((e) => {
          const m = members.find((x) => x.id === e.member_id)
          return (
            <li key={e.id} className="flex items-center gap-3.5 px-5 py-3">
              <span className="num w-16 shrink-0 text-xs text-faint">{dateShort(e.date).replace(/ \d{4}$/, '')}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-medium">{e.note || e.category}</span>
                <span className="block truncate text-sm text-sub">{[SOURCE[e.source], e.category !== e.note && e.category, m?.name].filter(Boolean).join(' · ') || (e.kind === 'masuk' ? 'Uang masuk' : 'Uang keluar')}</span>
              </span>
              <span className={`num text-base font-medium ${e.kind === 'masuk' ? 'text-pos' : ''}`}>{e.kind === 'masuk' ? '+' : '−'}{rupiah(e.amount)}</span>
              <button className={`btn-ghost h-8 px-2 text-xs ${confirm === e.id ? 'text-neg' : ''}`} onClick={async () => { if (confirm !== e.id) return setConfirm(e.id); setConfirm(null); await onDelete(e) }} aria-label="Hapus catatan"><Trash2 size={14} />{confirm === e.id && ' Yakin?'}</button>
            </li>
          )
        })}
      </ul>
      <p className="flex gap-2 border-t border-line bg-subtle px-5 py-3 text-xs text-sub"><Info size={14} className="shrink-0" />Kas instansi tidak masuk ke dasbor, laporan, atau analisis pribadimu. Bila uang keluar melebihi uang masuk, kekurangannya otomatis ditalangi dari dompet pribadimu.</p>
    </section>
  )
}

function Tagihan({ org, bills, members, onTalangan, setModal }) {
  const { billPayments, skipBill, undoPayment, payBill } = useData()
  const [month, setMonth] = useState(thisMonth())
  const paid = (b, memberId) => billPayments.find((p) => p.bill_id === b.id && p.period === month && (memberId ? p.member_id === memberId : !p.member_id))
  const quickPaid = async (b, m) => onTalangan(await payBill(b, month, { amount: Number(b.amount), date: todayISO(), memberId: m.id }))
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthSwitcher value={month} onChange={setMonth} />
        <button className="btn-secondary" onClick={() => setModal({ t: 'bill' })}><Plus size={15} /> Tagihan terjadwal</button>
      </div>
      {!bills.length && <div className="panel"><EmptyState compact title="Belum ada tagihan terjadwal" text="Contoh: iuran kas Rp 50.000 per anggota setiap tanggal 5, atau sewa ruang rapat setiap bulan." /></div>}
      {bills.map((b) => {
        const due = isDueIn(b, month)
        const head = (
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5">
            <span className="min-w-0 flex-1">
              <button onClick={() => setModal({ t: 'bill', bill: b })} className="block truncate text-left text-base font-semibold hover:underline">{b.name}</button>
              <span className="block text-sm text-sub">{b.kind === 'iuran' ? 'Iuran per anggota' : 'Pengeluaran instansi'} · {rupiah(b.amount)} · {EVERY[b.every_months].toLowerCase()} tgl {b.day}{!b.active && ' · nonaktif'}</span>
            </span>
          </div>
        )
        if (!due || !b.active) return <section key={b.id} className="panel overflow-hidden opacity-70">{head}<p className="px-5 py-3 text-sm text-sub">{b.active ? `Tidak ada tagihan di ${monthLabel(month)}.` : 'Tagihan nonaktif.'}</p></section>
        if (b.kind === 'iuran') {
          const done = members.filter((m) => paid(b, m.id)?.amount > 0)
          const total = done.reduce((s, m) => s + Number(paid(b, m.id).amount), 0)
          return (
            <section key={b.id} className="panel overflow-hidden">
              {head}
              <div className="flex items-center justify-between gap-3 bg-subtle px-5 py-2 text-sm"><span className="text-sub">Jatuh tempo {dateShort(dueDate(b, month))} · <span className="text-ink">{done.length}/{members.length}</span> anggota lunas</span><span className="num font-medium">{rupiah(total)} / {rupiah(Number(b.amount) * members.length)}</span></div>
              {members.length ? (
                <ul className="divide-y divide-line">
                  {members.map((m) => {
                    const p = paid(b, m.id)
                    return (
                      <li key={m.id} className="flex items-center gap-3 px-5 py-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-subtle text-xs font-semibold uppercase">{p?.amount ? <Check size={14} className="text-pos" /> : m.name.slice(0, 2)}</span>
                        <span className="min-w-0 flex-1 truncate text-sm"><span className="font-medium">{m.name}</span>{m.role && <span className="text-sub"> · {m.role}</span>}</span>
                        {p ? (
                          <>
                            <span className={`text-sm ${p.amount ? 'text-pos' : 'text-faint'}`}>{p.amount ? `Lunas ${dateShort(p.date).replace(/ \d{4}$/, '')}` : 'Dibebaskan'}</span>
                            <button className="btn-ghost h-7 px-2 text-xs" onClick={async () => onTalangan(await undoPayment(p))} title="Batalkan"><Undo2 size={13} /></button>
                          </>
                        ) : (
                          <>
                            <button className="btn-ghost h-7 px-2 text-xs" onClick={() => skipBill(b, month, m.id)} title="Bebaskan iuran bulan ini">Bebaskan</button>
                            <button className="btn-secondary h-7 px-2.5 text-xs" onClick={() => setModal({ t: 'pay', bill: b, period: month, member: m })}>Nominal lain</button>
                            <button className="btn-primary h-7 px-2.5 text-xs" onClick={() => quickPaid(b, m)}><Check size={13} /> Lunas</button>
                          </>
                        )}
                      </li>
                    )
                  })}
                </ul>
              ) : <p className="px-5 py-4 text-sm text-sub">Belum ada anggota aktif.</p>}
            </section>
          )
        }
        const p = paid(b)
        return (
          <section key={b.id} className="panel overflow-hidden">
            {head}
            <div className="flex items-center gap-3 px-5 py-3 text-sm">
              <span className="flex-1 text-sub">Jatuh tempo {dateShort(dueDate(b, month))}</span>
              {p ? (<><span className={p.amount ? 'text-pos' : 'text-faint'}>{p.amount ? `Dibayar ${rupiah(p.amount)}` : 'Dilewati'}</span><button className="btn-ghost h-7 px-2 text-xs" onClick={async () => onTalangan(await undoPayment(p))}><Undo2 size={13} /> Batalkan</button></>)
                : (<><button className="btn-ghost h-8 px-2.5 text-xs" onClick={() => skipBill(b, month)}>Lewati</button><button className="btn-primary h-8 px-3" onClick={() => setModal({ t: 'pay', bill: b, period: month })}>Bayar dari kas</button></>)}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function Anggota({ members, setModal }) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5"><span className="text-sm text-sub">{members.filter((m) => m.active).length} aktif</span><button className="btn-secondary h-8 px-3" onClick={() => setModal({ t: 'member' })}><Plus size={14} /> Anggota</button></div>
      {members.length ? (
        <ul className="divide-y divide-line">
          {[...members].sort((a, b) => (b.active - a.active) || a.name.localeCompare(b.name)).map((m) => (
            <li key={m.id}>
              <button onClick={() => setModal({ t: 'member', member: m })} className={`flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-subtle ${m.active ? '' : 'opacity-50'}`}>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-subtle text-xs font-semibold uppercase">{m.name.slice(0, 2)}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-base font-medium">{m.name}</span><span className="block truncate text-sm text-sub">{[m.role, m.phone, !m.active && 'nonaktif'].filter(Boolean).join(' · ') || 'Anggota'}</span></span>
                <Pencil size={14} className="text-faint" />
              </button>
            </li>
          ))}
        </ul>
      ) : <EmptyState compact title="Belum ada anggota" />}
    </section>
  )
}

function EntryForm({ org, members, onClose, onTalangan }) {
  const { addOrgEntry } = useData()
  const [kind, setKind] = useState('keluar')
  const [amount, setAmount] = useState(0)
  const [category, setCategory] = useState('')
  const [memberId, setMemberId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const SUG = kind === 'masuk' ? ['Iuran anggota', 'Dana dari instansi', 'Donasi', 'Saldo awal kas'] : ['Konsumsi rapat', 'ATK', 'Transportasi', 'Sewa tempat', 'Hadiah / santunan']
  async function submit(e) {
    e.preventDefault()
    if (!amount) return setErr('Isi nominalnya.')
    if (!category.trim()) return setErr('Isi keterangan singkat.')
    setBusy(true); setErr('')
    try { const r = await addOrgEntry({ org_id: org.id, kind, source: 'manual', category: category.trim().slice(0, 40), amount, date, note: note.trim(), member_id: memberId || null }); onTalangan(r.talangan); onClose() } catch (e2) { setErr(e2.message); setBusy(false) }
  }
  return (
    <Modal open onClose={onClose} title={`Catat kas · ${org.name}`} footer={<><button className="btn-secondary" onClick={onClose}>Batal</button><button form="entry-form" className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button></>}>
      <form id="entry-form" onSubmit={submit} className="space-y-5">
        <Segmented className="flex w-full" value={kind} onChange={(k) => { setKind(k); setCategory('') }} options={[{ value: 'keluar', label: 'Uang keluar' }, { value: 'masuk', label: 'Uang masuk' }]} />
        <div className="py-1"><AmountInput value={amount} onChange={setAmount} autoFocus /></div>
        <div>
          <label className="field-label" htmlFor="en-cat">Untuk / dari</label>
          <input id="en-cat" className="input" maxLength={40} value={category} onChange={(e) => setCategory(e.target.value)} placeholder={SUG[0]} />
          <div className="mt-2 flex flex-wrap gap-1.5">{SUG.map((s) => <button type="button" key={s} onClick={() => setCategory(s)} className="h-7 rounded-full border border-line px-2.5 text-xs text-sub hover:text-ink">{s}</button>)}</div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="field-label" htmlFor="en-member">Anggota <span className="font-normal text-faint">(opsional)</span></label>
            <select id="en-member" className="input" value={memberId} onChange={(e) => setMemberId(e.target.value)}><option value="">—</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
          <div><label className="field-label" htmlFor="en-date">Tanggal</label><input id="en-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        </div>
        <div><label className="field-label" htmlFor="en-note">Catatan</label><input id="en-note" className="input" maxLength={200} placeholder="Opsional" value={note} onChange={(e) => setNote(e.target.value)} /></div>
        <ErrorText>{err}</ErrorText>
      </form>
    </Modal>
  )
}

function Repay({ org, L, onClose }) {
  const { repayTalangan, balances } = useData()
  const max = Math.min(L.balance, L.outstanding)
  const [amount, setAmount] = useState(max)
  const [account, setAccount] = useState(balances[0]?.id)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function submit(e) {
    e.preventDefault()
    if (!amount || amount > max) return setErr(`Maksimal ${rupiah(max)}.`)
    setBusy(true)
    try { await repayTalangan(org.id, amount, account); onClose() } catch (e2) { setErr(e2.message); setBusy(false) }
  }
  return (
    <Modal open onClose={onClose} title="Kembalikan talangan" description={`Talangan belum kembali ${rupiah(L.outstanding)} · saldo kas ${rupiah(L.balance)}`}
      footer={<><button className="btn-secondary" onClick={onClose}>Batal</button><button form="repay" className="btn-primary" disabled={busy}><HandCoins size={15} /> Kembalikan</button></>}>
      <form id="repay" onSubmit={submit} className="space-y-5">
        <AmountInput label="Nominal" align="left" value={amount} onChange={setAmount} quick={false} />
        {balances.length > 0 && <AccountSelect id="repay-acc" label="Masuk ke dompet" accounts={balances} value={account} onChange={setAccount} />}
        <p className="text-sm text-sub">Uang keluar dari kas instansi dan kembali ke dompet pribadimu.</p>
        <ErrorText>{err}</ErrorText>
      </form>
    </Modal>
  )
}

function MemberForm({ org, member, onClose }) {
  const { save, remove, billPayments, orgEntries } = useData()
  const [name, setName] = useState(member?.name || '')
  const [role, setRole] = useState(member?.role || '')
  const [phone, setPhone] = useState(member?.phone || '')
  const [active, setActive] = useState(member ? member.active : true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const used = member && (billPayments.some((p) => p.member_id === member.id) || orgEntries.some((e) => e.member_id === member.id))
  async function submit(e) {
    e.preventDefault()
    if (!name.trim()) return setErr('Isi nama anggota.')
    setBusy(true)
    try { await save('orgMembers', { ...(member ? { id: member.id } : {}), org_id: org.id, name: name.trim(), role: role.trim(), phone: phone.replace(/[^\d+]/g, '').slice(0, 20), active }); onClose() } catch (e2) { setErr(e2.message); setBusy(false) }
  }
  async function del() {
    if (used) return setErr('Anggota ini punya riwayat iuran. Nonaktifkan saja agar riwayatnya tetap ada.')
    setBusy(true)
    try { await remove('orgMembers', member.id); onClose() } catch (e2) { setErr(e2.message); setBusy(false) }
  }
  return (
    <Modal open onClose={onClose} title={member ? 'Ubah anggota' : 'Anggota baru'}
      footer={<>{member && <button className="btn-danger mr-auto" onClick={del} disabled={busy}>Hapus</button>}<button className="btn-secondary" onClick={onClose}>Batal</button><button form="member-form" className="btn-primary" disabled={busy}>Simpan</button></>}>
      <form id="member-form" onSubmit={submit} className="space-y-4">
        <div><label className="field-label" htmlFor="mb-name">Nama</label><input id="mb-name" className="input" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} autoFocus /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="field-label" htmlFor="mb-role">Jabatan</label><input id="mb-role" className="input" maxLength={60} placeholder="Staf" value={role} onChange={(e) => setRole(e.target.value)} /></div>
          <div><label className="field-label" htmlFor="mb-phone">No. HP</label><input id="mb-phone" className="input" inputMode="tel" placeholder="08…" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        </div>
        {member && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Anggota aktif (ikut ditagih iuran)</label>}
        <ErrorText>{err}</ErrorText>
      </form>
    </Modal>
  )
}
