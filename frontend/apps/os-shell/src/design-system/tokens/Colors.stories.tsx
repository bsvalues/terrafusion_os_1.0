import type { Meta, StoryObj } from '@storybook/react-vite';
import { tokens } from '../tokens';
import './color-tokens.css';
import './colors.stories.css';
import './gradients.stories.css';

/**
 * TerraFusion Design System - Color Tokens
 *
 * Complete color palette including brand colors, semantic colors,
 * state colors, and component-specific colors.
 */
const meta: Meta = {
  title: 'Design System/Tokens/Colors',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;
const getColorClass = (scaleName: string, name: string, value: string): string => {
  const lowerScale = scaleName.toLowerCase();
  const lowerName = name.toLowerCase();
  // Brand colors
  if (['primary', 'transcend', 'accent'].includes(lowerScale)) {
    return `tf-color-bg-${lowerScale}-${name}`;
  }
  // Semantic colors
  if (['text', 'background', 'border', 'surface'].includes(lowerScale)) {
    return `tf-color-bg-semantic-${lowerScale}-${lowerName}`;
  }
  // State colors
  if (['success', 'error', 'warning', 'info'].includes(lowerScale)) {
    if (/^\d+$/.test(name)) {
      return `tf-color-bg-state-${lowerScale}-${name}`;
    }
    return `tf-color-bg-state-${lowerScale}-${lowerName}`;
  }
  // Component colors
  if (['button', 'input', 'card', 'navigation', 'modal', 'badge'].includes(lowerScale)) {
    return `tf-color-bg-component-${lowerScale}-${lowerName}`;
  }
  return '';
};

const ColorSwatch = ({
  scaleName,
  name,
  value,
}: {
  scaleName: string;
  name: string;
  value: string;
}) => {
  const colorClass = getColorClass(scaleName, name, value);
  return (
    <div className='tf-color-swatch'>
      <div className={`tf-color-swatch-bg w-full ${colorClass}`} />
      <div className='tf-color-swatch-label'>
        <div className='font-semibold'>{name}</div>
        <div className='text-gray-400 tf-color-swatch-value'>{value}</div>
      </div>
    </div>
  );
};
const ColorScale = ({ name, scale }: { name: string; scale: Record<string, string> }) => (
  <div className='tf-color-scale'>
    <h3 className='font-semibold'>{name}</h3>
    <div className='flex'>
      {Object.entries(scale).map(([key, value]) => (
        <ColorSwatch
          key={key}
          scaleName={name.split(' ')[0].toLowerCase()}
          name={key}
          value={value}
        />
      ))}
    </div>
  </div>
);
export const BrandColors: Story = {
  render: () => (
    <div>
      <h2 className='tf-color-heading'>Brand Colors</h2>
      <ColorScale name='Primary (TerraFusion Blue)' scale={tokens.colors.brand.primary} />
      <ColorScale name='Transcend (Premium Tier)' scale={tokens.colors.brand.transcend} />
      <ColorScale name='Accent (Success/Growth)' scale={tokens.colors.brand.accent} />
    </div>
  ),
};
export const SemanticColors: Story = {
  render: () => (
    <div>
      <h2 className='tf-color-heading'>Semantic Colors</h2>
      <ColorScale name='Text Colors' scale={tokens.colors.semantic.text} />
      <ColorScale name='Background Colors' scale={tokens.colors.semantic.background} />
      <ColorScale name='Border Colors' scale={tokens.colors.semantic.border} />
      <ColorScale name='Surface Colors' scale={tokens.colors.semantic.surface} />
    </div>
  ),
};
export const StateColors: Story = {
  render: () => (
    <div>
      <h2 className='tf-color-heading'>State Colors</h2>
      <ColorScale name='Success' scale={tokens.colors.state.success} />
      <ColorScale name='Error' scale={tokens.colors.state.error} />
      <ColorScale name='Warning' scale={tokens.colors.state.warning} />
      <ColorScale name='Info' scale={tokens.colors.state.info} />
    </div>
  ),
};
export const Gradients: Story = {
  render: () => (
    <div>
      <h2 className='tf-color-heading'>Gradients</h2>
      <div className='flex'>
        {Object.entries(tokens.colors.gradient).map(([name, gradient]) => (
          <div key={name} className='tf-gradient-swatch'>
            <div
              className={`tf-gradient-bg w-full tf-gradient-bg-${name}`}
              data-gradient={gradient}
            />
            <div className='tf-gradient-label'>
              <div className='font-semibold'>{name}</div>
              <div className='text-gray-400 tf-gradient-value'>{gradient}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};
