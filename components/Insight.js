import { OctagonAlert, TriangleAlert, Info, CircleCheck } from 'lucide-react'

// Status selalu tampil sebagai ikon + label, bukan warna saja.
export const LEVEL = {
  bahaya: { label: 'Bahaya', icon: OctagonAlert, cls: 'bg-red-50 text-red-700', bar: '#D93A3A' },
  perhatian: { label: 'Perhatian', icon: TriangleAlert, cls: 'bg-utang-soft text-utang-text', bar: '#E08A00' },
  info: { label: 'Info', icon: Info, cls: 'bg-simpan-soft text-simpan-text', bar: '#2a78d6' },
  baik: { label: 'Baik', icon: CircleCheck, cls: 'bg-masuk-soft text-masuk-text', bar: '#0E9F6E' },
}

export default function Insight({ item, compact }) {
  const L = LEVEL[item.level]
  return (
    <li className={`flex gap-3 ${compact ? 'py-2.5' : 'rounded-xl border border-line bg-white p-3.5'}`}>
      <span className={`mt-0.5 h-fit shrink-0 rounded-lg p-1.5 ${L.cls}`}><L.icon size={16} /></span>
      <div className="min-w-0">
        <p className="text-sm font-bold leading-snug">
          {item.title} <span className={`ml-1 rounded-full px-1.5 py-px align-middle text-[10px] font-semibold uppercase tracking-wide ${L.cls}`}>{L.label}</span>
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-muted">{item.text}</p>
      </div>
    </li>
  )
}
