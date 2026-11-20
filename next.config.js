// Situs statis untuk GitHub Pages. NEXT_PUBLIC_BASE_PATH diisi otomatis oleh
// workflow dengan nama repo (mis. /GammaWeb); kosong saat dijalankan lokal.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

module.exports = {
  output: 'export',
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  devIndicators: false,
}
