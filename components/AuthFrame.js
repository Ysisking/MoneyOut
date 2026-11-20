'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import Logo from './Logo'
import { LocalModeNote, Spinner } from './ui'

// Contoh isi buku kas untuk ilustrasi halaman masuk/daftar.
const SAMPLE = [
  ['01', 'Gaji bulanan', 7000000, 0],
  ['03', 'Parkir minimarket', 0, 5000],
  ['03', 'Kopi susu gula aren', 0, 22000],
  ['05', 'Proyek logo (freelance)', 1250000, 0],
  ['07', 'Setor tabungan', 0, 1000000],
  ['09', 'Nasi padang', 0, 18000],
]
const fmt = (n) => (n ? n.toLocaleString('id-ID') : '')

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
      {/* Sampul buku kas: kain hijau, judul emas, halaman bergaris */}
      <section className="relative hidden overflow-hidden p-12 text-[#F3E3B5] lg:flex lg:flex-col"
        style={{ background: 'repeating-linear-gradient(45deg, #17402F 0 2px, #163C2D 2px 4px)' }}>
        <div className="absolute inset-y-0 left-8 w-px bg-black/25 shadow-[1px_0_0_rgba(255,255,255,.06)]" />
        <Logo light className="relative" />
        <div className="relative mt-10 max-w-lg">
          <p className="eyebrow !text-[#E0A400]/80">Buku kas pribadi</p>
          <h2 className="mt-2 text-[2.6rem] font-semibold leading-[1.1] text-[#F6E7BD]">Tahu uangmu datang dari mana, dan pergi ke mana.</h2>
        </div>
        <div className="relative mt-auto max-w-lg -rotate-1 rounded-sm bg-sheet p-5 pt-4 text-ink shadow-[0_18px_40px_-12px_rgba(0,0,0,.55)]">
          <div className="absolute inset-y-0 left-12 w-px bg-keluar/40" />
          <p className="mb-2 flex justify-between pl-9 font-display text-sm font-semibold">November <span className="num text-xs font-normal text-muted">hal. 11</span></p>
          <table className="w-full text-[13px]">
            <thead><tr className="border-b-2 border-ink text-left text-[10px] uppercase tracking-[0.12em] text-muted"><th className="w-9 pb-1 font-semibold">Tgl</th><th className="pb-1 font-semibold">Keterangan</th><th className="pb-1 text-right font-semibold">Masuk</th><th className="pb-1 text-right font-semibold">Keluar</th></tr></thead>
            <tbody>
              {SAMPLE.map(([d, k, i, o], n) => (
                <tr key={n} className="border-b border-line">
                  <td className="num py-1.5 text-muted">{d}</td><td className="py-1.5">{k}</td>
                  <td className="num py-1.5 text-right text-masuk-text">{fmt(i)}</td><td className="num py-1.5 text-right text-keluar-text">{fmt(o)}</td>
                </tr>
              ))}
              <tr><td /><td className="pt-2 font-semibold">Sisa</td><td colSpan={2} className="pt-2 text-right"><span className="num total-rule font-semibold">7.205.000</span></td></tr>
            </tbody>
          </table>
        </div>
      </section>
      <section className="flex flex-col bg-paper px-5 py-8 sm:px-10">
        <Logo className="lg:hidden" />
        <div className="m-auto w-full max-w-sm py-10">
          {!ready || user ? <Spinner /> : (
            <>
              <h1 className="text-[2.2rem] font-semibold leading-tight">{title}</h1>
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
