/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // High-end glassmorphic dark palette
        dark: {
          950: '#030712',
          900: '#0b0f19',
          800: '#111827',
          700: '#1f2937',
          600: '#374151'
        },
        brand: {
          cyan: '#06b6d4',
          indigo: '#6366f1',
          violet: '#8b5cf6',
          rose: '#f43f5e'
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass-sm': '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
        'glass-md': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-lg': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        'glow-cyan': '0 0 15px rgba(6, 182, 212, 0.4)',
        'glow-indigo': '0 0 15px rgba(99, 102, 241, 0.4)'
      }
    },
  },
  plugins: [],
}
