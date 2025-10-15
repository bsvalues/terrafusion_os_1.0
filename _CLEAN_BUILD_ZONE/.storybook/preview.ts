import type { Preview } from '@storybook/react-vite';
import { themes } from '@storybook/theming';
import '../src/index.css'; // Import global styles

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#000000',
        },
        {
          name: 'secondary',
          value: '#0a0a0a',
        },
        {
          name: 'tertiary',
          value: '#1a1a1a',
        },
      ],
    },
    docs: {
      theme: themes.dark,
    },
    a11y: {
      config: {
        rules: [
          {
            // Disable color-contrast checks for branded elements
            id: 'color-contrast',
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