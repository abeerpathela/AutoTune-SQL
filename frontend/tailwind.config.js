/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        geist: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        zinc: {
          750: '#3a3a3a',
        },
      },
      boxShadow: {
        'glow': '0 0 40px rgba(139, 92, 246, 0.25)',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'noise': 'noise 0.5s steps(10) infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        noise: {
          '0%, 100%': { backgroundPosition: '0 0' },
          '10%': { backgroundPosition: '-5% -10%' },
          '30%': { backgroundPosition: '3% 3%' },
          '50%': { backgroundPosition: '-2% 5%' },
          '70%': { backgroundPosition: '5% -5%' },
          '90%': { backgroundPosition: '-3% 2%' },
        },
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
