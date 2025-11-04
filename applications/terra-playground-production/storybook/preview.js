/** @type { import('@storybook/react').Preview } */
import { withThemeByClassName } from '@storybook/addon-themes';
import '../client/src/styles/terrafusion-tokens.css';
import '../client/src/index.css';

const preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: 'var(--color-background-light)',
        },
        {
          name: 'dark',
          value: 'var(--color-background-dark)',
        },
      ],
    },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: '',
        dark: 'dark-mode',
      },
      defaultTheme: 'light',
    }),
  ],
};

export default preview;
