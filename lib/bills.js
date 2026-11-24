// Tagihan terjadwal (pribadi & instansi) dan kas instansi.
import { todayISO, thisMonth, shiftMonth, daysInMonth } from './format'

export const EVERY = { 1: 'Tiap bulan', 2: 'Tiap 2 bulan', 3: 'Tiap 3 bulan', 6: 'Tiap 6 bulan', 12: 'Tiap tahun' }
export const TALANGAN = 'Talangan Instansi'
export const PENGEMBALIAN = 'Pengembalian Talangan'

const monthsBetween = (a, b) => { const [ya, ma] = a.split('-').map(Number); const [yb, mb] = b.split('-').map(Number); return (yb - ya) * 12 + (mb - ma) }
export const isDueIn = (bill, month) => { const d = monthsBetween(bill.start_month, month); return d >= 0 && d % bill.every_months === 0 }
export const dueDate = (bill, month) => `${month}-${String(Math.min(bill.day, daysInMonth(month))).padStart(2, '0')}`

// Periode jatuh tempo yang belum dibayar/dilewati (hingga 6 bulan ke belakang) + periode berikutnya.
export function billStatus(bill, payments, memberId = null) {
  const now = thisMonth(), today = todayISO()
  const paid = (m) => payments.find((p) => p.bill_id === bill.id && p.period === m && (memberId ? p.member_id === memberId : !p.member_id))
  const open = []
  for (let i = 6; i >= 0; i--) {
    const m = shiftMonth(now, -i)
    if (isDueIn(bill, m) && !paid(m)) open.push({ period: m, date: dueDate(bill, m) })
  }
  const overdue = open.filter((o) => o.date < today)
  const current = open.find((o) => o.date >= today)
  let next = current
  if (!next) for (let i = 0; i <= 24; i++) { const m = shiftMonth(now, i); if (isDueIn(bill, m) && !paid(m) && dueDate(bill, m) >= today) { next = { period: m, date: dueDate(bill, m) }; break } }
  const lastPaid = payments.filter((p) => p.bill_id === bill.id && (memberId ? p.member_id === memberId : !p.member_id)).sort((a, b) => b.period.localeCompare(a.period))[0]
  return { overdue, next, lastPaid, target: overdue[0] || next }
}

const daysTo = (iso) => Math.round((new Date(iso + 'T00:00:00') - new Date(todayISO() + 'T00:00:00')) / 86400000)
// Tagihan pribadi yang perlu perhatian: lewat jatuh tempo atau jatuh tempo ≤ 3 hari.
export function dueSoon(bills, payments) {
  return bills.filter((b) => !b.org_id && b.active).map((b) => ({ b, s: billStatus(b, payments) }))
    .filter(({ s }) => s.target && daysTo(s.target.date) <= 3)
    .map(({ b, s }) => ({ bill: b, period: s.target.period, date: s.target.date, days: daysTo(s.target.date), overdueCount: s.overdue.length }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
export { daysTo }

// Kas instansi
export function orgLedger(orgId, entries) {
  const list = entries.filter((e) => e.org_id === orgId)
  const sum = (f) => list.filter(f).reduce((s, e) => s + Number(e.amount), 0)
  const masuk = sum((e) => e.kind === 'masuk'), keluar = sum((e) => e.kind === 'keluar')
  const talangan = sum((e) => e.source === 'talangan'), kembali = sum((e) => e.source === 'pengembalian')
  return {
    list, balance: masuk - keluar, masuk, keluar,
    masukReal: masuk - talangan, keluarReal: keluar - kembali, // tanpa talangan & pengembalian
    talangan, kembali, outstanding: Math.max(0, talangan - kembali),
  }
}
