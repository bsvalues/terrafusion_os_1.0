import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon, HelpCircleIcon  } from '@mui/icons-material';

/**
 * Metric variants using class-variance-authority
 */
const metricVariants = cva('flex', {
  variants: {
    variant: {
      default: 'flex-row items-baseline gap-2',
      stacked: 'flex-col items-start gap-1',
      centered: 'flex-col items-center text-center gap-1',
      split: 'justify-between items-baseline',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  compoundVariants: [
    {
      variant: 'default',
      size: 'sm',
      className: 'text-2xl',
    },
    {
      variant: 'default',
      size: 'md',
      className: 'text-3xl',
    },
    {
      variant: 'default',
      size: 'lg',
      className: 'text-4xl',
    },
    {
      variant: 'stacked',
      size: 'sm',
      className: 'text-2xl',
    },
    {
      variant: 'stacked',
      size: 'md',
      className: 'text-3xl',
    },
    {
      variant: 'stacked',
      size: 'lg',
      className: 'text-4xl',
    },
    {
      variant: 'centered',
      size: 'sm',
      className: 'text-2xl',
    },
    {
      variant: 'centered',
      size: 'md',
      className: 'text-3xl',
    },
    {
      variant: 'centered',
      size: 'lg',
      className: 'text-4xl',
    },
    {
      variant: 'split',
      size: 'sm',
      className: 'text-2xl',
    },
    {
      variant: 'split',
      size: 'md',
      className: 'text-3xl',
    },
    {
      variant: 'split',
      size: 'lg',
      className: 'text-4xl',
    },
  ],
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

// Types for the delta/change data
export interface DeltaData {
  /**
   * The value of the change (can be percentage or absolute)
   */
  value: number;
  /**
   * Whether to display as percentage
   */
  isPercentage?: boolean;
  /**
   * Whether an upward trend is good (e.g., revenue up is good, costs up is bad)
   */
  isPositive?: boolean;
  /**
   * Hide the indicator icon
   */
  hideIcon?: boolean;
  /**
   * The time period for the change
   */
  period?: string;
}

export interface MetricProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof metricVariants> {
  /**
   * Label for the metric
   */
  label: string;
  /**
   * Value of the metric
   */
  value: string | number;
  /**
   * Delta/change data
   */
  delta?: DeltaData;
  /**
   * Description or help text
   */
  description?: string;
  /**
   * Whether to show a tooltip with more info
   */
  showTooltip?: boolean;
  /**
   * Tooltip content
   */
  tooltip?: string;
  /**
   * Icon to display with the metric
   */
  icon?: React.ReactNode;
  /**
   * Position of the icon
   */
  iconPosition?: 'left' | 'right' | 'top';
  /**
   * Custom formatter for the value
   */
  valueFormatter?: (value: string | number) => string;
  /**
   * Display precision for numbers
   */
  precision?: number;
  /**
   * Loading state for the metric
   */
  isLoading?: boolean;
}

/**
 * A component for displaying a single metric value with optional delta/change indicator.
 *
 * @example
 * ```tsx
 * <Metric
 *   label="Revenue"
 *   value={1520500}
 *   valueFormatter={(val) => `$${Number(val).toLocaleString()}`}
 *   delta={{ value: 12.3, isPercentage: true, isPositive: true }}
 *   description="Monthly revenue total"
 * />
 * ```
 */
export const Metric: React.FC<MetricProps> = ({
  className,
  variant,
  size,
  label,
  value,
  delta,
  description,
  showTooltip,
  tooltip,
  icon,
  iconPosition = 'left',
  valueFormatter,
  precision = 2,
  isLoading = false,
  ...props
}) => {
  // Render loading state
  if (isLoading) {
    return (
      <div className={cn(metricVariants({ variant, size }), className)} {...props}>
        <div className="flex flex-col gap-2 w-full"><>

          <div className="h-4 bg-muted/60 animate-pulse rounded"></div>
          <div
</> className="h-8 bg-muted/60 animate-pulse rounded"></div>
          {delta && <div className="h-4 w-24 bg-muted/60 animate-pulse rounded"></div>}
        </div>
      </div>
    );
  }

  // Format the value
  const formattedValue = valueFormatter
    ? valueFormatter(value)
    : typeof value === 'number'
      ? Number(value).toLocaleString(undefined, {
          maximumFractionDigits: precision,
          minimumFractionDigits: 0,
        })
      : value;

  // Determine if delta is trending up, down, or neutral
  const deltaDirection = delta
    ? Math.sign(delta.value) > 0
      ? 'up'
      : Math.sign(delta.value) < 0
        ? 'down'
        : 'neutral'
    : null;

  // Determine if the delta is positive contextually
  const isDeltaPositive = delta
    ? delta.isPositive !== undefined
      ? deltaDirection === 'up'
        ? delta.isPositive
        : !delta.isPositive
      : deltaDirection === 'up'
    : false;

  // Format the delta
  const formattedDelta = delta
    ? `${delta.value > 0 ? '+' : ''}${
        delta.isPercentage
          ? delta.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) + '%'
          : delta.value.toLocaleString(undefined, { maximumFractionDigits: precision })
      }`
    : null;

  // Determine delta color
  const deltaColor = delta
    ? deltaDirection === 'neutral'
      ? 'text-muted-foreground'
      : isDeltaPositive
        ? 'text-emerald-500'
        : 'text-rose-500'
    : '';

  // Render delta icon
  const renderDeltaIcon = () => {
    if (!delta || delta.hideIcon) return null;

    switch (deltaDirection) {
      case 'up':
        return <ArrowUpIcon className="h-4 w-4" />;
      case 'down':
        return <ArrowDownIcon className="h-4 w-4" />;
      default:
        return <MinusIcon className="h-4 w-4" />;
    }
  };

  // Render delta
  const renderDelta = () => {
    if (!delta) return null;

    return (
      <div className={cn('flex items-center font-medium', deltaColor)}>
        {renderDeltaIcon()}
        <span className="ml-1">{formattedDelta}</span>
        {delta.period && <span className="ml-1 text-xs text-muted-foreground">{delta.period}</span>}
      </div>
    );
  };

  // Render icon
  const renderIcon = () => {
    if (!icon) return null;

    return (
      <div
        className={cn(
          'text-muted-foreground',
          iconPosition === 'left' && 'mr-2',
          iconPosition === 'right' && 'ml-2',
          iconPosition === 'top' && 'mb-2'
        )}
      >
        {icon}
      </div>
    );
  };

  // Different layouts based on variant
  switch (variant) {
    case 'stacked':
      return (
        <div className={cn(metricVariants({ variant, size }), className)} {...props}>
          {iconPosition === 'top' && renderIcon()}
          <div className="flex items-center">
            {iconPosition === 'left' && renderIcon()}
            <div>
              <div className="text-sm font-medium text-muted-foreground flex items-center">
                {label}
                {showTooltip && tooltip && (<>

                  <HelpCircleIcon className="ml-1 h-3 w-3 inline cursor-help" title={tooltip} />
                )}
              </div>
              <div
</> className="flex items-baseline mt-1 space-x-2">
                <div className="font-semibold">{formattedValue}</div>
                {renderDelta()}
              </div>
              {description && (
                <div className="text-xs text-muted-foreground mt-1">{description}</div>
              )}
            </div>
            {iconPosition === 'right' && renderIcon()}
          </div>
        </div>
      );

    case 'centered':
      return (
        <div className={cn(metricVariants({ variant, size }), className)} {...props}>
          {iconPosition === 'top' && renderIcon()}
          <div className="text-sm font-medium text-muted-foreground flex items-center justify-center">
            {label}
            {showTooltip && tooltip && (<>

              <HelpCircleIcon className="ml-1 h-3 w-3 inline cursor-help" title={tooltip} />
            )}
          </div>
          <div
</> className="flex items-center justify-center">
            {iconPosition === 'left' && renderIcon()}
            <div className="font-semibold">{formattedValue}</div>
            {iconPosition === 'right' && renderIcon()}
          </div>
          {renderDelta()}
          {description && <div className="text-xs text-muted-foreground">{description}</div>}
        </div>
      );

    case 'split':
      return (
        <div className={cn(metricVariants({ variant, size }), className)} {...props}>
          <div>
            <div className="text-sm font-medium text-muted-foreground flex items-center">
              {label}
              {showTooltip && tooltip && (<>

                <HelpCircleIcon className="ml-1 h-3 w-3 inline cursor-help" title={tooltip} />
              )}
            </div>
            <div
</> className="font-semibold">{formattedValue}</div>
            {description && <div className="text-xs text-muted-foreground mt-1">{description}</div>}
          </div>
          <div className="flex flex-col items-end">
            {renderDelta()}
            {icon && <div className="mt-1 text-muted-foreground">{icon}</div>}
          </div>
        </div>
      );

    default: // 'default' layout
      return (
        <div className={cn(metricVariants({ variant, size }), className)} {...props}>
          <div className="flex items-center">
            {iconPosition === 'left' && renderIcon()}
            <div>
              <div className="text-sm font-medium text-muted-foreground flex items-center">
                {label}
                {showTooltip && tooltip && (<>

                  <HelpCircleIcon className="ml-1 h-3 w-3 inline cursor-help" title={tooltip} />
                )}
              </div>
              <div
</> className="font-semibold">{formattedValue}</div>
            </div>
            {iconPosition === 'right' && renderIcon()}
          </div>
          <div className="flex flex-col">
            {renderDelta()}
            {description && <div className="text-xs text-muted-foreground">{description}</div>}
          </div>
        </div>
      );
  }
};

export default Metric;
