/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0a0a0a',
          card: '#161616',
          border: '#2c2c2e',
          amber: '#fbbf24',
          gold: '#f59e0b',
          textSoft: '#a1a1aa',
          textLight: '#f4f4f5'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-gold': '0 8px 32px 0 rgba(245, 158, 11, 0.15)',
      }
    },
  },
  plugins: [],
}
