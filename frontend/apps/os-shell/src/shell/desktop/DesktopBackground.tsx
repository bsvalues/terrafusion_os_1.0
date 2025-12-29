/**
 * TerraFusion OS Desktop Background Component
 *
 * Renders the animated gradient mesh background for the desktop.
 * Uses TerraFusion design tokens for the quantum aesthetic.
 *
 * @module shell/desktop/DesktopBackground
 * @see SUCCESS CRITERIA SC-5.1
 */

// ============================================================================
// Types
// ============================================================================

export interface DesktopBackgroundProps {
  /** Optional className for additional styling */
  className?: string;
}

// ============================================================================
// DesktopBackground Component
// ============================================================================

/**
 * DesktopBackground - Animated gradient mesh background.
 *
 * Features:
 * - Deep space gradient (midnight to void)
 * - Subtle animated mesh/grid overlay
 * - Terra-cyan accent glows
 * - Performance-optimized (CSS animations only)
 *
 * @example
 * ```tsx
 * <Desktop>
 *   <DesktopBackground />
 *   ...
 * </Desktop>
 * ```
 */
export function DesktopBackground({ className = '' }: DesktopBackgroundProps) {
  return (
    <div
      data-testid="desktop-background"
      className={`
        absolute inset-0 w-full h-full
        bg-gradient-to-br from-[#0a0e1a] via-[#0d1117] to-[#161b22]
        ${className}
      `.trim()}
      aria-hidden="true"
    >
      {/* Gradient mesh overlay */}
      <div
        className="
          absolute inset-0
          bg-[radial-gradient(ellipse_at_top_left,rgba(0,255,238,0.03)_0%,transparent_50%)]
        "
      />
      <div
        className="
          absolute inset-0
          bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,128,255,0.03)_0%,transparent_50%)]
        "
      />

      {/* Subtle grid pattern */}
      <div
        className="
          absolute inset-0 opacity-[0.02]
          bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)]
          bg-[size:50px_50px]
        "
      />

      {/* Corner glow accents */}
      <div
        className="
          absolute top-0 left-0 w-96 h-96
          bg-[radial-gradient(circle,rgba(0,255,238,0.05)_0%,transparent_70%)]
          pointer-events-none
        "
      />
      <div
        className="
          absolute bottom-0 right-0 w-96 h-96
          bg-[radial-gradient(circle,rgba(0,128,255,0.05)_0%,transparent_70%)]
          pointer-events-none
        "
      />
    </div>
  );
}

export default DesktopBackground;
