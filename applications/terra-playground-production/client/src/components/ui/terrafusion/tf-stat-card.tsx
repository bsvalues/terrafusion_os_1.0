import React from 'react';
import { cn } from '@/lib/utils';
import TFCard from './tf-card';
import { ArrowUpIcon, ArrowDownIcon  } from '@mui/icons-material';

/**
 * Terrafusion Stat Card Props
 */
export interface TFStatCardProps {
  /** Card title */
  title: string;
  /** Stat value to display */
  value: number;
  /** Optional description */
  description?: string;
  /** Optional icon to display */
  icon?: React.ReactNode;
  /** Trend direction: 'up', 'down', or 'neutral' */
  trend?: 'up' | 'down' | 'neutral';
  /** Percentage change value */
  change?: number;
  /** Card variant for styling */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  /** Value format: 'number', 'currency', 'percentage' */
  format?: 'number' | 'currency' | 'percentage';
  /** Optional className for additional styling */
  className?: string;
  /** Optional click handler */
  onClick?: () => void;
}

/**
 * Terrafusion Stat Card Component
 *
 * A card that displays a key metric with trend indicator
 */
const TFStatCard: React.FC<TFStatCardProps> = ({
  title,
  value,
  description,
  icon,
  trend = 'neutral',
  change,
  variant = 'primary',
  format = 'number',
  className,
  onClick,
}) => {
  // Format the value based on format type
  const formattedValue = React.useMemo(() => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('en-US').format(value);
    }
  }, [value, format]);

  // Format the change percentage
  const formattedChange = React.useMemo(() => {
    if (change === undefined) return null;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  }, [change]);

  // Get the color classes based on variant
  const getColorClasses = () => {
    switch (variant) {
      case 'primary':
        return 'from-teal-900/20 to-teal-800/10 border-teal-500/30';
      case 'secondary':
        return 'from-slate-900/30 to-slate-800/20 border-slate-500/30';
      case 'success':
        return 'from-emerald-900/20 to-emerald-800/10 border-emerald-500/30';
      case 'warning':
        return 'from-amber-900/20 to-amber-800/10 border-amber-500/30';
      case 'danger':
        return 'from-rose-900/20 to-rose-800/10 border-rose-500/30';
      case 'info':
        return 'from-sky-900/20 to-sky-800/10 border-sky-500/30';
      default:
        return 'from-teal-900/20 to-teal-800/10 border-teal-500/30';
    }
  };

  // Get trend indicator color
  const getTrendColor = () => {
    if (trend === 'up') return 'text-emerald-500';
    if (trend === 'down') return 'text-rose-500';
    return 'text-slate-500';
  };

  return (
    <TFCard
      className={cn(
        'bg-gradient-to-br border-l-4',
        getColorClasses(),
        'hover:shadow-lg transition-all duration-200',
        className
      )}
      loading={false}
      shadow={true}
      size="auto"
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1"><>

            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3
</> className="text-2xl font-bold tracking-tight">{formattedValue}</h3>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>

          {icon && (
            <div
              className={cn(
                'rounded-full p-2',
                variant === 'primary' ? 'bg-teal-500/10 text-teal-500' : '',
                variant === 'secondary' ? 'bg-slate-500/10 text-slate-500' : '',
                variant === 'success' ? 'bg-emerald-500/10 text-emerald-500' : '',
                variant === 'warning' ? 'bg-amber-500/10 text-amber-500' : '',
                variant === 'danger' ? 'bg-rose-500/10 text-rose-500' : '',
                variant === 'info' ? 'bg-sky-500/10 text-sky-500' : ''
              )}
            >
              {icon}
            </div>
          )}
        </div>

        {trend !== 'neutral' && formattedChange && (
          <div className={cn('mt-3 flex items-center space-x-1 text-xs', getTrendColor())}>
            {trend === 'up' ? (
              <ArrowUpIcon className="h-3 w-3" />
            ) : (
              <ArrowDownIcon className="h-3 w-3" />
            )}<>

            <span>{formattedChange}</span>
            <span
</> className="text-muted-foreground">from last period</span>
          </div>
        )}
      </div>
    </TFCard>
  );
};

export { TFStatCard };
export default TFStatCard;
