'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Utensils, SquareParking, Briefcase, Coffee } from 'lucide-react'
import { useAuth } from '@/app/providers'
import Logo from './Logo'
import { LocalModeNote, IconBubble } from './ui'

export const nextPath = () => {
  if (typeof window === 'undefined') return '/'
  const n = new URLSearchParams(window.location.search).get('next') || '/'
  return n.startsWith('/') && !n.startsWith('//') && !n.startsWith('/masuk') && !n.startsWith('/daftar') ? n : '/'
}

// Cuplikan produk: dibuat dari komponen asli, bukan ilustrasi.
const SAMPLE = [
  [Briefcase, 'Gaji November', 'Gaji Bulanan · BCA', '+Rp 7.000.000', true],
  [Coffee, 'Kopi susu', 'Kopi & Jajan · GoPay', '−Rp 22.000'],
  [SquareParking, 'Parkir kantor', 'Parkir · Tunai', '−Rp 5.000'],
  [Utensils, 'Makan siang', 'Makan & Minum · GoPay', '−Rp 25.000'],
]
const PATH = 'M0,70 L30,66 L60,68 L90,40 L120,44 L150,46 L180,30 L210,34 L240,36 L270,22 L300,26'

function Preview() {
  return (
    <div className="w-full max-w-[420px] space-y-3" aria-hidden="true">
      <div className="panel p-5 shadow-pop">
        <p className="text-sm text-sub">Total saldo</p>
        <p className="num mt-1 text-3xl font-semibold tracking-tight">Rp 17.050.000</p>
        <p className="mt-1 text-sm text-sub"><span className="num font-medium text-pos">+Rp 1.240.000</span> dalam 30 hari terakhir</p>
        <svg viewBox="0 0 300 80" className="mt-4 h-20 w-full" preserveAspectRatio="none">
          <defs><linearGradient id="pv" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#0B7A57" stopOpacity=".14" /><stop offset="1" stopColor="#0B7A57" stopOpacity="0" /></linearGradient></defs>
          <path d={`${PATH} L300,80 L0,80 Z`} fill="url(#pv)" />
          <path d={PATH} fill="none" stroke="#0B7A57" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="panel overflow-hidden shadow-pop">
        {SAMPLE.map(([Icon, t, s, a, pos]) => (
          <div key={t} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
            <IconBubble icon={Icon} />
            <span className="min-w-0 flex-1"><span className="block text-base font-medium">{t}</span><span className="block text-sm text-sub">{s}</span></span>
            <span className={`num text-base font-medium ${pos ? 'text-pos' : ''}`}>{a}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AuthFrame({ title, subtitle, children }) {
  const { user, ready, mode } = useAuth()
  const router = useRouter()
  useEffect(() => { if (ready && user) router.replace(nextPath()) }, [ready, user, router])

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <section className="flex flex-col px-6 py-6 sm:px-12">
        <Logo />
        <div className="m-auto w-full max-w-[360px] py-12">
          {!ready || user ? <div className="h-64 animate-pulse rounded-xl bg-subtle" /> : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="mb-8 mt-1.5 text-base text-sub">{subtitle}</p>
              {children}
              {mode === 'local' && <LocalModeNote className="mt-8" />}
            </>
          )}
        </div>
        <p className="text-xs text-faint">© {new Date().getFullYear()} MoneyOut</p>
      </section>
      <section className="hidden flex-col items-center justify-center gap-10 border-l border-line bg-subtle p-12 lg:flex">
        <Preview />
        <div className="max-w-[420px] text-center">
          <p className="text-lg font-semibold tracking-tight">Semua uangmu, di satu tempat.</p>
          <p className="mt-1.5 text-sm text-sub">Catat pemasukan, pengeluaran, simpanan, dan hutang. Pantau saldo tiap dompet dan dapatkan analisis otomatis setiap bulan.</p>
        </div>
      </section>
    </div>
  )
}
