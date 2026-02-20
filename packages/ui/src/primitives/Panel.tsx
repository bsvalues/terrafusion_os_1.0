import * as React from 'react';

export type PanelProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode;
};

/**
 * Panel — primary surface material.
 * Use for cards, panes, docked surfaces.
 * All visual values derive from Lumin tokens (CSS custom properties).
 */
export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        data-testid={rest['data-testid'] ?? 'tf-panel'}
        {...rest}
        className={[
          'rounded-[var(--tf-r-xl)] border',
          'bg-[hsl(var(--tf-surface)/0.72)] backdrop-blur',
          'shadow-[var(--tf-shadow)]',
          'border-[hsl(var(--tf-border)/0.9)]',
          'p-4',
          className ?? '',
        ]
          .join(' ')
          .trim()}
      >
        {children}
      </div>
    );
  }
);

Panel.displayName = 'Panel';
