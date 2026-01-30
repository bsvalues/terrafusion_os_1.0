/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'terra-void': '#020617',
        'terra-slate': '#0a0e1a',
        'terra-glow': 'rgba(0, 229, 255, 0.15)',
        'terra-cyan': '#00E5FF',
        'terra-amber': '#FFB300',
        'terra-emerald': '#10B981',
        'terra-indigo': '#6366F1',
      },
    },
  },
  plugins: [],
};
