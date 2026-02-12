import React from 'react';
import { cn } from '@/lib/utils';
import TFCard from '@/components/ui/terrafusion/tf-card';

/**
 * Dashboard Chart Card Props
 */
export interface DashboardChartCardProps {
  /** Card title */
  title: string;
  /** Card description */
  description?: string;
  /** Card children */
  children: React.ReactNode;
  /** Optional header actions (buttons, etc.) */
  headerActions?: React.ReactNode;
  /** Card variant */
  variant?: 'default' | 'glass' | 'gradient' | 'elevation';
  /** Optional className for additional styling */
  className?: string;
  /** Optional onClick handler */
  onClick?: () => void;
}

/**
 * Dashboard Chart Card Component
 *
 * A specialized card for displaying charts and visualizations
 */
export const DashboardChartCard = ({
  title,
  description,
  children,
  headerActions,
  variant = 'default',
  className,
  onClick,
}: DashboardChartCardProps) => {
  // Set the card background based on variant
  const getCardBackground = () => {
    switch (variant) {
      case 'glass':
        return 'bg-black/40 backdrop-blur-md border border-white/10';
      case 'gradient':
        return 'bg-gradient-to-br from-teal-900/60 to-slate-900/80 border border-teal-900/50';
      case 'elevation':
        return 'bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-slate-700/50';
      default:
        return 'bg-card border border-slate-700/30';
    }
  };

  return (
    <TFCard className={cn('overflow-hidden', getCardBackground(), className)} onClick={onClick}>
      <div className="flex flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-slate-700/30 p-4">
          <div>
            <h3 className="font-medium text-card-foreground">{title}</h3>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
        <div className="p-1">{children}</div>
      </div>
    </TFCard>
  );
};

/**
 * AI Dashboard Chart Card Component
 *
 * A specialized card for AI-related visualizations with a slightly different styling
 */
export const AIDashboardChartCard = (props: DashboardChartCardProps) => {
  return (
    <DashboardChartCard
      {...props}
      variant="gradient"
      className={cn(
        'border-t-2 border-t-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.2)]',
        props.className
      )}
    />
  );
};

/**
 * AI Analysis Card - For Direct Export
 */
export const AIAnalysisCard = ({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <DashboardChartCard
      title={title}
      variant="gradient"
      className={cn(
        'border-t-2 border-t-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.2)]',
        className
      )}
    >
      <div className="p-4">{children}</div>
    </DashboardChartCard>
  );
};

export default DashboardChartCard;
