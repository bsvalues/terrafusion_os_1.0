module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/government/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/government/setup.js'],
  testTimeout: 30000
};
