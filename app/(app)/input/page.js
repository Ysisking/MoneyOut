'use client'
import Link from 'next/link'
import { ChevronRight, Plus } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { PageHeader, IconBubble } from '@/components/ui'
import { INPUT_ITEMS } from '@/components/AppShell'
import Register from '@/components/Register'
import { rupiah, thisMonth, monthLabel } from '@/lib/format'
import { total, ofKind, inMonth, overview, registerRows, netWorth } from '@/lib/stats'

const DESC = {
  '/pemasukan/': 'Gaji, freelance, bonus, hasil usaha',
  '/pengeluaran/': 'Parkir, kopi, makan, pakaian, tagihan',
  '/simpanan/': 'Tabungan, dana darurat, investasi, aset',
  '/hutang-piutang/': 'Pinjaman, cicilan, jatuh tempo',
  '/aset/': 'Saldo awal, rumah, kendaraan, emas, saham',
}

export default function InputVariable() {
  const data = useData()
  const m = inMonth(data.transactions, thisMonth())
  const o = overview(data)
  const value = {
    '/pemasukan/': [total(ofKind(m, 'pemasukan')), 'bulan ini'],
    '/pengeluaran/': [total(ofKind(m, 'pengeluaran')), 'bulan ini'],
    '/simpanan/': [total(ofKind(m, 'simpanan')), 'bulan ini'],
    '/hutang-piutang/': [o.hutang, 'hutang aktif'],
    '/aset/': [netWorth(data).total, 'kekayaan bersih'],
  }
  return (
    <div>
      <PageHeader title="Input Variable" desc={`Semua catatan keuangan, dikelompokkan per jenis. Angka untuk ${monthLabel(thisMonth())}.`}
        action={<button className="btn-primary" onClick={() => data.openTx()}><Plus size={16} /> Catat</button>} />
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {INPUT_ITEMS.map(({ href, label, icon }) => (
          <Link key={href} href={href} className="panel group p-4 transition-colors hover:border-edge hover:bg-subtle">
            <div className="flex items-center justify-between"><IconBubble icon={icon} size="sm" /><ChevronRight size={16} className="text-faint transition group-hover:translate-x-0.5 group-hover:text-ink" /></div>
            <p className="mt-4 text-sm font-medium">{label}</p>
            <p className="num mt-0.5 text-xl font-semibold tracking-tight">{rupiah(value[href][0])}</p>
            <p className="mt-0.5 truncate text-xs text-sub">{value[href][1]} · {DESC[href]}</p>
          </Link>
        ))}
      </div>
      <section className="panel overflow-hidden">
        <div className="border-b border-line px-5 py-4"><h2 className="text-md font-semibold tracking-tight">Semua transaksi</h2></div>
        <Register rows={registerRows(data)} empty="Belum ada transaksi." />
      </section>
    </div>
  )
}
