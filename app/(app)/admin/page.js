'use client'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import AdminPage from '@/components/admin/AdminPage'

export default function AdminHome() {
  return (
    <AdminPage title="Admin" desc="Kelola akses pengguna MoneyOut.">
      {(a) => {
        const po = a.users.filter((u) => !u.approvedAt && !u.isAdmin)
        const cards = [
          ['/admin/purchase-order/', 'Purchase Order', po.filter((u) => u.status === 'pending').length, 'menunggu diproses'],
          ['/admin/order/', 'Order', a.users.filter((u) => u.approvedAt && u.status === 'active' && !u.isAdmin).length, 'pelanggan aktif'],
          ['/admin/history/', 'History', a.users.filter((u) => u.online).length, 'sedang aktif'],
        ]
        return (
          <div className="grid gap-3 sm:grid-cols-3">
            {cards.map(([href, t, n, d]) => (
              <Link key={href} href={href} className="panel group p-5 transition-colors hover:bg-subtle">
                <p className="flex items-center justify-between text-sm font-medium">{t}<ChevronRight size={16} className="text-faint group-hover:text-ink" /></p>
                <p className="num mt-3 text-3xl font-semibold tracking-tight">{n}</p>
                <p className="text-sm text-sub">{d}</p>
              </Link>
            ))}
          </div>
        )
      }}
    </AdminPage>
  )
}
