'use client'
import Link from 'next/link'
import { ChevronRight, Plus } from 'lucide-react'
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
const TONE = { '/pemasukan/': 'bg-masuk-soft text-masuk-text', '/pengeluaran/': 'bg-keluar-soft text-keluar-text', '/simpanan/': 'bg-simpan-soft text-simpan-text', '/hutang-piutang/': 'bg-utang-soft text-utang-text' }

export default function InputVariable() {
  const data = useData()
  const m = inMonth(data.transactions, thisMonth())
  const o = overview(data)
  const value = {
    '/pemasukan/': [rupiah(total(ofKind(m, 'pemasukan'))), `bulan ini`],
    '/pengeluaran/': [rupiah(total(ofKind(m, 'pengeluaran'))), `bulan ini`],
    '/simpanan/': [rupiah(total(ofKind(m, 'simpanan'))), `bulan ini`],
    '/hutang-piutang/': [rupiah(o.hutang), `hutang aktif · piutang ${rupiah(o.piutang)}`],
  }
  return (
    <div>
      <PageHeader title="Input Variable" desc={`Pilih jenis catatan. Angka di bawah untuk ${monthLabel(thisMonth())}.`}
        action={<button className="btn-primary" onClick={() => data.openTx()}><Plus size={18} /> Catat transaksi</button>} />
      <div className="grid gap-3 sm:grid-cols-2">
        {INPUT_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="card flex items-center gap-4 p-4 transition hover:-translate-y-0.5">
            <span className={`rounded-xl p-2.5 ${TONE[href]}`}><Icon size={22} /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{label}</span>
              <span className="block truncate text-xs text-muted">{DESC[href]}</span>
              <span className="tnum mt-1 block text-sm font-semibold">{value[href][0]} <span className="font-normal text-muted">{value[href][1]}</span></span>
            </span>
            <ChevronRight size={18} className="text-muted" />
          </Link>
        ))}
      </div>
    </div>
  )
}
