import './globals.css'
import Providers from './providers'
import { BASE } from '@/lib/config'

export const metadata = {
  title: { default: 'MoneyOut · Catat uang masuk & keluar', template: '%s · MoneyOut' },
  description: 'Catatan keuangan pribadi: pemasukan, pengeluaran, simpanan, hutang dan piutang.',
  icons: { icon: BASE + '/icon.svg' },
}
export const viewport = { themeColor: "#0E7A5F", width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-h-dvh"><Providers>{children}</Providers></body>
    </html>
  )
}
