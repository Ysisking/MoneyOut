'use client'
import { useState } from 'react'
import { Modal, ErrorText } from './ui'
import AmountInput from './AmountInput'
import { useData } from './DataProvider'
import { todayISO } from '@/lib/format'

// Buat / ubah profil instansi. Saat dibuat, anggota cukup ditulis satu nama per baris.
export default function OrgForm({ org, onClose, onCreated }) {
  const { save, remove, addOrgEntry } = useData()
  const [name, setName] = useState(org?.name || '')
  const [unit, setUnit] = useState(org?.unit || '')
  const [role, setRole] = useState(org?.role || '')
  const [members, setMembers] = useState('')
  const [opening, setOpening] = useState(0)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!name.trim()) return setErr('Isi nama instansi.')
    setBusy(true); setErr('')
    try {
      const o = await save('orgs', { ...(org ? { id: org.id } : {}), name: name.trim(), unit: unit.trim(), role: role.trim() })
      if (!org) {
        for (const line of members.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 200)) {
          const [n, r = ''] = line.split(/\s+[-–—]\s+/)
          await save('orgMembers', { org_id: o.id, name: n.slice(0, 80), role: r.slice(0, 60), phone: '', active: true })
        }
        if (opening > 0) await addOrgEntry({ org_id: o.id, kind: 'masuk', source: 'manual', category: 'Saldo awal kas', amount: opening, date: todayISO(), note: 'Saldo awal saat profil dibuat' })
      }
      onCreated?.(o); onClose()
    } catch (e2) { setErr(e2.message); setBusy(false) }
  }
  async function del() {
    if (!confirmDel) return setConfirmDel(true)
    setBusy(true)
    try { await remove('orgs', org.id); onClose(true) } catch (e2) { setErr(e2.message); setBusy(false) }
  }

  return (
    <Modal open onClose={() => onClose()} title={org ? 'Ubah profil instansi' : 'Profil instansi baru'}
      description="Kas instansi dicatat terpisah dari keuanganmu. Tidak perlu daftar akun baru."
      footer={<>
        {org && <button type="button" className="btn-danger mr-auto" onClick={del} disabled={busy}>{confirmDel ? 'Hapus profil & semua kasnya?' : 'Hapus profil'}</button>}
        <button type="button" className="btn-secondary" onClick={() => onClose()}>Batal</button>
        <button form="org-form" className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : org ? 'Simpan' : 'Buat profil'}</button>
      </>}>
      <form id="org-form" onSubmit={submit} className="space-y-5">
        <div><label className="field-label" htmlFor="org-name">Nama instansi</label><input id="org-name" className="input" maxLength={80} placeholder="Dinas Pendidikan Kota Bandung" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="field-label" htmlFor="org-unit">Bidang / bagian</label><input id="org-unit" className="input" maxLength={80} placeholder="Bidang Kurikulum" value={unit} onChange={(e) => setUnit(e.target.value)} /></div>
          <div><label className="field-label" htmlFor="org-role">Jabatanmu</label><input id="org-role" className="input" maxLength={60} placeholder="Kepala bidang" value={role} onChange={(e) => setRole(e.target.value)} /></div>
        </div>
        {!org && (
          <>
            <div>
              <label className="field-label" htmlFor="org-members">Anggota <span className="font-normal text-faint">(satu nama per baris)</span></label>
              <textarea id="org-members" rows={5} className="input h-auto py-2" placeholder={'Andi Saputra - Staf\nRina Wulandari - Bendahara\nBudi'} value={members} onChange={(e) => setMembers(e.target.value)} />
              <p className="mt-1 text-xs text-sub">Jabatan boleh ditulis setelah tanda “-”. Anggota bisa ditambah atau diubah nanti.</p>
            </div>
            <div><AmountInput label="Saldo kas awal (opsional)" align="left" value={opening} onChange={setOpening} quick={false} /></div>
          </>
        )}
        <ErrorText>{err}</ErrorText>
      </form>
    </Modal>
  )
}
