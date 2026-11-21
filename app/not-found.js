import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <p className="num text-sm font-medium text-sub">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm text-sub">Alamatnya mungkin salah atau halamannya sudah dipindah.</p>
        <Link href="/" className="btn-primary mt-6">Kembali ke dasbor</Link>
        <p className="mt-10 text-xs text-faint">© {new Date().getFullYear()} gammaproject</p>
      </div>
    </div>
  )
}
