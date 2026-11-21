'use client'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  LayoutGrid, ArrowDownLeft, ArrowUpRight, PiggyBank, HandCoins, BarChart3, SquarePen, Sparkles,
  LogOut, Plus, Menu, X, ChevronDown, Gem,
} from 'lucide-react'
import { useAuth } from '@/app/providers'
import DataProvider, { useData } from './DataProvider'
import { LocalModeNote, Spinner, ErrorText } from './ui'
import { ACCOUNT_ICON } from './AccountPicker'
import Logo from './Logo'
import { rupiah } from '@/lib/format'

export const INPUT_ITEMS = [
  { href: '/pemasukan/', label: 'Pemasukan', icon: ArrowDownLeft },
  { href: '/pengeluaran/', label: 'Pengeluaran', icon: ArrowUpRight },
  { href: '/simpanan/', label: 'Simpanan', icon: PiggyBank },
  { href: '/hutang-piutang/', label: 'Hutang & Piutang', icon: HandCoins },
  { href: '/aset/', label: 'Aset & Saldo', icon: Gem },
]
export const NAV = [
  { href: '/', label: 'Dasbor', icon: LayoutGrid },
  { href: '/input/', label: 'Input Variable', icon: SquarePen, children: INPUT_ITEMS },
  { href: '/analisis/', label: 'Data Analyst', icon: Sparkles },
  { href: '/laporan/', label: 'Laporan', icon: BarChart3 },
]
const TABS = [
  { href: '/', label: 'Dasbor', icon: LayoutGrid },
  { href: '/input/', label: 'Input', icon: SquarePen, match: ['/input/', ...INPUT_ITEMS.map((i) => i.href)] },
  null,
  { href: '/analisis/', label: 'Analyst', icon: Sparkles },
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

  if (!ready || !user) return <div className="mx-auto max-w-5xl p-8"><Spinner /></div>
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

  // Pintasan: N = catat transaksi baru.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() !== 'n' || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target
      if (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || document.querySelector('[role=dialog]')) return
      e.preventDefault(); openTx()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openTx])

  const nav = (
    <div className="space-y-7">
      <nav className="space-y-px">
        {NAV.map((item) => item.children
          ? <NavGroup key={item.href} item={item} path={path} />
          : <NavLink key={item.href} item={item} active={isActive(path, item.href)} />)}
      </nav>
      {!loading && <Suspense fallback={null}><Wallets path={path} /></Suspense>}
    </div>
  )
  const profile = (
    <div className="flex items-center gap-1 border-t border-line pt-3">
      <Link href="/akun/" title="Profil & pengaturan" className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1.5 transition ${isActive(path, '/akun/') ? 'bg-well' : 'hover:bg-well'}`}>
        <Avatar user={user} />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-medium">{user.username}</span>
          <span className="block truncate text-xs text-sub">{user.occupation || user.email}</span>
        </span>
      </Link>
      <button onClick={signOut} className="rounded-lg p-2 text-faint hover:bg-well hover:text-ink" aria-label="Keluar" title="Keluar"><LogOut size={16} /></button>
    </div>
  )

  return (
    <div className="min-h-dvh lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-subtle px-3 pb-3 pt-4 lg:flex">
        <Logo className="px-2" />
        <button onClick={() => openTx()} className="btn-primary mt-5 justify-between">
          <span className="flex items-center gap-1.5"><Plus size={16} /> Catat transaksi</span><span className="kbd">N</span>
        </button>
        <div className="mt-6 flex-1 overflow-y-auto">{nav}</div>
        {profile}
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-canvas/90 px-4 backdrop-blur lg:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          <Link href="/akun/" aria-label="Profil"><Avatar user={user} /></Link>
          <button onClick={() => setDrawer(true)} className="rounded-lg p-2 text-sub hover:bg-subtle" aria-label="Menu"><Menu size={20} /></button>
        </div>
      </header>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-black/30" aria-label="Tutup menu" onClick={() => setDrawer(false)} />
          <div className="fade-in absolute inset-y-0 right-0 flex w-80 max-w-[85vw] flex-col bg-subtle px-3 pb-3 pt-4">
            <div className="flex items-center justify-between px-2"><Logo /><button onClick={() => setDrawer(false)} className="rounded-lg p-2 text-sub hover:bg-well" aria-label="Tutup"><X size={18} /></button></div>
            <div className="mt-6 flex-1 overflow-y-auto">{nav}</div>
            {profile}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[1120px] px-4 pb-28 pt-6 sm:px-8 lg:pb-16 lg:pt-10">
        {mode === 'local' && <LocalModeNote className="mb-6" />}
        {error ? (
          <div className="space-y-3"><ErrorText>Gagal memuat data: {error}</ErrorText><button className="btn-secondary" onClick={reload}>Coba lagi</button></div>
        ) : loading ? <Spinner /> : children}
        <footer className="mt-16 border-t border-line pt-5 text-xs text-faint">© {new Date().getFullYear()} gammaproject. Hak cipta dilindungi.</footer>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-canvas/95 pb-[max(env(safe-area-inset-bottom),0.25rem)] backdrop-blur lg:hidden" aria-label="Navigasi utama">
        {TABS.map((item) => {
          if (!item) return (
            <div key="add" className="grid place-items-center">
              <button onClick={() => openTx()} aria-label="Catat transaksi" className="grid h-11 w-11 place-items-center rounded-full bg-ink text-white shadow-pop active:scale-95"><Plus size={22} /></button>
            </div>
          )
          const on = (item.match || [item.href]).some((h) => isActive(path, h))
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 pb-1.5 pt-2 text-2xs font-medium ${on ? 'text-ink' : 'text-faint'}`}>
              <item.icon size={20} strokeWidth={on ? 2.2 : 1.8} /> {item.label}
            </Link>
          )
        })}
        <button onClick={() => setDrawer(true)} className="flex flex-col items-center gap-1 pb-1.5 pt-2 text-2xs font-medium text-faint"><Menu size={20} strokeWidth={1.8} /> Lainnya</button>
      </nav>
    </div>
  )
}

function Wallets({ path }) {
  const { balances, openAccount } = useData()
  const params = useSearchParams()
  const cur = isActive(path, '/dompet/') ? params.get('id') : null
  const sum = balances.reduce((s, a) => s + a.balance, 0)
  return (
    <section>
      <div className="mb-1 flex items-center justify-between px-2">
        <span className="text-xs font-medium text-faint">Dompet</span>
        <button onClick={() => openAccount()} className="rounded-md p-1 text-faint hover:bg-well hover:text-ink" aria-label="Tambah dompet" title="Tambah dompet"><Plus size={14} /></button>
      </div>
      <ul className="space-y-px">
        {balances.map((a) => {
          const Icon = ACCOUNT_ICON[a.type]
          const on = cur === a.id
          return (
            <li key={a.id}>
              <Link href={`/dompet/?id=${a.id}`} className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition ${on ? 'bg-well font-medium text-ink' : 'text-sub hover:bg-well hover:text-ink'}`}>
                <Icon size={15} strokeWidth={1.8} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">{a.name}</span>
                <span className={`num text-xs ${a.balance < 0 ? 'text-neg' : ''}`}>{a.balance < 0 ? '−' : ''}{rupiah(Math.abs(a.balance)).replace('Rp', '').trim()}</span>
              </Link>
            </li>
          )
        })}
      </ul>
      <div className="mt-1 flex justify-between px-2 py-1.5 text-xs">
        <span className="text-faint">Total</span>
        <span className="num font-medium">{rupiah(sum)}</span>
      </div>
    </section>
  )
}

function Avatar({ user }) {
  return <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#E4E4E0] text-xs font-semibold uppercase text-ink">{user.username.slice(0, 2)}</span>
}

function NavLink({ item: { href, label, icon: Icon }, active, sub }) {
  return (
    <Link href={href} aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-2.5 rounded-lg px-2 text-sm transition ${sub ? 'h-8' : 'h-9'} ${active ? 'bg-well font-medium text-ink' : 'text-sub hover:bg-well hover:text-ink'}`}>
      {Icon && <Icon size={16} strokeWidth={active ? 2.2 : 1.8} className="shrink-0" />} {label}
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
        className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-2 text-sm transition hover:bg-well ${childActive ? 'font-medium text-ink' : 'text-sub hover:text-ink'}`}>
        <item.icon size={16} strokeWidth={1.8} /> <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown size={14} className={`text-faint transition ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && (
        <div className="relative ml-[17px] space-y-px border-l border-edge pl-2.5">
          {item.children.map((c) => <NavLink key={c.href} item={{ ...c, icon: null }} sub active={isActive(path, c.href)} />)}
        </div>
      )}
    </div>
  )
}
