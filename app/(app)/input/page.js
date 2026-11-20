'use client'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { PageHeader } from '@/components/ui'
import { INPUT_ITEMS } from '@/components/AppShell'
import { rupiah, thisMonth, monthLabel } from '@/lib/format'
import { total, ofKind, inMonth, overview } from '@/lib/stats'

const DESC = {
  '/pemasukan/': 'Gaji, freelance, bonus, hasil usaha',
  '/pengeluaran/': 'Parkir, kopi, makan, pakaian, tagihan',
  '/simpanan/': 'Tabungan, dana darurat, investasi, aset',
  '/hutang-piutang/': 'Pinjaman, cicilan, jatuh tempo',
}
const INK = { '/pemasukan/': 'text-masuk-text', '/pengeluaran/': 'text-keluar-text', '/simpanan/': 'text-simpan-text', '/hutang-piutang/': 'text-utang-text' }

// Seperti halaman "daftar isi" buku kas: nama bab … angka.
export default function InputVariable() {
  const data = useData()
  const m = inMonth(data.transactions, thisMonth())
  const o = overview(data)
  const value = {
    '/pemasukan/': [total(ofKind(m, 'pemasukan')), 'bulan ini'],
    '/pengeluaran/': [total(ofKind(m, 'pengeluaran')), 'bulan ini'],
    '/simpanan/': [total(ofKind(m, 'simpanan')), 'bulan ini'],
    '/hutang-piutang/': [o.hutang, `hutang aktif · piutang ${rupiah(o.piutang)}`],
  }
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow={`Daftar isi · ${monthLabel(thisMonth())}`} title="Input Variable" desc="Pilih bab yang ingin dicatat atau diperiksa."
        action={<button className="btn-primary" onClick={() => data.openTx()}><Plus size={18} /> Catat</button>} />
      <ol className="card divide-y divide-line">
        {INPUT_ITEMS.map(({ href, label, icon: Icon }, i) => (
          <li key={href}>
            <Link href={href} className="group flex items-center gap-4 px-4 py-5 transition hover:bg-gold-soft/40 sm:px-6">
              <span className="num w-6 text-sm text-muted">{String(i + 1).padStart(2, '0')}</span>
              <Icon size={22} className={`shrink-0 ${INK[href]}`} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="font-display text-xl font-semibold group-hover:underline">{label}</span>
                  <span className="mb-1 hidden flex-1 border-b-2 border-dotted border-rule sm:block" aria-hidden="true" />
                  <span className={`num ml-auto text-base font-semibold ${INK[href]}`}>{rupiah(value[href][0])}</span>
                </span>
                <span className="mt-0.5 flex justify-between gap-3 text-xs text-muted"><span className="truncate">{DESC[href]}</span><span className="shrink-0">{value[href][1]}</span></span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
