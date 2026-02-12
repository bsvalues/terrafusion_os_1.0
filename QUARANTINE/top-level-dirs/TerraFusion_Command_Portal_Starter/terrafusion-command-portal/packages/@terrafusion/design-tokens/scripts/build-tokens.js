const fs = require('fs');
const path = require('path');

/**
 * Build script for TerraFusion Design Tokens
 * Transforms JSON tokens into multiple formats (CSS, SCSS, JS, TS)
 */

const tokensPath = path.join(__dirname, '..', 'tokens', 'tokens.json');
const distPath = path.join(__dirname, '..', 'dist');

// Ensure dist directory exists
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

// Load tokens
const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));

/**
 * Resolve token references (e.g., "{color.terra.forest.500}" -> actual value)
 */
function resolveTokenValue(value, tokens) {
  if (typeof value !== 'string' || !value.startsWith('{') || !value.endsWith('}')) {
    return value;
  }
  
  const path = value.slice(1, -1).split('.');
  let resolved = tokens;
  
  for (const segment of path) {
    if (resolved && typeof resolved === 'object' && segment in resolved) {
      resolved = resolved[segment];
    } else {
      console.warn(`Warning: Could not resolve token reference: ${value}`);
      return value;
    }
  }
  
  return resolved && resolved.$value !== undefined ? resolved.$value : value;
}

/**
 * Flatten tokens object into key-value pairs
 */
function flattenTokens(obj, prefix = '', resolved = {}) {
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$')) continue; // Skip metadata
    
    const newKey = prefix ? `${prefix}-${key}` : key;
    
    if (value && typeof value === 'object' && value.$value !== undefined) {
      // This is a token with a value
      resolved[newKey] = resolveTokenValue(value.$value, tokens);
    } else if (value && typeof value === 'object') {
      // This is a token group, recurse
      flattenTokens(value, newKey, resolved);
    }
  }
  
  return resolved;
}

const flatTokens = flattenTokens(tokens);

/**
 * Generate CSS Custom Properties
 */
function generateCSS(tokens) {
  let css = `/**
 * TerraFusion Design System - CSS Custom Properties
 * Generated from design tokens
 * @version 1.0.0
 */

:root {
`;

  for (const [key, value] of Object.entries(tokens)) {
    css += `  --tf-${key}: ${value};\n`;
  }

  css += '}\n';
  return css;
}

/**
 * Generate SCSS Variables
 */
function generateSCSS(tokens) {
  let scss = `/**
 * TerraFusion Design System - SCSS Variables
 * Generated from design tokens
 * @version 1.0.0
 */

`;

  for (const [key, value] of Object.entries(tokens)) {
    scss += `$tf-${key}: ${value};\n`;
  }

  return scss;
}

/**
 * Generate JavaScript/TypeScript exports
 */
function generateJS(tokens) {
  const jsContent = `/**
 * TerraFusion Design System - Design Tokens
 * Generated from design tokens
 * @version 1.0.0
 */

export const tokens = ${JSON.stringify(tokens, null, 2)};

export default tokens;
`;

  return jsContent;
}

/**
 * Generate TypeScript types
 */
function generateTypes(tokens) {
  const typeContent = `/**
 * TerraFusion Design System - TypeScript Types
 * Generated from design tokens
 * @version 1.0.0
 */

export type TokenValue = string | number | string[];

export interface DesignTokens {
${Object.keys(tokens).map(key => `  '${key}': TokenValue;`).join('\n')}
}

export declare const tokens: DesignTokens;
export default tokens;
`;

  return typeContent;
}

// Generate all formats
console.log('🎨 Building TerraFusion Design Tokens...');

try {
  // CSS Custom Properties
  fs.writeFileSync(path.join(distPath, 'tokens.css'), generateCSS(flatTokens));
  console.log('✅ Generated CSS custom properties');

  // SCSS Variables
  fs.writeFileSync(path.join(distPath, 'tokens.scss'), generateSCSS(flatTokens));
  console.log('✅ Generated SCSS variables');

  // JavaScript/ESM
  fs.writeFileSync(path.join(distPath, 'index.mjs'), generateJS(flatTokens));
  console.log('✅ Generated ES modules');

  // CommonJS
  const cjsContent = generateJS(flatTokens).replace('export const', 'const').replace('export default', 'module.exports =');
  fs.writeFileSync(path.join(distPath, 'index.js'), cjsContent);
  console.log('✅ Generated CommonJS module');

  // TypeScript types
  fs.writeFileSync(path.join(distPath, 'index.d.ts'), generateTypes(flatTokens));
  console.log('✅ Generated TypeScript types');

  // Copy original tokens
  fs.copyFileSync(tokensPath, path.join(distPath, 'tokens.json'));
  console.log('✅ Copied original token definitions');

  console.log('🎊 TerraFusion Design Tokens build complete!');
  console.log(`📦 Generated ${Object.keys(flatTokens).length} design tokens`);
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}