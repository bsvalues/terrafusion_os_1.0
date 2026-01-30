/**
 * ═══════════════════════════════════════════════════════════════
 * COSTFORGE AI - ADVANCED COMPONENT LIBRARY
 * Specialized UI Components for Construction Cost Intelligence
 * THE TERRAFUSION WAY - GOVERNMENT-GRADE EXCELLENCE
 * ═══════════════════════════════════════════════════════════════
 */

import React from 'react';
import { colors as tfColors } from '../design-system/tokens/colors';
import { cn } from '../utils/cn';
import './terraforge-styles.css';

// CostForge AI Specialized Components

/**
 * Interactive Cost Slider with Terra-Cyan Theming
 */
interface CostSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  className?: string;
}

export const TerraForgeSlider: React.FC<CostSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  className,
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('space-y-3', className)}>
      <div className='flex items-center justify-between'>
        <label className='text-sm font-medium text-slate-300'>{label}</label>
        <span className='text-sm text-cyan-400 font-mono'>
          {value.toLocaleString()}
          {unit}
        </span>
      </div>
      <div className='relative'>
        <input
          type='range'
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className='w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer terra-slider'
          title={`${label} slider`}
          aria-label={`Adjust ${label}`}
        />
        <div className='absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50 pointer-events-none terra-slider-thumb' />
      </div>
    </div>
  );
};

/**
 * Cost Breakdown Chart Component
 */
interface CostBreakdownProps {
  data: Record<string, number>;
  total: number;
  className?: string;
}

export const TerraForgeBreakdown: React.FC<CostBreakdownProps> = ({ data, total, className }) => {
  const chartColors = tfColors.visualization.chart;

  const entries = Object.entries(data).map(([key, value], index) => ({
    key,
    value,
    percentage: (value / total) * 100,
    color: chartColors[index % chartColors.length],
  }));

  return (
    <div className={cn('space-y-4', className)}>
      <div className='grid grid-cols-2 gap-3'>
        {entries.map(({ key, value, percentage, color }) => (
          <div key={key} className='flex items-center space-x-3'>
            <div className='w-3 h-3 rounded-full terra-breakdown-dot' data-color={color} />
            <div className='flex-1 min-w-0'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-slate-300 truncate capitalize'>
                  {key.replace('_', ' ')}
                </span>
                <span className='text-sm text-white font-medium'>{percentage.toFixed(1)}%</span>
              </div>
              <div className='text-xs text-slate-400'>${value.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * AI Confidence Meter
 */
interface ConfidenceMeterProps {
  confidence: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TerraForgeConfidenceMeter: React.FC<ConfidenceMeterProps> = ({
  confidence,
  label = 'AI Confidence',
  size = 'md',
  className,
}) => {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 90) return 'text-green-400 bg-green-500/20';
    if (conf >= 80) return 'text-cyan-400 bg-cyan-500/20';
    if (conf >= 70) return 'text-amber-400 bg-amber-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3',
  };

  return (
    <div className={cn('flex items-center space-x-3', className)}>
      <span className='text-slate-400 text-sm'>{label}:</span>
      <div
        className={cn(
          'rounded-full font-medium border border-current/20',
          getConfidenceColor(confidence),
          sizeClasses[size]
        )}
      >
        {confidence.toFixed(1)}%
      </div>
    </div>
  );
};

/**
 * Cost Comparison Card
 */
interface ComparisonCardProps {
  title: string;
  current: number;
  previous?: number;
  target?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

export const TerraForgeComparisonCard: React.FC<ComparisonCardProps> = ({
  title,
  current,
  previous,
  target,
  unit = '$',
  trend,
  className,
}) => {
  const formatValue = (value: number) => {
    return unit === '$' ? `$${value.toLocaleString()}` : `${value.toLocaleString()}${unit}`;
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      case 'stable':
        return '→';
      default:
        return '';
    }
  };

  const change = previous ? ((current - previous) / previous) * 100 : 0;

  return (
    <div className={cn('terra-glass p-4 rounded-lg', className)}>
      <div className='flex items-center justify-between mb-3'>
        <h3 className='text-sm font-medium text-slate-300'>{title}</h3>
        {trend && <span className='text-lg'>{getTrendIcon()}</span>}
      </div>

      <div className='space-y-2'>
        <div className='text-2xl font-bold text-white'>{formatValue(current)}</div>

        {previous && (
          <div className='flex items-center space-x-2 text-xs'>
            <span className='text-slate-400'>vs previous:</span>
            <span
              className={cn(
                'font-medium',
                change > 0 ? 'text-red-400' : change < 0 ? 'text-green-400' : 'text-slate-400'
              )}
            >
              {change > 0 ? '+' : ''}
              {change.toFixed(1)}%
            </span>
          </div>
        )}

        {target && (
          <div className='flex items-center space-x-2 text-xs'>
            <span className='text-slate-400'>target:</span>
            <span className='text-cyan-400'>{formatValue(target)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Progress Ring Component
 */
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

export const TerraForgeProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  className,
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className='transform -rotate-90'>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke='rgba(51, 65, 85, 0.3)'
          strokeWidth={strokeWidth}
          fill='none'
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke='url(#terraGradient)'
          strokeWidth={strokeWidth}
          fill='none'
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap='round'
          className='transition-all duration-1000 ease-out'
        />
        <defs>
          <linearGradient id='terraGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
            <stop offset='0%' stopColor={tfColors.brand.transcend[500]} />
            <stop offset='100%' stopColor={tfColors.brand.primary[500]} />
          </linearGradient>
        </defs>
      </svg>
      <div className='absolute inset-0 flex items-center justify-center'>{children}</div>
    </div>
  );
};

/**
 * Market Indicator Widget
 */
interface MarketIndicatorProps {
  title: string;
  value: number;
  change: number;
  timeframe: string;
  type: 'currency' | 'percentage' | 'index';
  className?: string;
}

export const TerraForgeMarketIndicator: React.FC<MarketIndicatorProps> = ({
  title,
  value,
  change,
  timeframe,
  type,
  className,
}) => {
  const formatValue = (val: number) => {
    switch (type) {
      case 'currency':
        return `$${val.toLocaleString()}`;
      case 'percentage':
        return `${val.toFixed(2)}%`;
      case 'index':
        return val.toFixed(1);
      default:
        return val.toString();
    }
  };

  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className={cn('terra-glass p-4 rounded-lg', className)}>
      <div className='flex items-center justify-between mb-2'>
        <h3 className='text-sm font-medium text-slate-300'>{title}</h3>
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            isPositive ? 'bg-green-400' : isNegative ? 'bg-red-400' : 'bg-yellow-400'
          )}
        />
      </div>

      <div className='flex items-end justify-between'>
        <div>
          <div className='text-xl font-bold text-white'>{formatValue(value)}</div>
          <div className='text-xs text-slate-400'>{timeframe}</div>
        </div>

        <div
          className={cn(
            'text-sm font-medium flex items-center',
            isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-slate-400'
          )}
        >
          <span className='mr-1'>{isPositive ? '↗' : isNegative ? '↘' : '→'}</span>
          {change > 0 ? '+' : ''}
          {change.toFixed(2)}%
        </div>
      </div>
    </div>
  );
};

/**
 * Cost Factor Weight Adjuster
 */
interface WeightAdjusterProps {
  factors: Array<{
    id: string;
    name: string;
    weight: number;
    category: string;
  }>;
  onWeightChange: (id: string, weight: number) => void;
  className?: string;
}

export const TerraForgeWeightAdjuster: React.FC<WeightAdjusterProps> = ({
  factors,
  onWeightChange,
  className,
}) => {
  const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);

  return (
    <div className={cn('space-y-4', className)}>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold text-white'>Cost Factor Weights</h3>
        <span className='text-sm text-slate-400'>Total: {(totalWeight * 100).toFixed(0)}%</span>
      </div>

      {factors.map((factor) => (
        <div key={factor.id} className='space-y-2'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-slate-300'>{factor.name}</span>
            <span className='text-sm text-cyan-400 font-mono'>
              {(factor.weight * 100).toFixed(0)}%
            </span>
          </div>

          <TerraForgeSlider
            label=''
            value={factor.weight * 100}
            min={0}
            max={100}
            step={5}
            unit='%'
            onChange={(value) => onWeightChange(factor.id, value / 100)}
          />

          <div className='text-xs text-slate-400 mb-4'>Category: {factor.category}</div>
        </div>
      ))}
    </div>
  );
};
