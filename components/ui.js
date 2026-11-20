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
      <button aria-label="Tutup" className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted hover:bg-canvas" aria-label="Tutup"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function MonthSwitcher({ value, onChange }) {
  const now = thisMonth()
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-line bg-white p-1">
      <button className="rounded-lg p-1.5 hover:bg-canvas" onClick={() => onChange(shiftMonth(value, -1))} aria-label="Bulan sebelumnya"><ChevronLeft size={18} /></button>
      <span className="min-w-[8.5rem] text-center text-sm font-semibold capitalize">{monthLabel(value)}</span>
      <button className="rounded-lg p-1.5 hover:bg-canvas disabled:opacity-30" disabled={value >= now} onClick={() => onChange(shiftMonth(value, 1))} aria-label="Bulan berikutnya"><ChevronRight size={18} /></button>
    </div>
  )
}

export function Segmented({ options, value, onChange, className = '' }) {
  return (
    <div className={`inline-flex rounded-xl bg-canvas p-1 ${className}`} role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={`flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition ${value === o.value ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {Icon && <div className="mb-3 rounded-2xl bg-brand-soft p-3 text-brand"><Icon size={26} /></div>}
      <p className="font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export const Spinner = ({ label = 'Memuat…' }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-muted"><Loader2 className="animate-spin" size={20} /> {label}</div>
)

export function ErrorText({ children }) {
  if (!children) return null
  return <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700" role="alert">{children}</p>
}

export function LocalModeNote({ className = '' }) {
  return (
    <p className={`flex items-start gap-2 rounded-xl border border-utang/30 bg-utang-soft px-3 py-2 text-xs text-utang-text ${className}`}>
      <Info size={14} className="mt-0.5 shrink-0" />
      <span><b>Mode lokal:</b> Supabase belum diatur, jadi akun &amp; catatan hanya tersimpan di browser ini.</span>
    </p>
  )
}

export function PageHeader({ title, desc, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
      </div>
      {action}
    </div>
  )
}
