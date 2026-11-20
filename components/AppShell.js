'use client'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard, ArrowDownLeft, ArrowUpRight, PiggyBank, HandCoins, ChartColumn, SquarePen, BrainCircuit,
  LogOut, Plus, Menu, X, ChevronDown, ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/app/providers'
import DataProvider, { useData } from './DataProvider'
import { LocalModeNote, Spinner, ErrorText } from './ui'
import { ACCOUNT_ICON } from './AccountPicker'
import Logo from './Logo'
import { rupiah } from '@/lib/format'

// Menu utama. "Input Variable" berisi sub-menu pencatatan.
export const INPUT_ITEMS = [
  { href: '/pemasukan/', label: 'Pemasukan', icon: ArrowDownLeft },
  { href: '/pengeluaran/', label: 'Pengeluaran', icon: ArrowUpRight },
  { href: '/simpanan/', label: 'Simpanan', icon: PiggyBank },
  { href: '/hutang-piutang/', label: 'Hutang & Piutang', icon: HandCoins },
]
export const NAV = [
  { href: '/', label: 'Dasbor', icon: LayoutDashboard },
  { href: '/input/', label: 'Input Variable', icon: SquarePen, children: INPUT_ITEMS },
  { href: '/analisis/', label: 'Data Analyst', icon: BrainCircuit },
  { href: '/laporan/', label: 'Laporan', icon: ChartColumn },
]
const BOTTOM = [
  { href: '/', label: 'Dasbor', icon: LayoutDashboard },
  { href: '/input/', label: 'Input', icon: SquarePen, match: ['/input/', ...INPUT_ITEMS.map((i) => i.href)] },
  null,
  { href: '/analisis/', label: 'Analyst', icon: BrainCircuit },
]

const norm = (p) => (p || '/').replace(/\/+$/, '') || '/'
const isActive = (path, href) => norm(path) === norm(href)

export default function AppShell({ children }) {
  const { user, ready, mode } = useAuth()
  const router = useRouter()
  const path = usePathname()

  useEffect(() => {
    if (ready && !user) router.replace('/masuk/?next=' + encodeURIComponent(path || '/'))
  }, [ready, user, router, path])

  if (!ready || !user) return <div className="min-h-dvh"><Spinner /></div>
  return (
    <DataProvider userId={user.id}>
      <Frame user={user} mode={mode} path={path}>{children}</Frame>
    </DataProvider>
  )
}

function Frame({ user, mode, path, children }) {
  const { signOut } = useAuth()
  const { openTx, loading, error, reload } = useData()
  const [drawer, setDrawer] = useState(false)
  useEffect(() => setDrawer(false), [path])

  const side = (
    <>
      <nav className="space-y-0.5">
        {NAV.map((item) => item.children
          ? <NavGroup key={item.href} item={item} path={path} />
          : <NavLink key={item.href} item={item} active={isActive(path, item.href)} />)}
      </nav>
      {!loading && <Suspense fallback={null}><Wallets path={path} /></Suspense>}
    </>
  )
  const onAkun = isActive(path, '/akun/')
  const userBox = (
    <div className="flex items-center gap-1 border-t border-rule pt-3">
      <Link href="/akun/" aria-current={onAkun ? 'page' : undefined} title="Buka profil"
        className={`group flex min-w-0 flex-1 items-center gap-3 rounded-md p-2 transition ${onAkun ? 'bg-canvas' : 'hover:bg-canvas'}`}>
        <Avatar user={user} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">@{user.username}</span>
          <span className="block truncate text-xs text-muted">{user.occupation || user.email}</span>
        </span>
        <ChevronRight size={16} className="shrink-0 text-muted transition group-hover:translate-x-0.5" />
      </Link>
      <button onClick={signOut} className="rounded-md p-2.5 text-muted hover:bg-canvas hover:text-keluar-text" aria-label="Keluar" title="Keluar"><LogOut size={18} /></button>
    </div>
  )

  return (
    <div className="min-h-dvh lg:pl-[17rem]">
      <aside className="fixed inset-y-0 left-0 hidden w-[17rem] flex-col gap-4 border-r border-rule bg-sheet px-3 py-4 lg:flex">
        <Logo className="px-2" />
        <button onClick={() => openTx()} className="btn-primary mx-1"><Plus size={18} /> Catat</button>
        <div className="flex-1 space-y-6 overflow-y-auto px-1">{side}</div>
        {userBox}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-rule bg-sheet/95 px-4 py-2.5 backdrop-blur lg:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          <Link href="/akun/" aria-label="Buka profil" className="rounded-full p-0.5"><Avatar user={user} size="h-9 w-9" /></Link>
          <button onClick={() => setDrawer(true)} className="rounded-md p-2 hover:bg-canvas" aria-label="Buka menu"><Menu size={22} /></button>
        </div>
      </header>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-ink/45" aria-label="Tutup menu" onClick={() => setDrawer(false)} />
          <div className="rise absolute inset-y-0 right-0 flex w-80 max-w-[88vw] flex-col gap-4 border-l border-rule bg-sheet p-4">
            <div className="flex items-center justify-between"><Logo /><button onClick={() => setDrawer(false)} className="rounded-md p-2 hover:bg-canvas" aria-label="Tutup menu"><X size={20} /></button></div>
            <div className="flex-1 space-y-6 overflow-y-auto">{side}</div>
            {userBox}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:pb-14 lg:pt-8">
        {mode === 'local' && <LocalModeNote className="mb-5" />}
        {error ? (
          <div className="space-y-3"><ErrorText>Gagal memuat data: {error}</ErrorText><button className="btn-ghost" onClick={reload}>Coba lagi</button></div>
        ) : loading ? <Spinner /> : children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-rule bg-sheet px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] lg:hidden">
        {BOTTOM.map((item) => {
          if (!item) return (
            <div key="add" className="flex justify-center">
              <button onClick={() => openTx()} aria-label="Catat transaksi" className="-mt-5 grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-[0_6px_0_-2px_#163F2F] ring-4 ring-sheet active:translate-y-0.5"><Plus size={26} /></button>
            </div>
          )
          const on = (item.match || [item.href]).some((h) => isActive(path, h))
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 border-t-2 pb-1 pt-2 text-[11px] font-semibold ${on ? 'border-ink text-ink' : 'border-transparent text-muted'}`}>
              <item.icon size={21} /> {item.label}
            </Link>
          )
        })}
        <button onClick={() => setDrawer(true)} className="flex flex-col items-center gap-0.5 border-t-2 border-transparent pb-1 pt-2 text-[11px] font-semibold text-muted"><Menu size={21} /> Lainnya</button>
      </nav>
    </div>
  )
}

// Daftar dompet beserta saldonya — seperti "account bar" di aplikasi keuangan klasik.
function Wallets({ path }) {
  const { balances, openAccount } = useData()
  const sum = balances.reduce((s, a) => s + a.balance, 0)
  const params = useSearchParams()
  const cur = isActive(path, '/dompet/') ? params.get('id') : null
  return (
    <section>
      <div className="mb-1.5 flex items-center justify-between px-3">
        <span className="eyebrow">Dompet</span>
        <button onClick={() => openAccount()} className="rounded p-0.5 text-muted hover:bg-canvas hover:text-ink" aria-label="Tambah dompet" title="Tambah dompet"><Plus size={16} /></button>
      </div>
      <ul>
        {balances.map((a) => {
          const Icon = ACCOUNT_ICON[a.type]
          const on = cur === a.id
          return (
            <li key={a.id}>
              <Link href={`/dompet/?id=${a.id}`} className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition ${on ? 'bg-canvas font-semibold' : 'hover:bg-canvas'}`}>
                <Icon size={15} className="shrink-0 text-muted" />
                <span className="min-w-0 flex-1 truncate">{a.name}</span>
                <span className={`num text-xs ${a.balance < 0 ? 'text-keluar-text' : ''}`}>{rupiah(a.balance).replace('Rp', '').trim()}</span>
              </Link>
            </li>
          )
        })}
      </ul>
      <div className="mx-3 mt-1.5 flex items-baseline justify-between border-t border-ink pt-1.5 text-sm">
        <span className="font-semibold">Total</span>
        <span className="num total-rule font-semibold">{rupiah(sum)}</span>
      </div>
    </section>
  )
}

function Avatar({ user, size = 'h-10 w-10' }) {
  return <span className={`grid ${size} shrink-0 place-items-center rounded-full border-2 border-ink bg-gold-soft font-display text-sm font-semibold uppercase text-ink`}>{user.username.slice(0, 2)}</span>
}

function NavLink({ item: { href, label, icon: Icon }, active, sub }) {
  return (
    <Link href={href} aria-current={active ? 'page' : undefined}
      className={`relative flex items-center gap-3 rounded-md px-3 text-sm transition ${sub ? 'py-1.5' : 'py-2'} ${active ? 'bg-canvas font-semibold text-ink before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-ink' : 'text-muted hover:bg-canvas hover:text-ink'}`}>
      <Icon size={sub ? 16 : 18} /> {label}
    </Link>
  )
}

function NavGroup({ item, path }) {
  const childActive = item.children.some((c) => isActive(path, c.href))
  const [open, setOpen] = useState(true)
  useEffect(() => { if (childActive) setOpen(true) }, [childActive])
  return (
    <div>
      <button onClick={() => setOpen(!open)} aria-expanded={open}
        className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition ${childActive || isActive(path, item.href) ? 'font-semibold text-ink' : 'text-muted hover:bg-canvas hover:text-ink'}`}>
        <item.icon size={18} /> <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown size={15} className={`transition ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && (
        <div className="ml-[1.3rem] space-y-0.5 border-l border-rule pl-2">
          {item.children.map((c) => <NavLink key={c.href} item={c} sub active={isActive(path, c.href)} />)}
        </div>
      )}
    </div>
  )
}
