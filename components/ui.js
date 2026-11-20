'use client'
import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, X, Info } from 'lucide-react'
import { monthLabel, shiftMonth, thisMonth } from '@/lib/format'

export function Modal({ open, onClose, title, description, children, footer, wide }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-start sm:p-4 sm:pt-[6vh]" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Tutup" className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className={`fade-in relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-canvas shadow-modal sm:max-h-[88vh] sm:rounded-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-[480px]'}`}>
        <div className="flex items-start justify-between gap-4 px-6 pb-1 pt-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-sub">{description}</p>}
          </div>
          <button onClick={onClose} className="-mr-2 -mt-1 rounded-lg p-1.5 text-faint hover:bg-subtle hover:text-ink" aria-label="Tutup"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-6 py-3.5">{footer}</div>}
      </div>
    </div>
  )
}

export function MonthSwitcher({ value, onChange }) {
  const now = thisMonth()
  return (
    <div className="inline-flex h-9 items-center rounded-lg border border-edge bg-canvas">
      <button className="grid h-full w-8 place-items-center text-sub hover:text-ink" onClick={() => onChange(shiftMonth(value, -1))} aria-label="Bulan sebelumnya"><ChevronLeft size={16} /></button>
      <span className="min-w-[7.5rem] px-1 text-center text-sm font-medium capitalize">{monthLabel(value)}</span>
      <button className="grid h-full w-8 place-items-center text-sub hover:text-ink disabled:opacity-30" disabled={value >= now} onClick={() => onChange(shiftMonth(value, 1))} aria-label="Bulan berikutnya"><ChevronRight size={16} /></button>
    </div>
  )
}

export function Segmented({ options, value, onChange, className = '', size = 'md' }) {
  return (
    <div className={`inline-flex rounded-lg bg-well p-0.5 ${className}`} role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={`flex-1 whitespace-nowrap rounded-md font-medium transition ${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'} ${value === o.value ? 'bg-canvas text-ink shadow-[0_1px_2px_rgba(0,0,0,.08)]' : 'text-sub hover:text-ink'}`}>
          {o.label}{o.count != null && <span className="ml-1.5 text-faint">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, text, action, compact }) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'px-4 py-8' : 'px-6 py-14'}`}>
      {Icon && <span className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-subtle text-sub"><Icon size={18} /></span>}
      <p className="text-md font-medium">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-sub">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Spinner() {
  return (
    <div className="space-y-4 py-2" aria-label="Memuat">
      <div className="h-7 w-48 animate-pulse rounded-md bg-well" />
      <div className="h-40 animate-pulse rounded-xl bg-subtle" />
      <div className="grid grid-cols-3 gap-4">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-subtle" />)}</div>
    </div>
  )
}

export function ErrorText({ children }) {
  if (!children) return null
  return <p className="rounded-lg bg-[#FBECEA] px-3 py-2 text-sm text-neg" role="alert">{children}</p>
}

export function LocalModeNote({ className = '' }) {
  return (
    <p className={`flex items-center gap-2 rounded-lg border border-line bg-subtle px-3 py-2 text-xs text-sub ${className}`}>
      <Info size={14} className="shrink-0" />
      Mode lokal: Supabase belum diatur, data hanya tersimpan di browser ini.
    </p>
  )
}

export function PageHeader({ title, desc, action, back }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        {back}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {desc && <p className="mt-1 max-w-xl text-sm text-sub">{desc}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </header>
  )
}

export function SectionTitle({ children, action, className = '' }) {
  return (
    <div className={`mb-3 flex items-center justify-between gap-3 ${className}`}>
      <h2 className="text-md font-semibold tracking-tight">{children}</h2>
      {action}
    </div>
  )
}

export const LinkAction = ({ children, ...p }) => <button {...p} className="text-sm font-medium text-sub hover:text-ink">{children}</button>

export function Stat({ label, value, hint, tone = '', className = '' }) {
  return (
    <div className={className}>
      <p className="text-sm text-sub">{label}</p>
      <p className={`num mt-1 text-xl font-semibold tracking-tight ${tone}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-faint">{hint}</p>}
    </div>
  )
}

// Ikon kategori dalam lingkaran netral.
export function IconBubble({ icon: Icon, size = 'md', tone = 'bg-subtle text-ink' }) {
  const s = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'
  return <span className={`grid ${s} shrink-0 place-items-center rounded-full ${tone}`}><Icon size={size === 'sm' ? 14 : 16} strokeWidth={1.8} /></span>
}

export function Progress({ value, color = '#111', className = '' }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-well ${className}`}>
      <div className="grow-x h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, background: color }} />
    </div>
  )
}
