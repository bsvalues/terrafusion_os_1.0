#!/usr/bin/env node

import StyleDictionary from 'style-dictionary';

console.log('🏛️  TerraFusion OS - Building Government Brand Tokens');
console.log('Government. Transcended.');
console.log('');

// Build configuration
const buildConfig = {
  source: [
    'frontend/src/brand/tokens/common/*.json',
    'frontend/src/brand/tokens/county/*.json'
  ],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'frontend/public/brand/',
      files: [
        {
          destination: 'tokens-base.css',
          format: 'css/variables',
          filter: {
            attributes: {
              type: 'base'
            }
          }
        },
        {
          destination: 'tokens-benton.css',
          format: 'css/variables',
          filter: {
            attributes: {
              county: 'Benton'
            }
          }
        },
        {
          destination: 'tokens-yakima.css',
          format: 'css/variables',
          filter: {
            attributes: {
              county: 'Yakima'
            }
          }
        }
      ]
    }
  }
};

// Initialize and build
const styleDictionary = new StyleDictionary(buildConfig);

try {
  await styleDictionary.buildAllPlatforms();
  
  console.log('');
  console.log('✅ Brand tokens generated successfully');
  console.log('📁 CSS: frontend/public/brand/');
  
} catch (error) {
  console.error('❌ Token build failed:', error);
  process.exit(1);
}