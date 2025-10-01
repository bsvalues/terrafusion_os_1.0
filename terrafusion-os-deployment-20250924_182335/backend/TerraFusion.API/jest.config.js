module.exports = {
  testPathIgnorePatterns: ['/node_modules/', '/packages/', '/deployment/', '/modules/'],
  transformIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/tests/**/*.test.(ts|tsx|js|jsx)'],
};
