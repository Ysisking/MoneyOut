export const total = (rows) => rows.reduce((s, r) => s + Number(r.amount || 0), 0)
// Penyesuaian saldo (hasil "Cocokkan saldo") mengubah saldo dompet, tapi bukan
// pemasukan/pengeluaran sungguhan — jadi tidak dihitung di ringkasan & analisis.
export const ADJUSTMENT = 'Penyesuaian Saldo'
export const ofKind = (txs, kind) => txs.filter((t) => t.kind === kind && t.category !== ADJUSTMENT)
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
export function overview({ transactions, debts, payments, accounts = [], transfers = [] }) {
  const masuk = total(ofKind(transactions, 'pemasukan'))
  const keluar = total(ofKind(transactions, 'pengeluaran'))
  const simpan = total(ofKind(transactions, 'simpanan'))
  const opening = accounts.reduce((s, a) => s + Number(a.opening_balance || 0), 0)
  let hutang = 0, piutang = 0
  debts.forEach((d) => {
    const { remaining } = debtInfo(d, payments)
    if (d.kind === 'hutang') hutang += remaining; else piutang += remaining
  })
  return { masuk, keluar, simpan, saldo: opening + masuk - keluar - simpan, hutang, piutang }
}

// ------------------------------------------------------------ Dompet & register
export const ACCOUNT_TYPES = {
  tunai: { label: 'Tunai', hint: 'Uang di dompet / laci' },
  bank: { label: 'Rekening bank', hint: 'BCA, BRI, Mandiri, Jago…' },
  ewallet: { label: 'E-wallet', hint: 'GoPay, OVO, DANA, ShopeePay…' },
  lainnya: { label: 'Lainnya', hint: 'Kartu, koperasi, dll.' },
}

// Efek tiap transaksi pada saldo dompet: masuk menambah, keluar & disimpan mengurangi.
export const signed = (t) => (t.kind === 'pemasukan' ? 1 : -1) * Number(t.amount)

export function accountBalances({ accounts, transactions, transfers }) {
  return accounts.map((a) => {
    let bal = Number(a.opening_balance || 0)
    transactions.forEach((t) => { if (t.account_id === a.id) bal += signed(t) })
    transfers.forEach((t) => {
      if (t.from_account_id === a.id) bal -= Number(t.amount)
      if (t.to_account_id === a.id) bal += Number(t.amount)
    })
    return { ...a, balance: bal }
  })
}

// Baris register gabungan (transaksi + transfer) untuk satu dompet atau semua.
// Saldo berjalan dihitung dari yang terlama — seperti buku cek kertas.
export function registerRows({ accounts, transactions, transfers }, { accountId = null, kind = null } = {}) {
  const rows = []
  transactions.forEach((t) => {
    if (kind && t.kind !== kind) return
    if (accountId && t.account_id !== accountId) return
    rows.push({ id: t.id, type: 'tx', ref: t, date: t.date, created_at: t.created_at, kind: t.kind, category: t.category, note: t.note, accountId: t.account_id, delta: signed(t) })
  })
  if (!kind) transfers.forEach((t) => {
    if (accountId && t.from_account_id !== accountId && t.to_account_id !== accountId) return
    const name = (id) => accounts.find((a) => a.id === id)?.name || 'dompet terhapus'
    if (!accountId) rows.push({ id: t.id, type: 'transfer', ref: t, date: t.date, created_at: t.created_at, kind: 'transfer', category: `${name(t.from_account_id)} → ${name(t.to_account_id)}`, note: t.note, delta: 0, amount: Number(t.amount) })
    else {
      const out = t.from_account_id === accountId
      rows.push({ id: t.id, type: 'transfer', ref: t, date: t.date, created_at: t.created_at, kind: 'transfer', category: out ? `Pindah ke ${name(t.to_account_id)}` : `Masuk dari ${name(t.from_account_id)}`, note: t.note, accountId, delta: (out ? -1 : 1) * Number(t.amount) })
    }
  })
  rows.sort((a, b) => (a.date === b.date ? String(a.created_at).localeCompare(String(b.created_at)) : a.date.localeCompare(b.date)))
  if (accountId) {
    let bal = Number(accounts.find((a) => a.id === accountId)?.opening_balance || 0)
    rows.forEach((r) => { bal += r.delta; r.balance = bal })
  }
  return rows.reverse()
}

// ------------------------------------------------------------ Anggaran (amplop)
export function budgetStatus({ budgets, transactions }, month, { elapsed, days }) {
  const spent = byCategory(ofKind(inMonth(transactions, month), 'pengeluaran'))
  return budgets.map((b) => {
    const used = spent.find((s) => s.name === b.category)?.amount || 0
    const limit = Number(b.amount)
    const left = limit - used
    const daysLeft = Math.max(1, days - elapsed + 1)
    return { ...b, limit, used, left, ratio: limit ? used / limit : 0, perDay: left > 0 ? left / daysLeft : 0, daysLeft, pace: elapsed / days }
  }).sort((a, b) => b.ratio - a.ratio)
}

// ------------------------------------------------------------ Kebiasaan & kalender
// Jumlah hari berturut-turut (sampai hari ini atau kemarin) yang punya catatan.
export function recordStreak(transactions, today) {
  const days = new Set(transactions.map((t) => t.date))
  const d = new Date(today + 'T00:00:00')
  const iso = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
  if (!days.has(iso(d))) d.setDate(d.getDate() - 1) // hari ini belum mencatat: hitung sampai kemarin
  let n = 0
  while (days.has(iso(d))) { n++; d.setDate(d.getDate() - 1) }
  const last14 = []
  const e = new Date(today + 'T00:00:00')
  for (let i = 13; i >= 0; i--) { const x = new Date(e); x.setDate(e.getDate() - i); last14.push({ date: iso(x), on: days.has(iso(x)) }) }
  return { streak: n, today: days.has(today), last14 }
}

export function dailySpend(transactions, month) {
  const m = new Map()
  ofKind(inMonth(transactions, month), 'pengeluaran').forEach((t) => m.set(t.date, (m.get(t.date) || 0) + Number(t.amount)))
  return m
}
