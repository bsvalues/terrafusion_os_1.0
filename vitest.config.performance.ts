/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    name: 'rust-performance-engine-elite',
    environment: 'node',
    include: [
      'tests/performance/**/*.test.ts',
      'tests/performance/**/*.spec.ts',
      'rust-performance-engine/**/*.test.ts',
      'testing/performance/**/*.test.ts'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/target/**'
    ],
    setupFiles: ['./tests/setup/performance-setup.ts'],
    testTimeout: 120000, // 2 minutes for performance benchmarks
    hookTimeout: 60000,
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/**/*.ts',
        'backend/**/*.ts',
        'rust-performance-engine/**/*.ts'
      ],
      exclude: [
        'tests/**',
        'testing/**',
        'node_modules/**',
        'rust-performance-engine/target/**'
      ],
      thresholds: {
        global: {
          branches: 92,
          functions: 92,
          lines: 92,
          statements: 92
        }
      }
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 6
      }
    },
    env: {
      NODE_ENV: 'test',
      VITEST_POOL_ID: 'rust-performance',
      // Elite Rust Performance Engine Configuration
      RUST_ENGINE_MODE: 'elite',
      GOLDEN_RATIO: '1.618033988749895',
      PERFORMANCE_BENCHMARKS: 'true',
      AGENT_COORDINATION_CRATE: 'true',
      GEOSPATIAL_ENGINE_CRATE: 'true',
      VALUATION_KERNEL_CRATE: 'true',
      SECURITY_LAYER_CRATE: 'true',
      PERFORMANCE_MONITOR_CRATE: 'true',
      FFI_BRIDGE_CRATE: 'true',
      GOLDEN_RATIO_ENGINE_CRATE: 'true'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
      '@performance': path.resolve(__dirname, './tests/performance-setup.ts'),
      '@rust-engine': path.resolve(__dirname, './rust-performance-engine')
    }
  }
})