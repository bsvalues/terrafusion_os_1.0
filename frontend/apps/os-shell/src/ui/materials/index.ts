/**
 * @fileoverview Materials Module Index
 *
 * Exports all material primitives for the Visual Renaissance design system.
 *
 * Usage:
 * ```tsx
 * import { LiquidPanel, TactileButton, useMaterialQuality } from '@/ui/materials';
 * ```
 */

// Quality Gate
export {
    MaterialQuality, checkContrastRatio,
    getGlassTextColor, getMaterialQuality,
    initMaterialQualityGate, meetsContrastRequirement, useMaterialQuality, type MaterialQualityState
} from './materialQualityGate';

// Components
export { LiquidPanel, type LiquidPanelProps, type LiquidPanelVariant } from './LiquidPanel';
export {
    TactileButton,
    type TactileButtonProps, type TactileButtonSize, type TactileButtonVariant
} from './TactileButton';

