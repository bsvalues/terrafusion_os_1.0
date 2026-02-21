/**
 * TerraFusion UI Tokens (Lumin)
 * Single source of truth for color, radius, spacing, typography primitives.
 *
 * Rule: NO raw hex in app code. Tokens only.
 * All values reference CSS custom properties set in the theme layer.
 */
export const tfTokens = {
  color: {
    bg: 'hsl(var(--tf-bg))',
    surface: 'hsl(var(--tf-surface))',
    surface2: 'hsl(var(--tf-surface-2))',
    border: 'hsl(var(--tf-border))',
    text: 'hsl(var(--tf-text))',
    muted: 'hsl(var(--tf-muted))',
    accent: 'hsl(var(--tf-accent))',
    accent2: 'hsl(var(--tf-accent-2))',
  },
  radius: {
    lg: 'var(--tf-r-lg)',
    xl: 'var(--tf-r-xl)',
  },
  shadow: {
    surface: 'var(--tf-shadow)',
  },
} as const;

export type TFTokens = typeof tfTokens;
