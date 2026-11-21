'use client'
import AdminPage from '@/components/admin/AdminPage'
import UserList from '@/components/admin/UserList'

export default function PurchaseOrder() {
  return (
    <AdminPage title="Purchase Order" desc="Pendaftar yang menunggu diproses. Accept agar bisa langsung memakai web, Queue bila sistem sibuk, Block bila tidak diizinkan.">
      {(a) => (
        <UserList users={a.users.filter((u) => !u.approvedAt && !u.isAdmin)} filters={['pending', 'queued', 'blocked']} actions={['active', 'queued', 'blocked']}
          onSet={a.setStatus} dateLabel="daftar" dateOf={(u) => u.createdAt}
          empty={{ title: 'Tidak ada pendaftar menunggu', text: 'Pendaftar baru akan muncul di sini dan kamu akan diberi notifikasi.' }} />
      )}
    </AdminPage>
  )
}
