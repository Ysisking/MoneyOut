'use client'
import { useState } from 'react'
import { House, Car, Gem, TrendingUp, Landmark, Laptop, Package } from 'lucide-react'
import { Modal, ErrorText } from './ui'
import AmountInput from './AmountInput'
import { useData } from './DataProvider'
import { ASSET_TYPES } from '@/lib/stats'
import { todayISO } from '@/lib/format'

export const ASSET_ICON = { properti: House, kendaraan: Car, emas: Gem, investasi: TrendingUp, tabungan: Landmark, elektronik: Laptop, lainnya: Package }
const PLACEHOLDER = { properti: 'Rumah Bekasi', kendaraan: 'Motor Vario 2021', emas: 'Emas Antam 10 gram', investasi: 'Reksa dana pasar uang', tabungan: 'Deposito BRI 12 bulan', elektronik: 'MacBook Air', lainnya: 'Nama aset' }

export default function AssetForm({ asset, onClose }) {
  const { save, remove } = useData()
  const [type, setType] = useState(asset?.type || 'emas')
  const [name, setName] = useState(asset?.name || '')
  const [value, setValue] = useState(asset ? Number(asset.value) : 0)
  const [asOf, setAsOf] = useState(asset?.as_of || todayISO())
  const [note, setNote] = useState(asset?.note || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!name.trim()) return setErr('Beri nama asetnya.')
    if (!value) return setErr('Isi perkiraan nilainya saat ini.')
    setBusy(true); setErr('')
    try { await save('assets', { ...(asset ? { id: asset.id } : {}), type, name: name.trim(), value, as_of: asOf || todayISO(), note: note.trim() }); onClose() } catch (e2) { setErr(e2.message); setBusy(false) }
  }
  async function del() {
    if (!confirmDel) return setConfirmDel(true)
    setBusy(true)
    try { await remove('assets', asset.id); onClose() } catch (e2) { setErr(e2.message); setBusy(false) }
  }

  return (
    <Modal open onClose={onClose} title={asset ? 'Ubah aset' : 'Aset baru'} description="Harta yang kamu miliki. Nilainya tidak dihitung sebagai pemasukan."
      footer={<>
        {asset && <button type="button" className="btn-danger mr-auto" onClick={del} disabled={busy}>{confirmDel ? 'Klik lagi untuk hapus' : 'Hapus'}</button>}
        <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
        <button form="asset-form" className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
      </>}>
      <form id="asset-form" onSubmit={submit} className="space-y-5">
        <fieldset>
          <legend className="field-label">Jenis</legend>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(ASSET_TYPES).map(([k, v]) => {
              const Icon = ASSET_ICON[k]
              const on = type === k
              return (
                <button type="button" key={k} onClick={() => setType(k)} aria-pressed={on}
                  className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition ${on ? 'border-ink ring-1 ring-ink' : 'border-edge hover:bg-subtle'}`}>
                  <Icon size={16} strokeWidth={1.8} className="shrink-0 text-sub" />
                  <span className="min-w-0"><span className="block text-sm font-medium">{v.label}</span><span className="block truncate text-xs text-sub">{v.hint}</span></span>
                </button>
              )
            })}
          </div>
        </fieldset>
        <div><label className="field-label" htmlFor="asset-name">Nama</label><input id="asset-name" className="input" maxLength={60} placeholder={PLACEHOLDER[type]} value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
          <AmountInput label="Nilai saat ini" align="left" value={value} onChange={setValue} quick={false} />
          <div><label className="field-label" htmlFor="asset-date">Per tanggal</label><input id="asset-date" type="date" className="input" value={asOf} onChange={(e) => setAsOf(e.target.value)} /></div>
        </div>
        <p className="-mt-2 text-xs text-sub">Pakai perkiraan harga jual hari ini. Perbarui sesekali agar kekayaan bersihmu akurat.</p>
        <div><label className="field-label" htmlFor="asset-note">Catatan</label><input id="asset-note" className="input" maxLength={200} placeholder="Opsional" value={note} onChange={(e) => setNote(e.target.value)} /></div>
        <ErrorText>{err}</ErrorText>
      </form>
    </Modal>
  )
}
