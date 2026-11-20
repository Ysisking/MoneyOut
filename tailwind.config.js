/** @type {import('tailwindcss').Config} */
// Sistem desain MoneyOut: netral, satu tipe huruf, warna hanya untuk makna.
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FFFFFF',
        subtle: '#F7F7F6',   // sidebar, hover, latar sekunder
        well: '#F0F0EE',     // isian, track progress
        line: '#E9E9E6',     // garis rambut
        edge: '#DADAD6',     // border kontrol
        ink: '#111111',
        sub: '#5F5F5B',      // teks sekunder
        faint: '#9A9A95',    // teks tersier
        brand: { DEFAULT: '#0B7A57', hover: '#096548', soft: '#E8F5EF' },
        pos: '#0B7A57',      // nilai masuk
        neg: '#C2382E',      // bahaya / lewat batas
        warn: '#A66300',
        info: '#2F64B0',
        // Warna seri grafik (palet tervalidasi: hijau-oranye-biru)
        masuk: { DEFAULT: '#1baf7a', soft: '#EAF6F1', text: '#0B7A57' },
        keluar: { DEFAULT: '#eb6834', soft: '#FDEEE8', text: '#B5401C' },
        simpan: { DEFAULT: '#2a78d6', soft: '#EBF2FB', text: '#2F64B0' },
        utang: { DEFAULT: '#eda100', soft: '#FDF4DF', text: '#8A5A00' },
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['11px', '16px'],
        xs: ['12px', '16px'],
        sm: ['13px', '20px'],
        base: ['14px', '22px'],
        md: ['15px', '22px'],
        lg: ['17px', '24px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '36px'],
        '4xl': ['38px', '44px'],
      },
      boxShadow: {
        pop: '0 1px 2px rgba(17,17,17,.04), 0 8px 24px -6px rgba(17,17,17,.12)',
        modal: '0 24px 64px -16px rgba(17,17,17,.28), 0 2px 6px rgba(17,17,17,.06)',
      },
    },
  },
  plugins: [],
}
