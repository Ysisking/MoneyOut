'use client'
import { Info } from 'lucide-react'
import { PageHeader, Spinner, ErrorText } from '@/components/ui'
import AdminGate from './AdminGate'
import { useAdmin } from './useAdmin'

function Inner({ title, desc, children }) {
  const admin = useAdmin()
  return (
    <div>
      <PageHeader title={title} desc={desc} action={<button className="btn-secondary" onClick={admin.reload}>Muat ulang</button>} />
      {!admin.ready && <p className="mb-6 flex items-start gap-2.5 rounded-lg border border-line bg-subtle p-4 text-sm text-sub"><Info size={16} className="mt-0.5 shrink-0" />Fitur admin belum aktif di database. Jalankan ulang <code className="rounded bg-well px-1">supabase/moneyout.sql</code> di Supabase SQL Editor.</p>}
      {admin.error ? <ErrorText>{admin.error}</ErrorText> : admin.loading ? <Spinner /> : children(admin)}
    </div>
  )
}

export default function AdminPage(props) {
  return <AdminGate><Inner {...props} /></AdminGate>
}
