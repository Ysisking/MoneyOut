'use client'
import AdminPage from '@/components/admin/AdminPage'
import UserList from '@/components/admin/UserList'
import ControlSwitch from '@/components/admin/ControlSwitch'

export default function PurchaseOrder() {
  return (
    <AdminPage title="Purchase Order" desc="Pendaftar yang menunggu diproses. Accept agar bisa langsung memakai web, Queue bila sistem sibuk, Block bila tidak diizinkan.">
      {(a) => (<>
        <ControlSwitch />
        <UserList users={a.users.filter((u) => !u.approvedAt && !u.isAdmin)} filters={['pending', 'queued', 'blocked']} actions={['active', 'queued', 'blocked']}
          onSet={a.setStatus} dateLabel="daftar" dateOf={(u) => u.createdAt}
          empty={{ title: 'Tidak ada pendaftar menunggu', text: 'Pendaftar baru akan muncul di sini dan kamu akan diberi notifikasi.' }} />
      </>)}
    </AdminPage>
  )
}
