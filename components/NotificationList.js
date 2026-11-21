import { CircleCheck, Info, TriangleAlert, CircleAlert, Megaphone } from 'lucide-react'

const LEVEL = {
  success: { icon: CircleCheck, c: 'text-pos' },
  info: { icon: Info, c: 'text-info' },
  warning: { icon: TriangleAlert, c: 'text-warn' },
  danger: { icon: CircleAlert, c: 'text-neg' },
}
export const LEVEL_LABEL = { info: 'Info', success: 'Kabar baik', warning: 'Penting', danger: 'Mendesak' }

export function timeAgo(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'baru saja'
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} hari lalu`
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function NotificationItem({ n, action }) {
  const L = LEVEL[n.level] || LEVEL.info
  const Icon = n.kind === 'broadcast' ? Megaphone : L.icon
  return (
    <li className={`flex gap-3 px-5 py-4 ${n.read === false ? 'bg-[#FAFAF5]' : ''}`}>
      <Icon size={17} strokeWidth={2} className={`mt-[3px] shrink-0 ${n.kind === 'broadcast' ? 'text-ink' : L.c}`} />
      <div className="min-w-0 flex-1">
        <p className="flex items-start gap-2 text-base font-medium leading-snug">
          <span className="flex-1">{n.title}</span>
          {n.read === false && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#2F64B0]" aria-label="Belum dibaca" />}
        </p>
        {n.body && <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-sub">{n.body}</p>}
        <p className="mt-1.5 text-xs text-faint">{n.kind === 'broadcast' ? 'Pengumuman admin' : 'Sistem'} · {timeAgo(n.created_at)}</p>
      </div>
      {action}
    </li>
  )
}
