module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    'jest --bail --findRelatedTests --passWithNoTests',
  ],
  '*.{json,md,html,css,scss}': [
    'prettier --write',
  ],
  '*.rs': [
    'cargo fmt --',
    'cargo clippy -- -D warnings',
  ],
  'package.json': [
    'npm audit --audit-level=moderate',
  ],
};
