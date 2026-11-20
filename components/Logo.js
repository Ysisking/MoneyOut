import Link from 'next/link'

export default function Logo({ className = '' }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden="true"><rect width="64" height="64" rx="16" fill="#0E7A5F" /><path d="M18 42V22l14 12 14-12v20" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <span className="text-lg font-extrabold tracking-tight">Money<span className="text-brand">Out</span></span>
    </Link>
  )
}
