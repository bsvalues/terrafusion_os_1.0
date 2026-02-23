import type { Meta, StoryObj } from '@storybook/react-vite';
import { tokens } from '../tokens';

/**
 * TerraFusion Design System - Spacing Tokens
 *
 * Complete spacing system based on 8px grid with semantic naming.
 * Provides consistent spacing throughout the application.
 */
const meta: Meta = {
  title: 'Design System/Tokens/Spacing',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;
const SpacingBox = ({ name, value }: { name: string; value: string }) => {
  const pxValue = parseFloat(value) * 16; // Convert rem to px
  return (
    <div className='flex items-center'>
      <div className='font-semibold'>{name}</div>
      <div
        style={{
          width: value,
          height: '40px',
          backgroundColor: tokens.colors.brand.primary[500],
          borderRadius: tokens.radius.md,
          position: 'relative',
        }}
      >
        <div className='font-semibold'>
          {value} ({pxValue}px)
        </div>
      </div>
    </div>
  );
};
const SpacingScale = ({ title, scale }: { title: string; scale: Record<string, string> }) => (
  <div
    style={{
      marginBottom: '48px',
    }}
  >
    <h3 className='font-semibold'>{title}</h3>
    {Object.entries(scale).map(([key, value]) => (
      <SpacingBox key={key} name={key} value={value} />
    ))}
  </div>
);
export const BaseSpacing: Story = {
  render: () => (
    <div>
      <h2
        style={{
          color: 'var(--tf-text-primary)',
          marginBottom: '24px',
          fontSize: '24px',
          fontWeight: 700,
        }}
      >
        Base Spacing Scale (8px Grid)
      </h2>
      <p
        style={{
          color: 'hsl(var(--tf-neutral-hs) 70%)',
          marginBottom: '32px',
          fontSize: '14px',
          lineHeight: '1.6',
        }}
      >
        TerraFusion uses an 8px base unit grid system. All spacing values are multiples of 8px to
        ensure visual consistency and rhythm throughout the interface.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px',
        }}
      >
        <div>
          <SpacingBox name='0' value={tokens.spacing[0]} />
          <SpacingBox name='1' value={tokens.spacing[1]} />
          <SpacingBox name='2' value={tokens.spacing[2]} />
          <SpacingBox name='3' value={tokens.spacing[3]} />
          <SpacingBox name='4' value={tokens.spacing[4]} />
          <SpacingBox name='5' value={tokens.spacing[5]} />
          <SpacingBox name='6' value={tokens.spacing[6]} />
          <SpacingBox name='8' value={tokens.spacing[8]} />
          <SpacingBox name='10' value={tokens.spacing[10]} />
          <SpacingBox name='12' value={tokens.spacing[12]} />
        </div>
        <div>
          <SpacingBox name='16' value={tokens.spacing[16]} />
          <SpacingBox name='20' value={tokens.spacing[20]} />
          <SpacingBox name='24' value={tokens.spacing[24]} />
          <SpacingBox name='32' value={tokens.spacing[32]} />
          <SpacingBox name='40' value={tokens.spacing[40]} />
          <SpacingBox name='48' value={tokens.spacing[48]} />
          <SpacingBox name='64' value={tokens.spacing[64]} />
          <SpacingBox name='80' value={tokens.spacing[80]} />
          <SpacingBox name='96' value={tokens.spacing[96]} />
        </div>
      </div>
    </div>
  ),
};
export const SemanticSpacing: Story = {
  render: () => (
    <div>
      <h2
        style={{
          color: 'var(--tf-text-primary)',
          marginBottom: '24px',
          fontSize: '24px',
          fontWeight: 700,
        }}
      >
        Semantic Spacing
      </h2>
      <p
        style={{
          color: 'hsl(var(--tf-neutral-hs) 70%)',
          marginBottom: '32px',
          fontSize: '14px',
          lineHeight: '1.6',
        }}
      >
        Use semantic spacing tokens for consistency. These provide meaningful names for common
        spacing patterns.
      </p>
      <SpacingScale title='Component Spacing' scale={tokens.semantic.spacing.component} />
      <SpacingScale title='Layout Spacing' scale={tokens.semantic.spacing.layout} />
      <SpacingScale title='Container Padding' scale={tokens.semantic.spacing.container} />
      <SpacingScale title='Section Spacing' scale={tokens.semantic.spacing.section} />
    </div>
  ),
};
export const SpacingExamples: Story = {
  render: () => (
    <div>
      <h2
        style={{
          color: 'var(--tf-text-primary)',
          marginBottom: '24px',
          fontSize: '24px',
          fontWeight: 700,
        }}
      >
        Spacing in Practice
      </h2>
      <p
        style={{
          color: 'hsl(var(--tf-neutral-hs) 70%)',
          marginBottom: '32px',
          fontSize: '14px',
          lineHeight: '1.6',
        }}
      >
        Examples of how spacing tokens are used in real components.
      </p>

      <div
        style={{
          marginBottom: '48px',
        }}
      >
        <h3 className='font-semibold'>Card with Standard Padding</h3>
        <div
          style={{
            backgroundColor: tokens.colors.component.card.background,
            border: `1px solid ${tokens.colors.component.card.border}`,
            borderRadius: tokens.semantic.radius.card,
            padding: tokens.spacing[6],
            // 24px
            maxWidth: '400px',
          }}
        >
          <h4
            style={{
              marginBottom: tokens.spacing[2],
            }}
            className='font-semibold'
          >
            Card Title
          </h4>
          <p
            style={{
              color: 'hsl(var(--tf-neutral-hs) 70%)',
              fontSize: '14px',
              lineHeight: '1.6',
              margin: 0,
            }}
          >
            This card uses spacing[6] (24px) for padding, demonstrating consistent spacing.
          </p>
        </div>
      </div>

      <div
        style={{
          marginBottom: '48px',
        }}
      >
        <h3 className='font-semibold'>Stack (Vertical Spacing)</h3>
        <div
          style={{
            gap: tokens.stack.md,
          }}
          className='flex'
        >
          {['Item 1', 'Item 2', 'Item 3'].map((item) => (
            <div
              key={item}
              style={{
                backgroundColor: tokens.colors.semantic.surface.elevated,
                padding: tokens.spacing[4],
                borderRadius: tokens.radius.md,
                color: 'var(--tf-text-primary)',
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className='font-semibold'>Grid with Gap</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: tokens.gap[4],
            // 16px
            maxWidth: '600px',
          }}
        >
          {['Box 1', 'Box 2', 'Box 3', 'Box 4', 'Box 5', 'Box 6'].map((box) => (
            <div
              key={box}
              style={{
                backgroundColor: tokens.colors.brand.primary[500],
                padding: tokens.spacing[4],
                borderRadius: tokens.radius.md,
              }}
              className='text-center'
            >
              {box}
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};
export const UsageGuidelines: Story = {
  render: () => (
    <div>
      <h2
        style={{
          color: 'var(--tf-text-primary)',
          marginBottom: '24px',
          fontSize: '24px',
          fontWeight: 700,
        }}
      >
        Usage Guidelines
      </h2>

      <div
        style={{
          marginBottom: '32px',
        }}
      >
        <h3
          style={{
            color: tokens.colors.state.success[500],
          }}
          className='font-semibold'
        >
          ✅ Do
        </h3>
        <ul
          style={{
            color: 'hsl(var(--tf-neutral-hs) 70%)',
            fontSize: '14px',
            lineHeight: '1.8',
          }}
        >
          <li>Use semantic spacing tokens when available (component.md, layout.lg)</li>
          <li>Stick to the 8px grid system for consistency</li>
          <li>Use gap utilities for flexbox/grid layouts</li>
          <li>Use stack tokens for vertical rhythm</li>
          <li>Use inset tokens for padding shortcuts</li>
        </ul>
      </div>

      <div
        style={{
          marginBottom: '32px',
        }}
      >
        <h3
          style={{
            color: tokens.colors.state.error[500],
          }}
          className='font-semibold'
        >
          ❌ Don't
        </h3>
        <ul
          style={{
            color: 'hsl(var(--tf-neutral-hs) 70%)',
            fontSize: '14px',
            lineHeight: '1.8',
          }}
        >
          <li>Don't use arbitrary pixel values (e.g., 13px, 27px)</li>
          <li>Don't break the 8px grid rhythm</li>
          <li>Don't mix spacing systems (use tokens, not hardcoded values)</li>
          <li>Don't use magic numbers without meaning</li>
        </ul>
      </div>

      <div>
        <h3 className='font-semibold'>Code Examples</h3>
        <div
          style={{
            border: `1px solid ${tokens.colors.semantic.border.default}`,
            borderRadius: tokens.radius.md,
            padding: tokens.spacing[4],
            fontFamily: tokens.typography.fontFamily.mono,
          }}
          className='overflow-x-auto'
        >
          <pre
            style={{
              margin: 0,
            }}
          >
            {`// ✅ Good - Using tokens
padding: tokens.spacing[6]        // 24px
margin: tokens.semantic.spacing.layout.lg  // 48px
gap: tokens.gap[4]                // 16px

// ❌ Bad - Hardcoded values
padding: '24px'
margin: '48px'
gap: '16px'`}
          </pre>
        </div>
      </div>
    </div>
  ),
};
