'use client'
import AdminPage from '@/components/admin/AdminPage'
import UserList from '@/components/admin/UserList'
import { ADMIN_EMAIL } from '@/lib/config'

export default function Order() {
  return (
    <AdminPage title="Order" desc="Pelanggan yang sudah diizinkan. Freeze untuk menangguhkan sementara, misalnya karena belum membayar.">
      {(a) => (
        <UserList users={a.users.filter((u) => u.approvedAt && u.email.toLowerCase() !== ADMIN_EMAIL)} filters={['active', 'queued', 'blocked', 'frozen']} actions={['active', 'queued', 'blocked', 'frozen']}
          onSet={a.setStatus} dateLabel="diubah" dateOf={(u) => u.statusUpdatedAt || u.approvedAt}
          empty={{ title: 'Belum ada pelanggan', text: 'Pengguna yang kamu Accept di Purchase Order akan pindah ke sini.' }} />
      )}
    </AdminPage>
  )
}
