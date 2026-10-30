/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        sand: {
          50: '#fdf8ee',
          100: '#f8edd6',
          200: '#f0d9a8',
          300: '#e7c074',
          400: '#dea44a',
          500: '#d4882c',
          600: '#b96a22',
          700: '#974e1f',
          800: '#7c3f20',
          900: '#67351e',
        },
      },
      keyframes: {
        'sand-fall': {
          '0%': { transform: 'translateY(-2px)', opacity: '0.4' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(2px)', opacity: '0.4' },
        },
        'toast-in': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'sand-fall': 'sand-fall 1.6s ease-in-out infinite',
        'toast-in': 'toast-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
