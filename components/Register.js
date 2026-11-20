'use client'
import { useState } from 'react'
import { CornerDownLeft, ArrowRightLeft } from 'lucide-react'
import { useData } from './DataProvider'
import { iconFor, categoriesFor, KINDS } from '@/lib/categories'
import { rupiah, todayISO, formatAmountInput, parseAmount } from '@/lib/format'

const day = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
const dayLong = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
// Ditulis lengkap agar terbaca Tailwind.
const COLS = {
  ab: 'grid-cols-[6rem_minmax(0,1fr)_7.5rem_7.5rem_7.5rem_8.5rem]',
  a: 'grid-cols-[6rem_minmax(0,1fr)_7.5rem_7.5rem_7.5rem]',
  b: 'grid-cols-[6rem_minmax(0,1fr)_7.5rem_7.5rem_8.5rem]',
  '': 'grid-cols-[6rem_minmax(0,1fr)_7.5rem_7.5rem]',
}
const amt = (n) => rupiah(n).replace('Rp', '').trim()

// Register = buku catatan bergaya buku cek: satu baris per transaksi, kolom masuk/keluar,
// dan (untuk satu dompet) saldo berjalan.
const PAGE = 60

export default function Register({ rows, showBalance = false, showAccount = true, quick = null, empty = 'Belum ada catatan.', limit }) {
  const { openTx, accounts } = useData()
  const [shown, setShown] = useState(PAGE)
  const list = rows.slice(0, limit || shown)
  const more = !limit && rows.length > shown
  const accName = (id) => accounts.find((a) => a.id === id)?.name || '—'
  const open = (r) => (r.type === 'transfer' ? openTx({ transfer: r.ref }) : openTx({ tx: r.ref }))
  const cols = COLS[`${showAccount ? 'a' : ''}${showBalance ? 'b' : ''}`]

  return (
    <div>
      {/* Desktop: tabel buku besar */}
      <div className="hidden md:block">
        <div className={`grid ${cols} gap-3 border-b-2 border-ink px-4 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted`}>
          <span>Tanggal</span><span>Keterangan</span>{showAccount && <span>Dompet</span>}
          <span className="text-right">Masuk</span><span className="text-right">Keluar</span>{showBalance && <span className="text-right">Saldo</span>}
        </div>
        {quick && <QuickRow quick={quick} cols={cols} showAccount={showAccount} showBalance={showBalance} />}
        {list.length ? list.map((r, i) => {
          const Icon = r.type === 'transfer' ? ArrowRightLeft : iconFor(r.kind, r.category)
          const firstOfDay = i === 0 || list[i - 1].date !== r.date
          return (
            <button key={r.id} onClick={() => open(r)} className={`grid w-full ${cols} items-center gap-3 border-b border-line px-4 py-2 text-left text-sm transition hover:bg-gold-soft/50`}>
              <span className={`num text-xs ${firstOfDay ? 'text-ink' : 'text-transparent'}`}>{day(r.date)}</span>
              <span className="flex min-w-0 items-center gap-2">
                <Icon size={15} className="shrink-0 text-muted" />
                <span className="truncate"><span className="font-medium">{r.category}</span>{r.note && <span className="text-muted"> — {r.note}</span>}</span>
                {r.kind === 'simpanan' && <span className="shrink-0 rounded-sm bg-simpan-soft px-1 text-[10px] font-semibold uppercase text-simpan-text">simpan</span>}
              </span>
              {showAccount && <span className="truncate text-xs text-muted">{r.type === 'transfer' ? 'pindah dompet' : accName(r.accountId)}</span>}
              <span className="num text-right text-masuk-text">{r.delta > 0 ? amt(r.delta) : ''}</span>
              <span className="num text-right text-keluar-text">{r.delta < 0 ? amt(-r.delta) : r.type === 'transfer' && !r.delta ? <span className="text-muted">↔ {amt(r.amount)}</span> : ''}</span>
              {showBalance && <span className={`num text-right font-medium ${r.balance < 0 ? 'text-keluar-text' : ''}`}>{amt(r.balance)}</span>}
            </button>
          )
        }) : <p className="px-4 py-10 text-center text-sm text-muted">{empty}</p>}
      </div>

      {/* HP: dikelompokkan per hari */}
      <div className="md:hidden">
        {list.length ? groupDays(list).map((g) => (
          <div key={g.date}>
            <div className="flex items-baseline justify-between border-b border-ink/70 px-4 pb-1 pt-3">
              <span className="font-display text-[15px] font-semibold capitalize">{dayLong(g.date)}</span>
              <span className={`num text-xs ${g.net < 0 ? 'text-keluar-text' : 'text-masuk-text'}`}>{g.net < 0 ? '−' : '+'}{amt(Math.abs(g.net))}</span>
            </div>
            {g.items.map((r) => {
              const Icon = r.type === 'transfer' ? ArrowRightLeft : iconFor(r.kind, r.category)
              return (
                <button key={r.id} onClick={() => open(r)} className="flex w-full items-center gap-3 border-b border-line px-4 py-2.5 text-left active:bg-gold-soft/50">
                  <Icon size={17} className="shrink-0 text-muted" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{r.category}</span>
                    <span className="block truncate text-xs text-muted">{[r.note, showAccount && r.type !== 'transfer' && accName(r.accountId), r.kind === 'simpanan' && 'disimpan'].filter(Boolean).join(' · ') || ' '}</span>
                  </span>
                  <span className="text-right">
                    <span className={`num block text-sm font-medium ${r.delta > 0 ? 'text-masuk-text' : r.delta < 0 ? 'text-keluar-text' : 'text-muted'}`}>{r.delta > 0 ? '+' : r.delta < 0 ? '−' : '↔'}{amt(Math.abs(r.delta) || r.amount)}</span>
                    {showBalance && <span className="num block text-[11px] text-muted">saldo {amt(r.balance)}</span>}
                  </span>
                </button>
              )
            })}
          </div>
        )) : <p className="px-4 py-10 text-center text-sm text-muted">{empty}</p>}
      </div>
      {more && (
        <button onClick={() => setShown(shown + PAGE)} className="w-full border-t border-line py-3 text-sm font-semibold text-brand hover:bg-canvas">
          Tampilkan {Math.min(PAGE, rows.length - shown)} catatan lebih lama · {rows.length - shown} tersisa
        </button>
      )}
    </div>
  )
}

function groupDays(rows) {
  const out = []
  rows.forEach((r) => {
    const last = out[out.length - 1]
    if (last && last.date === r.date) { last.items.push(r); last.net += r.delta }
    else out.push({ date: r.date, items: [r], net: r.delta })
  })
  return out
}

// Baris isian cepat di atas register: ketik, tekan Enter, langsung tercatat.
function QuickRow({ quick, cols, showAccount, showBalance }) {
  const { categories, balances, save } = useData()
  const [kind, setKind] = useState(quick.kind || 'pengeluaran')
  const [date, setDate] = useState(todayISO())
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const [amount, setAmount] = useState(0)
  const [account, setAccount] = useState(quick.accountId || balances[0]?.id)
  const [msg, setMsg] = useState('')
  const cats = categoriesFor(kind, categories)

  async function submit(e) {
    e.preventDefault()
    if (!amount || !(category || cats[0])) return setMsg('Isi nominal dulu')
    try {
      await save('transactions', { kind, date, category: category || cats[0].name, note: note.trim(), amount, account_id: quick.accountId || account })
      setNote(''); setAmount(0); setMsg('Tercatat ✓'); setTimeout(() => setMsg(''), 1500)
    } catch (e2) { setMsg(e2.message) }
  }
  const field = 'w-full min-w-0 rounded border border-transparent bg-transparent px-1.5 py-1 text-sm outline-none hover:border-rule focus:border-ink focus:bg-sheet'
  return (
    <form onSubmit={submit} className={`grid ${cols} items-center gap-3 border-b border-line bg-gold-soft/40 px-4 py-1.5`} aria-label="Isian cepat">
      <input type="date" className={`${field} num !px-0 text-xs`} value={date} onChange={(e) => setDate(e.target.value)} aria-label="Tanggal" />
      <span className="flex min-w-0 gap-1.5">
        {!quick.kind && (
          <select className={`${field} !w-[6.2rem] shrink-0 font-semibold`} value={kind} onChange={(e) => { setKind(e.target.value); setCategory('') }} aria-label="Jenis">
            {['pengeluaran', 'pemasukan', 'simpanan'].map((k) => <option key={k} value={k}>{KINDS[k].short}</option>)}
          </select>
        )}
        <select className={`${field} !w-36 shrink-0`} value={category || cats[0]?.name} onChange={(e) => setCategory(e.target.value)} aria-label="Kategori">
          {cats.map((c) => <option key={c.name}>{c.name}</option>)}
        </select>
        <input className={field} placeholder="Keterangan… (Enter untuk simpan)" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} aria-label="Keterangan" />
      </span>
      {showAccount && (
        <select className={`${field} text-xs`} value={account} onChange={(e) => setAccount(e.target.value)} aria-label="Dompet">
          {balances.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      )}
      <input inputMode="numeric" placeholder="0" aria-label="Nominal" className={`${field} num col-span-2 text-right ${kind === 'pemasukan' ? 'text-masuk-text' : 'text-keluar-text'}`}
        value={formatAmountInput(amount)} onChange={(e) => setAmount(parseAmount(e.target.value))} />
      {showBalance && (
        <button className="flex items-center justify-end gap-1 text-xs font-semibold text-muted hover:text-ink">
          {msg || <><CornerDownLeft size={13} /> Enter</>}
        </button>
      )}
      {!showBalance && <button className="sr-only">Simpan</button>}
      {!showBalance && msg && <span className="col-span-full -mt-1 text-right text-xs font-semibold text-masuk-text">{msg}</span>}
    </form>
  )
}
