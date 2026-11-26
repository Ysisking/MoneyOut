import Link from 'next/link'

// Dompet hitam dengan uang hijau bertuliskan "Rp" yang keluar dari dompet.
export function WalletMark({ className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g transform="rotate(-24 30 22)"><rect x="10" y="10" width="40" height="22" rx="3" fill="#0E7A4F"/></g>
      <g transform="rotate(-9 34 17)">
      <rect x="13" y="5" width="42" height="24" rx="3" fill="#16A34A"/>
      <rect x="15.5" y="7.5" width="37" height="19" rx="1.5" fill="none" stroke="#BBF7D0" strokeWidth="1.3" opacity=".85"/>
      <text x="34" y="22.6" textAnchor="middle" fontFamily="Geist,Arial,sans-serif" fontWeight="800" fontSize="13.5" letterSpacing="-.3" fill="#fff">Rp</text>
      </g>
      <path d="M4 33a5 5 0 0 1 5-5h45a6 6 0 0 1 6 6v21a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V33z" fill="#111"/>
      <path d="M4 33a5 5 0 0 1 5-5h45a6 6 0 0 1 3.6 1.2H9.5A3.5 3.5 0 0 0 6 32.7V40H4z" fill="#2E2E2E"/>
      <rect x="41" y="38" width="21" height="13" rx="4" fill="#2A2A2A"/>
      <circle cx="48" cy="44.5" r="2.7" fill="#22C55E"/>
    </svg>
  )
}
export const CoinMark = WalletMark

export default function Logo({ className = '' }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`} aria-label="MoneyOut, ke ringkasan">
      <WalletMark />
      <span className="text-md font-semibold tracking-tight">MoneyOut</span>
    </Link>
  )
}
