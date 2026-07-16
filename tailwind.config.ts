import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          DEFAULT: '#3A1414',
          dark:    '#2A0E0E',
          light:   '#5A1E1E',
          muted:   '#7A3A3A',
        },
        gold: {
          DEFAULT: '#C4922A',
          light:   '#D4A52B',
          star:    '#E8C97A',
          pale:    '#F5E9CC',
        },
        brass: '#9C7A3C',
        surface: '#FDFAF5',
        border:  '#E8E0D0',
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        serif:  ['Noto Serif', 'Georgia', 'serif'],
        sans:   ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 0 3px rgba(196,146,42,0.2)',
        card: '0 1px 3px rgba(58,20,20,0.08), 0 4px 16px rgba(58,20,20,0.04)',
        'card-hover': '0 4px 12px rgba(58,20,20,0.12), 0 12px 32px rgba(58,20,20,0.08)',
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in':  'fadeIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        slideIn: { from: { transform: 'translateY(-8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
      },
    },
  },
  plugins: [],
}
export default config
