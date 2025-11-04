/**
 * Jest configuration for ConnectionManager tests
 * 
 * Configures Jest to handle ES modules and mock browser APIs
 */

/** @type {import('jest').Config} */
const config = {
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!.*\\.mjs$)'
  ],
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  rootDir: process.cwd(),
  setupFiles: ['<rootDir>/tests/setup-jest-dom.js'],
  testMatch: ['**/tests/connection-manager.test.js'],
  verbose: true
};

module.exports = config;