/** @type {import('tailwindcss').Config} */
// Sistem visual "Buku Kas": kertas, tinta, dan angka gaya pembukuan.
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F3EEE4',   // latar halaman
        sheet: '#FFFDF8',   // lembar / permukaan
        ink: '#1C1A17',
        muted: '#6E665B',
        line: '#E4DBCB',    // garis buku
        rule: '#CDBFA6',    // garis tegas
        canvas: '#F7F2E9',
        gold: { DEFAULT: '#E0A400', soft: '#FBF0CF', text: '#7A5300' },
        brand: { DEFAULT: '#1F5A43', dark: '#163F2F', light: '#2E7A5C', soft: '#E3EDE6' },
        masuk: { DEFAULT: '#1baf7a', soft: '#E3F2EA', text: '#1B6B45' },
        keluar: { DEFAULT: '#eb6834', soft: '#FBE9E3', text: '#B3261E' },
        simpan: { DEFAULT: '#2a78d6', soft: '#E5EDF8', text: '#1F4E8C' },
        utang: { DEFAULT: '#eda100', soft: '#FBF0D5', text: '#8A5D00' },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { DEFAULT: '6px' },
    },
  },
  plugins: [],
}
