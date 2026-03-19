/**
 * Vitest stub for @terrafusion/ui
 *
 * The package source lives at packages/ui/src but has no built dist/.
 * This stub satisfies imports during test runs without requiring a build step.
 */
import * as React from 'react';

// --- Panel ---
export type PanelProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode;
};

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ children, ...rest }, ref) =>
    React.createElement('div', { ref, 'data-testid': 'tf-panel', ...rest }, children)
);
Panel.displayName = 'Panel';

// --- Button ---
export type TFButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};

export function Button({ variant: _variant, ...props }: TFButtonProps): React.ReactElement {
  return React.createElement('button', props);
}

// --- WindowFrame ---
export type WindowFrameProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode;
};

export const WindowFrame = React.forwardRef<HTMLDivElement, WindowFrameProps>(
  ({ children, ...rest }, ref) =>
    React.createElement('div', { ref, 'data-testid': 'tf-window-frame', ...rest }, children)
);
WindowFrame.displayName = 'WindowFrame';

// --- Tokens ---
export const tfTokens = {
  color: {
    bg: '',
    surface: '',
    surface2: '',
    border: '',
    text: '',
    muted: '',
    accent: '',
    accent2: '',
  },
  radius: { lg: '', xl: '' },
  shadow: { surface: '' },
} as const;

export type TFTokens = typeof tfTokens;
