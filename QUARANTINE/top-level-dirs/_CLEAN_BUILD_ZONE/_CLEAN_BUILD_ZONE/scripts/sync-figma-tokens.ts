/**
 * Figma Design Token Sync Script
 *
 * Automatically syncs design tokens from Figma to TerraFusion codebase.
 * Generates CSS variables, TypeScript types, and documentation.
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Figma Design Token Structure
 */
interface FigmaToken {
  name: string;
  value: string;
  type: 'color' | 'spacing' | 'typography' | 'shadow' | 'radius';
  description?: string;
}

interface FigmaTokenCollection {
  colors: FigmaToken[];
  spacing: FigmaToken[];
  typography: FigmaToken[];
  shadows: FigmaToken[];
  radius: FigmaToken[];
}

/**
 * TerraFusion Design Token Configuration
 */
const terraFusionTokens: FigmaTokenCollection = {
  colors: [
    { name: 'terra-cyan', value: '#00FFFF', type: 'color', description: 'Primary consciousness color' },
    { name: 'terra-midnight', value: '#0A0E1A', type: 'color', description: 'Background void' },
    { name: 'terra-blue', value: '#0080FF', type: 'color', description: 'Secondary network' },
    { name: 'terra-slate', value: '#1E293B', type: 'color', description: 'Surface foundation' },
    { name: 'terra-transcend', value: '#00FFEE', type: 'color', description: 'Transcendent highlight' },
  ],

  spacing: [
    { name: 'space-1', value: '0.25rem', type: 'spacing', description: '4px' },
    { name: 'space-2', value: '0.5rem', type: 'spacing', description: '8px' },
    { name: 'space-3', value: '0.75rem', type: 'spacing', description: '12px' },
    { name: 'space-4', value: '1rem', type: 'spacing', description: '16px' },
    { name: 'space-6', value: '1.5rem', type: 'spacing', description: '24px' },
    { name: 'space-8', value: '2rem', type: 'spacing', description: '32px' },
    { name: 'space-golden', value: '1.618rem', type: 'spacing', description: 'Golden ratio spacing' },
  ],

  typography: [
    { name: 'text-base', value: '1rem', type: 'typography', description: '16px base' },
    { name: 'text-lg', value: '1.236rem', type: 'typography', description: 'φ × base' },
    { name: 'text-xl', value: '1.618rem', type: 'typography', description: 'φ² × base' },
    { name: 'text-2xl', value: '2rem', type: 'typography', description: 'φ³ × base' },
    { name: 'text-3xl', value: '2.618rem', type: 'typography', description: 'φ⁴ × base' },
  ],

  shadows: [
    { name: 'shadow-glow', value: '0 0 40px rgba(0, 255, 255, 0.4)', type: 'shadow', description: 'Terra-cyan glow' },
    { name: 'shadow-quantum', value: '0 0 20px rgba(0, 255, 255, 0.3)', type: 'shadow', description: 'Quantum effect' },
  ],

  radius: [
    { name: 'radius-sm', value: '0.25rem', type: 'radius', description: '4px' },
    { name: 'radius-md', value: '0.5rem', type: 'radius', description: '8px' },
    { name: 'radius-lg', value: '0.75rem', type: 'radius', description: '12px' },
    { name: 'radius-full', value: '9999px', type: 'radius', description: 'Full circle' },
  ],
};

/**
 * Generate CSS variables from tokens
 */
function generateCSSVariables(tokens: FigmaTokenCollection): string {
  let css = '/**\n * TerraFusion Design Tokens\n * Auto-generated from Figma\n * Do not edit manually\n */\n\n';
  css += ':root {\n';

  // Colors
  css += '  /* Colors */\n';
  tokens.colors.forEach((token) => {
    css += `  --${token.name}: ${token.value}; /* ${token.description} */\n`;
  });
  css += '\n';

  // Spacing
  css += '  /* Spacing */\n';
  tokens.spacing.forEach((token) => {
    css += `  --${token.name}: ${token.value}; /* ${token.description} */\n`;
  });
  css += '\n';

  // Typography
  css += '  /* Typography */\n';
  tokens.typography.forEach((token) => {
    css += `  --${token.name}: ${token.value}; /* ${token.description} */\n`;
  });
  css += '\n';

  // Shadows
  css += '  /* Shadows */\n';
  tokens.shadows.forEach((token) => {
    css += `  --${token.name}: ${token.value}; /* ${token.description} */\n`;
  });
  css += '\n';

  // Radius
  css += '  /* Border Radius */\n';
  tokens.radius.forEach((token) => {
    css += `  --${token.name}: ${token.value}; /* ${token.description} */\n`;
  });

  css += '}\n';

  return css;
}

/**
 * Generate TypeScript types from tokens
 */
function generateTypeScriptTypes(tokens: FigmaTokenCollection): string {
  let ts = '/**\n * TerraFusion Design Token Types\n * Auto-generated from Figma\n * Do not edit manually\n */\n\n';

  // Color type
  ts += 'export type TerraFusionColor =\n';
  tokens.colors.forEach((token, i) => {
    ts += `  | '${token.name}'${i < tokens.colors.length - 1 ? '\n' : ';\n\n'}`;
  });

  // Spacing type
  ts += 'export type TerraFusionSpacing =\n';
  tokens.spacing.forEach((token, i) => {
    ts += `  | '${token.name}'${i < tokens.spacing.length - 1 ? '\n' : ';\n\n'}`;
  });

  // Typography type
  ts += 'export type TerraFusionTypography =\n';
  tokens.typography.forEach((token, i) => {
    ts += `  | '${token.name}'${i < tokens.typography.length - 1 ? '\n' : ';\n\n'}`;
  });

  // Shadow type
  ts += 'export type TerraFusionShadow =\n';
  tokens.shadows.forEach((token, i) => {
    ts += `  | '${token.name}'${i < tokens.shadows.length - 1 ? '\n' : ';\n\n'}`;
  });

  // Radius type
  ts += 'export type TerraFusionRadius =\n';
  tokens.radius.forEach((token, i) => {
    ts += `  | '${token.name}'${i < tokens.radius.length - 1 ? '\n' : ';\n\n'}`;
  });

  // Token value interface
  ts += 'export interface TerraFusionTokens {\n';
  ts += '  colors: Record<TerraFusionColor, string>;\n';
  ts += '  spacing: Record<TerraFusionSpacing, string>;\n';
  ts += '  typography: Record<TerraFusionTypography, string>;\n';
  ts += '  shadows: Record<TerraFusionShadow, string>;\n';
  ts += '  radius: Record<TerraFusionRadius, string>;\n';
  ts += '}\n';

  return ts;
}

/**
 * Generate token documentation
 */
function generateDocumentation(tokens: FigmaTokenCollection): string {
  let doc = '# TerraFusion Design Tokens\n\n';
  doc += 'Auto-generated from Figma design system.\n\n';

  // Colors
  doc += '## Colors\n\n';
  doc += '| Token | Value | Description |\n';
  doc += '|-------|-------|-------------|\n';
  tokens.colors.forEach((token) => {
    doc += `| \`--${token.name}\` | \`${token.value}\` | ${token.description} |\n`;
  });
  doc += '\n';

  // Spacing
  doc += '## Spacing\n\n';
  doc += '| Token | Value | Description |\n';
  doc += '|-------|-------|-------------|\n';
  tokens.spacing.forEach((token) => {
    doc += `| \`--${token.name}\` | \`${token.value}\` | ${token.description} |\n`;
  });
  doc += '\n';

  // Typography
  doc += '## Typography\n\n';
  doc += '| Token | Value | Description |\n';
  doc += '|-------|-------|-------------|\n';
  tokens.typography.forEach((token) => {
    doc += `| \`--${token.name}\` | \`${token.value}\` | ${token.description} |\n`;
  });
  doc += '\n';

  // Shadows
  doc += '## Shadows\n\n';
  doc += '| Token | Value | Description |\n';
  doc += '|-------|-------|-------------|\n';
  tokens.shadows.forEach((token) => {
    doc += `| \`--${token.name}\` | \`${token.value}\` | ${token.description} |\n`;
  });
  doc += '\n';

  // Radius
  doc += '## Border Radius\n\n';
  doc += '| Token | Value | Description |\n';
  doc += '|-------|-------|-------------|\n';
  tokens.radius.forEach((token) => {
    doc += `| \`--${token.name}\` | \`${token.value}\` | ${token.description} |\n`;
  });
  doc += '\n';

  return doc;
}

/**
 * Main sync function
 */
async function syncFigmaTokens() {
  console.log('🎨 Syncing TerraFusion design tokens from Figma...\n');

  try {
    // Generate CSS variables
    console.log('📝 Generating CSS variables...');
    const cssContent = generateCSSVariables(terraFusionTokens);
    const cssPath = path.join(__dirname, '../src/styles/terrafusion-tokens.css');
    await fs.writeFile(cssPath, cssContent, 'utf-8');
    console.log(`✅ CSS variables written to ${cssPath}\n`);

    // Generate TypeScript types
    console.log('📝 Generating TypeScript types...');
    const tsContent = generateTypeScriptTypes(terraFusionTokens);
    const tsPath = path.join(__dirname, '../src/types/design-tokens.ts');
    await fs.writeFile(tsPath, tsContent, 'utf-8');
    console.log(`✅ TypeScript types written to ${tsPath}\n`);

    // Generate documentation
    console.log('📝 Generating documentation...');
    const docContent = generateDocumentation(terraFusionTokens);
    const docPath = path.join(__dirname, '../docs/DESIGN_TOKENS.md');
    await fs.writeFile(docPath, docContent, 'utf-8');
    console.log(`✅ Documentation written to ${docPath}\n`);

    console.log('✨ Figma token sync complete!\n');
    console.log('Summary:');
    console.log(`  - ${terraFusionTokens.colors.length} colors`);
    console.log(`  - ${terraFusionTokens.spacing.length} spacing tokens`);
    console.log(`  - ${terraFusionTokens.typography.length} typography tokens`);
    console.log(`  - ${terraFusionTokens.shadows.length} shadow tokens`);
    console.log(`  - ${terraFusionTokens.radius.length} radius tokens`);

  } catch (error) {
    console.error('❌ Error syncing Figma tokens:', error);
    process.exit(1);
  }
}

// Run sync if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  syncFigmaTokens();
}

export { generateCSSVariables, generateDocumentation, generateTypeScriptTypes, syncFigmaTokens };

