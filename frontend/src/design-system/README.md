# TerraFusion Design System

> **World-class design system built The TerraFusion Way** - MIT/PhD-level engineering, no compromises.

## 📐 Overview

The TerraFusion Design System is a comprehensive, type-safe design token and component library that powers the TerraFusion OS interface. Built with accessibility, performance, and developer experience as first-class concerns.

## 🎨 Design Tokens

### Colors

```typescript
import { tokens } from '@/design-system';

// Brand colors
const primary = tokens.colors.brand.primary[500]; // #0099ff
const transcend = tokens.colors.brand.transcend[500]; // #00ffee
const accent = tokens.colors.brand.accent[500]; // #00ffaa

// Semantic colors
const textPrimary = tokens.colors.semantic.text.primary; // #ffffff
const bgPrimary = tokens.colors.semantic.background.primary; // #000000

// State colors
const success = tokens.colors.state.success[500]; // #00ffaa
const error = tokens.colors.state.error[500]; // #ff0000

// Component colors
const buttonBg = tokens.colors.component.button.primary.background;
const inputBorder = tokens.colors.component.input.border;
```

### Spacing

8px grid system with semantic naming:

```typescript
// Base spacing (8px grid)
const space = tokens.spacing[4]; // 1rem (16px)
const space = tokens.spacing[8]; // 2rem (32px)

// Semantic spacing
const componentPadding = tokens.semantic.spacing.component.md; // 16px
const layoutGap = tokens.semantic.spacing.layout.lg; // 48px

// Gap utilities
const flexGap = tokens.gap[4]; // 1rem

// Inset (padding)
const padding = tokens.inset.md; // 1rem

// Stack (vertical rhythm)
const stackSpace = tokens.stack.lg; // 2rem
```

### Typography

Type-safe typography with Inter font family:

```typescript
// Font families
const sans = tokens.typography.fontFamily.sans; // Inter
const mono = tokens.typography.fontFamily.mono; // Fira Code

// Text styles
const heading1 = tokens.typography.textStyles.heading.h1;
// { fontSize: '2.25rem', lineHeight: '2.5rem', fontWeight: '700', ... }

const bodyText = tokens.typography.textStyles.body.md;
// { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: '400' }

// Individual tokens
const size = tokens.typography.fontSize['2xl']; // ['1.5rem', { lineHeight: '2rem' }]
const weight = tokens.typography.fontWeight.bold; // '700'
```

### Motion

Animation and transition system:

```typescript
// Durations
const fast = tokens.motion.duration.fast; // '100ms'
const normal = tokens.motion.duration.normal; // '200ms'

// Easings
const snappy = tokens.motion.easing.snappy; // cubic-bezier(0.4, 0.0, 0.2, 1)

// Transitions
const transition = tokens.motion.transition.normal.default;
// 'all 200ms cubic-bezier(0.4, 0.0, 0.2, 1)'

// Animations
const fadeIn = tokens.motion.animation.fadeIn;
const slideIn = tokens.motion.animation.slideInUp;

// Spring physics (for Framer Motion)
const spring = tokens.motion.spring.bouncy;
// { type: 'spring', stiffness: 300, damping: 20 }
```

### Shadows

Depth and elevation system:

```typescript
// Box shadows
const cardShadow = tokens.shadows.box.lg;
const elevation = tokens.shadows.box.elevation[3];

// Colored shadows
const primaryShadow = tokens.shadows.box.colored.primary;

// Glow effects
const glow = tokens.shadows.box.glow.md; // '0 0 20px rgba(0, 153, 255, 0.4)'

// Text shadows
const textGlow = tokens.shadows.text.glow;
```

### Z-Index

Consistent layering:

```typescript
const modal = tokens.zIndex.modal; // 1400
const tooltip = tokens.zIndex.tooltip; // 1600
const toast = tokens.zIndex.toast; // 1700
```

### Border Radius

Corner rounding system:

```typescript
// Base radius
const rounded = tokens.radius.lg; // '0.5rem' (8px)
const pill = tokens.radius.full; // '9999px'

// Semantic radius
const buttonRadius = tokens.semantic.radius.button; // '0.5rem'
const cardRadius = tokens.semantic.radius.card; // '0.75rem'
```

## 🎯 Usage Examples

### React Component with Tokens

```tsx
import { tokens } from '@/design-system';

function Button({ children, variant = 'primary' }) {
  return (
    <button
      style={{
        // Colors
        backgroundColor: tokens.colors.component.button[variant].background,
        color: tokens.colors.component.button[variant].text,

        // Spacing
        padding: `${tokens.inset.md} ${tokens.spacing[6]}`,

        // Typography
        ...tokens.typography.textStyles.body.md,
        fontWeight: tokens.typography.fontWeight.semibold,

        // Effects
        borderRadius: tokens.semantic.radius.button,
        boxShadow: tokens.shadows.box.md,
        transition: tokens.motion.transition.normal.colors,
      }}
    >
      {children}
    </button>
  );
}
```

### CSS-in-JS with Tokens

```typescript
import { tokens } from '@/design-system';
import styled from '@emotion/styled';

const Card = styled.div`
  background: ${tokens.colors.component.card.background};
  border: 1px solid ${tokens.colors.component.card.border};
  border-radius: ${tokens.semantic.radius.card};
  padding: ${tokens.spacing[6]};
  box-shadow: ${tokens.shadows.box.lg};
  transition: ${tokens.motion.transition.normal.default};

  &:hover {
    background: ${tokens.colors.component.card.hover};
    transform: translateY(-2px);
  }
`;
```

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
import { tokens } from './src/design-system';

export default {
  theme: {
    extend: {
      colors: {
        primary: tokens.colors.brand.primary,
        transcend: tokens.colors.brand.transcend,
        accent: tokens.colors.brand.accent,
      },
      spacing: tokens.spacing,
      fontFamily: {
        sans: tokens.typography.fontFamily.sans.split(','),
        mono: tokens.typography.fontFamily.mono.split(','),
      },
      boxShadow: tokens.shadows.box,
      zIndex: tokens.zIndex,
      borderRadius: tokens.radius,
    },
  },
};
```

## 📁 File Structure

```
design-system/
├── tokens/
│   ├── colors.ts       # Brand, semantic, state, component colors
│   ├── spacing.ts      # 8px grid, semantic spacing
│   ├── typography.ts   # Font families, sizes, weights, styles
│   ├── motion.ts       # Animations, transitions, springs
│   ├── shadows.ts      # Box shadows, text shadows, glows
│   ├── zIndex.ts       # Layering system
│   ├── radius.ts       # Border radius system
│   └── index.ts        # Unified token export
├── components/         # (Future) Reusable components
├── hooks/              # (Future) Design system hooks
├── utils/              # (Future) Design utilities
├── index.ts            # Main design system export
└── README.md           # This file
```

## 🚀 Getting Started

### Installation

The design system is already part of the TerraFusion OS frontend. Just import and use:

```typescript
import { tokens } from '@/design-system';
```

### TypeScript Support

Full TypeScript support with auto-completion:

```typescript
import type { BrandColor, SpacingScale, FontSize, BoxShadow } from '@/design-system';

// Get type-safe suggestions as you type
const color: BrandColor = 'primary';
const space: SpacingScale = 4;
```

## 📊 Token Coverage

- ✅ **Colors**: 100+ color tokens (brand, semantic, state, component)
- ✅ **Spacing**: 40+ spacing values (8px grid system)
- ✅ **Typography**: 13 font sizes, 9 weights, complete text styles
- ✅ **Motion**: 7 durations, 10 easings, 15 animations
- ✅ **Shadows**: 6 elevations, colored shadows, glows
- ✅ **Z-Index**: 12 layer definitions
- ✅ **Radius**: 9 border radius values

## 🎓 Best Practices

### Do ✅

```typescript
// Use semantic tokens when available
const padding = tokens.semantic.spacing.component.md;
const radius = tokens.semantic.radius.button;

// Use brand colors for brand elements
const primaryColor = tokens.colors.brand.primary[500];

// Use state colors for feedback
const successBg = tokens.colors.state.success.background;

// Use component colors for specific components
const buttonBg = tokens.colors.component.button.primary.background;
```

### Don't ❌

```typescript
// Don't hardcode colors
const color = '#0099ff'; // ❌

// Don't hardcode spacing
const padding = '16px'; // ❌

// Don't use magic numbers
const zIndex = 9999; // ❌

// Use tokens instead
const color = tokens.colors.brand.primary[500]; // ✅
const padding = tokens.spacing[4]; // ✅
const zIndex = tokens.zIndex.modal; // ✅
```

## 🔄 Future Additions

- [ ] Component library (buttons, inputs, cards, etc.)
- [ ] Design system hooks (useTheme, useMediaQuery, etc.)
- [ ] Utility functions (responsive helpers, etc.)
- [ ] Storybook documentation
- [ ] Figma design tokens sync

## 📚 Related Documentation

- [Frontend Architecture Audit](../../../docs/architecture/FRONTEND_ARCHITECTURE_AUDIT.md)
- [Frontend Excellence Implementation Plan](../../../docs/guides/FRONTEND_EXCELLENCE_IMPLEMENTATION_PLAN.md)
- [Frontend Quick Start Guide](../../../docs/guides/FRONTEND_QUICK_START.md)

## 🤝 Contributing

When adding new tokens:

1. Follow existing patterns and naming conventions
2. Add TypeScript types for all new tokens
3. Update this README with usage examples
4. Ensure tokens are accessible (WCAG 2.1 AA)
5. Test tokens across all breakpoints
6. Document semantic usage

---

**Built with ❤️ The TerraFusion Way** - No rushing, no compromises, world-class engineering.
