/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Biru laut - identitas NOKA (diganti dari hijau)
        brand: {
          50: '#eaf2fb',
          100: '#cfe3f6',
          400: '#3d7dc2',
          500: '#1d5c99',
          600: '#164a7c',
          700: '#123c64',
        },
        // Mustard gold - aksen promo/highlight, dipakai secukupnya.
        // Diganti dari terracotta (Stage 13) - kombinasi biru+mustard lebih
        // punya kesan "artisan/lokal", cocok untuk marketplace UMKM, dan
        // tidak umum dipakai jadi tidak terkesan template generik.
        accent: {
          50: '#fdf7e7',
          100: '#f7e8c1',
          400: '#c99a2e',
          500: '#92700e',
          600: '#785c0b',
          950: '#332707',
        },
        cream: '#f4f6f5',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
}
