/**
 * Jest Configuration
 *
 * This configuration file is used by Jest to run tests.
 */
export default {
  // Indicates whether the coverage information should be collected
  collectCoverage: false,

  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // The test environment that will be used for testing
  testEnvironment: 'node',

  // A list of paths to directories that Jest should use to search for tests
  roots: ['<rootDir>/tests'],

  // Treat files with the following extensions as tests
  testMatch: ['**/*.test.js'],

  // Use modern ECMAScript syntax
  transform: {},

  // Increase the timeout for async tests
  testTimeout: 30000,
};
