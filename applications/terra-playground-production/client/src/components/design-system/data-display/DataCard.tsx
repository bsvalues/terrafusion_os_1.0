import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ChevronRight, ExternalLink, MoreVertical  } from '@mui/icons-material';

/**
 * DataCard variants using class-variance-authority
 */
const dataCardVariants = cva('rounded-lg overflow-hidden transition-shadow', {
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
      sm: 'min-h-[200px]',
      md: 'min-h-[300px]',
      lg: 'min-h-[400px]',
      xl: 'min-h-[500px]',
      auto: 'min-h-0',
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

export interface DataCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dataCardVariants> {
  /**
   * Title of the card
   */
  title?: string;
  /**
   * Subtitle or description
   */
  description?: string;
  /**
   * Main content/chart
   */
  chart?: React.ReactNode;
  /**
   * Footer content
   */
  footer?: React.ReactNode;
  /**
   * Action buttons for the card
   */
  actions?: React.ReactNode;
  /**
   * Link URL if the card is clickable
   */
  linkUrl?: string;
  /**
   * Loading state indicator
   */
  isLoading?: boolean;
  /**
   * Error message if data failed to load
   */
  error?: string;
  /**
   * Whether to show a menu button
   */
  showMenu?: boolean;
  /**
   * Menu content
   */
  menu?: React.ReactNode;
  /**
   * If true, the height is fixed to the component size
   */
  fixedHeight?: boolean;
  /**
   * Padding for the card content
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * A component for displaying data visualizations with metadata.
 *
 * @example
 * ```tsx
 * <DataCard
 *   title="Revenue by Region"
 *   description="Monthly revenue breakdown by geographical region"
 *   chart={<BarChart data={revenueData} />}
 *   actions={<Button>Export</Button>}
 *   variant="glass"
 * />
 * ```
 */
export const DataCard: React.FC<DataCardProps> = ({
  className,
  variant,
  size,
  elevation,
  title,
  description,
  chart,
  footer,
  actions,
  linkUrl,
  isLoading,
  error,
  showMenu,
  menu,
  fixedHeight = true,
  padding = 'md',
  children,
  ...props
}) => {
  // Map padding values to actual classes
  const paddingMap = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  // Generate the content area class based on whether we have a chart or children
  const contentAreaClass = cn(
    'relative',
    !fixedHeight && 'h-auto',
    fixedHeight && size !== 'auto' && 'h-full',
    paddingMap[padding]
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className={contentAreaClass}>
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center"><>

              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <span
</> className="mt-2 text-sm text-muted-foreground">Loading data...</span>
            </div>
          </div>
          {chart || children}
        </div>
      );
    }

    if (error) {
      return (
        <div className={cn(contentAreaClass, 'flex flex-col items-center justify-center')}>
          <div className="rounded-full bg-destructive/10 p-3 text-destructive">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div><>

          <h3 className="mt-4 text-lg font-medium">Error Loading Data</h3>
          <p
</> className="mt-2 text-sm text-muted-foreground text-center max-w-xs">{error}</p>
        </div>
      );
    }

    return <div className={contentAreaClass}>{chart || children}</div>;
  };

  const CardContainer = linkUrl ? 'a' : 'div';
  const cardProps = linkUrl ? { href: linkUrl, target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <CardContainer
      className={cn(
        dataCardVariants({ variant, size, elevation }),
        linkUrl && 'cursor-pointer hover:shadow-md transition-shadow',
        fixedHeight && size !== 'auto' && 'flex flex-col',
        className
      )}
      {...cardProps}
      {...props}
    >
      {/* Header section */}
      {(title || description || actions || showMenu) && (
        <div
          className={cn(
            'flex items-start justify-between border-b border-border/30',
            paddingMap[padding]
          )}
        >
          {/* Title and description */}
          <div>
            {title && (
              <h3 className="text-lg font-medium tracking-tight">
                {title}
                {linkUrl && <ExternalLink className="ml-2 inline h-4 w-4" />}
              </h3>
            )}
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>

          {/* Actions and menu */}
          <div className="flex items-center gap-2 ml-4">
            {actions}
            {showMenu && (
              <button
                className="p-1 rounded-full hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/25"
                aria-label="Menu"
              >
                <MoreVertical className="h-4 w-4" />
                {menu}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main content area */}
      {renderContent()}

      {/* Footer */}
      {footer && (
        <div className={cn('mt-auto border-t border-border/30', paddingMap[padding])}>{footer}</div>
      )}

      {/* Link indicator */}
      {linkUrl && (
        <div className="absolute bottom-3 right-3 flex items-center text-xs text-muted-foreground"><>

          <span>View details</span>
          <ChevronRight
</> className="ml-1 h-3 w-3" />
        </div>
      )}
    </CardContainer>
  );
};

export default DataCard;
