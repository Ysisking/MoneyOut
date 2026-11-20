export const total = (rows) => rows.reduce((s, r) => s + Number(r.amount || 0), 0)
export const ofKind = (txs, kind) => txs.filter((t) => t.kind === kind)
export const inMonth = (txs, key) => txs.filter((t) => t.date.startsWith(key))
export const inYear = (txs, year) => txs.filter((t) => t.date.startsWith(String(year)))

// [{ name, amount, count }] terurut dari yang terbesar.
export function byCategory(txs) {
  const m = new Map()
  txs.forEach((t) => {
    const e = m.get(t.category) || { name: t.category, amount: 0, count: 0 }
    e.amount += Number(t.amount); e.count += 1
    m.set(t.category, e)
  })
  return [...m.values()].sort((a, b) => b.amount - a.amount)
}

// Urut terbaru dulu: tanggal, lalu waktu dicatat.
export const newestFirst = (a, b) => (b.date === a.date ? String(b.created_at).localeCompare(String(a.created_at)) : b.date.localeCompare(a.date))

export function groupByDate(txs) {
  const groups = []
  ;[...txs].sort(newestFirst).forEach((t) => {
    const last = groups[groups.length - 1]
    if (last && last.date === t.date) last.items.push(t)
    else groups.push({ date: t.date, items: [t] })
  })
  return groups
}

export function debtInfo(debt, payments) {
  const list = payments.filter((p) => p.debt_id === debt.id).sort((a, b) => b.date.localeCompare(a.date))
  const paid = total(list)
  const remaining = Math.max(0, Number(debt.amount) - paid)
  return { payments: list, paid, remaining, done: remaining <= 0, progress: Math.min(1, paid / Number(debt.amount)) }
}

// Ringkasan seluruh waktu untuk dasbor.
export function overview({ transactions, debts, payments }) {
  const masuk = total(ofKind(transactions, 'pemasukan'))
  const keluar = total(ofKind(transactions, 'pengeluaran'))
  const simpan = total(ofKind(transactions, 'simpanan'))
  let hutang = 0, piutang = 0
  debts.forEach((d) => {
    const { remaining } = debtInfo(d, payments)
    if (d.kind === 'hutang') hutang += remaining; else piutang += remaining
  })
  return { masuk, keluar, simpan, saldo: masuk - keluar - simpan, hutang, piutang }
}
