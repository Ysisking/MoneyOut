import Link from 'next/link'

// Koin emas bertuliskan "Rp".
export function CoinMark({ className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#D99A06" />
      <circle cx="32" cy="32" r="26" fill="#F4B71E" />
      <circle cx="32" cy="32" r="22" fill="none" stroke="#C78A00" strokeWidth="1.5" opacity=".7" />
      <text x="32" y="40" textAnchor="middle" fontFamily="Geist,Arial,sans-serif" fontWeight="700" fontSize="20" letterSpacing="-.5" fill="#5C3D00">Rp</text>
    </svg>
  )
}

export default function Logo({ className = '' }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`} aria-label="MoneyOut, ke ringkasan">
      <CoinMark />
      <span className="text-md font-semibold tracking-tight">MoneyOut</span>
    </Link>
  )
}
