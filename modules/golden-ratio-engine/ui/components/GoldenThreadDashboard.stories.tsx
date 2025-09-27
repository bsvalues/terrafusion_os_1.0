import type { Meta, StoryObj } from '@storybook/react';
import GoldenThreadDashboard from './GoldenThreadDashboard';

const meta: Meta<typeof GoldenThreadDashboard> = {
  title: 'Golden/GoldenThreadDashboard',
  component: GoldenThreadDashboard
};
export default meta;

export const Primary: StoryObj<typeof GoldenThreadDashboard> = {
  args: { metrics: { phi: 1.618, rpm: 420, snr: '12.3 dB' } }
};
