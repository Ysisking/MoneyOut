// Deep Analyst: rencana alokasi uang berdasarkan jenis pekerjaan & penghasilan.
// Dihitung sepenuhnya di perangkat pengguna; tidak ada data yang dikirim ke server.
import { thisMonth, shiftMonth } from './format'
import { total, ofKind, inMonth } from './stats'

// Profil pekerjaan dikenali dari isian "status pekerjaan" (teks bebas). Pengguna bisa mengubahnya.
export const PROFILES = {
  tetap: { label: 'Karyawan / pegawai tetap', rate: 20, emergency: 6, why: 'Gaji rutin tiap bulan, jadi porsi simpanan bisa konsisten. Dana darurat 6 bulan cukup sebagai bantalan bila terkena PHK.' },
  lepas: { label: 'Freelancer / pekerja lepas', rate: 30, emergency: 12, why: 'Penghasilan naik-turun dan tanpa pesangon atau pensiun dari kantor, jadi perlu menyimpan lebih banyak saat bulan ramai.' },
  usaha: { label: 'Wirausaha / pemilik usaha', rate: 25, emergency: 12, why: 'Arus kas usaha bisa terganggu kapan saja. Pisahkan uang pribadi dari uang usaha, dan siapkan dana darurat lebih panjang.' },
  profesional: { label: 'Profesional (dokter, programmer, konsultan…)', rate: 25, emergency: 6, why: 'Penghasilan relatif tinggi; manfaatkan untuk mempercepat investasi jangka panjang.' },
  pelajar: { label: 'Pelajar / mahasiswa', rate: 10, emergency: 3, why: 'Penghasilan masih terbatas. Yang terpenting membangun kebiasaan menyisihkan, sekecil apa pun.' },
  irt: { label: 'Ibu / bapak rumah tangga', rate: 15, emergency: 6, why: 'Fokus pada stabilitas kebutuhan keluarga dan dana darurat rumah tangga.' },
  lainnya: { label: 'Lainnya', rate: 20, emergency: 6, why: 'Memakai patokan umum: sisihkan minimal 20% penghasilan.' },
}
const KEYWORDS = [
  ['pelajar', /mahasiswa|pelajar|siswa|student|kuliah|sekolah/],
  ['irt', /rumah tangga|\birt\b|ibu rumah|homemaker/],
  ['lepas', /freelanc|lepas|ojol|ojek|driver|kurir|honorer|kontrak|content creator|kreator|youtuber|influencer|serabutan/],
  ['usaha', /wirausaha|pengusaha|usaha|dagang|pedagang|toko|umkm|bisnis|owner|pemilik|jualan|warung/],
  ['profesional', /dokter|perawat|bidan|apoteker|pengacara|advokat|notaris|arsitek|konsultan|akuntan|engineer|insinyur|programmer|developer|desainer|designer|analis/],
  ['tetap', /karyawan|pegawai|pns|asn|guru|dosen|staf|staff|buruh|tni|polri|bank|manager|manajer|supervisor|admin/],
]
export function detectProfile(occupation = '') {
  const o = occupation.toLowerCase()
  return (KEYWORDS.find(([, re]) => re.test(o)) || ['lainnya'])[0]
}

// Nilai masa depan dari setoran bulanan tetap (bunga majemuk bulanan).
export function futureValue(monthly, years, annualRate) {
  const n = Math.max(0, Math.round(years * 12)), r = annualRate / 12
  if (!n) return 0
  return r ? monthly * ((Math.pow(1 + r, n) - 1) / r) : monthly * n
}
const round = (v, step = 10000) => Math.max(0, Math.round(v / step) * step)

export function deepAnalyze(data, settings) {
  const now = thisMonth()
  // Rata-rata 3 bulan terakhir yang punya pemasukan (bulan ini ikut bila sudah ada).
  const months = [0, 1, 2, 3].map((i) => shiftMonth(now, -i)).map((m) => {
    const tx = inMonth(data.transactions, m)
    return { m, masuk: total(ofKind(tx, 'pemasukan')), keluar: total(ofKind(tx, 'pengeluaran')), simpan: total(ofKind(tx, 'simpanan')) }
  }).filter((x) => x.masuk > 0).slice(0, 3)
  if (!months.length) return null
  const avg = (k) => months.reduce((s, x) => s + x[k], 0) / months.length
  const income = avg('masuk'), expense = avg('keluar') || income * 0.5, saving = avg('simpan')

  const key = settings.profile || detectProfile(settings.occupation)
  const P = PROFILES[key]
  // Penyesuaian dengan besar penghasilan: kebutuhan dasar didahulukan bila penghasilan kecil.
  let adj = 0, adjWhy = ''
  if (income < 3000000) { adj = -10; adjWhy = 'Penghasilan di bawah Rp 3 juta: kebutuhan pokok didahulukan, target simpanan diturunkan.' }
  else if (income < 6000000) { adj = -5; adjWhy = 'Penghasilan Rp 3–6 juta: target simpanan sedikit diturunkan agar tetap realistis.' }
  else if (income > 30000000) { adj = 10; adjWhy = 'Penghasilan di atas Rp 30 juta: ruang menabung besar, target dinaikkan.' }
  else if (income > 15000000) { adj = 5; adjWhy = 'Penghasilan di atas Rp 15 juta: target simpanan dinaikkan.' }
  const rate = Math.min(45, Math.max(5, P.rate + adj))
  const idealSaving = round(income * rate / 100)

  // Keep money: biaya hidup sebulan di rekening harian + uang pegangan seminggu.
  const keepMonth = round(expense)
  const keepWeek = round(expense / 4.3, 5000)

  // Dana darurat
  const emergencyMonths = P.emergency + (settings.children > 0 ? 3 : 0)
  const emergencyTarget = round(expense * emergencyMonths, 100000)
  const emergencyNow = total(ofKind(data.transactions, 'simpanan').filter((t) => ['Dana Darurat', 'Tabungan'].includes(t.category)))
  const emergencyGap = Math.max(0, emergencyTarget - emergencyNow)
  const emergencyDone = emergencyGap === 0

  // Pembagian simpanan ideal ke tiap pos.
  const age = Number(settings.age) || 0
  const retireAge = Number(settings.retireAge) || 56
  const yearsToRetire = age ? Math.max(1, retireAge - age) : 25
  const kids = Math.max(0, Number(settings.children) || 0)
  const share = emergencyDone ? { darurat: 0, pensiun: 0.35, anak: kids ? 0.25 : 0 } : { darurat: 0.5, pensiun: 0.2, anak: kids ? 0.15 : 0 }
  share.investasi = 1 - share.darurat - share.pensiun - share.anak
  const alloc = Object.fromEntries(Object.entries(share).map(([k, v]) => [k, round(idealSaving * v)]))
  const emergencyMonthsToGoal = alloc.darurat ? Math.ceil(emergencyGap / alloc.darurat) : 0

  const pension = { monthly: alloc.pensiun, years: yearsToRetire, retireAge, assumed: !age, projected: round(futureValue(alloc.pensiun, yearsToRetire, 0.06), 1000000) }
  const kid = kids ? { perChild: round(alloc.anak / kids), years: 15, projected: round(futureValue(alloc.anak / kids, 15, 0.07), 1000000) } : null

  // Saran instrumen sesuai profil risiko & horizon.
  const aggressive = !['pelajar'].includes(key) && emergencyDone && (age ? age < 40 : true) && income >= 6000000
  const mix = !emergencyDone
    ? [['Reksa dana pasar uang', 70, 'Mudah dicairkan, cocok selagi dana darurat belum penuh'], ['Deposito / tabungan berjangka', 30, 'Bunga tetap, risiko rendah']]
    : aggressive
      ? [['Reksa dana indeks saham', 40, 'Pertumbuhan jangka panjang (5+ tahun)'], ['SBN ritel / obligasi', 30, 'Dijamin negara, kupon rutin'], ['Emas', 15, 'Pelindung nilai dari inflasi'], ['Reksa dana pasar uang', 15, 'Cadangan likuid untuk peluang']]
      : [['SBN ritel / obligasi', 40, 'Dijamin negara, kupon rutin'], ['Reksa dana campuran', 25, 'Gabungan saham & obligasi, risiko sedang'], ['Emas', 20, 'Pelindung nilai dari inflasi'], ['Reksa dana pasar uang', 15, 'Mudah dicairkan']]

  return {
    profileKey: key, profile: P, detected: !settings.profile, income, expense, saving, months: months.length,
    rate, adjWhy, idealSaving, savingNowRate: income ? saving / income : 0,
    keepMonth, keepWeek,
    emergency: { months: emergencyMonths, target: emergencyTarget, now: emergencyNow, gap: emergencyGap, done: emergencyDone, monthly: alloc.darurat, eta: emergencyMonthsToGoal },
    pension, kid, kids, invest: { monthly: alloc.investasi, mix, aggressive },
  }
}
