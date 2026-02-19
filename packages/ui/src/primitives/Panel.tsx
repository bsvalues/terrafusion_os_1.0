import * as React from 'react';

export type PanelProps = React.PropsWithChildren<{
  className?: string;
  'data-testid'?: string;
}>;

/**
 * Panel — primary surface material.
 * Use for cards, panes, docked surfaces.
 * All visual values derive from Lumin tokens (CSS custom properties).
 */
export function Panel({ className, children, ...rest }: PanelProps): React.ReactElement {
  return (
    <div
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
