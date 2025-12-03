/**
 * OSGlassPanel – Universal Glass Container
 *
 * Foundation UI primitive for TerraFusion OS.
 * Provides the macOS Tahoe-inspired translucent glass aesthetic.
 *
 * Features:
 * - Translucent background with blur
 * - Rounded corners (12px)
 * - Soft depth (box-shadow)
 * - Motion-in appearance via Framer Motion
 *
 * Usage:
 * - Wrap any card-level content in OSGlassPanel
 * - Use inside workspaces, OS objects, and dashboards
 * - NOT an OS object itself (low-level UI primitive)
 *
 * @see docs/WORKSPACE_EXPERIENCE_V1.md Section 2.4
 */
import { motion } from 'framer-motion';
import React from 'react';

export interface OSGlassPanelProps {
  /** Content to render inside the glass panel */
  children: React.ReactNode;
  /** Inner padding in pixels (default: 12) */
  padding?: number;
  /** Whether the panel should stretch to 100% height */
  fullHeight?: boolean;
  /** Additional inline styles to merge */
  style?: React.CSSProperties;
  /** Test ID for testing-library queries */
  testId?: string;
}

/**
 * Universal glass container following Workspace Experience v1 spec.
 *
 * @example
 * <OSGlassPanel testId="my-card">
 *   <h3>Card Title</h3>
 *   <p>Card content...</p>
 * </OSGlassPanel>
 */
export const OSGlassPanel: React.FC<OSGlassPanelProps> = ({
  children,
  padding = 12,
  fullHeight = false,
  style = {},
  testId,
}) => {
  return (
    <motion.div
      data-testid={testId ?? 'os-glass-panel'}
      initial={{ opacity: 0, scale: 0.98, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.22,
        ease: [0.25, 0.1, 0.25, 1], // --os-ease from WX spec
      }}
      style={{
        // Tahoe glass background
        background: 'rgba(20, 20, 20, 0.35)',
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',

        // Rounded corners
        borderRadius: 12,

        // Subtle border for edge definition
        border: '1px solid rgba(255, 255, 255, 0.07)',

        // Soft depth shadow + inner highlight
        boxShadow:
          '0px 4px 18px rgba(0, 0, 0, 0.35), inset 0px 0px 0px 1px rgba(255, 255, 255, 0.05)',

        // Spacing
        padding,

        // Height control
        height: fullHeight ? '100%' : undefined,

        // User overrides
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
};
