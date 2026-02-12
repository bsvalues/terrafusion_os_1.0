/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * TerraFusion Vitest Configuration - THE TERRAFUSION WAY
 * Production-grade testing configuration for government-scale applications
 * 
 * Features:
 * - React 18 compatibility with React 19 production builds
 * - Comprehensive WebGL/Three.js mocking
 * - Government security standards compliance
 * - Performance optimization for CI/CD pipelines
 */
export default defineConfig({
  plugins: [react()],
  
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    
    // Performance optimizations for production CI/CD
    pool: 'threads',
    isolate: true,
    passWithNoTests: true,
    
    // Coverage configuration for government compliance
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Timeout configurations for stability
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@test': path.resolve(__dirname, './src/test')
    },
  },
  
  // Optimize build performance
  optimizeDeps: {
    include: ['@testing-library/react', '@testing-library/jest-dom']
  }
})