/**
 * Storybook Preview Configuration
 *
 * Global decorators, parameters, and TerraFusion theme setup
 */

import type { Preview } from '@storybook/react';
import { themes } from '@storybook/theming';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },

    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },

    backgrounds: {
      default: 'terra-midnight',
      values: [
        {
          name: 'terra-midnight',
          value: '#0A0E1A',
        },
        {
          name: 'terra-slate',
          value: '#1E293B',
        },
        {
          name: 'light',
          value: '#FFFFFF',
        },
      ],
    },

    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1280px',
            height: '720px',
          },
        },
        largeDesktop: {
          name: 'Large Desktop',
          styles: {
            width: '1920px',
            height: '1080px',
          },
        },
      },
    },

    docs: {
      theme: themes.dark,
      toc: true,
      source: {
        state: 'open',
      },
    },

    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'valid-aria-attr',
            enabled: true,
          },
        ],
      },
    },

    options: {
      storySort: {
        order: [
          'Design System',
          ['Tokens', 'Components'],
          'Components',
          ['UI', 'Layout', 'Forms', 'Data Display'],
          'Terra-UI',
          'Shadcn-UI',
          'Components',
          '*',
        ],
      },
    },
  },
};

export default preview;
