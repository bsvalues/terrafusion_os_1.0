/**
 * Shared ESLint config for TerraFusion Gen2 UI packages.
 * Enables the Lumin design-system enforcement rule.
 *
 * Usage in any app/package .eslintrc.cjs:
 *   extends: ['../../configs/eslint/terrafusion-ui.cjs']
 */
module.exports = {
  plugins: ['terrafusion-ui'],
  rules: {
    'terrafusion-ui/no-raw-colors': 'error',
  },
};
