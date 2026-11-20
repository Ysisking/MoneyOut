'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ArrowDownLeft, ArrowUpRight, PiggyBank, HandCoins, ChartColumn, SquarePen, BrainCircuit,
  LogOut, Plus, Menu, X, ChevronDown, ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/app/providers'
import DataProvider, { useData } from './DataProvider'
import { LocalModeNote, Spinner, ErrorText } from './ui'
import Logo from './Logo'

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

  const navList = (
    <nav className="space-y-1">
      {NAV.map((item) => item.children
        ? <NavGroup key={item.href} item={item} path={path} />
        : <NavLink key={item.href} item={item} active={isActive(path, item.href)} />)}
    </nav>
  )
  const onAkun = isActive(path, '/akun/')
  const userBox = (
    <div className="flex items-center gap-1 border-t border-line pt-3">
      <Link href="/akun/" aria-current={onAkun ? 'page' : undefined} title="Buka profil"
        className={`group flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 transition ${onAkun ? 'bg-brand-soft' : 'hover:bg-canvas'}`}>
        <Avatar user={user} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">@{user.username}</span>
          <span className="block truncate text-xs text-muted">{user.occupation || user.email}</span>
        </span>
        <ChevronRight size={16} className="shrink-0 text-muted transition group-hover:translate-x-0.5" />
      </Link>
      <button onClick={signOut} className="rounded-xl p-2.5 text-muted hover:bg-canvas hover:text-red-700" aria-label="Keluar" title="Keluar"><LogOut size={18} /></button>
    </div>
  )

  return (
    <div className="min-h-dvh lg:pl-64">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-5 border-r border-line bg-white p-4 lg:flex">
        <Logo className="px-2 pt-1" />
        <button onClick={() => openTx()} className="btn-primary w-full"><Plus size={18} /> Catat transaksi</button>
        <div className="flex-1 overflow-y-auto">{navList}</div>
        {userBox}
      </aside>

      {/* Bar atas mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          <Link href="/akun/" aria-label="Buka profil" className="rounded-full p-0.5 ring-2 ring-transparent hover:ring-brand/30"><Avatar user={user} size="h-9 w-9" /></Link>
          <button onClick={() => setDrawer(true)} className="rounded-xl p-2 hover:bg-canvas" aria-label="Buka menu"><Menu size={22} /></button>
        </div>
      </header>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-ink/40" aria-label="Tutup menu" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col gap-4 bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between"><Logo /><button onClick={() => setDrawer(false)} className="rounded-xl p-2 hover:bg-canvas" aria-label="Tutup menu"><X size={20} /></button></div>
            <div className="flex-1 overflow-y-auto">{navList}</div>
            {userBox}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:pb-12 lg:pt-8">
        {mode === 'local' && <LocalModeNote className="mb-5" />}
        {error ? (
          <div className="space-y-3"><ErrorText>Gagal memuat data: {error}</ErrorText><button className="btn-ghost" onClick={reload}>Coba lagi</button></div>
        ) : loading ? <Spinner /> : children}
      </main>

      {/* Navigasi bawah mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 lg:hidden">
        {BOTTOM.map((item) => {
          if (!item) return (
            <div key="add" className="flex justify-center">
              <button onClick={() => openTx()} aria-label="Catat transaksi" className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-lg shadow-brand/30 ring-4 ring-white"><Plus size={26} /></button>
            </div>
          )
          const on = (item.match || [item.href]).some((h) => isActive(path, h))
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 py-1 text-[11px] font-semibold ${on ? 'text-brand' : 'text-muted'}`}>
              <item.icon size={21} /> {item.label}
            </Link>
          )
        })}
        <button onClick={() => setDrawer(true)} className="flex flex-col items-center gap-0.5 py-1 text-[11px] font-semibold text-muted"><Menu size={21} /> Lainnya</button>
      </nav>
    </div>
  )
}

function Avatar({ user, size = 'h-10 w-10' }) {
  return <span className={`grid ${size} shrink-0 place-items-center rounded-full bg-brand text-sm font-bold uppercase text-white`}>{user.username.slice(0, 2)}</span>
}

function NavLink({ item: { href, label, icon: Icon }, active, sub }) {
  return (
    <Link href={href} aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${sub ? 'py-2' : 'py-2.5'} ${active ? 'bg-brand-soft text-brand-dark' : 'text-muted hover:bg-canvas hover:text-ink'}`}>
      <Icon size={sub ? 17 : 19} /> {label}
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
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${childActive || isActive(path, item.href) ? 'text-ink' : 'text-muted hover:bg-canvas hover:text-ink'}`}>
        <item.icon size={19} /> <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown size={16} className={`transition ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && (
        <div className="ml-[1.35rem] space-y-0.5 border-l border-line pl-2">
          {item.children.map((c) => <NavLink key={c.href} item={c} sub active={isActive(path, c.href)} />)}
        </div>
      )}
    </div>
  )
}
