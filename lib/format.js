const rp = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const num = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })

export const rupiah = (n) => rp.format(Math.round(Number(n) || 0)).replace(/\s/g, ' ')

// Versi ringkas untuk grafik: 1,2 jt / 150 rb
export function rupiahShort(n) {
  const v = Math.abs(Number(n) || 0)
  const s = Number(n) < 0 ? '-' : ''
  if (v >= 1e9) return s + (v / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' M'
  if (v >= 1e6) return s + (v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt'
  if (v >= 1e3) return s + (v / 1e3).toLocaleString('id-ID', { maximumFractionDigits: 0 }) + ' rb'
  return s + num.format(v)
}

// Input nominal: "150.000" <-> 150000
export const parseAmount = (str) => Number(String(str || '').replace(/[^\d]/g, '')) || 0
export const formatAmountInput = (n) => (n ? num.format(n) : '')

const pad = (n) => String(n).padStart(2, '0')
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayISO = () => toISO(new Date())
export const thisMonth = () => todayISO().slice(0, 7)
const asDate = (iso) => new Date(iso + 'T00:00:00')

export function shiftMonth(key, delta) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}
export const monthLabel = (key) => asDate(key + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
export const monthShort = (key) => asDate(key + '-01').toLocaleDateString('id-ID', { month: 'short' })
export const dateLong = (iso) => asDate(iso).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
export const dateShort = (iso) => asDate(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
export const daysInMonth = (key) => { const [y, m] = key.split('-').map(Number); return new Date(y, m, 0).getDate() }
export const daysUntil = (iso) => Math.round((asDate(iso) - asDate(todayISO())) / 86400000)

export function greeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}
