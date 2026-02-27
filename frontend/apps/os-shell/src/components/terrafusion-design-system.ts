/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION DESIGN SYSTEM - MAIN EXPORT
 * Quantum Governance Platform Component Library
 * ═══════════════════════════════════════════════════════════════
 */

// Core UI Components (importing from actual files)
export { Avatar } from './ui/avatar';
export { Badge } from './ui/badge';
export { Button } from './ui/button';
export { Card, CardContent, CardFooter, CardHeader } from './ui/card';
export { Divider } from './ui/divider';
export { Input } from './ui/input';
export { Progress } from './ui/progress';

// Design System Aliases for compatibility
export { CardContent as CardBody } from './ui/card';

// Re-export types if available
export type { BadgeProps } from './ui/badge';

// Brand Components
export { TerraSphere } from './brand/TerraSphere';
export type { default as TerraSphereProps } from './brand/TerraSphere';

// Design Tokens (CSS variables are imported via stylesheet)
import './styles/terrafusion-tokens.css';

// Component-specific styles
import './ui/terrafusion-ui.css';

/**
 * TerraFusion Design System Usage Guide:
 *
 * Core Colors:
 * - Primary: var(--tf-transcend-cyan) (terra-cyan)
 * - Background: var(--tf-bg-void) (terra-midnight)
 * - Secondary: var(--tf-network-blue) (terra-blue)
 *
 * Typography Scale (Golden Ratio):
 * - Base: 1rem (16px)
 * - Large: 1.618rem (25.888px)
 * - XL: 2.618rem (41.888px)
 *
 * Spacing (Base-8):
 * - Small: 0.5rem (8px)
 * - Medium: 1rem (16px)
 * - Large: 1.5rem (24px)
 * - XL: 2rem (32px)
 *
 * Component Variants:
 * - All components support terra-cyan glow effects
 * - Quantum variants include animated gradients
 * - Glass morphism styles available
 *
 * Example Usage:
 * ```tsx
 * import { Button, Card, TerraSphere } from '@/components/terrafusion-design-system';
 *
 * <Card variant="glass" glow>
 *   <CardHeader>
 *     <TerraSphere size="lg" variant="quantum" />
 *     <h2>Quantum Interface</h2>
 *   </CardHeader>
 *   <CardBody>
 *     <Button variant="quantum" pulse>
 *       Execute Quantum Protocol
 *     </Button>
 *   </CardBody>
 * </Card>
 * ```
 */

export const TERRAFUSION_VERSION = '1.0.0';
export const DESIGN_SYSTEM_NAME = 'TerraFusion Quantum UI';

// Design System Utilities
export const TerraFusionTheme = {
  colors: {
    primary: 'var(--tf-transcend-cyan)',
    secondary: 'var(--tf-network-blue)',
    background: 'var(--tf-bg-void)',
    surface: 'var(--terra-slate)',
    success: 'var(--tf-accent-success)',
    warning: 'var(--tf-accent-warning)',
    error: 'var(--tf-accent-error)',
    info: 'var(--tf-accent-quantum)',
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    golden: '1.618rem',
  },

  typography: {
    xs: '0.618rem',
    sm: '0.764rem',
    base: '1rem',
    lg: '1.236rem',
    xl: '1.618rem',
    '2xl': '2rem',
    '3xl': '2.618rem',
  },

  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    xl: '1.5rem',
    full: '9999px',
  },

  shadows: {
    glow: '0 0 40px hsl(var(--tf-accent) / 0.4)',
    quantum: '0 0 20px hsl(var(--tf-accent) / 0.3), 0 0 40px hsl(var(--tf-accent-2) / 0.2)',
  },
} as const;

export type TerraFusionTheme = typeof TerraFusionTheme;
