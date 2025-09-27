/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tf-primary': '#2B4F7D',
        'tf-secondary': '#1C3A5C',
        'tf-accent': '#4A90A4',
        'tf-success': '#8FBC8F',
        'tf-warning': '#F4A460',
        'tf-error': '#CD5C5C',
        'tf-text': '#2D3748',
        'tf-background': '#F7FAFC',
        'tf-surface': '#FFFFFF',
        'tf-border': '#E2E8F0'
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        }
      },
      boxShadow: {
        'tf-card': '0 4px 6px -1px rgba(43, 79, 125, 0.1), 0 2px 4px -1px rgba(43, 79, 125, 0.06)',
        'tf-card-hover': '0 10px 25px rgba(43, 79, 125, 0.15)',
      }
    },
  },
  plugins: [],
}