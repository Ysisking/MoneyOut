'use client'
import { useMemo, useState } from 'react'
import { Plus, CalendarClock, Undo2 } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { PageHeader, EmptyState, IconBubble, SectionTitle } from '@/components/ui'
import { BillForm, PayBillForm, TEMPLATES } from '@/components/BillForms'
import { iconFor } from '@/lib/categories'
import { billStatus, daysTo, EVERY } from '@/lib/bills'
import { rupiah, dateShort, monthLabel } from '@/lib/format'

function statusText(s) {
  if (s.overdue.length) { const n = -daysTo(s.overdue[0].date); return { t: `Terlambat ${n} hari${s.overdue.length > 1 ? ` · ${s.overdue.length} periode` : ''}`, c: 'text-neg font-medium' } }
  if (!s.next) return { t: 'Tidak ada jadwal', c: 'text-faint' }
  const n = daysTo(s.next.date)
  if (n === 0) return { t: 'Jatuh tempo hari ini', c: 'text-warn font-medium' }
  if (n <= 3) return { t: `${n} hari lagi · ${dateShort(s.next.date)}`, c: 'text-warn' }
  return { t: `Berikutnya ${dateShort(s.next.date)}`, c: 'text-sub' }
}

export default function TagihanTerjadwal() {
  const { bills, billPayments, skipBill, undoPayment } = useData()
  const [form, setForm] = useState(null)   // { bill?, template? }
  const [pay, setPay] = useState(null)     // { bill, period }
  const mine = useMemo(() => bills.filter((b) => !b.org_id).map((b) => ({ b, s: billStatus(b, billPayments) }))
    .sort((x, y) => (y.b.active - x.b.active) || String(x.s.target?.date || '9').localeCompare(String(y.s.target?.date || '9'))), [bills, billPayments])
  const active = mine.filter((x) => x.b.active)
  const perMonth = active.reduce((s, { b }) => s + Number(b.amount) / b.every_months, 0)
  const late = active.filter((x) => x.s.overdue.length).length
  const week = active.filter((x) => x.s.target && daysTo(x.s.target.date) >= 0 && daysTo(x.s.target.date) <= 7).length
  const history = billPayments.filter((p) => bills.some((b) => b.id === p.bill_id && !b.org_id)).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 8)

  return (
    <div>
      <PageHeader title="Tagihan Terjadwal" desc="Pembayaran rutin seperti ganti oli, salon, belanja bulanan, atau kirim uang ke orang tua. Tekan Bayar untuk langsung mencatatnya."
        action={<button className="btn-primary" onClick={() => setForm({})}><Plus size={16} /> Tagihan baru</button>} />

      <dl className="panel mb-6 grid grid-cols-3 divide-x divide-line [&>div]:px-5 [&>div]:py-4">
        <div><dt className="text-sm text-sub">Rata-rata per bulan</dt><dd className="num mt-1 text-xl font-semibold">{rupiah(perMonth)}</dd></div>
        <div><dt className="text-sm text-sub">Jatuh tempo 7 hari</dt><dd className="num mt-1 text-xl font-semibold">{week}</dd></div>
        <div><dt className="text-sm text-sub">Terlambat</dt><dd className={`num mt-1 text-xl font-semibold ${late ? 'text-neg' : ''}`}>{late}</dd></div>
      </dl>

      <section className="panel mb-6 overflow-hidden">
        {mine.length ? (
          <ul className="divide-y divide-line">
            {mine.map(({ b, s }) => {
              const st = statusText(s)
              return (
                <li key={b.id} className={`flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 ${b.active ? '' : 'opacity-50'}`}>
                  <IconBubble icon={iconFor(b.kind, b.category)} />
                  <button onClick={() => setForm({ bill: b })} className="min-w-0 flex-1 basis-48 text-left">
                    <span className="block truncate text-base font-medium hover:underline">{b.name}</span>
                    <span className="block truncate text-sm text-sub">{EVERY[b.every_months]} · tgl {b.day} · {b.category}{!b.active && ' · nonaktif'}</span>
                  </button>
                  <span className="w-44 text-sm max-sm:order-last max-sm:w-full max-sm:pl-12"><span className={st.c}>{st.t}</span></span>
                  <span className="num w-28 text-right text-base font-medium">{rupiah(b.amount)}</span>
                  {b.active && s.target && (
                    <span className="flex gap-1 max-sm:pl-12">
                      <button className="btn-primary h-8 px-3" onClick={() => setPay({ bill: b, period: s.target.period })}>Bayar</button>
                      <button className="btn-ghost h-8 px-2.5 text-xs" title={`Lewati periode ${monthLabel(s.target.period)}`} onClick={() => skipBill(b, s.target.period)}>Lewati</button>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        ) : <EmptyState icon={CalendarClock} title="Belum ada tagihan terjadwal" text="Pilih contoh di bawah atau buat sendiri. Kamu akan diingatkan di dasbor saat jatuh tempo." />}
      </section>

      <section className="mb-6">
        <SectionTitle>Mulai dari contoh</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button key={t.name} onClick={() => setForm({ template: t })} className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-3.5 text-sm hover:border-edge hover:bg-subtle">
              <Plus size={14} className="text-sub" /> {t.name} <span className="text-faint">{EVERY[t.every_months].toLowerCase()}</span>
            </button>
          ))}
        </div>
      </section>

      {history.length > 0 && (
        <section className="panel overflow-hidden">
          <div className="border-b border-line px-5 py-3.5 text-sm font-medium">Riwayat terakhir</div>
          <ul className="divide-y divide-line">
            {history.map((p) => {
              const b = bills.find((x) => x.id === p.bill_id)
              return (
                <li key={p.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                  <span className="min-w-0 flex-1 truncate"><span className="font-medium">{b?.name}</span> <span className="text-sub">· {monthLabel(p.period)}</span></span>
                  <span className={`num ${p.amount ? '' : 'text-faint'}`}>{p.amount ? rupiah(p.amount) : 'dilewati'}</span>
                  <button className="btn-ghost h-7 px-2 text-xs" onClick={() => undoPayment(p)} title={p.amount ? 'Batalkan pembayaran & hapus transaksinya' : 'Batalkan lewati'}><Undo2 size={13} /> Batalkan</button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {form && <BillForm bill={form.bill} template={form.template} onClose={() => setForm(null)} />}
      {pay && <PayBillForm bill={pay.bill} period={pay.period} onClose={() => setPay(null)} />}
    </div>
  )
}
