/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          50: '#fdf2f4',
          100: '#fce7eb',
          200: '#f9d0d9',
          300: '#f4aab8',
          400: '#ec7891',
          500: '#e04b6d',
          600: '#cc2d53',
          700: '#ab2044',
          800: '#8f1d3d',
          900: '#7b1d3a',
          950: '#5c0a24',
        },
        brand: {
          primary: '#6B1A2A',
          dark: '#4A0F1C',
          darker: '#2D0710',
          accent: '#8B2339',
          light: '#C4384F',
          gold: '#D4A843',
          goldLight: '#E8C26A',
        }
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        display: ['Georgia', 'Times New Roman', 'serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.10), 0 8px 32px rgba(0,0,0,0.06)',
        'sidebar': '2px 0 16px rgba(0,0,0,0.15)',
        'panel': '-2px 0 16px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      }
    },
  },
  plugins: [],
}
