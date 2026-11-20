import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <p className="text-6xl font-extrabold text-brand">404</p>
        <p className="mt-2 font-semibold">Halaman tidak ditemukan.</p>
        <Link href="/" className="btn-primary mt-5">Kembali ke dasbor</Link>
      </div>
    </div>
  )
}
