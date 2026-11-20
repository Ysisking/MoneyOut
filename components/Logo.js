import Link from 'next/link'

// Ikon koin emas bertuliskan "Rp".
export function CoinMark({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="31" fill="#C98500" />
      <circle cx="32" cy="32" r="28.5" fill="#F2B705" />
      <circle cx="32" cy="32" r="25.5" fill="none" stroke="#C98500" strokeWidth="1.6" strokeDasharray="2 2.4" />
      <circle cx="32" cy="32" r="21" fill="#FFD34D" />
      <path d="M17 26a17 17 0 0 1 14-11" fill="none" stroke="#FFF3C4" strokeWidth="3" strokeLinecap="round" />
      <text x="32" y="40.5" textAnchor="middle" fontFamily="'Plus Jakarta Sans',Arial,sans-serif" fontWeight="800" fontSize="21" fill="#7A4A00">Rp</text>
    </svg>
  )
}

export default function Logo({ className = '', light = false }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <CoinMark />
      <span className={`text-lg font-extrabold tracking-tight ${light ? 'text-white' : ''}`}>
        Money<span className={light ? 'text-[#FFD34D]' : 'text-brand'}>Out</span>
      </span>
    </Link>
  )
}
