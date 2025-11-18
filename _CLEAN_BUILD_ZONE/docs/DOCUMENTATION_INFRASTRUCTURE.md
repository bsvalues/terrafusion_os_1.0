# TerraFusion Documentation Infrastructure

## Overview

Complete documentation system for TerraFusion OS with three integrated components:

1. **Storybook** - Interactive component documentation
2. **TypeDoc** - API documentation generation
3. **Figma Token Sync** - Design token automation

## Storybook

**Purpose**: Interactive component documentation with visual testing and accessibility checks.

### Features
- 📚 Auto-generated component documentation
- 🎨 TerraFusion quantum theme integration
- ♿ Accessibility testing with addon-a11y
- 📱 Responsive viewport testing
- 🌙 Dark mode by default (terra-midnight background)

### Usage

```bash
# Start Storybook dev server
npm run storybook

# Build static Storybook
npm run build-storybook
```

**Access**: http://localhost:6006

### Writing Stories

```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/UI/Button',
  component: Button,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};
```

### Configuration Files
- `.storybook/main.ts` - Main Storybook configuration
- `.storybook/preview.ts` - Global decorators and parameters
- `.storybook/manager.ts` - Storybook UI customization

## TypeDoc

**Purpose**: Automated API documentation from TypeScript source code.

### Features
- 📖 Generates comprehensive API docs from JSDoc comments
- 🔍 Searchable documentation
- 📊 Type information visualization
- 🔗 Cross-referenced links between types

### Usage

```bash
# Generate API documentation
npm run docs:api

# Generate docs in watch mode
npm run docs:api:watch
```

**Output**: `docs/api/` directory

### Documentation Standards

```typescript
/**
 * Format currency with symbol
 *
 * @param value - Amount to format
 * @param currency - Currency code (default: USD)
 * @param options - Additional format options
 * @returns Formatted currency string
 *
 * @example
 * ```typescript
 * formatCurrency(1234.56); // "$1,234.56"
 * formatCurrency(1234.56, 'EUR'); // "€1,234.56"
 * ```
 */
export function formatCurrency(
  value: number,
  currency: string = 'USD',
  options?: Intl.NumberFormatOptions
): string {
  // Implementation
}
```

### Configuration
- `typedoc.json` - TypeDoc configuration
- Entry points: `src/hooks`, `src/utils`, `src/lib`, `src/components/ui`
- Output format: HTML with optional Markdown plugin

## Figma Token Sync

**Purpose**: Automated synchronization of design tokens from Figma to codebase.

### Features
- 🎨 CSS variable generation
- 📝 TypeScript type generation
- 📚 Token documentation generation
- 🔄 Automated sync workflow

### Usage

```bash
# Sync design tokens from Figma
npm run docs:tokens
```

### Generated Files
1. **CSS Variables**: `src/styles/terrafusion-tokens.css`
   - All design tokens as CSS custom properties
   - Organized by category (colors, spacing, typography, shadows, radius)

2. **TypeScript Types**: `src/types/design-tokens.ts`
   - Type-safe token access
   - Autocomplete support in IDE
   - Token value interfaces

3. **Documentation**: `docs/DESIGN_TOKENS.md`
   - Complete token reference
   - Usage examples
   - Visual previews

### Token Categories

- **Colors**: Terra-cyan, terra-midnight, terra-blue, terra-slate, terra-transcend
- **Spacing**: Base-8 system (space-1 to space-8, space-golden)
- **Typography**: Golden ratio scale (text-base to text-3xl)
- **Shadows**: Glow and quantum effects
- **Radius**: Border radius presets (sm, md, lg, full)

### Script Location
`scripts/sync-figma-tokens.ts`

## Complete Documentation Build

Generate all documentation at once:

```bash
# Build all documentation
npm run docs:all
```

This runs:
1. Figma token sync
2. TypeDoc API generation
3. Storybook static build

## Government Compliance

### Accessibility Validation
```bash
# Run compliance checks (lint + coverage + e2e)
npm run government:compliance
```

### Quality Checks
```bash
# Run quality suite (lint + format + type-check)
npm run quality
```

## Directory Structure

```
_CLEAN_BUILD_ZONE/
├── .storybook/
│   ├── main.ts          # Storybook configuration
│   ├── preview.ts       # Global decorators
│   └── manager.ts       # UI customization
├── docs/
│   ├── api/             # TypeDoc output
│   └── DESIGN_TOKENS.md # Token reference
├── scripts/
│   └── sync-figma-tokens.ts
├── src/
│   ├── components/
│   │   └── ui/
│   │       └── Button/
│   │           ├── Button.tsx
│   │           └── Button.stories.tsx
│   ├── styles/
│   │   └── terrafusion-tokens.css
│   └── types/
│       └── design-tokens.ts
└── typedoc.json
```

## Integration with Development Workflow

### Pre-commit Hooks
Documentation requirements enforced via husky:
- Lint checks for JSDoc comments
- Format checks for Markdown files
- Type checking for TypeScript

### CI/CD Integration
```bash
# Build documentation for deployment
npm run docs:all

# Validate documentation
npm run quality
npm run government:compliance
```

## Best Practices

### Component Documentation
1. Create `.stories.tsx` file for each component
2. Include multiple story variants (Primary, Secondary, Disabled, etc.)
3. Add JSDoc comments with `@param`, `@returns`, `@example`
4. Test accessibility with addon-a11y

### API Documentation
1. Document all public functions/classes
2. Include `@example` blocks with working code
3. Specify parameter types and return types
4. Add `@description` for complex logic

### Design Tokens
1. Use CSS variables for all design values
2. Import TypeScript types for type safety
3. Reference token documentation for consistency
4. Re-sync tokens after Figma updates

## Maintenance

### Update Storybook
```bash
npm install --save-dev @storybook/react-vite@latest
npx storybook upgrade
```

### Update TypeDoc
```bash
npm install --save-dev typedoc@latest typedoc-plugin-markdown@latest
```

### Token Sync Schedule
- Development: On-demand (`npm run docs:tokens`)
- Production: Weekly automated sync
- Major releases: Manual verification

## Troubleshooting

### Storybook Build Fails
- Check `.storybook/main.ts` for correct addon paths
- Verify all story imports are valid
- Clear Storybook cache: `rm -rf node_modules/.cache/storybook`

### TypeDoc Errors
- Ensure all entry points exist
- Check for TypeScript compilation errors
- Verify `typedoc.json` configuration

### Token Sync Issues
- Verify script permissions: `chmod +x scripts/sync-figma-tokens.ts`
- Check output directories exist
- Review token structure in script

## Resources

- **Storybook**: https://storybook.js.org
- **TypeDoc**: https://typedoc.org
- **Figma API**: https://www.figma.com/developers/api
- **TerraFusion Design System**: `/docs/DESIGN_TOKENS.md`
