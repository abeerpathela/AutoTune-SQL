/** @type {import('tailwindcss').Config} */

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        geist: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: 'var(--bg-base)',
        elevated: 'var(--bg-elevated)',
        'theme-border': 'var(--border)',
      },
      boxShadow: {
        glow: '0 0 40px var(--accent-glow)',
        'glow-cyan': '0 0 48px rgba(34, 211, 238, 0.15)',
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        glass: '24px',
        'glass-xl': '40px',
      },
    },
  },
  plugins: [],
};
