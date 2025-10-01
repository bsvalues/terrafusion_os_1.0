/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Global configuration for workspace
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setupTests.ts',
    
    // Define workspace projects
    projects: [
      // Root project for core tests
      {
        extends: true,
        test: {
          name: { label: 'core', color: 'blue' },
          include: ['tests/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
          exclude: [
            'node_modules/**',
            '**/data/**',
            '**/postgres/**',
            '**/from D/**',
            '**/.git/**',
            '**/dist/**',
            '**/build/**',
            '**/modules/*/node_modules/**',
            '**/.ai/**',
            '**/ULTIMATE_*/**',
            'tests/e2e/**/*.spec.ts',
            'tests/**/*.spec.ts',
          ],
        },
      },
      
      // Backend .NET API tests
      {
        extends: true,
        test: {
          name: { label: 'backend', color: 'green' },
          include: ['backend/**/*.test.{js,ts,mjs,mts}'],
          environment: 'node',
        },
      },
      
      // Frontend/Experience Suite tests  
      {
        extends: true,
        test: {
          name: { label: 'frontend', color: 'cyan' },
          include: ['frontend/**/*.test.{js,ts,jsx,tsx}'],
          environment: 'jsdom',
        },
      },
      
      // Rust Performance Engine tests (if any JS/TS test files)
      {
        extends: true,
        test: {
          name: { label: 'rust-engine', color: 'orange' },
          include: ['rust-performance-engine/**/*.test.{js,ts}'],
          environment: 'node',
        },
      },
      
      // TerraFusion modules (using glob pattern)
      'modules/*/vitest.config.{ts,js}',
      'modules/*/frontend/vitest.config.{ts,js}',
      
      // Core modules pattern (excluding problematic src-enhanced)
      // 'src-enhanced/*/vitest.config.{ts,js}',
      
      // Package modules
      'packages/*/vitest.config.{ts,js}',
      
      // Individual large modules with specific configs
      'terrafusion-gis/vitest.config.{ts,js}',
      'terrafusion-prime-view/vitest.config.{ts,js}',
      'government-edition/vitest.config.{ts,js}',
      'commercial/vitest.config.{ts,js}',
      'shock-and-awe/vitest.config.{ts,js}',
      'ai-swarm/vitest.config.{ts,js}',
    ],
    
    // Global coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: 'coverage',
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/electron/**',
        '**/dist/**',
        '**/.next/**',
        '**/data/**',
        '**/postgres/**',
        '**/from D/**',
        '**/target/**', // Rust build artifacts
        '**/.ai/**',
      ],
    },
    
    testTimeout: 10000,
    hookTimeout: 10000,
    pool: 'forks',
    isolate: true,
    retry: 2,
    bail: 1,
    
    // Global reporters
    reporters: ['default', 'json'],
    outputFile: {
      json: './test-results/vitest-results.json',
    },
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src'),
      '@/tests': path.resolve(__dirname, './tests'),
      '@/fixtures': path.resolve(__dirname, './tests/fixtures'),
      '@/backend': path.resolve(__dirname, './backend'),
      '@/modules': path.resolve(__dirname, './modules'),
      '@/rust-engine': path.resolve(__dirname, './rust-performance-engine'),
    },
  },
});
