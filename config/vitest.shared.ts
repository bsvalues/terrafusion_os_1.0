// Shared Vitest configuration for TerraFusion OS modules
import { defineProject } from 'vitest/config'
import path from 'path'

/**
 * Creates a standardized Vitest project configuration for TerraFusion OS modules
 * @param options Configuration options for the module
 */
export function createModuleConfig(options: {
  name: string
  rootDir?: string
  environment?: 'jsdom' | 'node' | 'happy-dom'
  includes?: string[]
  aliases?: Record<string, string>
}) {
  const {
    name,
    rootDir = process.cwd(),
    environment = 'jsdom',
    includes = ['**/*.test.{js,ts,jsx,tsx}'],
    aliases = {}
  } = options

  return defineProject({
    test: {
      name,
      environment,
      include: includes,
      globals: true,
      setupFiles: path.resolve(rootDir, '../../tests/setupTests.ts'),
    },
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
        '@/components': path.resolve(rootDir, './src/components'),
        '@/lib': path.resolve(rootDir, './src/lib'),
        '@/utils': path.resolve(rootDir, './src/utils'),
        '@/tests': path.resolve(rootDir, '../../tests'),
        ...aliases,
      },
    },
  })
}

/**
 * Standard backend module configuration
 */
export function createBackendConfig(name: string, rootDir?: string) {
  return createModuleConfig({
    name: `${name}-backend`,
    rootDir,
    environment: 'node',
    includes: ['**/*.test.{js,ts,mjs,mts}'],
  })
}

/**
 * Standard frontend module configuration
 */
export function createFrontendConfig(name: string, rootDir?: string) {
  return createModuleConfig({
    name: `${name}-frontend`,
    rootDir,
    environment: 'jsdom',
    includes: ['**/*.test.{js,ts,jsx,tsx}'],
  })
}

export default createModuleConfig