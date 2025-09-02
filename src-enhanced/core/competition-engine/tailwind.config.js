/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./modules/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tf-cosmic-blue': '#0891b2',
        'tf-quantum-teal': '#00d2ff',
        'tf-neural-purple': '#667eea',
        'tf-stellar-white': '#ffffff',
        'tf-deep-space': '#0a0f1c',
        'tf-dark-teal': '#1a2f3a',
        'tf-accent-cyan': '#22d3ee',
      }
    },
  },
  plugins: [],
}