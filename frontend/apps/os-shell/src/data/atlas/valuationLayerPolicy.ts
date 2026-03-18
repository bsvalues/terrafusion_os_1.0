/**
 * Valuation Layer Policy (TFT-204)
 * ===================================================================
 * Defines which map layers are visible in which UI context (workbench
 * vs. suite view), along with default opacity and zoom constraints.
 *
 * This is MAP DISPLAY policy — it controls rendering behavior, not
 * valuation logic.
 *
 * @see services/suites/atlasService.ts — Atlas suite entry point
 * @see types/atlas/animatedMapTypes.ts — MapLayer type definitions
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Visibility and rendering policy for a single map layer */
export interface LayerPolicy {
  /** Layer name (matches MapLayer.name in the Atlas service) */
  layerName: string;
  /** Whether this layer appears in the Workbench parcel-detail view */
  visibleInWorkbench: boolean;
  /** Whether this layer appears in the Atlas suite-level map */
  visibleInSuite: boolean;
  /** Default opacity when first rendered (0-1) */
  defaultOpacity: number;
  /** Minimum zoom level at which the layer becomes visible */
  minZoom: number;
  /** Maximum zoom level at which the layer remains visible */
  maxZoom: number;
}

// ============================================================================
// DEFAULT LAYER POLICIES
// ============================================================================

/**
 * Default layer policies for the Atlas map.
 *
 * Layers listed here are the baseline set available to every county.
 * County-specific overlays can extend this list at runtime.
 */
export const DEFAULT_LAYERS: readonly LayerPolicy[] = [
  {
    layerName: 'parcels',
    visibleInWorkbench: true,
    visibleInSuite: true,
    defaultOpacity: 0.85,
    minZoom: 14,
    maxZoom: 22,
  },
  {
    layerName: 'zoning',
    visibleInWorkbench: true,
    visibleInSuite: true,
    defaultOpacity: 0.5,
    minZoom: 12,
    maxZoom: 22,
  },
  {
    layerName: 'flood',
    visibleInWorkbench: true,
    visibleInSuite: true,
    defaultOpacity: 0.4,
    minZoom: 10,
    maxZoom: 22,
  },
  {
    layerName: 'neighborhoods',
    visibleInWorkbench: false,
    visibleInSuite: true,
    defaultOpacity: 0.35,
    minZoom: 10,
    maxZoom: 18,
  },
  {
    layerName: 'schools',
    visibleInWorkbench: false,
    visibleInSuite: true,
    defaultOpacity: 0.7,
    minZoom: 10,
    maxZoom: 20,
  },
  {
    layerName: 'roads',
    visibleInWorkbench: true,
    visibleInSuite: true,
    defaultOpacity: 0.6,
    minZoom: 8,
    maxZoom: 22,
  },
] as const;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Look up the policy for a layer by name.
 * Returns undefined if the layer has no configured policy (treat as hidden).
 */
export function getLayerPolicy(layerName: string): LayerPolicy | undefined {
  return DEFAULT_LAYERS.find((p) => p.layerName === layerName);
}

/**
 * Get all layers visible in the Workbench context.
 */
export function getWorkbenchLayers(): LayerPolicy[] {
  return DEFAULT_LAYERS.filter((p) => p.visibleInWorkbench);
}

/**
 * Get all layers visible in the Atlas suite context.
 */
export function getSuiteLayers(): LayerPolicy[] {
  return DEFAULT_LAYERS.filter((p) => p.visibleInSuite);
}

/**
 * Merge runtime overrides into the default layer policies.
 * Overrides matched by layerName; unmatched overrides are appended.
 */
export function mergeLayerPolicies(
  overrides: Partial<LayerPolicy>[],
): LayerPolicy[] {
  const merged = [...DEFAULT_LAYERS] as LayerPolicy[];

  for (const override of overrides) {
    if (!override.layerName) continue;
    const idx = merged.findIndex((p) => p.layerName === override.layerName);
    if (idx >= 0) {
      merged[idx] = { ...merged[idx], ...override };
    } else {
      merged.push({
        layerName: override.layerName,
        visibleInWorkbench: override.visibleInWorkbench ?? false,
        visibleInSuite: override.visibleInSuite ?? true,
        defaultOpacity: override.defaultOpacity ?? 0.5,
        minZoom: override.minZoom ?? 0,
        maxZoom: override.maxZoom ?? 22,
      });
    }
  }

  return merged;
}
