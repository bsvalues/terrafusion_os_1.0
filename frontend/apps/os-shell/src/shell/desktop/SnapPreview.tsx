/**
 * TerraFusion OS Snap Preview Component
 *
 * Visual preview overlay that shows where a window will snap
 * when released near a screen edge.
 *
 * @module shell/desktop/SnapPreview
 * @see SUCCESS CRITERIA Phase 4
 */

import { cn } from '@/lib/utils';
import React from 'react';
import { getSnapDimensions, type SnapZone } from './snapUtils';

// Re-export SnapZone for test imports
export type { SnapZone } from './snapUtils';

// ============================================================================
// Types
// ============================================================================

export interface SnapPreviewProps {
  /** The snap zone to preview, or null to hide */
  zone: SnapZone | null;
  /** Screen width for dimension calculations */
  screenWidth: number;
  /** Screen height (minus taskbar) for dimension calculations */
  screenHeight: number;
  /** Optional className for additional styling */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * SnapPreview - Visual indicator for window snap zones
 *
 * Shows a translucent overlay preview of where the window will
 * snap when the user releases the drag.
 *
 * Features:
 * - Animates in/out smoothly
 * - TerraFusion brand styling (cyan border)
 * - Positioned based on snap zone
 * - Decorative only (aria-hidden)
 */
export const SnapPreview: React.FC<SnapPreviewProps> = ({
  zone,
  screenWidth,
  screenHeight,
  className,
}) => {
  // Don't render if no zone
  if (zone === null) {
    return null;
  }

  // Calculate dimensions based on zone
  const dimensions = getSnapDimensions(zone, screenWidth, screenHeight);

  return (
    <div
      data-testid='snap-preview'
      aria-hidden='true'
      className={cn(
        // Base styles
        'fixed pointer-events-none',
        'z-[999]', // Above windows, below taskbar

        // TerraFusion brand styling
        'border-2 border-[var(--tf-transcend-highlight)]/60',
        'bg-[var(--tf-transcend-highlight)]/10',
        'backdrop-blur-sm',
        'rounded-lg',

        // Shadow for depth
        'shadow-[0_0_20px_rgba(0,255,238,0.3)]',

        // Animation
        'transition-all duration-200 ease-out',
        'animate-in fade-in zoom-in-95',

        className
      )}
      style={{
        left: `${dimensions.x}px`,
        top: `${dimensions.y}px`,
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
      }}
    >
      {/* Inner glow effect */}
      <div
        className={cn(
          'absolute inset-0',
          'rounded-lg',
          'bg-gradient-to-br from-[var(--tf-transcend-highlight)]/5 to-transparent'
        )}
      />

      {/* Corner accents */}
      <div className='absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[var(--tf-transcend-highlight)]/40 rounded-tl' />
      <div className='absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[var(--tf-transcend-highlight)]/40 rounded-tr' />
      <div className='absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[var(--tf-transcend-highlight)]/40 rounded-bl' />
      <div className='absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[var(--tf-transcend-highlight)]/40 rounded-br' />
    </div>
  );
};

export default SnapPreview;
