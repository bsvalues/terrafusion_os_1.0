/**
 * TerraFusion OS Desktop Background Component
 *
 * Premium visual layer using CSSAmbientLayer for reliable,
 * hardware-accelerated mesh gradients. "Toyota Engine, Ferrari Body."
 *
 * @module shell/desktop/DesktopBackground
 */

import { CSSAmbientLayer } from '../../components/compositor/layers/CSSAmbientLayer';

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
 * DesktopBackground - Pure CSS mesh gradient background.
 *
 * Features:
 * - Deep blue/slate mesh gradient (not black void)
 * - Subtle animated orbs for depth
 * - Hardware accelerated (CSS blur, no canvas/webgl)
 * - Zero lag, instant load
 */
export function DesktopBackground({ className = '' }: DesktopBackgroundProps) {
  return (
    <div
      data-testid='desktop-background'
      className={`absolute inset-0 w-full h-full ${className}`.trim()}
      aria-hidden='true'
    >
      {/* THE CSSAmbientLayer - Pure CSS, no complexity */}
      <CSSAmbientLayer visible={true} />
    </div>
  );
}

export default DesktopBackground;
