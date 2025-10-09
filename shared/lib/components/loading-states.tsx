/**
 * TerraFusion OS - Loading States & Skeletons
 * 
 * Production-ready loading indicators with:
 * - Skeleton loaders with pulse/shimmer animations
 * - Specialized skeletons for tables, cards, lists
 * - Classic spinners and progress bars
 * - Loading overlays with backdrop
 * - Accessibility (aria-busy, aria-live)
 * - Dark mode support
 * - Zero dependencies
 * 
 * @module loading-states
 */

import React, { CSSProperties } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Animation style for skeletons
 */
export type SkeletonAnimation = 'pulse' | 'shimmer' | 'wave' | 'none';

/**
 * Skeleton variant for common shapes
 */
export type SkeletonVariant = 'text' | 'circle' | 'rect' | 'rounded';

/**
 * Spinner size
 */
export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Progress bar variant
 */
export type ProgressVariant = 'determinate' | 'indeterminate';

/**
 * Skeleton component props
 */
export interface SkeletonProps {
  /** Width (CSS value) */
  width?: string | number;
  /** Height (CSS value) */
  height?: string | number;
  /** Variant shape */
  variant?: SkeletonVariant;
  /** Animation style */
  animation?: SkeletonAnimation;
  /** Animation speed in ms */
  animationSpeed?: number;
  /** Custom className */
  className?: string;
  /** Custom inline styles */
  style?: CSSProperties;
  /** Enable dark mode */
  darkMode?: boolean;
}

/**
 * Skeleton table props
 */
export interface SkeletonTableProps {
  /** Number of rows */
  rows?: number;
  /** Number of columns */
  columns?: number;
  /** Show header row */
  showHeader?: boolean;
  /** Animation style */
  animation?: SkeletonAnimation;
  /** Custom className */
  className?: string;
  /** Enable dark mode */
  darkMode?: boolean;
}

/**
 * Skeleton card props
 */
export interface SkeletonCardProps {
  /** Number of cards */
  count?: number;
  /** Show image placeholder */
  showImage?: boolean;
  /** Number of text lines */
  lines?: number;
  /** Animation style */
  animation?: SkeletonAnimation;
  /** Custom className */
  className?: string;
  /** Enable dark mode */
  darkMode?: boolean;
}

/**
 * Skeleton list props
 */
export interface SkeletonListProps {
  /** Number of items */
  items?: number;
  /** Show avatar */
  showAvatar?: boolean;
  /** Number of text lines per item */
  lines?: number;
  /** Animation style */
  animation?: SkeletonAnimation;
  /** Custom className */
  className?: string;
  /** Enable dark mode */
  darkMode?: boolean;
}

/**
 * Spinner props
 */
export interface SpinnerProps {
  /** Spinner size */
  size?: SpinnerSize;
  /** Color (CSS color) */
  color?: string;
  /** Custom className */
  className?: string;
  /** Accessible label */
  label?: string;
}

/**
 * Progress bar props
 */
export interface ProgressBarProps {
  /** Progress value (0-100) */
  value?: number;
  /** Variant */
  variant?: ProgressVariant;
  /** Color (CSS color) */
  color?: string;
  /** Height (CSS value) */
  height?: string | number;
  /** Show percentage text */
  showPercentage?: boolean;
  /** Custom className */
  className?: string;
  /** Enable dark mode */
  darkMode?: boolean;
}

/**
 * Loading overlay props
 */
export interface LoadingOverlayProps {
  /** Show overlay */
  visible: boolean;
  /** Loading message */
  message?: string;
  /** Spinner size */
  spinnerSize?: SpinnerSize;
  /** Blur backdrop */
  blur?: boolean;
  /** Custom className */
  className?: string;
}

// ============================================================================
// Skeleton Component
// ============================================================================

/**
 * Generic skeleton loader with customizable shape and animation
 * 
 * @example
 * ```tsx
 * <Skeleton width="100%" height="20px" />
 * <Skeleton width="60px" height="60px" variant="circle" />
 * <Skeleton variant="text" />
 * ```
 */
export function Skeleton({
  width = '100%',
  height = '1rem',
  variant = 'rect',
  animation = 'pulse',
  animationSpeed = 1500,
  className = '',
  style = {},
  darkMode = false,
}: SkeletonProps) {
  const getVariantStyles = (): CSSProperties => {
    switch (variant) {
      case 'text':
        return {
          height: '1rem',
          borderRadius: '4px',
        };
      case 'circle':
        return {
          borderRadius: '50%',
          aspectRatio: '1',
        };
      case 'rounded':
        return {
          borderRadius: '8px',
        };
      case 'rect':
      default:
        return {
          borderRadius: '4px',
        };
    }
  };

  const getAnimationStyles = (): CSSProperties => {
    const baseColor = darkMode ? '#2a2a2a' : '#e5e7eb';
    const highlightColor = darkMode ? '#3a3a3a' : '#f3f4f6';

    switch (animation) {
      case 'pulse':
        return {
          animation: `skeletonPulse ${animationSpeed}ms ease-in-out infinite`,
          background: baseColor,
        };
      case 'shimmer':
        return {
          animation: `skeletonShimmer ${animationSpeed}ms ease-in-out infinite`,
          background: `linear-gradient(90deg, ${baseColor} 0%, ${highlightColor} 50%, ${baseColor} 100%)`,
          backgroundSize: '200% 100%',
        };
      case 'wave':
        return {
          animation: `skeletonWave ${animationSpeed}ms ease-in-out infinite`,
          background: `linear-gradient(90deg, ${baseColor} 25%, ${highlightColor} 50%, ${baseColor} 75%)`,
          backgroundSize: '200% 100%',
        };
      case 'none':
        return {
          background: baseColor,
        };
      default:
        return {
          animation: `skeletonPulse ${animationSpeed}ms ease-in-out infinite`,
          background: baseColor,
        };
    }
  };

  const skeletonStyles: CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...getVariantStyles(),
    ...getAnimationStyles(),
    ...style,
  };

  return (
    <>
      <div
        className={`skeleton ${className}`}
        style={skeletonStyles}
        aria-busy="true"
        aria-live="polite"
      />
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes skeletonWave {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </>
  );
}

// ============================================================================
// Skeleton Table Component
// ============================================================================

/**
 * Skeleton loader for tables
 * 
 * @example
 * ```tsx
 * <SkeletonTable rows={5} columns={4} showHeader />
 * ```
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  showHeader = true,
  animation = 'shimmer',
  className = '',
  darkMode = false,
}: SkeletonTableProps) {
  const renderHeaderRow = () => {
    if (!showHeader) return null;

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '1rem',
          marginBottom: '1rem',
          paddingBottom: '1rem',
          borderBottom: `1px solid ${darkMode ? '#3a3a3a' : '#e5e7eb'}`,
        }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={`header-${colIndex}`}
            height="24px"
            animation={animation}
            darkMode={darkMode}
          />
        ))}
      </div>
    );
  };

  const renderBodyRows = () => {
    return Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={`row-${rowIndex}`}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '1rem',
          marginBottom: '0.75rem',
        }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={`cell-${rowIndex}-${colIndex}`}
            height="20px"
            animation={animation}
            darkMode={darkMode}
          />
        ))}
      </div>
    ));
  };

  return (
    <div
      className={`skeleton-table ${className}`}
      role="status"
      aria-label="Loading table data"
    >
      {renderHeaderRow()}
      {renderBodyRows()}
    </div>
  );
}

// ============================================================================
// Skeleton Card Component
// ============================================================================

/**
 * Skeleton loader for card layouts
 * 
 * @example
 * ```tsx
 * <SkeletonCard count={3} showImage lines={4} />
 * ```
 */
export function SkeletonCard({
  count = 1,
  showImage = true,
  lines = 3,
  animation = 'shimmer',
  className = '',
  darkMode = false,
}: SkeletonCardProps) {
  const renderCard = (index: number) => (
    <div
      key={`card-${index}`}
      style={{
        padding: '1.5rem',
        border: `1px solid ${darkMode ? '#3a3a3a' : '#e5e7eb'}`,
        borderRadius: '8px',
        marginBottom: '1rem',
      }}
    >
      {showImage && (
        <Skeleton
          width="100%"
          height="180px"
          variant="rounded"
          animation={animation}
          darkMode={darkMode}
          style={{ marginBottom: '1rem' }}
        />
      )}

      {/* Title */}
      <Skeleton
        width="70%"
        height="24px"
        animation={animation}
        darkMode={darkMode}
        style={{ marginBottom: '0.75rem' }}
      />

      {/* Text lines */}
      {Array.from({ length: lines }).map((_, lineIndex) => (
        <Skeleton
          key={`line-${lineIndex}`}
          width={lineIndex === lines - 1 ? '50%' : '100%'}
          height="16px"
          animation={animation}
          darkMode={darkMode}
          style={{ marginBottom: '0.5rem' }}
        />
      ))}
    </div>
  );

  return (
    <div
      className={`skeleton-card-container ${className}`}
      role="status"
      aria-label="Loading cards"
    >
      {Array.from({ length: count }).map((_, index) => renderCard(index))}
    </div>
  );
}

// ============================================================================
// Skeleton List Component
// ============================================================================

/**
 * Skeleton loader for list views
 * 
 * @example
 * ```tsx
 * <SkeletonList items={5} showAvatar lines={2} />
 * ```
 */
export function SkeletonList({
  items = 5,
  showAvatar = true,
  lines = 2,
  animation = 'shimmer',
  className = '',
  darkMode = false,
}: SkeletonListProps) {
  const renderItem = (index: number) => (
    <div
      key={`item-${index}`}
      style={{
        display: 'flex',
        gap: '1rem',
        padding: '1rem',
        borderBottom: `1px solid ${darkMode ? '#3a3a3a' : '#e5e7eb'}`,
      }}
    >
      {showAvatar && (
        <Skeleton
          width="48px"
          height="48px"
          variant="circle"
          animation={animation}
          darkMode={darkMode}
        />
      )}

      <div style={{ flex: 1 }}>
        {Array.from({ length: lines }).map((_, lineIndex) => (
          <Skeleton
            key={`line-${lineIndex}`}
            width={lineIndex === 0 ? '60%' : '90%'}
            height={lineIndex === 0 ? '18px' : '14px'}
            animation={animation}
            darkMode={darkMode}
            style={{ marginBottom: '0.5rem' }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div
      className={`skeleton-list ${className}`}
      role="status"
      aria-label="Loading list items"
    >
      {Array.from({ length: items }).map((_, index) => renderItem(index))}
    </div>
  );
}

// ============================================================================
// Spinner Component
// ============================================================================

/**
 * Classic loading spinner
 * 
 * @example
 * ```tsx
 * <Spinner size="lg" color="#3b82f6" />
 * ```
 */
export function Spinner({
  size = 'md',
  color = '#3b82f6',
  className = '',
  label = 'Loading...',
}: SpinnerProps) {
  const getSizeValue = (): string => {
    switch (size) {
      case 'sm':
        return '20px';
      case 'md':
        return '40px';
      case 'lg':
        return '60px';
      case 'xl':
        return '80px';
      default:
        return '40px';
    }
  };

  const sizeValue = getSizeValue();
  const borderWidth = size === 'sm' ? '2px' : size === 'xl' ? '6px' : '4px';

  const spinnerStyles: CSSProperties = {
    width: sizeValue,
    height: sizeValue,
    border: `${borderWidth} solid rgba(0, 0, 0, 0.1)`,
    borderTopColor: color,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  return (
    <>
      <div
        className={`spinner ${className}`}
        style={spinnerStyles}
        role="status"
        aria-label={label}
      />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

// ============================================================================
// Progress Bar Component
// ============================================================================

/**
 * Progress bar with determinate and indeterminate modes
 * 
 * @example
 * ```tsx
 * <ProgressBar value={75} showPercentage />
 * <ProgressBar variant="indeterminate" />
 * ```
 */
export function ProgressBar({
  value = 0,
  variant = 'determinate',
  color = '#3b82f6',
  height = '8px',
  showPercentage = false,
  className = '',
  darkMode = false,
}: ProgressBarProps) {
  const containerStyles: CSSProperties = {
    width: '100%',
    height: typeof height === 'number' ? `${height}px` : height,
    backgroundColor: darkMode ? '#2a2a2a' : '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    position: 'relative',
  };

  const progressStyles: CSSProperties = {
    height: '100%',
    backgroundColor: color,
    borderRadius: '4px',
    transition: variant === 'determinate' ? 'width 0.3s ease' : 'none',
    ...(variant === 'determinate'
      ? { width: `${Math.min(Math.max(value, 0), 100)}%` }
      : {
          width: '30%',
          animation: 'progressIndeterminate 1.5s ease-in-out infinite',
        }),
  };

  const percentageStyles: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  return (
    <>
      <div className={`progress-bar-wrapper ${className}`}>
        <div
          className="progress-bar-container"
          style={containerStyles}
          role="progressbar"
          aria-valuenow={variant === 'determinate' ? value : undefined}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="progress-bar-fill" style={progressStyles} />
        </div>

        {showPercentage && variant === 'determinate' && (
          <div style={percentageStyles}>
            <span style={{ fontSize: '0.875rem', color: darkMode ? '#fff' : '#6b7280' }}>
              {Math.round(value)}%
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes progressIndeterminate {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }

        .progress-bar-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
        }
      `}</style>
    </>
  );
}

// ============================================================================
// Loading Overlay Component
// ============================================================================

/**
 * Full-screen loading overlay with backdrop
 * 
 * @example
 * ```tsx
 * <LoadingOverlay visible={isLoading} message="Saving..." />
 * ```
 */
export function LoadingOverlay({
  visible,
  message = 'Loading...',
  spinnerSize = 'lg',
  blur = true,
  className = '',
}: LoadingOverlayProps) {
  if (!visible) return null;

  const overlayStyles: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: blur ? 'blur(4px)' : 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    zIndex: 9999,
  };

  const contentStyles: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    padding: '2rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
  };

  const messageStyles: CSSProperties = {
    fontSize: '1rem',
    fontWeight: 500,
    color: '#374151',
  };

  return (
    <div
      className={`loading-overlay ${className}`}
      style={overlayStyles}
      role="dialog"
      aria-label={message}
      aria-live="polite"
    >
      <div style={contentStyles}>
        <Spinner size={spinnerSize} />
        {message && <p style={messageStyles}>{message}</p>}
      </div>
    </div>
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create inline skeleton for text content
 * 
 * @param count - Number of skeleton lines
 * @param animation - Animation style
 * @param darkMode - Enable dark mode
 * @returns Array of skeleton components
 * 
 * @example
 * ```tsx
 * {isLoading ? createTextSkeletons(3) : <p>{content}</p>}
 * ```
 */
export function createTextSkeletons(
  count: number = 3,
  animation: SkeletonAnimation = 'shimmer',
  darkMode: boolean = false
): JSX.Element[] {
  return Array.from({ length: count }).map((_, index) => (
    <Skeleton
      key={`text-skeleton-${index}`}
      width={index === count - 1 ? '70%' : '100%'}
      height="16px"
      variant="text"
      animation={animation}
      darkMode={darkMode}
      style={{ marginBottom: '0.5rem' }}
    />
  ));
}

/**
 * Create inline skeleton for property value pairs
 * 
 * @param count - Number of property pairs
 * @param animation - Animation style
 * @param darkMode - Enable dark mode
 * @returns Array of skeleton components
 * 
 * @example
 * ```tsx
 * {isLoading ? createPropertySkeletons(5) : propertyDetails}
 * ```
 */
export function createPropertySkeletons(
  count: number = 5,
  animation: SkeletonAnimation = 'shimmer',
  darkMode: boolean = false
): JSX.Element[] {
  return Array.from({ length: count }).map((_, index) => (
    <div
      key={`property-skeleton-${index}`}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem',
      }}
    >
      <Skeleton width="40%" height="18px" animation={animation} darkMode={darkMode} />
      <Skeleton width="50%" height="18px" animation={animation} darkMode={darkMode} />
    </div>
  ));
}

/**
 * Create skeleton for grid layouts
 * 
 * @param columns - Number of columns
 * @param rows - Number of rows
 * @param animation - Animation style
 * @param darkMode - Enable dark mode
 * @returns Skeleton grid component
 * 
 * @example
 * ```tsx
 * {isLoading ? createGridSkeleton(3, 2) : <PropertyGrid />}
 * ```
 */
export function createGridSkeleton(
  columns: number = 3,
  rows: number = 2,
  animation: SkeletonAnimation = 'shimmer',
  darkMode: boolean = false
): JSX.Element {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '1rem',
      }}
    >
      {Array.from({ length: columns * rows }).map((_, index) => (
        <Skeleton
          key={`grid-skeleton-${index}`}
          width="100%"
          height="200px"
          variant="rounded"
          animation={animation}
          darkMode={darkMode}
        />
      ))}
    </div>
  );
}
