/**
 * Storybook Main Configuration
 *
 * TerraFusion OS component documentation system
 */

import type { StorybookConfig } from '@storybook/react-vite';
import { dirname, join } from "path";
import { mergeConfig } from 'vite';

/**
* This function is used to resolve the absolute path of a package.
* It is needed in projects that use Yarn PnP or are set up within a monorepo.
*/
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')));
}

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],

  addons: [
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@storybook/addon-onboarding'),
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-a11y'),
  ],

  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },

  docs: {
    autodocs: 'tag',
  },

  core: {
    disableTelemetry: true,
  },

  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@': '/src',
          '@components': '/src/components',
          '@hooks': '/src/hooks',
          '@utils': '/src/utils',
          '@ui': '/src/components/ui',
          '@quantum': '/src/quantum',
          '@terrafusion': '/src/terrafusion',
        },
      },
      define: {
        'process.env.STORYBOOK': JSON.stringify('true'),
      },
    });
  },
};

export default config;
