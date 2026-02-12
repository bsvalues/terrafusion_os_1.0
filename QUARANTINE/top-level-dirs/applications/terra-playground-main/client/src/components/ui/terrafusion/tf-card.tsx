import React, { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Terrafusion Card Types
 */
export type TFCardLevel = 'primary' | 'secondary' | 'tertiary' | 'glass';
export type TFCardSize = 'sm' | 'md' | 'lg' | 'xl' | 'auto';

/**
 * Terrafusion Card Props Interface
 */
export interface TFCardProps {
  /** Card title to display in the header */
  title?: string;
  /** Card description to display under the title */
  description?: string;
  /** Card content */
  children: ReactNode;
  /** Card footer content */
  footer?: ReactNode;
  /** Card header actions (buttons, icons, etc.) */
  headerActions?: ReactNode;
  /** Card visual importance level */
  level?: TFCardLevel;
  /** Card size preset */
  size?: TFCardSize;
  /** Optional className for additional styling */
  className?: string;
  /** Optional content className for additional styling */
  contentClassName?: string;
  /** Optional header className for additional styling */
  headerClassName?: string;
  /** Optional footer className for additional styling */
  footerClassName?: string;
  /** Optional ID for the card */
  id?: string;
  /** Gradient background for card */
  gradient?: boolean;
  /** Border Highlight */
  highlight?: boolean;
  /** Hover effect */
  hoverable?: boolean;
  /** Is the card in a loading state */
  loading?: boolean;
  /** Should the card have a shadow */
  shadow?: boolean;
  /** Optional click handler */
  onClick?: () => void;
  /** Card data attributes */
  'data-testid'?: string;
}

/**
 * Terrafusion Card Component
 *
 * A styled card component for the Terrafusion UI design system
 */
export const TFCard: React.FC<TFCardProps> = ({
  title,
  description,
  children,
  footer,
  headerActions,
  level = 'primary',
  size = 'md',
  className = '',
  contentClassName = '',
  headerClassName = '',
  footerClassName = '',
  id,
  gradient = false,
  highlight = false,
  hoverable = false,
  loading = false,
  shadow = true,
  onClick,
  'data-testid': testId,
}) => {
  // Size-based classes
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    auto: 'w-full',
  };

  // Level-based classes
  const levelClasses = {
    primary: 'bg-card text-card-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    tertiary: 'bg-muted text-muted-foreground',
    glass: 'bg-opacity-70 backdrop-blur-md bg-background border-opacity-30 shadow-lg',
  };

  // State-based classes
  const stateClasses = [
    gradient ? 'bg-gradient-to-br from-primary/10 to-primary/5' : '',
    highlight ? 'border-primary/50' : '',
    hoverable ? 'transition-all duration-200 hover:shadow-md hover:-translate-y-1' : '',
    shadow ? 'shadow-lg' : 'shadow-none',
  ].join(' ');

  return (
    <Card
      className={cn(
        levelClasses[level],
        sizeClasses[size],
        stateClasses,
        loading ? 'animate-pulse' : '',
        onClick ? 'cursor-pointer hover:opacity-95' : '',
        className
      )}
      id={id}
      data-testid={testId}
      onClick={onClick}
    >
      {(title || description || headerActions) && (
        <CardHeader className={cn('flex flex-row items-start justify-between', headerClassName)}>
          <div>
            {title && <CardTitle className="text-xl font-semibold">{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {headerActions && <div className="flex items-center space-x-2">{headerActions}</div>}
        </CardHeader>
      )}

      <CardContent className={cn('', contentClassName)}>{children}</CardContent>

      {footer && (
        <CardFooter className={cn('flex items-center justify-between', footerClassName)}>
          {footer}
        </CardFooter>
      )}
    </Card>
  );
};

export default TFCard;
