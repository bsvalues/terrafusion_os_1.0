import type { Meta, StoryObj } from '@storybook/react-vite';
import { tokens } from '../tokens';

/**
 * TerraFusion Design System - Typography Tokens
 * 
 * Complete typography system with Inter font family, semantic text styles,
 * and consistent typographic hierarchy.
 */
const meta: Meta = {
  title: 'Design System/Tokens/Typography',
  parameters: {
    layout: 'padded'
  },
  tags: ['autodocs']
};
export default meta;
type Story = StoryObj;
const TextStyleExample = ({
  title,
  style,
  example = 'The quick brown fox jumps over the lazy dog'
}: {
  title: string;
  style: any;
  example?: string;
}) => <div style={{
  marginBottom: '24px'
}}>
    <div style={{
    fontFamily: tokens.typography.fontFamily.mono
  }} className="text-gray-400">
      {title}
    </div>
    <div style={{
    ...style,
    color: '#fff'
  }}>
      {example}
    </div>
  </div>;
export const DisplayText: Story = {
  render: () => <div>
      <h2 style={{
      color: '#fff',
      marginBottom: '32px',
      fontSize: '24px',
      fontWeight: 700
    }}>
        Display Text Styles
      </h2>
      <p style={{
      color: '#b3b3b3',
      marginBottom: '32px',
      fontSize: '14px',
      lineHeight: '1.6'
    }}>
        Large, impactful text for hero sections and major headings. Used sparingly for maximum effect.
      </p>
      <TextStyleExample title="display.2xl" style={tokens.typography.textStyles.display['2xl']} example="Welcome to TerraFusion" />
      <TextStyleExample title="display.xl" style={tokens.typography.textStyles.display.xl} example="Welcome to TerraFusion" />
      <TextStyleExample title="display.lg" style={tokens.typography.textStyles.display.lg} example="Welcome to TerraFusion" />
      <TextStyleExample title="display.md" style={tokens.typography.textStyles.display.md} example="Welcome to TerraFusion" />
      <TextStyleExample title="display.sm" style={tokens.typography.textStyles.display.sm} example="Welcome to TerraFusion" />
    </div>
};
export const Headings: Story = {
  render: () => <div>
      <h2 style={{
      color: '#fff',
      marginBottom: '32px',
      fontSize: '24px',
      fontWeight: 700
    }}>
        Heading Styles (H1-H6)
      </h2>
      <p style={{
      color: '#b3b3b3',
      marginBottom: '32px',
      fontSize: '14px',
      lineHeight: '1.6'
    }}>
        Semantic headings for document structure and content hierarchy.
      </p>
      <TextStyleExample title="heading.h1" style={tokens.typography.textStyles.heading.h1} example="Heading Level 1" />
      <TextStyleExample title="heading.h2" style={tokens.typography.textStyles.heading.h2} example="Heading Level 2" />
      <TextStyleExample title="heading.h3" style={tokens.typography.textStyles.heading.h3} example="Heading Level 3" />
      <TextStyleExample title="heading.h4" style={tokens.typography.textStyles.heading.h4} example="Heading Level 4" />
      <TextStyleExample title="heading.h5" style={tokens.typography.textStyles.heading.h5} example="Heading Level 5" />
      <TextStyleExample title="heading.h6" style={tokens.typography.textStyles.heading.h6} example="Heading Level 6" />
    </div>
};
export const BodyText: Story = {
  render: () => <div>
      <h2 style={{
      color: '#fff',
      marginBottom: '32px',
      fontSize: '24px',
      fontWeight: 700
    }}>
        Body Text Styles
      </h2>
      <p style={{
      color: '#b3b3b3',
      marginBottom: '32px',
      fontSize: '14px',
      lineHeight: '1.6'
    }}>
        Standard text styles for paragraphs, lists, and general content.
      </p>
      <TextStyleExample title="body.lg" style={tokens.typography.textStyles.body.lg} example="Large body text for emphasis or lead paragraphs. The quick brown fox jumps over the lazy dog." />
      <TextStyleExample title="body.md (default)" style={tokens.typography.textStyles.body.md} example="Standard body text for most content. The quick brown fox jumps over the lazy dog. This is the most common text size used throughout the application." />
      <TextStyleExample title="body.sm" style={tokens.typography.textStyles.body.sm} example="Small body text for secondary information. The quick brown fox jumps over the lazy dog." />
      <TextStyleExample title="body.xs" style={tokens.typography.textStyles.body.xs} example="Extra small text for captions and fine print. The quick brown fox jumps over the lazy dog." />
    </div>
};
export const Labels: Story = {
  render: () => <div>
      <h2 style={{
      color: '#fff',
      marginBottom: '32px',
      fontSize: '24px',
      fontWeight: 700
    }}>
        Label Styles
      </h2>
      <p style={{
      color: '#b3b3b3',
      marginBottom: '32px',
      fontSize: '14px',
      lineHeight: '1.6'
    }}>
        Labels for form fields, tags, and UI elements. Medium weight with wider letter spacing.
      </p>
      <TextStyleExample title="label.lg" style={tokens.typography.textStyles.label.lg} example="LARGE LABEL" />
      <TextStyleExample title="label.md" style={tokens.typography.textStyles.label.md} example="MEDIUM LABEL" />
      <TextStyleExample title="label.sm" style={tokens.typography.textStyles.label.sm} example="SMALL LABEL" />
    </div>
};
export const CodeText: Story = {
  render: () => <div>
      <h2 style={{
      color: '#fff',
      marginBottom: '32px',
      fontSize: '24px',
      fontWeight: 700
    }}>
        Code & Monospace
      </h2>
      <p style={{
      color: '#b3b3b3',
      marginBottom: '32px',
      fontSize: '14px',
      lineHeight: '1.6'
    }}>
        Monospace text for code, terminal output, and technical content.
      </p>
      <TextStyleExample title="code.lg" style={tokens.typography.textStyles.code.lg} example="const message = 'Hello, TerraFusion!';" />
      <TextStyleExample title="code.md" style={tokens.typography.textStyles.code.md} example="npm install @terrafusion/core" />
      <TextStyleExample title="code.sm" style={tokens.typography.textStyles.code.sm} example="git commit -m 'feat: add typography'" />
    </div>
};
export const FontWeights: Story = {
  render: () => <div>
      <h2 style={{
      color: '#fff',
      marginBottom: '32px',
      fontSize: '24px',
      fontWeight: 700
    }}>
        Font Weights
      </h2>
      <p style={{
      color: '#b3b3b3',
      marginBottom: '32px',
      fontSize: '14px',
      lineHeight: '1.6'
    }}>
        Available font weights for the Inter font family.
      </p>
      {Object.entries(tokens.typography.fontWeight).map(([name, weight]) => <div key={name} style={{
      marginBottom: '16px'
    }}>
          <div className="text-gray-400">
            {name} ({weight})
          </div>
          <div style={{
        color: '#fff',
        fontSize: '18px',
        fontWeight: weight
      }}>
            The quick brown fox jumps over the lazy dog
          </div>
        </div>)}
    </div>
};
export const RealWorldExample: Story = {
  render: () => <div>
      <h2 style={{
      color: '#fff',
      marginBottom: '32px',
      fontSize: '24px',
      fontWeight: 700
    }}>
        Real-World Example
      </h2>
      <div style={{
      backgroundColor: tokens.colors.component.card.background,
      border: `1px solid ${tokens.colors.component.card.border}`,
      borderRadius: tokens.semantic.radius.card,
      padding: tokens.spacing[6],
      maxWidth: '600px'
    }}>
        <h1 style={{
        ...tokens.typography.textStyles.heading.h1,
        color: '#fff',
        marginBottom: tokens.spacing[2]
      }}>
          Article Title
        </h1>
        
        <div style={{
        ...tokens.typography.textStyles.label.sm,
        color: tokens.colors.brand.primary[500],
        marginBottom: tokens.spacing[4]
      }}>
          TECHNOLOGY • 5 MIN READ
        </div>
        
        <p style={{
        ...tokens.typography.textStyles.body.lg,
        color: '#e6e6e6',
        marginBottom: tokens.spacing[4]
      }}>
          Lead paragraph with larger text for emphasis. This introduces the main topic and draws the reader in.
        </p>
        
        <h2 style={{
        ...tokens.typography.textStyles.heading.h3,
        color: '#fff',
        marginBottom: tokens.spacing[3]
      }}>
          Section Heading
        </h2>
        
        <p style={{
        ...tokens.typography.textStyles.body.md,
        color: '#b3b3b3',
        marginBottom: tokens.spacing[4],
        lineHeight: '1.7'
      }}>
          Standard body text provides detailed information. The quick brown fox jumps over the lazy dog. 
          This text uses the default body.md style which is optimized for readability.
        </p>
        
        <div style={{
        backgroundColor: tokens.colors.semantic.background.tertiary,
        borderLeft: `4px solid ${tokens.colors.brand.primary[500]}`,
        padding: tokens.spacing[4],
        marginBottom: tokens.spacing[4],
        borderRadius: tokens.radius.md
      }}>
          <p style={{
          ...tokens.typography.textStyles.code.md,
          color: tokens.colors.brand.primary[300],
          margin: 0
        }}>
            npm install terrafusion-os
          </p>
        </div>
        
        <p className="text-gray-400">
          Small text for footnotes and additional information.
        </p>
      </div>
    </div>
};
export const UsageGuidelines: Story = {
  render: () => <div>
      <h2 style={{
      color: '#fff',
      marginBottom: '24px',
      fontSize: '24px',
      fontWeight: 700
    }}>
        Usage Guidelines
      </h2>

      <div style={{
      marginBottom: '32px'
    }}>
        <h3 style={{
        color: tokens.colors.state.success[500]
      }} className="font-semibold">
          ✅ Do
        </h3>
        <ul style={{
        color: '#b3b3b3',
        fontSize: '14px',
        lineHeight: '1.8'
      }}>
          <li>Use semantic text styles (heading.h1, body.md) instead of raw font sizes</li>
          <li>Maintain consistent hierarchy (H1 → H2 → H3)</li>
          <li>Use body.md as the default for most content</li>
          <li>Use code styles for technical content</li>
          <li>Use label styles for UI elements</li>
        </ul>
      </div>

      <div style={{
      marginBottom: '32px'
    }}>
        <h3 style={{
        color: tokens.colors.state.error[500]
      }} className="font-semibold">
          ❌ Don't
        </h3>
        <ul style={{
        color: '#b3b3b3',
        fontSize: '14px',
        lineHeight: '1.8'
      }}>
          <li>Don't use arbitrary font sizes (e.g., fontSize: '17px')</li>
          <li>Don't skip heading levels (H1 → H3)</li>
          <li>Don't use display text for body content</li>
          <li>Don't mix font families outside the system</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">
          Code Examples
        </h3>
        <div style={{
        border: `1px solid ${tokens.colors.semantic.border.default}`,
        borderRadius: tokens.radius.md,
        padding: tokens.spacing[4],
        fontFamily: tokens.typography.fontFamily.mono
      }} className="overflow-x-auto">
          <pre style={{
          margin: 0
        }}>
          {`// ✅ Good - Using text style tokens
style={tokens.typography.textStyles.heading.h1}
style={tokens.typography.textStyles.body.md}

// ✅ Good - Composing styles
style={{
  ...tokens.typography.textStyles.heading.h2,
  color: tokens.colors.brand.primary[500]
}}

// ❌ Bad - Hardcoded values
fontSize: '24px'
fontWeight: 600
lineHeight: 1.5`}
          </pre>
        </div>
      </div>
    </div>
};