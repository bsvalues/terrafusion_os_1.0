import { build } from 'vite'
import { resolve } from 'path'

async function buildFrontend() {
  try {
    await build({
      root: 'client',
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
          input: resolve('client/index.html')
        }
      }
    })
    console.log('Frontend built successfully')
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}

buildFrontend()