import {
  Briefcase, Laptop, Gift, Store, TrendingUp, Coins, Utensils, Coffee, SquareParking, Bus, Fuel, Shirt,
  ShoppingCart, Receipt, Wifi, HeartPulse, Film, GraduationCap, HandHeart, Baby, Plane, Smartphone,
  PiggyBank, ShieldCheck, Gem, House, Landmark, Tag, ArrowDownLeft, ArrowUpRight, Scale, Building2,
} from 'lucide-react'

// Tiga jenis arus uang yang dicatat sebagai transaksi.
// Hutang & piutang dicatat terpisah (lihat halaman Hutang & Piutang).
export const KINDS = {
  pemasukan: {
    label: 'Pemasukan', short: 'Masuk', icon: ArrowDownLeft, path: '/pemasukan/',
    desc: 'Gaji bulanan, hasil freelance harian, bonus, dan uang masuk lainnya.',
    tone: 'masuk', sign: '+', placeholder: 'mis. Gaji November, proyek logo klien A',
  },
  pengeluaran: {
    label: 'Pengeluaran', short: 'Keluar', icon: ArrowUpRight, path: '/pengeluaran/',
    desc: 'Semua yang dibeli atau dibayar: parkir, kopi, makan, pakaian, tagihan.',
    tone: 'keluar', sign: '−', placeholder: 'mis. Kopi susu di kantin kantor',
  },
  simpanan: {
    label: 'Simpanan', short: 'Simpan', icon: PiggyBank, path: '/simpanan/',
    desc: 'Uang yang disisihkan: tabungan, dana darurat, investasi, emas, aset.',
    tone: 'simpan', sign: '→', placeholder: 'mis. Setor reksa dana pasar uang',
  },
}
export const KIND_ORDER = ['pemasukan', 'pengeluaran', 'simpanan']

// Kelas warna per jenis (ditulis lengkap agar terbaca Tailwind).
export const TONE = {
  masuk: { bg: 'bg-masuk-soft', text: 'text-masuk-text', dot: 'bg-masuk', ring: 'ring-masuk', fill: '#1baf7a' },
  keluar: { bg: 'bg-keluar-soft', text: 'text-keluar-text', dot: 'bg-keluar', ring: 'ring-keluar', fill: '#eb6834' },
  simpan: { bg: 'bg-simpan-soft', text: 'text-simpan-text', dot: 'bg-simpan', ring: 'ring-simpan', fill: '#2a78d6' },
  utang: { bg: 'bg-utang-soft', text: 'text-utang-text', dot: 'bg-utang', ring: 'ring-utang', fill: '#eda100' },
}

export const DEFAULT_CATEGORIES = {
  pemasukan: [
    { name: 'Gaji Bulanan', icon: Briefcase },
    { name: 'Freelance / Harian', icon: Laptop },
    { name: 'Bonus & THR', icon: Gift },
    { name: 'Usaha / Jualan', icon: Store },
    { name: 'Hasil Investasi', icon: TrendingUp },
    { name: 'Pemasukan Lain', icon: Coins },
  ],
  pengeluaran: [
    { name: 'Makan & Minum', icon: Utensils },
    { name: 'Kopi & Jajan', icon: Coffee },
    { name: 'Parkir', icon: SquareParking },
    { name: 'Transportasi', icon: Bus },
    { name: 'Bensin', icon: Fuel },
    { name: 'Pakaian', icon: Shirt },
    { name: 'Belanja Bulanan', icon: ShoppingCart },
    { name: 'Tagihan & Listrik', icon: Receipt },
    { name: 'Pulsa & Internet', icon: Wifi },
    { name: 'Kesehatan', icon: HeartPulse },
    { name: 'Hiburan', icon: Film },
    { name: 'Pendidikan', icon: GraduationCap },
    { name: 'Keluarga & Anak', icon: Baby },
    { name: 'Liburan', icon: Plane },
    { name: 'Gawai & Elektronik', icon: Smartphone },
    { name: 'Sedekah & Donasi', icon: HandHeart },
    { name: 'Pengeluaran Lain', icon: Tag },
  ],
  simpanan: [
    { name: 'Tabungan', icon: PiggyBank },
    { name: 'Dana Darurat', icon: ShieldCheck },
    { name: 'Investasi', icon: TrendingUp },
    { name: 'Emas', icon: Gem },
    { name: 'Beli Aset', icon: House },
    { name: 'Deposito', icon: Landmark },
    { name: 'Simpanan Lain', icon: Coins },
  ],
}

// Gabungan kategori bawaan + buatan pengguna untuk satu jenis.
export function categoriesFor(kind, custom = []) {
  const base = DEFAULT_CATEGORIES[kind]
  const extra = custom
    .filter((c) => c.kind === kind && !base.some((b) => b.name.toLowerCase() === c.name.toLowerCase()))
    .map((c) => ({ name: c.name, icon: Tag, custom: true, id: c.id }))
  return [...base, ...extra]
}

export function iconFor(kind, name) {
  if (name === 'Penyesuaian Saldo') return Scale
  if (name === 'Talangan Instansi' || name === 'Pengembalian Talangan') return Building2
  return DEFAULT_CATEGORIES[kind]?.find((c) => c.name === name)?.icon || Tag
}
