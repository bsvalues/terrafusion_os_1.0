/**
 * Terrafusion Tailwind CSS Plugin
 *
 * This script creates a Tailwind CSS plugin that adds custom Terrafusion token colors
 * to the Tailwind configuration.
 */

import path from 'path';
import fs from 'fs';
import { Config } from 'tailwindcss';

// Read the Terrafusion tokens file
const terrafusionTokensPath = path.resolve(__dirname, '../tokens/terrafusion.json');
const tokensData = JSON.parse(fs.readFileSync(terrafusionTokensPath, 'utf8'));

// Create a color mapping from token values to CSS variable names
interface ColorMap {
  [key: string]: {
    [key: string]: string;
  };
}

function generateColorConfig(): ColorMap {
  const colorConfig: ColorMap = {};

  // Process primary colors
  if (tokensData.tokens && tokensData.tokens.colors) {
    const { colors } = tokensData.tokens;

    // Process primary colors
    if (colors.primary) {
      colorConfig['primary-blue'] = { DEFAULT: 'var(--color-primary-blue)' };
      colorConfig['primary-blue-light'] = { DEFAULT: 'var(--color-primary-blue-light)' };
      colorConfig['primary-blue-dark'] = { DEFAULT: 'var(--color-primary-blue-dark)' };

      colorConfig['primary-green'] = { DEFAULT: 'var(--color-primary-green)' };
      colorConfig['primary-green-light'] = { DEFAULT: 'var(--color-primary-green-light)' };
      colorConfig['primary-green-dark'] = { DEFAULT: 'var(--color-primary-green-dark)' };

      colorConfig['primary-orange'] = { DEFAULT: 'var(--color-primary-orange)' };
      colorConfig['primary-orange-light'] = { DEFAULT: 'var(--color-primary-orange-light)' };
      colorConfig['primary-orange-dark'] = { DEFAULT: 'var(--color-primary-orange-dark)' };

      colorConfig['primary-red'] = { DEFAULT: 'var(--color-primary-red)' };
      colorConfig['primary-red-light'] = { DEFAULT: 'var(--color-primary-red-light)' };
      colorConfig['primary-red-dark'] = { DEFAULT: 'var(--color-primary-red-dark)' };

      colorConfig['primary-gray'] = { DEFAULT: 'var(--color-primary-gray)' };
      colorConfig['primary-gray-light'] = { DEFAULT: 'var(--color-primary-gray-light)' };
      colorConfig['primary-gray-dark'] = { DEFAULT: 'var(--color-primary-gray-dark)' };
    }

    // Process secondary colors
    if (colors.secondary) {
      colorConfig['secondary-blue'] = { DEFAULT: 'var(--color-secondary-blue)' };
      colorConfig['secondary-blue-light'] = { DEFAULT: 'var(--color-secondary-blue-light)' };

      colorConfig['secondary-green'] = { DEFAULT: 'var(--color-secondary-green)' };
      colorConfig['secondary-green-light'] = { DEFAULT: 'var(--color-secondary-green-light)' };

      colorConfig['secondary-orange'] = { DEFAULT: 'var(--color-secondary-orange)' };
      colorConfig['secondary-orange-light'] = { DEFAULT: 'var(--color-secondary-orange-light)' };

      colorConfig['secondary-red'] = { DEFAULT: 'var(--color-secondary-red)' };
      colorConfig['secondary-red-light'] = { DEFAULT: 'var(--color-secondary-red-light)' };

      colorConfig['secondary-gray'] = { DEFAULT: 'var(--color-secondary-gray)' };
      colorConfig['secondary-gray-light'] = { DEFAULT: 'var(--color-secondary-gray-light)' };
      colorConfig['secondary-gray-ultralight'] = {
        DEFAULT: 'var(--color-secondary-gray-ultralight)',
      };
    }

    // Process accent colors
    if (colors.accent) {
      colorConfig['accent-teal'] = { DEFAULT: 'var(--color-accent-teal)' };
      colorConfig['accent-purple'] = { DEFAULT: 'var(--color-accent-purple)' };
      colorConfig['accent-gold'] = { DEFAULT: 'var(--color-accent-gold)' };
    }

    // Process system colors
    if (colors.system) {
      colorConfig['success'] = { DEFAULT: 'var(--color-success)' };
      colorConfig['warning'] = { DEFAULT: 'var(--color-warning)' };
      colorConfig['error'] = { DEFAULT: 'var(--color-error)' };
      colorConfig['info'] = { DEFAULT: 'var(--color-info)' };
    }

    // Process other colors
    colorConfig['black'] = { DEFAULT: 'var(--color-black)' };
    colorConfig['white'] = { DEFAULT: 'var(--color-white)' };

    colorConfig['background-light'] = { DEFAULT: 'var(--color-background-light)' };
    colorConfig['background-dark'] = { DEFAULT: 'var(--color-background-dark)' };

    colorConfig['surface-light'] = { DEFAULT: 'var(--color-surface-light)' };
    colorConfig['surface-dark'] = { DEFAULT: 'var(--color-surface-dark)' };
  }

  return colorConfig;
}

// Patch the Tailwind config
export function patchTailwindConfig(config: Config): Config {
  const colorConfig = generateColorConfig();

  // Create a new theme that extends the existing theme
  const newConfig: Config = {
    ...config,
    theme: {
      ...config.theme,
      extend: {
        ...config.theme?.extend,
        colors: {
          ...config.theme?.extend?.colors,
          ...colorConfig,
        },
        fontFamily: {
          display: ['var(--font-display)'],
          body: ['var(--font-body)'],
          mono: ['var(--font-mono)'],
        },
        boxShadow: {
          'tf-sm': 'var(--shadow-sm)',
          'tf-md': 'var(--shadow-md)',
          'tf-lg': 'var(--shadow-lg)',
          'tf-xl': 'var(--shadow-xl)',
          'tf-2xl': 'var(--shadow-2xl)',
          'tf-inner': 'var(--shadow-inner)',
        },
        borderRadius: {
          'tf-none': 'var(--radius-none)',
          'tf-sm': 'var(--radius-sm)',
          'tf-md': 'var(--radius-md)',
          'tf-lg': 'var(--radius-lg)',
          'tf-xl': 'var(--radius-xl)',
          'tf-2xl': 'var(--radius-2xl)',
          'tf-full': 'var(--radius-full)',
        },
      },
    },
  };

  return newConfig;
}

// Export a function that can be used by Tailwind config
export default function terrafusionPlugin() {
  return {
    name: 'terrafusion',
    config: (existingConfig: Config) => patchTailwindConfig(existingConfig),
  };
}

// Add utility classes for Terrafusion typography
export function addTerraFusionUtilities({ addUtilities }: { addUtilities: Function }) {
  const newUtilities = {
    '.tf-font-display': {
      fontFamily: 'var(--font-display)',
    },
    '.tf-font-body': {
      fontFamily: 'var(--font-body)',
    },
    '.tf-font-mono': {
      fontFamily: 'var(--font-mono)',
    },
  };

  addUtilities(newUtilities);
}
