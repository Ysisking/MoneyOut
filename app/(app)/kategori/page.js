'use client'
import { useState } from 'react'
import { Plus, Trash2, Lock } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { PageHeader, ErrorText } from '@/components/ui'
import { KINDS, KIND_ORDER, TONE, categoriesFor } from '@/lib/categories'

export default function Kategori() {
  return (
    <div>
      <PageHeader title="Kategori" desc="Kategori bawaan siap dipakai. Tambahkan kategorimu sendiri bila perlu." />
      <div className="grid gap-4 lg:grid-cols-3">
        {KIND_ORDER.map((k) => <KindCard key={k} kind={k} />)}
      </div>
    </div>
  )
}

function KindCard({ kind }) {
  const { categories, transactions, save, remove } = useData()
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const meta = KINDS[kind]
  const tone = TONE[meta.tone]
  const list = categoriesFor(kind, categories)

  async function add(e) {
    e.preventDefault()
    const n = name.trim().replace(/\s+/g, ' ')
    if (!n) return
    if (list.some((c) => c.name.toLowerCase() === n.toLowerCase())) return setErr('Kategori itu sudah ada.')
    setBusy(true); setErr('')
    try { await save('categories', { kind, name: n }); setName('') } catch (e2) { setErr(e2.message) }
    setBusy(false)
  }
  async function del(c) {
    const used = transactions.filter((t) => t.kind === kind && t.category === c.name).length
    if (!confirm(used ? `Kategori "${c.name}" dipakai di ${used} transaksi. Transaksinya tetap ada. Hapus kategori?` : `Hapus kategori "${c.name}"?`)) return
    try { await remove('categories', c.id) } catch (e2) { setErr(e2.message) }
  }

  return (
    <section className="card flex flex-col p-5">
      <h2 className="flex items-center gap-2 font-bold"><span className={`rounded-lg p-1.5 ${tone.bg} ${tone.text}`}><meta.icon size={16} /></span>{meta.label}</h2>
      <ul className="mt-4 flex-1 space-y-1">
        {list.map((c) => (
          <li key={c.name} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-canvas">
            <c.icon size={16} className={tone.text} />
            <span className="flex-1">{c.name}</span>
            {c.custom
              ? <button onClick={() => del(c)} className="rounded p-1 text-muted hover:text-red-700" aria-label={`Hapus ${c.name}`}><Trash2 size={15} /></button>
              : <Lock size={13} className="text-line" aria-label="Kategori bawaan" />}
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-4 flex gap-2">
        <input className="input !py-2" maxLength={40} placeholder="Kategori baru…" value={name} onChange={(e) => setName(e.target.value)} aria-label={`Kategori ${meta.label.toLowerCase()} baru`} />
        <button className="btn-primary !px-3" disabled={busy || !name.trim()} aria-label="Tambah"><Plus size={18} /></button>
      </form>
      {err && <div className="mt-2"><ErrorText>{err}</ErrorText></div>}
    </section>
  )
}
