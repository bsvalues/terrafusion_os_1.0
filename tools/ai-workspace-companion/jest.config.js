/**
 * Jest Configuration for Workspace Companion Tests
 *
 * Focuses on write-boundary validation to ensure Companion
 * respects DX Spine Charter §4 Lane Discipline.
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    '*.ts',
    '!launch-companion.ts',
    '!jest.config.js',
    '!**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 10000,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      isolatedModules: true,
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true,
        moduleResolution: 'node',
        target: 'ES2020',
        module: 'commonjs',
        lib: ['ES2020'],
        skipLibCheck: true,
        strict: false,
        strictNullChecks: false,
        noImplicitAny: false,
        noUnusedLocals: false,
        noUnusedParameters: false,
        exactOptionalPropertyTypes: false,
        noImplicitOverride: false,
        noPropertyAccessFromIndexSignature: false,
        noUncheckedIndexedAccess: false
      }
    }]
  }
};
