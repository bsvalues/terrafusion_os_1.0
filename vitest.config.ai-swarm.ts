/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    name: 'ai-swarm-supreme-commander-elite',
    environment: 'node',
    include: [
      'tests/ai-swarm/**/*.test.ts',
      'tests/ai-swarm/**/*.spec.ts',
      'testing/ai/**/*.test.ts',
      'testing/ai/**/*.spec.ts'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**'
    ],
    setupFiles: ['./tests/ai-swarm-setup.ts'],
    testTimeout: 60000, // 60 seconds for complex AI agent coordination
    hookTimeout: 30000,
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/**/*.ts',
        'backend/**/*.ts',
        'modules/**/ai-systems/**/*.ts'
      ],
      exclude: [
        'tests/**',
        'testing/**',
        'node_modules/**'
      ],
      thresholds: {
        global: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        }
      }
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 2,
        maxThreads: 8,
        useAtomics: true
      }
    },
    env: {
      NODE_ENV: 'test',
      VITEST_POOL_ID: 'ai-swarm',
      // AI Swarm Configuration
      SUPREME_COMMANDER_CLAUDE: 'true',
      FIELD_GENERALS_COUNT: '1220',
      OPERATIONAL_FORCES_COUNT: '48779',
      TOTAL_AGENTS: '50000',
      AI_SWARM_MODE: 'elite'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
      '@ai-swarm': path.resolve(__dirname, './tests/ai-swarm-setup.ts')
    }
  }
})