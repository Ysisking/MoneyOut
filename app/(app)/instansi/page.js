'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Building2, ChevronRight, Users } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { PageHeader, EmptyState } from '@/components/ui'
import OrgForm from '@/components/OrgForm'
import { orgLedger } from '@/lib/bills'
import { rupiah } from '@/lib/format'

export default function SistemTagihan() {
  const { orgs, orgMembers, orgEntries, missing } = useData()
  const [form, setForm] = useState(false)
  const router = useRouter()
  const off = missing.includes('orgs')
  return (
    <div>
      <PageHeader title="Sistem Tagihan" desc="Profil instansi atau kelompok yang kamu kelola — misalnya bidang di kantor, arisan, atau RT. Kasnya dicatat terpisah dari keuangan pribadimu."
        action={<button className="btn-primary" onClick={() => setForm(true)} disabled={off}><Plus size={16} /> Profil instansi</button>} />
      {off && <p className="mb-6 rounded-lg border border-line bg-subtle p-4 text-sm text-sub">Fitur ini belum aktif di database. Jalankan ulang <code className="rounded bg-well px-1">supabase/moneyout.sql</code>.</p>}
      {orgs.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {orgs.map((o) => {
            const L = orgLedger(o.id, orgEntries)
            const n = orgMembers.filter((m) => m.org_id === o.id && m.active).length
            return (
              <Link key={o.id} href={`/instansi/detail/?id=${o.id}`} className="panel group p-5 transition-colors hover:bg-subtle">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-subtle group-hover:bg-well"><Building2 size={18} strokeWidth={1.8} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-base font-semibold">{o.name}</span><span className="block truncate text-sm text-sub">{[o.unit, o.role].filter(Boolean).join(' · ') || 'Instansi'}</span></span>
                  <ChevronRight size={16} className="mt-1 text-faint" />
                </div>
                <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
                  <div><dt className="text-sub">Saldo kas</dt><dd className="num font-semibold">{rupiah(L.balance)}</dd></div>
                  <div><dt className="text-sub">Talangan</dt><dd className={`num font-semibold ${L.outstanding ? 'text-warn' : ''}`}>{rupiah(L.outstanding)}</dd></div>
                  <div><dt className="flex items-center gap-1 text-sub"><Users size={13} /> Anggota</dt><dd className="num font-semibold">{n}</dd></div>
                </dl>
              </Link>
            )
          })}
        </div>
      ) : !off && (
        <div className="panel"><EmptyState icon={Building2} title="Belum ada profil instansi" text="Isi nama instansi dan anggotanya. Kamu bisa mencatat kas, menagih iuran bulanan, dan membayar tagihan rutin instansi tanpa mencampur uang pribadi." action={<button className="btn-primary" onClick={() => setForm(true)}><Plus size={15} /> Buat profil instansi</button>} /></div>
      )}
      {form && <OrgForm onClose={() => setForm(false)} onCreated={(o) => router.push(`/instansi/detail/?id=${o.id}`)} />}
    </div>
  )
}
