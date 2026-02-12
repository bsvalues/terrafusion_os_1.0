import type { Meta, StoryObj } from '@storybook/react';
import { tokens } from '../tokens';

/**
 * TerraFusion Design System - Color Tokens
 * 
 * Complete color palette including brand colors, semantic colors,
 * state colors, and component-specific colors.
 */
const meta: Meta = {
  title: 'Design System/Tokens/Colors',
  parameters: {
    layout: 'padded'
  },
  tags: ['autodocs']
};
export default meta;
type Story = StoryObj;
const ColorSwatch = ({
  name,
  value
}: {
  name: string;
  value: string;
}) => <div style={{
  display: 'inline-flex',
  flexDirection: 'column',
  margin: '8px',
  width: '120px'
}}>
    <div style={{
    backgroundColor: value,
    borderRadius: tokens.radius.md,
    boxShadow: tokens.shadows.box.md
  }} className="w-full" />
    <div style={{
    marginTop: '8px',
    fontSize: '12px',
    color: '#fff'
  }}>
      <div className="font-semibold">{name}</div>
      <div style={{
      fontFamily: tokens.typography.fontFamily.mono
    }} className="text-gray-400">
        {value}
      </div>
    </div>
  </div>;
const ColorScale = ({
  name,
  scale
}: {
  name: string;
  scale: Record<string, string>;
}) => <div style={{
  marginBottom: '32px'
}}>
    <h3 className="font-semibold">
      {name}
    </h3>
    <div className="flex">
      {Object.entries(scale).map(([key, value]) => <ColorSwatch key={key} name={key} value={value} />)}
    </div>
  </div>;
export const BrandColors: Story = {
  render: () => <div>
      <h2 style={{
      color: '#fff',
      marginBottom: '24px',
      fontSize: '24px',
      fontWeight: 700
    }}>
        Brand Colors
      </h2>
      <ColorScale name="Primary (TerraFusion Blue)" scale={tokens.colors.brand.primary} />
      <ColorScale name="Transcend (Premium Tier)" scale={tokens.colors.brand.transcend} />
      <ColorScale name="Accent (Success/Growth)" scale={tokens.colors.brand.accent} />
    </div>
};
export const SemanticColors: Story = {
  render: () => <div>
      <h2 style={{
      color: '#fff',
      marginBottom: '24px',
      fontSize: '24px',
      fontWeight: 700
    }}>
        Semantic Colors
      </h2>
      <ColorScale name="Text Colors" scale={tokens.colors.semantic.text} />
      <ColorScale name="Background Colors" scale={tokens.colors.semantic.background} />
      <ColorScale name="Border Colors" scale={tokens.colors.semantic.border} />
      <ColorScale name="Surface Colors" scale={tokens.colors.semantic.surface} />
    </div>
};
export const StateColors: Story = {
  render: () => <div>
      <h2 style={{
      color: '#fff',
      marginBottom: '24px',
      fontSize: '24px',
      fontWeight: 700
    }}>
        State Colors
      </h2>
      <ColorScale name="Success" scale={tokens.colors.state.success} />
      <ColorScale name="Error" scale={tokens.colors.state.error} />
      <ColorScale name="Warning" scale={tokens.colors.state.warning} />
      <ColorScale name="Info" scale={tokens.colors.state.info} />
    </div>
};
export const Gradients: Story = {
  render: () => <div>
      <h2 style={{
      color: '#fff',
      marginBottom: '24px',
      fontSize: '24px',
      fontWeight: 700
    }}>
        Gradients
      </h2>
      <div className="flex">
        {Object.entries(tokens.colors.gradient).map(([name, gradient]) => <div key={name} style={{
        width: '240px'
      }}>
            <div style={{
          background: gradient,
          borderRadius: tokens.radius.xl,
          boxShadow: tokens.shadows.box.lg
        }} className="w-full" />
            <div style={{
          marginTop: '12px',
          color: '#fff'
        }}>
              <div className="font-semibold">
                {name}
              </div>
              <div style={{
            fontFamily: tokens.typography.fontFamily.mono
          }} className="text-gray-400">
                {gradient}
              </div>
            </div>
          </div>)}
      </div>
    </div>
};