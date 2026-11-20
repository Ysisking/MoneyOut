'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownLeft, ArrowUpRight, PiggyBank, HandCoins } from 'lucide-react'
import { useAuth } from '@/app/providers'
import Logo from './Logo'
import { LocalModeNote, Spinner } from './ui'

const POINTS = [
  { icon: ArrowDownLeft, title: 'Pemasukan', text: 'Gaji bulanan sampai bayaran freelance harian.', cls: 'bg-masuk-soft text-masuk-text' },
  { icon: ArrowUpRight, title: 'Pengeluaran', text: 'Parkir, kopi, nasi, pakaian — tercatat semua.', cls: 'bg-keluar-soft text-keluar-text' },
  { icon: PiggyBank, title: 'Simpanan', text: 'Tabungan, investasi, emas, dan aset.', cls: 'bg-simpan-soft text-simpan-text' },
  { icon: HandCoins, title: 'Hutang & piutang', text: 'Siapa pinjam berapa, sudah dicicil berapa.', cls: 'bg-utang-soft text-utang-text' },
]

export const nextPath = () => {
  if (typeof window === 'undefined') return '/'
  const n = new URLSearchParams(window.location.search).get('next') || '/'
  return n.startsWith('/') && !n.startsWith('//') && !n.startsWith('/masuk') && !n.startsWith('/daftar') ? n : '/'
}

export default function AuthFrame({ title, subtitle, children }) {
  const { user, ready, mode } = useAuth()
  const router = useRouter()
  useEffect(() => { if (ready && user) router.replace(nextPath()) }, [ready, user, router])

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-brand-dark p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-light/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-masuk/20 blur-3xl" />
        <div className="relative flex items-center gap-2 text-xl font-extrabold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">M</span> MoneyOut</div>
        <div className="relative mt-auto max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight">Tahu uangmu datang dari mana, dan pergi ke mana.</h2>
          <p className="mt-3 text-white/75">Catatan keuangan harian untuk pekerja kantoran, freelancer, pelaku usaha, sampai mahasiswa.</p>
          <ul className="mt-8 grid grid-cols-2 gap-3">
            {POINTS.map(({ icon: Icon, title, text, cls }) => (
              <li key={title} className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <span className={`mb-2 inline-flex rounded-lg p-1.5 ${cls}`}><Icon size={18} /></span>
                <p className="font-bold">{title}</p>
                <p className="text-sm text-white/70">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="flex flex-col px-5 py-8 sm:px-10">
        <Logo className="lg:hidden" />
        <div className="m-auto w-full max-w-sm py-10">
          {!ready || user ? <Spinner /> : (
            <>
              <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
              <p className="mb-7 mt-1.5 text-muted">{subtitle}</p>
              {children}
              {mode === 'local' && <LocalModeNote className="mt-6" />}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
