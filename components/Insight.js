import { CircleAlert, TriangleAlert, Info, CircleCheck } from 'lucide-react'

// Tingkat penting: ikon + label teks (bukan warna saja).
export const LEVEL = {
  bahaya: { label: 'Penting', icon: CircleAlert, text: 'text-neg', dot: '#C2382E' },
  perhatian: { label: 'Perhatian', icon: TriangleAlert, text: 'text-warn', dot: '#C78100' },
  info: { label: 'Info', icon: Info, text: 'text-info', dot: '#2F64B0' },
  baik: { label: 'Baik', icon: CircleCheck, text: 'text-pos', dot: '#0B7A57' },
}

export default function Insight({ item, compact }) {
  const L = LEVEL[item.level]
  return (
    <li className={`flex gap-3 ${compact ? 'py-3' : 'px-5 py-4'}`}>
      <L.icon size={16} strokeWidth={2} className={`mt-[3px] shrink-0 ${L.text}`} aria-label={L.label} />
      <div className="min-w-0">
        <p className="text-base font-medium leading-snug">{item.title}</p>
        <p className={`mt-0.5 text-sm leading-relaxed text-sub ${compact ? 'line-clamp-2' : ''}`}>{item.text}</p>
      </div>
    </li>
  )
}
