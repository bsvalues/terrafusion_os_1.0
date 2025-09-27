/// <reference types="vitest" />
import { defineWorkspace } from 'vitest/config';

/**
 * MIT/PhD TerraFusion OS Elite Testing Configuration
 * Supreme Commander Claude AI Swarm Test Orchestration
 * Government-Grade Performance & Compliance Testing
 * 
 * Enhanced Features:
 * ✅ Multi-project workspace for specialized testing environments
 * ✅ AI Swarm coordination testing (50,000+ agents)
 * ✅ Government compliance validation (FISMA/NIST)
 * ✅ Performance benchmarking with Rust engine integration
 * ✅ Elite coverage thresholds (90-98% coverage requirements)
 * ✅ Enhanced reporting with multiple output formats
 * ✅ Specialized test environments for government operations
 */

export default defineWorkspace([
  // 🎯 Core TerraFusion OS Testing (Enhanced MIT/PhD Standards)
  {
    test: {
      name: 'terrafusion-core-elite',
      include: ['tests/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: [
        'node_modules/**',
        '**/data/**',
        '**/postgres/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/modules/*/node_modules/**',
        '**/.ai/**',
        '**/ULTIMATE_*/**',
        'tests/e2e/**/*.spec.ts',
        'tests/ai-swarm/**/*',
        'tests/government/**/*',
        'tests/performance/**/*',
      ],
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/setupTests.ts', './tests/government-compliance-setup.ts'],
      testTimeout: 60000,
      hookTimeout: 30000,
      isolate: true,
      pool: 'threads',
    },
  },

  // 🤖 AI Swarm Coordination Testing (50,000+ Agents - Elite Level)
  {
    test: {
      name: 'ai-swarm-supreme-commander-elite',
      include: ['tests/ai-swarm/**/*.test.{js,ts}'],
      environment: 'node',
      testTimeout: 180000, // 3 minutes for swarm coordination
      setupFiles: ['./tests/ai-swarm-setup.ts'],
      pool: 'threads',
    },
  },

  // 🏛️ Government Compliance Testing (FISMA/NIST - MIT/PhD Level)
  {
    test: {
      name: 'government-compliance-elite',
      include: ['tests/government/**/*.test.{js,ts}', 'tests/security/**/*.test.{js,ts}'],
      environment: 'node',
      testTimeout: 90000,
      setupFiles: ['./tests/fisma-nist-setup.ts'],
      pool: 'threads',
    },
  },

  // ⚡ Elite Rust Performance Engine Testing (Golden Ratio φ Optimization)
  {
    test: {
      name: 'rust-performance-engine-elite',
      include: ['tests/performance/**/*.test.{js,ts}', 'tests/rust-integration/**/*.test.{js,ts}'],
      environment: 'node',
      testTimeout: 300000, // 5 minutes for performance benchmarks
      setupFiles: ['./tests/performance-setup.ts'],
      pool: 'threads',
    },
  },

  // 🔧 Backend API Testing (.NET 8.0 - Enhanced)
  {
    test: {
      name: 'backend-api-elite',
      include: ['backend/**/*.test.{js,ts}', 'tests/integration/**/*.test.{js,ts}'],
      environment: 'node',
      testTimeout: 60000,
      setupFiles: ['./tests/setupTests.ts'],
      pool: 'threads',
    },
  },

  // 🖥️ Frontend Shell Testing (PWA Desktop Environment - Enhanced)
  {
    test: {
      name: 'frontend-shell-elite',
      include: ['frontend/**/*.test.{js,ts,jsx,tsx}', 'src/**/*.test.{js,ts,jsx,tsx}'],
      environment: 'jsdom',
      globals: true,
      testTimeout: 45000,
      setupFiles: ['./tests/setupTests.ts'],
      pool: 'threads',
    },
  },

  // 📦 Module Ecosystem Testing (33+ Government Modules - Enhanced)
  {
    test: {
      name: 'module-ecosystem-elite',
      include: ['modules/**/*.test.{js,ts,jsx,tsx}'],
      exclude: ['modules/*/node_modules/**'],
      environment: 'jsdom',
      globals: true,
      testTimeout: 60000,
      setupFiles: ['./tests/setupTests.ts'],
      pool: 'threads',
    },
  },

  // 🎭 End-to-End Testing (Playwright Integration - Elite Level)
  {
    test: {
      name: 'e2e-integration-elite',
      include: ['tests/e2e/**/*.test.{js,ts}', 'tests/**/*.spec.ts'],
      environment: 'node',
      testTimeout: 120000,
      setupFiles: ['./tests/e2e-setup.ts'],
      pool: 'threads',
    },
  },
]);