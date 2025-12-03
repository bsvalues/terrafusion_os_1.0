/**
 * OSGlassPanelRightRail – Right-Rail Glass Container
 *
 * Specialized variant of OSGlassPanel for right-rail panels.
 * Provides slide-in-from-right animation and proper edge styling.
 *
 * Features:
 * - Slide-in from right (x: 40 → 0)
 * - Left border for visual separation
 * - Full height by default
 * - Flex column layout for content stacking
 *
 * Usage:
 * - Activity detail panels
 * - Health timelines
 * - System reference views
 * - AI-suggested action panels
 * - Workspace-specific detail panes
 *
 * @see docs/WORKSPACE_EXPERIENCE_V1.md Section 9.3
 */
import { motion } from 'framer-motion';
import React from 'react';

export interface OSGlassPanelRightRailProps {
  /** Content to render inside the right-rail panel */
  children: React.ReactNode;
  /** Panel width in pixels (default: 360) */
  width?: number;
  /** Inner padding in pixels (default: 16) */
  padding?: number;
  /** Test ID for testing-library queries */
  testId?: string;
}

/**
 * Right-rail glass panel following Workspace Experience v1 spec.
 *
 * Automatically provides:
 * - Slide-in animation from right
 * - Slide-out animation on exit (use with AnimatePresence)
 * - Tahoe glass styling
 * - Left border separator
 *
 * @example
 * <AnimatePresence>
 *   {showPanel && (
 *     <OSGlassPanelRightRail testId="activity-detail">
 *       <h2>Activity Detail</h2>
 *       <p>Details here...</p>
 *     </OSGlassPanelRightRail>
 *   )}
 * </AnimatePresence>
 */
export const OSGlassPanelRightRail: React.FC<OSGlassPanelRightRailProps> = ({
  children,
  width = 360,
  padding = 16,
  testId,
}) => {
  return (
    <motion.div
      data-testid={testId ?? 'os-glass-panel-right-rail'}
      // Slide-in from right
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{
        duration: 0.23,
        ease: [0.25, 0.1, 0.25, 1], // --os-ease from WX spec
      }}
      style={{
        // Fixed width, no shrink
        width,
        height: '100%',
        flexShrink: 0,

        // Tahoe glass background
        background: 'rgba(20, 20, 20, 0.35)',
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',

        // Left border for separation from main content
        borderLeft: '1px solid rgba(255, 255, 255, 0.08)',

        // Spacing
        padding,

        // Shadow to left (depth separation)
        boxShadow:
          '-4px 0px 18px rgba(0, 0, 0, 0.3), inset 0px 0px 0px 1px rgba(255, 255, 255, 0.05)',

        // Column layout for content stacking
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </motion.div>
  );
};
