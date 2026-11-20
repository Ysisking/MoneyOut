/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F1A17',
        muted: '#5B6B66',
        line: '#E3E9E6',
        canvas: '#F5F8F6',
        brand: { DEFAULT: '#0E7A5F', dark: '#0A5E49', light: '#12A07C', soft: '#E3F4EE' },
        masuk: { DEFAULT: '#1baf7a', soft: '#E2F6EE', text: '#0B7A52' },
        keluar: { DEFAULT: '#eb6834', soft: '#FDEDE6', text: '#B8441A' },
        simpan: { DEFAULT: '#2a78d6', soft: '#E6F0FB', text: '#1F5FAE' },
        utang: { DEFAULT: '#eda100', soft: '#FDF3DC', text: '#8A5D00' },
      },
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgba(15,26,23,.04), 0 4px 16px rgba(15,26,23,.04)' },
    },
  },
  plugins: [],
}
