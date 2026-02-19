import * as React from 'react';

export type TFButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};

/**
 * Button — canonical action control.
 * Rule: no custom button styling in apps; use variant + className only for layout.
 * All visual values derive from Lumin tokens (CSS custom properties).
 */
export function Button({
  variant = 'ghost',
  className,
  ...props
}: TFButtonProps): React.ReactElement {
  const base =
    'rounded-[var(--tf-r-lg)] px-3 py-2 text-sm border transition ' +
    'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--tf-accent)/0.55)]';

  const styles =
    variant === 'primary'
      ? 'bg-[hsl(var(--tf-accent)/0.20)] border-[hsl(var(--tf-accent)/0.45)] hover:bg-[hsl(var(--tf-accent)/0.28)]'
      : 'bg-transparent border-[hsl(var(--tf-border)/0.9)] hover:bg-white/5';

  return (
    <button {...props} className={[base, styles, className ?? ''].join(' ').trim()} />
  );
}
