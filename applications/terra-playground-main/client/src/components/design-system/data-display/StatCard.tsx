import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ArrowUpIcon, ArrowDownIcon  } from '@mui/icons-material';

/**
 * StatCard variants using class-variance-authority
 */
const statCardVariants = cva('p-6 rounded-lg overflow-hidden transition-shadow', {
  variants: {
    variant: {
      default: 'bg-card text-card-foreground shadow-sm',
      glass: 'tf-card-glass',
      outline: 'border border-border bg-transparent',
      primary: 'bg-primary/10 text-foreground',
      filled: 'bg-primary text-primary-foreground',
      gradient: 'bg-gradient-to-br from-primary/20 to-primary/5 text-foreground',
    },
    size: {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
    elevation: {
      flat: 'shadow-none',
      low: 'shadow-sm',
      medium: 'shadow-md',
      high: 'shadow-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
    elevation: 'medium',
  },
});

// Types for the trend data
export interface TrendData {
  /**
   * The value of the trend (percentage or absolute value)
   */
  value: number;
  /**
   * The direction of the trend
   */
  direction: 'up' | 'down' | 'neutral';
  /**
   * Whether the trend is positive in context (e.g., costs going down is positive)
   */
  isPositive?: boolean;
  /**
   * The time period for the trend
   */
  period?: string;
}

export interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCardVariants> {
  /**
   * Title or label for the stat
   */
  label: string;
  /**
   * Value of the stat (can be string or number)
   */
  value: string | number;
  /**
   * Previous value for comparison (optional)
   */
  previousValue?: string | number;
  /**
   * Description or subtitle text
   */
  description?: string;
  /**
   * Icon to display
   */
  icon?: React.ReactNode;
  /**
   * Trend data for showing direction and change
   */
  trend?: TrendData;
  /**
   * Format the value (e.g., adding currency symbol, percentage, etc.)
   */
  valueFormat?: (value: string | number) => string;
  /**
   * Background color or gradient
   */
  bgColor?: string;
  /**
   * Amount of horizontal padding
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * A component that displays a statistic with optional trend indicator.
 *
 * @example
 * ```tsx
 * <StatCard
 *   label="Monthly Revenue"
 *   value={125000}
 *   valueFormat={(v) => `$${Number(v).toLocaleString()}`}
 *   trend={{ value: 12.5, direction: 'up' }}
 *   description="Compared to last month"
 *   icon={<DollarSign />}
 *   variant="glass"
 * />
 * ```
 */
export const StatCard: React.FC<StatCardProps> = ({
  className,
  variant,
  size,
  elevation,
  label,
  value,
  previousValue,
  description,
  icon,
  trend,
  valueFormat,
  bgColor,
  padding = 'md',
  ...props
}) => {
  // Format the value if a formatter function is provided
  const formattedValue = valueFormat ? valueFormat(value) : value;

  // Determine if trend is positive (for colors)
  const isTrendPositive = trend
    ? trend.isPositive !== undefined
      ? trend.isPositive
      : trend.direction === 'up'
    : false;

  // Determine trend text color
  let trendColorClass = 'text-muted-foreground';
  if (trend) {
    if (isTrendPositive) {
      trendColorClass = 'text-emerald-500';
    } else if (trend.direction === 'down') {
      trendColorClass = 'text-rose-500';
    }
  }

  const paddingMap = {
    none: 'px-0',
    sm: 'px-4',
    md: 'px-6',
    lg: 'px-8',
  };

  return (
    <div
      className={cn(
        statCardVariants({ variant, size, elevation }),
        bgColor && 'bg-none',
        className
      )}
      style={bgColor ? { background: bgColor } : undefined}
      {...props}
    >
      <div className={cn('flex flex-col', paddingMap[padding])}>
        {/* Header with label and icon */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
          {icon && <div className="rounded-full bg-primary/10 p-2 text-primary">{icon}</div>}
        </div>

        {/* Value and trend */}
        <div className="flex items-end justify-between mt-1">
          <div>
            <div className="text-2xl font-bold">{formattedValue}</div>

            {/* Description or period */}
            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
          </div>

          {/* Trend indicator */}
          {trend && (
            <div className={cn('flex items-center text-sm font-medium', trendColorClass)}>
              {trend.direction === 'up' && <ArrowUpIcon className="mr-1 h-4 w-4" />}
              {trend.direction === 'down' && <ArrowDownIcon className="mr-1 h-4 w-4" />}
              {trend.value !== 0 && (
                <span>
                  {trend.value > 0 ? '+' : ''}
                  {trend.value}%
                </span>
              )}
              {trend.period && (
                <span className="ml-1 text-xs text-muted-foreground">{trend.period}</span>
              )}
            </div>
          )}
        </div>

        {/* Previous value comparison */}
        {previousValue !== undefined && (
          <div className="mt-2 text-xs text-muted-foreground">
            Previous: {valueFormat ? valueFormat(previousValue) : previousValue}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
