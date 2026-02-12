/**
 * Hex to Terrafusion Token Conversion
 *
 * This codemod transforms hardcoded hex or RGB color values in the codebase
 * to use the equivalent Terrafusion token.
 *
 * Usage:
 * npx jscodeshift -t scripts/hexToToken.js client/src/components/
 */

module.exports = function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  let hasModifications = false;

  // Token color map for exact hex/rgb matches
  const tokenMap = {
    // Primary blues
    '#1976D2': 'var(--color-primary-blue)',
    '#1E88E5': 'var(--color-primary-blue-light)',
    '#1565C0': 'var(--color-primary-blue-dark)',
    'rgb(25, 118, 210)': 'var(--color-primary-blue)',
    'hsl(210, 100%, 45%)': 'var(--color-primary-blue)',

    // Primary greens
    '#388E3C': 'var(--color-primary-green)',
    '#43A047': 'var(--color-primary-green-light)',
    '#2E7D32': 'var(--color-primary-green-dark)',
    'rgb(56, 142, 60)': 'var(--color-primary-green)',
    'hsl(145, 63%, 42%)': 'var(--color-primary-green)',

    // Primary oranges
    '#FF8000': 'var(--color-primary-orange)',
    '#FF9933': 'var(--color-primary-orange-light)',
    '#CC6600': 'var(--color-primary-orange-dark)',
    'rgb(255, 128, 0)': 'var(--color-primary-orange)',
    'hsl(30, 100%, 50%)': 'var(--color-primary-orange)',

    // Primary reds
    '#E64A19': 'var(--color-primary-red)',
    '#FF5722': 'var(--color-primary-red-light)',
    '#BF360C': 'var(--color-primary-red-dark)',
    'rgb(230, 74, 25)': 'var(--color-primary-red)',
    'hsl(0, 85%, 55%)': 'var(--color-primary-red)',

    // Gray scale
    '#212529': 'var(--color-black)',
    '#495057': 'var(--color-primary-gray-dark)',
    '#6C757D': 'var(--color-primary-gray)',
    '#ADB5BD': 'var(--color-primary-gray-light)',
    '#DEE2E6': 'var(--color-secondary-gray)',
    '#E9ECEF': 'var(--color-secondary-gray-light)',
    '#F8F9FA': 'var(--color-secondary-gray-ultralight)',

    // System colors
    '#28A745': 'var(--color-success)',
    '#FFC107': 'var(--color-warning)',
    '#DC3545': 'var(--color-error)',
    '#17A2B8': 'var(--color-info)',

    // Common UI colors
    '#FFFFFF': 'var(--color-white)',
    '#F5F5F5': 'var(--color-background-light)',
    '#212121': 'var(--color-background-dark)',
  };

  // Replace string literals in various contexts
  function replaceColorLiterals() {
    // Replace string literals in JSX attributes
    root
      .find(j.JSXAttribute)
      .filter(path => {
        const attrValue = path.node.value;
        return attrValue && attrValue.type === 'StringLiteral' && tokenMap[attrValue.value];
      })
      .forEach(path => {
        hasModifications = true;
        path.node.value.value = tokenMap[path.node.value.value];
      });

    // Replace string literals in object literals (style objects)
    root
      .find(j.ObjectProperty)
      .filter(path => {
        return (
          path.node.value &&
          path.node.value.type === 'StringLiteral' &&
          tokenMap[path.node.value.value]
        );
      })
      .forEach(path => {
        hasModifications = true;
        path.node.value.value = tokenMap[path.node.value.value];
      });

    // Replace string literals in template literals
    root
      .find(j.TemplateLiteral)
      .filter(path => {
        return path.node.quasis.some(quasi => {
          const value = quasi.value.raw;
          return Object.keys(tokenMap).some(color => value.includes(color));
        });
      })
      .forEach(path => {
        const quasis = path.node.quasis;

        for (let i = 0; i < quasis.length; i++) {
          let value = quasis[i].value.raw;
          const original = value;

          Object.keys(tokenMap).forEach(color => {
            if (value.includes(color)) {
              value = value.replace(new RegExp(color, 'g'), tokenMap[color]);
              hasModifications = true;
            }
          });

          if (original !== value) {
            quasis[i].value.raw = value;
            quasis[i].value.cooked = value;
          }
        }
      });

    // Replace CSS color values in classNames (for tailwind classes)
    // This is more complex and may require a separate approach
  }

  // Process the file
  replaceColorLiterals();

  // Return modified source if there were changes
  return hasModifications ? root.toSource() : file.source;
};
