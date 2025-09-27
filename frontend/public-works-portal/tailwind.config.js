module.exports = {
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
      }
    },
  },
  plugins: [],
}