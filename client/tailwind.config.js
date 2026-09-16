/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        marron: {
          50: '#FDF7F8',
          100: '#FBF0F2',
          200: '#F5DEE3',
          300: '#E8B6C2',
          400: '#D5869C',
          500: '#B85573',
          600: '#943854',
          700: '#752940',
          800: '#4A1525', // Primary Deep Marron
          900: '#340C18',
          950: '#1F060E',
        },
        warm: {
          50: '#FAF8F5',
          100: '#F5F0EB',
          200: '#E8E0D7',
          300: '#D6C8B8',
          400: '#BFAB97',
          500: '#A38E79',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(43, 18, 24, 0.06)',
        'glass-hover': '0 12px 40px 0 rgba(43, 18, 24, 0.12)',
      }
    },
  },
  plugins: [],
}
