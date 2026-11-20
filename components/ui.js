'use client'
import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, X, Loader2, Info } from 'lucide-react'
import { monthLabel, shiftMonth, thisMonth } from '@/lib/format'

export function Modal({ open, onClose, title, children, footer, wide }) {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Tutup" className="absolute inset-0 bg-ink/45" onClick={onClose} />
      <div className={`rise relative flex max-h-[94dvh] w-full flex-col rounded-t-xl border border-rule bg-sheet shadow-2xl sm:rounded-xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}>
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted hover:bg-canvas" aria-label="Tutup"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-3">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-canvas/60 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function MonthSwitcher({ value, onChange }) {
  const now = thisMonth()
  return (
    <div className="inline-flex items-center rounded-md border border-rule bg-sheet">
      <button className="px-2 py-1.5 text-muted hover:text-ink" onClick={() => onChange(shiftMonth(value, -1))} aria-label="Bulan sebelumnya"><ChevronLeft size={18} /></button>
      <span className="min-w-[8.5rem] border-x border-line px-2 py-1.5 text-center font-display text-[15px] font-semibold capitalize">{monthLabel(value)}</span>
      <button className="px-2 py-1.5 text-muted hover:text-ink disabled:opacity-25" disabled={value >= now} onClick={() => onChange(shiftMonth(value, 1))} aria-label="Bulan berikutnya"><ChevronRight size={18} /></button>
    </div>
  )
}

export function Segmented({ options, value, onChange, className = '' }) {
  return (
    <div className={`inline-flex rounded-md border border-rule bg-sheet p-0.5 ${className}`} role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={`flex-1 whitespace-nowrap rounded px-3 py-1.5 text-sm font-semibold transition ${value === o.value ? 'bg-ink text-sheet' : 'text-muted hover:text-ink'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {Icon && <Icon size={28} strokeWidth={1.5} className="mb-3 text-rule" />}
      <p className="font-display text-lg font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export const Spinner = ({ label = 'Membuka buku…' }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-muted"><Loader2 className="animate-spin" size={20} /> {label}</div>
)

export function ErrorText({ children }) {
  if (!children) return null
  return <p className="rounded-md border border-red-200 bg-keluar-soft px-3.5 py-2.5 text-sm text-keluar-text" role="alert">{children}</p>
}

export function LocalModeNote({ className = '' }) {
  return (
    <p className={`flex items-start gap-2 rounded-md border border-dashed border-utang/50 bg-utang-soft/60 px-3 py-2 text-xs text-utang-text ${className}`}>
      <Info size={14} className="mt-0.5 shrink-0" />
      <span><b>Mode lokal:</b> Supabase belum diatur, jadi akun &amp; catatan hanya tersimpan di browser ini.</span>
    </p>
  )
}

// Kop halaman: label kecil + judul serif, garis bawah seperti kop buku.
export function PageHeader({ eyebrow, title, desc, action }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-4">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold leading-tight sm:text-[2.1rem]">{title}</h1>
        {desc && <p className="mt-1 max-w-2xl text-sm text-muted">{desc}</p>}
      </div>
      {action}
    </header>
  )
}

export function SectionTitle({ children, action, className = '' }) {
  return (
    <div className={`mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 ${className}`}>
      <h2 className="text-lg font-semibold">{children}</h2>
      {action}
    </div>
  )
}
