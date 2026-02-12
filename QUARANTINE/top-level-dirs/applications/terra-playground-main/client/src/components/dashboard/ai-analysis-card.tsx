import React from 'react';
import { DashboardChartCard, AIDashboardChartCard } from './dashboard-chart-card';
import { cn } from '@/lib/utils';
import TFButton from '@/components/ui/terrafusion/tf-button';
import { Badge } from '@/components/ui/badge';

/**
 * AI Analysis Card Props
 */
export interface AIAnalysisCardProps {
  /** Card title */
  title: string;
  /** Analysis content */
  children: React.ReactNode;
  /** AI model used for analysis */
  model?: string;
  /** Confidence level (0-100) */
  confidence?: number;
  /** Last updated timestamp */
  lastUpdated?: string | Date;
  /** Whether the analysis is currently being updated */
  isUpdating?: boolean;
  /** Optional click handler for refresh */
  onRefresh?: () => void;
  /** Optional click handler for details */
  onDetails?: () => void;
  /** Optional className for additional styling */
  className?: string;
  /** Tags for the analysis */
  tags?: string[];
}

/**
 * AI Analysis Card Component
 *
 * A specialized card for displaying AI-generated insights
 */
export const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({
  title,
  children,
  model = 'PropertyInsightLLM',
  confidence,
  lastUpdated,
  isUpdating = false,
  onRefresh,
  onDetails,
  className,
  tags = [],
}) => {
  // Format date
  const formattedDate = React.useMemo(() => {
    if (!lastUpdated) return '';

    const date = typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated;

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  }, [lastUpdated]);

  // Get confidence badge color
  const getConfidenceBadgeColor = () => {
    if (!confidence && confidence !== 0) return 'bg-gray-100 text-gray-500';

    if (confidence >= 90) return 'bg-emerald-100 text-emerald-700';
    if (confidence >= 70) return 'bg-green-100 text-green-700';
    if (confidence >= 50) return 'bg-amber-100 text-amber-700';
    return 'bg-rose-100 text-rose-700';
  };

  return (
    <AIDashboardChartCard
      title={title}
      headerActions={
        <div className="flex items-center space-x-2">
          {confidence !== undefined && (
            <Badge
              variant="outline"
              className={cn('px-2 py-0.5 text-xs font-medium', getConfidenceBadgeColor())}
            >
              {confidence}% confidence
            </Badge>
          )}
          {onRefresh && (
            <TFButton
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              loading={isUpdating}
              className="h-8 w-8 p-0 rounded-full"
              aria-label="Refresh analysis"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
            </TFButton>
          )}
        </div>
      }
      className={className}
    >
      <div className="flex min-h-[150px] flex-col">
<>
        <div className="flex-1">{children}</div>

        <div
</> className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-800/30 pt-3 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-teal-950/30 px-2 py-0.5 text-xs font-medium text-teal-400">
              {model}
            </span>

            {tags.map((tag /* , index */) => (
              <span
                key={index}
                className="inline-flex items-center rounded-full bg-gray-800/30 px-2 py-0.5 text-xs font-medium text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {formattedDate && <span className="text-gray-500">Updated: {formattedDate}</span>}

            {onDetails && (
              <TFButton
                variant="link"
                size="xs"
                onClick={onDetails}
                className="h-auto p-0 text-xs font-normal text-teal-400"
              >
                View Details
              </TFButton>
            )}
          </div>
        </div>
      </div>
    </AIDashboardChartCard>
  );
};

export default AIAnalysisCard;
