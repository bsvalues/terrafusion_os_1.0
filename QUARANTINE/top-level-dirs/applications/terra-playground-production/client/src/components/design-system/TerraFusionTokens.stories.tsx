import type { Meta, StoryObj } from '@storybook/react';
import TokenDisplay from './TokenDisplay';

const meta: Meta<typeof TokenDisplay> = {
  title: 'Design System/Terrafusion Tokens',
  component: TokenDisplay,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof TokenDisplay>;

export const AllTokens: Story = {
  args: {},
};
