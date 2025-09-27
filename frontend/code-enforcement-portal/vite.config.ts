import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3022,
    host: '0.0.0.0'
  },
  css: {
    postcss: './postcss.config.js'
  }
})