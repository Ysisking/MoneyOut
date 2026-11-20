import { OctagonAlert, TriangleAlert, Info, CircleCheck } from 'lucide-react'

// Status selalu tampil sebagai ikon + label, bukan warna saja.
export const LEVEL = {
  bahaya: { label: 'Bahaya', icon: OctagonAlert, cls: 'bg-keluar-soft text-keluar-text', bar: '#B3261E', edge: 'border-l-keluar-text' },
  perhatian: { label: 'Perhatian', icon: TriangleAlert, cls: 'bg-utang-soft text-utang-text', bar: '#C98500', edge: 'border-l-utang' },
  info: { label: 'Info', icon: Info, cls: 'bg-simpan-soft text-simpan-text', bar: '#1F4E8C', edge: 'border-l-simpan-text' },
  baik: { label: 'Baik', icon: CircleCheck, cls: 'bg-masuk-soft text-masuk-text', bar: '#1B6B45', edge: 'border-l-masuk-text' },
}

export default function Insight({ item, compact }) {
  const L = LEVEL[item.level]
  return (
    <li className={compact ? 'flex gap-3 py-3' : `border-l-[3px] ${L.edge} bg-sheet py-3 pl-3.5 pr-2`}>
      {compact && <L.icon size={17} className={`mt-0.5 shrink-0 ${L.cls.split(' ')[1]}`} />}
      <div className="min-w-0">
        <p className="text-[15px] font-semibold leading-snug">
          {!compact && <L.icon size={15} className={`-mt-0.5 mr-1.5 inline ${L.cls.split(' ')[1]}`} />}
          {item.title} <span className={`ml-1 rounded-sm px-1 py-px align-middle text-[10px] font-bold uppercase tracking-wide ${L.cls}`}>{L.label}</span>
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted">{item.text}</p>
      </div>
    </li>
  )
}
