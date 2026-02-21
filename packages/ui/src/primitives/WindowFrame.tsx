import * as React from 'react';

export type WindowFrameProps = React.HTMLAttributes<HTMLDivElement> & {
  'data-testid'?: string;
};

/**
 * WindowFrame — material primitive for window chrome (titlebar + body container).
 * Same material language as Panel but with window-specific semantics.
 */
export const WindowFrame = React.forwardRef<HTMLDivElement, WindowFrameProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-testid={props['data-testid'] ?? 'tf-window'}
        {...props}
        className={[
          'rounded-[var(--tf-r-xl)] border',
          'bg-[hsl(var(--tf-surface)/0.72)] backdrop-blur',
          'shadow-[var(--tf-shadow)]',
          'border-[hsl(var(--tf-border)/0.9)]',
          'overflow-hidden',
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

WindowFrame.displayName = 'WindowFrame';
