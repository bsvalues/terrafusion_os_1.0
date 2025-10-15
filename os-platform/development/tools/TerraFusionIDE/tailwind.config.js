/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tf-cosmic-blue': '#0891b2',
        'tf-quantum-teal': '#00d2ff',
        'tf-dark-bg': '#0f172a',
        'tf-darker-bg': '#020617',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
